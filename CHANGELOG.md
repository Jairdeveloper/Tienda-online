# Changelog

All notable changes to **@tienda/api** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed

- Redis graceful degradation: `UpstashClient`, `CacheService` y `RedisLockService` ahora capturan errores de conexión Redis (WRONGPASS, timeouts) y degradan gracefulmente — cache miss retorna null, locks retornan false, el endpoint `/api/v1/health` reporta `status: degraded` con detalle del error en `redisDetail`
- Migraciones de Prisma aplicadas correctamente a Neon DB (`prisma migrate deploy`): 3 migraciones (baseline, business entities, remove telegram fields) ejecutadas contra la base de datos de producción

### Changed

- `vercel.json`: las variables de entorno `REDIS_URL` y `UPSTASH_REDIS_TOKEN` actualizadas con los valores correctos de Upstash (REST API)

### Added

- Frontend Fase 0 (Setup del Proyecto): scaffolding con Vite 6 + React 19 + TypeScript + Tailwind CSS v4 en raíz del repositorio
  - `vite.config.ts`: configuración de Vite con proxy `/api` → producción Vercel y alias `@` → `web/`
  - `web/main.tsx`: entry point React con QueryClientProvider, AuthProvider, BrowserRouter
  - `web/App.tsx`: componente raíz con MainLayout + Routes
  - `web/index.css`: Tailwind CSS v4 con `@theme` personalizado (colores primary/secondary/semantic, tipografía)
  - `web/api/client.ts`: Axios instance con interceptor Bearer + auto-refresh en 401 con cola de requests
  - `web/contexts/AuthContext.tsx`: contexto de autenticación con login, register, logout, fetchUser, persistencia localStorage
  - `web/routes/index.tsx`: 10 rutas (Home, Login, Register, Product/:id, Cart, Checkout, Orders, Order/:id, Profile, catch-all)
  - `web/components/layout/`: Navbar, Sidebar, Footer, MainLayout
  - `web/pages/Home.tsx`: landing page auth-aware con CTA login/register
- Frontend Fase 1 (Auth + Usuario): páginas de autenticación y gestión de perfil
  - `web/pages/Login.tsx`: formulario de login con validación, spinner, errores del servidor, redirect post-login
  - `web/pages/Register.tsx`: formulario de registro con validaciones (email, password >= 8 chars, confirm match)
  - `web/pages/Profile.tsx`: ruta protegida con datos de usuario (badges de roles/permissions), edición de nombre, CRUD de direcciones
  - `web/components/address/AddressCard.tsx`: card de dirección con botones editar/eliminar
  - `web/components/address/AddressForm.tsx`: formulario reutilizable para crear/editar dirección (7 campos + checkbox default)
  - `web/components/address/AddressList.tsx`: lista de direcciones con create/edit/delete inline, loading y empty states
  - `web/hooks/useApi.ts`: hook genérico para llamadas API con estados loading/error/data
