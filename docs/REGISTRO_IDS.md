---
id: registro_ids
area: system
type: REGISTRY
module: system
version: 1.0
status: ACTIVE
tags:
  - registry
  - ids
  - documentation
summary: "Registro central de IDs asignados a documentos en docs/. Cada ID es único e inmutable. Sirve como autoridad para evitar colisiones y resolver referencias cruzadas."
---

# Registro de IDs — @tienda/api

## ARCH (Architecture)

| ID  | Archivo                                    | Área         | Tipo | Estado | Creado     |
| --- | ------------------------------------------ | ------------ | ---- | ------ | ---------- |
| 001 | `001_ARCH_SYSTEM_OVERVIEW_1_0_DRAFT.md`    | architecture | ARCH | DRAFT  | 2026-05-23 |
| 042 | `042_ARCH_MONOREPO_STRUCTURE_1_0_DRAFT.md` | architecture | ARCH | DRAFT  | 2026-06-01 |
| 043 | `043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md` | architecture | EXEC | DRAFT  | 2026-06-02 |
| 045 | `045_EXEC_MONOREPO_CI_CD_1_0_DRAFT.md`     | architecture | EXEC | DRAFT  | 2026-06-03 |
| 046 | `046_EXEC_MONOREPO_DB_1_0_DRAFT.md`        | architecture | EXEC | DRAFT  | 2026-06-03 |
| 047 | `047_EXEC_MONOREPO_REDIS_1_0_DRAFT.md`     | architecture | EXEC | DRAFT  | 2026-06-03 |
| 048 | `048_EXEC_VARIABLES_ENTORNO_1_0_DRAFT.md` | architecture | EXEC | DRAFT  | 2026-06-03 |
| 049 | `049_EXEC_DEPLOY_VERCEL_1_0_DRAFT.md`     | architecture | EXEC | ACTIVE | 2026-06-03 |
| 050 | `050_EXEC_PLAN_MONOREPO_VERCEL_DEPLoY_1_0_DRAFT.md` | architecture | EXEC | DRAFT | 2026-06-03 |
| 051 | `051_DEBUG_DEPLOY_VERCEL_1_0_DRAFT.md`  | architecture | DEBUG | DRAFT  | 2026-06-03 |

## DB (Database)

| ID  | Archivo                             | Área     | Tipo | Estado | Creado     |
| --- | ----------------------------------- | -------- | ---- | ------ | ---------- |
| 002 | `002_DB_PRISMA_SCHEMA_1_0_DRAFT.md` | database | DB   | DRAFT  | 2026-05-23 |

## API

| ID  | Archivo                          | Área | Tipo | Estado | Creado     |
| --- | -------------------------------- | ---- | ---- | ------ | ---------- |
| 003 | `003_API_AUTH_1_0_DRAFT.md`      | api  | API  | DRAFT  | 2026-05-23 |
| 004 | `004_API_CATALOG_1_0_DRAFT.md`   | api  | API  | DRAFT  | 2026-05-23 |
| 005 | `005_API_CART_1_0_DRAFT.md`      | api  | API  | DRAFT  | 2026-05-23 |
| 006 | `006_API_CHECKOUT_1_0_DRAFT.md`  | api  | API  | DRAFT  | 2026-05-23 |
| 007 | `007_API_ORDERS_1_0_DRAFT.md`    | api  | API  | DRAFT  | 2026-05-23 |
| 008 | `008_API_PAYMENTS_1_0_DRAFT.md`  | api  | API  | DRAFT  | 2026-05-23 |
| 009 | `009_API_USERS_1_0_DRAFT.md`     | api  | API  | DRAFT  | 2026-05-23 |
| 010 | `010_API_INVENTORY_1_0_DRAFT.md` | api  | API  | DRAFT  | 2026-05-23 |
| 011 | `011_API_ADMIN_1_0_DRAFT.md`     | api  | API  | DRAFT  | 2026-05-23 |

## FLOWS

| ID  | Archivo                          | Área  | Tipo | Estado | Creado     |
| --- | -------------------------------- | ----- | ---- | ------ | ---------- |
| 012 | `012_FLOW_AUTH_1_0_DRAFT.md`     | flows | FLOW | DRAFT  | 2026-05-23 |
| 013 | `013_FLOW_CHECKOUT_1_0_DRAFT.md` | flows | FLOW | DRAFT  | 2026-05-23 |
| 014 | `014_FLOW_PAYMENT_1_0_DRAFT.md`  | flows | FLOW | DRAFT  | 2026-05-23 |

## ADR (Decisions)

