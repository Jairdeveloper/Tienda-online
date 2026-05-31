---
id: 034
area: frontend
type: EXEC
module: frontend
version: 1.0
status: DRAFT
tags:
  - frontend
  - execution
  - checkout
  - orders
  - phase-3
summary: "Documentación de ejecución de la Fase 3 (Checkout + Órdenes) del frontend SPA de Tienda API. Implementa flujo completo de checkout, detalle de pedido, historial y cancelación."
keywords:
  - frontend
  - checkout
  - orders
  - order-list
  - order-detail
  - cancel
  - react
  - typescript
changelog:
  - version: 1.0
    date: 2026-05-31
    author: system
    changes:
      - "Creación inicial — ejecución Fase 3"
---

# Ejecución Fase 3: Checkout + Órdenes

## Resumen

Implementación de la Fase 3 del plan `022_EXEC_FRONTEND_PLAN_1_0_DRAFT.md`:
flujo completo de checkout (multi-step), detalle de pedido, historial de pedidos
y cancelación.

## Archivos creados

| Archivo                                      | Descripción                                                                                         |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `web/types/orders.ts`                        | Tipos TypeScript: Order, OrderItem, PaymentInfo, CheckoutRequest, CheckoutResponse, PaginatedOrders |
| `web/components/orders/OrderStatusBadge.tsx` | Badge de estado con mapeo de colores (7 estados)                                                    |
| `web/components/orders/OrderCard.tsx`        | Tarjeta resumen de pedido para lista                                                                |
| `web/pages/Checkout.tsx`                     | Flujo multi-step (4 pasos): resumen, dirección, pago, confirmar                                     |
| `web/pages/OrderDetail.tsx`                  | Detalle de pedido con tabla de items, pagos, cancelación                                            |
| `web/pages/OrderList.tsx`                    | Historial de pedidos con filtro por estado y paginación                                             |

## Archivos modificados

| Archivo                | Cambio                                                                                 |
| ---------------------- | -------------------------------------------------------------------------------------- |
| `web/routes/index.tsx` | Placeholders `/checkout`, `/orders`, `/orders/:id` reemplazados por componentes reales |

## Detalle de implementación

### 3.1 Checkout Page (`web/pages/Checkout.tsx`)

- **Autenticación requerida**: redirige a `/login` si no auth
- **Carrito requerido**: redirige a `/cart` si está vacío
- **4 pasos** con stepper visual:
  1. Resumen del pedido (items del carrito con cantidades y subtotales)
  2. Selección de dirección de envío (radio buttons desde GET /users/me/addresses, con opción de agregar nueva dirección inline mediante AddressForm reutilizado)
  3. Selección de método de pago (Mock o COD, radio buttons con descripción)
  4. Revisar y confirmar (resumen completo + botón "Confirmar Pedido")
- **Idempotency**: genera `crypto.randomUUID()` automáticamente
- **Post-checkout**: redirige a `/orders/{orderId}` con mensaje de éxito
- **Estados**: loading skeleton, error (con mensaje del servidor), éxito
- **Navegación**: botones Anterior/Continuar entre pasos

### 3.2 Order Detail Page (`web/pages/OrderDetail.tsx`)

- **Autenticación requerida**
- **Breadcrumb**: Pedidos > Detalle pedido
- **Cabecera**: N° de orden (primeros 8 chars UUID), fecha, badge de estado, total con moneda
- **Tabla de artículos**: producto, SKU, cantidad, precio unitario, total
- **Sección de pagos**: lista de pagos con provider, estado, monto
- **Botón "Cancelar Pedido"**: visible solo si status es cancelable (created, stock_reserved, payment_pending)
- **Modal de confirmación**: overlay con card centrada, botón "Sí, cancelar" con spinner
- **Post-cancelación**: invalida caché de React Query, actualiza vista sin recargar
- **Estados**: loading skeleton, 404 ("Pedido no encontrado"), error

### 3.3 Order History Page (`web/pages/OrderList.tsx`)

- **Autenticación requerida**
- **Filtro por estado**: pills horizontal (Todos, Creados, Pago Pendiente, Pagados, Completados, Cancelados)
- **Lista de tarjetas**: cada OrderCard muestra N° orden (8 chars), fecha, badge de estado, total, count de artículos
- **Click en tarjeta**: navega a `/orders/:id`
- **Paginación**: reutiliza componente Pagination de catalog
- **Ordenamiento**: por fecha descendente (default)
- **Estados**: loading skeleton (3 cards), empty ("No tienes pedidos aún" con link a catálogo), error

### 3.4 Order Cancel Flow

- Integrado en OrderDetail como modal de confirmación
- POST `/orders/:id/cancel` con body vacío
- Invalidación de queries `["order", id]` y `["orders"]` post-cancelación
- Manejo de errores con mensaje del servidor
- Badge rojo "Cancelado" se muestra automáticamente tras actualizar caché

## Cumplimiento de restricciones

- ✅ NO se modificaron archivos funcionales existentes (AuthContext, client.ts, layouts, Fase 1-2 pages)
- ✅ NO se agregaron dependencias npm
- ✅ Tailwind CSS v4 utility classes
- ✅ Formularios accesibles (labels, aria-label, role="alert")
- ✅ Tipos en archivo dedicado `web/types/orders.ts`

---

_Generado a partir de `docs/frontend/022_EXEC_FRONTEND_PLAN_1_0_DRAFT.md`_
