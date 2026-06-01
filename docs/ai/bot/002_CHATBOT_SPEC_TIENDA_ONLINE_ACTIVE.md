---
id: 002
area: CHATBOT
type: SPEC
module: TIENDA_ONLINE
version: v1.0
status: ACTIVE
author: codex
created: 2026-05-31
last_updated: 2026-05-31
dependencies:
  - src/app.module.ts
  - src/auth
  - src/users
  - src/catalog
  - src/inventory
  - src/cart
  - src/checkout
  - src/orders
  - src/payments
  - src/admin
  - prisma/schema.prisma
  - web/api/client.ts
  - docs/ai/019_AI_KNOWLEDGE_BASE_1_0_DRAFT.md
  - bot/001_CHATBOT_SPEC_ELIZA_v1.0_ACTIVE.md
  - bot/ALGORITMO_ELIZA.md
tags:
  - chatbot
  - tienda-online
  - b2b
  - soporte
  - administracion
  - rag
  - rule-based
  - web
summary: "Especificacion IA-ready del bot de soporte B2B para la tienda online: contexto del codigo base, entradas, salidas, decisiones, seguridad, plan de implementacion y plan de ejecucion."
keywords:
  - chatbot
  - soporte
  - ecommerce
  - b2b
  - revendedores
  - administracion
  - nestjs
  - react
  - prisma
  - jwt
  - rbac
changelog:
  - version: v1.0
    date: 2026-05-31
    author: codex
    changes:
      - "Creacion inicial de la especificacion del bot de soporte para tienda online B2B"
---

# Especificacion del bot de soporte para tienda online B2B

## 0. Intencion y alcance

Esta especificacion define un chatbot web creado desde cero para dar soporte a usuarios de la tienda online. El bot atendera dos publicos principales:

1. Usuarios finales que operan como revendedores B2B.
2. Personal administrativo encargado de catalogo, inventario, pedidos, pagos y soporte operativo.

El bot debe ser gratuito en plataforma y herramientas. Por tanto, la primera version debe funcionar con software libre, reglas deterministas, recuperacion documental local y, opcionalmente, modelos abiertos ejecutables en infraestructura gratuita o local. No debe depender de servicios pagos ni de APIs comerciales obligatorias.

La especificacion toma como referencia conceptual el documento de ELIZA: entradas, salidas, pasos deterministas, puntos de decision, precondiciones, postcondiciones y terminacion. A diferencia de ELIZA, este bot no simula terapia ni solo re-ensambla texto: usa contexto del codigo base, permisos del usuario, documentacion del proyecto y datos operativos expuestos por la API.

## 1. Contexto del codigo base analizado

### Backend

El proyecto es una API NestJS con modulos por dominio:

- `auth`: registro, login, refresh, logout, usuario actual, JWT y RBAC.
- `users`: perfil y direcciones del usuario autenticado.
- `catalog`: categorias, productos, variantes e inventario publico.
- `inventory`: consulta publica de stock por variante y estado del modulo.
- `cart`: carrito persistente por usuario o sesion.
- `checkout`: creacion de pedidos desde carrito.
- `orders`: listado, detalle, estado y cancelacion de pedidos del usuario.
- `payments`: intentos, confirmacion y webhook mock.
- `admin`: administracion de pedidos, productos, variantes e inventario.
- `common`, `redis`, `prisma`: servicios globales de logging, cache, Redis, locks y Prisma.

Todas las rutas requieren JWT por defecto por la cadena global `JwtAuthGuard -> RolesGuard -> PermissionsGuard`. Las rutas marcadas con `@Public()` quedan disponibles sin autenticacion. El rol administrativo actual usa `@Roles('admin')` en `AdminController`.

### Frontend

El frontend web usa React/Vite. El cliente HTTP central esta en `web/api/client.ts`, con:

