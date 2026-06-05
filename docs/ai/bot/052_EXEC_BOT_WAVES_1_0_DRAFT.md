---
id: 052
area: CHATBOT
type: EXEC
module: MONOREPO
version: v2.0
status: ACTIVE
author: workflow-agent
created: 2026-06-04
last_updated: 2026-06-04
dependencies:
  - docs/ai/bot/002_CHATBOT_SPEC_TIENDA_ONLINE_ACTIVE.md
  - docs/ai/bot/003_CHATBOT_FLOW_TIENDA_ONLINE_ACTIVE.md
  - docs/ai/bot/004_CHATBOT_ALGORITHM_TIENDA_ONLINE_ACTIVE.md
  - docs/ai/bot/005_CHATBOT_IMPLEMENTATION_ACTIONS_1_0_ACTIVE.md
  - bot/tienda-online-support-bot
  - apps/api/src/app.module.ts
  - apps/api/src/admin
  - apps/api/src/catalog
  - apps/api/src/inventory
  - apps/api/src/orders
  - apps/api/src/auth
  - apps/web/src
tags:
  - chatbot
  - b2b
  - soporte
  - waves
  - execution-plan
  - monorepo
  - nestjs
  - react
  - python
  - microservice
summary: "Plan de ejecucion del bot de soporte B2B por ondas transversales (waves). Arquitectura microservicio Python + proxy NestJS. Cada onda entrega funcionalidad completa a traves de backend, frontend, conocimiento y pruebas."
keywords:
  - chatbot
  - b2b
  - soporte
  - waves
  - backend
  - frontend
  - conocimiento
  - pruebas
  - plan-ejecucion
  - microservicio
  - python
changelog:
  - version: v2.0
    date: 2026-06-04
    author: workflow-agent
    changes:
      - "Reescritura completa del plan: arquitectura cambiada de modulo NestJS nativo a microservicio Python + proxy NestJS"
  - version: v1.0
    date: 2026-06-04
    author: workflow-agent
    changes:
      - "Creacion inicial del plan de ejecucion del chatbot B2B por waves transversales"
---

# Plan de Ejecucion del Bot de Soporte B2B por Waves Transversales

## 1. Resumen Ejecutivo

### ¿Qué es el bot?

El bot de soporte B2B es un asistente conversacional para la tienda online que atiende a dos públicos:

1. **Revendedores B2B**: usuarios autenticados que necesitan buscar productos, consultar inventario, gestionar carrito, rastrear pedidos y obtener ayuda en checkout y pagos.
2. **Administradores/Operadores**: personal interno que consulta y modifica pedidos, inventario, productos, variantes y accede a documentación técnica.

### ¿Qué hace?

- Clasifica intenciones del usuario mediante reglas deterministas (sin LLM externo obligatorio)
- Extrae entidades como SKU, orderId, categorías, estados y cantidades
- Resuelve autenticación y autorización contra el sistema JWT + RBAC existente
- Consulta datos operativos reales desde la API NestJS (catálogo, inventario, pedidos)
- Prepara acciones de escritura administrativa con confirmación explícita en dos pasos
- Recupera documentación local para responder preguntas técnicas
- Registra auditoría de cada acción y fuente usada

### Arquitectura general

```text
[Cliente Web React] ──POST /bot/messages──> [NestJS Proxy (thin)]
                                                 │
                                          valida JWT + roles
                                                 │
                                          proxy HTTP ──────> [Python Bot Microservice]
                                                                   │
                                                                   ├── FastAPI/Flask entrypoint
                                                                   ├── BotService (orquestador)
                                                                   ├── IntentClassifier (reglas)
                                                                   ├── BotPolicy (auth + permisos)
                                                                   ├── BotTools (consume API NestJS)
                                                                   ├── BotKnowledge (documentación)
                                                                   └── SessionStore (Redis/archivo)
                                                                   │
                                                                   └── HTTP ──> NestJS API (/api/v1/*)
                                                                                  │
                                                                           datos reales de DB
```

El bot es un **microservicio Python independiente** con su propio entrypoint HTTP (FastAPI o Flask). El backend NestJS actúa como **proxy delgado** que:
1. Recibe la petición del frontend
2. Valida el JWT y extrae usuario/roles/permisos
3. Reenvía al microservicio Python con el contexto de usuario
4. Retorna la respuesta al frontend

A su vez, el microservicio Python **consume la API REST de NestJS** (`/api/v1/*`) para obtener datos operativos reales (catálogo, pedidos, inventario), reutilizando así la lógica de negocio existente sin duplicarla.

### Estado del proyecto

El monorepo `@tienda/api` tiene:
- **Backend NestJS** funcional con 11 módulos de dominio (auth, users, catalog, inventory, cart, checkout, orders, payments, admin, common, redis, health)
- **Frontend React/Vite** con cliente HTTP, autenticación JWT, y páginas para catálogo, carrito, checkout, pedidos y admin
- **Base de datos PostgreSQL** con Prisma ORM, 22 modelos, roles (customer, operator, admin) y permisos semilla
- **Despliegue en Vercel**: API + Frontend unificados bajo `tienda-online-jair08-zped08s-projects.vercel.app`
- **Bot Python funcional**: CLI demo en `bot/tienda-online-support-bot/` con service, classifier, policy, tools, knowledge, nlp, auth y store

