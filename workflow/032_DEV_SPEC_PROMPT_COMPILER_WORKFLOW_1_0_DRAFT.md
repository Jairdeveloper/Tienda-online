---
id: 032
area: dev
type: SPEC
module: workflow-prompt-compiler
version: 1.0
status: DRAFT
author: codex
created: 2026-06-01
last_updated: 2026-06-01
dependencies:
  - workflow.sh
  - workflow/001_DEV_SPEC_WORKFLOW_AGENT_1_0_DRAFT.md
  - workflow/020_DEV_WORKFLOW_1_0_DRAFT.md
  - workflow/023_EXEC_WORKFLOW_IMPROVEMENTS_1_0_DRAFT.md
  - workflow/025_DEV_REFERENCE_WORKFLOW_1_0_DRAFT.md
  - workflow/026_DEV_PROPUESTA_ARTIFACTS_1_0_DRAFT.md
  - workflow/027_DEV_PLAN_ARTIFACTS_1_0_DRAFT.md
  - workflow/030_DEV_REFERENCE_AGENT_AUTOIMPROVEMENT_1_0_DRAFT.md
  - workflow/031_DEV_SPEC_WORKFLOW_BOT_AGENT_1_0_DRAFT.md
tags:
  - workflow
  - prompt-compiler
  - intermediate-representation
  - agent
  - automation
  - training
  - syntax-directed-translation
summary: "Reescritura de la especificacion de workflow.sh como compilador de prompts con entrenamiento por acciones frecuentes, representacion intermedia y sintesis hacia acciones del programador."
keywords:
  - workflow.sh
  - compilador
  - prompt
  - representacion-intermedia
  - codigo-tres-direcciones
  - entrenamiento
  - acciones-frecuentes
  - agente
  - sintaxis
  - semantica
changelog:
  - version: 1.0
    date: 2026-06-01
    author: codex
    changes:
      - "Creacion inicial de la especificacion workflow.sh como compilador orientado a prompt"
---

# Especificacion — `workflow.sh` como compilador orientado a prompt

## 0. Mision

`workflow.sh` debe actuar en nombre del usuario/programador. Su mision principal es recibir instrucciones en lenguaje natural, interpretarlas como un programa fuente escrito por el usuario, traducirlas a una representacion intermedia auditable y sintetizar acciones, artefactos, planes, comandos o solicitudes de aprobacion que tengan la mayor probabilidad de coincidir con lo que el usuario habria decidido manualmente.

El script no debe ser solamente un ejecutor de comandos. Debe evolucionar hacia un **compilador simple/intermedio/avanzado orientado a prompt**, con capacidad de aprendizaje operativo a partir de acciones frecuentes del usuario.

## 1. Contexto analizado

Los documentos de workflow describen un sistema con estas bases:

1. `workflow.sh` ya implementa un ciclo de programacion: instruccion, propuesta, aprobacion, plan, aprobacion, ejecucion, verificacion.
2. La filosofia actual es "everything is a file"; inbox, outbox, state, cycle, logs y checkpoints son archivos.
3. El agente `workflow-agent` es el orquestador que actua sobre el script y coordina agentes especializados.
4. La mejora de artefactos propone templates externos, frontmatter uniforme y generacion de documentos/codigo.
5. La auto-mejora del agente establece que el workflow debe compararse contra su especificacion y corregir gaps.
6. La especificacion `workflow-bot-agent` propone conectar el workflow con un bot Python que puede asistir al usuario.

La nueva especificacion integra esos conceptos bajo un modelo de compilador.

## 2. Modelo conceptual de compilador

```text
Programa fuente
  = instruccion en lenguaje natural del usuario

Analizador lexico
  = tokeniza palabras, comandos, rutas, entidades, verbos y restricciones

Tokens
  = unidades conocidas: archivo, accion, modulo, comando, permiso, riesgo, aprobacion

Analizador sintactico
  = construye un arbol de intencion desde la estructura del prompt

Arbol sintactico abstracto
  = jerarquia de objetivo, contexto, restricciones, operaciones y verificaciones

Analizador semantico
  = interpreta significado segun proyecto, historial y perfil del usuario

Generador de codigo intermedio
  = produce representacion intermedia probabilistica

Fase de sintesis
  = traduce representacion intermedia a propuesta, plan, comandos, artefactos o respuesta
```

