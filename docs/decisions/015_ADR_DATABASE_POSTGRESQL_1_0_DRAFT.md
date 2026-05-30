---
id: 015
area: decisions
type: ADR
module: database
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-23
dependencies: []
tags:
  - adr
  - database
  - postgresql
  - prisma
summary: "ADR sobre la elección de PostgreSQL 16 como motor de base de datos principal con Prisma ORM, incluyendo alternativas consideradas y consecuencias."
keywords:
  - adr
  - postgresql
  - prisma
  - base de datos
  - decision arquitectonica
changelog:
  - version: 1.0
    date: 2026-05-23
    author: system
    changes:
      - "Creación inicial del documento"
---

# ADR: PostgreSQL as Database Engine

## Status

Accepted

## Context

We need a relational database for an e-commerce backend that must support:
- Complex relational queries (orders ↔ items ↔ products ↔ inventory)
- Transactional integrity (checkout flow requires atomic order+stock operations)
- JSON/JSONB for flexible attribute storage (product variants, metadata)
- Strong data consistency guarantees for financial transactions
- Future scaling needs (read replicas, connection pooling)

## Decision

Use **PostgreSQL 16** as the primary database engine, accessed via **Prisma ORM**.

### Rationale

1. **ACID compliance** — Essential for checkout and payment flows that require transactional integrity
2. **JSONB support** — Product attributes, metadata, and address snapshots stored as flexible JSON
3. **Prisma ORM** — Type-safe queries, auto-generated TypeScript types, migration management
4. **Community & ecosystem** — Well-supported in NestJS, docker-compose, and GitHub Actions
5. **Migration tooling** — Prisma Migrate handles schema versioning
6. **Cost** — Open source, no licensing costs, widely available on cloud providers

### Alternatives Considered

| Alternative | Reason Rejected |
|-------------|----------------|
| MySQL | Less mature JSON support, lower Prisma ecosystem alignment |
| SQLite | No concurrent write support, not production-suitable |
| MongoDB | No ACID transactions across documents, eventual consistency issues |
| DynamoDB | Vendor lock-in, no JOINs, higher latency for relational queries |

## Consequences

### Positive
- Strong consistency guarantees for financial transactions
- Flexible schema evolution via Prisma Migrate
- Mature tooling (pgAdmin, PostGIS, connection poolers)
- JSONB allows schema-less attributes without NoSQL trade-offs

### Negative
- Requires dedicated PostgreSQL server (not embedded)
- Migration management adds complexity vs schema-less databases
- Higher operational overhead than managed NoSQL solutions

## Related

- Docker: postgres:16-alpine in docker-compose.yml
- Prisma: schema.prisma with 22 models, 3 migrations
- CI: PostgreSQL service container for E2E tests
