---
id: 054
area: CHATBOT
type: EXEC
module: MONOREPO
version: v1.0
status: DRAFT
author: workflow-agent
created: 2026-06-04
last_updated: 2026-06-04
dependencies:
  - docs/ai/bot/052_EXEC_BOT_WAVES_1_0_ACTIVE.md
  - bot/tienda-online-support-bot
  - apps/api/src/app.module.ts
  - apps/api/src/config/env.validation.ts
  - .env.example
tags:
  - chatbot
  - b2b
  - wave2
  - microservicio
  - python
  - proxy
  - nestjs
  - execution-report
summary: "Reporte de ejecucion de la Wave 2 del bot B2B: microservicio Python HTTP (stdlib) + proxy NestJS delgado. Incluye endpoints, arquitectura, pruebas manuales y checklist de aceptacion."
keywords:
  - chatbot
  - b2b
  - wave2
  - microservicio
  - python
  - proxy
  - nestjs
  - ejecucion
  - reporte
changelog:
  - version: v1.0
    date: 2026-06-04
    author: workflow-agent
    changes:
      - "Creacion del reporte de ejecucion de Wave 2"
---

# Reporte de Ejecucion — Wave 2: Microservicio Python HTTP + Proxy NestJS

## 1. Objetivo

Convertir el prototipo Python CLI (Wave 1) en un microservicio HTTP independiente
y crear un proxy delgado en NestJS que valide JWT y enruté peticiones entre el
frontend y el microservicio Python.

---

## 2. Arquitectura Implementada

```text
[Cliente React] ──POST /bot/messages──> [NestJS Proxy]
                                              │
                                        Valida JWT (guards globales)
                                        Extrae token del header
                                              │
                                        proxy HTTP ──────> [Python Microservicio :8000]
                                                                  │
                                                           POST /messages
                                                           POST /confirm
                                                           GET  /health
                                                                  │
                                                           BotService (existente)
                                                           Classifier, Policy, Tools
```

### Flujo de datos

1. El cliente React envía `POST /api/v1/bot/messages` con `Authorization: Bearer <jwt>`
2. Los guards globales (`JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`) validan el JWT
3. El `BotController` extrae el raw JWT del header `Authorization`
4. `BotService` reenvía a Python: `POST http://localhost:8000/messages` con el mismo JWT
5. Python recibe el JWT, lo decodifica (base64, sin firma — la firma ya la validó NestJS),
   resuelve el usuario, clasifica el intent, aplica políticas y responde
6. La respuesta viaja de vuelta al cliente

---

## 3. Archivos Creados

### Python (microservicio)

| Archivo | Descripcion |
|---|---|
| `bot/tienda-online-support-bot/server.py` | Entrypoint HTTP con `http.server` (stdlib). Endpoints: `POST /messages`, `POST /confirm`, `GET /health`. CORS habilitado. Reutiliza `BotService` sin modificaciones. |
| `bot/tienda-online-support-bot/requirements.txt` | Sin dependencias externas. Documenta que stdlib es suficiente para el MVP. |

### NestJS (proxy)

| Archivo | Descripcion |
|---|---|
| `apps/api/src/bot/bot.module.ts` | `BotModule` con `HttpModule.register({ timeout: 10000 })` y `ConfigModule.forFeature(botConfig)` |
| `apps/api/src/bot/bot.controller.ts` | `POST /bot/messages`, `POST /bot/confirm`, `GET /bot/status` (publico). Extrae JWT del header y lo pasa al service. |
| `apps/api/src/bot/bot.service.ts` | Proxy HTTP. Metodos: `processMessage()`, `confirmAction()`, `getStatus()`. Timeout 10s, lanza `503 ServiceUnavailableException` si Python no responde o bot deshabilitado. |
| `apps/api/src/bot/dto/message-request.dto.ts` | `{ text, sessionId?, context? }` con validacion class-validator |
| `apps/api/src/bot/dto/confirm-request.dto.ts` | `{ text?, sessionId }` con validacion |
| `apps/api/src/bot/dto/bot-response.dto.ts` | `{ sessionId, reply, intent, requiresConfirmation, pendingActionId, sources, requestId }` con Swagger decorators |
| `apps/api/src/bot/config/bot.config.ts` | `registerAs('bot', ...)` lee `BOT_SERVICE_URL` y `BOT_ENABLED` |
| `apps/api/src/bot/bot.controller.spec.ts` | 3 tests: processMessage, confirmAction, getStatus |
| `apps/api/src/bot/bot.service.spec.ts` | 9 tests: processMessage (ok + 503), confirmAction (ok + 503), getStatus (ok + unavailable + disabled), disabled service (processMessage 503 + status disabled) |

