---
id: 031
area: dev
type: SPEC
module: workflow-bot-agent
version: 1.0
status: DRAFT
author: codex
created: 2026-06-01
last_updated: 2026-06-01
dependencies:
  - workflow.sh
  - workflow/020_DEV_WORKFLOW_1_0_DRAFT.md
  - workflow/025_DEV_REFERENCE_WORKFLOW_1_0_DRAFT.md
  - docs/ai/bot/004_CHATBOT_ALGORITHM_TIENDA_ONLINE_ACTIVE.md
  - bot/tienda-online-support-bot
tags:
  - workflow
  - agent
  - chatbot
  - automation
  - python
  - shell
  - orchestration
summary: "Especificacion para convertir workflow.sh en un agente capaz de interactuar con el bot de soporte en nombre del usuario."
keywords:
  - workflow.sh
  - agente
  - bot
  - orquestador
  - inbox
  - outbox
  - aprobacion
  - permisos
  - python
changelog:
  - version: 1.0
    date: 2026-06-01
    author: codex
    changes:
      - "Creacion inicial de analisis, plan de implementacion, plan de ejecucion y especificacion de agente workflow-bot"
---

# Especificacion — Workflow Bot Agent

## 0. Objetivo

Convertir `workflow.sh` en la base operativa de un agente llamado `workflow-bot-agent`, capaz de interactuar con el bot de soporte en nombre del usuario. El agente debe traducir instrucciones humanas en ciclos controlados de propuesta, plan, ejecucion y verificacion; ademas, debe poder consultar o enviar mensajes al bot Python ubicado en `bot/tienda-online-support-bot`.

El resultado esperado no es reemplazar inmediatamente `workflow.sh`, sino envolverlo con una capa de agente que preserve su filosofia actual: "everything is a file".

## 1. Analisis de `workflow.sh`

### 1.1 Naturaleza del script

`workflow.sh` es un orquestador POSIX `/bin/sh` basado en archivos. Mantiene estado en `.workflow/`, recibe instrucciones, genera propuestas y planes Markdown, espera aprobaciones humanas, ejecuta comandos embebidos en planes, verifica resultados y registra logs.

### 1.2 Directorios y archivos de control

| Elemento | Proposito |
| --- | --- |
| `.workflow/state` | Estado actual: `idle`, `proposing`, `planning`, `executing`, etc. |
| `.workflow/cycle` | Contador numerico del ciclo actual. |
| `.workflow/lock` | Exclusion mutua por PID. |
| `.workflow/workflow.log` | Log cronologico del flujo. |
| `.workflow/checkpoint` | Ultimo paso ejecutado para reanudacion. |
| `.workflow/inbox/` | Entrada de instrucciones `.md`. |
| `.workflow/outbox/` | Propuestas, planes, resultados, logs y verificaciones. |
| `.workflow/context.md` | Contexto generado por `analyze`. |
| `.workflow/listen.pid` | PID del modo escucha. |

### 1.3 Modos actuales

| Modo | Funcion |
| --- | --- |
| `propose` | Crea instruccion en inbox y propuesta en outbox. |
| `await-propuesta` | Espera `.approve` o `.reject`. |
| `plan` | Genera plan desde propuesta. |
| `await-plan` | Espera aprobacion del plan. |
| `execute` | Extrae pasos `### Paso N:` y ejecuta bloques `bash`. |
| `verify` | Ejecuta validaciones con `npm run build` y `npm test` si existen. |
| `listen` | Procesa continuamente archivos `.md` en inbox. |
| `status` | Muestra estado, ciclo, inbox, outbox y ultimas lineas de log. |
| `clean` | Resetea estado, ciclo, lock y listener. |
| `clean-all` | Limpia estado y archivos generados. |
| `analyze` | Escanea `src/` y produce `.workflow/context.md`. |
| `ai` / `ai-propose` | Usa `opencode` si existe; si falla, usa `propose`. |
| `full` | Ejecuta ciclo completo: propuesta, plan, ejecucion y verificacion. |

