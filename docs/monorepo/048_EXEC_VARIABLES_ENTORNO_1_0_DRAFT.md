---
id: 048
area: architecture
type: EXEC
module: monorepo
version: 1.0
status: DRAFT
tags:
  - monorepo
  - env-vars
  - configuration
  - vercel
  - deploy
  - neon
  - upstash
summary: "Documentacion de la Fase 5 (Variables de Entorno) del plan de migracion monorepo. Incluye el listado completo de variables requeridas por el schema Joi, instrucciones para configurar en Vercel y advertencias de seguridad."
keywords:
  - monorepo
  - env-vars
  - variables-entorno
  - vercel
  - neon
  - upstash
  - joi-validation
  - produccion
changelog:
  - version: 1.0
    date: 2026-06-03
    author: vercel-deploy-agent
    description: Creacion del reporte de Fase 5 — Variables de Entorno
---

# Fase 5: Variables de Entorno — @tienda/api

## 1. Resumen

Se completo la sincronizacion entre el schema de validacion Joi (`apps/api/src/config/env.validation.ts`) y el archivo `.env.example` raiz. Se documentaron todas las variables de entorno que la aplicacion NestJS necesita, categorizadas por ambito (requeridas, produccion, opcionales) con instrucciones para configurar en Vercel.

### Alcance

| Componente | Archivo | Estado |
|-----------|---------|--------|
| Schema Joi | `apps/api/src/config/env.validation.ts` | Sin cambios (ya completo) |
| `.env.example` | `.env.example` (raiz) | Actualizado |
| Documentacion | `docs/monorepo/048_EXEC_VARIABLES_ENTORNO_1_0_DRAFT.md` | Creado |

---

## 2. Variables de Entorno

### 2.1 Requeridas siempre

La aplicacion **falla al arrancar** sin estas variables:

| Variable | Tipo | Minimo | Schema Joi |
|----------|------|--------|------------|
| `JWT_SECRET` | string | 8 caracteres | `Joi.string().min(8).required()` |
| `DATABASE_URL` | URI | — | `Joi.string().uri({ scheme: ["postgresql", "postgres"] }).required()` |

**Nota**: `DATABASE_URL` acepta esquemas `postgresql://` y `postgres://`.

### 2.2 Requeridas en produccion (`NODE_ENV=production`)

Estas variables son opcionales en desarrollo pero **obligatorias** cuando `NODE_ENV=production`:

| Variable | Tipo | Minimo | Schema Joi |
|----------|------|--------|------------|
| `UPSTASH_REDIS_TOKEN` | string | 1 caracter | `Joi.string().min(1).required()` cuando `NODE_ENV=production` |
| `WEBHOOK_SECRET` | string | 16 caracteres | `Joi.string().min(16).required()` cuando `NODE_ENV=production` |

**Comportamiento en desarrollo**:
- `UPSTASH_REDIS_TOKEN` por defecto es `""` (vacio, no se usa)
- `WEBHOOK_SECRET` por defecto es `"dev-webhook-secret-change-in-production"`

### 2.3 Opcionales con valores por defecto

| Variable | Default | Descripcion |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Entorno (`development`, `test`, `production`) |
| `PORT` | `3000` | Puerto del servidor HTTP |
| `API_PREFIX` | `api/v1` | Prefijo de rutas de la API |
| `CORS_ENABLED` | `true` | Habilitar CORS (`true`/`false`/`1`/`0`) |
| `CORS_ORIGIN` | `""` (todos) | Origenes CORS permitidos (separados por coma). Vacio = todos. |
| `LOG_LEVEL` | `log` | Nivel de log (`error`, `warn`, `log`, `debug`, `verbose`) |
| `SWAGGER_ENABLED` | `true` | Habilitar Swagger UI (`true`/`false`/`1`/`0`) |
| `SWAGGER_PATH` | `docs` | Ruta de Swagger UI (bajo `API_PREFIX`) |
| `REDIS_URL` | `""` (vacio) | URI de Redis (`redis://`, `rediss://`, `https://`). Vacio = sin Redis. |
| `JWT_ACCESS_TTL` | `900` | TTL del token de acceso JWT (segundos) |
| `JWT_REFRESH_TTL` | `604800` | TTL del token de refresco JWT (segundos) |

### 2.4 Infraestructura local (Docker Compose)

