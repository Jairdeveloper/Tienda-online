---
id: 034
area: dev
type: EXEC
module: workflow
version: 1.0
status: DRAFT
tags:
  - plan
  - implementation
  - compiler
  - tui
  - bot
  - http-server
  - training
summary: "Plan de implementacion para transformar workflow.sh en un compilador orientado a prompt con TUI (Ink/React), servidor HTTP de providers, bot entrenado y entrenamiento continuo. Responde a la especificacion 032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW.md."
keywords:
  - plan
  - implementacion
  - fases
  - compilador
  - prompt
  - tui
  - bot
  - servidor
  - entrenamiento
changelog:
  - version: 1.0
    date: 2026-06-02
    author: workflow-agent
    description: Creacion del plan de implementacion del compilador orientado a prompt
---

# Plan de Implementacion — Compilador Orientado a Prompt

Basado en decisiones arquitectonicas:
- **TUI**: Node.js + Ink/React (`apps/tui/`)
- **HTTP Server**: Servidor de providers independiente (`apps/server/`)
- **Modularización**: workflow.sh se mantiene como CLI, delega IA al HTTP Server
- **Compilador**: Pipeline completo LEX → PARSE → SEMANTIC → SCORE → IR → TRACE → SYNTHESIS
- **Bot**: Entrenado en workflow.sh (modos, flags, comandos, ejemplos)

---

## Arquitectura general

```
┌──────────────────────────────────────────────────────────┐
│                        USUARIO                            │
├──────────────┬────────────────┬──────────────────────────┤
│  CLI directo │  TUI (Ink)     │  Bot conversacional       │
│  workflow.sh │  apps/tui/     │  (via HTTP o TUI)         │
└──────┬───────┴──────┬─────────┴──────────┬───────────────┘
       │              │                    │
       │         HTTP │               HTTP │
       ▼              ▼                    ▼
┌─────────────────────────────────────────────────────────┐
│              HTTP Server (apps/server/)                   │
│                                                          │
│  POST /ai/generate    → Provider router                  │
│  POST /ai/chat        → Bot conversation                 │
│  POST /compile        → Compiler pipeline                 │
│  GET  /training       → Training data access              │
│  POST /train/example  → Register training example         │
│  GET  /profile        → User profile access               │
│  POST /profile        → Update user profile               │
│                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                  │
│  │ OpenAI   │ │Anthropic │ │ opencode │   ← Providers     │
│  └──────────┘ └──────────┘ └──────────┘                  │
└────────────────────────┬────────────────────────────────┘
                         │
                    ┌────┴─────┐
                    │ workflow │
                    │  .sh     │  ← Compila, delega IA al server
                    └──────────┘
```

### Principios de diseno

1. **Separacion de concerns**: HTTP Server maneja IA, compilacion y entrenamiento. workflow.sh es cliente ligero.
2. **Stateless**: El servidor HTTP es stateless. Estado persiste en `.workflow/` (archivos).
3. **Degradacion gradual**: Si server no responde, workflow.sh cae a opencode local.
4. **Plugin de providers**: Nuevos providers = nuevo archivo en `providers/` + config.
5. **Todo es entrenable**: Cada decision del compilador se registra para mejorar predicciones futuras.

---

## Estructura de directorios

