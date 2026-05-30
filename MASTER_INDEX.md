---
title: "@tienda/api — Global Master Index"
version: "1.0.0"
last_updated: "2026-05-30"
status: "current"
tags: [master-index, project-map, root-documentation]
---

# @tienda/api — Global Master Index

> **Proyecto:** Backend de tienda online agnóstica (NestJS + Prisma + PostgreSQL + Redis)
> **Versión:** 0.1.0 — pre-producción
> **Documentación técnica:** [`docs/MASTER_INDEX.md`](./docs/MASTER_INDEX.md)

---

## 1. Project Map

```
/
├── MASTER_INDEX.md                         ← Este archivo (índice global del proyecto)
├── opencode.json                           ← Configuración de opencode (modelo + prompts)
├── AGENTS.md                               ← Guía principal de agente para desarrolladores
├── CHANGELOG.md                            ← Historial de versiones (Keep a Changelog)
├── package.json                            ← Dependencias, scripts, configuración Jest
├── package-lock.json
├── tsconfig.json                           ← TypeScript strict (ES2021, decoradores)
├── tsconfig.build.json                     ← Build config (excluye test/ y spec)
├── nest-cli.json                           ← NestJS CLI (deleteOutDir: true)
├── Dockerfile                              ← Build multi-etapa (node:22-alpine)
├── docker-compose.yml                      ← PostgreSQL 16 + Redis 7 + API
├── .env.example                            ← Template de variables de entorno
├── .env                                    ← Variables locales (gitignored)
├── .gitignore
├── .dockerignore
│
├── src/                                    ← Código fuente (17 módulos, ~99 archivos .ts)
├── prisma/                                 ← ORM (schema, migraciones, seed)
├── test/                                   ← Tests E2E (7 suites, supertest)
├── docs/                                   ← Base de conocimiento (19 documentos)
├── .opencode/                              ← Configuración de opencode agentes
├── prompts/                                ← Prompts para agentes de build
├── algoritmos/                             ← Planes de automatización y ejecución
├── postman/                                ← Colección Postman + Newman config
├── dist/                                   ← Build output (gitignored)
├── node_modules/                           ← Dependencias (gitignored)
├── coverage/                               ← Reportes de cobertura (gitignored)
│
└── .github/
    └── workflows/
        ├── ci.yml                          ← CI: tests + build
        └── (deploy.yml — futuro)           ← CD: deploy a producción
```

---

## 2. Configuration Reference

### 2.1 Environment Variables

Validación via Joi en `src/config/env.validation.ts`:

| Variable | Requerida | Default | Descripción |
|----------|-----------|---------|-------------|
| `NODE_ENV` | No | development | development, test, production |
| `PORT` | No | 3000 | Puerto del servidor |
| `API_PREFIX` | No | api/v1 | Prefijo base de la API |
| `CORS_ENABLED` | No | true | Habilitar CORS |
| `CORS_ORIGIN` | No | '' | Orígenes permitidos (csv, '' = todos) |
| `LOG_LEVEL` | No | log | error, warn, log, debug, verbose |
| `SWAGGER_ENABLED` | No | true | Habilitar Swagger UI |
| `JWT_SECRET` | **Sí** | — | Secreto JWT (min 8 chars) |
| `JWT_ACCESS_TTL` | No | 900 | TTL access token (segundos) |
| `JWT_REFRESH_TTL` | No | 604800 | TTL refresh token (segundos) |
| `DATABASE_URL` | **Sí** | — | URI de PostgreSQL |
| `REDIS_URL` | **Sí** | — | URI de Redis |
| `WEBHOOK_SECRET` | No | dev-... | Secreto para webhooks HMAC |

> **Documentación relacionada:** [`docs/architecture/001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md`](./docs/architecture/001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md)

### 2.2 TypeScript Configuration

| Archivo | Propósito |
|---------|-----------|
| `tsconfig.json` | Strict mode, ES2021, decoradores, sourceMap, incremental |
| `tsconfig.build.json` | Extiende tsconfig, excluye test/ y spec/ |

### 2.3 NestJS CLI

- `nest-cli.json`: `deleteOutDir: true` — limpia `dist/` antes de cada build

### 2.4 opencode