- base URL `VITE_API_BASE_URL` o `/api/v1`;
- almacenamiento local de `accessToken` y `refreshToken`;
- interceptor para adjuntar `Authorization: Bearer`;
- refresh automatico ante `401`;
- redireccion a `/login` si no se puede renovar sesion.

El chatbot debe integrarse como experiencia web autenticada, reutilizando el cliente API y respetando la sesion activa del usuario.

### Base de datos

Prisma modela usuarios, roles, permisos, sesiones, direcciones, categorias, productos, variantes, inventario, carritos, pedidos, items, pagos, auditoria, notificaciones, favoritos y resenas.

Los roles semilla son:

- `customer`: cliente o revendedor base.
- `operator`: operador de pedidos e inventario.
- `admin`: administrador total.

Los permisos semilla incluyen lectura y escritura de productos, pedidos, inventario, usuarios y pagos. La primera version del bot debe tratar el rol y los permisos como frontera de seguridad, no como simple informacion de UI.

## 2. Modelo del sistema

```text
BotState = {
  session_id: string,
  user: AuthenticatedUser | AnonymousUser,
  roles: [string],
  permissions: [string],
  channel: "web",
  conversation: [Message],
  context_window: [ContextItem],
  active_intent: Intent | null,
  pending_action: BotAction | null,
  safety_flags: [SafetyFlag],
  audit_trace: [DecisionTrace]
}

Message = {
  role: "user" | "assistant" | "system",
  text: string,
  created_at: iso_datetime,
  metadata: object
}

Intent = {
  name: string,
  confidence: number,
  audience: "reseller" | "admin" | "operator" | "anonymous",
  required_auth: boolean,
  required_roles: [string],
  required_permissions: [string],
  entities: object
}

ContextItem = {
  source: "rules" | "docs" | "api" | "database" | "conversation",
  title: string,
  content: string,
  trust_level: "high" | "medium" | "low",
  expires_at: iso_datetime | null
}

BotAction = {
  type: "answer" | "ask_clarification" | "call_api" | "draft_admin_change" | "handoff" | "deny",
  endpoint: string | null,
  method: string | null,
  payload: object | null,
  requires_confirmation: boolean
}
```

## 3. Capacidades funcionales esperadas

### Soporte para revendedores B2B

El bot debe ayudar a usuarios autenticados a:

- encontrar productos por nombre, SKU, categoria, atributos y disponibilidad;
- explicar variantes, precios, stock disponible y stock reservado cuando la API lo permita;
- guiar la construccion de un carrito;
- explicar errores de carrito, checkout y pagos;
- consultar pedidos propios, estados y pasos siguientes;
- gestionar datos de perfil y direcciones mediante instrucciones guiadas;
- responder preguntas frecuentes sobre flujo de compra, pago contra entrega o mock payment, cancelaciones y disponibilidad.

### Soporte administrativo

El bot debe ayudar a administradores y operadores a:

- buscar pedidos por estado, usuario, rango temporal o identificador;
- explicar y sugerir cambios de estado de pedido;
- consultar inventario y detectar bajo stock;
- preparar actualizaciones de inventario;
- buscar, crear, editar o desactivar productos y variantes;
- resumir pagos asociados a un pedido;
- generar respuestas de soporte para revendedores;
- explicar permisos, roles y restricciones de la API;
- consultar documentacion tecnica interna cuando sea necesario.

Las acciones de escritura administrativas deben requerir confirmacion explicita y deben ejecutarse solo si el usuario tiene rol/permisos suficientes.

## 4. Inputs — what do we start with?

### Entradas de configuracion

1. Documentacion local del proyecto en `docs/`, `README.md`, `AGENTS.md` y especificaciones de API.
2. Mapa de endpoints derivado de controladores NestJS y Swagger.
3. Reglas de intents, entidades y permisos del bot.
4. Catalogo de respuestas seguras para soporte comun.
5. Politica de herramientas gratuitas:
   - motor de reglas local;
   - busqueda textual local con SQLite FTS, Lunr, MiniSearch o equivalente libre;
   - embeddings/modelo abierto opcional si puede ejecutarse gratis;
   - base de datos existente PostgreSQL;
   - Redis existente para sesion/cache si esta disponible.

