---
id: 019
area: ai
type: AI
module: knowledge-base
version: 1.0
status: DRAFT
author: system
created: 2026-05-23
last_updated: 2026-05-30
dependencies: []
tags:
  - knowledge-base
  - documentation
  - prompt
summary: "Guía de uso de la base de conocimiento para agentes IA: organización, convención de nombres, frontmatter, estados y cómo navegar los documentos."
keywords:
  - knowledge-base
  - documentacion
  - agentes
  - convencion
  - frontmatter
changelog:
  - version: 1.0
    date: 2026-05-30
    author: system
    changes:
      - "Actualización de frontmatter con tags, summary, keywords, changelog y referencias cruzadas a la nueva convención"
---

# AI Knowledge Base Overview

## Purpose

This knowledge base provides structured documentation for AI agents (like opencode) to understand the @tienda/api codebase quickly and accurately. Each doc targets a specific aspect of the system.

## Organization

```
docs/
├── MASTER_INDEX.md           # Entry point — system map, dependencies, status
├── architecture/             # System-level design docs
├── database/                 # Schema and data model docs
├── api/                      # Per-module API specifications
├── flows/                    # Business process flows (sequence diagrams)
├── decisions/                # Architecture Decision Records (ADRs)
├── prompts/                  # Agent prompt conventions
└── ai/                       # This file — KB overview
```

## Naming Convention

Format: `[ID]_[AREA]_[TIPO]_[MODULO]_[VERSION]_[ESTADO].md`

Examples:
- `001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md`
- `003_API_AUTH_1_0_DRAFT.md`
- `015_ADR_DATABASE_POSTGRESQL_1_0_DRAFT.md`

## YAML Frontmatter Schema

```yaml
---
id: "3-digit sequential"
area: "architecture | database | api | flows | decisions | prompts | ai"
type: "ARCH | DB | API | FLOW | ADR | PRM | AI"
module: "system | auth | catalog | cart | checkout | orders | payments | users | inventory | admin"
version: "semantic (1_0, 1_1, 2_0)"
status: "DRAFT | REVIEW | CURRENT | STALE"
dependencies: ["list of related doc filenames"]
tags: ["keywords"]
---
```

## Status Definitions

| Status  | Definition |
|---------|------------|
| DRAFT   | Initial version, content may be incomplete or unverified |
| REVIEW  | Content complete, pending peer/code review |
| CURRENT | Verified against actual code, up to date |
| STALE   | Known to be outdated, needs update |

## How AI Agents Should Use This KB

1. Start with **MASTER_INDEX.md** for system orientation
2. Read the relevant **API doc** for the module being modified
3. Check **ADRs** for architectural decisions and tradeoffs
4. Review **flow docs** for multi-step business logic
5. Cross-reference **database schema** for model relationships

## Maintenance

- Keep docs in sync with code changes
- Update status to STALE when code diverges
- Bump version for significant doc updates
- Add new ADRs for significant architectural decisions