## 3. Definiciones tecnicas

### Datos

Datos son valores sin contexto, como numeros o cadenas de texto. En `workflow.sh`, datos son fragmentos crudos de la entrada:

```text
"crear bot"
"workflow.sh"
"docs/ai/bot"
"npm test"
"admin"
"confirmo"
```

### Informacion

Informacion son datos procesados que tienen significado. Ejemplo:

```text
Dato: "workflow.sh"
Informacion: archivo orquestador principal del flujo de programacion

Dato: "crear bot"
Informacion: intencion de generar codigo/documentacion para un modulo conversacional
```

### Variables

Variables son contenedores que almacenan valores que pueden cambiar durante la ejecucion. Ejemplos:

```text
instruction
tokens
intent
confidence
user_profile
ir_file
plan_file
approval_state
selected_action
```

### Constantes

Constantes son valores fijos que no cambian durante una ejecucion o version del compilador. Ejemplos:

```text
PROJECT_ROOT
WORKFLOW_DIR
INBOX_DIR
OUTBOX_DIR
MIN_CONFIDENCE
DEFAULT_TARGET="proposal"
IR_VERSION="1.0"
```

### Operadores y expresiones

Operadores y expresiones son combinaciones de variables y constantes que producen un valor. Ejemplos:

```text
confidence >= MIN_CONFIDENCE
intent == "create_documentation"
requires_approval AND NOT auto_approved
target_file = OUTBOX_DIR + "/" + artifact_name
```

## 4. Entrada, salida y proceso

### Entrada

La entrada es lenguaje natural:

```text
"Analiza el workflow y crea una especificacion para convertirlo en agente"
"Crea codigo base para el bot"
"Documenta las acciones realizadas"
"Haz commit y push"
```

### Salida

La salida principal es una representacion intermedia. Debe escogerse la representacion con mayor probabilidad de conducir a la respuesta que el usuario daria. La salida secundaria puede ser propuesta, plan, ejecucion, documento, codigo, respuesta al bot o confirmacion.

### Proceso

El proceso debe usar `IR.json` como representacion intermedia principal. El codigo de tres direcciones debe generarse como una traza lineal paralela, legible y auditable, no como el nucleo ejecutable obligatorio del sistema.

La forma de tres direcciones sigue este formato:

```text
resultado = operando1 operador operando2
```

Ejemplos de traza:

```text
t1 = tokenize instruction
t2 = classify t1
t3 = retrieve_profile user
t4 = score t2 t3
ir = build_ir t2 t4
plan = synthesize ir templates
```

Regla arquitectonica: la sintesis y las decisiones deben leer desde `IR.json`; el archivo `.ir` de tres direcciones debe explicar como se produjo esa decision.

## 5. Arquitectura propuesta

```text
workflow.sh
├── front-end del compilador
│   ├── lexical_analyze()
│   ├── parse_prompt()
│   ├── semantic_analyze()
│   └── build_ast()
├── representacion intermedia
│   ├── emit_ir()
│   ├── read_ir()
│   ├── score_ir()
│   └── optimize_ir()
├── trazabilidad intermedia
│   ├── emit_three_address_trace()
│   ├── emit_decision_trace()
│   └── explain_ir()
├── memoria de entrenamiento
│   ├── record_action()
│   ├── learn_preference()
│   ├── retrieve_similar_actions()
│   └── update_user_profile()
├── sintesis
│   ├── synthesize_proposal()
│   ├── synthesize_plan()
│   ├── synthesize_artifact()
│   ├── synthesize_command()
│   └── synthesize_bot_message()
├── ejecucion supervisada
│   ├── require_approval()
│   ├── dry_run()
│   ├── execute_plan()
│   └── verify_result()
└── persistencia
    ├── .workflow/state
    ├── .workflow/inbox
    ├── .workflow/outbox
    ├── .workflow/ir
    ├── .workflow/profile
    ├── .workflow/training
    └── .workflow/logs
```

## 6. Estructura de archivos necesaria

