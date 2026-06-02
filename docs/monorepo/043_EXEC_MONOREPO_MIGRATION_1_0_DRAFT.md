---
id: 043
area: architecture
type: EXEC
module: monorepo
version: 1.0
status: DRAFT
tags:
  - monorepo
  - migration
  - architecture
  - deployment
summary: "Reporte de ejecucion de la migracion a estructura monorepo (apps/api + apps/web) segun el plan definido en 042_ARCH_MONOREPO_STRUCTURE_1_0_DRAFT.md. Incluye acciones realizadas, archivos modificados y proximos pasos hacia produccion."
keywords:
  - monorepo
  - migracion
  - apps
  - vercel
  - produccion
  - deploy
changelog:
  - version: 1.0
    date: 2026-06-02
    author: workflow-agent
    description: Creacion inicial del reporte de migracion monorepo
---

# Ejecucion de Migracion Monorepo — @tienda/api

## 1. Resumen ejecutivo

Se migro la estructura del proyecto de una disposicion plana a un monorepo con dos aplicaciones independientes bajo `apps/`:

- **`apps/api/`** — Backend NestJS (src/, prisma/, test/, api/)
- **`apps/web/`** — Frontend Vite + React SPA (src/, index.html)

La migracion sigue el plan definido en `042_ARCH_MONOREPO_STRUCTURE_1_0_DRAFT.md` y fue ejecutada por el `workflow-agent` el 2026-06-02.

### Beneficios obtenidos

- **Mismo origen**: Backend y frontend en misma URL, sin CORS
- **Single deploy**: Un solo `vercel deploy` actualiza todo
- **Builds independientes**: Cada app con su propio `package.json` y dependencias
- **Separacion clara**: Backend y frontend en directorios distintos
- **Escalable**: Facil anadir `packages/` compartidos en el futuro

---

## 2. Acciones realizadas

### 2.1 Migracion de archivos (~200 archivos movidos con `git mv`)

#### Backend → `apps/api/`

| Origen                | Destino                        | Metodo                 |
| --------------------- | ------------------------------ | ---------------------- |
| `src/`                | `apps/api/src/`                | `git mv`               |
| `api/`                | `apps/api/api/`                | `git mv` + fix nesting |
| `prisma/`             | `apps/api/prisma/`             | `git mv`               |
| `test/`               | `apps/api/test/`               | `git mv`               |
| `nest-cli.json`       | `apps/api/nest-cli.json`       | `git mv`               |
| `tsconfig.json`       | `apps/api/tsconfig.json`       | `git mv`               |
| `tsconfig.build.json` | `apps/api/tsconfig.build.json` | `git mv`               |
| `Dockerfile`          | `apps/api/Dockerfile`          | `git mv`               |
| `package.json`        | `apps/api/package.json`        | Copia + limpieza       |

#### Frontend → `apps/web/`

| Origen                   | Destino                       | Metodo                       |
| ------------------------ | ----------------------------- | ---------------------------- |
| `web/`                   | `apps/web/src/`               | `git mv` + fix nesting       |
| `index.html`             | `apps/web/index.html`         | `git mv` + update script src |
| `vite.config.ts`         | `apps/web/vite.config.ts`     | `git mv` + update paths      |
| `tsconfig.frontend.json` | `apps/web/tsconfig.json`      | `git mv` + rename            |
| `tsconfig.node.json`     | `apps/web/tsconfig.node.json` | `git mv`                     |

### 2.2 Creacion de package.json por app

#### Root `package.json`

Solo scripts de orquestacion. Sin dependencias de runtime:

```json
{
  "scripts": {
    "build": "npm run build:api && npm run build:web",
    "build:api": "cd apps/api && npm run build",
    "build:web": "cd apps/web && npm run build",
    "dev:api": "cd apps/api && npm run start:dev",
    "dev:web": "cd apps/web && npm run dev",
    "test": "cd apps/api && npm test",
    "test:e2e": "cd apps/api && npm run test:e2e",
    "db:generate": "cd apps/api && npm run db:generate",
    "db:migrate:dev": "cd apps/api && npm run db:migrate:dev",
    "db:migrate:deploy": "cd apps/api && npm run db:migrate:deploy",
    "db:seed": "cd apps/api && npm run db:seed"
  }
}
```

