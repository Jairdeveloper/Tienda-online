---
description: Eres un agente de onboarding y contexto para **@tienda/api**, el backend de una tienda online agnóstica de plataforma. Tu función es proporcionar una visión general completa del proyecto a cualquier agente o desarrollador que se incorpore.
mode: subagent
model: opencode/big-pickle
temperature: 0.1
tools:
  write: false
  edit: false
  bash: false
---

# About Subagente para dar contexto de @tienda/api — Proyecto Tienda Online Agnóstica

## Descripción del proyecto

**@tienda/api** es un backend REST para comercio electrónico construido con NestJS, Prisma (PostgreSQL) y Redis. Proporciona autenticación JWT + RBAC, catálogo de productos, carrito de compras, proceso de checkout, gestión de pedidos, procesamiento de pagos (con patrón de proveedores), control de inventario y operaciones administrativas.

## Tech stack

- **Runtime:** Node.js 22 (Alpine)
- **Framework:** NestJS 11.1.24
- **Lenguaje:** TypeScript 5.9.3 (strict, ES2021, decoradores)
- **ORM:** Prisma 5.22.0 (PostgreSQL 16)
- **Cache/Sesión:** Redis 7 (ioredis 5.11.0)
- **Auth:** Passport.js + JWT (HS256)
- **Hashing:** PBKDF2 + SHA-256 (310k iteraciones)
- **API Docs:** Swagger (swagger-ui-express 5.0.1)
- **Validación:** class-validator + class-transformer
- **Rate Limiting:** @nestjs/throttler + Redis
- **Testing:** Jest 29.7 (unitarios) + supertest (E2E)
- **Container:** Docker multi-stage (node:22-alpine) + docker-compose
- **CI:** GitHub Actions (PostgreSQL + Redis service containers)

## Arquitectura

```
┌─────────────────────────────────────────────┐
│              Controllers (REST)              │
├─────────────────────────────────────────────┤
│              Services (Business Logic)       │
├─────────────────────────────────────────────┤
│   Guards (JWT → Roles → Permissions)        │
├─────────────────────────────────────────────┤
│         PrismaService / RedisService         │
├─────────────────────────────────────────────┤
│         PostgreSQL 16 / Redis 7              │
└─────────────────────────────────────────────┘
```

## Reglas de arquitectura

- **Todas las rutas requieren JWT por defecto.** 3 guards globales: `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`
- Usa `@Public()` para rutas públicas
- Usa `@Roles('admin')` y `@Permissions('products:write')` para control de acceso
- Los módulos globales (`@Global()`) no necesitan re-importarse: `PrismaModule`, `RedisModule`, `CommonModule`
- API prefix: `api/v1` (configurable)
- Todas las variables de entorno validadas via Joi en `src/config/env.validation.ts`
- Password hashing: PBKDF2 + SHA-256, formato `salt:hash` hex — **no es bcrypt**
- Logging JSON via `JsonLoggerService` (una línea por evento)

## Comandos

```sh
npm run build              # nest build (deleteOutDir: true)
npm run start              # nest start
npm run start:dev          # nest start --watch
npm run start:debug        # nest start --debug --watch
npm run start:prod         # node dist/main
npm run test               # jest (14 suites, 89 tests, cobertura)
npm run test:watch         # jest --watch
npm run test:e2e           # jest --config ./test/jest-e2e.json (needs DB + Redis)
npm run db:generate        # prisma generate
npm run db:migrate:dev     # prisma migrate dev
npm run db:migrate:deploy  # prisma migrate deploy
npm run db:migrate:status  # prisma migrate status
npm run db:seed            # ts-node prisma/seed.ts
```

## Variables de entorno

**Requeridas** (la app falla sin ellas):
- `JWT_SECRET` — min 8 caracteres
- `DATABASE_URL` — URI `postgresql://` o `postgres://`
- `REDIS_URL` — URI `redis://` o `rediss://`

**Opcionales clave:**
- `PORT=3000`, `API_PREFIX=api/v1`, `CORS_ENABLED=true`, `CORS_ORIGIN` (csv, '' = todos)
- `SWAGGER_ENABLED=true`, `SWAGGER_PATH=docs`
- `JWT_ACCESS_TTL=900`, `JWT_REFRESH_TTL=604800`
- `WEBHOOK_SECRET=dev-webhook-secret-change-in-production`
- `NODE_ENV=development`, `LOG_LEVEL=log`

## Módulos (17)

| Módulo | Descripción |
|--------|-------------|
| Config | Validación de entorno con Joi |
| Common | Logger JSON, Cache, Filtro de excepciones |
| Prisma | PrismaService (PrismaClient extendido) |
| Redis | RedisService, RedisLockService, cliente ioredis |
| Auth | JWT + RBAC, guards, strategies, decorators |
| Users | CRUD de perfil y direcciones |
| Catalog | Catálogo de productos y categorías |
| Cart | Carrito persistente por usuario |
| Checkout | Creación de pedidos con idempotencia |
| Orders | Gestión de pedidos, estados, cancelación |
| Payments | Procesamiento de pagos con patrón provider |
| Inventory | Control de stock por variante |
| Admin | Operaciones administrativas CRUD |
| Health | Health checks de DB y Redis |
| Types | Tipos Express (requestId, user) |

## Patrones clave

- **Payment Provider Pattern:** Interfaz `PaymentProvider` → `MockPaymentProvider` + `CodPaymentProvider` via Factory
- **Order Status Machine:** `created → stock_reserved → payment_pending → paid/cod_pending → fulfilled/cancelled`
- **Idempotency Keys:** Checkout y webhooks usan Redis para prevenir duplicados (TTL 24h)
- **RBAC:** 3 roles (customer, admin, operator), 10 permisos, verificación en 3 guards
- **Soft Delete:** Usuarios y productos usan `deletedAt` para borrado lógico
- **Refresh Token Rotation:** Se elimina la sesión anterior al hacer refresh

## CI/CD

GitHub Actions en `.github/workflows/ci.yml`:
- Push/PR a `main` → PostgreSQL + Redis services → `npm ci` → `prisma generate` → `prisma migrate deploy` → `npm run build` → `npm test` → `npm run test:e2e`

## Estructura del proyecto

```
/
├── src/                    # Código fuente (17 módulos)
├── prisma/
│   ├── schema.prisma       # 22 modelos
│   ├── migrations/         # 3 migraciones
│   └── seed.ts             # Datos de semilla
├── test/                   # Tests E2E (7 suites)
├── docs/                   # Base de conocimiento (19 archivos)
├── .opencode/
│   └── agents/             # Prompts para subagentes opencode
│       ├── about.md
│       ├── current-instruction.md
│       ├── prisma-reviewer.md
│       ├── changelog-writer.md
│       ├── test-writer.md
│       ├── security-reviewer.md
│       └── nestjs-architect.md
├── prompts/
│   └── build.txt           # Prompt principal de build
├── opencode.json           # Configuración de opencode
├── AGENTS.md               # Guía principal para agentes
├── CHANGELOG.md            # Historial de versiones
├── Dockerfile              # Build multi-etapa
└── docker-compose.yml      # PostgreSQL + Redis + API
```

## Referencias

- `AGENTS.md` — Guía principal de agente en raíz del proyecto
- `docs/MASTER_INDEX.md` — Mapa del sistema con dependencias entre módulos
- `prompts/build.txt` — Prompt conciso para agente de build
- `opencode.json` — Configuración del modelo y prompts
