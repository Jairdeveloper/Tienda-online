---
id: 021
area: frontend
type: API
module: frontend
version: 1.0
status: DRAFT
tags:
  - frontend
  - api-spec
  - ui
  - spa
summary: "Especificación técnica para el desarrollo del frontend SPA de Tienda API. Define módulos, endpoints, payloads, autenticación y modelo de navegación."
keywords:
  - frontend
  - react
  - vue
  - angular
  - api
  - rest
  - especificacion
  - tienda
  - spa
changelog:
  - version: 1.0
    date: 2026-05-30
    author: system
    changes:
      - "Creación inicial: especificación completa basada en postman collection"
---

# Frontend Specification — Tienda API

## Base URL

```
{{baseUrl}} = http://localhost:3000/api/v1
```

## Autenticación

El frontend debe implementar:

1. **Login/Register** → obtiene `accessToken` + `refreshToken`
2. **Almacenar** `accessToken` en memoria/localStorage
3. **Enviar** en cada request como `Authorization: Bearer {{token}}`
4. **Refresh automático** cuando el accessToken expire (usar `POST /auth/refresh`)
5. **Logout** → `POST /auth/logout` + limpiar tokens locales

### Flujo de tokens

```
Register/Login
  ↓
accessToken (vida corta, ~15min por defecto)
refreshToken (vida larga, ~7 días)
  ↓
Cuando accessToken expira → POST /auth/refresh → nuevos tokens
Cuando refreshToken expira → redirigir a Login
```

---

## Módulo: Health

Endpoint público de verificación.

### `GET /health`

- **Auth:** @Public
- **Response:**
  ```json
  { "status": "ok" }
  ```

---

## Módulo: Auth

Endpoints de autenticación y sesión.

### `POST /auth/register`

- **Auth:** @Public
- **Body:**
  ```json
  {
    "email": "test@example.com",
    "password": "SecurePass123!",
    "name": "Test User"
  }
  ```
- **Response (201):**
  ```json
  {
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```
- **Error (409):** Email already exists

### `POST /auth/login`

- **Auth:** @Public
- **Body:**
  ```json
  {
    "email": "test@example.com",
    "password": "SecurePass123!"
  }
  ```
- **Response (200):**
  ```json
  {
    "tokens": {
      "accessToken": "string",
      "refreshToken": "string"
    }
  }
  ```

### `POST /auth/refresh`

- **Auth:** @Public
- **Body:**
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response (200):** Nuevos tokens

### `POST /auth/logout`

- **Auth:** JWT
- **Body:**
  ```json
  {
    "refreshToken": "string"
  }
  ```
- **Response (200):** Sesión cerrada

### `GET /auth/me`

- **Auth:** JWT
- **Response (200):** Datos del usuario autenticado
  ```json
  {
    "id": "uuid",
    "email": "test@example.com",
    "name": "Test User",
    "roles": ["customer"],
    "permissions": []
  }
  ```

---

## Módulo: Catalog

Catálogo público de productos.

### `GET /catalog/categories`

- **Auth:** @Public
- **Response:** Lista de categorías
  ```json
  [
    {
      "id": "uuid",
      "name": "Electrónicos",
      "description": "...",
      "isActive": true
    }
  ]
  ```

### `GET /catalog/products`

- **Auth:** @Public
- **Query Params:**
  | Param | Type | Default | Description |
  |-------|------|---------|-------------|
  | page | number | 1 | Número de página |
  | limit | number | 20 | Items por página |
  | sort | string | name | Campo de ordenamiento |
  | order | string | asc | asc o desc |
- **Response:** Lista paginada de productos con variantes

### `GET /catalog/products/:id`

- **Auth:** @Public
- **Response:** Detalle completo del producto con todas sus variantes

### `GET /catalog/products/:id/variants`

- **Auth:** @Public
- **Response:** Lista de variantes del producto

### `GET /catalog/inventory/:variantId`

- **Auth:** @Public
- **Response:** Stock actual de una variante
  ```json
  { "variantId": "uuid", "quantity": 100 }
  ```

