---
id: 001
area: architecture
type: ARCH
module: system
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies: []
tags:
  - architecture
  - system-design
  - nestjs
  - overview
summary: "Descripción de la arquitectura del sistema @tienda/api: tech stack, capas, módulos globales, diseño de API, seguridad y servicios Docker."
keywords:
  - arquitectura
  - nestjs
  - sistema
  - capas
  - modular
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# System Architecture Overview

## Tech Stack

- **Runtime:** Node.js 22 (Alpine)
- **Framework:** NestJS 11.1.24
- **Language:** TypeScript 5.9.3 (strict mode, ES2021, decorators)
- **ORM:** Prisma 5.22.0 (PostgreSQL)
- **Cache/Session:** Redis 7 (ioredis 5.11.0)
- **Auth:** Passport.js + JWT (PBKDF2+SHA256 password hashing)
- **API Docs:** Swagger (swagger-ui-express 5.0.1)
- **Validation:** class-validator + class-transformer (global ValidationPipe)
- **Rate Limiting:** @nestjs/throttler with Redis storage
- **Container:** Docker multi-stage build + docker-compose

## Layered Architecture

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

## Global Middleware (in main.ts)

1. **x-request-id** — reads header or generates UUID, echoes in response, logs all requests
2. **ValidationPipe** — whitelist: true, transform: true, forbidNonWhitelisted: true
3. **HttpExceptionFilter** — JSON error responses
4. **Three global guards** — JwtAuthGuard → RolesGuard → PermissionsGuard (chain)

## Global Modules (@Global())

- **PrismaModule** — PrismaService (extends PrismaClient), available everywhere
- **RedisModule** — RedisService, RedisLockService, REDIS_CLIENT token
- **CommonModule** — JsonLoggerService, CacheService, HttpExceptionFilter

## API Design

- Base path: `api/v1` (configurable via API_PREFIX)
- Auth: JWT bearer token in Authorization header
- Public routes: decorated with @Public() (bypasses JwtAuthGuard)
- RBAC: @Roles('admin') / @Permissions('products:write') decorators
- Response format: JSON, with x-request-id header on every response

## Security

- Password hashing: PBKDF2 + SHA-256, 310,000 iterations, salt:hash hex format
- JWT: access token (default 15min) + refresh token (UUID, default 7 days)
- Rate limiting: 60 requests/minute globally (Redis-backed)
- CORS: configurable origins (comma-separated, empty = all origins)
- Soft delete: users and products use deletedAt field
- Idempotency: checkout and webhook processing use Redis keys
- Webhook: HMAC verification via HmacWebhookGuard

## Docker Services

1. **postgres** (16-alpine) — port 5432, health check via pg_isready
2. **redis** (7-alpine) — port 6380, health check via redis-cli ping
3. **api** — Node 22-alpine multi-stage build, depends on healthy postgres+redis