```
/
├── workflow.sh                    # CLI (entry point, delega al server)
├── workflow/                      # Documentacion del workflow
│   └── 034_EXEC_PLAN_PROMPT_COMPILER_1_0_DRAFT.md
│
├── apps/
│   ├── server/                    # NUEVO: HTTP Server de providers y compilador
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── src/
│   │   │   ├── index.ts           # Bootstrap
│   │   │   ├── config/
│   │   │   │   └── providers.ts   # API keys, provider config
│   │   │   ├── routes/
│   │   │   │   ├── ai.ts          # POST /ai/generate, /ai/chat
│   │   │   │   ├── compile.ts     # POST /compile
│   │   │   │   ├── training.ts    # GET/POST /training
│   │   │   │   └── profile.ts     # GET/POST /profile
│   │   │   ├── providers/
│   │   │   │   ├── provider.interface.ts
│   │   │   │   ├── openai.provider.ts
│   │   │   │   ├── anthropic.provider.ts
│   │   │   │   └── opencode.provider.ts
│   │   │   ├── compiler/
│   │   │   │   ├── lexer.ts       # Tokenizacion
│   │   │   │   ├── parser.ts      # AST builder
│   │   │   │   ├── semantic.ts    # Semantic analysis + tabla de simbolos
│   │   │   │   ├── scorer.ts      # Training-based scoring
│   │   │   │   ├── ir.ts          # IR.json generator
│   │   │   │   ├── tracer.ts      # Three-address code
│   │   │   │   └── synthesizer.ts # Proposal/plan synthesis
│   │   │   ├── services/
│   │   │   │   ├── training.service.ts
│   │   │   │   └── profile.service.ts
│   │   │   └── types/
│   │   │       ├── ir.types.ts
│   │   │       └── compiler.types.ts
│   │   └── test/
│   │       ├── lexer.test.ts
│   │       ├── parser.test.ts
│   │       ├── scorer.test.ts
│   │       └── compiler.e2e.test.ts
│   │
│   └── tui/                       # NUEVO: TUI con Ink/React
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.tsx          # Entry point
│           ├── app.tsx            # Root component
│           ├── components/
│           │   ├── dashboard.tsx       # Estado, ciclo, log
│           │   ├── compiler.tsx        # Editor + IR/AST/Synthesis display
│           │   ├── approvals.tsx       # Aprobar/rechazar con teclas
│           │   ├── training.tsx        # CRUD de ejemplos
│           │   ├── profile.tsx         # Preferencias de usuario
│           │   └── bot.tsx             # Chat con el bot asistente
│           ├── hooks/
│           │   ├── use-workflow.ts     # HTTP client al server
│           │   └── use-bot.ts          # Chat client
│           └── api/
│               └── client.ts          # Axios/fetch wrapper
│
├── .workflow/
│   ├── training/
│   │   └── examples.jsonl       # Ejemplos de entrenamiento
│   ├── profile/                 # Perfiles de usuario
│   │   └── default.yml
│   ├── symbols/                 # Tabla de simbolos
│   │   └── default.json
│   └── ir/                      # IR.json de ciclos anteriores
│       └── cycle_1_IR.json
```

---

## Pipeline del compilador (POST /compile)

