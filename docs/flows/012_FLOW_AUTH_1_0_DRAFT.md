---
id: 012
area: flows
type: FLOW
module: auth
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 003
tags:
  - flow
  - auth
  - jwt
  - authentication
summary: "Diagramas de flujo de autenticación: registro, login, refresh de tokens y cadena de guards JWT + Roles + Permisos."
keywords:
  - flujo
  - autenticacion
  - auth
  - jwt
  - registro
  - login
  - refresh
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Authentication Flow

## Registration Flow

```
Client                    AuthService                    Prisma
  │                           │                            │
  │  POST /auth/register      │                            │
  │─────────────────────────► │                            │
  │                           │  Check unique email        │
  │                           │───────────────────────────►│
  │                           │◄── existing? ─────────────│
  │                           │                            │
  │                           │  Hash password (PBKDF2)    │
  │                           │  310k iterations           │
  │                           │                            │
  │                           │  Get customer role         │
  │                           │───────────────────────────►│
  │                           │◄── role id ───────────────│
  │                           │                            │
  │                           │  Create user + UserRole    │
  │                           │───────────────────────────►│
  │                           │◄── user ──────────────────│
  │                           │                            │
  │                           │  Generate JWT + refresh    │
  │                           │  Create Session            │
  │                           │───────────────────────────►│
  │                           │                            │
  │  { user, tokens }         │                            │
  │◄───────────────────────── │                            │
```

## Login Flow

```
Client                    AuthService                    Prisma
  │                           │                            │
  │  POST /auth/login         │                            │
  │─────────────────────────► │                            │
  │                           │  Find user by email        │
  │                           │  Include roles+permissions │
  │                           │───────────────────────────►│
  │                           │◄── user ──────────────────│
  │                           │                            │
  │                           │  Verify password           │
  │                           │  PBKDF2(salt + input)      │
  │                           │  === stored hash?          │
  │                           │                            │
  │                           │  Generate JWT (15min)      │
  │                           │  Generate refresh (UUID)   │
  │                           │  Create Session            │
  │                           │───────────────────────────►│
  │                           │                            │
  │  { user, tokens }         │                            │
  │◄───────────────────────── │                            │
```

## Token Refresh Flow

```
Client                    AuthService                    Prisma
  │                           │                            │
  │  POST /auth/refresh       │                            │
  │  { refreshToken }         │                            │
  │─────────────────────────► │                            │
  │                           │  Hash refresh token        │
  │                           │  Find session by hash      │
  │                           │  Check expiresAt > now     │
  │                           │───────────────────────────►│
  │                           │◄── session ───────────────│
  │                           │                            │
  │                           │  Delete old session        │
  │                           │───────────────────────────►│
  │                           │                            │
  │                           │  Generate new JWT + refresh│
  │                           │  Create new Session        │
  │                           │───────────────────────────►│
  │                           │                            │
  │  { user, tokens }         │                            │
  │◄───────────────────────── │                            │
```

## Guard Chain

```
Incoming Request
      │
      ▼
┌─────────────┐
│ JwtAuthGuard │ ← Checks Bearer token, skips if @Public()
└──────┬──────┘
       │ authenticated
       ▼
┌─────────────┐
│  RolesGuard  │ ← Checks @Roles() against user.roles
└──────┬──────┘
       │ authorized
       ▼
┌─────────────────┐
│PermissionsGuard  │ ← Checks @Permissions() against user.permissions
└────────┬────────┘
         │ authorized
         ▼
    Controller
```

## JWT Payload

```json
{
  "sub": "uuid-user-id",
  "email": "user@example.com",
  "roles": ["customer"],
  "permissions": ["products:read"],
  "iat": 1680000000,
  "exp": 1680000900
}
```