---

## Módulo: Cart

Carrito de compras persistente por usuario.

### `GET /cart`

- **Auth:** JWT
- **Response:** Carrito actual con items
  ```json
  {
    "id": "uuid",
    "items": [
      {
        "id": "uuid",
        "variantId": "uuid",
        "productName": "Producto",
        "variantName": "Rojo",
        "qty": 1,
        "unitPrice": 99.99
      }
    ],
    "total": 99.99
  }
  ```

### `POST /cart/items`

- **Auth:** JWT
- **Body:**
  ```json
  {
    "variantId": "uuid",
    "qty": 1
  }
  ```
- **Response (201):** Item agregado

### `PATCH /cart/items/:itemId`

- **Auth:** JWT
- **Body:**
  ```json
  { "qty": 2 }
  ```

### `DELETE /cart/items/:itemId`

- **Auth:** JWT

### `POST /cart/clear`

- **Auth:** JWT
- **Response:** Carrito vaciado

---

## Módulo: Checkout

Procesa el pago del carrito.

### `POST /checkout`

- **Auth:** JWT
- **Body:**
  ```json
  {
    "addressId": "address-uuid",
    "shippingMethod": "standard"
  }
  ```
- **Response (201):** Orden creada
  ```json
  {
    "orderId": "uuid",
    "status": "pending",
    "total": 99.99
  }
  ```

---

## Módulo: Orders

Consulta y gestión de órdenes del usuario.

### `GET /orders`

- **Auth:** JWT
- **Response:** Lista de órdenes del usuario autenticado

### `GET /orders/:id`

- **Auth:** JWT
- **Response:** Detalle de orden con items

### `POST /orders/:id/cancel`

- **Auth:** JWT
- **Response:** Orden cancelada

---

## Módulo: Payments

Procesamiento de pagos (provider pattern).

### `POST /payments/:orderId/intent`

- **Auth:** JWT
- **Body:**
  ```json
  {
    "provider": "mock",
    "returnUrl": "https://tienda.example.com/orders/{{orderId}}"
  }
  ```
- **Response:** URL de redirección al provider

### `POST /payments/:orderId/confirm`

- **Auth:** JWT
- **Body:**
  ```json
  {
    "providerPaymentId": "ext_123"
  }
  ```
- **Response:** Confirmación de pago

### `POST /payments/webhooks/mock`

- **Auth:** @Public (validado por firma HMAC)
- **Headers:** `x-webhook-signature: HMAC-SHA256(body, webhookSecret)`
- **Body:**
  ```json
  {
    "event": "payment.completed",
    "paymentId": "payment-uuid",
    "providerPaymentId": "ext_123",
    "status": "paid",
    "amount": 100.00,
    "currency": "USD"
  }
  ```

---

## Módulo: Users

Perfil de usuario y direcciones.

### `GET /users/me`

- **Auth:** JWT
- **Response:** Perfil completo

### `PATCH /users/me`

- **Auth:** JWT
- **Body:**
  ```json
  {
    "name": "Updated Name",
    "phone": "+521234567890"
  }
  ```

### `GET /users/me/addresses`

- **Auth:** JWT
- **Response:** Lista de direcciones del usuario

### `POST /users/me/addresses`

- **Auth:** JWT
- **Body:**
  ```json
  {
    "street": "Av. Reforma 123",
    "extNumber": "A",
    "neighborhood": "Juárez",
    "city": "Ciudad de México",
    "state": "CDMX",
    "zip": "06600",
    "country": "MX",
    "isDefault": true
  }
  ```

### `PATCH /users/me/addresses/:addressId`

- **Auth:** JWT
- **Body:**
  ```json
  { "isDefault": false }
  ```

### `DELETE /users/me/addresses/:addressId`

- **Auth:** JWT

---

## Módulo: Inventory

Consulta pública de inventario.

### `GET /inventory/variants/:variantId`

- **Auth:** @Public
- **Response:**
  ```json
  { "variantId": "uuid", "quantity": 100, "safetyStock": 10 }
  ```

---