---

## 2. Estado Actual (Línea de Base)

### ✅ Ya construido — Python CLI (`bot/tienda-online-support-bot/`)

| Componente | Archivo | Estado |
|---|---|---|
| CLI entry point | `main.py` | ✅ Funcional, argparse, modo mensaje y confirmación |
| BotService (orquestador) | `src/tienda_support_bot/service.py` | ✅ Implementa `process_message`, `confirm_action`, flujo completo |
| Models (DTOs) | `src/tienda_support_bot/models.py` | ✅ User, Message, Intent, ContextItem, BotAction, BotState |
| Constants | `src/tienda_support_bot/constants.py` | ✅ MIN_CONFIDENCE, API_PREFIX, WRITE_ACTIONS, PUBLIC_INTENTS |
| Session Store | `src/tienda_support_bot/store.py` | ✅ MemorySessionStore y JsonFileSessionStore |
| Auth Resolver | `src/tienda_support_bot/auth.py` | ✅ Resuelve demo-admin, demo-customer, anónimo |
| NLP (TextProcessor) | `src/tienda_support_bot/nlp.py` | ✅ Normaliza, tokeniza, extrae entidades (SKU, UUID, emails, estados) |
| Intent Classifier | `src/tienda_support_bot/classifier.py` | ✅ Reglas deterministas para 16 intents |
| BotPolicy | `src/tienda_support_bot/policy.py` | ✅ Login check, autorización, confirmación explícita |
| BotKnowledge | `src/tienda_support_bot/knowledge.py` | ✅ Recuperación de reglas y documentación |
| BotTools | `src/tienda_support_bot/tools.py` | ✅ Build action, fetch context, execute read/answer, execute mutation |
| Validación sintaxis | — | ✅ `python3 -m py_compile` sin errores |
| Caso público | — | ✅ `"buscar producto SKU ABC-1"` → `catalog.search` |
| Caso admin | — | ✅ `"actualizar inventario ABC-1 a 20" --auth demo-admin` → pending_action |
| Confirmación | — | ✅ `"confirmo" --auth demo-admin --confirm` → "Accion ejecutada" |

### ❌ Lo que falta (brecha entre Python demo y producción)

| Capacidad | Estado actual | Necesario para producción |
|---|---|---|
| Entrypoint HTTP (FastAPI/Flask) | ❌ No existe | API REST para recibir requests del proxy NestJS |
| Proxy NestJS | ❌ No existe | BotModule delgado que valida JWT y reenvía a Python |
| Conexión a datos reales | ❌ Simulado (mock data) | BotTools llama NestJS API `/api/v1/*` |
| Autenticación real JWT | ❌ Demo (demo-admin fijo) | Proxy NestJS extrae JWT, envía user context a Python |
| Persistencia de sesiones | ❌ JSON file local | Redis |
| Frontend chat widget | ❌ No existe | Componente React integrado |
| Base de conocimiento indexada | ❌ Simulado (reglas fijas) | Indexación de docs/ con búsqueda local |
| Tests (unitarios + e2e) | ❌ No existen | pytest para Python + Jest para proxy NestJS |
| Docker / Despliegue | ❌ No existe | Dockerfile para el microservicio Python |
| Auditoría real | ❌ Simulado en memoria | Logging estructurado + tabla de auditoría |

---

## 3. Visión de Ondas (Waves)

Cada onda es **transversal**: entrega backend + frontend + conocimiento + pruebas para una capacidad específica. Las ondas se construyen secuencialmente, pero cada una produce valor entregable e integrable.

### 🌊 Wave 1 — Bot Core (Python CLI funcional) ✅ COMPLETADO

**Objetivo**: Tener un prototipo funcional del algoritmo del bot que pueda ejecutarse desde línea de comandos, con todos los componentes del flujo (clasificación, política, herramientas, conocimiento) y casos de prueba demostrables.

**Alcance**:
- Arquitectura completa en Python con service, classifier, policy, tools, knowledge, nlp, auth, store
- 16 intents clasificados por reglas deterministas
- Flujo completo: mensaje → normalización → clasificación → autorización → contexto → acción → respuesta
- Acciones de escritura con confirmación en dos pasos
- Demo funcional para casos público (catalog.search) y admin (admin.inventory.update)

**Criterios de aceptación**:
- ✅ `python3 -m py_compile` en todos los archivos sin errores
- ✅ Mensaje público produce respuesta con intent y fuente
- ✅ Mensaje admin produce pending_action con requiresConfirmation=true
- ✅ Confirmación ejecuta la acción simulada y responde
- ✅ Sin dependencias externas (solo stdlib de Python)

**Archivos creados**:
- `bot/tienda-online-support-bot/main.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/__init__.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/constants.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/models.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/store.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/auth.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/nlp.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/classifier.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/policy.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/knowledge.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/tools.py`
- `bot/tienda-online-support-bot/src/tienda_support_bot/service.py`
- `bot/tienda-online-support-bot/README.md`
- `bot/tienda-online-support-bot/.gitignore`