```
Instruccion: "Crea un modulo de pagos en NestJS"
                     │
                     ▼
┌─────────────────────────────────────────┐
│           1. LEXER (lexer.ts)            │
│                                         │
│  Tokeniza la instruccion:               │
│  [ACTION(crea), TARGET(modulo),         │
│   DOMAIN(pagos), TECH(NestJS)]          │
│                                         │
│  Output: Token[]                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│           2. PARSER (parser.ts)          │
│                                         │
│  Construye AST desde tokens:            │
│  Instruction {                          │
│    goal: "crea",                        │
│    target: "modulo",                    │
│    domain: "pagos",                     │
│    constraints: ["NestJS"],             │
│    inputs: [],                          │
│    outputs: ["codigo", "tests"]         │
│  }                                      │
│                                         │
│  Output: ASTNode                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        3. SEMANTIC (semantic.ts)         │
│                                         │
│  Resuelve con tabla de simbolos:        │
│  NestJS  → tech: backend framework      │
│  modulo  → target: NestJS module        │
│  pagos   → domain: payment processing   │
│  crea    → action: generate new code    │
│                                         │
│  Resuelve con perfil de usuario:        │
│  user prefers: "spanish docs"           │
│  user prefers: "include tests"          │
│                                         │
│  Output: ResolvedAST                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          4. SCORER (scorer.ts)           │
│                                         │
│  Busca en training ejemplos similares:  │
│  similarity = w1*intent + w2*file       │
│             + w3*command + w4*style     │
│                                         │
│  Si confianza > 0.8: usar ejemplo       │
│  Si no: generar desde cero              │
│                                         │
│  Output: ScoreResult + matchedExample   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│          5. IR (ir.ts)                   │
│                                         │
│  Genera IR.json canonico:               │
│  {                                      │
│    "instruction": "...",                │
│    "tokens": [...],                     │
│    "ast": {...},                        │
│    "symbols": {...},                    │
│    "score": {...},                      │
│    "decisions": [...],                  │
│    "confidence": 0.85,                  │
│    "profile": {...}                     │
│  }                                      │
│                                         │
│  Output: IR.json                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│        6. TRACER (tracer.ts)             │
│                                         │
│  Three-address code + decision trace:   │
│  t1 = RESOLVE(NestJS, symbol_table)     │
│  t2 = MATCH(crea, training_examples)    │
│  t3 = LOOKUP(pagos, domain_map)         │
│  t4 = BUILD_AST(t1, t2, t3)            │
│  t5 = GENERATE(proposal, t4)           │
│                                         │
│  Output: ThreeAddressCode[]             │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│       7. SYNTHESIZER (synthesizer.ts)    │
│                                         │
│  Genera salida segun modo solicitado:   │
│  - proposal: archivo .md                │
│  - plan: archivo .md + pasos            │
│  - command: workflow.sh comando         │
│  - chat: respuesta conversacional       │
│                                         │
│  Output: SynthesisResult                │
└─────────────────────────────────────────┘
```

---

## Fases de implementacion

### Fase 0: Fundacion — HTTP Server

**Duracion**: 2-3 ciclos
**Dependencias**: Ninguna

#### Objetivo
Servidor HTTP funcional con al menos un provider y las rutas basicas.

#### Tareas

- [ ] 0.1 Crear `apps/server/` con package.json, tsconfig.json
- [ ] 0.2 Implementar bootstrap (`src/index.ts`) con Express o Fastify
- [ ] 0.3 Crear `provider.interface.ts` con contrato comun
- [ ] 0.4 Implementar `opencode.provider.ts` (fallback local, usa subprocess)
- [ ] 0.5 Implementar `openai.provider.ts` (API remota)
- [ ] 0.6 Implementar ruta `POST /ai/generate` con router de providers
- [ ] 0.7 Implementar ruta `GET /health` para health checks
- [ ] 0.8 Configurar CORS para TUI y CLI
- [ ] 0.9 Variables de entorno: `OPENAI_KEY`, `ANTHROPIC_KEY`, `AI_PROVIDER`
- [ ] 0.10 Escribir tests de integracion del server

#### Entregables

- `apps/server/src/index.ts` — bootstrap
- `apps/server/src/routes/ai.ts` — ruta POST /ai/generate
- `apps/server/src/providers/*.ts` — 2 providers (opencode + openai)
- `apps/server/package.json` — dependencias
- Tests: health check + generacion basica

#### Criterio de exito

```bash
cd apps/server && npm run dev
curl -X POST http://localhost:4000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hola", "provider": "opencode"}'
# → Responde con texto generado
```

---

### Fase 1: Compilador

**Duracion**: 3-4 ciclos
**Dependencias**: Fase 0

#### Objetivo
Pipeline completo del compilador: LEX → PARSE → SEMANTIC → SCORE → IR → TRACE → SYNTHESIS.

#### Tareas

- [ ] 1.1 Diseñar tipos: Token, ASTNode, IR, ThreeAddressCode, SynthesisResult
- [ ] 1.2 Implementar `lexer.ts` — tokenizador basado en reglas
- [ ] 1.3 Implementar `parser.ts` — constructor de AST
- [ ] 1.4 Crear tabla de simbolos inicial (`apps/server/src/data/symbols/default.json`)
- [ ] 1.5 Implementar `semantic.ts` — resuelve tokens con tabla de simbolos + perfil
- [ ] 1.6 Implementar `scorer.ts` — busca ejemplos similares en training
- [ ] 1.7 Implementar `ir.ts` — genera IR.json canonico
- [ ] 1.8 Implementar `tracer.ts` — emite three-address code
- [ ] 1.9 Implementar `synthesizer.ts` — genera salida (proposal/plan/command)
- [ ] 1.10 Implementar ruta `POST /compile` que orquesta el pipeline
- [ ] 1.11 Tests del compilador (unitarios para cada fase + integracion)