### Entradas de conversacion

1. Texto del usuario.
2. Idioma detectado; por defecto espanol.
3. JWT activo si existe.
4. Roles y permisos extraidos del token o de `/auth/me`.
5. Estado conversacional previo.
6. Entidades detectadas: SKU, orderId, productId, variantId, email, estado de pedido, cantidad, categoria, fecha.

### Entradas operativas

1. Evento web `POST /bot/messages` o equivalente.
2. Contexto del frontend: ruta actual, carrito actual, producto visible o pedido visible, cuando se envie de forma segura.
3. API interna existente bajo `/api/v1`.
4. Logs con `x-request-id` para trazabilidad.

## 5. Outputs — what's the desired result?

### Salidas funcionales

1. Respuesta textual clara y accionable.
2. Sugerencias de siguiente paso cuando haya ambiguedad.
3. Datos consultados desde API si el usuario tiene acceso.
4. Acciones propuestas, nunca ejecutadas sin confirmacion si modifican datos.
5. Denegacion segura cuando falte autenticacion, rol, permiso o confirmacion.

### Salidas internas

1. Intent detectado y entidades normalizadas.
2. Fuentes usadas: reglas, docs, API o conversacion.
3. Trazas de decision para auditoria.
4. Actualizacion de contexto conversacional.
5. Registro de accion administrativa con usuario, endpoint, payload, resultado y `requestId`.

### Resultado deseado

Una experiencia de soporte B2B capaz de resolver preguntas frecuentes, guiar compras mayoristas/revendedor, asistir operaciones administrativas y operar sobre la API existente con seguridad por rol, permisos y confirmacion humana.

## 6. Steps — ordered, finite, deterministic operations

### A. Inicio de sesion

1. Recibir mensaje desde la web.
2. Leer JWT si existe.
3. Resolver usuario, roles y permisos.
4. Crear o recuperar `BotState` por `session_id`.
5. Registrar `x-request-id`.

### B. Normalizacion

1. Limpiar espacios y caracteres de control.
2. Detectar idioma.
3. Tokenizar texto.
4. Extraer entidades con expresiones regulares y diccionarios:
   - SKU;
   - IDs UUID;
   - estados de pedido;
   - cantidades;
   - categorias;
   - nombres de producto;
   - terminos administrativos.
5. Clasificar audiencia probable: anonimo, revendedor, operador o admin.

### C. Clasificacion de intent

1. Evaluar reglas deterministas de alta prioridad:
   - autenticacion;
   - pedido;
   - producto;
   - inventario;
   - carrito;
   - checkout;
   - pago;
   - administracion;
   - documentacion tecnica.
2. Si hay motor RAG local, recuperar fragmentos relevantes.
3. Calcular intent candidato.
4. Si la confianza es baja, preguntar aclaracion.
5. Si la intencion requiere permisos, validar rol y permisos.

### D. Resolucion por herramientas

1. Si el intent es informativo, responder desde reglas y documentacion.
2. Si el intent requiere lectura publica, llamar endpoints `catalog` o `inventory` marcados como publicos.
3. Si el intent requiere lectura privada, llamar endpoints autenticados con JWT del usuario.
4. Si el intent requiere accion de escritura:
   1. Construir `BotAction`.
   2. Mostrar resumen de impacto.
   3. Pedir confirmacion explicita.
   4. Validar permisos de nuevo en la confirmacion.
   5. Ejecutar API.
   6. Responder con resultado y siguiente paso.
5. Si no hay permiso, denegar y explicar que credencial falta sin revelar datos sensibles.

### E. Respuesta

1. Redactar respuesta breve, concreta y orientada a tarea.
2. Incluir datos exactos cuando provengan de API.
3. Separar hechos conocidos de sugerencias.
4. Evitar inventar precios, stock, estados o politicas.
5. Guardar traza de fuentes e intent.

