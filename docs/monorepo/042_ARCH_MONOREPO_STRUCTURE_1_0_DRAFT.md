---
id: 042
area: architecture
type: ARCH
module: monorepo
version: 1.0
status: DRAFT
tags:
  - monorepo
  - architecture
  - vercel
  - migration
summary: "Define la estructura monorepo del proyecto @tienda/api con apps/api (NestJS backend) y apps/web (Vite frontend SPA), un solo proyecto Vercel y una sola URL."
keywords:
  - monorepo
  - apps
  - vercel
  - nestjs
  - vite
  - estructura
changelog:
  - version: 1.0
    date: 2026-06-01
    author: workflow-agent
    description: Creación inicial del documento de arquitectura monorepo
---

# Arquitectura Monorepo — @tienda/api

## 1. Estructura de directorios

```
/
├── apps/
│   ├── api/                          # NestJS backend
│   │   ├── src/                      # Código fuente (17 módulos)
│   │   │   ├── main.ts               # Bootstrap + createApp()
│   │   │   ├── app.module.ts         # Módulo raíz
│   │   │   ├── config/               # Joi env validation
│   │   │   ├── common/               # Logger, Cache, Filters
│   │   │   ├── prisma/               # PrismaService
│   │   │   ├── redis/                # RedisService, RedisLockService
│   │   │   ├── auth/                 # JWT, RBAC, guards
│   │   │   ├── users/                # CRUD usuarios
│   │   │   ├── catalog/              # Catálogo público
│   │   │   ├── inventory/            # Stock
│   │   │   ├── cart/                 # Carrito
│   │   │   ├── checkout/             # Checkout flow
│   │   │   ├── orders/               # Órdenes
│   │   │   ├── payments/             # Pagos (provider pattern)
│   │   │   ├── admin/                # Admin CRUD
│   │   │   ├── health/               # Health checks
│   │   │   └── types/                # Express augmentation
│   │   ├── api/                      # Vercel serverless entry points
│   │   │   ├── index.js              # Entry point principal (NestJS)
│   │   │   ├── diagnostic.js         # Diagnóstico
│   │   │   └── health.js             # Health check simple
│   │   ├── prisma/                   # ORM
│   │   │   ├── schema.prisma         # 22 modelos
│   │   │   ├── migrations/           # 3 migraciones
│   │   │   └── seed.ts               # Datos semilla
│   │   ├── test/                     # Tests E2E
│   │   │   ├── jest-e2e.json         # Config Jest E2E
│   │   │   ├── jest.setup.ts         # Setup env vars
│   │   │   ├── helpers/
│   │   │   │   └── health-check.ts   # Verificación DB+Redis
│   │   │   ├── *.e2e-spec.ts         # 7 suites E2E
│   │   ├── dist/                     # Build output (gitignored)
│   │   ├── node_modules/             # Dependencias (gitignored)
│   │   ├── package.json              # Dependencias backend
│   │   ├── vercel.json               # Config build Vercel API
│   │   ├── nest-cli.json             # NestJS CLI config
│   │   ├── tsconfig.json             # TypeScript backend (commonjs)
│   │   ├── tsconfig.build.json       # Build TS (excluye test/)
│   │   └── Dockerfile                # Build multi-etapa (node:22-alpine)
│   │
│   └── web/                          # Frontend SPA
│       ├── src/                      # Código fuente frontend
│       │   ├── main.tsx              # Entry point React
│       │   ├── App.tsx               # Componente raíz
│       │   ├── index.css             # Tailwind + design tokens
│       │   ├── vite-env.d.ts         # Types Vite
│       │   ├── api/
│       │   │   └── client.ts         # Axios client con auto-refresh
│       │   ├── components/
│       │   │   ├── address/
│       │   │   ├── admin/
│       │   │   ├── catalog/
│       │   │   ├── layout/
│       │   │   ├── orders/
│       │   │   └── shared/
│       │   ├── contexts/
│       │   │   └── AuthContext.tsx
│       │   ├── hooks/
│       │   │   └── useApi.ts
│       │   ├── pages/
│       │   │   ├── admin/
│       │   │   ├── Cart.tsx
│       │   │   ├── Checkout.tsx
│       │   │   ├── Home.tsx
│       │   │   ├── Login.tsx
│       │   │   ├── OrderDetail.tsx
│       │   │   ├── OrderList.tsx
│       │   │   ├── Payment.tsx
│       │   │   ├── PaymentResult.tsx
│       │   │   ├── ProductDetail.tsx
│       │   │   ├── ProductList.tsx
│       │   │   ├── Profile.tsx
│       │   │   └── Register.tsx
│       │   ├── routes/
│       │   │   └── index.tsx
│       │   ├── types/
│       │   │   ├── admin.ts
│       │   │   ├── catalog.ts
│       │   │   ├── orders.ts
│       │   │   └── payments.ts
│       │   └── utils/
│       │       └── toast.ts
│       ├── index.html                # Entry HTML
│       ├── vite.config.ts            # Vite config
│       ├── tsconfig.json             # TypeScript frontend (ESNext, jsx)
│       ├── tsconfig.node.json        # TS para vite.config
│       ├── dist/                     # Build output (gitignored)
│       ├── node_modules/             # Dependencias (gitignored)
│       ├── package.json              # Dependencias frontend
│       └── vercel.json               # Config build Vercel SPA
│
├── packages/                         # (futuro: shared types, libs)
│
├── vercel.json                       # Raíz: solo routing global
├── package.json                      # Raíz: scripts de orquestación
├── AGENTS.md                         # Guía de agentes (actualizada)
├── CHANGELOG.md                      # Historial de cambios
├── MASTER_INDEX.md                   # Índice global
├── docs/                             # Documentación
├── .github/workflows/                # CI/CD pipelines
├── docker-compose.yml                # Servicios locales
├── .env.example                      # Variables de entorno
├── .gitignore                        # Exclusiones git
├── .dockerignore                     # Exclusiones docker
├── postman/                          # Colección Postman
├── workflow.sh                       # Script de flujo de programación
├── workflow/                         # Docs del workflow
└── algoritmos/                       # Algoritmos y planes
```