---

## 4. Archivos Modificados

| Archivo | Cambio |
|---|---|
| `apps/api/src/app.module.ts` | Import `BotModule` (sin `HttpModule` — ya está en BotModule) |
| `apps/api/src/config/env.validation.ts` | Agregadas `BOT_SERVICE_URL` (Joi.string().uri(), default localhost:8000) y `BOT_ENABLED` (Joi.string(), default true) |
| `.env.example` | Seccion `# Bot — Microservicio Python de soporte` con `BOT_SERVICE_URL=http://localhost:8000` y `BOT_ENABLED=true` |
| `apps/api/package.json` | Agregada dependencia `@nestjs/axios: ^4.0.0` (requiere `npm install`) |
| `CHANGELOG.md` | Entrada en `[Unreleased]` con detalle de Wave 2 |
| `docs/REGISTRO_IDS.md` | ID 052 → ACTIVE, ID 053 registrado (infra), ID 054 reservado (Wave 2 exec) |
| `docs/ai/bot/052_EXEC_BOT_WAVES_1_0_DRAFT.md` | Status `DRAFT` → `ACTIVE` |

---

## 5. Variables de Entorno

| Variable | Default | Descripcion |
|---|---|---|
| `BOT_SERVICE_URL` | `http://localhost:8000` | URL del microservicio Python |
| `BOT_ENABLED` | `true` | Habilita/deshabilita endpoints del bot |

---

## 6. Pruebas Manuales (Python Microservicio)

Las 5 pruebas se ejecutaron contra `python3 server.py` en localhost:8000:

| # | Endpoint | Auth | Input | Resultado |
|---|---|---|---|---|
| 1 | `GET /health` | — | — | `200 {"status":"ok","service":"bot-python"}` |
| 2 | `POST /messages` | publico | `{"text":"buscar producto SKU ABC-1"}` | `200`, intent `catalog.search`, reply con fuente `/api/v1/catalog/products` |
| 3 | `POST /messages` | admin | `{"text":"actualizar inventario ABC-1 a 20"}` + `Authorization: Bearer demo-admin` | `200`, intent `admin.inventory.update`, `requiresConfirmation: true`, `pendingActionId` presente |
| 4 | `POST /confirm` | admin | `{"text":"confirmo", "sessionId":"..."}` + `Authorization: Bearer demo-admin` | `200`, `"Accion ejecutada: update_inventory."` |
| 5 | `POST /notfound` | — | — | `404` |

---

## 7. Checklist de Aceptacion

- [x] `bot/tienda-online-support-bot/server.py` creado con entrypoint HTTP (stdlib)
- [x] `bot/tienda-online-support-bot/requirements.txt` creado
- [x] `server.py` responde `POST /messages` y `POST /confirm`
- [x] `server.py` responde `GET /health`
- [x] `apps/api/src/bot/bot.module.ts` creado
- [x] `bot.module.ts` importado en `app.module.ts`
- [x] `bot.controller.ts` con `POST /messages`, `POST /confirm`, `GET /status` (publico)
- [x] `bot.service.ts` con proxy HTTP al microservicio Python
- [x] DTOs creados con validacion (class-validator)
- [x] `BOT_SERVICE_URL` y `BOT_ENABLED` en env.validation.ts
- [x] `HttpModule` importado en BotModule
- [ ] `npm test` pasa con tests del proxy (pendiente: `npm install @nestjs/axios`)
- [x] Prueba manual: Python corriendo + 5 endpoints verificados
- [ ] Prueba manual: Python caido → proxy responde 503 (cubierto por tests unitarios)

---

## 8. Pendientes Post-Wave 2

1. Ejecutar `cd apps/api && npm install @nestjs/axios` para instalar dependencia
2. Ejecutar `npm test` en apps/api para verificar tests del proxy
3. Wave 3: Conectar `BotTools.py` a API real de NestJS (reemplazar datos mock por `urllib.request`)
4. Wave 4: Frontend Chat Widget (componentes React)

---

## 9. Referencias

- `docs/ai/bot/052_EXEC_BOT_WAVES_1_0_ACTIVE.md` — Plan general de waves
- `bot/tienda-online-support-bot/server.py` — Entrypoint HTTP del microservicio
- `bot/tienda-online-support-bot/src/tienda_support_bot/service.py` — BotService (nucleo, sin cambios)
- `apps/api/src/bot/bot.service.ts` — Proxy NestJS
- `CHANGELOG.md` — Entrada Wave 2 en `[Unreleased]`