**Documentación asociada**:
- `docs/ai/bot/002_CHATBOT_SPEC_TIENDA_ONLINE_ACTIVE.md`
- `docs/ai/bot/003_CHATBOT_FLOW_TIENDA_ONLINE_ACTIVE.md`
- `docs/ai/bot/004_CHATBOT_ALGORITHM_TIENDA_ONLINE_ACTIVE.md`
- `docs/ai/bot/005_CHATBOT_IMPLEMENTATION_ACTIONS_1_0_ACTIVE.md`

**Tiempo**: ✅ COMPLETADO

---

### 🌊 Wave 2 — Microservicio Python con API HTTP + Proxy NestJS

**Objetivo**: Convertir el prototipo Python CLI en un microservicio HTTP (FastAPI o Flask) y crear un proxy delgado en NestJS para validar JWT y enrutar peticiones.

#### Arquitectura de la Wave 2

```text
                    ┌─────────────────────────────┐
                    │     NestJS Proxy (thin)      │
                    │  bot.module.ts               │
                    │  ┌───────────────────────┐   │
                    │  │ BotController         │   │
                    │  │ POST /bot/messages    │   │
                    │  │ POST /bot/confirm     │   │
                    │  │ GET  /bot/status      │   │
                    │  └───────┬───────────────┘   │
                    │          │                    │
                    │  Valida JWT + extrae user    │
                    │  Reenvía a Python via HTTP   │
                    └──────────┼──────────────────┘
                               │ POST http://localhost:8000/messages
                               v
                    ┌─────────────────────────────┐
                    │  Python Microservicio        │
                    │  bot/tienda-online-support-bot │
                    │  ┌───────────────────────┐   │
                    │  │ main.py (FastAPI)      │   │
                    │  │ POST /messages         │   │
                    │  │ POST /confirm          │   │
                    │  │ GET  /health           │   │
                    │  └───────┬───────────────┘   │
                    │          │                    │
                    │  Reutiliza todo el código    │
                    │  Python existente (service,  │
                    │  classifier, tools, etc.)    │
                    └─────────────────────────────┘
```

#### 2.1 Entrypoint HTTP para el Python

Agregar dependencias mínimas a `bot/tienda-online-support-bot/requirements.txt`:

```
# Sin framework por ahora — stdlib http.server es suficiente
# para el MVP. FastAPI/Flask se puede agregar en Wave 3 si es necesario.
```

**Archivo nuevo**: `bot/tienda-online-support-bot/server.py`

```python
"""
Entrypoint HTTP para el microservicio bot.
Usa http.server de la stdlib (sin dependencias externas).
"""

import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse
from src.tienda_support_bot.service import BotService
from src.tienda_support_bot.store import MemorySessionStore

service = BotService(session_store=MemorySessionStore())

class BotHandler(BaseHTTPRequestHandler):
    def _send(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())

    def do_POST(self):
        path = urlparse(self.path).path
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}

        auth = self.headers.get("Authorization", "")
        body["authorization"] = auth

        if path == "/messages":
            resp = service.process_message(body)
        elif path == "/confirm":
            resp = service.confirm_action(body)
        else:
            resp = {"error": "not_found"}

        self._send(200, resp)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/health":
            self._send(200, {"status": "ok", "service": "bot-python"})
        else:
            self._send(404, {"error": "not_found"})

def main():
    port = int(os.environ.get("BOT_PORT", "8000"))
    server = HTTPServer(("0.0.0.0", port), BotHandler)
    print(f"Bot microservice listening on port {port}")
    server.serve_forever()

if __name__ == "__main__":
    main()
```

#### 2.2 Proxy NestJS (BotModule delgado)

**Archivos a crear** (en `apps/api/src/bot/`):

```
apps/api/src/bot/
├── bot.module.ts              # BotModule, importado en AppModule
├── bot.controller.ts          # POST /messages, POST /confirm, GET /status
├── bot.controller.spec.ts     # Tests del controller
├── bot.service.ts             # Proxy HTTP al microservicio Python
├── bot.service.spec.ts        # Tests del service
├── dto/
│   ├── message-request.dto.ts     # { text, sessionId?, context? }
│   ├── confirm-request.dto.ts     # { sessionId, text? }
│   └── bot-response.dto.ts        # { sessionId, reply, intent, ... }
└── config/
    └── bot.config.ts              # BOT_SERVICE_URL desde env
```

**`bot.service.ts`** (proxy ligero):

```typescript
@Injectable()
export class BotService {
  private readonly botUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.botUrl = this.configService.get<string>('BOT_SERVICE_URL')
      || 'http://localhost:8000';
  }

  async processMessage(
    text: string,
    sessionId: string,
    user: BotUserContext,
  ): Promise<BotResponse> {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.botUrl}/messages`, {
        text,
        sessionId,
        user: {
          id: user.sub,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
        },
        channel: 'web',
      }),
    );
    return data;
  }

  async confirmAction(
    text: string,
    sessionId: string,
    user: BotUserContext,
  ): Promise<BotResponse> {
    const { data } = await firstValueFrom(
      this.httpService.post(`${this.botUrl}/confirm`, {
        text,
        sessionId,
        user: {
          id: user.sub,
          email: user.email,
          roles: user.roles,
          permissions: user.permissions,
        },
      }),
    );
    return data;
  }
}
```

#### 2.3 Variables de entorno

Agregar a `.env.example` y `env.validation.ts`:

| Variable | Default | Descripción |
|---|---|---|
| `BOT_SERVICE_URL` | `http://localhost:8000` | URL del microservicio Python |
| `BOT_ENABLED` | `true` | Habilita/deshabilita endpoints del bot |