```text
.workflow/
├── state
├── cycle
├── lock
├── workflow.log
├── inbox/
│   └── cycle_N_instruction.md
├── outbox/
│   ├── cycle_N_PROPUESTA_v1_0_DRAFT.md
│   ├── cycle_N_PLAN_v1_0_DRAFT.md
│   ├── cycle_N_RESULTADO_v1_0.md
│   └── cycle_N_VERIFICACION_v1_0.md
├── ir/
│   ├── cycle_N_AST.json
│   ├── cycle_N_TAC.ir
│   ├── cycle_N_IR.json
│   └── cycle_N_DECISION_TRACE.md
├── profile/
│   ├── user_preferences.yml
│   ├── frequent_actions.jsonl
│   ├── approval_patterns.jsonl
│   └── command_policy.yml
├── training/
│   ├── examples.jsonl
│   ├── corrections.jsonl
│   ├── accepted_plans.jsonl
│   └── rejected_plans.jsonl
├── templates/
│   ├── proposal.md.tpl
│   ├── plan.md.tpl
│   ├── execution.md.tpl
│   ├── documentation.md.tpl
│   └── code.md.tpl
└── bot/
    ├── last_request.json
    ├── last_response.json
    └── conversation.md
```

## 7. Representacion intermedia

### 7.1 IR JSON

`IR.json` es la representacion intermedia canonica. Todas las fases posteriores deben consumir esta estructura: scoring, optimizacion, sintesis, aprobacion, ejecucion supervisada y entrenamiento.

```json
{
  "irVersion": "1.0",
  "cycle": 32,
  "source": {
    "type": "natural_language",
    "text": "Crea codigo base para el bot"
  },
  "intent": {
    "name": "create_code_scaffold",
    "confidence": 0.87,
    "target": "bot",
    "expectedOutput": "python_code"
  },
  "semantics": {
    "actor": "workflow-agent",
    "actsOnBehalfOf": "user",
    "requiresApproval": true,
    "riskLevel": "medium"
  },
  "operands": [
    { "name": "instruction", "type": "string" },
    { "name": "project_context", "type": "document_set" }
  ],
  "operations": [
    {
      "result": "t1",
      "operator": "analyze",
      "operand1": "instruction",
      "operand2": "project_context"
    },
    {
      "result": "proposal",
      "operator": "synthesize",
      "operand1": "t1",
      "operand2": "proposal_template"
    }
  ],
  "outputs": [
    "proposal",
    "plan"
  ]
}
```

### 7.2 Codigo de tres direcciones

El codigo de tres direcciones es una representacion auxiliar. Su funcion es explicar, depurar y auditar la transformacion del prompt, no reemplazar al `IR.json`.

```text
t1 = LEX instruction
t2 = PARSE t1
t3 = SEMANTIC t2 profile
t4 = RETRIEVE_SIMILAR t3 training
t5 = SCORE t3 t4
t6 = BUILD_IR t3 t5
t7 = OPTIMIZE_IR t6 policy
proposal = SYNTHESIZE t7 proposal_template
plan = SYNTHESIZE proposal plan_template
approval = REQUIRE_APPROVAL plan policy
```

Usos permitidos:

1. Inspeccionar el pipeline de compilacion.
2. Detectar en que fase se degrado la interpretacion del prompt.
3. Comparar decisiones entre ciclos.
4. Explicar el scoring y la seleccion de acciones.
5. Registrar puntos de control de seguridad antes de una accion sensible.

Usos no recomendados:

1. Ejecutarlo como bytecode.
2. Convertirlo en fuente primaria de verdad.
3. Hacer que `workflow.sh execute` dependa directamente del archivo `.ir`.
4. Sustituir planes, aprobaciones o politicas por instrucciones TAC.

### 7.3 Arbol sintactico abstracto

```text
Instruction
├── Goal: create/rewrite/analyze/execute/document/commit
├── Target: workflow.sh | bot | docs | codebase
├── Constraints
│   ├── no_node_auto
│   ├── require_changelog_before_push
│   └── preserve_user_changes
├── Inputs
│   ├── attached_documents
│   └── project_context
└── ExpectedOutputs
    ├── markdown_spec
    ├── implementation_plan
    └── execution_plan
```

## 8. Niveles del compilador

### 8.1 Compilador simple

Objetivo: transformar lenguaje natural en propuesta/plan usando reglas deterministas.

Componentes:

1. Tokenizador simple por palabras.
2. Diccionario de intents.
3. Parser basado en patrones.
4. Generador de IR minimo.
5. Sintesis a Markdown.