#### Entregables

- `apps/server/src/compiler/*.ts` — 7 componentes del pipeline
- `apps/server/src/routes/compile.ts` — ruta POST /compile
- `apps/server/src/data/symbols/default.json` — tabla de simbolos
- Tests: unitarios por fase, integracion del pipeline completo

#### Criterio de exito

```bash
curl -X POST http://localhost:4000/compile \
  -H "Content-Type: application/json" \
  -d '{"instruction": "Crea un modulo de pagos en NestJS"}'
# → Responde con IR.json + three-address code + synthesis
```

---

### Fase 2: Bot entrenado en workflow.sh

**Duracion**: 2-3 ciclos
**Dependencias**: Fase 0

#### Objetivo
Bot que conoce workflow.sh y asiste al usuario: explica modos, sugiere comandos, ayuda a redactar instrucciones.

#### Tareas

- [ ] 2.1 Diseñar system prompt del bot con contexto completo de workflow.sh
- [ ] 2.2 Implementar ruta `POST /ai/chat` con conversation history
- [ ] 2.3 Crear bateria inicial de 20+ ejemplos de entrenamiento:
       - Cada modo (propose, plan, execute, verify, full, analyze, ai, train, listen, status, clean, compile, predict, bot)
       - Cada flag (--auto, DRY_RUN, CONTINUE_ON_ERROR, AUTO_APPROVE)
       - Combinaciones comunes
- [ ] 2.4 Implementar parseo de respuesta del bot: extraer comando sugerido + explicacion
- [ ] 2.5 Registrar ejemplos via `workflow.sh train example`
- [ ] 2.6 Implementar feedback loop: usuario acepta/rechaza sugerencia → se registra en training
- [ ] 2.7 Tests del bot

#### Entregables

- `apps/server/src/routes/ai.ts` — ruta POST /ai/chat
- `apps/server/src/services/training.service.ts` — CRUD de ejemplos
- `.workflow/training/examples.jsonl` — 20+ ejemplos precargados
- `workflow.sh bot <text>` — nuevo modo

#### Criterio de exito

```bash
workflow.sh bot "Quiero crear un endpoint de health check"
# → "Puedes usar: workflow.sh full --auto 'Agrega un endpoint GET /health'"
```

---

### Fase 3: TUI con Ink/React

**Duracion**: 3-4 ciclos
**Dependencias**: Fase 0, 1, 2

#### Objetivo
TUI interactivo que conecta al HTTP Server con pantallas para dashboard, compilador, approvals, training, bot y perfil.

#### Tareas

- [ ] 3.1 Crear `apps/tui/` con package.json, tsconfig.json
- [ ] 3.2 Implementar entry point (`src/index.tsx`) con Ink
- [ ] 3.3 Implementar componente Dashboard:
       - Estado actual del workflow
       - Ciclo actual
       - Ultimas lineas del log
       - Polling cada 5s al server
- [ ] 3.4 Implementar componente Compiler:
       - Editor de instrucciones (textarea)
       - Visualizacion de tokens, AST, IR.json, trace
       - Boton "Ejecutar" → POST /compile
- [ ] 3.5 Implementar componente Approvals:
       - Lista de propuestas/planes pendientes
       - Vista previa del contenido
       - Teclas: a=approve, r=reject, v=view full
- [ ] 3.6 Implementar componente Training:
       - Lista de ejemplos registrados
       - Agregar nuevo ejemplo
       - Busqueda por ID