#### 2.4 Modificaciones a archivos existentes

- `apps/api/src/app.module.ts`: Importar `BotModule` y `HttpModule`
- `apps/api/package.json`: Agregar `@nestjs/axios` si no está
- `.env.example` / `env.validation.ts`: Agregar `BOT_SERVICE_URL` y `BOT_ENABLED`

#### 2.5 Criterios de aceptación

1. `GET /api/v1/bot/status` responde `200 OK` con `{ status: "ok" }`
2. `POST /api/v1/bot/messages` con texto público → proxy reenvía a Python → respuesta con intent y fuentes
3. `POST /api/v1/bot/messages` con token admin → Python recibe user context → `requiresConfirmation: true`
4. `POST /api/v1/bot/confirm` → Python ejecuta acción pendiente → respuesta
5. Sin `BOT_SERVICE_URL` configurada → error controlado `503 Service Unavailable`
6. `npm test` en `apps/api` pasa (tests del proxy incluidos)

#### Casos de prueba (onda)

| # | Input | Auth | Esperado |
|---|---|---|---|
| 1 | `"buscar producto SKU ABC-1"` | — | intent: `catalog.search`, fuente: catálogo |
| 2 | `"mis pedidos"` | customer token | `requiresAuth: true` (no implementado en Python) |
| 3 | `"actualizar inventario ABC-1 a 20"` | admin token | `requiresConfirmation: true` |
| 4 | `"confirmo"` (tras #3) | admin token | acción ejecutada (simulada) |
| 5 | Sin Python corriendo | — | `503` del proxy |

#### Dependencias
- Wave 1 ✅ (código Python existente)
- `none` interna

#### Tiempo estimado
- **2-3 ciclos de programación**

---

### 🌊 Wave 3 — Conexión con Datos Reales (Python → NestJS API)

**Objetivo**: El microservicio Python deja de usar datos mock. `BotTools` consume la API REST de NestJS (`/api/v1/*`) para obtener datos reales de catálogo, inventario, pedidos y administración.

#### Flujo de datos

```text
Usuario: "hay stock de ABC-1?"

[Chat Widget] ──POST /bot/messages──> [NestJS Proxy]
                                           │
                                     valida JWT
                                           │
                                     reenvía a Python
                                           │
                                           v
                              [Python Bot Microservice]
                                     │
                               IntentClassifier
                               → "inventory.check"
                                     │
                               BotTools.fetch_allowed_context
                               → GET /api/v1/catalog/inventory/ABC-1
                                     │
                                     v
                              [NestJS API] ──> Prisma ──> PostgreSQL
                                     │
                              respuesta con stock real
                                     │
                                     v
                              Python compone respuesta
                              con dato real
```

#### Capacidades a habilitar

**Lecturas públicas** (sin auth o auth pública):
- `catalog.search` → `GET /api/v1/catalog/products?search=...`
- `catalog.product_detail` → `GET /api/v1/catalog/products/:id` o por SKU
- `inventory.check` → `GET /api/v1/catalog/inventory/:variantId`
- `faq.basic` → conocimiento local (no requiere API)

**Lecturas privadas** (requiere JWT → proxy envía token):
- `cart.help` / `cart.modify_guidance` → `GET /api/v1/cart` (propio del usuario)
- `orders.my_status` → `GET /api/v1/orders`
- `payments.help` → `GET /api/v1/payments/:orderId/intent`

**Lecturas administrativas** (requiere JWT admin):
- `admin.orders.search` → `GET /api/v1/admin/orders`
- `admin.products.manage` → `GET /api/v1/admin/products`
- `admin.variants.manage` → `GET /api/v1/admin/products/:id/variants`

**Escrituras administrativas** (requiere admin + confirmación):
- `admin.orders.update_status` → `PATCH /api/v1/admin/orders/:id/status`
- `admin.inventory.update` → `PATCH /api/v1/admin/inventory/:variantId`
- `admin.products.manage` → `POST /api/v1/admin/products`
- `admin.variants.manage` → `POST /api/v1/admin/products/:id/variants`

#### Modificaciones al código Python

- `bot/tienda-online-support-bot/src/tienda_support_bot/tools.py`: Reemplazar `fetch_allowed_context` mock por llamadas HTTP reales a NestJS usando `urllib.request` (stdlib, sin dependencias)
- `bot/tienda-online-support-bot/src/tienda_support_bot/tools.py`: `execute_mutation` real envía PATCH/POST con JWT del usuario
- `bot/tienda-online-support-bot/src/tienda_support_bot/auth.py`: Actualizar `AuthResolver` para aceptar user context desde el proxy NestJS (usuario ya resuelto)

#### Configuración

Agregar variable de entorno en el microservicio Python:

| Variable | Default | Descripción |
|---|---|---|
| `API_BASE_URL` | `http://localhost:3000/api/v1` | URL base de la API NestJS |

#### Criterios de aceptación

1. `"buscar producto [SKU real]"` devuelve datos reales del producto (nombre, precio, variantes)
2. `"hay stock de [variante real]"` devuelve cantidad real desde inventario
3. `"mis pedidos"` (con token customer) devuelve pedidos reales del usuario
4. `"buscar pedidos admin"` (con token admin) devuelve pedidos administrativos reales
5. Las acciones admin preparan cambios contra datos reales actuales
6. El bot no tiene acceso directo a DB — solo vía API de NestJS

#### Dependencias
- Wave 2 ✅ (microservicio Python + proxy NestJS funcionando)

#### Tiempo estimado
- **2-3 ciclos de programación**

---

### 🌊 Wave 4 — Frontend Chat Widget

**Objetivo**: Crear un componente React de chat interactivo que se integre con los endpoints del bot (vía proxy NestJS), maneje todos los estados conversacionales y se inserte contextualmente en las páginas del frontend.

#### Componentes a crear

```
apps/web/src/
├── components/
│   └── bot/
│       ├── ChatWidget.tsx              # Contenedor flotante/embebido del chat
│       ├── ChatWidget.css              # Estilos del widget (Tailwind + custom)
│       ├── ChatMessage.tsx             # Burbuja individual (usuario / bot)
│       ├── ChatInput.tsx               # Input + botón enviar
│       ├── ChatConfirmDialog.tsx       # Modal de confirmación de acción admin
│       ├── ChatLoginPrompt.tsx         # Estado "requiere iniciar sesión"
│       └── ChatContextProvider.tsx     # Estado global del chat (React Context o Query)
├── hooks/
│   └── useBotChat.ts                  # Hook personalizado para lógica del chat
├── api/
│   └── bot.ts                         # Funciones: sendMessage(), confirmAction(), getStatus()
└── pages/ (o layout)
    └── _app.tsx / layout.tsx          # Inclusión del ChatWidget en layout autenticado
```

#### Lógica del hook `useBotChat`

```typescript
type ChatState = {
  messages: ChatMessage[];
  status: 'idle' | 'loading' | 'error' | 'requiresAuth' | 'requiresConfirmation';
  pendingAction: PendingAction | null;
  sessionId: string;
};

sendMessage(text: string): Promise<void>;
confirmAction(): Promise<void>;
cancelAction(): Promise<void>;
resetChat(): void;
```

#### Integración contextual

El widget debe ser consciente de la página actual para enriquecer el contexto:

| Página actual | Contexto a enviar al bot |
|---|---|
| `/catalog/:id` | `{ currentProductId, currentSku }` |
| `/cart` | `{ currentCartId }` |
| `/orders/:id` | `{ currentOrderId }` |
| `/admin/*` | `{ adminSection: "orders"|"products"|"inventory" }` |

#### Manejo de estados visuales

| Estado | Comportamiento |
|---|---|
| `idle` | Botón flotante, chat cerrado |
| `loading` | Spinner + "Procesando..." |
| `error` | Mensaje de error + botón reintentar |
| `requiresAuth` | "Necesitas iniciar sesión para esto" + link a login |
| `requiresConfirmation` | Botones Confirmar / Cancelar + resumen de la acción |

#### Archivos a modificar

- `apps/web/src/api/client.ts`: Añadir funciones `sendBotMessage`, `confirmBotAction`, `getBotStatus`
- Layout principal para incluir `ChatWidget`

#### Criterios de aceptación

1. ChatWidget se renderiza sin errores en páginas autenticadas
2. Enviar mensaje → `POST /bot/messages` → respuesta se muestra como burbuja
3. Si el bot requiere confirmación, se muestran botones Confirmar/Cancelar
4. Confirmar → `POST /bot/confirm` → resultado se muestra
5. Cancelar → acción cancelada sin ejecutar
6. Si requiere login → enlace a login visible
7. Contexto de página se envía automáticamente según ruta actual
8. Sesión persistente durante la navegación (mismo `sessionId`)

#### Dependencias
- Wave 2 ✅ (proxy NestJS funcionando)

#### Tiempo estimado
- **3-4 ciclos de programación**

---

### 🌊 Wave 5 — Base de Conocimiento + Calidad + Despliegue

**Objetivo**: Dotar al bot de una base de conocimiento indexada, agregar tests E2E, asegurar el despliegue del microservicio Python, y documentar el sistema completo.

#### 5.1 Base de Conocimiento Local (Python)

Indexar documentación del proyecto directamente en el microservicio Python:

**Documentos a indexar**:
- `AGENTS.md`
- `docs/ai/bot/002_CHATBOT_SPEC_TIENDA_ONLINE_ACTIVE.md`
- `docs/ai/bot/003_CHATBOT_FLOW_TIENDA_ONLINE_ACTIVE.md`
- Documentación relevante de `docs/`

**Implementación en `bot/tienda-online-support-bot/src/tienda_support_bot/knowledge.py`**:
- Indexación inicial: leer archivos `.md` al arrancar el servicio
- División en fragmentos por secciones (usando `##` headings)
- Búsqueda por coincidencia de tokens
- Ranking simple por densidad de coincidencias

**Intents habilitados**:
- `docs.technical_help`: "¿cómo funciona el checkout?", "¿qué permisos tiene admin?"

#### 5.2 Docker para el Microservicio Python

Crear `bot/tienda-online-support-bot/Dockerfile`:

```dockerfile
FROM python:3.12-slim

WORKDIR /app
COPY . .
EXPOSE 8000

CMD ["python", "server.py"]
```

Y `bot/tienda-online-support-bot/docker-compose.yml` para desarrollo local:

```yaml
version: "3"
services:
  bot:
    build: .
    ports:
      - "8000:8000"
    environment:
      - API_BASE_URL=http://host.docker.internal:3000/api/v1
```

#### 5.3 Tests

**Tests Python** (pytest):
- `bot/tienda-online-support-bot/tests/test_service.py`
- `bot/tienda-online-support-bot/tests/test_classifier.py`
- `bot/tienda-online-support-bot/tests/test_policy.py`
- `bot/tienda-online-support-bot/tests/test_nlp.py`
- `bot/tienda-online-support-bot/tests/test_tools.py`

**Tests NestJS** (Jest, para el proxy):
- `apps/api/src/bot/bot.controller.spec.ts`
- `apps/api/src/bot/bot.service.spec.ts`

**Tests E2E**:
- Flujo completo: frontend → proxy NestJS → Python → NestJS API → DB

#### 5.4 Despliegue en Vercel

Estrategia para el microservicio Python:

| Opción | Descripción | Pros | Contras |
|---|---|---|---|
| **A) Vercel Serverless Functions (Python)** | El microservicio Python se despliega como función serverless en Vercel | Mismo dominio, sin CORS | Límite 10s timeout, cold starts lentos |
| **B) Contenedor Docker aparte** | Servicio Python en Railway/Render/Fly.io | Sin límite de timeout, escalado independiente | Costo adicional, CORS |
| **C) Vercel + proxy NestJS + Python en segundo plano** | Python se ejecuta como serverless function invocada por NestJS | Unificado | Complejidad |

