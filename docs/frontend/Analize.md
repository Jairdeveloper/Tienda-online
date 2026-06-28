Here is a comprehensive report of my findings.
---
1. All API Modules and Their Key Endpoints
Prefix: api/v1/ (configurable). Every route requires JWT by default (three global guards: JwtAuthGuard -> RolesGuard -> PermissionsGuard). Use @Public() decorator to bypass.
Module	Base Path	Key Endpoints
Health	/health	GET /health — DB + Redis health check
Auth	/auth	POST /auth/register (rate: 5/min), POST /auth/login (10/min), POST /auth/refresh (5/min), POST /auth/logout, GET /auth/me, GET /auth/status
Catalog	/catalog	GET /catalog/categories, GET /catalog/products (paginated, filtered), GET /catalog/products/:id, GET /catalog/products/:id/variants, GET /catalog/inventory/:variantId, GET /catalog/status
Cart	/cart	GET /cart, POST /cart/items, PATCH /cart/items/:id, DELETE /cart/items/:id, POST /cart/clear, GET /cart/status
Checkout	/checkout	POST /checkout — creates order from cart (idempotent via Redis key)
Orders	/orders	GET /orders (paginated, filtered), GET /orders/:id, POST /orders/:id/cancel, GET /orders/:id/status
Payments	/payments	POST /payments/:orderId/intent, POST /payments/:orderId/confirm, POST /payments/webhooks/mock
Users	/users	GET /users/me, PATCH /users/me, GET /users/me/addresses, POST /users/me/addresses, PATCH /users/me/addresses/:id, DELETE /users/me/addresses/:id
Inventory	/inventory	GET /inventory/variants/:variantId, GET /inventory/status
Admin	/admin	Orders: GET /admin/orders, GET /admin/orders/:id, PATCH /admin/orders/:id/status; Products: full CRUD; Variants: create/update/delete; Inventory: list + update
Each module also exposes a GET /<module>/status health-check endpoint (public).
---
2. Tech Stack Summary (Backend + Frontend Requirements)
Current Backend Stack
Layer	Technology
Runtime	Node.js 22 (Alpine)
Framework	NestJS 11.1.24
Language	TypeScript 5.9.3 (strict mode, ES2021, decorators)
ORM / DB	Prisma 5.22.0 + PostgreSQL 16
Cache / Session	Redis 7 (via ioredis 5.11.0)
Auth	Passport.js + JWT (HS256), refresh token rotation
Password Hashing	PBKDF2 + SHA-256, 310k iterations, salt:hash hex format
Validation	class-validator 0.14.4 + class-transformer 0.5.1
API Docs	Swagger (swagger-ui-express 5.0.1) at api/v1/docs
Rate Limiting	@nestjs/throttler 6.5.0 (Redis-backed, 60 req/min global)
Container	Docker multi-stage (node:22-alpine) + docker-compose (PostgreSQL + Redis)
CI	GitHub Actions (PostgreSQL + Redis as service containers)
Testing	Jest 29.7 + supertest 7.2.2 (89 unit tests, E2E tests)
Frontend Requirements (what a frontend would need to consume this API)
- API Base URL: http://<host>:3000/api/v1/
- Authentication: Bearer JWT token in Authorization header; refresh token rotation
- Required env vars for frontend dev: VITE_API_URL, VITE_API_PREFIX
- CORS: Configured for http://localhost:3000,http://localhost:5173 in .env.example (Vite-friendly)
- RBAC: 3 roles (customer, admin, operator) with 10 granular permissions
- Public endpoints: Health, auth (register/login/refresh), catalog (products/categories/inventory)
- Authenticated endpoints: Cart, checkout, orders, payments, user profile, addresses
- Admin endpoints: All admin CRUD operations (products, orders, variants, inventory)
---
3. Data Models (Prisma Schema Summary)
22 models in total. Key entities:
Model	Key Fields
User	id, email (unique), name, phone, passwordHash, metadata, deletedAt
Role	id, name (unique), description
Permission	id, key (unique), description
RolePermission	roleId, permissionId
UserRole	userId, roleId, assignedAt
Session	id, userId, sessionToken, refreshTokenHash, ip, userAgent, expiresAt
Address	id, userId, label, street, city, state, country, postalCode, phone, isDefault
Category	id, parentId (self-ref), name, slug (unique), metadata
Product	id, sku (unique), name, description, attributes, metadata, isActive, deletedAt
ProductCategory	productId, categoryId
ProductVariant	id, productId, sku (unique), price (Decimal), listPrice, attributes, barcode
Inventory	id, variantId (unique), locationId, quantity, reserved, safetyStock
Cart	id, userId, sessionToken, status
CartItem	id, cartId, variantId, quantity, priceSnapshot
Order	id, userId, externalId (unique), status, total, currency, shippingAddress, billingAddress, paymentSnapshot, deletedAt
OrderItem	id, orderId, variantId, qty, unitPrice, totalPrice
Payment	id, orderId, provider, providerPaymentId, amount, currency, status, rawResponse
AuditLog	id, tableName, recordId, action, userId, diff
Notification	id, userId, channel, payload, status, sentAt
Favorite	id, userId, productId
Review	id, userId, productId, rating, title, body, metadata
---
## 4. Existing Frontend or Bot Code
**There is NO frontend code and NO bot code in this project.** This repository is purely a backend API (`@tienda/api` -- a NestJS application). Specifically:
- **No frontend framework** (React, Vue, Angular, etc.) is installed as a dependency or present in any directory.
- **No bot/chat/telegram** code exists. The prisma schema had a `telegram_id` on User that was removed in migration 3 (`20260529193900_remove_telegram_fields`), and the AGENTS.md explicitly notes "telegram_id removed from User".
- **No webhook consumers** other than the mock payment webhook endpoint.
- **The only client-facing artifacts** are:
  - A **Postman collection** at `postman/tienda-api.postman_collection.json` with Newman config for API testing
  - **Swagger UI** auto-generated docs (served at `api/v1/docs`)