- [ ] 3.7 Implementar componente Bot:
       - Chat conversacional
       - Historial de mensajes
       - Sugerencias de comandos clickeables
- [ ] 3.8 Implementar componente Profile:
       - Provider seleccionado
       - Preferencias de idioma, docs, risk tolerance
- [ ] 3.9 Navegacion entre pantallas (tabs, teclas 1-6)
- [ ] 3.10 Conectar todos los componentes al HTTP Server via hooks

#### Entregables

- `apps/tui/src/index.tsx` — entry point
- `apps/tui/src/components/*.tsx` — 6 componentes de pantalla
- `apps/tui/src/hooks/use-workflow.ts` — HTTP client
- `apps/tui/package.json` — dependencias (ink, react, axios)
- Navegacion completa entre pantallas

#### Criterio de exito

```bash
cd apps/tui && npx tsx src/index.tsx
# → TUI con 6 pantallas, dashboard en vivo, compilador funcional
```

---

### Fase 4: Integracion workflow.sh → HTTP Server

**Duracion**: 1-2 ciclos
**Dependencias**: Fase 0, 1, 2

#### Objetivo
workflow.sh delega toda IA al HTTP Server. Nuevos modos: compile, predict, bot, profile, ir.

#### Tareas

- [ ] 4.1 Agregar variable `WORKFLOW_SERVER_URL=http://localhost:4000`
- [ ] 4.2 Implementar `compile` mode:
       - Envia instruccion a POST /compile
       - Muestra IR.json + synthesis
       - Guarda IR.json en `.workflow/ir/`
- [ ] 4.3 Implementar `predict` mode:
       - Solo ejecuta SCORE (sin synthesis)
       - Muestra accion mas probable con confianza
- [ ] 4.4 Implementar `bot` mode:
       - Envia mensaje a POST /ai/chat
       - Muestra respuesta y comando sugerido
- [ ] 4.5 Implementar `profile` mode:
       - Muestra perfil actual
       - Permite editar preferencias
- [ ] 4.6 Implementar `ir` mode:
       - Muestra IR.json de un ciclo especifico
- [ ] 4.7 Actualizar `ai_propose` para que use el server en lugar de opencode directo
- [ ] 4.8 Agregar degradacion gradual: si server no responde, fallback a opencode local
- [ ] 4.9 Actualizar help con nuevos modos
- [ ] 4.10 Tests del CLI contra el server

#### Entregables

- `workflow.sh` actualizado con 5 nuevos modos
- Degradacion gradual ante fallo del server
- Help actualizado
- Tests de integracion CLI → server

#### Criterio de exito

```bash
WORKFLOW_SERVER_URL=http://localhost:4000 workflow.sh compile "Crea un modulo"
# → IR.json en .workflow/ir/cycle_N_IR.json

workflow.sh predict "Actualiza el README"
# → Prediccion: generate_documentation (confianza: 0.87)

workflow.sh profile
# → Muestra perfil actual del usuario
```

---

### Fase 5: Entrenamiento y perfil avanzado

**Duracion**: 2-3 ciclos
**Dependencias**: Fase 1, 2

#### Objetivo
Sistema de scoring sofisticado, perfil de usuario automatico, entrenamiento continuo.

#### Tareas

- [ ] 5.1 Implementar scoring multi-factor:
       ```typescript
       score = w1 * intent_similarity
             + w2 * file_pattern_similarity
             + w3 * command_policy_similarity
             + w4 * documentation_style_similarity
             + w5 * approval_history_similarity
       ```
- [ ] 5.2 Implementar perfil de usuario automatico:
       - Se actualiza con cada accion
       - Almacena: provider preferido, idioma, frecuencia de modos, risk tolerance
       - Archivo: `.workflow/profile/default.yml`
- [ ] 5.3 Implementar entrenamiento continuo:
       - Cada compilacion registra: input, tokens, AST, IR, resultado final
       - Usuario puede marcar como "correcto/incorrecto"
       - Feedback → ajusta pesos del scoring
