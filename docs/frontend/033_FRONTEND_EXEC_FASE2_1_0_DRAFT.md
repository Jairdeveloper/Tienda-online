---
id: 033
area: frontend
type: EXEC
module: frontend
version: 1.0
status: DRAFT
tags:
  - frontend
  - execution
  - implementation
  - catalog
  - cart
summary: "Implementación de Fase 2: Catálogo + Carrito. Incluye listado de productos con búsqueda y filtro por categoría, detalle de producto con selector de variantes e indicador de stock, carrito de compras completo con operaciones CRUD, y flujo de agregar al carrito."
keywords:
  - frontend
  - catalog
  - products
  - categories
  - variants
  - stock
  - cart
  - react
  - tanstack-query
changelog:
  - version: 1.0
    date: 2026-05-31
    author: system
    changes:
      - "Creación del documento de ejecución de Fase 2"
---

# Fase 2: Catálogo + Carrito — Informe de Ejecución

**Fecha:** 2026-05-31
**Estado:** DRAFT
**Plan base:** `022_EXEC_FRONTEND_PLAN_1_0_DRAFT.md`

## Tareas Ejecutadas

| ID  | Tarea               | Archivos                                     | Estado |
| --- | ------------------- | -------------------------------------------- | ------ |
| 2.1 | Product list page   | `web/pages/ProductList.tsx`                  | ✅     |
| 2.2 | Category filter     | `web/components/catalog/CategoryFilter.tsx`  | ✅     |
| 2.3 | Product detail page | `web/pages/ProductDetail.tsx`                | ✅     |
| 2.4 | Variant selector    | `web/components/catalog/VariantSelector.tsx` | ✅     |
| 2.5 | Stock indicator     | `web/components/catalog/StockIndicator.tsx`  | ✅     |
| 2.6 | Cart page           | `web/pages/Cart.tsx`                         | ✅     |
| 2.7 | Add to cart flow    | `web/pages/ProductDetail.tsx`                | ✅     |

## Archivos Creados

### Types

- `web/types/catalog.ts` — Interfaces TypeScript: `Category`, `Product`, `ProductVariant`, `PaginatedResponse`, `Cart`, `CartItem`, `InventoryInfo`

### Componentes de Catálogo (`web/components/catalog/`)

- `ProductCard.tsx` — Tarjeta de producto para grid con imagen placeholder, nombre, badges de categorías, precio mínimo. Link a detalle del producto.
- `ProductGrid.tsx` — Grid responsive (1/2/3/4 columnas) de `ProductCard`s.
- `Pagination.tsx` — Controles de paginación con botones Anterior/Siguiente, números de página (ventana de 5), elipsis, aria-current.
- `CategoryFilter.tsx` — Barra horizontal de categorías con fetch vía react-query. Botón "Todas" para limpiar filtro. Loading state con skeleton pills.
- `VariantSelector.tsx` — Lista de variantes seleccionables. Muestra atributos concatenados, precio, y precio con descuento (tachado). Resalta variante activa con anillo primary.
- `StockIndicator.tsx` — Indicador de disponibilidad con fetch de inventario. Estados: verde (stock > 10), amarillo (stock 1-10), rojo (agotado), loading con pulse, error.

### Páginas

- `web/pages/ProductList.tsx` — Ruta `/products`. Search bar con query param `q`, filtro de categorías, grid de productos, paginación. Estados: loading (skeleton grid 8 cards), empty ("No se encontraron productos"), error.
- `web/pages/ProductDetail.tsx` — Ruta `/products/:id`. Breadcrumb, imagen placeholder, nombre, descripción, badges de categorías, selector de variantes, indicador de stock, botón "Agregar al carrito" (o "Iniciar sesión para comprar" si no auth). Toast verde de confirmación post-add. Estados: loading skeleton, 404 ("Producto no encontrado"), error.
- `web/pages/Cart.tsx` — Ruta `/cart` (protegida, redirect a `/login` si no auth). Lista de items con nombre, variante, cantidad (+/-), precio unitario, subtotal. Botones eliminar item y vaciar carrito. Resumen con subtotal/total. Botón "Proceder al checkout". Estados: loading, empty ("Tu carrito está vacío"), error.

### Archivos Modificados

- `web/routes/index.tsx` — Ruta `/products` añadida → `ProductList`. Placeholder de `/products/:id` reemplazado → `ProductDetail`. Placeholder de `/cart` reemplazado → `CartPage`.
- `web/components/layout/Navbar.tsx` — Enlace "Catálogo" añadido (desktop y mobile) entre Inicio y Carrito.

## Decisiones Técnicas

- **Data fetching**: `@tanstack/react-query` (ya configurado en `main.tsx`) para caché, staleTime, refetch automático. Mutaciones con invalidación de queries.
- **URL state**: `useSearchParams` para paginación, búsqueda y filtro — permite compartir URLs y mantener estado en navegación.
- **Auth check**: `useAuth` hook existente, redirect a `/login` con `state.from` para post-login redirect futuro.
- **Formato de precios**: `toFixed(2)` para consistencia monetaria.

## Estructura Final de Archivos (Fase 2)

```
web/
├── types/
│   └── catalog.ts              # NEW — interfaces de catálogo y carrito
├── components/
│   ├── catalog/                 # NEW
│   │   ├── ProductCard.tsx
│   │   ├── ProductGrid.tsx
│   │   ├── Pagination.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── VariantSelector.tsx
│   │   └── StockIndicator.tsx
│   ├── layout/                  # MOD — Navbar.tsx
│   │   ├── Navbar.tsx           (+ enlace Catálogo)
│   │   ├── MainLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── address/                 # (sin cambios)
├── pages/
│   ├── ProductList.tsx          # NEW
│   ├── ProductDetail.tsx        # NEW
│   ├── Cart.tsx                 # NEW
│   ├── Home.tsx                 # (sin cambios)
│   ├── Login.tsx                # (sin cambios)
│   ├── Register.tsx             # (sin cambios)
│   └── Profile.tsx              # (sin cambios)
└── routes/
    └── index.tsx                # MOD — rutas actualizadas
```