| Archivo | Propósito |
|---------|-----------|
| `opencode.json` | Configura modelo `opencode/big-pickle` y referencia a prompts |
| `prompts/build.txt` | Prompt principal para agente de build |
| `.opencode/agents/*.md` | 9 prompts para subagentes especializados |

> **Documentación relacionada:** [`docs/prompts/018_PRM_BUILD_AGENT_1_0_DRAFT.md`](./docs/prompts/018_PRM_BUILD_AGENT_1_0_DRAFT.md)

---

## 3. Source Code Map — src/

### 3.1 Entry Points

| Archivo | Propósito |
|---------|-----------|
| `src/main.ts` | Bootstrap: middleware (x-request-id), CORS, Swagger, ValidationPipe, HTTP filters |
| `src/app.module.ts` | Módulo raíz: imports 14 módulos + 3 guards globales |

### 3.2 Global Modules (@Global())

| Módulo | Archivos | Propósito |
|--------|----------|-----------|
| **Common** | `common/` (7 archivos) | Logger JSON, CacheService, HttpExceptionFilter, RedisThrottlerStorage |
| **Prisma** | `prisma/` (4 archivos) | PrismaService (extiende PrismaClient), tipos |
| **Redis** | `redis/` (6 archivos) | RedisService, RedisLockService, cliente ioredis |

### 3.3 Domain Modules

| Módulo | Archivos | DTOs | Tests | Propósito |
|--------|----------|------|-------|-----------|
| **Auth** | 10 | 3 DTOs | 2 spec | JWT, RBAC, guards, strategies, decorators |
| **Users** | 4 | 3 DTOs | — | Perfil, CRUD direcciones |
| **Catalog** | 4 | 6 DTOs | 1 spec | Productos, categorías, consulta pública |
| **Cart** | 4 | 3 DTOs | 1 spec | Carrito persistente por usuario |
| **Checkout** | 4 | 2 DTOs | 1 spec | Creación de pedidos con idempotencia |
| **Orders** | 4 | 3 DTOs | 1 spec | Gestión de pedidos, estados, cancelación |
| **Payments** | 8 | 3 DTOs | 3 spec | Provider pattern, intents, webhooks |
| **Inventory** | 3 | — | — | Control de stock por variante |
| **Admin** | 8 | 7 DTOs | 1 spec | CRUD administrativo completo |
| **Health** | 4 | — | 1 spec | Health checks (DB + Redis) |
| **Config** | 1 | — | — | Esquema de validación Joi |
| **Types** | 1 | — | — | Tipos Express (requestId, user) |

> **Total:** ~99 archivos .ts fuente, ~89 tests unitarios, ~14 suites de prueba

### 3.4 Dependencies Between Modules

```
Config (Joi)
  ├── Common (Logger, Cache, Filters)
  ├── Prisma (PrismaClient)
  └── Redis (ioredis)

AppModule
  ├── Health ← Prisma, Redis
  ├── Auth ← Prisma, Redis, JwtService
  ├── Users ← Prisma, Auth
  ├── Catalog ← Prisma
  ├── Cart ← Prisma, Auth
  ├── Checkout ← Prisma, Redis, Cart, Inventory
  ├── Orders ← Prisma, Auth
  ├── Payments ← Prisma, Redis, Inventory, Orders
  ├── Inventory ← Prisma
  └── Admin ← Prisma, Auth, Orders, Inventory
```

> **Documentación relacionada:** [`docs/api/*`](./docs/api/) — Especificaciones detalladas de cada módulo

---

## 4. Database — Prisma Schema

| Aspecto | Detalle |
|---------|---------|
| **ORM** | Prisma 5.22.0 |
| **Base de datos** | PostgreSQL 16 |
| **Modelos** | 22 (HealthProbe, User, Role, Permission, RolePermission, UserRole, Session, Address, Category, Product, ProductCategory, ProductVariant, Inventory, Cart, CartItem, Order, OrderItem, Payment, AuditLog, Notification, Favorite, Review) |
| **Migraciones** | 3 (baseline, business_entities, remove_telegram) |
| **Seed** | 3 roles, 10 permisos, 4 categorías, 5 productos, 10 variantes, admin user |

