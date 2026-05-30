---
id: 007
area: api
type: API
module: orders
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - orders
  - order-management
  - states
summary: "Especificación de la API de pedidos: consulta, detalle, cancelación, máquina de estados, estados terminales y cancelables."
keywords:
  - pedidos
  - ordenes
  - estados
  - cancelacion
  - orders
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Orders API — Order Management

## Base Path: `api/v1/orders`

Requires JWT (@ApiBearerAuth). Users can only access their own orders.

## Endpoints

### `GET /orders`
- Query params: `page`, `limit`, `status`, `startDate`, `endDate`
- Returns paginated list of user's orders

### `GET /orders/:id`
- Returns single order with items, payments, and variant info
- 404 if not found or not owned by user

### `POST /orders/:id/cancel`
- **Body:** `{ reason? }`
- Cancels order if status is cancellable
- Releasable statuses: created, stock_reserved, payment_pending, cod_pending, payment_failed
- Releases reserved stock

### `GET /orders/:id/status`
- Returns status summary: order id, status, cancellable, terminal

## Order Statuses

| Status          | Description | Cancellable | Terminal |
|-----------------|-------------|-------------|----------|
| created         | Order created | Yes | No |
| stock_reserved  | Stock reserved | Yes | No |
| payment_pending | Waiting for payment | Yes | No |
| paid            | Payment confirmed | No | No |
| cod_pending     | Cash on delivery pending | Yes | No |
| payment_failed  | Payment failed | Yes | No |
| fulfilled       | Order completed | No | Yes |
| cancelled       | Order cancelled | No | Yes |

## Terminal Statuses

- `cancelled`, `fulfilled` — no further transitions allowed

## Cancellable Statuses

- `created`, `stock_reserved`, `payment_pending`, `cod_pending`, `payment_failed`
