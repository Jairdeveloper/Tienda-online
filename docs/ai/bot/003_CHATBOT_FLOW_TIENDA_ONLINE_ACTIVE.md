---
id: 003
area: CHATBOT
type: FLOW
module: TIENDA_ONLINE
version: v1.0
status: ACTIVE
author: codex
created: 2026-05-31
last_updated: 2026-05-31
dependencies:
  - docs/ai/bot/002_CHATBOT_SPEC_TIENDA_ONLINE_ACTIVE.md
tags:
  - chatbot
  - flow
  - ascii
  - tienda-online
  - b2b
  - soporte
  - administracion
summary: "Diagrama de flujo ASCII del bot de soporte B2B para la tienda online, basado en la especificacion 002."
keywords:
  - chatbot
  - flujo
  - soporte
  - b2b
  - administracion
  - permisos
  - confirmacion
changelog:
  - version: v1.0
    date: 2026-05-31
    author: codex
    changes:
      - "Creacion inicial del diagrama de flujo ASCII del chatbot"
---

# Diagrama de flujo ASCII del bot de soporte B2B

Fuente: `002_CHATBOT_SPEC_TIENDA_ONLINE_ACTIVE.md`.

## 1. Flujo principal por mensaje

```text
┌─────────────────────────────────────────────────────────────────────┐
│                          USUARIO WEB                                │
│  Revendedor B2B | Operador | Admin | Anonimo                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ mensaje + sessionId + JWT opcional
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND REACT/VITE                         │
│  - Usa web/api/client.ts                                             │
│  - Adjunta Authorization: Bearer si existe token                     │
│  - Puede enviar contexto seguro: ruta, producto, carrito, pedido     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ POST /api/v1/bot/messages
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                         BOT CONTROLLER                              │
│  - Recibe DTO                                                        │
│  - Propaga x-request-id                                              │
│  - Entrega mensaje a BotService                                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                         BOT SERVICE                                 │
│  LoadOrCreateBotState(sessionId)                                     │
│  ResolveUserFromJwt(authorization)                                   │
│  Guardar user, roles, permissions, channel="web"                     │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                       NORMALIZACION                                 │
│  - Limpiar espacios y caracteres de control                          │
│  - Detectar idioma, por defecto "es"                                 │
│  - Tokenizar texto                                                   │
│  - Extraer entidades: SKU, UUID, orderId, variantId, cantidad,       │
│    categoria, estado de pedido, fecha, email                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                    CLASIFICACION DE INTENT                          │
│  1. Reglas deterministas de alta prioridad                           │
│  2. Diccionarios de sinonimos y entidades                            │
│  3. RAG/local search opcional para docs                              │
│  4. Calculo de confianza                                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               v
                       ┌───────────────┐
                       │ confianza baja│
                       │ o ambiguedad? │
                       └───────┬───────┘
                               │
                ┌──────────────┴──────────────┐
                │ SI                          │ NO
                v                             v
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│ ASK_CLARIFICATION             │   │ VALIDAR AUTENTICACION           │
│ - Pedir dato faltante          │   │ intent.required_auth?           │
│ - Mantener active_intent       │   └───────────────┬─────────────────┘
│ - Responder sin mutar datos    │                   │
└───────────────┬───────────────┘                   v
                │                         ┌───────────────────┐
                │                         │ requiere login y  │
                │                         │ no hay usuario?   │
                │                         └─────────┬─────────┘
                │                                   │
                │                    ┌──────────────┴──────────────┐
                │                    │ SI                          │ NO
                │                    v                             v
                │      ┌───────────────────────────┐   ┌──────────────────────────┐
                │      │ REQUIRE_LOGIN             │   │ VALIDAR AUTORIZACION     │
                │      │ - Pedir iniciar sesion     │   │ roles/permisos suficientes│
                │      │ - No exponer datos privados│   └─────────────┬────────────┘
                │      └──────────────┬────────────┘                 │
                │                     │                              v
                │                     │                    ┌───────────────────┐
                │                     │                    │ autorizado?       │
                │                     │                    └─────────┬─────────┘
                │                     │                              │
                │                     │               ┌──────────────┴──────────────┐
                │                     │               │ NO                          │ SI
                │                     │               v                             v
                │                     │  ┌───────────────────────────┐   ┌──────────────────────────┐
                │                     │  │ DENY_SAFE                 │   │ RESOLVER CONTEXTO        │
                │                     │  │ - Explicar restriccion     │   │ docs | rules | api | db  │
                │                     │  │ - No filtrar datos         │   └─────────────┬────────────┘
                │                     │  └──────────────┬────────────┘                 │
                │                     │                 │                              v
                │                     │                 │                    ┌───────────────────┐
                │                     │                 │                    │ requiere dato     │
                │                     │                 │                    │ operativo real?   │
                │                     │                 │                    └─────────┬─────────┘
                │                     │                 │                              │
                │                     │                 │               ┌──────────────┴──────────────┐
                │                     │                 │               │ NO                          │ SI
                │                     │                 │               v                             v
                │                     │                 │  ┌───────────────────────────┐   ┌──────────────────────────┐
                │                     │                 │  │ RETRIEVE KNOWLEDGE        │   │ FETCH ALLOWED CONTEXT    │
                │                     │                 │  │ - Reglas                  │   │ - Catalog / Inventory    │
                │                     │                 │  │ - Docs locales            │   │ - Cart / Orders / Admin  │
                │                     │                 │  │ - FAQs                    │   │ - Payments / Users       │
                │                     │                 │  └──────────────┬────────────┘   └─────────────┬────────────┘
                │                     │                 │                 │                              │
                │                     │                 │                 └──────────────┬───────────────┘
                │                     │                 │                                v
                │                     │                 │                    ┌──────────────────────────┐
                │                     │                 │                    │ BUILD ACTION             │
                │                     │                 │                    │ answer | call_api        │
                │                     │                 │                    │ draft_admin_change       │
                │                     │                 │                    │ handoff | deny           │
                │                     │                 │                    └─────────────┬────────────┘
                │                     │                 │                                  │
                │                     │                 │                                  v
                │                     │                 │                        ┌──────────────────┐
                │                     │                 │                        │ modifica datos?  │
                │                     │                 │                        └────────┬─────────┘
                │                     │                 │                                 │
                │                     │                 │                  ┌──────────────┴──────────────┐
                │                     │                 │                  │ SI                          │ NO
                │                     │                 │                  v                             v
                │                     │                 │     ┌───────────────────────────┐   ┌──────────────────────────┐
                │                     │                 │     │ REQUEST_CONFIRMATION      │   │ EXECUTE/COMPOSE          │
                │                     │                 │     │ - Resumen de impacto       │   │ - Ejecutar lectura/API   │
                │                     │                 │     │ - Guardar pending_action   │   │ - Redactar respuesta     │
                │                     │                 │     │ - No ejecutar aun          │   └─────────────┬────────────┘
                │                     │                 │     └──────────────┬────────────┘                 │
                │                     │                 │                    │                              v
                │                     │                 │                    │                  ┌──────────────────────────┐
                │                     │                 │                    │                  │ UPDATE BOT STATE        │
                │                     │                 │                    │                  │ - conversation          │
                │                     │                 │                    │                  │ - context_window        │
                │                     │                 │                    │                  │ - audit_trace           │
                │                     │                 │                    │                  └─────────────┬────────────┘
                │                     │                 │                    │                                │
                └─────────────────────┴─────────────────┴────────────────────┴────────────────────────────────┘
                                                                 │
                                                                 v
┌─────────────────────────────────────────────────────────────────────┐
│                         BOT RESPONSE                               │
│  { sessionId, reply, intent, requiresConfirmation, pendingActionId,  │
│    sources, requestId }                                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND CHAT                              │
│  - Muestra respuesta                                                │
│  - Si requiere confirmacion: botones Confirmar / Cancelar           │
│  - Si requiere login: redirige o muestra CTA                        │
└─────────────────────────────────────────────────────────────────────┘
```