- Documentación de ejecución: `docs/frontend/031_FRONTEND_EXEC_FASE0_1_0_DRAFT.md`, `docs/frontend/032_FRONTEND_EXEC_FASE1_1_0_DRAFT.md`
- `tsconfig.frontend.json`, `tsconfig.node.json`, `index.html`: configuración de TypeScript y entry point HTML del frontend
- Dependencias: `react`, `react-dom`, `react-router-dom`, `axios`, `@tanstack/react-query`, `@headlessui/react`, `@heroicons/react`, `vite`, `@vitejs/plugin-react`, `tailwindcss`, `@tailwindcss/vite`, `@types/react`, `@types/react-dom`
- Scripts: `build:frontend`, `dev:frontend`, `preview:frontend`
- Frontend Fase 2 (Catálogo + Carrito): páginas y componentes de catálogo y carrito de compras
  - `web/types/catalog.ts`: interfaces TypeScript para Category, Product, ProductVariant, PaginatedResponse, Cart, CartItem, InventoryInfo
  - `web/components/catalog/ProductCard.tsx`: tarjeta de producto con imagen placeholder, nombre, badges de categorías, precio mínimo
  - `web/components/catalog/ProductGrid.tsx`: grid responsive (1-4 columnas) de tarjetas de producto
  - `web/components/catalog/Pagination.tsx`: controles de paginación con ventana de 5 páginas y elipsis
  - `web/components/catalog/CategoryFilter.tsx`: barra horizontal de categorías con fetch y skeleton loading
  - `web/components/catalog/VariantSelector.tsx`: selector de variantes con precio y descuento
  - `web/components/catalog/StockIndicator.tsx`: indicador de stock (verde/amarillo/rojo) con fetch de inventario
  - `web/pages/ProductList.tsx`: listado de productos con búsqueda, filtro por categoría, paginación, estados loading/empty/error
  - `web/pages/ProductDetail.tsx`: detalle de producto con breadcrumb, variantes, stock, botón add-to-cart con auth check
  - `web/pages/Cart.tsx`: carrito protegido con CRUD de items, +/- cantidad, vaciar, resumen y checkout
- `web/routes/index.tsx`: rutas actualizadas — `/products` → ProductList, `/products/:id` → ProductDetail, `/cart` → CartPage
- `web/components/layout/Navbar.tsx`: enlace "Catálogo" añadido en navegación desktop y mobile
- Documentación de ejecución: `docs/frontend/033_FRONTEND_EXEC_FASE2_1_0_DRAFT.md`

### Changed

- `package.json`: añadidas dependencias frontend (React, Vite, Tailwind, etc.) y scripts de build/dev
- `docs/REGISTRO_IDS.md`: registrados IDs 031 (Fase 0), 032 (Fase 1), 033 (Fase 2)
- `.gitignore`: añadido `dist-frontend/`

- `api/index.js`: monkey-patch para PrismaClient (`configOverride`) que fuerza `postinstall: false` y `ciName: undefined`, solucionando el error "Prisma has detected that this project was built on Vercel" en runtime serverless
- `vercel.json`: añadido `npx prisma migrate deploy` al build command para aplicar migraciones automáticamente en cada deploy
- `.opencode/agents/reverse-engineer.md`: nuevo agente de ingeniería inversa para analizar código NestJS/TypeScript y producir documentación en lenguaje natural
- `.opencode/agents/vercel-deploy.md`: nuevo agente experto en deploy de NestJS en Vercel con Prisma + Neon + Upstash
- `.opencode/agents/028_PRM_BUILD_AGENTS_1_0_DRAFT.md`: plan de implementación para los 2 nuevos sub-agentes
- `.opencode/agents/029_EXEC_BUILD_AGENTS_1_0_DRAFT.md`: plan de ejecución para los 2 nuevos sub-agentes
- `workflow/001_DEV_SPEC_WORKFLOW_AGENT_1_0_DRAFT.md`: especificación completa de comportamiento del workflow-agent (propósito, capacidades, modo de operación, árbol de decisión, restricciones, protocolo de documentación)
- `workflow/030_DEV_REFERENCE_AGENT_AUTOIMPROVEMENT_1_0_DRAFT.md`: documento de referencia del proceso de auto-mejora del workflow-agent

- `AGENTS.md`: nueva sección "Git & Documentation Protocol" — establece que todo agente DEBE actualizar `CHANGELOG.md` antes de cualquier `git push`, usando `changelog-writer`; aplica a TODOS los agentes del ecosistema
- `.opencode/agents/workflow-agent.md`: sección 9 "Git Push Protocol" — flujo obligatorio pre-push (analizar cambios → invocar changelog-writer → verificar entrada → incluir en commit → push); sección 9.5 de integración con el árbol de delegación 8.2; nodo `git push` añadido al árbol de decisión de delegación
- `.opencode/agents/changelog-writer.md`: nuevo sub-workflow "Pre-push invocation" — describe cómo el agente debe ser invocado automáticamente antes de push para documentar cambios
- `.opencode/agents/current-instruction.md`: regla 7 — documentación obligatoria antes de git push (referencia a AGENTS.md)
- `.opencode/agents/about.md`: nueva sección "Protocolo de documentación" con referencia a la regla de pre-push
- `.opencode/agents/frontend-reviewer.md`: sección "Git & Documentation Protocol" — prohíbe push directo, obliga coordinación con workflow-agent
- `.opencode/agents/test-writer.md`: sección "Git & Documentation Protocol" — prohíbe push directo, obliga coordinación con workflow-agent