## 2. Estrategia de despliegue Vercel

### 2.1 Proyecto único

El monorepo se despliega como **un solo proyecto Vercel** (`tienda-online`):

| Ruta                               | Origen                                    | Tipo                       |
| ---------------------------------- | ----------------------------------------- | -------------------------- |
| `tienda-online.vercel.app/api/*`   | Backend NestJS en `apps/api/api/index.js` | Serverless Function        |
| `tienda-online.vercel.app/_diag`   | `apps/api/api/diagnostic.js`              | Serverless Function        |
| `tienda-online.vercel.app/_health` | `apps/api/api/health.js`                  | Serverless Function        |
| `tienda-online.vercel.app/*`       | Frontend SPA en `apps/web/dist/`          | Static Files + SPA Rewrite |

### 2.2 Routing

El `vercel.json` raíz contiene solo las reglas de routing:

- `/api/(.*)` → Serverless Function de NestJS
- `/(.*)` → SPA index.html (catch-all con exclusión de archivos estáticos)

### 2.3 Build

Build command unificado que construye ambas apps secuencialmente:

1. `npm run build:api` — Compila NestJS + Prisma generate
2. `npm run build:web` — Compila Vite frontend

### 2.4 Ventajas

- ✅ **Mismo origen**: Sin CORS (backend y frontend en misma URL)
- ✅ **Single deploy**: Un solo `vercel deploy` actualiza todo
- ✅ **Builds independientes**: Cada app tiene su propio `package.json`
- ✅ **Separación clara**: Backend y frontend en directorios distintos
- ✅ **Escalable**: Fácil añadir `packages/` compartidos en el futuro

