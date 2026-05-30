---
id: 009
area: api
type: API
module: users
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - users
  - profile
  - addresses
summary: "Especificación de la API de usuarios: perfil, actualización de datos personales y CRUD de direcciones de envío."
keywords:
  - usuarios
  - perfil
  - direcciones
  - users
  - profile
  - addresses
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Users API — Profile & Addresses

## Base Path: `api/v1/users`

All endpoints require JWT (@ApiBearerAuth).

## Endpoints

### `GET /users/me`
- Returns current user profile with roles and permissions
- Response: `{ id, email, name, phone, roles[], permissions[], createdAt }`

### `PATCH /users/me`
- **Body:** `{ name?, phone? }`
- Updates user profile fields

### `GET /users/me/addresses`
- Returns all saved addresses for current user
- Response: `[{ id, label, street, city, state, country, postalCode, phone, isDefault }]`

### `POST /users/me/addresses`
- **Body:** `{ label?, street, city, state?, country, postalCode?, phone?, isDefault?, meta? }`
- Creates new address for current user

### `PATCH /users/me/addresses/:id`
- **Body:** Partial address fields
- Updates address (must belong to user)

### `DELETE /users/me/addresses/:id`
- Deletes address (must belong to user)
- Returns 204 No Content