### Changed

- `api/index.js`: mejorado logging (timestamps, contadores ms, env vars) y manejo de errores con try/catch en handler
- `vercel.json`: build command actualizado para incluir migrations deploy antes de prisma generate
- `src/prisma/prisma.service.ts`: bypass de VERCEL env var en constructor (aunque es read-only en runtime)
- `src/redis/redis.module.ts`: mejor manejo de Upstash Redis en producción (lectura de UPSTASH_REDIS_TOKEN)
- `src/main.ts`: export de createApp() con bootstrap condicional
- `.opencode/agents/workflow-agent.md`: auto-mejora completa — 8 gaps corregidos contra especificación 001 (nuevas secciones: formato de output, restricciones, convención de documentación; renumeración de secciones 8→9→10)
- `docs/REGISTRO_IDS.md`: registrados IDs 028, 029, 030

- `.opencode/agents/workflow-agent.md`: ciclo de auto-mejora completo — alineación con especificación `001_DEV_SPEC_WORKFLOW_AGENT_1_0_DRAFT.md`:
  - Sección 1: añadidas referencias a `001_DEV_SPEC` y `025_DEV_REFERENCE`
  - Sección 3: Fase 6 marcada como opcional; nuevas subsecciones 3.1 (forma abreviada) y 3.2 (modo solo-propuesta)
  - Sección 5: nueva subsección 5.1 con 6 reglas "NO hacer" (restricciones de la especificación)
  - Sección 7 (nueva): "Formato de output" — describe propuestas, planes y comunicación con el usuario
  - Sección 8: referencias rápidas actualizadas con los nuevos documentos
  - Secciones renumeradas: Directorio de Agentes 8→9, Git Push Protocol 9→10
  - Sección 10: nueva subsección 10.6 con convención de documentación del proyecto
  - Referencias internas corregidas (9.2→10.2 en Enforcement)
- `workflow/030_DEV_REFERENCE_AGENT_AUTOIMPROVEMENT_1_0_DRAFT.md`: nuevo documento de referencia del proceso de auto-mejora del agente, incluyendo tabla de gaps, cambios realizados y estado post-mejora
- `docs/REGISTRO_IDS.md`: registro del nuevo ID 030 para el documento de auto-mejora

### Changed

- Knowledge base documentation in `/docs/` with 19 files covering architecture, database schema, API specs, business flows, ADRs, and AI agent prompts
- `_opencode.json` project configuration referencing `opencode/big-pickle` model and `prompts/build.txt`
- `prompts/build.txt` with concise build agent instructions (tech stack, commands, patterns, CI)
- `workflow.sh` — script de flujo de programación con agentes IA (7 modos: propose, plan, execute, verify, listen, status, clean/full)
- `workflow/020_DEV_WORKFLOW_1_0_DRAFT.md` — documentación del script workflow.sh
- `docs/frontend/021_API_FRONTEND_SPEC_1_0_DRAFT.md` — especificación frontend basada en Postman (10 módulos, 30+ endpoints)
- `docs/frontend/022_EXEC_FRONTEND_PLAN_1_0_DRAFT.md` — plan de ejecución frontend (7 fases, 22 días estimados)
- `.opencode/agents/workflow-agent.md`: nueva subsección 4.5 "Mejora de agentes subordinados" — capacidad de orquestador para detectar y corregir inconsistencias en agentes de menor jerarquía