| ID  | Archivo                                          | Área      | Tipo | Estado | Creado     |
| --- | ------------------------------------------------ | --------- | ---- | ------ | ---------- |
| 015 | `015_ADR_DATABASE_POSTGRESQL_1_0_DRAFT.md`       | decisions | ADR  | DRAFT  | 2026-05-23 |
| 016 | `016_ADR_AUTH_JWT_RBAC_1_0_DRAFT.md`             | decisions | ADR  | DRAFT  | 2026-05-23 |
| 017 | `017_ADR_PAYMENTS_PROVIDER_PATTERN_1_0_DRAFT.md` | decisions | ADR  | DRAFT  | 2026-05-23 |
| 058 | `058_ADR_DEPLOY_FLOW_VERCEL_1_0_DRAFT.md`        | decisions | ADR  | DRAFT  | 2026-06-07 |
 
## PRM (Prompts)

| ID  | Archivo                             | Área    | Tipo | Estado | Creado     |
| --- | ----------------------------------- | ------- | ---- | ------ | ---------- |
| 018 | `018_PRM_BUILD_AGENT_1_0_DRAFT.md`  | prompts | PRM  | DRAFT  | 2026-05-23 |
| 028 | `028_PRM_BUILD_AGENTS_1_0_DRAFT.md` | prompts | PRM  | DRAFT  | 2026-05-31 |
| 055 | `055_PRM_AGENT_ORCHESTRATOR_1_0_DRAFT.md` | prompts | PRM | DRAFT | 2026-06-05 |

## AI (Knowledge Base)

| ID  | Archivo                              | Área | Tipo | Estado | Creado     |
| --- | ------------------------------------ | ---- | ---- | ------ | ---------- |
| 019 | `019_AI_KNOWLEDGE_BASE_1_0_DRAFT.md` | ai   | AI   | DRAFT  | 2026-05-23 |

## DEV (Development)

| ID  | Archivo                                                | Área | Tipo      | Estado | Creado     |
| --- | ------------------------------------------------------ | ---- | --------- | ------ | ---------- |
| 020 | `020_DEV_WORKFLOW_1_0_DRAFT.md`                        | dev  | DEV       | DRAFT  | 2026-05-30 |
| 023 | `023_EXEC_WORKFLOW_IMPROVEMENTS_1_0_DRAFT.md`          | dev  | EXEC      | DRAFT  | 2026-05-30 |
| 024 | `024_DEV_GUIDE_WORKFLOW_1_0_DRAFT.md`                  | dev  | GUIDE     | DRAFT  | 2026-05-30 |
| 025 | `025_DEV_REFERENCE_WORKFLOW_1_0_DRAFT.md`              | dev  | REFERENCE | DRAFT  | 2026-05-31 |
| 026 | `026_DEV_PROPUESTA_ARTIFACTS_1_0_DRAFT.md`             | dev  | PROPUESTA | DRAFT  | 2026-05-31 |
| 027 | `027_DEV_PLAN_ARTIFACTS_1_0_DRAFT.md`                  | dev  | PLAN      | DRAFT  | 2026-05-31 |
| 029 | `029_EXEC_BUILD_AGENTS_1_0_DRAFT.md`                   | dev  | EXEC      | DRAFT  | 2026-05-31 |
| 030 | `030_DEV_REFERENCE_AGENT_AUTOIMPROVEMENT_1_0_DRAFT.md` | dev  | REFERENCE | DRAFT  | 2026-05-31 |
| 034 | `034_EXEC_PLAN_PROMPT_COMPILER_1_0_DRAFT.md`           | dev  | EXEC      | DRAFT  | 2026-06-02 |
| 044 | `044_DEV_GUIDE_SHELL_STYLE_1_0_DRAFT.md`                | dev  | GUIDE     | DRAFT  | 2026-06-02 |
| 056 | `056_EXEC_AGENT_ORCHESTRATOR_1_0_DRAFT.md`             | dev  | EXEC      | DRAFT  | 2026-06-05 |

## Frontend

| ID  | Archivo                                     | Área     | Tipo | Estado | Creado     |
| --- | ------------------------------------------- | -------- | ---- | ------ | ---------- |
| 021 | `021_API_FRONTEND_SPEC_1_0_DRAFT.md`        | frontend | API  | DRAFT  | 2026-05-30 |
| 022 | `022_EXEC_FRONTEND_PLAN_1_0_DRAFT.md`       | frontend | EXEC | DRAFT  | 2026-05-30 |
| 031 | `031_FRONTEND_EXEC_FASE0_1_0_DRAFT.md`      | frontend | EXEC | DRAFT  | 2026-05-31 |
| 032 | `032_FRONTEND_EXEC_FASE1_1_0_DRAFT.md`      | frontend | EXEC | DRAFT  | 2026-05-31 |
| 033 | `033_FRONTEND_EXEC_FASE2_1_0_DRAFT.md`      | frontend | EXEC | DRAFT  | 2026-05-31 |
| 034 | `034_FRONTEND_EXEC_FASE3_1_0_DRAFT.md`      | frontend | EXEC | DRAFT  | 2026-05-31 |
| 035 | `035_FRONTEND_EXEC_FASE4_1_0_DRAFT.md`      | frontend | EXEC | DRAFT  | 2026-05-31 |
| 036 | `036_FRONTEND_EXEC_FASE5_1_0_DRAFT.md`      | frontend | EXEC | DRAFT  | 2026-06-01 |
| 037 | `037_FRONTEND_EXEC_FASE6_1_0_DRAFT.md`      | frontend | EXEC | DRAFT  | 2026-06-01 |
| 038 | `038_FRONTEND_PLAN_PRODUCCION_1_0_DRAFT.md` | frontend | PLAN | DRAFT  | 2026-06-01 |
| 039 | `039_EXEC_FRONTEND_PRODUCCION_1_0_DRAFT.md` | frontend | EXEC | DRAFT  | 2026-06-01 |
| 040 | `040_FRONTEND_EXEC_PROD1_1_0_DRAFT.md`      | frontend | EXEC | DRAFT  | 2026-06-01 |

