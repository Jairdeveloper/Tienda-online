---
id: 046
area: architecture
type: EXEC
module: monorepo
version: 1.0
status: ACTIVE
tags:
  - monorepo
  - database
  - migrations
  - seed
  - production
  - neon
  - deploy
summary: "Ejecucion de Fase 3: Base de datos — preparacion completa para deploy en produccion con Neon. Migraciones validadas, pipeline CI/CD configurado, variables de entorno documentadas."
keywords:
  - database
  - prisma
  - migrations
  - seed
  - neon
  - postgresql
  - vercel
  - deploy
  - production
changelog:
  - version: 1.0
    date: 2026-06-03
    author: system
    description: Version inicial — verificacion de migraciones y configuracion Neon
  - version: 1.1
    date: 2026-06-03
    author: system
    description: Preparacion para deploy — pipeline CI/CD, variables entorno produccion, guia Neon paso a paso
---

# Ejecucion Fase 3: Base de Datos — @tienda/api

## Resumen

Se ejecuto y preparo para deploy la Fase 3 del plan de migracion monorepo (`043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md`),
que comprende la verificacion de migraciones, seed de datos y configuracion
completa de base de datos en produccion con Neon.

---

## 3.1 Migraciones — verificadas y listas para deploy

### Estado

| Migracion | Archivo | Lineas | Valida |
|-----------|---------|--------|--------|
| `20260526000100_baseline` | `migration.sql` | 6 | ✅ Crea extension pgcrypto + tabla health_probes |
| `20260527113724_create_business_entities` | `migration.sql` | 398 | ✅ Crea 22 tablas + indices + foreign keys |
| `20260529193900_remove_telegram_fields` | `migration.sql` | 6 | ✅ Elimina columna telegram_id + indices |

**Lock file**: `migration_lock.toml` → provider: `postgresql` ✓

### Para aplicar en produccion

```bash
cd apps/api && DATABASE_URL="<neon-direct-url>" npx prisma migrate deploy
```

Las migraciones son **idempotentes** y se ejecutan en orden cronologico por timestamp.

---

## 3.2 Seed de datos — listo

El archivo `apps/api/prisma/seed.ts` (235 lines) crea datos demo idempotentes:

| Entidad | Cantidad |
|---------|----------|
| Roles | customer, admin, operator |
| Permisos | 10 (products, orders, users, inventory, payments × read/write) |
| Categorias | Electronica, Ropa y Accesorios, Hogar, Deportes |
| Productos | 5 con 11 variantes + inventario inicial |
| Admin user | admin@tienda.local / Admin123! |

```bash
cd apps/api && npm run db:seed
```

> ⚠️ **No ejecutar seed en produccion** — contiene datos demo. Solo para staging/desarrollo.

---

## 3.3 Base de datos en produccion — Neon

### Stack

| Componente | Proveedor | Funcion |
|------------|-----------|---------|
| Base de datos | Neon (Postgres serverless) | Datos persistentes |
| Conexion runtime | Prisma + Neon pooled (puerto 5433) | Queries de la aplicacion |
| Migraciones | Prisma Migrate + Neon direct (puerto 5432) | Schema migrations via CI |

### Paso a paso: crear Neon