- [ ] 5.4 Sistema de pesos ajustables:
       - Pesos por defecto: w1=0.35, w2=0.20, w3=0.20, w4=0.15, w5=0.10
       - Ajustables por perfil de usuario
- [ ] 5.5 Implementar ruta `POST /train/feedback` para registro de feedback
- [ ] 5.6 Tests del sistema de scoring

#### Entregables

- `apps/server/src/compiler/scorer.ts` — scoring multi-factor
- `apps/server/src/services/profile.service.ts` — perfil automatico
- `apps/server/src/services/training.service.ts` — feedback loop
- `.workflow/profile/default.yml` — perfil del usuario
- Tests de scoring con datos reales

#### Criterio de exito

```bash
# Despues de varios ciclos, el compilador mejora sus predicciones
curl -X POST http://localhost:4000/compile \
  -d '{"instruction": "Agrega un endpoint GET"}'
# → Confianza > 0.8 porque ya vio patrones similares antes
```

---

## Dependencia entre fases

```
Fase 0: HTTP Server     ← sin dependencias
    │
Fase 1: Compilador      ← depende de Fase 0
    │
├── Fase 2: Bot          ← depende de Fase 0
│    │
├── Fase 3: TUI          ← depende de Fase 0, 1, 2
│    │
├── Fase 4: Integracion  ← depende de Fase 0, 1, 2
│    │
└── Fase 5: Training     ← depende de Fase 1, 2
```

**Orden recomendado de ejecucion**: 0 → 1 → 2 → 4 → 3 → 5
(Compilador + bot funcionales antes de construir la TUI)

---

## Riesgos y mitigaciones

| Riesgo | Impacto | Probabilidad | Mitigacion |
|--------|---------|-------------|------------|
| **Node.js en TUI contradice AGENTS.md** | Alto | Baja | AGENTS.md prohibe ejecucion automatica de node. El TUI es una herramienta del usuario, no una ejecucion automatica. Se actualiza AGENTS.md para aclarar. |
| **Complejidad del compilador (LEX/PARSE/SEMANTIC)** | Alto | Media | Implementar incremental: primero tokenizador simple + regex, luego gramatica BNF formal si es necesario. |
| **Provider remoto requiere API key + $$$** | Medio | Alta | Provider por defecto: opencode (local, gratis). Providers remotos son opt-in via config. |
| **Servidor HTTP = nuevo punto de fallo** | Medio | Media | El servidor es stateless. workflow.sh tiene modo degradado: si server no responde, usa opencode local. |
| **Ink/React TUI puede ser lento** | Bajo | Baja | Ink usa diffing virtual eficiente. Si es problema, alternativa: Textual (Python). |
| **Mantenimiento de dos codebases (server + tui)** | Medio | Media | Ambos en TypeScript, estandarizar patrones desde el inicio. |

---

## Metricas de exito

| Fase | Metrica | Objetivo |
|------|---------|----------|
| 0 | Tiempo de respuesta POST /ai/generate | < 5s (opencode), < 15s (OpenAI) |
| 1 | Precision del tokenizador | > 90% en instrucciones reales |
| 1 | Cobertura de tests del compilador | > 80% branches |
| 2 | Precision del bot en sugerencias | > 85% aceptadas por el usuario |
| 3 | Tiempo de arranque del TUI | < 2s |
| 4 | Degradacion gradual funcional | Server caido → opencode local → OK |
| 5 | Mejora de confianza del scoring | +10% tras 50 ciclos |

---

## Referencias

- `032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md` — Especificacion del compilador
- `031_DEV_SPEC_WORKFLOW_BOT_AGENT_1_0_DRAFT.md` — Especificacion del bot
- `033_DEV_SPEC_WORKFLOW_SCRIPT_DOCUMENTATION_1_0_DRAFT.md` — Documentacion del script
- `044_DEV_GUIDE_SHELL_STYLE_1_0_DRAFT.md` — Guia de estilo Shell
- `workflow.sh` — Script de flujo de programacion
