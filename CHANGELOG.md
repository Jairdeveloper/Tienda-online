# Changelog

All notable changes to **@tienda/api** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Fixed

- BotService DI crash on Vercel: BotService constructor had `config: ConfigType<typeof botConfig>` parameter without `@Inject(botConfig.KEY)` decorator, causing NestJS `UndefinedDependencyException` during provider instantiation. This crashed the Vercel Lambda with `FUNCTION_INVOCATION_FAILED` because the error was unhandled.
  - `apps/api/src/bot/bot.service.ts`: added `@Inject(botConfig.KEY)` decorator to config parameter
  - Root cause: missing `@Inject()` on config namespace injection

- Vercel Lambda require path resolution: `api/index.js` used relative paths like `require("../dist/main")` which failed with `MODULE_NOT_FOUND` on Vercel's Rust-based Node.js runtime (`/opt/rust/nodejs.js`). Changed to absolute paths using `path.join(__dirname, ...)`.
  - `apps/api/api/index.js`: changed from relative `require("../dist/main")` to absolute `require(path.join(__basedir, "dist", "main"))`
  - Root cause: Vercel's custom module loader doesn't support relative require paths

- DTO strict property initialization: `bot-response.dto.ts` was missing `!` (definite assignment assertion) on properties, causing `TS2564` build errors under strict mode.
  - `apps/api/src/bot/dto/bot-response.dto.ts`: added `!` to all non-optional properties
  - Root cause: TypeScript strict mode requires definite assignment for uninitialized properties

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

_Template: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/spec/v2.0.0.html)