Recomendación inicial: **Opción A** (Vercel Serverless Functions con Python runtime) para el MVP, migrar a **Opción B** si se necesita más tiempo de ejecución.

#### 5.5 Criterios de aceptación

1. `docs.technical_help` responde con fragmentos reales de documentación indexada
2. Tests Python pasan con `pytest`
3. Tests NestJS (proxy) pasan con `npm test`
4. Docker image del microservicio se construye sin errores
5. Microservicio Python responde en Vercel o entorno de producción
6. El proxy NestJS se comunica correctamente con el microservicio en producción

#### Dependencias
- Wave 2 ✅ (microservicio + proxy)
- Wave 3 ✅ (conexión a datos reales)

#### Tiempo estimado
- **3-4 ciclos de programación**

---

## 4. Roadmap Consolidado

### Diagrama de dependencias entre Waves

```text
Wave 1 (Python Core CLI) ────────────────────────────────────
        │                          (base del microservicio)
        v
Wave 2 (Microservicio HTTP + Proxy NestJS) ────┬──────────────
        │                                      │
        v                                      v
Wave 3 (Datos Reales Python→NestJS)     Wave 4 (Frontend Chat)
        │                                      │
        └──────────┬───────────────────────────┘
                   v
            Wave 5 (Conocimiento + Calidad + Deploy)
```