Ejemplo:

```text
Entrada: "Crea documentacion del bot"
t1 = detect_action "crea"
t2 = detect_target "bot"
ir = action:create_documentation target:bot
Salida: docs/ai/bot/NNN_...
```

### 8.2 Compilador intermedio

Objetivo: incorporar contexto, perfil del usuario y decision probabilistica.

Componentes:

1. Analizador lexico con tokens tipados.
2. Parser con gramatica BNF.
3. Analizador semantico con contexto del proyecto.
4. Tabla de simbolos.
5. Memoria de acciones frecuentes.
6. Scoring de probabilidad.
7. Representacion intermedia JSON canonica + traza de tres direcciones.

### 8.3 Compilador avanzado

Objetivo: actuar de forma semiautonoma en nombre del usuario con alta similitud conductual.

Componentes:

1. Aprendizaje por ejemplos aceptados/rechazados.
2. Perfil de preferencias del usuario.
3. Optimizador de IR.
4. Politicas de seguridad y permisos.
5. Integracion con bot.
6. Planificador multi-agente.
7. Evaluador de similitud: "esto se parece a lo que el usuario haria".
8. Sintesis hacia codigo, docs, commits, comandos o conversaciones.

## 9. Gramatica propuesta BNF

```bnf
<programa> ::= <instruccion>

<instruccion> ::= <accion> <objeto> <restricciones_opt> <salida_opt>

<accion> ::= "analiza"
           | "crea"
           | "reescribe"
           | "implementa"
           | "documenta"
           | "ejecuta"
           | "verifica"
           | "commitea"
           | "haz push"

<objeto> ::= <archivo>
           | <modulo>
           | <documento>
           | <bot>
           | <workflow>
           | <codigo>

<restricciones_opt> ::= ""
                      | <restriccion>
                      | <restriccion> "," <restricciones_opt>

<restriccion> ::= "no hagas mas nada"
                | "espera instrucciones"
                | "usa python"
                | "guarda en" <ruta>
                | "sin ejecutar node"
                | "con aprobacion"

<salida_opt> ::= ""
               | "crea archivo md"
               | "crea plan"
               | "crea codigo"
               | "haz commit"
```

Esta gramatica describe la sintaxis. La semantica se define mediante reglas informales y ejemplos.

## 10. Tabla de simbolos

La tabla de simbolos del workflow debe mapear nombres detectados a significado operativo.

| Simbolo | Tipo | Significado |
| --- | --- | --- |
| `workflow.sh` | script | Orquestador principal. |
| `bot` | modulo | Chatbot Python de soporte B2B. |
| `docs/ai/bot` | ruta | Documentacion del bot. |
| `workflow/` | ruta | Documentacion del workflow. |
| `commit` | accion | Crear snapshot Git local. |
| `push` | accion sensible | Enviar commits al remoto, requiere changelog y credenciales. |
| `npm` | comando sensible | No ejecutar automaticamente. |
| `python3` | comando permitido | Ejecutar validaciones Python si aplica. |
| `approve` | evento | Aprobacion humana. |

## 11. Entrenamiento por acciones frecuentes

### 11.1 Objetivo

El workflow debe aprender patrones de accion frecuentes del usuario para aumentar la probabilidad de producir respuestas similares a las que el usuario daria.

### 11.2 Fuente de entrenamiento

```text
.workflow/training/examples.jsonl
.workflow/training/accepted_plans.jsonl
.workflow/training/rejected_plans.jsonl
.workflow/training/corrections.jsonl
git log --oneline
CHANGELOG.md
docs creados por el usuario
comandos ejecutados y aprobados
```

### 11.3 Registro de ejemplo

```json
{
  "input": "Crea codigo base para el bot",
  "chosenIntent": "create_python_scaffold",
  "acceptedOutput": "bot/tienda-online-support-bot",
  "commandsApproved": ["python3 -m py_compile"],
  "commandsRejected": ["npm test"],
  "style": {
    "language": "es",
    "docsFirst": true,
    "requiresChangelogBeforePush": true
  }
}
```

### 11.4 Scoring de similitud

```text
score = w1 * intent_similarity
      + w2 * file_pattern_similarity
      + w3 * command_policy_similarity
      + w4 * documentation_style_similarity
      + w5 * approval_history_similarity
```

