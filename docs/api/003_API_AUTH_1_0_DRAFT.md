---
id: 003
area: api
type: API
module: auth
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - auth
  - jwt
  - rbac
  - authentication
summary: "Especificación de la API de autenticación: registro, login, refresh, logout, perfil, tokens JWT, guards, roles y permisos."
keywords:
  - autenticacion
  - jwt
  - rbac
  - auth
  - tokens
  - login
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Auth API — JWT Authentication & RBAC

## Base Path: `api/v1/auth`

## Endpoints

### `POST /auth/register`
- **Auth:** @Public, rate limited (5/min)
- **Body:** `{ email, password, name?, phone? }`
- **Response:** `{ user: { id, email, name, roles, permissions }, tokens: { accessToken, refreshToken, expiresIn } }`
- **Logic:** Creates user with customer role, returns JWT tokens

### `POST /auth/login`
- **Auth:** @Public, rate limited (10/min)
- **Body:** `{ email, password }`
- **Response:** Same as register
- **Logic:** Validates email+password via PBKDF2, creates session, returns tokens

### `POST /auth/refresh`
- **Auth:** @Public, rate limited (5/min)
- **Body:** `{ refreshToken }`
- **Response:** Same as register
- **Logic:** Validates refresh token hash, deletes old session, creates new

### `POST /auth/logout`
- **Auth:** JWT required
- **Body:** `{ refreshToken }`
- **Response:** `{ message }`
- **Logic:** Deletes session matching refresh token hash

### `GET /auth/me`
- **Auth:** JWT required
- **Response:** `{ id, email, name, roles, permissions }`
- **Logic:** Fetches user from DB with roles/permissions

## Token Format

### Access Token (JWT)
- Payload: `{ sub: userId, email, roles: string[], permissions: string[] }`
- Signed with JWT_SECRET, default TTL: 900s (15min)
- Sent as Bearer token in Authorization header

### Refresh Token
- UUID v4, stored as PBKDF2 hash (1 iteration) in Session table
- Default TTL: 604800s (7 days)

## Guards Applied

- Rate limiting (ThrottlerGuard): register(5/min), login(10/min), refresh(5/min)
- JWT required on logout and me
- @Public() bypasses on register, login, refresh, status

## Roles & Permissions

| Role     | Permissions |
|----------|------------|
| customer | products:read |
| admin    | All 10 permissions |
| operator | products:read, orders:read, orders:write, inventory:read |

## Password Hashing

- Algorithm: PBKDF2 + SHA-256, 310,000 iterations
- Format: `salt:hash` (hex), 16-byte salt + 32-byte hash
- Stored in `User.passwordHash` TEXT column