### F. Cierre o continuacion

1. Si el usuario termina, cerrar la conversacion.
2. Si quedan entidades pendientes, mantener `active_intent`.
3. Si hay accion pendiente, conservar `pending_action` con expiracion corta.

## 7. Decision points — branches

| Punto | Condicion | Rama verdadera | Rama falsa |
| --- | --- | --- | --- |
| Autenticacion | intent requiere usuario autenticado | validar JWT o pedir login | continuar anonimo |
| Autorizacion | rol/permisos suficientes | permitir lectura/accion | denegar o proponer escalado |
| Ambiguedad | faltan entidades criticas | preguntar aclaracion | continuar |
| Escritura | accion modifica datos | pedir confirmacion | ejecutar lectura/respuesta |
| Confirmacion | usuario confirma accion pendiente | ejecutar API | cancelar o reformular |
| Fuente de verdad | dato operativo solicitado | consultar API/DB autorizada | usar docs/reglas |
| Stock | disponibilidad insuficiente | explicar faltante y alternativas | continuar compra |
| Pedido propio | usuario pide pedido que no le pertenece | denegar | mostrar detalle |
| Admin | usuario tiene rol admin | habilitar capacidades administrativas | limitar a soporte revendedor |
| Error API | API devuelve error | explicar causa y siguiente paso | responder con datos |
| Confianza baja | intent < umbral | preguntar | resolver |

## 8. Preconditions — what must be true before each step

| Paso | Precondiciones |
| --- | --- |
| Iniciar bot | La web puede enviar mensajes al backend del bot. |
| Resolver usuario | El JWT, si existe, usa el mismo secreto y payload que `JwtStrategy`. |
| Llamar API | El endpoint existe bajo el prefijo `api/v1` o el configurado. |
| Usar docs | La documentacion local fue indexada o cargada. |
| Leer datos privados | El usuario esta autenticado. |
| Ejecutar acciones admin | El usuario tiene `admin` o permisos equivalentes. |
| Modificar inventario/productos/pedidos | Existe confirmacion explicita del usuario en el turno actual o accion pendiente no expirada. |
| Responder sobre stock/precio/estado | Los datos vienen de API o se declara que no hay dato disponible. |
| Operar gratis | No hay dependencia obligatoria de servicios pagos externos. |

## 9. Postconditions — what's true after each step

| Paso | Postcondiciones |
| --- | --- |
| Normalizacion | El mensaje tiene tokens, entidades candidatas e idioma. |
| Clasificacion | Existe intent o pregunta de aclaracion. |
| Autorizacion | Toda accion esta permitida, denegada o pendiente de login. |
| Recuperacion RAG | Los fragmentos usados quedan registrados como fuentes. |
| Llamada API | La respuesta contiene datos reales o error controlado. |
| Escritura confirmada | La mutacion queda auditada con usuario y requestId. |
| Respuesta final | El usuario recibe una respuesta accionable sin revelar informacion no autorizada. |
| Estado conversacional | `BotState` queda actualizado o cerrado. |

## 10. Algoritmo reconstruido para el bot

```text
ALGORITHM HandleBotMessage(request):
  state = LoadOrCreateBotState(request.session_id)
  user = ResolveUserFromJwt(request.authorization)
  state.user = user
  state.roles = user.roles
  state.permissions = user.permissions

  normalized = Normalize(request.text)
  entities = ExtractEntities(normalized)
  intent = ClassifyIntent(normalized, entities, state)

  IF intent.confidence < MIN_CONFIDENCE:
    RETURN AskClarification(state, intent, entities)

  IF intent.required_auth AND user.is_anonymous:
    RETURN RequireLogin(intent)

  IF NOT IsAuthorized(user, intent.required_roles, intent.required_permissions):
    RETURN DenyWithSafeExplanation(intent)

  IF RequiresOperationalData(intent):
    context = FetchAllowedContext(intent, entities, user)
  ELSE:
    context = RetrieveLocalKnowledge(intent, normalized)

  action = BuildAction(intent, entities, context)

  IF action.type == "draft_admin_change":
    state.pending_action = action
    RETURN RequestExplicitConfirmation(action)

  IF action.type == "call_api":
    result = ExecuteApiAction(action, user)
    RETURN ComposeAnswer(intent, context, result)

  RETURN ComposeAnswer(intent, context, null)
```