Estas variables NO las lee la aplicacion NestJS directamente. Son utilizadas por `docker-compose.yml` para configurar los contenedores de PostgreSQL y Redis:

| Variable | Default en docker-compose |
|----------|--------------------------|
| `POSTGRES_DB` | `tienda_online` |
| `POSTGRES_USER` | `tienda` |
| `POSTGRES_PASSWORD` | `tienda_dev` |
| `POSTGRES_PORT` | `5432` |
| `REDIS_PORT` | `6380` |

**Nota**: Estas variables estan documentadas en `.env.example` bajo la seccion "Docker Compose Infrastructure" pero no forman parte del schema de validacion Joi.

### 2.5 CI/CD

| Variable | Donde se usa | Proposito |
|----------|-------------|-----------|
| `DATABASE_URL_DIRECT` | GitHub Actions (`ci.yml`) | Conexion directa (no pool) para `prisma migrate deploy`. Puerto 5432. |

---

## 3. Mapa de cobertura Joi ↔ .env.example

| Variable | En Joi | En `.env.example` | Estado |
|----------|--------|-------------------|--------|
| `NODE_ENV` | Si (default) | Si (activo) | ✅ |
| `PORT` | Si (default) | Si (activo) | ✅ |
| `API_PREFIX` | Si (default) | Si (activo) | ✅ |
| `CORS_ENABLED` | Si (default) | Si (activo) | ✅ |
| `CORS_ORIGIN` | Si (default) | Si (activo) | ✅ |
| `LOG_LEVEL` | Si (default) | Si (activo) | ✅ |
| `SWAGGER_ENABLED` | Si (default) | Si (activo) | ✅ |
| `SWAGGER_PATH` | Si (default) | Si (activo) | ✅ |
| `JWT_SECRET` | Si (requerida) | Si (activo) | ✅ |
| `JWT_ACCESS_TTL` | Si (default) | Si (activo) | ✅ |
| `JWT_REFRESH_TTL` | Si (default) | Si (activo) | ✅ |
| `DATABASE_URL` | Si (requerida) | Si (activo) | ✅ |
| `REDIS_URL` | Si (default) | Si (activo) | ✅ |
| `WEBHOOK_SECRET` | Si (default/req) | Si (activo, **NUEVA**) | ✅ |
| `UPSTASH_REDIS_TOKEN` | Si (prod req) | Si (comentado, **NUEVA**) | ✅ |
| `DATABASE_URL_DIRECT` | No (CI only) | Si (comentado, **NUEVA**) | ✅ |
| `SWAGGER_TITLE` | Si (default) | No (demasiado especifico) | ⚠️ Ver nota |
| `SWAGGER_DESCRIPTION` | Si (default) | No (demasiado especifico) | ⚠️ Ver nota |
| `SWAGGER_VERSION` | Si (default) | No (demasiado especifico) | ⚠️ Ver nota |

**Nota sobre SWAGGER_* extras**: `SWAGGER_TITLE`, `SWAGGER_DESCRIPTION` y `SWAGGER_VERSION` existen en el schema Joi con valores por defecto sensibles. No se incluyeron en `.env.example` porque rara vez necesitan sobreescribirse y el schema Joi proporciona defaults adecuados. Si un desarrollador necesita cambiarlos, puede anadirlos a su `.env` local.

---

## 4. Configuracion en Vercel

### 4.1 Variables por ambiente

Vercel permite definir variables de entorno con diferentes ambitos:

| Ambito | Cuando se usa |
|--------|--------------|
| **Production** | Deploy a `main` / `--prod` |
| **Preview** | Deploy de PR / branches |
| **Development** | `vercel dev` local |

**Recomendacion**: Usar el mismo conjunto de variables para Production y Preview, con la excepcion de `CORS_ORIGIN` que puede variar.

### 4.2 Pasos para configurar