### Changed

- `.opencode/agents/about.md`: referencias `opencode.json` corregidas a `_opencode.json` (líneas 150, 161); lista de agentes actualizada con backend-reviewer, frontend-reviewer, workflow-agent y compaction (desactivado)
- `.opencode/agents/current-instruction.md`: indentación corregida en lista de referencias (líneas 117-119 ya no aparecen como sub-items de `_opencode.json`)

### Fixed

- PrismaClient "Prisma has detected that this project was built on Vercel" error — resuelto mediante monkey-patch con configOverride en api/index.js
- `api/index.js`: movido `require("../dist/main")` de handler lazy a scope top-level para que Vercel static file tracing (nft) detecte la dependencia — soluciona `Cannot find module '../dist/main'` en producción
- `vercel.json`: añadido `includeFiles: dist/**` en build config de `api/index.js` para garantizar que `dist/` se incluya en el lambda bundle

- `workflow.sh`: `grep -n` contaminaba `step_num` con números de línea (bug 1)
- `workflow.sh`: subshell en pipe impedía persistencia de `exec_log` (bug 2)
- `workflow.sh`: `set -e` causaba salidas prematuras en errores menores (bug 3)
- `workflow.sh`: templates con `_PENDING_` reemplazados por contenido estructurado (bug 4)
- `workflow.sh`: `echo -e` producía artifacto `-e` en execution_log (P0-3)

### Changed

- `workflow.sh`: `execute()` ahora ejecuta comandos reales con `eval`, soporta `DRY_RUN=true` y `CONTINUE_ON_ERROR=true` (P0-1)
- `workflow.sh`: nuevo flag `--auto` en modo `full` para ciclo sin intervención humana, `AUTO_APPROVE=true` como variable de entorno (P0-2)
- `workflow.sh`: parseo de steps usa `grep -E "^### Paso [0-9]+:"` para evitar falsos positivos (P1-1)
- `workflow.sh`: nuevo rollback git automático al fallar un paso, restaura archivos no commiteados (P1-2)

### Added

- `workflow/023_EXEC_WORKFLOW_IMPROVEMENTS_1_0_DRAFT.md` — plan de mejoras para workflow.sh (9 items, P0-P3)
- `workflow.sh`: nuevo modo `analyze` que escanea `src/` en busca de archivos, endpoints y módulos relevantes, generando `.workflow/context.md` (P2-1)
- `workflow.sh`: modo `ai` (ai-propose) que genera propuestas usando `opencode` con contexto del proyecto (P3-2)

### Changed

- `workflow.sh`: templates de `propose()` y `plan()` ahora inyectan `.workflow/context.md` si existe, reemplazando los hints genéricos con datos concretos del proyecto (P2-2)
- `workflow.sh`: `execute()` guarda checkpoint tras cada paso y puede reanudar desde el último checkpoint si se interrumpe (P3-1)

### Fixed

- `workflow.sh`: `full --auto` ya no llama `await-propuesta`/`await-plan` dos veces (bug: líneas 684-685 y 698-699 duplicaban la espera)

### Changed

- `.opencode/agents/current-instruction.md`: referencia `opencode.json` corregida a `_opencode.json` (línea 115)
- `.opencode/agents/current-instruction.md`: añadidas referencias a `workflow-agent.md`, `workflow.sh` y `024_DEV_GUIDE_WORKFLOW_1_0_DRAFT.md` en sección de referencias (líneas 117-119)
- `.env.example`: añadida documentación para `UPSTASH_REDIS_TOKEN` y `REDIS_URL` de producción (esquema `https://` para Upstash REST API), clarificando la diferencia entre desarrollo local (ioredis TCP) y producción (Upstash REST)

### Fixed

- `vercel.json`: reemplazado preset `"framework": "nestjs"` por build explícito con `@vercel/node` apuntando a `api/index.js` — el preset de NestJS no funcionaba correctamente (seguía mostrando error `"Invalid export in main.js"` aunque el build se completaba)
- `src/main.ts`: bootstrap condicional (`if (!process.env.VERCEL)`) para que `api/index.js` pueda importar `createApp()` sin que `app.listen()` se ejecute en el entorno serverless