### 1.4 Fortalezas

1. Persistencia simple y auditable mediante archivos.
2. Flujo recursivo componible.
3. Separacion entre propuesta, plan, ejecucion y verificacion.
4. Aprobacion humana explicita mediante archivos `.approve` y `.reject`.
5. Checkpoint para reanudar ejecucion.
6. Modo `DRY_RUN` para ensayo sin ejecucion real.
7. Fallback sin IA cuando `opencode` no esta disponible.

### 1.5 Riesgos y limitaciones

1. `execute` usa `eval "$commands"`, por lo que requiere control estricto de planes.
2. `verify` ejecuta `npm run build` y `npm test`, contrario a la regla actual de no ejecutar Node automaticamente sin estabilizar el flujo.
3. `rollback` usa `git checkout -- "$PROJECT_ROOT"`, demasiado amplio y potencialmente destructivo para cambios no relacionados.
4. La extraccion de instrucciones en `listen` elimina lineas `- `, lo cual puede perder informacion de listas.
5. `ai_propose` depende de `opencode --model big-pickle`, no necesariamente disponible.
6. No existe un contrato formal para interactuar con el bot Python.
7. No hay modelo de permisos para decidir cuando el agente puede hablar con el bot o ejecutar acciones.

## 2. Especificacion del agente

### 2.1 Nombre

`workflow-bot-agent`

### 2.2 Responsabilidad

Orquestar `workflow.sh` y comunicarse con el bot Python para asistir al usuario durante el ciclo de desarrollo. El agente actua como representante del usuario, pero no debe ejecutar acciones sensibles sin confirmacion explicita.

### 2.3 Arquitectura propuesta

```text
Usuario
  |
  v
workflow-bot-agent
  |
  +--> workflow.sh
  |      +--> .workflow/inbox
  |      +--> .workflow/outbox
  |      +--> .workflow/state
  |
  +--> bot/tienda-online-support-bot
         +--> main.py
         +--> BotService
         +--> JsonFileSessionStore
```

### 2.4 Contrato de interaccion con el bot

El agente debe llamar al bot mediante Python local:

```sh
bot/tienda-online-support-bot/.venv/bin/python \
  bot/tienda-online-support-bot/main.py "<mensaje>" \
  --session-id "workflow-agent" \
  --auth "demo-admin"
```

Para confirmaciones:

```sh
bot/tienda-online-support-bot/.venv/bin/python \
  bot/tienda-online-support-bot/main.py "confirmo" \
  --session-id "workflow-agent" \
  --auth "demo-admin" \
  --confirm
```

### 2.5 Nuevos modos sugeridos para `workflow.sh`

| Modo | Descripcion |
| --- | --- |
| `bot <mensaje>` | Envia mensaje al bot y guarda respuesta en `.workflow/outbox`. |
| `bot-confirm <mensaje>` | Confirma accion pendiente del bot. |
| `agent <instruccion>` | Ejecuta flujo asistido: pregunta al bot, genera contexto, propuesta y plan. |
| `agent-status` | Combina `workflow.sh status` con estado de sesion del bot. |
| `agent-listen` | Escucha inbox y consulta al bot antes de proponer. |

### 2.6 Archivos nuevos sugeridos

```text
.workflow/
├── bot/
│   ├── session_id
│   ├── last_request.json
│   ├── last_response.json
│   └── conversation.md
└── outbox/
    └── cycle_N_BOT_RESPONSE_v1_0.md
```

### 2.7 Reglas de seguridad

1. Toda accion del bot con `requiresConfirmation=true` debe convertirse en aprobacion humana.
2. El agente no debe enviar `--confirm` automaticamente salvo que el usuario lo haya pedido.
3. `execute` debe preferir `DRY_RUN=true` antes de ejecucion real.
4. `verify` no debe ejecutar Node automaticamente sin aprobacion manual o flag explicito.
5. Las respuestas del bot deben guardarse como artefactos en `.workflow/outbox`.
6. Los tokens reales no deben persistirse en texto plano; usar aliases (`demo-admin`, `demo-customer`) en desarrollo.
7. El agente debe registrar `requestId` del bot para trazabilidad.

