---
id: 011
area: api
type: API
module: admin
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - admin
  - management
summary: "Especificación de la API de administración: CRUD de pedidos, productos, variantes e inventario para usuarios con rol admin."
keywords:
  - administracion
  - admin
  - crud
  - productos
  - pedidos
  - inventario
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Admin API — Administrative Operations

## Base Path: `api/v1/admin`

All endpoints require JWT + @Roles('admin').

## Endpoints

### Orders

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/orders | List all orders (paginated, filterable by status/date) |
| GET | /admin/orders/:id | Get order detail with items + payments |
| PATCH | /admin/orders/:id/status | Update order status |

### Products

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/products | List all products (incl. inactive, paginated, searchable) |
| GET | /admin/products/:id | Get product detail with variants + categories |
| POST | /admin/products | Create product with category associations |
| PATCH | /admin/products/:id | Update product |
| DELETE | /admin/products/:id | Soft delete product (sets deletedAt) |

### Variants

| Method | Path | Description |
|--------|------|-------------|
| POST | /admin/products/:id/variants | Create variant for product |
| PATCH | /admin/variants/:id | Update variant |
| DELETE | /admin/variants/:id | Delete variant |

### Inventory

| Method | Path | Description |
|--------|------|-------------|
| GET | /admin/inventory | List inventory (paginated, optional lowStock filter) |
| PATCH | /admin/inventory/:variantId | Update quantity, reserved, safetyStock |

## Admin Seeded Account

- Email: `admin@tienda.local`
- Password: `Admin123!`
- Role: admin (all 10 permissions)