## 3. Gestión de dependencias

### 3.1 Root `package.json`

Solo scripts de orquestación. Sin dependencias de runtime.
Dependencias dev compartidas opcionales (TypeScript, ESLint) pueden ir aquí.

### 3.2 `apps/api/package.json`

Todas las dependencias del backend NestJS:

- NestJS core, common, platform-express, cli, testing
- Prisma Client + Prisma CLI
- JWT, Passport, Swagger, Throttler
- Redis (ioredis), class-validator, class-transformer
- Jest, ts-jest, supertest

### 3.3 `apps/web/package.json`

Todas las dependencias del frontend:

- React 19, React DOM, React Router
- Vite, Tailwind CSS
- Axios, @tanstack/react-query
- TypeScript (como devDep)

## 4. CI/CD Impacto

### 4.1 GitHub Actions

Los workflows `ci.yml` y `deploy.yml` deben actualizar sus paths:

- `npm ci` → se ejecuta en cada app (`cd apps/api && npm ci && cd ../../apps/web && npm ci`)
- `npx prisma generate` → `cd apps/api && npx prisma generate`
- `npm run test` → `cd apps/api && npm test`
- `npm run build` → script raíz que construye ambas apps

### 4.2 Docker

El `Dockerfile` se mueve a `apps/api/` y construye solo el backend.
El `docker-compose.yml` apunta al nuevo path.

## 5. Migración de archivos

| Origen                   | Destino                        | Tipo                          |
| ------------------------ | ------------------------------ | ----------------------------- |
| `src/`                   | `apps/api/src/`                | Mover directorio              |
| `api/`                   | `apps/api/api/`                | Mover directorio              |
| `prisma/`                | `apps/api/prisma/`             | Mover directorio              |
| `test/`                  | `apps/api/test/`               | Mover directorio              |
| `nest-cli.json`          | `apps/api/nest-cli.json`       | Mover archivo                 |
| `tsconfig.json`          | `apps/api/tsconfig.json`       | Mover archivo                 |
| `tsconfig.build.json`    | `apps/api/tsconfig.build.json` | Mover archivo                 |
| `Dockerfile`             | `apps/api/Dockerfile`          | Mover archivo                 |
| `web/`                   | `apps/web/src/`                | Mover directorio (renombrar)  |
| `index.html`             | `apps/web/index.html`          | Mover + actualizar script src |
| `vite.config.ts`         | `apps/web/vite.config.ts`      | Mover + actualizar paths      |
| `tsconfig.frontend.json` | `apps/web/tsconfig.json`       | Mover y renombrar             |
| `tsconfig.node.json`     | `apps/web/tsconfig.node.json`  | Mover archivo                 |

## 6. Riesgos

1. **Paths relativos en `api/index.js`**: `require("../dist/main")` funciona desde `apps/api/api/` → `apps/api/dist/main` ✓
2. **Import paths en frontend**: Todos son relativos (`../../`, `../`), no dependen de la ubicación del proyecto
3. **Alias `@/` en frontend**: Configurado en vite.config.ts con `path.resolve(__dirname, "./src")` — se actualizará
4. **Build artifacts**: `dist/` y `dist-frontend/` en root cambian a `apps/api/dist/` y `apps/web/dist/`
5. **CI/CD paths**: Todos los comandos de CI deben actualizar directorios de trabajo
6. **Docker build context**: `docker-compose.yml` debe apuntar a `apps/api/`

---

## 7. Próximos pasos

1. Ejecutar migración de archivos (crear estructura, mover, renombrar)
2. Crear `package.json` para cada app
3. Actualizar configuraciones (vercel.json, CI, Docker)
4. Actualizar documentación (AGENTS.md, MASTER_INDEX.md, REGISTRO_IDS.md)
5. Verificar paths e imports
6. Build de prueba (manual, no automático)
