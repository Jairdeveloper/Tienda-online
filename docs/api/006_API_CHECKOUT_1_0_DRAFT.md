---
id: 006
area: api
type: API
module: checkout
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - checkout
  - order-creation
  - idempotency
summary: "Especificación del flujo de checkout: creación de pedidos, validación de stock, reserva en transacción, idempotencia con Redis y limpieza de carrito."
keywords:
  - checkout
  - pedidos
  - ordenes
  - idempotencia
  - stock
  - transaccion
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Checkout API — Order Creation

## Base Path: `api/v1/checkout`

Requires JWT (@ApiBearerAuth).

## Endpoints

### `POST /checkout`
- **Body:** `{ addressId?, paymentMethod, idempotencyKey }`
- **Response:** `{ orderId, status, total, currency, items[], paymentId, paymentProvider, paymentStatus }`
- **Logic:**
  1. Idempotency check via Redis key `checkout:{userId}:{idempotencyKey}` (24h TTL)
  2. Validates cart exists and has items
  3. Validates stock availability for all variants (quantity - reserved)
  4. Resolves shipping address (optional, must belong to user)
  5. DB transaction:
     - Creates Order with items (status: created → stock_reserved)
     - Reserves stock via InventoryService.reserveStock()
  6. Clears cart (delete items, mark cart completed)
  7. Creates Payment record (status: pending)
  8. Stores idempotency key in Redis

## Idempotency

- Duplicate idempotencyKey returns `409 Conflict` with existing orderId
- Prevents duplicate orders on network retry
- Key TTL: 86400s (24h)

## Stock Validation

- Throws `409 Conflict` with `{ items: [{ variantId, sku, available, requested }] }`
- Rolls back transaction on any stock reservation failure
