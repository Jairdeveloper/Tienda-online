---
id: 010
area: api
type: API
module: inventory
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - inventory
  - stock
summary: "Especificación de la API de inventario: consulta pública de stock, reserva, liberación y deducción de inventario desde checkout y pagos."
keywords:
  - inventario
  - stock
  - inventory
  - reserva
  - deduccion
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Inventory API — Stock Management

## Base Path: `api/v1/inventory`

Both endpoints are @Public (read-only).

## Endpoints

### `GET /inventory/variants/:variantId`
- Returns inventory availability for a specific variant
- Response: `{ variantId, available, quantity, reserved, safetyStock }`
- `available` = `quantity - reserved`

## Internal Methods (used by Checkout/Payments)

### `reserveStock(variantId, qty, tx)`
- Called within checkout transaction
- Checks `quantity - reserved >= qty`
- Increments `reserved` by qty
- Returns boolean success

### `releaseStock(variantId, qty, tx)`
- Decrements `reserved` by qty
- Used on cancel/refund

### `confirmDeduction(variantId, qty, tx)`
- Decrements `quantity` and `reserved` both by qty
- Used when payment is confirmed (paid)

## Inventory Fields

| Field | Type | Description |
|-------|------|-------------|
| quantity | Int | Physical stock count |
| reserved | Int | Stock reserved for active orders |
| safetyStock | Int | Minimum stock threshold |
| available | Computed | quantity - reserved |
