---
id: 013
area: flows
type: FLOW
module: checkout
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 006
tags:
  - flow
  - checkout
  - order-creation
  - idempotency
summary: "Diagrama de flujo de checkout: validación de carrito y stock, transacción de creación de pedido, reserva de inventario, creación de pago e idempotencia con Redis."
keywords:
  - flujo
  - checkout
  - pedido
  - orden
  - transaccion
  - idempotencia
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Checkout Flow

## Sequence

```
Client         CheckoutService       CartService      InventoryService     Prisma       Redis
  │                  │                   │                  │               │            │
  │ POST /checkout   │                   │                  │               │            │
  │─────────────────►│                   │                  │               │            │
  │                  │  Idempotency check│                  │               │            │
  │                  │──────────────────────────────────────────────────────────────────►│
  │                  │◄── key? ──────────────────────────────────────────────────────────│
  │                  │                   │                  │               │            │
  │                  │  Get active cart  │                  │               │            │
  │                  │──────────────────►│                  │               │            │
  │                  │◄── cart ──────────│                  │               │            │
  │                  │                   │                  │               │            │
  │                  │  Validate stock   │                  │               │            │
  │                  │  for all items    │                  │               │            │
  │                  │────────────────────────────────────►│               │            │
  │                  │◄── availability ────────────────────│               │            │
  │                  │                   │                  │               │            │
  │                  │  Resolve address  │                  │               │            │
  │                  │  (if addressId)   │                  │               │            │
  │                  │───────────────────────────────────────────────────►│            │
  │                  │◄── address ───────────────────────────────────────│            │
  │                  │                   │                  │               │            │
  │                  │  ┌─── TRANSACTION ──────────────────────────────┐  │            │
  │                  │  │  1. Create Order (status: created)          │  │            │
  │                  │  │  2. Create OrderItems                       │  │            │
  │                  │  │  3. Reserve stock for each variant          │  │            │
  │                  │  │  4. Update Order → stock_reserved           │  │            │
  │                  │  └─────────────────────────────────────────────┘  │            │
  │                  │                   │                  │               │            │
  │                  │  Mark cart completed                    │               │            │
  │                  │──────────────────►│                                   │            │
  │                  │                   │                                   │            │
  │                  │  Create Payment (pending)               │               │            │
  │                  │───────────────────────────────────────────────────►│            │
  │                  │                   │                  │               │            │
  │                  │  Store idempotency key                 │               │            │
  │                  │──────────────────────────────────────────────────────────────────►│
  │                  │                   │                  │               │            │
  │  { orderId,     │                   │                  │               │            │
  │    paymentId }  │                   │                  │               │            │
  │◄────────────────│                   │                  │               │            │
```

## Idempotency

- Key format: `checkout:{userId}:{idempotencyKey}`
- TTL: 86400s (24h)
- On duplicate: returns 409 Conflict with existing orderId and status
- Prevents double-order on network retry

## Transactional Integrity

- Entire order creation + stock reservation runs in Prisma $transaction
- If any stock reservation fails → entire transaction rolls back
- Stock reservation uses `SELECT ... FOR UPDATE` (via Prisma interactive transactions)

## Error States

| Condition | HTTP Code | Details |
|-----------|-----------|---------|
| Cart empty | 400 | "Cart is empty" |
| Insufficient stock | 409 | Items with available vs requested quantities |
| Address not found | 403 | Address doesn't belong to user |
| Duplicate idempotency | 409 | Existing orderId + status returned |
| Stock reservation fail | 500 | Full transaction rollback |