| Archivo | Propósito |
|---------|-----------|
| `prisma/schema.prisma` | Definición completa del esquema (363 líneas) |
| `prisma/seed.ts` | Datos de semilla para desarrollo |
| `prisma/migrations/20260526000100_baseline/` | Tablas base |
| `prisma/migrations/20260527113724_create_business_entities/` | Órdenes, pagos, inventario |
| `prisma/migrations/20260529193900_remove_telegram_fields/` | Eliminación de telegram_id |
| `prisma/migrations/migration_lock.toml` | Lock file (no editar manualmente) |

> **Documentación relacionada:** [`docs/database/002_DB_PRISMA_SCHEMA_1_0_DRAFT.md`](./docs/database/002_DB_PRISMA_SCHEMA_1_0_DRAFT.md)

---

## 5. API Reference

| Módulo | Prefijo | Autenticación | Documentación |
|--------|---------|---------------|---------------|
| Auth | `POST /api/v1/auth/*` | @Public (register, login, refresh) + JWT | [`docs/api/003_API_AUTH_1_0_DRAFT.md`](./docs/api/003_API_AUTH_1_0_DRAFT.md) |
| Users | `/api/v1/users/*` | JWT | [`docs/api/009_API_USERS_1_0_DRAFT.md`](./docs/api/009_API_USERS_1_0_DRAFT.md) |
| Catalog | `/api/v1/catalog/*` | @Public | [`docs/api/004_API_CATALOG_1_0_DRAFT.md`](./docs/api/004_API_CATALOG_1_0_DRAFT.md) |
| Cart | `/api/v1/cart/*` | JWT | [`docs/api/005_API_CART_1_0_DRAFT.md`](./docs/api/005_API_CART_1_0_DRAFT.md) |
| Checkout | `POST /api/v1/checkout` | JWT | [`docs/api/006_API_CHECKOUT_1_0_DRAFT.md`](./docs/api/006_API_CHECKOUT_1_0_DRAFT.md) |
| Orders | `/api/v1/orders/*` | JWT | [`docs/api/007_API_ORDERS_1_0_DRAFT.md`](./docs/api/007_API_ORDERS_1_0_DRAFT.md) |
| Payments | `/api/v1/payments/*` | JWT + @Public (webhook) | [`docs/api/008_API_PAYMENTS_1_0_DRAFT.md`](./docs/api/008_API_PAYMENTS_1_0_DRAFT.md) |
| Inventory | `/api/v1/inventory/*` | @Public (read-only) | [`docs/api/010_API_INVENTORY_1_0_DRAFT.md`](./docs/api/010_API_INVENTORY_1_0_DRAFT.md) |
| Admin | `/api/v1/admin/*` | JWT + @Roles('admin') | [`docs/api/011_API_ADMIN_1_0_DRAFT.md`](./docs/api/011_API_ADMIN_1_0_DRAFT.md) |
| Health | `GET /api/v1/health` | @Public | — |

> **Swagger UI:** `http://localhost:3000/api/v1/docs` (cuando está habilitado)

---

## 6. Testing

| Tipo | Runner | Archivos | Cantidad | Configuración |
|------|--------|----------|----------|---------------|
| **Unit tests** | Jest | `src/**/*.spec.ts` | 14 suites, 89 tests | `package.json` jest config |
| **E2E tests** | Jest + supertest | `test/*.e2e-spec.ts` | 7 suites | `test/jest-e2e.json` (timeout 120s) |

### Cobertura mínima (thresholds)

| Métrica | Mínimo |
|---------|--------|
| Branches | 60% |
| Functions | 70% |
| Lines | 75% |
| Statements | 75% |

### Archivos de test

```
test/
├── jest-e2e.json           ← Configuración Jest para E2E
├── jest.setup.ts           ← Setup: defaults seguros para env vars
├── helpers/
│   └── health-check.ts     ← Verifica DB + Redis antes de cada suite E2E
├── app.e2e-spec.ts
├── auth.e2e-spec.ts
├── cart.e2e-spec.ts
├── catalog.e2e-spec.ts
├── checkout.e2e-spec.ts
├── orders.e2e-spec.ts
└── payments.e2e-spec.ts
```

> **Nota:** Los E2E requieren PostgreSQL y Redis en ejecución.

---

## 7. Security Architecture