## 3. Plan de implementacion

### Fase 0 — Preparacion documental

1. Mantener esta especificacion como referencia de implementacion.
2. Definir el contrato estable de respuesta del bot: `reply`, `intent`, `sources`, `requiresConfirmation`, `pendingActionId`, `requestId`.
3. Definir convencion de archivos `.workflow/bot/*`.

### Fase 1 — Adaptador shell hacia bot

1. Agregar constantes a `workflow.sh`:
   - `BOT_DIR`;
   - `BOT_PYTHON`;
   - `BOT_SESSION_FILE`;
   - `BOT_CONVERSATION_FILE`.
2. Crear funcion `bot_python()` que detecte:
   - `.venv/bin/python`;
   - fallback a `python3`;
   - error claro si ninguno existe.
3. Crear funcion `bot_send(message, auth, confirm)` que invoque `main.py`.
4. Guardar la respuesta JSON en `.workflow/bot/last_response.json`.
5. Generar un Markdown legible `cycle_N_BOT_RESPONSE_v1_0.md`.

### Fase 2 — Nuevos modos CLI

1. Implementar `workflow.sh bot "<mensaje>"`.
2. Implementar `workflow.sh bot-confirm "<mensaje>"`.
3. Implementar `workflow.sh agent "<instruccion>"`.
4. Implementar `workflow.sh agent-status`.
5. Actualizar `help` con los nuevos modos.

### Fase 3 — Integracion con propuesta y plan

1. En `agent`, enviar primero la instruccion al bot.
2. Usar `reply`, `intent` y `sources` del bot como contexto adicional.
3. Escribir `.workflow/context.md` enriquecido.
4. Llamar a `ai_propose` o `propose`.
5. Generar plan normal con `plan`.
6. No ejecutar sin aprobacion o sin `DRY_RUN=true`.

### Fase 4 — Politicas de aprobacion

1. Si el bot responde `requiresConfirmation=true`, crear archivo de aprobacion especifico:
   - `.workflow/bot/pending_action.approve`;
   - `.workflow/bot/pending_action.reject`.
2. Bloquear `bot-confirm` hasta que exista aprobacion humana.
3. Registrar decision en `.workflow/workflow.log`.

### Fase 5 — Endurecimiento

1. Reemplazar `eval "$commands"` por ejecucion controlada o lista blanca de comandos.
2. Separar `verify` en:
   - `verify-report`;
   - `verify-node` con aprobacion explicita.
3. Hacer rollback por lista de archivos tocados, no por todo `PROJECT_ROOT`.
4. Mejorar parser de `listen` para conservar listas Markdown.
5. Agregar validacion de JSON de respuesta del bot.

### Fase 6 — Pruebas

1. Validar sintaxis con `sh -n workflow.sh`.
2. Probar `workflow.sh bot "buscar producto SKU ABC-1"`.
3. Probar `workflow.sh bot "actualizar inventario ABC-1 a 20"` y verificar que queda pendiente.
4. Probar rechazo y confirmacion manual.
5. Probar `workflow.sh agent "..."` en modo sin ejecucion.
6. Probar `DRY_RUN=true workflow.sh execute <plan>`.

## 4. Plan de ejecucion del plan de implementacion

### Ejecucion 1 — Crear rama y preflight

1. Revisar estado de git.
2. Confirmar que `.venv/bin/python` del bot existe.
3. Ejecutar una llamada manual al bot con Python.
4. Ejecutar `sh -n workflow.sh` antes de tocar el script.

### Ejecucion 2 — Implementar adaptador minimo

1. Editar `workflow.sh`.
2. Agregar constantes del bot junto a constantes existentes.
3. Agregar `ensure_bot_dirs`.
4. Agregar `bot_python`.
5. Agregar `bot_send`.
6. Agregar generador Markdown para respuesta del bot.
7. Ejecutar `sh -n workflow.sh`.