#### `apps/api/package.json`

Dependencias del backend NestJS (Prisma, JWT, Redis, Swagger, testing). Scope: `@tienda/api`.

#### `apps/web/package.json`

Dependencias del frontend (React 19, Vite, Tailwind, Axios, React Query). Scope: `@tienda/web`.

### 2.3 Actualizacion de configuraciones

| Archivo                        | Cambio                                                   |
| ------------------------------ | -------------------------------------------------------- |
| `vercel.json` (root)           | Routing global: `/api/*` → serverless, `/*` → SPA        |
| `apps/api/vercel.json`         | Config build NestJS (creado)                             |
| `apps/web/vercel.json`         | Config build Vite SPA (creado)                           |
| `docker-compose.yml`           | Build context `.`, dockerfile `apps/api/Dockerfile`      |
| `apps/api/Dockerfile`          | Paths actualizados para root context                     |
| `.dockerignore`                | Patrones glob para monorepo (`*/node_modules`, `*/dist`) |
| `.gitignore`                   | `apps/*/dist/`, `apps/*/node_modules/`                   |
| `.github/workflows/ci.yml`     | Todos los comandos con `cd apps/api &&`                  |
| `.github/workflows/deploy.yml` | Todos los comandos con `cd apps/api &&`                  |
| `apps/web/index.html`          | script src: `./src/main.tsx`                             |
| `apps/web/vite.config.ts`      | outDir: `dist`, alias `./src`                            |
| `apps/web/tsconfig.json`       | paths `src/*`, include `src/**/*`                        |

### 2.4 Actualizacion de documentacion

| Archivo           | Cambio                                                               |
| ----------------- | -------------------------------------------------------------------- |
| `AGENTS.md`       | Estructura monorepo, comandos con `cd apps/api/`, paths actualizados |
| `MASTER_INDEX.md` | Project map monorepo, paths a `apps/api/src/`                        |

### 2.5 Verificacion de paths e imports

- `api/index.js` → `require("../dist/main")` resuelve correctamente
- Imports del backend: todos relativos dentro de modulos (sin cambios)
- Imports del frontend: todos relativos (sin alias `@/` en uso)
- NestJS CLI: `sourceRoot: "src"` → `apps/api/src/`
- Jest E2E: `rootDir: ".."` → `apps/api/`
- Vite: `root: "."`, `outDir: "dist"` → `apps/web/dist/`

---

## 3. Problemas encontrados y soluciones

| Problema                 | Causa                                                                        | Solucion                                                               |
| ------------------------ | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Nesting `web/`           | `apps/web/src/` existia antes del `git mv`, moviendo `web/` dentro de `src/` | `git mv apps/web/src/web/* apps/web/src/` + `rmdir`                    |
| Nesting `api/`           | `apps/api/api/` existia antes del `git mv`, moviendo `api/` dentro de `api/` | `git mv apps/api/api/api/* apps/api/api/` + `rmdir`                    |
| Docker package-lock.json | `package-lock.json` estaba en root, contexto `apps/api` no lo encontraba     | Cambiar contexto Docker a root (`.`), dockerfile `apps/api/Dockerfile` |
| Docker COPY paths        | Dockerfile debia copiar desde `apps/api/`                                    | Actualizar `COPY . .` → `COPY apps/api/ .`                             |

---

## 4. Archivos creados y modificados

### Archivos creados (4)

- `apps/api/package.json`
- `apps/api/vercel.json`
- `apps/web/package.json`
- `apps/web/vercel.json`

### Archivos modificados (10)