```text
ALGORITHM ConfirmPendingAction(request):
  state = LoadBotState(request.session_id)
  action = state.pending_action

  IF action is null OR action.expired:
    RETURN "No hay una accion pendiente vigente."

  user = ResolveUserFromJwt(request.authorization)

  IF NOT IsAuthorized(user, action.required_roles, action.required_permissions):
    RETURN DenyWithSafeExplanation(action)

  IF NOT IsExplicitConfirmation(request.text):
    state.pending_action = null
    RETURN "Accion cancelada."

  result = ExecuteApiAction(action, user)
  Audit(action, user, result)
  state.pending_action = null

  RETURN ComposeActionResult(result)
```

## 11. Intents iniciales

| Intent | Audiencia | Requiere auth | Accion |
| --- | --- | --- | --- |
| `catalog.search` | anonimo/revendedor/admin | no | buscar productos/categorias |
| `catalog.product_detail` | anonimo/revendedor/admin | no | explicar producto, variantes y atributos |
| `inventory.check` | anonimo/revendedor/admin | no | consultar disponibilidad por variante |
| `cart.help` | revendedor | si | guiar uso del carrito |
| `cart.modify_guidance` | revendedor | si | explicar agregar, cambiar o quitar items |
| `checkout.help` | revendedor | si | guiar checkout y direcciones |
| `orders.my_status` | revendedor | si | consultar pedidos propios |
| `orders.cancel_help` | revendedor | si | explicar/canalizar cancelacion |
| `payments.help` | revendedor/admin | si | explicar intento, confirmacion o estado de pago |
| `admin.orders.search` | admin/operator | si | buscar pedidos administrativos |
| `admin.orders.update_status` | admin | si | preparar cambio de estado con confirmacion |
| `admin.products.manage` | admin | si | crear/editar/desactivar productos |
| `admin.variants.manage` | admin | si | crear/editar/desactivar variantes |
| `admin.inventory.update` | admin | si | preparar ajuste de inventario con confirmacion |
| `docs.technical_help` | admin/operator | si | responder sobre API, roles, flujos y errores |
| `fallback.clarify` | todos | no | pedir aclaracion |

## 12. Contrato API propuesto para el bot

La implementacion debe anadirse como modulo nuevo, sin romper dominios existentes:

```text
BotModule
├── BotController
├── BotService
├── IntentClassifierService
├── BotKnowledgeService
├── BotToolService
├── BotPolicyService
└── BotAuditService
```

Endpoints propuestos:

| Metodo | Ruta | Auth | Descripcion |
| --- | --- | --- | --- |
| `POST` | `/bot/messages` | opcional JWT | procesa un mensaje y devuelve respuesta |
| `POST` | `/bot/confirm` | JWT | confirma una accion pendiente |
| `GET` | `/bot/sessions/:id` | JWT | recupera historial permitido |
| `DELETE` | `/bot/sessions/:id` | JWT | cierra sesion del bot |
| `GET` | `/bot/status` | publico | health check del modulo |

Respuesta base:

```json
{
  "sessionId": "uuid",
  "reply": "Texto de respuesta",
  "intent": "catalog.search",
  "requiresConfirmation": false,
  "pendingActionId": null,
  "sources": [
    { "type": "api", "title": "catalog/products" }
  ],
  "requestId": "uuid"
}
```

## 13. Seguridad y restricciones