## 2. Flujo de confirmacion de accion administrativa

```text
┌─────────────────────────────────────────────────────────────────────┐
│                  USUARIO CONFIRMA ACCION PENDIENTE                 │
│  Ejemplos: cambiar estado de pedido, ajustar inventario,            │
│  crear/editar/desactivar producto o variante                        │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               │ POST /api/v1/bot/confirm
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                         BOT CONTROLLER                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               v
┌─────────────────────────────────────────────────────────────────────┐
│                         LOAD BOT STATE                              │
│  - Buscar pending_action por sessionId                              │
│  - Verificar expiracion                                             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               v
                       ┌───────────────┐
                       │ accion existe │
                       │ y no expiro?  │
                       └───────┬───────┘
                               │
                ┌──────────────┴──────────────┐
                │ NO                          │ SI
                v                             v
┌───────────────────────────────┐   ┌─────────────────────────────────┐
│ RESPONDER SIN EJECUTAR        │   │ RESOLVER USUARIO DESDE JWT      │
│ "No hay accion pendiente"     │   │ roles + permissions actuales     │
└───────────────────────────────┘   └───────────────┬─────────────────┘
                                                     │
                                                     v
                                            ┌────────────────┐
                                            │ autorizado?    │
                                            └───────┬────────┘
                                                    │
                                     ┌──────────────┴──────────────┐
                                     │ NO                          │ SI
                                     v                             v
                       ┌───────────────────────────┐   ┌──────────────────────────┐
                       │ DENY_SAFE                 │   │ CONFIRMACION EXPLICITA?  │
                       │ - No ejecutar             │   │ "confirmo", boton, etc.  │
                       │ - Explicar restriccion     │   └─────────────┬────────────┘
                       └───────────────────────────┘                 │
                                                                     v
                                                            ┌────────────────┐
                                                            │ confirmada?    │
                                                            └───────┬────────┘
                                                                    │
                                                     ┌──────────────┴──────────────┐
                                                     │ NO                          │ SI
                                                     v                             v
                                       ┌───────────────────────────┐   ┌──────────────────────────┐
                                       │ CANCELAR ACCION           │   │ EJECUTAR API/SERVICIO    │
                                       │ - Limpiar pending_action   │   │ - AdminService           │
                                       │ - Responder cancelacion    │   │ - Orders/Inventory/etc.  │
                                       └───────────────────────────┘   └─────────────┬────────────┘
                                                                                     │
                                                                                     v
                                                                          ┌──────────────────────┐
                                                                          │ AUDITAR RESULTADO    │
                                                                          │ userId, action,      │
                                                                          │ payload, requestId   │
                                                                          └──────────┬───────────┘
                                                                                     │
                                                                                     v
                                                                          ┌──────────────────────┐
                                                                          │ RESPONDER RESULTADO  │
                                                                          │ y limpiar pending    │
                                                                          └──────────────────────┘
```