La accion con mayor `score` se selecciona como representacion intermedia probable.

## 12. Semantica del usuario/programador

El script debe modelar al usuario con estas preferencias iniciales:

1. Quiere que el agente actue en su nombre.
2. Quiere documentacion formal en `.md`.
3. Quiere planes de implementacion y ejecucion.
4. Quiere evitar ejecucion automatica de Node/npm/prisma/jest.
5. Quiere mantener trazabilidad.
6. Quiere que los cambios significativos se documenten en `CHANGELOG.md` antes de push.
7. Quiere comandos concretos cuando los pide.
8. Quiere que el sistema espere nuevas instrucciones cuando lo indica.

Estas preferencias son informacion semantica, no solo datos.

## 13. Modos nuevos propuestos para `workflow.sh`

| Modo | Funcion |
| --- | --- |
| `compile <texto>` | Compila lenguaje natural a IR. |
| `ir <archivo>` | Muestra representacion intermedia de un ciclo. |
| `train <archivo>` | Registra ejemplo aceptado/rechazado. |
| `profile` | Muestra perfil aprendido del usuario. |
| `predict <texto>` | Predice la accion mas probable sin ejecutarla. |
| `synthesize <ir>` | Genera propuesta/plan/codigo desde IR. |
| `agent <texto>` | Ejecuta ciclo asistido por perfil, IR y aprobaciones. |
| `bot <texto>` | Consulta al bot y guarda la respuesta como contexto. |

## 14. Flujo completo

```text
Usuario escribe lenguaje natural
  |
  v
LEX: convertir texto en tokens
  |
  v
PARSE: construir AST
  |
  v
SEMANTIC: resolver significado con proyecto + perfil
  |
  v
TRAINING LOOKUP: recuperar acciones frecuentes similares
  |
  v
SCORE: elegir representacion intermedia mas probable
  |
  v
IR: guardar JSON canonico
  |
  v
TRACE: emitir codigo de tres direcciones + decision trace
  |
  v
SYNTHESIS: propuesta, plan, comando, doc, codigo o mensaje al bot
  |
  v
APPROVAL: solicitar confirmacion si hay riesgo
  |
  v
EXECUTION: dry-run o ejecucion controlada
  |
  v
FEEDBACK: registrar aceptacion, rechazo o correccion
```

## 15. Algoritmo

```text
ALGORITHM CompilePrompt(instruction):
  REQUIRE instruction not empty

  raw_data = instruction
  tokens = LexicalAnalyze(raw_data)
  ast = Parse(tokens)
  symbols = LoadSymbolTable(PROJECT_ROOT)
  profile = LoadUserProfile()
  training = LoadTrainingExamples()

  semantic_info = SemanticAnalyze(ast, symbols, profile)
  candidates = GenerateIRCandidates(semantic_info)

  FOR candidate IN candidates:
    similar_actions = RetrieveSimilarActions(candidate, training)
    candidate.score = Score(candidate, similar_actions, profile)

  best_ir = SelectMaxScore(candidates)
  optimized_ir = OptimizeIR(best_ir, policy)

  WriteIR(optimized_ir)
  WriteThreeAddressTrace(optimized_ir)
  WriteDecisionTrace(optimized_ir)

  IF optimized_ir.requires_approval:
    approval = RequestApproval(optimized_ir)
    IF approval == rejected:
      RecordTraining(instruction, optimized_ir, rejected)
      RETURN rejected

  output = Synthesize(optimized_ir)
  RecordTraining(instruction, optimized_ir, accepted_or_pending)
  RETURN output
```

## 16. Ejemplo de traduccion

### Entrada

```text
"Analiza workflow.sh y crea una especificacion en workflow/"
```

### Tokens

```text
ACTION(analiza)
TARGET(workflow.sh)
ACTION(crea)
TYPE(especificacion)
PATH(workflow/)
```

### AST

```text
Instruction
├── Analyze
│   └── Target: workflow.sh
└── Create
    ├── ArtifactType: specification
    └── OutputPath: workflow/
```

### Tres direcciones

La siguiente traza explica el camino hasta el documento, pero la sintesis real debe usar el `IR.json`.