### Tabla de planificación

| Wave | Nombre | Depende de | Archivos nuevos (Python) | Archivos nuevos (NestJS) | Archivos modificados | Ciclos | Prioridad |
|---|---|---|---|---|---|---|---|
| 1 | Python Core CLI | — | 14 | 0 | 0 | ✅ COMPLETADO | ★★★★★ |
| 2 | Microservicio HTTP + Proxy | Wave 1 | 1 (`server.py`, `requirements.txt`) | ~8 (module, controller, service, DTOs, config) | ~3 (app.module, env, package.json) | 2-3 | ★★★★★ |
| 3 | Datos Reales | Wave 2 | ~2 (tools, auth modificados) | 0 | ~2 (tools.py, auth.py) | 2-3 | ★★★★ |
| 4 | Frontend Chat | Wave 2 | 0 | 0 | ~8 componentes React + 2 API | 3-4 | ★★★★ |
| 5 | Conocimiento + Calidad + Deploy | Waves 2+3 | ~5 (tests, Dockerfile, knowledge) | ~3 (tests proxy) | ~3 (knowledge.py, deploy config) | 3-4 | ★★★ |

### Secuencia recomendada

1. **Wave 2** (crítico — sin microservicio HTTP no hay integración)
2. **Wave 4** (frontend) y **Wave 3** (datos reales) se pueden solapar:
   - Wave 4 funciona con datos mock del Python (ya funcional desde Wave 2)
   - Wave 3 reemplaza mocks por llamadas reales a NestJS
3. **Wave 5** (cierre: conocimiento, tests, Docker, deploy)

**Total estimado**: 10-14 ciclos de programación

---

## 5. Decisión Arquitectónica: Microservicio Python + Proxy NestJS

### Contexto

El prototipo del bot está escrito íntegramente en Python (Wave 1). La pregunta es cómo integrarlo con el backend NestJS existente.

### Opciones consideradas

