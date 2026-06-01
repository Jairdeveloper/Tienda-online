# @tienda/api — Agent Guide

## Repository

```
/
├── src/                    # NestJS application source
│   ├── main.ts             # Bootstrap, global middleware (x-request-id), Swagger
│   ├── app.module.ts       # Root module: all domain modules + 3 global guards
│   ├── config/             # Joi env validation schema
│   ├── common/             # @Global() JsonLoggerService, CacheService, HttpExceptionFilter
│   ├── prisma/             # @Global() PrismaService (extends PrismaClient)
│   ├── redis/              # @Global() RedisService, RedisLockService, REDIS_CLIENT token
│   ├── auth/               # JWT auth, RBAC guards, strategies, decorators
│   ├── users/              # User CRUD, addresses
│   ├── catalog/            # Product catalog, categories
│   ├── inventory/          # Stock by variant
│   ├── cart/               # Persistent cart per user/session
│   ├── checkout/           # Checkout flow
│   ├── orders/             # Orders + order items
│   ├── payments/           # Payment processing (provider pattern)
│   ├── admin/              # Admin operations
│   └── types/              # Express Request augmentation (requestId, user)
├── prisma/
│   ├── schema.prisma       # 22 models (telegram_id removed from User)
│   ├── migrations/         # 3 migrations (baseline, business entities, remove telegram)
│   └── seed.ts             # Roles, permissions, 4 categories, 5 demo products, admin user
├── test/                   # E2E tests (Jest, supertest, 120s timeout)
├── dist/                   # Build output (gitignored)
├── .github/workflows/      # CI pipeline
├── Dockerfile              # Multi-stage build (fixed flat paths)
├── docker-compose.yml      # PostgreSQL + Redis + API
├── package.json            # Single package (no monorepo workspaces)
├── .gitignore
├── .env.example
└── postman/                # API collection + Newman config
```

## Commands (run from repo root)

```sh
npm run build              # nest build (deleteOutDir: true — cleans dist first)
npm run start              # nest start
npm run start:dev          # nest start --watch
npm run start:debug        # nest start --debug --watch
npm run start:prod         # node dist/main
npm run test               # jest (src/**/*.spec.ts, coverage threshold enforced)
npm run test:watch         # jest --watch
npm run test:e2e           # jest --config ./test/jest-e2e.json (needs DB + Redis)
npm run db:generate        # prisma generate
npm run db:migrate:dev     # prisma migrate dev (creates new migration)
npm run db:migrate:deploy  # prisma migrate deploy (apply existing migrations)
npm run db:migrate:status  # prisma migrate status
npm run db:seed            # prisma db seed (uses ts-node prisma/seed.ts)
```

## Env vars

**Required** — app crashes without these:

- `JWT_SECRET` — min 8 chars
- `DATABASE_URL` — `postgresql://` or `postgres://` URI
- `REDIS_URL` — `redis://` or `rediss://` URI

**Key optional** (defaults work for dev):

- `PORT=3000`, `API_PREFIX=api/v1`, `CORS_ENABLED=true`, `CORS_ORIGIN` (comma-separated, '' = all origins)
- `SWAGGER_ENABLED=true`, `SWAGGER_PATH=docs`
- `JWT_ACCESS_TTL=900`, `JWT_REFRESH_TTL=604800`
- `WEBHOOK_SECRET=dev-webhook-secret-change-in-production`
- `NODE_ENV=development`, `LOG_LEVEL=log`

Full schema: `src/config/env.validation.ts` (Joi). Config loads from single `.env` file.

## Architecture

- **Every route requires JWT by default.** Three global guards apply chain: `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`. Use `@Public()` to bypass. `@Roles()` and `@Permissions()` refine access.
- **Global modules** (`@Global()`): `PrismaModule`, `RedisModule`, `CommonModule`. Their providers available everywhere without re-importing.
- **API prefix**: `api/v1` by default. Swagger UI at `api/v1/docs` when enabled.
- **Request ID**: `x-request-id` read from header (or generated), echoed on every response via middleware in `main.ts`.
- **Validation**: Global `ValidationPipe` with `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`.
- **Auth**: `JwtStrategy` extracts bearer token, validates against `JWT_SECRET`. Payload shape: `{ sub, email, roles, permissions }`.
- **Password hashing**: PBKDF2 + SHA-256 (310k iterations), `salt:hash` hex format. **Not bcrypt.**

