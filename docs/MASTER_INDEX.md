---
id: master_index
area: system
type: MAP
module: system
version: 1.1
status: ACTIVE
author: system
created: 2026-05-23
last_updated: 2026-05-30T18:35
dependencies:
  - registro_ids
tags:
  - knowledge-base
  - system-map
  - documentation
  - index
summary: "Mapa del sistema @tienda/api: directorio de documentación, dependencias entre módulos, convención de nombres y referencia rápida para agentes IA."
keywords:
  - indice
  - mapa
  - sistema
  - documentacion
  - modulos
  - dependencias
  - referencia
changelog:
  - version: 1.2
    date: 2026-05-30
    author: system
    changes:
      - "Agregadas referencias a workflow/ y docs/frontend/ con IDs 020, 021, 022"
  - version: 1.1
    date: 2026-05-30
    author: system
    changes:
      - "Migración al nuevo frontmatter con vocabulario controlado de tags"
      - "Agregadas referencias a REGISTRO_IDS.md, security/, devops/, archive/"
      - "Eliminado contenido residual de prompt anterior"
      - "Agregada sección de vocabulario de tags y referencias a la convención"
---

# MASTER INDEX — @tienda/api Knowledge Base

## System Overview

**@tienda/api** is a platform-agnostic online store backend built with NestJS, Prisma (PostgreSQL), and Redis. It provides REST API endpoints for authentication, catalog management, cart/checkout, order processing, payments, inventory, and admin operations — all secured via JWT + RBAC.

## Directory Structure

```
docs/
├── MASTER_INDEX.md              # This file — system map
├── REGISTRO_IDS.md              # Central ID registry
├── architecture/                # System architecture docs
│   └── 001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md
├── backend/                     # Backend config docs
│   └── (future: deployment, env, etc.)
├── database/                    # Database schema docs
│   └── 002_DB_PRISMA_SCHEMA_1_0_DRAFT.md
├── api/                         # API specification docs
│   ├── 003_API_AUTH_1_0_DRAFT.md
│   ├── 004_API_CATALOG_1_0_DRAFT.md
│   ├── 005_API_CART_1_0_DRAFT.md
│   ├── 006_API_CHECKOUT_1_0_DRAFT.md
│   ├── 007_API_ORDERS_1_0_DRAFT.md
│   ├── 008_API_PAYMENTS_1_0_DRAFT.md
│   ├── 009_API_USERS_1_0_DRAFT.md
│   ├── 010_API_INVENTORY_1_0_DRAFT.md
│   └── 011_API_ADMIN_1_0_DRAFT.md
├── flows/                       # Business flow docs
│   ├── 012_FLOW_AUTH_1_0_DRAFT.md
│   ├── 013_FLOW_CHECKOUT_1_0_DRAFT.md
│   └── 014_FLOW_PAYMENT_1_0_DRAFT.md
├── decisions/                   # Architecture Decision Records
│   ├── 015_ADR_DATABASE_POSTGRESQL_1_0_DRAFT.md
│   ├── 016_ADR_AUTH_JWT_RBAC_1_0_DRAFT.md
│   └── 017_ADR_PAYMENTS_PROVIDER_PATTERN_1_0_DRAFT.md
├── prompts/                     # AI agent prompt conventions
│   └── 018_PRM_BUILD_AGENT_1_0_DRAFT.md
├── ai/                          # AI knowledge base context
│   └── 019_AI_KNOWLEDGE_BASE_1_0_DRAFT.md
├── frontend/                    # Frontend specification docs
│   ├── 021_API_FRONTEND_SPEC_1_0_DRAFT.md
│   └── 022_EXEC_FRONTEND_PLAN_1_0_DRAFT.md
├── security/                    # Security documentation (future)
├── devops/                      # DevOps documentation (future)
└── archive/                     # Deprecated documents

workflow/                        # Workflow script documentation
└── 020_DEV_WORKFLOW_1_0_DRAFT.md
```

## Module Dependency Map

```
                    ┌─────────────┐
                    │   Config    │
                    │  (Global)   │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼────────┐ ┌─▼──────────┐
       │   Common    │ │  Prisma   │ │   Redis    │
       │  (Global)   │ │ (Global)  │ │  (Global)  │
       └──────┬──────┘ └─────┬─────┘ └─────┬──────┘
              │              │              │
       ┌──────▼──────────────▼──────────────▼──────┐
       │              AppModule                    │
       │  (Root: imports all domain modules)       │
       └──────┬──────┬──────┬──────┬──────┬──────┬─┘
              │      │      │      │      │      │
       ┌──────▼┐ ┌──▼──┐ ┌─▼───┐ ┌▼───┐ ┌▼────┐ ┌▼─────┐
       │ Auth  │ │Users│ │Cat. │ │Cart│ │Chk. │ │Orders│
       └──┬────┘ └─────┘ └──┬──┘ └────┘ └─┬───┘ └──┬───┘
          │                 │              │         │
       ┌──▼─────────────────▼──────────────▼─────────▼──┐
       │               Payments/Admin                    │
       │  (depend on Inventory, Orders, Redis, Prisma)  │
       └─────────────────────────────────────────────────┘
```

## Module Dependencies Table

| Module     | Depends On                       | Provides              |
|------------|----------------------------------|-----------------------|
| Config     | —                                | Env validation (Joi)  |
| Common     | Config, Redis                    | Logger, Cache, Filters|
| Prisma     | Config                           | DB access (PrismaClient)|
| Redis      | Config                           | Redis client, Lock svc|
| Auth       | Prisma, Redis, JwtService        | JWT + RBAC guards     |
| Users      | Prisma, Auth                     | Profile, Addresses    |
| Catalog    | Prisma                           | Products, Categories  |
| Cart       | Prisma, Auth                     | Cart CRUD             |
| Checkout   | Prisma, Redis, Cart, Inventory   | Order creation        |
| Orders     | Prisma, Auth                     | Order queries, cancel |
| Payments   | Prisma, Redis, Inventory, Orders | Payment intents, webhooks |
| Inventory  | Prisma                           | Stock mgmt            |
| Admin      | Prisma, Auth, Orders, Inventory  | Admin CRUD            |
| Health     | Prisma, Redis                    | Health checks         |

## Doc Status Legend

| Status     | Meaning |
|------------|---------|
| DRAFT      | Initial version, may be incomplete |
| REVIEW     | Pending peer review |
| ACTIVE     | Up-to-date and accurate (replaces CURRENT) |
| STALE      | May not reflect latest code |
| DEPRECATED | Replaced by another document, preserved for history |

## Naming Convention

`[ID]_[AREA]_[TIPO]_[MODULO]_[VERSION]_[ESTADO].md`

- ID: 3-digit sequential number
- AREA: architecture, database, api, flows, decisions, prompts, ai, security, devops
- TIPO: ARCH, DB, API, FLOW, ADR, PRM, AI, SEC, OPS
- MODULO: system, auth, catalog, cart, checkout, orders, payments, users, inventory, admin
- VERSION: semantic (1_0, 1_1, 2_0)
- ESTADO: DRAFT, REVIEW, ACTIVE, STALE, DEPRECATED

## Tag Vocabulary

Tags must use the controlled vocabulary defined in the documentation convention. See `algoritmos/ALGP003_CONVENCION_DOCUMENTACION_v1_0_DRAFT.md#3-vocabulario-controlado-de-tags`.

## Related Documents

- `docs/REGISTRO_IDS.md` — Central registry of all document IDs
- `algoritmos/ALGP003_CONVENCION_DOCUMENTACION_v1_0_DRAFT.md` — Documentation convention proposal
- `docs/archive/` — Deprecated documents