| Dimensión | Opción A: TypeScript Nativo (módulo NestJS) | Opción B: Python + Proxy NestJS ✅ (ELEGIDA) |
|---|---|---|
| **Stack** | Unificado (Node/NestJS) | Híbrido (Node + Python) |
| **Latencia** | ~0-5ms | ~5-15ms (HTTP localhost) |
| **Código existente** | Requiere traducción completa | **Reutilización total** — el código Python existente se convierte en el microservicio |
| **Complejidad de migración** | Alta (~700 líneas de lógica Python → TS) | **Baja** — server.py envuelve el código existente |
| **Mantenibilidad del bot** | El equipo debe mantener lógica conversacional en TS | Python es el lenguaje estándar para NLP/chatbots. Más fácil de extender con ML en el futuro |
| **Ecosistema NLP/ML futuro** | Pobre en Node.js | **Rico en Python** (NLTK, spaCy, Transformers, Ollama) |
| **Vercel compat.** | Nativo | Python runtime soportado por Vercel |
| **Tests** | Jest (re-escribir todos los tests) | **pytest + unittest existentes** — el código ya está probado en Python |
| **Despliegue** | Un artifact | Dos servicios (pero el proxy NestJS es mínimo) |
| **Separación de concerns** | Acoplado al monorepo | **Independiente** — el bot puede evolucionar sin tocar NestJS |
| **Time to production** | 3-4 ciclos (traducir todo) | **1-2 ciclos** (server.py + proxy) |

### Justificación de la elección

Se elige la **Opción B: Microservicio Python + Proxy NestJS** por las siguientes razones:

1. **Reutilización inmediata**: El código Python existente (~700 líneas en 12 archivos) se convierte directamente en el núcleo del microservicio. No hay que traducir nada — solo agregar un entrypoint HTTP (`server.py`) de ~50 líneas.

2. **Python es el lenguaje natural para chatbots**: El ecosistema Python tiene las mejores herramientas para NLP (spaCy, NLTK), clasificación (scikit-learn) e IA (Transformers, Ollama). Migrar a TypeScript ahora sería cerrar la puerta a futuras mejoras de IA gratuita.

3. **Separación limpia de responsabilidades**: El bot conversacional es inherentemente diferente a una API REST. Tenerlo como servicio separado permite:
   - Desplegarlo independientemente
   - Escalarlo según demanda (el bot puede necesitar más recursos que la API)
   - Desarrollarlo sin riesgo de romper la tienda
   - Usar su propio ciclo de release

4. **Proxy NestJS mínimo y seguro**: El proxy en NestJS no toca la lógica del bot. Solo:
   - Expone los endpoints al frontend
   - Valida JWT con los guards existentes
   - Reenvía el contexto de usuario al microservicio
   - Si el microservicio falla, el proxy responde `503` (la tienda sigue funcionando)

5. **Futuro-proof**: Si en el futuro se quiere agregar un LLM local (Ollama), embeddings (sentence-transformers) o clasificación ML (scikit-learn), Python lo soporta nativamente. En TypeScript requeriría soluciones wrapper o servicios externos.

### Estrategia de implementación

```
Wave 2: server.py (50 líneas) envuelve BotService existente
      + BotModule NestJS (proxy HTTP, ~100 líneas)
      → MVP funcionando en 1-2 ciclos

Wave 3: BotTools.py deja datos mock y llama API REST de NestJS
      → Datos reales sin cambiar la arquitectura

Wave 5: Tests con pytest, Dockerfile, despliegue
      → Producción
```

### Consideraciones operativas

- **Comunicación**: HTTP sobre localhost (proxy → Python). La latencia es ~5-15ms — irrelevante para un chatbot.
- **Resiliencia**: El proxy NestJS debe implementar timeout (5s) y circuit breaker. Si Python no responde, el proxy retorna `503` y el frontend muestra "Servicio no disponible".
- **Health checks**: El proxy verifica `GET /health` del Python periódicamente.
- **Logging**: El proxy propaga `x-request-id` al microservicio Python vía header HTTP.

---

## 6. Referencias

### Documentación del bot (existente)

| Documento | Descripción |
|---|---|
| `docs/ai/bot/002_CHATBOT_SPEC_TIENDA_ONLINE_ACTIVE.md` | Especificación completa: 16 intents, algoritmo, 8 fases, contrato API, seguridad |
| `docs/ai/bot/003_CHATBOT_FLOW_TIENDA_ONLINE_ACTIVE.md` | Diagramas de flujo ASCII |
| `docs/ai/bot/004_CHATBOT_ALGORITHM_TIENDA_ONLINE_ACTIVE.md` | Algoritmo técnico resumido |
| `docs/ai/bot/005_CHATBOT_IMPLEMENTATION_ACTIONS_1_0_ACTIVE.md` | Registro de acciones del prototipo Python |
| `docs/ai/bot/052_EXEC_BOT_WAVES_1_0_DRAFT.md` | Este plan (v2.0) |

### Código base Python (núcleo del microservicio)