1. Ir a [console.neon.tech](https://console.neon.tech) y crear cuenta
2. Crear proyecto → region cercana a Vercel deployment (us-east-2 recomendado)
3. En el dashboard de Neon, obtener las dos connection strings:

   ```
   Pooled (DATABASE_URL):     postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/tienda_online?sslmode=require
   Direct (DATABASE_URL_DIRECT): postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/tienda_online?sslmode=require
   ```

   > La diferencia es el puerto: pooled = 5433, direct = 5432. Neon los muestra separados en el dashboard.

### Configurar variables en Vercel

Ir a Project → Settings → Environment Variables y agregar:

| Variable | Valor | Ambito |
|----------|-------|--------|
| `DATABASE_URL` | Neon pooled URL (puerto 5433) | Produccion |
| `DATABASE_URL_DIRECT` | Neon direct URL (puerto 5432) | Produccion |
| `JWT_SECRET` | String aleatorio (min 8 chars) | Produccion |
| `REDIS_URL` | Upstash REST URL | Produccion |
| `UPSTASH_REDIS_TOKEN` | Upstash token | Produccion |
| `CORS_ORIGIN` | `https://<frontend-domain>` | Produccion |
| `SWAGGER_ENABLED` | `false` | Produccion |
| `NODE_ENV` | `production` | Produccion |

### Configurar variables en GitHub Actions

Ir a Settings → Secrets and variables → Actions → New repository secret:

| Secret | Valor |
|--------|-------|
| `DATABASE_URL_DIRECT` | Neon direct URL (para `prisma migrate deploy` en CI) |

---

## 3.4 Pipeline de deploy — `.github/workflows/deploy.yml`

El pipeline tiene dos jobs:

### Job 1: `test` (ejecuta en PRs y pushes a main)

Usa PostgreSQL + Redis como service containers para tests. Corre migraciones y tests contra la base de datos local de CI.

### Job 2: `verify-deploy` (ejecuta tras merge a main)

```yaml
- uses: actions/checkout@v4
- uses: actions/setup-node@v4
- name: Install dependencies
  run: cd apps/api && npm ci
- name: Generate Prisma Client
  run: cd apps/api && npx prisma generate
- name: Apply migrations to production database
  run: cd apps/api && npx prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL_DIRECT }}
- name: Wait for Vercel deployment
  ...
- name: Health check
  ...
```

El orden es:
1. Instalar deps
2. Generar Prisma Client
3. **Migrar base de datos** (antes del deploy de Vercel — asi el schema esta listo cuando el nuevo codigo se active)
4. Esperar a que Vercel deploye el nuevo codigo
5. Health check para verificar que el API responde

---

## 3.5 Schema — `apps/api/prisma/schema.prisma`

```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "rhel-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

- `binaryTargets` actualizado a `rhel-openssl-3.0.x` para compatibilidad con el runtime serverless de Vercel
- `DATABASE_URL` se lee de variable de entorno (pooled en produccion, directa en CI)

---

## 3.6 Vercel build — `vercel.json` (root)

```json
{
  "installCommand": "cd apps/api && npm ci --include=dev && cd ../../apps/web && npm ci --include=dev",
  "buildCommand": "cd apps/api && npx prisma generate && cd ../.. && npm run build",
  ...
}
```

- `prisma generate` se ejecuta durante el build de Vercel para generar el Prisma Client en el entorno serverless
- Las migraciones **no** se ejecutan en el build de Vercel — se ejecutan en GitHub Actions antes del deploy
- La aplicacion runtime usa `DATABASE_URL` (pooled) para conexiones eficientes

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `.github/workflows/deploy.yml` | Agregado `prisma generate` + `prisma migrate deploy` con `DATABASE_URL_DIRECT` en verify-deploy |
| `.env.example` | Agregada seccion de produccion con Neon + Upstash + variables Vercel |
| `apps/api/prisma/schema.prisma` | `binaryTargets` actualizado para Vercel (rhel-openssl-3.0.x) |
| `docs/REGISTRO_IDS.md` | ID 046 registrado |
| `docs/monorepo/046_EXEC_MONOREPO_DB_1_0_DRAFT.md` | Este reporte actualizado |

---

## Checklist de deploy

- [ ] Crear base de datos en Neon
- [ ] Configurar `DATABASE_URL` y `DATABASE_URL_DIRECT` en Vercel
- [ ] Configurar `DATABASE_URL_DIRECT` en GitHub Actions secrets
- [ ] Configurar resto de env vars en Vercel (JWT_SECRET, REDIS_URL, etc.)
- [ ] Hacer push a `main` → CI corre tests + migraciones → Vercel deployea
- [ ] Verificar `GET /api/v1/health` responde 200
- [ ] Deshabilitar Swagger (`SWAGGER_ENABLED=false`)

---

## Riesgos

1. **SSL requerido**: Neon solo acepta conexiones SSL (`sslmode=require` en URL)
2. **Pooler vs directo**: Migraciones requieren conexion directa (puerto 5432); runtime usa pooled (puerto 5433)
3. **Seed en produccion**: NO ejecutar — el seed contiene datos demo no aptos para produccion
4. **Timeout primera migracion**: `prisma migrate deploy` en Neon nuevo puede tomar 30-60s (crea 22 tablas)
5. **pgvector**: Si se necesita en el futuro, Neon lo soporta; habilitar via dashboard

---

## Referencias

- `043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md` — Plan de migracion monorepo
- `apps/api/prisma/schema.prisma` — Schema Prisma (22 modelos)
- `apps/api/prisma/seed.ts` — Seed de datos
- `.env.example` — Variables de entorno
- [Neon Docs](https://neon.tech/docs)
- [Neon + Prisma Guide](https://neon.tech/docs/guides/prisma)