- `.dockerignore`
- `.gitignore`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy.yml`
- `AGENTS.md`
- `MASTER_INDEX.md`
- `docker-compose.yml`
- `package.json` (root)
- `vercel.json` (root)
- `apps/api/Dockerfile`

### Archivos movidos (~200)

Todo el contenido de `src/`, `prisma/`, `test/`, `api/`, `web/`, mas configs NestJS y frontend.

---

## 5. Estado actual del proyecto

```
/
├── apps/
│   ├── api/                    # Backend NestJS
│   │   ├── src/                # 17 modulos
│   │   ├── api/                # Vercel serverless entry points
│   │   ├── prisma/             # Schema + migrations + seed
│   │   ├── test/               # Tests E2E
│   │   ├── dist/               # Build output (gitignored)
│   │   ├── package.json
│   │   ├── vercel.json
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.build.json
│   │   └── Dockerfile
│   │
│   └── web/                    # Frontend Vite + React SPA
│       ├── src/                # Componentes, paginas, hooks
│       ├── index.html
│       ├── vite.config.ts
│       ├── tsconfig.json
│       ├── tsconfig.node.json
│       ├── dist/               # Build output (gitignored)
│       └── package.json
│
├── vercel.json                 # Routing global
├── package.json                # Orquestacion raiz
├── AGENTS.md                   # Guia de agentes (actualizada)
├── MASTER_INDEX.md             # Indice global (actualizado)
├── CHANGELOG.md                # Historial de cambios
├── docs/                       # Documentacion
├── .github/workflows/          # CI/CD pipelines
├── docker-compose.yml          # Servicios locales
├── .env.example                # Variables de entorno
├── .gitignore                  # Exclusiones git
├── .dockerignore               # Exclusiones docker
├── postman/                    # Coleccion Postman
├── workflow.sh                 # Script de flujo de programacion
├── workflow/                   # Docs del workflow
└── algoritmos/                 # Algoritmos y planes
```

---

## 6. Proximos pasos hacia produccion

### Fase 1: Verificacion local

- [ ] **1.1 Build manual del backend**

  ```bash
  rm -rf node_modules dist
  cd apps/api && npm install
  npx prisma generate
  npm run build
  ls dist/main.js              # debe existir
  ```

- [ ] **1.2 Build manual del frontend**

  ```bash
  cd apps/web && npm install
  npm run build
  ls dist/index.html           # debe existir
  ```

- [ ] **1.3 Tests unitarios**

  ```bash
  cd apps/api && npm test      # 14 suites, 89 tests, coverage thresholds
  ```

- [ ] **1.4 Tests E2E** (requiere PostgreSQL + Redis local)
  ```bash
  cd apps/api && npm run test:e2e
  ```

### Fase 2: CI/CD

- [ ] **2.1 Verificar CI en GitHub Actions**
  - Push a branch de prueba
  - Confirmar que el workflow `ci.yml` ejecuta todos los pasos correctamente
  - Verificar que usa `cd apps/api && npm ci` y paths actualizados

- [ ] **2.2 Cache de dependencias**
  - Los lockfiles ahora estan en `apps/*/` (no en root)
  - El cache `npm` de GitHub Actions puede no funcionar hasta el primer build exitoso
  - Considerar agregar `cache-dependency-path` en los workflows:
    ```yaml
    - uses: actions/setup-node@v4
      with:
        cache: "npm"
        cache-dependency-path: "apps/api/package-lock.json"
    ```

### Fase 3: Base de datos

- [ ] **3.1 Migraciones pendientes**

  ```bash
  cd apps/api && npx prisma migrate status   # verificar estado
  cd apps/api && npx prisma migrate deploy   # aplicar migraciones
  ```

- [ ] **3.2 Seed de datos** (si aplica)

  ```bash
  cd apps/api && npm run db:seed
  ```

- [ ] **3.3 Base de datos en produccion**
  - Usar Neon (Postgres serverless) o Supabase
  - Configurar `DATABASE_URL` en Vercel environment variables
  - Ejecutar `prisma migrate deploy` en el pipeline de deploy

### Fase 4: Redis

- [ ] **4.1 Redis en produccion**
  - Usar Upstash (Redis serverless) compatible con Vercel
  - Configurar `REDIS_URL` en Vercel environment variables
  - Verificar que `RedisService` y `RedisLockService` funcionan con Upstash

### Fase 5: Variables de entorno

- [ ] **5.1 Configurar en Vercel**

  ```
  JWT_SECRET=                # min 8 chars
  DATABASE_URL=              # postgresql:// o postgres://
  REDIS_URL=                 # redis:// o rediss://
  NODE_ENV=production
  API_PREFIX=api/v1
  CORS_ENABLED=true
  CORS_ORIGIN=               # dominio del frontend
  SWAGGER_ENABLED=false      # deshabilitar en produccion
  JWT_ACCESS_TTL=900
  JWT_REFRESH_TTL=604800
  WEBHOOK_SECRET=            # para webhooks de pagos
  ```

- [ ] **5.2 Verificar .env.example**
  - Asegurar que refleja todas las variables requeridas
  - No incluir valores reales (solo defaults seguros)

### Fase 6: Deploy en Vercel

- [ ] **6.1 Configurar proyecto Vercel**
  - Crear/actualizar proyecto `tienda-online` en Vercel
  - Framework: Other
  - Root directory: `/`
  - Build command: `npm run build`
  - Output directory: (gestionado por vercel.json)
  - Install command: `cd apps/api && npm install && cd ../../apps/web && npm install`

- [ ] **6.2 Verificar routing**
  - `/api/v1/health` → backend NestJS
  - `/api/v1/docs` → Swagger UI (si habilitado)
  - `/` → frontend SPA
  - `/_diag` → diagnostic endpoint
  - `/_health` → health check simple

- [ ] **6.3 Verificar rewrites en `vercel.json`**
  - Las rutas `/api/(.*)` deben redirigir a serverless function
  - Las rutas estaticas deben servirse desde `apps/web/dist/`
  - El catch-all debe servir `index.html` para SPA routing

- [ ] **6.4 Probar deploy**
  - `npx vercel --prod` o deploy via GitHub integration
  - Verificar que ambos builds (api + web) se completan
  - Verificar logs de Vercel por errores

### Fase 7: Post-deploy

- [ ] **7.1 Health checks**
  - `GET /api/v1/health` → debe responder 200
  - `GET /_health` → debe responder 200
  - `GET /` → debe servir SPA

- [ ] **7.2 Monitoreo**
  - Configurar alertas de Vercel para errores 500
  - Revisar logs de funciones serverless periodicamente
  - Monitorear uso de base de datos (Neon/Supabase dashboard)

- [ ] **7.3 Seguridad**
  - Deshabilitar Swagger en produccion (`SWAGGER_ENABLED=false`)
  - Verificar CORS: solo el dominio de produccion
  - Rate limiting activo (ThrottlerGuard)
  - JWT secrets rotados periodicamente

- [ ] **7.4 Backup**
  - Backup diario de base de datos (automatico en Neon/Supabase)
  - Backup de variables de entorno en Vault o similar
  - Documentar procedimiento de restauracion

### Fase 8: Documentacion final

- [ ] **8.1 Actualizar `CHANGELOG.md`**
  - Registrar todos los cambios de la migracion
  - Incluir archivos movidos, creados y modificados
  - Version sugerida: `1.0.0` (primer release estable)

- [ ] **8.2 Actualizar `AGENTS.md`**
  - Verificar que URLs de produccion estan correctas
  - Actualizar comandos para entorno monorepo

- [ ] **8.3 Verificar `docs/REGISTRO_IDS.md`**
  - Confirmar que el ID 043 esta registrado
  - No hay colisiones de IDs

---

## 7. Riesgos y advertencias

1. **package-lock.json**: El lock file queda en root. `npm install` en `apps/api/` generara su propio lock file. Asegurar ambos en el commit.

2. **node_modules/ root**: Quedan del setup anterior. Eliminar despues de verificar que cada app funciona independientemente: `rm -rf node_modules`.

3. **dist/ root**: Build artifacts antiguos (`dist/`, `dist-frontend/`). Eliminar: `rm -rf dist dist-frontend`.

4. **CI cache**: `cache: npm` en GitHub Actions usa `package-lock.json`. Como los lock files ahora estan en `apps/*/`, el cacheo puede no funcionar hasta que se generen los nuevos lock files.

5. **Vercel install command**: El comando de instalacion debe ser personalizado para instalar en ambas apps: `cd apps/api && npm install && cd ../../apps/web && npm install`.

6. **Prisma migrations paths**: Las rutas en archivos de migracion contienen paths absolutos internos de Prisma que no se ven afectados por la reubicacion — Prisma resuelve paths relativos al schema.

---

## 8. Referencias

- `042_ARCH_MONOREPO_STRUCTURE_1_0_DRAFT.md` — Plan de arquitectura monorepo
- `AGENTS.md` — Guia de agentes (actualizada con estructura monorepo)
- `MASTER_INDEX.md` — Indice global del proyecto
- `docs/REGISTRO_IDS.md` — Registro de IDs de documentacion