```text
t1 = LEX input
t2 = PARSE t1
t3 = RESOLVE_TARGET t2 symbol_table
t4 = CLASSIFY_ARTIFACT t2 profile
t5 = SCORE t4 training
ir = BUILD_IR t3 t5
doc = SYNTHESIZE ir spec_template
```

### Salida

```text
workflow/032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md
```

## 17. Politicas de seguridad

1. Toda accion destructiva requiere aprobacion humana.
2. Todo `push` requiere `CHANGELOG.md` actualizado.
3. Todo comando Node/npm/prisma/jest requiere aprobacion explicita.
4. El compilador debe preservar cambios no relacionados del usuario.
5. El perfil aprendido no debe incluir secretos.
6. El entrenamiento debe registrar decisiones, no credenciales.
7. Si `confidence < MIN_CONFIDENCE`, debe preguntar o generar propuesta, no ejecutar.

## 18. Criterios de aceptacion

1. El script puede transformar una instruccion natural en `IR.json` canonico.
2. El script puede emitir una traza de tres direcciones derivada del `IR.json`.
3. El script puede sintetizar una propuesta o plan desde IR.
4. El script puede registrar ejemplos aceptados/rechazados.
5. El script puede usar acciones frecuentes para elegir entre varias IR candidatas.
6. El script conserva los modos existentes.
7. El script respeta aprobaciones humanas y restricciones de seguridad.
8. El script produce trazabilidad completa por ciclo.

## 19. Plan de implementacion

### Fase 1 — IR minima

1. Crear `.workflow/ir`.
2. Agregar modo `compile`.
3. Implementar tokenizador simple.
4. Implementar IR JSON base.
5. Emitir traza de codigo de tres direcciones en `.ir`.
6. Emitir `decision_trace.md`.

### Fase 2 — Sintaxis y semantica

1. Definir gramatica BNF en documento.
2. Implementar parser por patrones.
3. Crear tabla de simbolos inicial.
4. Resolver rutas, acciones y tipos de artefactos.

### Fase 3 — Sintesis

1. Conectar IR con `propose`.
2. Conectar IR con `plan`.
3. Conectar IR con `artifact`.
4. Conectar IR con `bot`.

### Fase 4 — Entrenamiento

1. Crear `.workflow/training`.
2. Registrar planes aceptados.
3. Registrar planes rechazados.
4. Registrar correcciones del usuario.
5. Calcular score de similitud.

### Fase 5 — Perfil del usuario

1. Crear `.workflow/profile/user_preferences.yml`.
2. Registrar preferencias observadas.
3. Aplicar preferencias durante scoring.
4. Permitir inspeccion con modo `profile`.

### Fase 6 — Seguridad y aprobaciones

1. Centralizar politica de comandos.
2. Bloquear comandos sensibles.
3. Integrar aprobaciones.
4. Registrar decision trace.

### Fase 7 — Validacion

1. Validar sintaxis shell.
2. Probar `compile`.
3. Probar `predict`.
4. Probar `synthesize`.
5. Probar entrenamiento con ejemplos.

## 20. Plan de ejecucion

1. Crear documento de especificacion como referencia.
2. Crear branch de implementacion.
3. Ejecutar preflight: `sh -n workflow.sh`.
4. Agregar directorios `.workflow/ir`, `.workflow/training`, `.workflow/profile`.
5. Implementar `compile` sin tocar `execute`.
6. Probar con prompts simples.
7. Verificar que `IR.json` es consumido por `synthesize`.
8. Verificar que `.ir` solo se usa como traza explicativa.
9. Agregar `train`.
10. Probar aceptacion/rechazo.
11. Agregar scoring.
12. Agregar `predict`.
13. Conectar `synthesize` con templates existentes.
14. Documentar cambios.
15. Actualizar `CHANGELOG.md` antes de commit/push.

## 21. Principio final

`workflow.sh` debe seguir siendo un script auditable. La inteligencia no debe vivir en una caja negra, sino en archivos: tokens, AST, `IR.json`, trazas de tres direcciones, decision traces, perfiles y ejemplos de entrenamiento. El `IR.json` es la fuente de verdad estructurada; el codigo de tres direcciones es una explicacion lineal de la decision. Asi el agente puede actuar en nombre del usuario, pero el usuario siempre puede inspeccionar por que eligio una accion y corregirlo para mejorar la siguiente compilacion.