## Módulo: Admin

Endpoints administrativos (requiere rol `admin` u `operator`).

### Orders Admin

#### `GET /admin/orders`

- **Auth:** JWT, roles: admin/operator
- **Query:** `page`, `limit`, `status`
- **Response:** Lista paginada de todas las órdenes

#### `GET /admin/orders/:id`

- **Auth:** JWT, roles: admin/operator
- **Response:** Detalle completo de orden

#### `PATCH /admin/orders/:id/status`

- **Auth:** JWT, roles: admin/operator
- **Body:**
  ```json
  {
    "status": "confirmed",
    "note": "Aprobado por administrador"
  }
  ```

### Products Admin

#### `GET /admin/products`

- **Auth:** JWT, roles: admin/operator
- **Query:** `page`, `limit`

#### `GET /admin/products/:id`

- **Auth:** JWT, roles: admin/operator

#### `POST /admin/products`

- **Auth:** JWT, roles: admin/operator
- **Body:**
  ```json
  {
    "name": "Nuevo Producto",
    "description": "Descripción del producto",
    "categoryIds": ["category-uuid"],
    "attributes": { "brand": "Marca", "model": "Modelo" },
    "variants": [
      {
        "sku": "NEW-PRO-001",
        "price": 99.99,
        "listPrice": 129.99,
        "attributes": { "color": "Rojo" },
        "barcode": "7501234567890",
        "stock": 100,
        "safetyStock": 10
      }
    ]
  }
  ```

#### `PATCH /admin/products/:id`

- **Auth:** JWT, roles: admin/operator
- **Body:**
  ```json
  { "name": "Producto Actualizado", "isActive": true }
  ```

#### `DELETE /admin/products/:id`

- **Auth:** JWT, roles: admin/operator

### Variants Admin

#### `POST /admin/products/:id/variants`

- **Auth:** JWT, roles: admin/operator

#### `PATCH /admin/variants/:variantId`

- **Auth:** JWT, roles: admin/operator
- **Body:**
  ```json
  { "price": 79.99 }
  ```

#### `DELETE /admin/variants/:variantId`

- **Auth:** JWT, roles: admin/operator

### Inventory Admin

#### `GET /admin/inventory`

- **Auth:** JWT, roles: admin/operator
- **Query:** `page`, `limit`, `lowStock`
- **Response:** Lista de inventario con filtro de stock bajo

#### `PATCH /admin/inventory/:variantId`

- **Auth:** JWT, roles: admin/operator
- **Body:**
  ```json
  { "quantity": 200, "safetyStock": 20 }
  ```

---

## Modelo de Navegación Sugerido

```
/login              → Auth (Login)
/register           → Auth (Register)
/                   → Catalog (Product list by categories)
/products/:id       → Catalog (Product detail + variants)
/cart               → Cart (view/edit items)
/checkout           → Checkout (address + shipping)
/orders             → Orders (order list)
/orders/:id         → Orders (order detail)
/profile            → Users (profile edit)
/profile/addresses  → Users (address CRUD)

/admin/orders       → Admin (order management)
/admin/products     → Admin (product CRUD)
/admin/inventory    → Admin (stock management)
```

## Stack Tecnológico Sugerido

| Capa | Tecnología |
|------|-----------|
| Framework | React 18+ o Vue 3 |
| Routing | React Router / Vue Router |
| HTTP | fetch API nativa o axios |
| State | Context API / Pinia |
| UI Kit | Headless UI + Tailwind CSS |
| Auth Flow | Interceptor HTTP para refresh token |
| Build | Vite |

## Prioridades de Implementación

| Prioridad | Módulo | Depende de |
|-----------|--------|-----------|
| P0 | Auth | — |
| P0 | Catalog | — |
| P1 | Cart | Auth, Catalog |
| P1 | Users | Auth |
| P2 | Checkout | Cart, Users |
| P2 | Orders | Auth |
| P3 | Payments | Orders |
| P3 | Admin | Auth, Orders, Catalog |

---

_Generado a partir de `postman/tienda-api.postman_collection.json`_