1. El bot nunca debe saltarse guards, roles ni permisos existentes.
2. El bot no debe leer directamente tablas privadas si existe endpoint de dominio adecuado.
3. Las mutaciones administrativas requieren confirmacion explicita.
4. No se deben exponer hashes, tokens, secretos, variables `.env`, refresh tokens ni datos de otros usuarios.
5. El bot debe distinguir datos reales de recomendaciones.
6. El bot debe responder "no tengo ese dato" antes que inventar.
7. El historial conversacional debe tratarse como dato sensible.
8. Los logs deben evitar payloads con datos personales completos.
9. Las herramientas gratuitas elegidas deben poder ejecutarse localmente o dentro del stack actual.

## 14. Arquitectura gratuita recomendada

### Version base sin LLM

- Clasificador por reglas y patrones.
- Diccionarios de intents y sinonimos.
- Recuperacion documental con busqueda local.
- Plantillas de respuesta parametrizadas.
- Llamadas API controladas.

Esta version es suficiente para soporte operativo inicial y no tiene coste externo.

### Version mejorada con IA abierta opcional

- Modelo local abierto para re-redaccion o clasificacion, por ejemplo mediante Ollama o Transformers.js, si el entorno gratuito lo permite.
- Embeddings locales con modelo pequeno abierto.
- Vector store gratuito/local, por ejemplo PostgreSQL con extension disponible, SQLite, archivos JSON indexados o MiniSearch.

El LLM nunca debe ser autoridad de permisos ni ejecutar acciones directamente. Solo puede ayudar a clasificar, resumir o redactar bajo control del motor de politicas.

## 15. Plan de implementacion

### Fase 0 — Diseno detallado y datos

1. Definir intents iniciales, entidades y sinonimos.
2. Definir DTOs de mensajes, respuestas, fuentes y acciones pendientes.
3. Definir persistencia de sesiones del bot: Redis si se requiere expiracion rapida; PostgreSQL si se requiere auditoria historica.
4. Decidir motor de busqueda local gratuito.
5. Mapear endpoints existentes que el bot puede usar por intent.

### Fase 1 — Modulo backend minimo

1. Crear `src/bot/bot.module.ts`.
2. Crear `BotController` con `/bot/messages`, `/bot/confirm` y `/bot/status`.
3. Crear `BotService` con flujo `HandleBotMessage`.
4. Crear `IntentClassifierService` basado en reglas.
5. Crear `BotPolicyService` para auth, roles, permisos y confirmacion.
6. Crear tests unitarios de intents, autorizacion y confirmacion.

### Fase 2 — Herramientas de dominio

1. Crear `BotToolService` para consultar catalogo, inventario, carrito, pedidos, pagos y admin mediante servicios internos o endpoints de dominio.
2. Implementar respuestas de lectura para catalogo e inventario.
3. Implementar respuestas autenticadas para pedidos propios y carrito.
4. Implementar lectura administrativa de pedidos, productos e inventario.
5. Normalizar errores API a mensajes de soporte.

### Fase 3 — Acciones administrativas seguras

1. Implementar `pending_action`.
2. Implementar confirmacion explicita.
3. Habilitar cambios de estado de pedido.
4. Habilitar ajustes de inventario.
5. Habilitar alta/edicion/desactivacion de productos y variantes.
6. Registrar auditoria de cada accion.

### Fase 4 — Base de conocimiento local

1. Indexar `docs/`, `README.md`, docs API y especificaciones relevantes.
2. Crear `BotKnowledgeService`.
3. Recuperar fragmentos por intent y pregunta.
4. Devolver fuentes en la respuesta.
5. Agregar pruebas con preguntas tecnicas frecuentes.

### Fase 5 — Integracion frontend

1. Crear componente web de chat.
2. Integrar con `web/api/client.ts`.
3. Mostrar estados: cargando, error, requiere login, requiere confirmacion.
4. Permitir confirmar o cancelar acciones pendientes.
5. Insertar el chat en layout autenticado y, opcionalmente, en paginas de producto, carrito, pedido y admin.