### Added

- `api/index.js`: entry point serverless para Vercel — cachea la instancia de NestJS (cold start), envuelve el adaptador Express con una Promise que resuelve en el evento `finish` para compatibilidad con `@vercel/node`

### Removed

- `serverless-http` — incompatible con la firma `(req, res)` de Vercel (espera formato AWS Lambda `(event, context)`); reemplazado por wrapper directo con Promise

---

## [0.1.0] — 2026-05-29

### Added

#### Core Infrastructure

- NestJS 11.1.24 application scaffolded with TypeScript 5.9.3 (strict mode, ES2021 target)
- Global `ValidationPipe` with whitelist, transform, and forbidNonWhitelisted enabled
- Global `HttpExceptionFilter` with structured JSON error responses and request ID tracing
- `x-request-id` middleware — reads header or generates UUID, echoes on every response, logs all HTTP requests
- JSON logging via `JsonLoggerService` (one-line JSON payloads for log aggregators)
- Joi-based environment validation schema for all config vars (`src/config/env.validation.ts`)
- Docker multi-stage build (`node:22-alpine`) with tini init, production-only dependencies
- `docker-compose.yml` with PostgreSQL 16, Redis 7, and API service (health-check dependencies)
- GitHub Actions CI pipeline — PostgreSQL + Redis service containers, full test suite
- Rate limiting via `@nestjs/throttler` with Redis storage (60 req/min global)

#### Database (Prisma + PostgreSQL)

- Prisma 5.22.0 ORM with PostgreSQL provider
- 22 models: `HealthProbe`, `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `Session`, `Address`, `Category`, `Product`, `ProductCategory`, `ProductVariant`, `Inventory`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`, `AuditLog`, `Notification`, `Favorite`, `Review`
- Composite keys on join tables, UUID primary keys, JSONB for flexible attributes
- Soft delete support on `User` and `Product` (`deletedAt` timestamptz)
- Self-referencing `Category` hierarchy via `parentId`
- Seed script — 3 roles (admin, operator, customer), 10 permissions, 4 categories, 5 products with 10 variants, admin user (`admin@tienda.local`)
- Migration `20260526000100_baseline` — initial schema (health_probes, users with telegram_id, roles, permissions, sessions, addresses, categories, products, carts)
- Migration `20260527113724_create_business_entities` — orders, order_items, payments, inventory, audit_logs, notifications, favorites, reviews

#### Authentication & Authorization

- JWT authentication via `@nestjs/jwt` + Passport strategy (HS256, configurable TTL)
- Refresh token rotation — UUID stored as PBKDF2 hash in `Session` table (7-day TTL)
- Three global guards in chain: `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`
- `@Public()` decorator to bypass authentication on specific routes
- `@Roles('admin')` and `@Permissions('products:write')` decorators for fine-grained authorization
- PBKDF2 + SHA-256 password hashing (310,000 iterations, salt:hash hex format)
- Auth endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- Rate limiting on auth endpoints: register (5/min), login (10/min), refresh (5/min)

#### User Management

- Profile CRUD: `GET /users/me`, `PATCH /users/me`
- Address CRUD: `GET /users/me/addresses`, `POST /users/me/addresses`, `PATCH /users/me/addresses/:id`, `DELETE /users/me/addresses/:id`

#### Catalog

- Public read-only catalog: `GET /catalog/categories`, `GET /catalog/products`, `GET /catalog/products/:id`, `GET /catalog/products/:id/variants`
- Public inventory lookup: `GET /catalog/inventory/:variantId`
- Paginated product listing with search, category filter, price range, and sorting

#### Shopping Cart

- Persistent cart per user: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `POST /cart/clear`
- Price snapshot at add time, cart status lifecycle (active → completed)