## Testing

- **Unit tests**: `npm run test` — 14 suites, 89 tests. Coverage thresholds: branches 60%, functions 70%, lines 75%, statements 75%.
- **E2E tests**: `npm run test:e2e` — `*.e2e-spec.ts` in `test/`, timeout 120s. **Requires PostgreSQL and Redis running.** `test/helpers/health-check.ts` verifies connectivity before every suite. `test/jest.setup.ts` sets safe defaults for required env vars.
- **Seed**: Creates roles (customer, admin, operator), 10 permissions, 4 categories, 5 products with variants, and admin user (`admin@tienda.local` / `Admin123!`).

## CI

GitHub Actions workflow in `.github/workflows/ci.yml`:

- Runs on push/PR to `main`
- Spins up PostgreSQL + Redis as service containers
- `npm ci` → `prisma generate` → `prisma migrate deploy` → `npm run build` → `npm test` → `npm run test:e2e`

## Production URLs

- **Backend API**: `https://tienda-online-zped08s-projects.vercel.app` (prefix `/api/v1`)
- **Frontend SPA**: `https://tienda-frontend-self.vercel.app`

## Package identity

- **Scope**: `@tienda/api` (private, not published)
- **TypeScript**: 5.9.3, strict mode, ES2021 target, decorators enabled
- **Node**: 22-alpine
- **No linter, no formatter** — add if needed

## Documentation Convention

The project follows a formal documentation convention defined in `algoritmos/propuesta-convencion-documentacion.md`. Key points:

- **Naming**: `[ID]_[AREA]_[TIPO]_[MODULO]_[VERSION]_[ESTADO].md` (e.g. `003_API_AUTH_1_0_DRAFT.md`)
- **Frontmatter**: Every `.md` doc has YAML frontmatter with `id`, `area`, `type`, `module`, `version`, `status`, `tags`, `summary`, `keywords`, `changelog`
- **Tags**: Controlled vocabulary per section 3 of the convention proposal
- **Status lifecycle**: DRAFT → REVIEW → ACTIVE → STALE → DEPRECATED
- **ID registry**: All document IDs tracked in `docs/REGISTRO_IDS.md`

See `algoritmos/propuesta-convencion-documentacion.md` for full details.

## Workflow Script

- `workflow.sh` in repo root — implements the agent programming flow algorithm
- Documentation: `workflow/020_DEV_WORKFLOW_1_0_DRAFT.md`

## Git & Documentation Protocol

**Every agent in the ecosystem MUST follow this protocol before any `git push`:**

### Mandatory documentation update

1. Before executing `git push`, the orchestrating agent **MUST** update `CHANGELOG.md` with an entry in the `[Unreleased]` section describing the changes about to be pushed
2. The changelog entry MUST include: what changed, which files were modified, and the reason for the change
3. Use the `changelog-writer` agent (`.opencode/agents/changelog-writer.md`) to generate the entry — it knows the correct format (Keep a Changelog + SemVer)

### Scope

- This rule applies to **ALL agents** in the ecosystem, regardless of tool permissions
- Agents with write/edit/bash tools that can execute `git push` MUST NOT push until changelog is updated
- Agents without write tools (read-only) MUST raise a warning if they detect changes that aren't documented

### Exception

- Trivial fixes (typos in comments, formatting) that don't affect functionality may skip changelog update at the orchestrator's discretion

### Enforcement

- The `workflow-agent` (`.opencode/agents/workflow-agent.md`) is responsible for enforcing this protocol
- Before any push operation, the workflow-agent MUST invoke `changelog-writer` to document the changes
- After push, verify that `CHANGELOG.md` was committed alongside the code changes

## ⚠️ Critical: Node.js Safety

Nunca ejecutar Node.js automáticamente. Todo `npm`, `node`, `prisma`, `jest`
debe ejecutarse manualmente hasta que se logre estabilizar el script
`workflow.sh`. Los timeouts de herramientas externas pueden interrumpir la
ejecución de estos comandos y causar estados inconsistentes.