### Ejecucion 3 — Agregar modos `bot` y `bot-confirm`

1. Extender `case` principal.
2. Actualizar `help`.
3. Probar mensaje publico.
4. Probar mensaje administrativo.
5. Verificar archivos en `.workflow/bot` y `.workflow/outbox`.

### Ejecucion 4 — Agregar modo `agent`

1. Implementar flujo:
   - enviar instruccion al bot;
   - enriquecer contexto;
   - llamar `analyze`;
   - llamar `propose` o `ai_propose`;
   - preparar plan.
2. Garantizar que no ejecuta comandos por defecto.
3. Probar con una instruccion simple.

### Ejecucion 5 — Confirmacion humana

1. Implementar archivos `.approve/.reject` para acciones del bot.
2. Bloquear confirmacion automatica.
3. Probar flujo positivo.
4. Probar flujo rechazado.

### Ejecucion 6 — Endurecimiento incremental

1. Crear funcion `safe_execute_commands` o modo de lista blanca.
2. Cambiar `verify` para respetar la restriccion de Node.
3. Limitar rollback a archivos detectados.
4. Mejorar parser de inbox.
5. Actualizar documentacion de workflow.

### Ejecucion 7 — Validacion final

1. `sh -n workflow.sh`.
2. `./workflow.sh status`.
3. `./workflow.sh bot "buscar producto SKU ABC-1"`.
4. `./workflow.sh agent "crear propuesta para mejorar el bot"` sin ejecucion.
5. Revisar `.workflow/outbox`.
6. Documentar cambios y actualizar `CHANGELOG.md` antes de cualquier push.

## 5. Algoritmo del agente

```text
ALGORITHM WorkflowBotAgent(instruction):
  REQUIRE instruction not empty

  InitWorkflow()
  bot_response = BotSend(instruction, session_id="workflow-agent")
  SaveBotResponse(bot_response)

  IF bot_response.requiresConfirmation:
    CreateHumanApprovalFiles(bot_response.pendingActionId)
    WAIT approve OR reject
    IF reject:
      RETURN "bot action rejected"
    confirm_response = BotConfirm("confirmo")
    SaveBotResponse(confirm_response)

  context = AnalyzeProject(instruction)
  enriched_context = Merge(context, bot_response.reply, bot_response.sources)
  Write(".workflow/context.md", enriched_context)

  proposal = Propose(instruction)
  WAIT proposal approve OR reject
  IF reject:
    RETURN "proposal rejected"

  plan = Plan(proposal)
  WAIT plan approve OR reject
  IF reject:
    RETURN "plan rejected"

  dry_run = Execute(plan, DRY_RUN=true)
  RETURN {
    proposal,
    plan,
    bot_response,
    dry_run
  }
```

## 6. Criterios de aceptacion

1. `workflow.sh bot "<mensaje>"` genera respuesta del bot y archivo Markdown en outbox.
2. `workflow.sh bot-confirm "confirmo"` solo funciona tras aprobacion humana cuando hay accion pendiente.
3. `workflow.sh agent "<instruccion>"` crea contexto enriquecido y propuesta/plan sin ejecutar cambios reales por defecto.
4. El flujo conserva trazabilidad completa en `.workflow/workflow.log`.
5. El bot puede representar al usuario solo dentro de los limites de permisos y confirmaciones.
6. No se ejecutan `npm`, `node`, `prisma` ni `jest` automaticamente sin una aprobacion o modo explicito.
7. La implementacion conserva compatibilidad con los modos existentes.

## 7. Observaciones finales

El camino mas seguro es no reescribir `workflow.sh` como bot, sino convertirlo en un agente-orquestador con un adaptador hacia el bot Python. El script ya tiene lo mas valioso para un agente operativo: estado, ciclo, inbox/outbox, logs, aprobaciones y ejecucion por fases. La nueva capacidad debe agregar conversacion y decision asistida, no eliminar el control humano.