#### Checkout

- Order creation: `POST /checkout` with idempotency key (Redis-backed, 24h TTL)
- Stock validation before order placement
- Transactional order creation + stock reservation in Prisma `$transaction`
- Automatic cart cleanup on successful checkout

#### Orders

- Order management: `GET /orders`, `GET /orders/:id`, `GET /orders/:id/status`, `POST /orders/:id/cancel`
- Order status machine: `created → stock_reserved → payment_pending → paid/cod_pending → fulfilled/cancelled`
- Cancellable statuses with stock release logic

#### Payments

- Provider pattern via `PaymentProvider` interface with factory
- `MockPaymentProvider` — auto-approves for development/testing
- `CodPaymentProvider` — cash on delivery flow
- Payment intent: `POST /payments/:orderId/intent`
- Payment confirmation: `POST /payments/:orderId/confirm`
- Webhook processing: `POST /payments/webhooks/mock` with HMAC guard and Redis idempotency
- Webhook events: `payment.completed`, `payment.failed`, `payment.refunded`

#### Inventory

- Stock availability: `GET /inventory/variants/:variantId`
- Internal stock operations: reserve, release, confirm deduction (used by checkout and payments)

#### Admin

- Admin-only controller (`@Roles('admin')`) with full CRUD:
  - Orders: list, detail, status update
  - Products: list, detail, create, update, soft delete
  - Variants: create, update, delete
  - Inventory: list (with low-stock filter), update

#### Health

- `GET /health` endpoint checking PostgreSQL connectivity (`SELECT 1`) and Redis (`PING`)
- Response format: `{ status, service, timestamp, checks: { database, redis } }`

#### API Documentation

- Swagger UI at `api/v1/docs` with Bearer JWT authentication
- DTOs decorated with `@ApiProperty()` for auto-generated OpenAPI spec
- All endpoints documented with `@ApiTags`, `@ApiOkResponse`, `@ApiBearerAuth`

#### Testing

- 14 unit test suites with Jest (89 tests), coverage thresholds: branches 60%, functions 70%, lines 75%, statements 75%
- 7 E2E test suites (supertest, 120s timeout): app, auth, catalog, cart, checkout, orders, payments
- Health check helper for E2E tests verifying DB + Redis connectivity before each suite
- Jest setup file with safe defaults for required environment variables
- Provider unit tests for `MockPaymentProvider` and `CodPaymentProvider`

#### DevOps

- Postman collection with Newman config for API testing
- `.env.example` with all configurable environment variables
- `.dockerignore` and `.gitignore` for clean builds

### Changed

- Restructured from broken monorepo (`service/api/` with workspace paths `services/*`) to single flat package
- Fixed `package.json` — removed workspace references, corrected scripts (build, test, DB commands)
- Updated `Dockerfile` — flat paths instead of nested monorepo structure
- Fixed `tsconfig.build.json` to exclude `test/` directory from production builds

### Removed

- All `telegram_id` references — removed from `User` model, source code (14 files), Prisma schema, seed, Postman collection, and configuration
- Migration `20260529193900_remove_telegram_fields` — drops `telegram_id` column and its two indexes (`users_telegram_id_key`, `users_telegram_idx`)
- Monorepo workspace configuration and related tooling

### Security

- PBKDF2 + SHA-256 password hashing (310,000 iterations) — not bcrypt
- JWT access token with configurable TTL (default 15min)
- Refresh token rotation — old session deleted on each refresh
- HMAC-signed webhook verification via `HmacWebhookGuard`
- Idempotency keys preventing duplicate order and webhook processing
- CORS with configurable origin whitelist

---

## [0.0.1] — 2026-05-26

### Added

- Initial NestJS project scaffold with `@nestjs/cli`
- Prisma ORM setup with PostgreSQL datasource
- Docker Compose with PostgreSQL 16 and Redis 7
- Basic module structure and configuration loading

---

_Template: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/spec/v2.0.0.html)_
