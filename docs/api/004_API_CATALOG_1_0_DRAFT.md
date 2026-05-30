---
id: 004
area: api
type: API
module: catalog
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies:
  - 002
tags:
  - api-spec
  - catalog
  - products
  - categories
summary: "Especificación de la API de catálogo: productos, categorías, variantes, inventario público, búsqueda, filtros y paginación."
keywords:
  - catalogo
  - productos
  - categorias
  - variantes
  - busqueda
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# Catalog API — Products & Categories

## Base Path: `api/v1/catalog`

All endpoints are @Public (no JWT required).

## Endpoints

### `GET /catalog/categories`
- Returns all categories
- Response: `[{ id, name, slug, parentId, metadata }]`

### `GET /catalog/products`
- Query params: `page`, `limit`, `search`, `categorySlug`, `minPrice`, `maxPrice`, `sortBy`, `sortOrder`
- Paginated response: `{ data: Product[], meta: { total, page, limit, totalPages } }`
- Active products only (isActive: true, deletedAt: null)

### `GET /catalog/products/:id`
- Returns single product by ID
- Includes categories relation
- 404 if not found or inactive/deleted

### `GET /catalog/products/:id/variants`
- Returns all variants for a product
- Response: `[{ id, sku, price, listPrice, attributes, barcode }]`

### `GET /catalog/inventory/:variantId`
- Returns inventory status for a variant
- Response: `{ variantId, available, quantity, reserved, safetyStock }`

## Data Model

- **Product:** id, sku, name, description, attributes (JSONB), metadata (JSONB), isActive, soft delete
- **Category:** id, parentId (tree), name, slug (unique), metadata (JSONB)
- **ProductVariant:** id, sku (unique), price, listPrice, attributes (JSONB), barcode
- **Inventory:** quantity, reserved, safetyStock (1:1 with variant)
- **ProductCategory:** N:N join table

## Query Features

- Search by name (case-insensitive contains)
- Filter by category slug
- Price range filtering (minPrice, maxPrice)
- Sorting: name, price, createdAt (asc/desc)
- Pagination: page (1-based), limit (default 20, max 100)