| Capa | Mecanismo | Archivos |
|------|-----------|----------|
| **Autenticación** | JWT (HS256) via Passport | `src/auth/strategies/jwt.strategy.ts` |
| **Autorización** | 3 guards globales: JWT → Roles → Permisos | `src/auth/guards/*.ts` |
| **Rate limiting** | @nestjs/throttler + Redis (60 req/min) | `src/common/throttler/` |
| **Validación** | ValidationPipe global (whitelist, transform, forbidNonWhitelisted) | `src/main.ts` |
| **Password hashing** | PBKDF2 + SHA-256, 310k iteraciones | `src/auth/auth.service.ts` |
| **Webhook seguridad** | HmacWebhookGuard | `src/payments/guards/hmac-webhook.guard.ts` |
| **Idempotencia** | Redis keys: checkout + webhook (24h TTL) | `src/checkout/`, `src/payments/` |
| **CORS** | Configurable por entorno | `src/main.ts` |
| **Logging** | JSON estructurado (una línea), sin secretos | `src/common/logger/` |
| **Error handling** | HttpExceptionFilter global | `src/common/filters/` |
| **Refresh rotation** | Sesión anterior eliminada en cada refresh | `src/auth/auth.service.ts` |

> **Documentación relacionada:** [`docs/decisions/016_ADR_AUTH_JWT_RBAC_1_0_DRAFT.md`](./docs/decisions/016_ADR_AUTH_JWT_RBAC_1_0_DRAFT.md)

---

## 8. DevOps

### 8.1 Docker

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Build multi-etapa (deps → build → production), tini init, USER node |
| `docker-compose.yml` | 3 servicios: postgres:16-alpine, redis:7-alpine, api (build local) |

### 8.2 CI/CD

| Archivo | Propósito |
|---------|-----------|
| `.github/workflows/ci.yml` | CI: push/PR a main → PostgreSQL + Redis services → npm ci → prisma generate → migrate → build → test → e2e |

**Pipeline CI:**
```
checkout → setup-node → npm ci → prisma generate → prisma migrate deploy → npm run build → npm test → npm run test:e2e
```

> **Plan de producción:** [`algoritmos/produccion-plan.md`](./algoritmos/produccion-plan.md) — Guía completa para deploy (7-12 días, $0/mes)

---

## 9. opencode Agents

| Archivo | Rol | Propósito |
|---------|-----|-----------|
| `.opencode/agents/about.md` | Onboarding | Visión general del proyecto para nuevos agentes |
| `.opencode/agents/current-instruction.md` | Reglas | Comportamiento, formato y restricciones para subagentes |
| `.opencode/agents/nestjs-architect.md` | Arquitectura | Diseño de módulos, DI, guards, estructura NestJS |
| `.opencode/agents/prisma-reviewer.md` | Base de datos | Revisión de schema, migraciones, queries, seeds |
| `.opencode/agents/changelog-writer.md` | Release | Mantenimiento de CHANGELOG.md |
| `.opencode/agents/test-writer.md` | Testing | Unit tests (Jest) y E2E (supertest) |
| `.opencode/agents/security-reviewer.md` | Seguridad | Auditoría de auth, autorización, inyección, secretos |
| `.opencode/agents/backend-reviewer.md` | Backend | Revisión general del backend |
| `.opencode/agents/frontend-reviewer.md` | Frontend | Revisión de frontend (si aplica) |

---

## 10. Documentation Cross-Reference

Esta sección mapea cada área del proyecto a su documentación correspondiente en `docs/`.

