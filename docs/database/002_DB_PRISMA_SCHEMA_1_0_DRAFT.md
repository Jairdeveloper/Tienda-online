---
id: 002
area: database
type: DB
module: schema
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies: []
tags:
  - database
  - prisma
  - postgresql
  - schema
summary: "Esquema completo de base de datos PostgreSQL con 22 modelos Prisma: relaciones, campos, índices, joins y migraciones."
keywords:
  - base de datos
  - prisma
  - postgresql
  - modelos
  - schema
  - migraciones
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Database Schema — Prisma 22 Models

## ER Overview

```
User ──┬── UserRole ─── Role ─── RolePermission ─── Permission
       ├── Session
       ├── Address
       ├── Cart ─── CartItem ─── ProductVariant
       ├── Order ─── OrderItem ─── ProductVariant
       ├── Payment
       ├── AuditLog
       ├── Notification
       ├── Favorite ─── Product
       └── Review ──── Product

Product ─── ProductCategory ─── Category
Product ─── ProductVariant ─── Inventory
```

## Models Detail

### HealthProbe
- `id` (UUID, PK)
- `createdAt` (timestamp)
- Technical table for DB connectivity health checks

### User
- `id` (UUID, PK), `email` (unique, VARCHAR(320)), `name`, `phone`
- `passwordHash` (TEXT, salt:hash hex)
- `metadata` (JSONB), `deletedAt` (timestamp, soft delete)
- Relations: roles, sessions, addresses, carts, orders, auditLogs, notifications, favorites, reviews

### Role
- `id` (UUID, PK), `name` (unique, VARCHAR(100)), `description`
- Seeded: `customer`, `admin`, `operator`

### Permission
- `id` (UUID, PK), `key` (unique, VARCHAR(150)), `description`
- Seeded: 10 permissions (products:read/write, orders:read/write, users:read/write, inventory:read/write, payments:read/write)

### RolePermission
- Join table: roleId + permissionId (composite PK)
- Cascade delete on both FK

### UserRole
- Join table: userId + roleId (composite PK)
- `assignedAt` timestamp
- Cascade delete on user FK

### Session
- `id`, `userId`, `sessionToken` (unique), `refreshTokenHash`, `ip`, `userAgent`, `expiresAt`
- Indexed on userId

### Address
- `id`, `userId`, `label`, `street`, `city`, `state`, `country`, `postalCode`, `phone`, `meta` (JSONB), `isDefault`
- Cascade delete on user FK

### Category
- `id`, `parentId` (self-referencing), `name`, `slug` (unique), `metadata` (JSONB)
- Self-relation for category tree hierarchy

### Product
- `id`, `sku` (unique), `name`, `description`, `attributes` (JSONB), `metadata` (JSONB), `isActive`, `deletedAt`
- Indexed on name

### ProductCategory
- Join table: productId + categoryId (composite PK)

### ProductVariant
- `id`, `productId`, `sku` (unique), `price` (DECIMAL 12,2), `listPrice`, `attributes` (JSONB), `barcode`
- Indexed on productId

### Inventory
- `id`, `variantId` (unique), `locationId`, `quantity`, `reserved`, `safetyStock`

### Cart
- `id`, `userId`, `sessionToken`, `status` (default: 'active')

### CartItem
- `id`, `cartId`, `variantId`, `quantity`, `priceSnapshot` (DECIMAL 12,2), `metadata` (JSONB)

### Order
- `id`, `userId`, `externalId` (unique, idempotency), `status`, `total` (DECIMAL 12,2), `currency`, `shippingAddress` (JSONB), `billingAddress` (JSONB), `paymentSnapshot` (JSONB), `deletedAt`
- Indexed on userId and status

### OrderItem
- `id`, `orderId`, `variantId`, `qty`, `unitPrice` (DECIMAL 12,2), `totalPrice` (DECIMAL 12,2), `metadata` (JSONB)

### Payment
- `id`, `orderId`, `provider`, `providerPaymentId`, `amount`, `currency`, `status`, `rawResponse` (JSONB)
- Compound index on (provider, providerPaymentId)

### AuditLog
- `id`, `tableName`, `recordId`, `action`, `userId`, `diff` (JSONB)
- Indexed on (tableName, createdAt)

### Notification
- `id`, `userId`, `channel`, `payload` (JSONB), `status`, `sentAt`

### Favorite
- `id`, `userId`, `productId`
- Unique constraint on (userId, productId)

### Review
- `id`, `userId`, `productId`, `rating`, `title`, `body`, `metadata` (JSONB)

## Migrations

1. **20260528000000_baseline** — All tables except business entities
2. **20260528120000_business_entities** — Orders, payments, inventory, notifications, reviews
3. **20260529193900_remove_telegram_fields** — Removed telegram_id from User + indexes
