---
id: 016
area: decisions
type: ADR
module: auth
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies: []
tags:
  - adr
  - auth
  - jwt
  - rbac
  - security
summary: "ADR sobre JWT + RBAC con permisos granulares para autenticación y autorización, incluyendo estrategia de tokens, guards y alternativas."
keywords:
  - adr
  - autenticacion
  - jwt
  - rbac
  - seguridad
  - autorizacion
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# ADR: JWT Authentication + RBAC Authorization

## Status

Accepted

## Context

The e-commerce platform requires:
1. **Authentication** — Verify user identity on every request
2. **Authorization** — Role-based access control for admin, operator, customer
3. **Performance** — No database lookup on every request for auth verification
4. **Statelessness** — API should be horizontally scalable without shared session store
5. **Fine-grained permissions** — Beyond simple roles, need permission-level checks

## Decision

Use **JWT (JSON Web Tokens)** for authentication and **RBAC with granular permissions** for authorization.

### Architecture

```
3 Global Guards (applied in order):
1. JwtAuthGuard (Passport) — Validates Bearer token, extracts { sub, email, roles, permissions }
2. RolesGuard — Checks @Roles() decorator against user.roles
3. PermissionsGuard — Checks @Permissions() decorator against user.permissions

Decorators:
- @Public() — Bypasses JwtAuthGuard entirely
- @Roles('admin') — Requires specific role
- @Permissions('products:write') — Requires specific permission
- @CurrentUser() — Injects authenticated user into controller
```

### Token Strategy

- **Access token**: JWT signed with HS256, 15min TTL, contains roles/permissions in payload
- **Refresh token**: UUID v4, stored as PBKDF2 hash in Session table, 7-day TTL
- **Password**: PBKDF2 + SHA-256, 310k iterations, salt:hash hex format

## Alternatives Considered

| Alternative | Reason Rejected |
|-------------|----------------|
| Session cookies | Requires server-side session store, not stateless |
| OAuth2 delegation | Overkill for a single-service backend, adds complexity |
| API keys | No user identity binding, harder to revoke |
| Only RBAC (no permissions) | Insufficient granularity for fine access control |

## Consequences

### Positive
- Stateless auth allows horizontal scaling
- Roles + permissions provide both coarse and fine-grained access control
- JWT payload carries identity without DB lookup
- Refresh token rotation improves security
- @Public() decorator makes public routes explicit

### Negative
- JWT revocation requires short TTL or blacklist (Redis-based)
- Token payload size grows with permissions list
- 3 global guards add complexity to the guard chain
- PBKDF2 310k iterations has CPU cost on registration/login

## Related

- AuthService: src/auth/auth.service.ts
- JWT Strategy: src/auth/strategies/
- Guards: src/auth/guards/
- Permission seed: prisma/seed.ts (3 roles, 10 permissions)
- Env vars: JWT_SECRET, JWT_ACCESS_TTL, JWT_REFRESH_TTL