---
5. Docs Structure (19 documents)
The docs/ directory contains a well-organized knowledge base:
Directory	Documents
MASTER_INDEX.md	System map, module dependency table, naming conventions, tag vocabulary
REGISTRO_IDS.md	Central registry of all document IDs
architecture/	001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md
database/	002_DB_PRISMA_SCHEMA_1_0_DRAFT.md
api/	003_API_AUTH through 011_API_ADMIN (9 specs)
flows/	Auth flow, checkout flow, payment flow (3 docs)
decisions/	3 ADRs: Database, Auth JWT+RBAC, Payments Provider Pattern
prompts/	018_PRM_BUILD_AGENT_1_0_DRAFT.md (build agent prompt conventions)
ai/	019_AI_KNOWLEDGE_BASE_1_0_DRAFT.md (AI agent knowledge base)
security/, devops/, archive/	Placeholders for future docs
All docs follow a formal convention: [ID]_[AREA]_[TIPO]_[MODULO]_[VERSION]_[ESTADO].md with YAML frontmatter and controlled tag vocabulary.
---
Key File Paths
- Root config: /home/john/tienda-online/Tienda-online-agnostica/package.json
- Prisma schema: /home/john/tienda-online/Tienda-online-agnostica/prisma/schema.prisma
- Seed data: /home/john/tienda-online/Tienda-online-agnostica/prisma/seed.ts
- App module: /home/john/tienda-online/Tienda-online-agnostica/src/app.module.ts
- Controllers: All under /home/john/tienda-online/Tienda-online-agnostica/src/<module>/
- API docs: /home/john/tienda-online/Tienda-online-agnostica/docs/api/
- System overview: /home/john/tienda-online/Tienda-online-agnostica/docs/architecture/001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md
- Docker compose: /home/john/tienda-online/Tienda-online-agnostica/docker-compose.yml
- Master index: /home/john/tienda-online/Tienda-online-agnostica/docs/MASTER_INDEX.md
- Postman collection: /home/john/tienda-online/Tienda-online-agnostica/postman/tienda-api.postman_collection.json