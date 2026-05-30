---
id: 005
area: api
type: API
module: cart
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - cart
  - shopping-cart
summary: "Especificación de la API del carrito de compras: CRUD de items, precio congelado, un carrito activo por usuario y finalización tras checkout."
keywords:
  - carrito
  - cart
  - compras
  - shopping-cart
  - items
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Cart API — Shopping Cart

## Base Path: `api/v1/cart`

All endpoints (except status) require JWT (@ApiBearerAuth).

## Endpoints

### `GET /cart`
- Returns active cart with items for current user
- Response: `{ id, status, items: [{ id, variantId, quantity, priceSnapshot, variant }] }`

### `POST /cart/items`
- **Body:** `{ variantId, quantity }`
- Adds item to cart or increments quantity if variant already in cart
- Response: Updated cart

### `PATCH /cart/items/:id`
- **Body:** `{ quantity }`
- Updates quantity of a cart item
- Response: Updated cart

### `DELETE /cart/items/:id`
- Removes item from cart
- Response: Updated cart

### `POST /cart/clear`
- Deletes all items from active cart, sets status to 'completed'
- Response: Empty cart

## Cart Logic

- One active cart per user (status: 'active')
- Items have priceSnapshot (frozen at add time via variant's current price)
- Cart is marked 'completed' after checkout
- Uses user ID (not anonymous session)