| Archivo | Descripción |
|---|---|
| `bot/tienda-online-support-bot/src/tienda_support_bot/service.py` | BotService: orquestación process_message y confirm_action |
| `bot/tienda-online-support-bot/src/tienda_support_bot/models.py` | DTOs: User, Message, Intent, ContextItem, BotAction, BotState |
| `bot/tienda-online-support-bot/src/tienda_support_bot/constants.py` | MIN_CONFIDENCE, API_PREFIX, WRITE_ACTIONS |
| `bot/tienda-online-support-bot/src/tienda_support_bot/store.py` | MemorySessionStore, JsonFileSessionStore |
| `bot/tienda-online-support-bot/src/tienda_support_bot/auth.py` | AuthResolver |
| `bot/tienda-online-support-bot/src/tienda_support_bot/nlp.py` | TextProcessor: normalize, tokenize, extract_entities |
| `bot/tienda-online-support-bot/src/tienda_support_bot/classifier.py` | IntentClassifier: 16 intents por reglas |
| `bot/tienda-online-support-bot/src/tienda_support_bot/policy.py` | BotPolicy: login, authorization, confirmation |
| `bot/tienda-online-support-bot/src/tienda_support_bot/knowledge.py` | BotKnowledge: retrieve (mock → Wave 5 real) |
| `bot/tienda-online-support-bot/src/tienda_support_bot/tools.py` | BotTools: build_action, fetch, execute |

### Estructura del monorepo (NestJS backend)

| Módulo | Servicio que el proxy usará |
|---|---|
| `apps/api/src/auth/` | JwtStrategy, validación JWT |
| `apps/api/src/config/` | env.validation.ts (BOT_SERVICE_URL, BOT_ENABLED) |

### Mapeo de intents vs endpoints NestJS

| Intent | Endpoint NestJS | Método | Auth |
|---|---|---|---|
| `catalog.search` | `/catalog/products?search=` | GET | No |
| `catalog.product_detail` | `/catalog/products/:id` | GET | No |
| `inventory.check` | `/catalog/inventory/:variantId` | GET | No |
| `cart.help` | `/cart` | GET | Sí |
| `orders.my_status` | `/orders` | GET | Sí |
| `admin.orders.search` | `/admin/orders` | GET | Admin |
| `admin.inventory.update` | `/admin/inventory/:variantId` | PATCH | Admin |
| `admin.products.manage` | `/admin/products` | POST | Admin |

---

## Apéndice A: Glosario

| Término | Definición |
|---|---|
| **Wave** | Onda de desarrollo transversal que entrega funcionalidad completa a través de backend, frontend, conocimiento y pruebas |
| **Intent** | Intención del usuario detectada por el clasificador |
| **Entity** | Dato estructurado extraído del mensaje (SKU, orderId, cantidad) |
| **BotAction** | Acción a realizar: answer, call_api, draft_admin_change, handoff, deny |
| **PendingAction** | Acción de escritura pendiente de confirmación explícita |
| **Proxy NestJS** | Módulo delgado en NestJS que valida JWT y reenvía al microservicio Python |
| **Microservicio Python** | Servicio HTTP independiente que contiene toda la lógica del bot |
| **ContextItem** | Fuente de información usada para responder |
| **RBAC** | Role-Based Access Control |
| **WRITE_ACTIONS** | Acciones que modifican datos: update_order, update_inventory, create_product, update_product, delete_product |

## Apéndice B: Checklist de ejecución por Wave

### Wave 2 — Checklist
- [ ] `bot/tienda-online-support-bot/server.py` creado con entrypoint HTTP (stdlib)
- [ ] `bot/tienda-online-support-bot/requirements.txt` creado
- [ ] `server.py` responde `POST /messages` y `POST /confirm`
- [ ] `server.py` responde `GET /health`
- [ ] `apps/api/src/bot/bot.module.ts` creado
- [ ] `bot.module.ts` importado en `app.module.ts`
- [ ] `bot.controller.ts` con POST /messages, POST /confirm, GET /status
- [ ] `bot.service.ts` con proxy HTTP al microservicio Python
- [ ] DTOs creados con validación (class-validator)
- [ ] `BOT_SERVICE_URL` y `BOT_ENABLED` en env.validation.ts
- [ ] `HttpModule` importado en el módulo
- [ ] `npm test` pasa con tests del proxy
- [ ] Prueba manual: Python corriendo + proxy NestJS → mensaje responde
- [ ] Prueba manual: Python caído → proxy responde 503

### Wave 3 — Checklist
- [ ] `tools.py` reemplaza datos mock por `urllib.request` a NestJS API
- [ ] `auth.py` recibe user context desde proxy (usuario ya resuelto)
- [ ] Variable `API_BASE_URL` configurada en el microservicio
- [ ] Intents de lectura pública devuelven datos reales de catálogo/inventario
- [ ] Intents de lectura privada funcionan con JWT forwarding
- [ ] Prueba manual con datos semilla funciona

### Wave 4 — Checklist
- [ ] `ChatWidget.tsx` renderiza en layout autenticado
- [ ] `useBotChat.ts` maneja todos los estados
- [ ] `ChatConfirmDialog.tsx` muestra acción pendiente con botones
- [ ] `ChatMessage.tsx` muestra burbujas diferenciadas
- [ ] `bot.ts` API client con sendMessage, confirmAction
- [ ] Contexto de página se envía correctamente
- [ ] Diseño responsive verificado

### Wave 5 — Checklist
- [ ] `knowledge.py` indexa documentos reales al arrancar
- [ ] Tests Python con pytest (service, classifier, policy, nlp, tools)
- [ ] Tests NestJS del proxy (controller, service)
- [ ] Dockerfile creado y build exitoso
- [ ] `docker-compose.yml` para desarrollo local
- [ ] Microservicio Python desplegado en Vercel (serverless) o contenedor
- [ ] Health checks funcionando en producción
- [ ] CHANGELOG.md actualizado antes de git push