## BUGFIX

| ID  | Archivo                                | Área    | Tipo   | Estado | Creado     |
| --- | -------------------------------------- | ------- | ------ | ------ | ---------- |
| 041 | `041_BUGFIX_BACKEND_INIT_1_0_DRAFT.md` | backend | BUGFIX | ACTIVE | 2026-06-01 |
| 057 | `057_BUGFIX_BACKEND_LAMBDA_CRASH_1_0_DRAFT.md` | backend | BUGFIX | DRAFT | 2026-06-06 |
| 059 | `059_BUGFIX_BACKEND_PRISMA_VERCEL_1_0_DRAFT.md` | backend | BUGFIX | DRAFT | 2026-06-08 |
| 060 | `060_BUGFIX_BACKEND_INCLUDEFILES_1_0_DRAFT.md` | backend | BUGFIX | DRAFT | 2026-06-08 |

## INVESTIGATION

| ID  | Archivo                                                | Área    | Tipo         | Estado | Creado     |
| --- | ------------------------------------------------------ | ------- | ------------ | ------ | ---------- |
| 061 | `061_INVESTIGATION_BACKEND_VERCEL_DEPLOY_1_0_DRAFT.md` | backend | INVESTIGATION | DRAFT | 2026-06-08 |
| 062 | `062_PLAYBOOK_BACKEND_VERCEL_DEPLOY_1_0_DRAFT.md` | backend | PLAYBOOK | DRAFT | 2026-06-09 |

---

## IDs de Algoritmos (algoritmos/)

| ID  | Archivo                                 | Área       | Tipo      | Estado | Creado     |
| --- | --------------------------------------- | ---------- | --------- | ------ | ---------- |
| 053 | `053_WORKSTATION_OS_ARCH_PLAN_1_0_DRAFT.md` | infra | PLAN | DRAFT | 2026-06-04 |
| —   | `produccion-plan.md`                    | algorithms | ALG       | DRAFT  | 2026-05-30 |
| —   | `produccion-algoritmo.md`               | algorithms | ALG       | DRAFT  | 2026-05-30 |
| —   | `propuesta-convencion-documentacion.md` | algorithms | PROPUESTA | DRAFT  | 2026-05-30 |
| —   | `flujo-programacion-agentes.md`         | algorithms | ALGP      | DRAFT  | 2026-05-30 |
| ALGP005 | `ALGP005_WORKFLOW_OS_ARCH_v1_0_DRAFT.md`         | algorithms | ALGP      | DRAFT  | 2026-06-02 |

---

## CHATBOT

| ID  | Archivo                                                        | Área    | Tipo | Estado | Creado     |
| --- | -------------------------------------------------------------- | ------- | ---- | ------ | ---------- |
| 002 | `002_CHATBOT_SPEC_TIENDA_ONLINE_ACTIVE.md`                    | chatbot | SPEC | ACTIVE | 2026-05-31 |
| 003 | `003_CHATBOT_FLOW_TIENDA_ONLINE_ACTIVE.md`                    | chatbot | FLOW | ACTIVE | 2026-05-31 |
| 004 | `004_CHATBOT_ALGORITHM_TIENDA_ONLINE_ACTIVE.md`               | chatbot | ALGO | ACTIVE | 2026-05-31 |
| 005 | `005_CHATBOT_IMPLEMENTATION_ACTIONS_1_0_ACTIVE.md`            | chatbot | EXEC | ACTIVE | 2026-05-31 |
| 052 | `052_EXEC_BOT_WAVES_1_0_DRAFT.md`                             | chatbot | EXEC | ACTIVE | 2026-06-04 |
| 054 | `054_EXEC_BOT_WAVES_WAVE2_1_0_DRAFT.md`                      | chatbot | EXEC | DRAFT  | 2026-06-04 |

## Reglas

1. Cada ID se asigna una vez y **nunca se reasigna**, incluso si el documento se elimina.
2. Para crear un nuevo documento, buscar el próximo ID disponible en su área.
3. Los IDs de algoritmos no siguen secuencia numérica (están fuera del sistema docs/).
4. Actualizar este registro cada vez que se cree, deprecate o archive un documento.
