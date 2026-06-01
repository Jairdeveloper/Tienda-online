---
id: 036
area: frontend
type: EXEC
module: frontend
version: "1.0"
status: DRAFT
tags:
  - frontend
  - admin
  - execution
  - fase5
summary: "Implementación de la Fase 5 (Admin Panel) del frontend SPA. Agrega layout admin con sidebar, route guard por roles, y páginas CRUD para pedidos, productos, variantes e inventario."
keywords:
  - frontend
  - admin
  - admin-panel
  - admin-layout
  - admin-route-guard
  - orders-management
  - products-management
  - variants-management
  - inventory-management
  - react
  - phase-5
changelog:
  - version: "1.0"
    date: 2026-06-01
    author: frontend-reviewer
    changes:
      - "Creación de tipos admin (CreateProductInput, UpdateProductInput, CreateVariantInput, UpdateVariantInput, UpdateOrderStatusInput, InventoryItem, UpdateInventoryInput)"
      - "Componente AdminRoute — guard de ruta con verificación de rol admin"
      - "Componente AdminLayout — sidebar oscuro con navegación y breadcrumb"
      - "Componente VariantManager — CRUD de variantes con modal inline"
      - "Página Dashboard — cards con estadísticas rápidas"
      - "Página AdminOrders — tabla paginada con filtro por estado"
      - "Página AdminOrderDetail — detalle con items, payments y formulario de cambio de estado"
      - "Página AdminProducts — tabla paginada con búsqueda, crear/editar/eliminar"
      - "Página AdminProductForm — formulario producto + gestor de variantes en modo edición"
      - "Página AdminInventory — tabla paginada con toggle low-stock y modal de edición"
      - "Actualización de routes/index.tsx con rutas admin protegidas"
---

# Fase 5: Admin Panel — Implementación Frontend

## Resumen

Implementación del panel de administración del frontend SPA. Consta de 11 archivos nuevos y 1 archivo modificado.

## Archivos creados/modificados

| Archivo                                   | Propósito                                        |
| ----------------------------------------- | ------------------------------------------------ |
| `web/types/admin.ts`                      | Interfaces TypeScript para el contrato admin     |
| `web/components/admin/AdminRoute.tsx`     | Route guard — verifica rol admin                 |
| `web/components/admin/AdminLayout.tsx`    | Layout con sidebar oscuro y breadcrumb           |
| `web/components/admin/VariantManager.tsx` | CRUD de variantes con modal inline               |
| `web/pages/admin/Dashboard.tsx`           | Dashboard con estadísticas rápidas               |
| `web/pages/admin/Orders.tsx`              | Listado paginado de pedidos con filtro           |
| `web/pages/admin/OrderDetail.tsx`         | Detalle de pedido + formulario cambio estado     |
| `web/pages/admin/Products.tsx`            | Listado paginado de productos con búsqueda       |
| `web/pages/admin/ProductForm.tsx`         | Formulario crear/editar producto + variantes     |
| `web/pages/admin/Inventory.tsx`           | Listado paginado de inventario con modal edición |
| `web/routes/index.tsx` (modificado)       | 7 nuevas rutas admin protegidas                  |

## Implementación

### 5.1 Admin Layout + Route Guard

- **AdminRoute**: wrapper que verifica autenticación y rol "admin". Muestra spinner durante carga, redirect a `/login` si no autenticado, mensaje "Acceso denegado" si no tiene rol admin.
- **AdminLayout**: sidebar fijo (bg-gray-900, w-64) con 4 enlaces (Dashboard, Pedidos, Productos, Inventario). Header con "Admin Panel" y breadcrumb. Mobile responsive con toggle.

### 5.2 Orders Management

- **AdminOrders**: tabla con Order ID truncado, User ID, Total, badge de estado, fecha y acciones. Filtro por estado (pills). Paginación.
- **AdminOrderDetail**: breadcrumb, datos de orden, tabla de artículos, sección de pagos, formulario para cambiar estado (select + textarea opcional + botón).

### 5.3 Products Management

- **AdminProducts**: tabla con SKU, nombre, categorías, estado activo/inactivo, acciones. Búsqueda por texto. Paginación. Botón "Nuevo Producto". Botones Editar y Eliminar (con confirmación).
- **AdminProductForm**: formulario con SKU, nombre, descripción, categorías (checkboxes desde GET /catalog/categories), atributos key-value. En modo edición muestra VariantManager.

### 5.4 Variants Management

- **VariantManager**: tabla de variantes (SKU, precio, precio lista, atributos, barcode, acciones). Modal inline para crear/editar con campos: SKU, precio, precio lista, barcode, stock inicial, atributos dinámicos. Confirmación al eliminar.

### 5.5 Inventory Management

- **AdminInventory**: tabla con producto, SKU variante, cantidad, reservado, disponible, stock seguridad. Toggle "Solo bajo stock" (lowStock=true). Filas con bajo stock resaltadas en rojo. Modal inline para editar quantity y/o safetyStock.

## Rutas nuevas

| Ruta                       | Componente       |
| -------------------------- | ---------------- |
| `/admin`                   | Dashboard        |
| `/admin/orders`            | AdminOrders      |
| `/admin/orders/:id`        | AdminOrderDetail |
| `/admin/products`          | AdminProducts    |
| `/admin/products/new`      | AdminProductForm |
| `/admin/products/:id/edit` | AdminProductForm |
| `/admin/inventory`         | AdminInventory   |

## API Endpoints consumidos

| Método | Ruta                                | Uso                      |
| ------ | ----------------------------------- | ------------------------ |
| GET    | /admin/orders                       | Listar pedidos           |
| GET    | /admin/orders/:id                   | Detalle pedido           |
| PATCH  | /admin/orders/:id/status            | Actualizar estado pedido |
| GET    | /admin/products                     | Listar productos         |
| GET    | /admin/products/:id                 | Detalle producto         |
| POST   | /admin/products                     | Crear producto           |
| PATCH  | /admin/products/:id                 | Actualizar producto      |
| DELETE | /admin/products/:id                 | Eliminar producto        |
| POST   | /admin/products/:productId/variants | Crear variante           |
| PATCH  | /admin/variants/:id                 | Actualizar variante      |
| DELETE | /admin/variants/:id                 | Eliminar variante        |
| GET    | /admin/inventory                    | Listar inventario        |
| PATCH  | /admin/inventory/:variantId         | Actualizar inventario    |
| GET    | /catalog/categories                 | Obtener categorías       |