## 3. Fuentes de contexto y permisos

```text
┌─────────────────────────────────────────────────────────────────────┐
│                         INTENT DETECTADO                            │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         v                     v                     v
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐
│ PUBLIC SUPPORT  │   │ PRIVATE USER    │   │ ADMIN / OPERATOR        │
│ catalog.search  │   │ cart.help       │   │ admin.orders.search     │
│ inventory.check │   │ checkout.help   │   │ admin.inventory.update  │
│ faq.basic       │   │ orders.my_status│   │ admin.products.manage   │
└────────┬────────┘   └────────┬────────┘   └────────────┬────────────┘
         │                     │                         │
         v                     v                         v
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐
│ AUTH: optional  │   │ AUTH: JWT        │   │ AUTH: JWT               │
│ ROLES: none     │   │ ROLES: customer  │   │ ROLES: admin/operator   │
│ DATA: public    │   │ DATA: own user   │   │ DATA: scoped by role    │
└────────┬────────┘   └────────┬────────┘   └────────────┬────────────┘
         │                     │                         │
         v                     v                         v
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────┐
│ CatalogService  │   │ CartService     │   │ AdminService            │
│ InventoryService│   │ CheckoutService │   │ OrdersService           │
│ Local docs/rules│   │ OrdersService   │   │ InventoryService        │
└─────────────────┘   │ PaymentsService │   │ PaymentsService         │
                      └─────────────────┘   └─────────────────────────┘
```

## 4. Estados finales del turno

```text
┌───────────────────────┐
│ TURNO PROCESADO       │
└───────────┬───────────┘
            │
            ├──> ANSWER
            │    Respuesta informativa desde reglas, docs o API.
            │
            ├──> ASK_CLARIFICATION
            │    Falta una entidad critica o el intent no es confiable.
            │
            ├──> REQUIRE_LOGIN
            │    El usuario debe autenticarse para continuar.
            │
            ├──> DENY_SAFE
            │    El usuario no tiene rol o permiso suficiente.
            │
            ├──> REQUEST_CONFIRMATION
            │    Hay una mutacion pendiente; todavia no se ejecuto.
            │
            ├──> ACTION_RESULT
            │    Accion confirmada, ejecutada y auditada.
            │
            └──> HANDOFF
                 El bot no puede resolver con seguridad y deriva a soporte humano.
```