### Fase 6 — Calidad, seguridad y despliegue

1. Agregar tests e2e para mensajes anonimos, revendedor y admin.
2. Validar que usuarios sin permisos no acceden a datos privados.
3. Validar que acciones de escritura no ocurren sin confirmacion.
4. Revisar logs y datos personales.
5. Documentar uso y limites del bot.
6. Preparar despliegue con variables actuales, sin servicios pagos obligatorios.

## 16. Plan de ejecucion del plan de implementacion

### Ejecucion 1 — Preparacion

1. Leer `src/app.module.ts`, controladores, servicios y docs API vigentes.
2. Crear backlog tecnico por fase.
3. Definir criterios de aceptacion por intent.
4. Crear matriz `intent -> endpoint -> auth -> roles -> permisos -> confirmacion`.

### Ejecucion 2 — Backend base

1. Crear rama de trabajo.
2. Implementar `BotModule` y DTOs.
3. Registrar el modulo en `AppModule`.
4. Implementar clasificador por reglas para intents publicos.
5. Implementar `/bot/status` y `/bot/messages`.
6. Ejecutar pruebas unitarias manualmente segun politica del repositorio.

### Ejecucion 3 — Seguridad

1. Implementar resolucion de usuario compatible con JWT actual.
2. Implementar politica de permisos.
3. Agregar pruebas de denegacion.
4. Agregar trazas con `x-request-id`.
5. Revisar que no haya bypass de guards.

### Ejecucion 4 — Lecturas operativas

1. Conectar intents de catalogo e inventario.
2. Conectar intents de pedidos propios.
3. Conectar intents administrativos de lectura.
4. Crear respuestas parametrizadas.
5. Probar casos con datos semilla.

### Ejecucion 5 — Mutaciones con confirmacion

1. Implementar acciones pendientes.
2. Implementar confirmacion y cancelacion.
3. Conectar cambio de estado de pedido.
4. Conectar ajuste de inventario.
5. Conectar gestion de productos y variantes.
6. Validar auditoria.

### Ejecucion 6 — Knowledge base

1. Crear indexador local de documentos.
2. Indexar documentacion relevante.
3. Integrar recuperacion en `docs.technical_help`.
4. Probar preguntas sobre API, roles, checkout, pagos y admin.
5. Ajustar ranking y snippets.

### Ejecucion 7 — Frontend

1. Crear componentes de chat.
2. Integrar llamadas a `/bot/messages` y `/bot/confirm`.
3. Manejar login requerido.
4. Manejar confirmaciones administrativas.
5. Probar en paginas principales.

### Ejecucion 8 — Validacion final

1. Ejecutar suite de pruebas permitida manualmente.
2. Ejecutar pruebas e2e con PostgreSQL y Redis disponibles.
3. Revisar accesibilidad basica del chat.
4. Revisar que la documentacion quede actualizada.
5. Preparar changelog antes de cualquier `git push`.

## 17. Terminacion del algoritmo

Cada turno termina porque:

1. El mensaje de entrada es finito.
2. La lista de intents es finita.
3. La extraccion de entidades usa patrones finitos.
4. La recuperacion documental devuelve un numero acotado de fragmentos.
5. Las llamadas API tienen timeout.
6. Las acciones pendientes expiran.
7. Si no hay intent seguro, el bot pregunta aclaracion o deriva a soporte humano.

La sesion termina cuando el usuario cierra el chat, solicita finalizar, expira la sesion o el backend elimina el estado conversacional.

## 18. Observaciones de fidelidad

- El bot debe ser coherente con el codigo existente, no con una tienda ideal inexistente.
- Las capacidades administrativas dependen del modulo `admin` actual.
- El modelo B2B se refleja en soporte a revendedores, pedidos, inventario, disponibilidad y operacion administrativa.
- La primera version debe favorecer reglas, API real y documentacion local antes que generacion libre.
- La IA abierta opcional debe estar subordinada a permisos, fuentes y confirmacion.