| Área | Documentación |
|------|---------------|
| **Visión general del sistema** | [`docs/architecture/001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md`](./docs/architecture/001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md) |
| **Base de datos / Prisma** | [`docs/database/002_DB_PRISMA_SCHEMA_1_0_DRAFT.md`](./docs/database/002_DB_PRISMA_SCHEMA_1_0_DRAFT.md) |
| **Auth API** | [`docs/api/003_API_AUTH_1_0_DRAFT.md`](./docs/api/003_API_AUTH_1_0_DRAFT.md) |
| **Catalog API** | [`docs/api/004_API_CATALOG_1_0_DRAFT.md`](./docs/api/004_API_CATALOG_1_0_DRAFT.md) |
| **Cart API** | [`docs/api/005_API_CART_1_0_DRAFT.md`](./docs/api/005_API_CART_1_0_DRAFT.md) |
| **Checkout API** | [`docs/api/006_API_CHECKOUT_1_0_DRAFT.md`](./docs/api/006_API_CHECKOUT_1_0_DRAFT.md) |
| **Orders API** | [`docs/api/007_API_ORDERS_1_0_DRAFT.md`](./docs/api/007_API_ORDERS_1_0_DRAFT.md) |
| **Payments API** | [`docs/api/008_API_PAYMENTS_1_0_DRAFT.md`](./docs/api/008_API_PAYMENTS_1_0_DRAFT.md) |
| **Users API** | [`docs/api/009_API_USERS_1_0_DRAFT.md`](./docs/api/009_API_USERS_1_0_DRAFT.md) |
| **Inventory API** | [`docs/api/010_API_INVENTORY_1_0_DRAFT.md`](./docs/api/010_API_INVENTORY_1_0_DRAFT.md) |
| **Admin API** | [`docs/api/011_API_ADMIN_1_0_DRAFT.md`](./docs/api/011_API_ADMIN_1_0_DRAFT.md) |
| **Flujo de autenticación** | [`docs/flows/012_FLOW_AUTH_1_0_DRAFT.md`](./docs/flows/012_FLOW_AUTH_1_0_DRAFT.md) |
| **Flujo de checkout** | [`docs/flows/013_FLOW_CHECKOUT_1_0_DRAFT.md`](./docs/flows/013_FLOW_CHECKOUT_1_0_DRAFT.md) |
| **Flujo de pagos** | [`docs/flows/014_FLOW_PAYMENT_1_0_DRAFT.md`](./docs/flows/014_FLOW_PAYMENT_1_0_DRAFT.md) |
| **ADR: PostgreSQL** | [`docs/decisions/015_ADR_DATABASE_POSTGRESQL_1_0_DRAFT.md`](./docs/decisions/015_ADR_DATABASE_POSTGRESQL_1_0_DRAFT.md) |
| **ADR: JWT + RBAC** | [`docs/decisions/016_ADR_AUTH_JWT_RBAC_1_0_DRAFT.md`](./docs/decisions/016_ADR_AUTH_JWT_RBAC_1_0_DRAFT.md) |
| **ADR: Payment Providers** | [`docs/decisions/017_ADR_PAYMENTS_PROVIDER_PATTERN_1_0_DRAFT.md`](./docs/decisions/017_ADR_PAYMENTS_PROVIDER_PATTERN_1_0_DRAFT.md) |
| **Prompt conventions** | [`docs/prompts/018_PRM_BUILD_AGENT_1_0_DRAFT.md`](./docs/prompts/018_PRM_BUILD_AGENT_1_0_DRAFT.md) |
| **AI Knowledge Base** | [`docs/ai/019_AI_KNOWLEDGE_BASE_1_0_DRAFT.md`](./docs/ai/019_AI_KNOWLEDGE_BASE_1_0_DRAFT.md) |
| **Plan de producción** | [`algoritmos/produccion-plan.md`](./algoritmos/produccion-plan.md) |
| **Guía de agente** | [`AGENTS.md`](./AGENTS.md) |
| **Changelog** | [`CHANGELOG.md`](./CHANGELOG.md) |

---

## 11. Quick Reference — Scripts

```sh
# Desarrollo
npm run start:dev          # Iniciar en modo watch
npm run build              # Compilar TypeScript
npm run start:prod         # Ejecutar compilado

# Testing
npm run test               # Unit tests + cobertura
npm run test:watch         # Unit tests en modo watch
npm run test:e2e           # E2E tests (requiere DB + Redis)

# Base de datos
npm run db:generate        # Generar cliente Prisma
npm run db:migrate:dev     # Crear migración
npm run db:migrate:deploy  # Aplicar migraciones
npm run db:migrate:status  # Ver estado de migraciones
npm run db:seed            # Poblar datos de semilla

# Docker
docker compose up -d       # Iniciar servicios (DB + Redis)
docker compose build       # Construir imagen API
docker compose up -d api   # Iniciar todo
```

---

## 12. Version History

| Versión | Fecha | Cambios principales |
|---------|-------|-------------------|
| 0.1.0 | 2026-05-29 | Release inicial: 17 módulos, 22 modelos, 89 tests, 7 E2E |
| 0.0.1 | 2026-05-26 | Scaffold inicial del proyecto |

> **Changelog completo:** [`CHANGELOG.md`](./CHANGELOG.md)