1. Ir a [Vercel Dashboard](https://vercel.com) → Proyecto `tienda-online` → Settings → Environment Variables
2. Anadir las siguientes variables para **Production**:

   | Variable | Valor |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `PORT` | `3000` |
   | `API_PREFIX` | `api/v1` |
   | `CORS_ENABLED` | `true` |
   | `CORS_ORIGIN` | `https://<tu-dominio-frontend>` |
   | `LOG_LEVEL` | `error` |
   | `SWAGGER_ENABLED` | `false` |
   | `JWT_SECRET` | `<cadena-aleatoria-min-8-caracteres>` |
   | `JWT_ACCESS_TTL` | `900` |
   | `JWT_REFRESH_TTL` | `604800` |
   | `DATABASE_URL` | `<Neon pooled URL, puerto 5433>` |
   | `REDIS_URL` | `<Upstash REST URL>` |
   | `UPSTASH_REDIS_TOKEN` | `<token-de-upstash>` |
   | `WEBHOOK_SECRET` | `<cadena-aleatoria-min-16-caracteres>` |

3. Para **Preview** (deploy de PRs), se recomienda el mismo conjunto, apuntando a bases de datos de staging si es posible.

4. `DATABASE_URL_DIRECT` se usa solo en CI. Configurarla como GitHub Secret o Vercel Environment Variable segun corresponda.

### 4.3 Automatizacion con Vercel CLI

```bash
# Ver variables actuales (requiere Vercel CLI y sesion iniciada)
vercel env ls

# Anadir variable manualmente
echo "JWT_SECRET=..." | vercel env add JWT_SECRET production

# Anadir variable desde archivo
vercel env add DATABASE_URL production < secret.txt
```

---

## 5. Advertencias de Seguridad

### 5.1 NO incluir valores reales en `.env.example`

- `.env.example` debe contener **solamente valores por defecto seguros** y placeholders
- Los valores reales de produccion (JWT_SECRET, DATABASE_URL, UPSTASH_REDIS_TOKEN, WEBHOOK_SECRET) deben configurarse directamente en Vercel o en un gestor de secretos
- **Nunca** committear `.env` (ya esta en `.gitignore`)

### 5.2 Rotacion de secretos

| Secreto | Frecuencia recomendada |
|---------|----------------------|
| `JWT_SECRET` | Cada 90 dias o ante sospecha de compromiso |
| `WEBHOOK_SECRET` | Cada 180 dias o al cambiar de procesador de pagos |
| `UPSTASH_REDIS_TOKEN` | Inmediato si hay sospecha de fuga |
| `DATABASE_URL` | Al rotar credenciales de Neon |

### 5.3 Principio de minimo privilegio

- `DATABASE_URL` (pooled, puerto 5433): solo lectura/escritura en el schema `public`
- `DATABASE_URL_DIRECT` (directa, puerto 5432): capacidad de ejecutar migraciones (DDL). **No usar en runtime**, solo en CI.
- `UPSTASH_REDIS_TOKEN`: acceso completo a Redis. Rotar inmediatamente si se expone.

### 5.4 CORS en produccion

- `CORS_ORIGIN` debe listar **solamente** los dominios de frontend autorizados
- Para produccion: `CORS_ORIGIN=https://tudominio.com`
- Si hay multiples origenes: `CORS_ORIGIN=https://tudominio.com,https://admin.tudominio.com`
- **No usar** `CORS_ORIGIN=` (vacio = todos los origenes) en produccion

### 5.5 Swagger en produccion

- Mantener `SWAGGER_ENABLED=false` en produccion
- Si se necesita Swagger en staging/preview, habilitarlo condicionalmente

### 5.6 Logs

- `LOG_LEVEL=error` en produccion minimiza informacion sensible en logs
- `LOG_LEVEL=debug` solo en desarrollo local

---

## 6. Verificacion post-configuracion

### 6.1 Schema valido

```bash
# Verificar que todas las variables requeridas estan presentes
# (Esto se hace automaticamente al arrancar la app via Joi)
cd apps/api && npm run build && node dist/main
# Si falta JWT_SECRET o DATABASE_URL, la app falla con mensaje claro
```

### 6.2 Health check

```bash
curl https://tienda-online-zped08s-projects.vercel.app/api/v1/health
# Respuesta esperada: 200 OK con JSON de estado
```

### 6.3 Logs de Vercel

```bash
vercel logs tienda-online-zped08s-projects.vercel.app
# Verificar que no hay errores de configuracion al iniciar
```

---

## 7. Referencias

- `043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md` — Plan de migracion monorepo (Fase 5)
- `apps/api/src/config/env.validation.ts` — Schema de validacion Joi
- `.env.example` — Archivo de ejemplo de variables de entorno
- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Neon Connection Pooling](https://neon.tech/docs/connect/connection-pooling)
- [Upstash Redis REST API](https://upstash.com/docs/redis/overall/getstarted)
