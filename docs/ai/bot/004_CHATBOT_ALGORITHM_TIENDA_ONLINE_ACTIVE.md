---
id: 004
area: CHATBOT
type: ALGORITHM
module: TIENDA_ONLINE
version: v1.0
status: ACTIVE
author: codex
created: 2026-05-31
last_updated: 2026-05-31
dependencies:
  - docs/ai/bot/003_CHATBOT_FLOW_TIENDA_ONLINE_ACTIVE.md
tags:
  - chatbot
  - algoritmo
  - pseudocodigo
  - tienda-online
  - b2b
summary: "Algoritmo tecnico de 300 palabras derivado del diagrama de flujo ASCII del chatbot B2B."
keywords:
  - algoritmo
  - datos
  - informacion
  - variables
  - constantes
  - operadores
  - expresiones
changelog:
  - version: v1.0
    date: 2026-05-31
    author: codex
    changes:
      - "Creacion inicial del algoritmo tecnico resumido del flujo del chatbot"
---

# Algoritmo tecnico del chatbot B2B

ALGORITMO `ProcesarMensajeBot(request)`:

Definir **Constantes**: `MIN_CONFIDENCE`, `API_PREFIX="/api/v1"`, `CHANNEL="web"`, `WRITE_ACTIONS={update_order, update_inventory, create_product, update_product, delete_product}`. Las constantes son valores fijos que no cambian durante la ejecucion.

Definir **Variables**: `state`, `user`, `roles`, `permissions`, `message`, `tokens`, `entities`, `intent`, `context`, `action`, `result`, `reply`. Las variables son contenedores que almacenan valores que pueden cambiar durante la ejecucion.

Entrada: recibir **Datos** sin contexto: cadenas `text`, `sessionId`, `authorization`, ruta web, identificadores, cantidades, SKU, UUID, fechas. Los datos son valores aislados, como numeros o cadenas de texto.

Paso 1: `state <- LoadOrCreateBotState(sessionId)`. `user <- ResolveUserFromJwt(authorization)`. Actualizar `state.user`, `state.roles`, `state.permissions`.

Paso 2: normalizar `message.text`; `tokens <- Tokenize(text)`; `entities <- ExtractEntities(tokens)`. Aplicar **Operadores y expresiones**: `hasJwt = authorization != null`, `isAdmin = "admin" in roles`, `confidenceOk = intent.confidence >= MIN_CONFIDENCE`.

Paso 3: `intent <- ClassifyIntent(tokens, entities, state)`. Si `confidenceOk == false`, retornar `AskClarification(intent, entities)`.

Paso 4: transformar datos en **Informacion**: datos procesados con significado. Ejemplo: `SKU="ABC-1"` + intent `catalog.search` => informacion de busqueda de producto; `orderId` + usuario autenticado => informacion de pedido consultable.

Paso 5: si `intent.required_auth == true AND hasJwt == false`, retornar `RequireLogin()`. Si `IsAuthorized(user, intent.roles, intent.permissions) == false`, retornar `DenySafe()`.

Paso 6: si `RequiresOperationalData(intent)`, ejecutar `context <- FetchAllowedContext(intent, entities, user)`; si no, `context <- RetrieveKnowledge(intent, tokens)`.

Paso 7: `action <- BuildAction(intent, entities, context)`. Si `action.type in WRITE_ACTIONS`, guardar `state.pending_action <- action` y retornar `RequestConfirmation(action)`.

Paso 8: `result <- ExecuteReadOrAnswer(action, context)`. `reply <- ComposeAnswer(intent, context, result)`. Actualizar conversacion, fuentes y auditoria. Retornar `{reply, intent, sources, requestId}`.

Subalgoritmo `ConfirmarAccion(request)`: cargar `state.pending_action`. Si es `null` o expiro, retornar error controlado. Recalcular `user`, `roles`, `permissions`; evaluar expresion `authorizedAgain = IsAuthorized(user, action.roles, action.permissions)`. Si es falso, denegar. Si `IsExplicitConfirmation(text) == true`, ejecutar mutacion, auditar payload minimo y limpiar accion pendiente; en caso contrario, cancelar. Terminar siempre con estado consistente, respuesta serializable y trazabilidad verificable.
