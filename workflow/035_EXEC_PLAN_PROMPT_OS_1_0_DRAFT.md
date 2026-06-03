---
id: 035
area: dev
type: EXEC
module: workflow
version: 1.0
status: DRAFT
tags:
  - plan
  - execution
  - prompt-os
  - arch-linux
  - roadmap
  - implementation
summary: "Plan de ejecucion detallado para el roadmap de Prompt OS (ALGP005). Convierte las 10 fases del roadmap en tareas concretas, con dependencias, esfuerzo estimado, criterios de exito y prioridad. Sirve como guia operativa para implementar Prompt OS sobre Arch Linux."
keywords:
  - plan
  - ejecucion
  - fases
  - tareas
  - prompt-os
  - arch
  - implementacion
  - workflow
changelog:
  - version: 1.0
    date: 2026-06-02
    author: workflow-agent
    description: Creacion del plan de ejecucion detallado para Prompt OS
---

# Plan de Ejecucion — Prompt OS sobre Arch Linux

## Objetivo

Ejecutar el roadmap definido en `ALGP005_WORKFLOW_OS_ARCH_v1_0_DRAFT.md` (seccion 9).
Cada fase del roadmap se desglosa en tareas concretas con esfuerzo estimado,
dependencias, criterios de exito y prioridad.

---

## Convenciones

### Estimacion de esfuerzo

| Etiqueta | Significado | Rango |
|----------|-------------|-------|
| 🟢 **XS** | Tarea trivial, minutos | < 30 min |
| 🔵 **S** | Tarea pequena, horas | 1-4 h |
| 🟡 **M** | Tarea mediana, medio dia | 4-8 h |
| 🟠 **L** | Tarea grande, dias | 2-5 d |
| 🔴 **XL** | Tarea muy grande, semanas | 1-4 sem |

### Prioridad

| Etiqueta | Significado |
|----------|-------------|
| 🔴 **P0** | Critico — bloquea otras fases |
| 🟠 **P1** | Alta — necesario para el nucleo del sistema |
| 🟡 **P2** | Media — importante pero postergable |
| 🟢 **P3** | Baja — mejora, no requisito |

### Criterio de exito (Definition of Done)

Cada fase debe cumplir:
- [ ] Todos los entregables existen y funcionan
- [ ] `bash -n` no reporta errores (para scripts shell)
- [ ] Modo `help` documenta los nuevos comandos
- [ ] Tests basicos pasan
- [ ] Sin regresiones en modos existentes

---

## Fase 0: Prompt OS Spec

| Info | Valor |
|------|-------|
| **Estado** | ✅ COMPLETADO |
| **Dependencias** | Ninguna |
| **Esfuerzo** | 🟡 M |
| **Prioridad** | 🔴 P0 |

### Entregables

| # | Tarea | Esfuerzo | Estado |
|---|-------|----------|--------|
| 0.1 | Redactar especificacion arquitectonica Prompt OS | 🟡 M | ✅ |
| 0.2 | Registrar ID en REGISTRO_IDS.md | 🟢 XS | ✅ |
| 0.3 | Validar coherencia con docs existentes (032, 033, 034) | 🔵 S | ✅ |

### Criterio de exito

- [x] `ALGP005_WORKFLOW_OS_ARCH_v1_0_DRAFT.md` existe
- [x] ID `ALGP005` registrado en `REGISTRO_IDS.md`
- [x] Sin conflictos con especificaciones existentes

---

## Fase 1: HTTP Server + Providers IA

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 0 |
| **Esfuerzo** | 🟠 L |
| **Prioridad** | 🔴 P0 |

### Tareas

#### 1.1 Crear estructura `apps/server/`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 1.1.1 | Inicializar `apps/server/package.json` con dependencias base | 🟢 XS | — |
| 1.1.2 | Configurar `tsconfig.json` para servidor Node | 🟢 XS | — |
| 1.1.3 | Crear `src/index.ts` con bootstrap Express/Fastify | 🔵 S | 1.1.1 |
| 1.1.4 | Configurar CORS, logging, error handling global | 🔵 S | 1.1.3 |
| 1.1.5 | Agregar ruta `GET /health` | 🟢 XS | 1.1.3 |

#### 1.2 Provider interface

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 1.2.1 | Definir `provider.interface.ts` (contrato: generate, chat, embed) | 🔵 S | 1.1.1 |
| 1.2.2 | Definir tipos: AIRequest, AIResponse, ProviderConfig | 🔵 S | 1.2.1 |
| 1.2.3 | Crear `opencode.provider.ts` (subprocess, fallback local) | 🟡 M | 1.2.1 |
| 1.2.4 | Crear `openai.provider.ts` (API remota) | 🟡 M | 1.2.1 |
| 1.2.5 | Crear `anthropic.provider.ts` (API remota) | 🟡 M | 1.2.1 |
| 1.2.6 | Implementar router de providers con fallback | 🔵 S | 1.2.3-1.2.5 |

#### 1.3 Rutas API

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 1.3.1 | Ruta `POST /ai/generate` — generacion de texto | 🔵 S | 1.2.6 |
| 1.3.2 | Ruta `POST /ai/chat` — conversacion | 🔵 S | 1.2.6 |
| 1.3.3 | Ruta `POST /compile` — pipeline compilador (stub inicial) | 🔵 S | 1.2.6 |
| 1.3.4 | Ruta `GET /training` — listar ejemplos | 🔵 S | — |
| 1.3.5 | Ruta `POST /train/example` — registrar ejemplo | 🔵 S | — |
| 1.3.6 | Ruta `GET /profile` — obtener perfil | 🔵 S | — |
| 1.3.7 | Ruta `POST /profile` — actualizar perfil | 🔵 S | — |

#### 1.4 Configuracion y tests

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 1.4.1 | Variables de entorno: `OPENAI_KEY`, `ANTHROPIC_KEY`, `AI_PROVIDER`, `PORT` | 🔵 S | 1.1.1 |
| 1.4.2 | Tests unitarios del provider router | 🔵 S | 1.2.6 |
| 1.4.3 | Tests de integracion del HTTP server | 🟡 M | 1.3.1-1.3.7 |
| 1.4.4 | Documentar setup en `apps/server/README.md` | 🔵 S | 1.4.1 |

### Criterio de exito

```bash
cd apps/server && npm run dev
curl -s http://localhost:4000/health | grep -q '"status":"ok"' && echo "✅ Health OK"
curl -s -X POST http://localhost:4000/ai/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Hello","provider":"opencode"}' | grep -q "generated" && echo "✅ AI OK"
```

### Dependencias externas

- Node.js 22+ (ya disponible en el proyecto)
- Express o Fastify (npm)
- Dependencias de providers: `openai`, `@anthropic-ai/sdk`

---

## Fase 2: Prompt Compiler

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 1 |
| **Esfuerzo** | 🔴 XL |
| **Prioridad** | 🔴 P0 |

### Tareas

#### 2.1 Tokenizador (LEX)

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 2.1.1 | Definir tipos de tokens: ACTION, TARGET, DOMAIN, TECH, CONSTRAINT, CONJUNCTION | 🔵 S | — |
| 2.1.2 | Implementar tokenizador por palabras clave (diccionario inicial) | 🟡 M | 2.1.1 |
| 2.1.3 | Implementar tokenizador por regex (verbos, objetos, rutas) | 🟡 M | 2.1.1 |
| 2.1.4 | Implementar deteccion de ambito (dev vs system vs doc) | 🔵 S | 2.1.2 |
| 2.1.5 | Tests del tokenizador (10+ casos de prueba) | 🔵 S | 2.1.2-2.1.4 |

#### 2.2 Parser (PARSE)

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 2.2.1 | Definir tipos AST: Instruction, Goal, Target, Constraint, Modifier | 🔵 S | 2.1.1 |
| 2.2.2 | Implementar parser secuencial (top-down, sin backtracking) | 🟡 M | 2.2.1 |
| 2.2.3 | Implementar desambiguacion basica (contexto + heuristica) | 🟡 M | 2.2.2 |
| 2.2.4 | Tests del parser (10+ casos) | 🔵 S | 2.2.2 |

#### 2.3 Analisis semantico (SEMANTIC)

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 2.3.1 | Crear tabla de simbolos inicial (`symbols/default.json`) | 🟡 M | 2.2.1 |
| 2.3.2 | Implementar resolucion de tokens contra tabla de simbolos | 🟡 M | 2.3.1 |
| 2.3.3 | Implementar resolucion contra perfil de usuario | 🔵 S | 2.3.2 |
| 2.3.4 | Implementar enriquecimiento de AST con metadatos | 🔵 S | 2.3.2 |
| 2.3.5 | Tests del analisis semantico | 🔵 S | 2.3.2-2.3.4 |

#### 2.4 Scoring (SCORE)

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 2.4.1 | Implementar busqueda de similitud en training (cosine similarity basica) | 🟡 M | 2.3.2 |
| 2.4.2 | Implementar scoring multi-factor (w1..w6) | 🟡 M | 2.4.1 |
| 2.4.3 | Si confianza > 0.8: reusar ejemplo existente | 🔵 S | 2.4.2 |
| 2.4.4 | Si confianza < 0.3: pedir aclaracion al usuario | 🔵 S | 2.4.2 |
| 2.4.5 | Tests del scoring | 🔵 S | 2.4.2 |

#### 2.5 IR Generation (IR)

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 2.5.1 | Definir esquema IR.json canonico | 🔵 S | 2.2.1 |
| 2.5.2 | Implementar generacion de IR desde AST enriquecido | 🟡 M | 2.5.1 |
| 2.5.3 | Guardar IR en `~/.workflow/ir/cycle_N_IR.json` | 🔵 S | 2.5.2 |
| 2.5.4 | Tests de generacion IR | 🔵 S | 2.5.2 |

#### 2.6 Three-address trace (TRACE)

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 2.6.1 | Definir formato TAC (three-address code) | 🔵 S | 2.5.1 |
| 2.6.2 | Implementar emision de TAC desde pipeline | 🔵 S | 2.6.1 |
| 2.6.3 | Guardar TAC en `cycle_N_TAC.ir` | 🟢 XS | 2.6.2 |

#### 2.7 Synthesis (SYNTHESIS)

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 2.7.1 | Implementar synthesis a propuesta (archivo .md) | 🟡 M | 2.5.2 |
| 2.7.2 | Implementar synthesis a plan (archivo .md + pasos) | 🟡 M | 2.5.2 |
| 2.7.3 | Implementar synthesis a comando (workflow.sh mode) | 🔵 S | 2.5.2 |
| 2.7.4 | Tests de synthesis | 🔵 S | 2.7.1-2.7.3 |

#### 2.8 Modos compile/predict/synthesize en workflow.sh

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 2.8.1 | Agregar modo `compile` que llama a POST /compile | 🔵 S | 1.3.3 |
| 2.8.2 | Agregar modo `predict` (solo SCORE, sin ejecutar) | 🔵 S | 2.4.2 |
| 2.8.3 | Agregar modo `synthesize` (desde IR a output) | 🔵 S | 2.7.3 |
| 2.8.4 | Agregar modo `ir` para mostrar IR.json de un ciclo | 🔵 S | 2.5.3 |

### Criterio de exito

```bash
workflow.sh compile "Crea un modulo de pagos en NestJS"
# → IR.json en .workflow/ir/
# → three-address code
# → synthesis en outbox/

workflow.sh predict "Agrega un endpoint GET"
# → "add_endpoint (confianza: 0.87)"
```

---

## Fase 3: Bot + Training

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 1, Fase 2 |
| **Esfuerzo** | 🟠 L |
| **Prioridad** | 🟠 P1 |

### Tareas

#### 3.1 Modo bot

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 3.1.1 | Disenar system prompt del bot con contexto completo de workflow.sh | 🔵 S | — |
| 3.1.2 | Implementar modo `bot <mensaje>` en workflow.sh | 🔵 S | 1.3.2 |
| 3.1.3 | Implementar historial de conversacion en `~/.workflow/bot/` | 🔵 S | 3.1.2 |
| 3.1.4 | Implementar deteccion de intencion en mensajes del bot | 🟡 M | 3.1.2 |
| 3.1.5 | Implementar extraccion de comando sugerido desde respuesta del bot | 🔵 S | 3.1.4 |

#### 3.2 Training

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 3.2.1 | Implementar modo `train` completo (ya existe parcialmente en workflow.sh) | 🔵 S | — |
| 3.2.2 | Sincronizar `workflow.sh train` con HTTP Server POST /train/example | 🔵 S | 1.3.5 |
| 3.2.3 | Crear bateria de 20+ ejemplos precargados (todos los modos, flags, combinaciones) | 🟡 M | 3.2.1 |
| 3.2.4 | Implementar feedback loop: usuario acepta/rechaza → training | 🟡 M | 3.2.2 |
| 3.2.5 | Implementar `train correction` para correcciones explicitas | 🔵 S | 3.2.2 |

#### 3.3 Perfil de usuario

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 3.3.1 | Crear esquema del perfil (`~/.workflow/profile/default.yml`) | 🔵 S | — |
| 3.3.2 | Implementar actualizacion automatica del perfil (frecuencia de modos, preferencias) | 🟡 M | 3.3.1 |
| 3.3.3 | Implementar deteccion de patrones de aprobacion/rechazo | 🟡 M | 3.3.1 |
| 3.3.4 | Implementar modo `profile` para ver/editar perfil | 🔵 S | 3.3.1 |

#### 3.4 Tests

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 3.4.1 | Tests del bot (conversacion, deteccion de intencion) | 🔵 S | 3.1.4 |
| 3.4.2 | Tests del training (registro, listado, correcciones) | 🔵 S | 3.2.1 |
| 3.4.3 | Tests del perfil de usuario | 🔵 S | 3.3.1 |

### Criterio de exito

```bash
workflow.sh bot "Quiero crear un endpoint de health check"
# → "Puedes usar: workflow.sh full --auto 'Agrega endpoint GET /health'"

workflow.sh train list
# → Muestra 20+ ejemplos registrados

workflow.sh profile
# → Muestra perfil con acciones frecuentes
```

### Ejemplos de entrenamiento (bateria inicial)

| # | Input | Output esperado | Modo |
|---|-------|-----------------|------|
| 1 | "Analiza el codigo del modulo auth" | `workflow.sh analyze auth` | analyze |
| 2 | "Quiero un ciclo completo automatico" | `workflow.sh full --auto '<instruccion>'` | full |
| 3 | "Genera una propuesta para crear X" | `workflow.sh propose "Crear X"` | propose |
| 4 | "Aprueba la propuesta" | `touch <file>.approve` | approve |
| 5 | "Rechaza el plan" | `touch <file>.reject` | reject |
| 6 | "Muestra el estado actual" | `workflow.sh status` | status |
| 7 | "Limpia el estado del workflow" | `workflow.sh clean` | clean |
| 8 | "Borra todo, inbox y outbox" | `workflow.sh clean-all` | clean-all |
| 9 | "Escucha nuevas instrucciones" | `workflow.sh daemon listen` | daemon |
| 10 | "Instala el modo de red" | `workflow.sh pkg install net` | pkg |
| 11 | "Lista los modos instalados" | `workflow.sh pkg list` | pkg |
| 12 | "Conectate al WiFi" | `workflow.sh net wifi connect` | net |
| 13 | "Sube el volumen al 70%" | `workflow.sh audio volume 70` | audio |
| 14 | "Muestra el uso de CPU" | `workflow.sh monitor cpu` | monitor |
| 15 | "Haz commit de los cambios" | `workflow.sh git commit "mensaje"` | git |
| 16 | "Guarda mi configuracion de neovim" | `workflow.sh dotfiles save ~/.config/nvim/` | dotfiles |
| 17 | "Crea un respaldo del proyecto" | `workflow.sh backup create proyecto` | backup |
| 18 | "Compila: actualiza el README" | `workflow.sh compile "Actualiza el README"` | compile |
| 19 | "Predice que voy a hacer" | `workflow.sh predict` | predict |
| 20 | "Ayuda para el modo net" | `workflow.sh help net` | help |

---

## Fase 4: System modes

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 1 |
| **Esfuerzo** | 🟠 L |
| **Prioridad** | 🟠 P1 |

### Tareas

#### 4.1 Modo `pkg`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 4.1.1 | Implementar `pkg install <paquete>` (wrapper pacman) | 🔵 S | — |
| 4.1.2 | Implementar `pkg remove <paquete>` | 🔵 S | — |
| 4.1.3 | Implementar `pkg list` (modos Prompt OS instalados) | 🔵 S | — |
| 4.1.4 | Implementar `pkg search <query>` (busqueda en pacman + modos) | 🔵 S | — |
| 4.1.5 | Implementar `pkg update` (sudo pacman -Syu) | 🔵 S | — |
| 4.1.6 | Implementar `pkg aur <paquete>` (wrapper yay/paru) | 🔵 S | — |
| 4.1.7 | Implementar deteccion de AUR helper (yay vs paru) | 🟢 XS | 4.1.6 |
| 4.1.8 | Implementar `pkg info <modo>` | 🟢 XS | — |
| 4.1.9 | Tests del modo pkg | 🔵 S | 4.1.1-4.1.8 |

#### 4.2 Modo `daemon`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 4.2.1 | Implementar `daemon start/stop/restart` | 🔵 S | — |
| 4.2.2 | Implementar `daemon status` | 🔵 S | — |
| 4.2.3 | Implementar `daemon enable/disable` (systemd --user) | 🔵 S | — |
| 4.2.4 | Implementar `daemon logs` (journalctl wrapper) | 🔵 S | — |
| 4.2.5 | Implementar `daemon listen` (foreground, modo escucha) | 🔵 S | — |
| 4.2.6 | Generar archivos systemd: `workflow-daemon.service`, `workflow-scheduler.timer` | 🔵 S | 4.2.3 |
| 4.2.7 | Tests del modo daemon | 🔵 S | 4.2.1-4.2.6 |

#### 4.3 Modo `config`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 4.3.1 | Implementar `config get <key>` | 🔵 S | — |
| 4.3.2 | Implementar `config set <key> <value>` | 🔵 S | — |
| 4.3.3 | Implementar `config list` | 🔵 S | — |
| 4.3.4 | Implementar `config edit` ($EDITOR en `~/.workflow/config/`) | 🔵 S | — |
| 4.3.5 | Implementar `config import/export` | 🔵 S | — |
| 4.3.6 | Tests del modo config | 🔵 S | 4.3.1-4.3.5 |

#### 4.4 Modo `schedule`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 4.4.1 | Implementar `schedule add <cmd> <time>` (systemd-timer wrapper) | 🟡 M | — |
| 4.4.2 | Implementar `schedule remove <id>` | 🔵 S | — |
| 4.4.3 | Implementar `schedule list/enable/disable` | 🔵 S | — |
| 4.4.4 | Tests del modo schedule | 🔵 S | 4.4.1-4.4.3 |

#### 4.5 Modo `help` mejorado

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 4.5.1 | Implementar `help <modo>` — ayuda contextual por modo | 🔵 S | — |
| 4.5.2 | Implementar `help --examples` — ejemplos de uso | 🔵 S | — |
| 4.5.3 | Tests del modo help | 🟢 XS | 4.5.1 |

### Criterio de exito

```bash
workflow.sh pkg install docker
# → sudo pacman -S docker

workflow.sh daemon status
# → ● workflow-daemon.service - workflow.sh Prompt OS Daemon
# →    Active: active (running)

workflow.sh config set AI_PROVIDER openai
# → Config updated

workflow.sh help pkg
# → Muestra ayuda especifica del modo pkg
```

---

## Fase 5: Arch wrappers

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 4 |
| **Esfuerzo** | 🟠 L |
| **Prioridad** | 🟡 P2 |

### Tareas

#### 5.1 Modo `net`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 5.1.1 | Implementar `net status` (nmcli general status) | 🔵 S | — |
| 5.1.2 | Implementar `net scan` (nmcli dev wifi list) | 🔵 S | — |
| 5.1.3 | Implementar `net wifi connect <ssid> [password]` | 🔵 S | — |
| 5.1.4 | Implementar `net wifi disconnect` | 🟢 XS | — |
| 5.1.5 | Implementar `net info` (interfaces, ip, gateway) | 🔵 S | — |
| 5.1.6 | Deteccion de NetworkManager (si no existe, mensaje claro) | 🟢 XS | — |
| 5.1.7 | Tests del modo net | 🔵 S | 5.1.1-5.1.6 |

#### 5.2 Modo `audio`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 5.2.1 | Implementar `audio volume <0-100>` (pactl set-sink-volume) | 🔵 S | — |
| 5.2.2 | Implementar `audio mic <0-100>` | 🔵 S | — |
| 5.2.3 | Implementar `audio mute/unmute [sink|mic]` | 🔵 S | — |
| 5.2.4 | Implementar `audio sink list / source list` | 🔵 S | — |
| 5.2.5 | Deteccion de pipewire/pulse | 🟢 XS | — |
| 5.2.6 | Tests del modo audio | 🔵 S | 5.2.1-5.2.5 |

#### 5.3 Modo `bt`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 5.3.1 | Implementar `bt status` (bluetoothctl show) | 🔵 S | — |
| 5.3.2 | Implementar `bt scan` (bluetoothctl scan on, timeout) | 🔵 S | — |
| 5.3.3 | Implementar `bt pair/connect/disconnect <mac>` | 🔵 S | — |
| 5.3.4 | Implementar `bt trust <mac>` | 🟢 XS | — |
| 5.3.5 | Implementar `bt list` (dispositivos emparejados) | 🔵 S | — |
| 5.3.6 | Deteccion de bluez | 🟢 XS | — |
| 5.3.7 | Tests del modo bt | 🔵 S | 5.3.1-5.3.6 |

#### 5.4 Modo `container`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 5.4.1 | Implementar `container ps` (docker/podman ps) | 🔵 S | — |
| 5.4.2 | Implementar `container start/stop <id>` | 🔵 S | — |
| 5.4.3 | Implementar `container logs <id>` | 🔵 S | — |
| 5.4.4 | Implementar `container exec <id> <cmd>` | 🔵 S | — |
| 5.4.5 | Implementar `container build <path>` | 🔵 S | — |
| 5.4.6 | Deteccion de docker vs podman | 🟢 XS | — |
| 5.4.7 | Tests del modo container | 🔵 S | 5.4.1-5.4.6 |

#### 5.5 Modo `backup`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 5.5.1 | Implementar `backup create <name>` (tar + configuracion) | 🟡 M | — |
| 5.5.2 | Implementar `backup restore <name>` | 🟡 M | — |
| 5.5.3 | Implementar `backup list` | 🔵 S | — |
| 5.5.4 | Implementar `backup schedule` (systemd-timer) | 🔵 S | — |
| 5.5.5 | Implementar `backup status` | 🔵 S | — |
| 5.5.6 | Tests del modo backup | 🔵 S | 5.5.1-5.5.5 |

#### 5.6 Modo `monitor`

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 5.6.1 | Implementar `monitor cpu` (top/htop stats) | 🔵 S | — |
| 5.6.2 | Implementar `monitor memory` (free -h) | 🟢 XS | — |
| 5.6.3 | Implementar `monitor disk` (df -h) | 🟢 XS | — |
| 5.6.4 | Implementar `monitor network` (nethogs/iftop wrapper) | 🔵 S | — |
| 5.6.5 | Implementar `monitor processes` (ps aux) | 🟢 XS | — |
| 5.6.6 | Implementar `monitor all` (panel completo) | 🔵 S | 5.6.1-5.6.5 |
| 5.6.7 | Tests del modo monitor | 🔵 S | 5.6.1-5.6.6 |

### Criterio de exito

```bash
workflow.sh net status
# → Estado de red: conectado a "MiWiFi" (192.168.1.x)

workflow.sh audio volume 75
# → Volumen: 75%

workflow.sh bt scan
# → Escaneando... Mouse MX Master (AA:BB:CC:DD:EE:FF)

workflow.sh container ps
# → CONTAINER ID   IMAGE   STATUS
```

---

## Fase 6: Bootstrapper

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 5 |
| **Esfuerzo** | 🟡 M |
| **Prioridad** | 🟠 P1 |

### Tareas

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 6.1 | Implementar `workflow.sh bootstrap` | 🟡 M | Fase 5 |
| 6.2 | Verificar que estamos en Arch Linux (o derivado) | 🔵 S | — |
| 6.3 | Instalar dependencias base: nodejs, npm, python3, git, base-devel | 🔵 S | 6.2 |
| 6.4 | Crear estructura completa `~/.workflow/` | 🔵 S | — |
| 6.5 | Configurar git con valores por defecto | 🟢 XS | — |
| 6.6 | Instalar yay/paru si no existe | 🔵 S | — |
| 6.7 | Instalar modulo HTTP server (apps/server/) | 🔵 S | — |
| 6.8 | Instalar modulo TUI (apps/tui/) | 🔵 S | — |
| 6.9 | Crear configuracion inicial de providers | 🟢 XS | — |
| 6.10 | Crear perfil de usuario por defecto | 🟢 XS | — |
| 6.11 | Marcar bootstrap como completado (`bootstrap.lock`) | 🟢 XS | — |
| 6.12 | Hacer bootstrap idempotente (puede re-ejecutarse) | 🔵 S | 6.1-6.11 |
| 6.13 | Crear `install.sh` independiente para usuarios nuevos | 🔵 S | 6.1 |
| 6.14 | Tests del bootstrap | 🔵 S | 6.1 |

### Criterio de exito

```bash
# Desde Arch Linux limpio
git clone https://github.com/Jairdeveloper/Tienda-online.git
cd Tienda-online
./workflow.sh bootstrap
# → "✅ Prompt OS installed on Arch Linux"
# → ~/.workflow/ creado con estructura completa
# → workflow.sh status muestra: idle, ciclo 0
```

---

## Fase 7: TUI (Ink/React)

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 1 |
| **Esfuerzo** | 🔴 XL |
| **Prioridad** | 🟡 P2 |

### Tareas

#### 7.1 Fundacion

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 7.1.1 | Crear `apps/tui/package.json` con Ink + React + TypeScript | 🟢 XS | — |
| 7.1.2 | Configurar `tsconfig.json` para JSX + ESModules | 🟢 XS | — |
| 7.1.3 | Crear entry point `src/index.tsx` con Ink.render | 🔵 S | 7.1.1 |
| 7.1.4 | Implementar router de pantallas (useState + switch) | 🔵 S | 7.1.3 |

#### 7.2 Pantallas

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 7.2.1 | Componente Dashboard: estado, ciclo, ultimas lineas de log | 🟡 M | 7.1.4 |
| 7.2.2 | Componente Compiler: editor de instrucciones + resultados | 🟡 M | 7.1.4 |
| 7.2.3 | Componente Approvals: lista de pendientes, teclas a/r | 🟡 M | 7.1.4 |
| 7.2.4 | Componente Training: CRUD de ejemplos de entrenamiento | 🟡 M | 7.1.4 |
| 7.2.5 | Componente Bot: chat conversacional con historial | 🟡 M | 7.1.4 |
| 7.2.6 | Componente Profile: preferencias, provider, temas | 🔵 S | 7.1.4 |

#### 7.3 Conectividad

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 7.3.1 | Hook `useWorkflow()` — HTTP client al server | 🔵 S | 7.1.3 |
| 7.3.2 | Hook `useBot()` — chat client con streaming | 🔵 S | 7.1.3 |
| 7.3.3 | Polling del Dashboard (cada 5s al server) | 🔵 S | 7.3.1 |

#### 7.4 Navegacion

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 7.4.1 | Teclas: 1-6 para cambiar de pantalla | 🔵 S | 7.1.4 |
| 7.4.2 | Teclas: q para salir, ? para ayuda de teclas | 🔵 S | 7.1.4 |
| 7.4.3 | Tests del TUI | 🟡 M | 7.2.1-7.2.6 |

### Criterio de exito

```bash
cd apps/tui && npx tsx src/index.tsx
# → TUI con dashboard mostrando estado en vivo
# → Tab 1: Dashboard | Tab 2: Compiler | Tab 3: Approvals | ...
# → Tecla 'q' para salir
```

---

## Fase 8: PromptFS completo

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 6 |
| **Esfuerzo** | 🟡 M |
| **Prioridad** | 🟢 P3 |

### Tareas

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 8.1 | Implementar todos los directorios de `~/.workflow/` segun especificacion | 🔵 S | — |
| 8.2 | Implementar validacion de estructura PromptFS al iniciar | 🔵 S | 8.1 |
| 8.3 | Implementar comando `fs check` (verifica integridad de PromptFS) | 🔵 S | 8.2 |
| 8.4 | Implementar `fs tree` (muestra arbol del PromptFS) | 🔵 S | 8.2 |
| 8.5 | Implementar `fs cleanup` (limpia tmp/, archivos huerfanos) | 🔵 S | 8.2 |
| 8.6 | Implementar cuotas de disco para outbox/ (max N archivos) | 🔵 S | 8.2 |
| 8.7 | Tests de PromptFS | 🔵 S | 8.1-8.6 |

### Criterio de exito

```bash
workflow.sh fs check
# → ✅ PromptFS structure OK

workflow.sh fs tree
# → ~/.workflow/
# → ├── inbox/
# → ├── outbox/
# → └── ...
```

---

## Fase 9: Plugins

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 4 |
| **Esfuerzo** | 🟠 L |
| **Prioridad** | 🟢 P3 |

### Tareas

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 9.1 | Disenar API de plugins (hooks: on_install, on_start, before_execute, after_execute) | 🟡 M | — |
| 9.2 | Implementar sistema de modulos instalables (`modules/available/` + `modules/enabled/`) | 🔵 S | — |
| 9.3 | Implementar deteccion de nuevos modos en `modules/enabled/` | 🔵 S | 9.2 |
| 9.4 | Implementar registro central de modulos (JSON index) | 🔵 S | 9.2 |
| 9.5 | Implementar `pkg search` en registro remoto | 🟡 M | 9.4 |
| 9.6 | Implementar CLI de marketplace (publicar, compartir modos) | 🟡 M | 9.5 |
| 9.7 | Tests del sistema de plugins | 🔵 S | 9.1-9.6 |

### Criterio de exito

```bash
# Instalar un modo de la comunidad
workflow.sh pkg install net
# → Modo 'net' instalado desde registro central

# El nuevo modo esta disponible inmediatamente
workflow.sh net status

# Publicar un modo propio
workflow.sh pkg publish ~/.workflow/modules/available/mi-modo.sh
# → Modo publicado en el registro
```

---

## Fase 10: Auto-aprendizaje

| Info | Valor |
|------|-------|
| **Estado** | 🚧 PLANIFICADO |
| **Dependencias** | Fase 3 |
| **Esfuerzo** | 🔴 XL |
| **Prioridad** | 🟢 P3 |

### Tareas

| # | Tarea | Esfuerzo | Depende de |
|---|-------|----------|------------|
| 10.1 | Implementar entrenamiento continuo: cada accion del usuario se registra | 🟡 M | 3.2 |
| 10.2 | Implementar ajuste automatico de pesos w1..w6 basado en resultados | 🟡 M | 10.1 |
| 10.3 | Implementar deteccion de cambios en preferencias del usuario | 🟡 M | 10.1 |
| 10.4 | Implementar sugerencias proactivas (basadas en hora, dia, frecuencia) | 🟡 M | 10.1 |
| 10.5 | Implementar reportes semanales de productividad | 🟡 M | 10.1 |
| 10.6 | Implementar prediccion de siguiente accion (proactive prompt) | 🟡 M | 10.1 |
| 10.7 | Tests de auto-aprendizaje | 🟡 M | 10.1-10.6 |

### Criterio de exito

```bash
# Despues de varios ciclos
workflow.sh predict
# → "Basado en tu historial, probablemente quieras:
#    workflow.sh full --auto 'Agrega tests al modulo X'"
#    (confianza: 0.87)
```

---

## Diagrama de dependencia entre fases

```
Fase 0 (Spec) ──── Completado
    │
    ▼
Fase 1 (HTTP + Providers) ── P0 ── Inicio real
    │
    ├──► Fase 2 (Compiler) ── P0
    │         │
    │         ├──► Fase 3 (Bot + Training) ── P1
    │         │
    │         ▼
    │    Fase 4 (System modes) ── P1
    │         │
    │         ▼
    │    Fase 5 (Arch wrappers) ── P2
    │         │
    │         ▼
    │    Fase 6 (Bootstrapper) ── P1
    │         │
    │         ▼
    │    Fase 8 (PromptFS) ── P3
    │         │
    │         ▼
    │    Fase 9 (Plugins) ── P3
    │
    └──► Fase 7 (TUI) ── P2
              │
              ▼
         Fase 10 (Auto-aprendizaje) ── P3
```

---

## Resumen de esfuerzo total

| Fase | Esfuerzo | Prioridad | Estado |
|------|----------|-----------|--------|
| Fase 0: Spec | 🟡 M | 🔴 P0 | ✅ |
| Fase 1: HTTP + Providers | 🟠 L | 🔴 P0 | 🚧 |
| Fase 2: Compiler | 🔴 XL | 🔴 P0 | 🚧 |
| Fase 3: Bot + Training | 🟠 L | 🟠 P1 | 🚧 |
| Fase 4: System modes | 🟠 L | 🟠 P1 | 🚧 |
| Fase 5: Arch wrappers | 🟠 L | 🟡 P2 | 🚧 |
| Fase 6: Bootstrapper | 🟡 M | 🟠 P1 | 🚧 |
| Fase 7: TUI | 🔴 XL | 🟡 P2 | 🚧 |
| Fase 8: PromptFS | 🟡 M | 🟢 P3 | 🚧 |
| Fase 9: Plugins | 🟠 L | 🟢 P3 | 🚧 |
| Fase 10: Auto-aprendizaje | 🔴 XL | 🟢 P3 | 🚧 |

**Total estimado**: ~15-25 semanas de trabajo efectivo (dependiendo de disponibilidad y complejidad de cada fase).

---

## Recomendacion de orden de ejecucion

```
Comenzar con: Fase 1 → Fase 2 → Fase 4 (subconjunto basico)
  ↓
Segundo:       Fase 3 → Fase 6
  ↓
Tercero:       Fase 5 → Fase 7 → Fase 8
  ↓
Final:         Fase 9 → Fase 10
```

**Justificacion**:
- Fases 1-2 son el nucleo (el compilador es lo que hace unico al sistema)
- Fase 4 (pkg, daemon, config) son necesarios para gestionar el sistema base
- Fase 3 (bot) y 6 (bootstrapper) son el puente para nuevos usuarios
- Fases 5, 7, 8 son valor anadido pero no criticos
- Fases 9, 10 son vision a largo plazo

---

## Referencias

- `ALGP005_WORKFLOW_OS_ARCH_v1_0_DRAFT.md` — Especificacion arquitectonica Prompt OS
- `workflow/032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md` — Compilador de prompts
- `workflow/034_EXEC_PLAN_PROMPT_COMPILER_1_0_DRAFT.md` — Plan de implementacion del compilador
- `workflow/031_DEV_SPEC_WORKFLOW_BOT_AGENT_1_0_DRAFT.md` — Bot agent
- `algoritmos/044_DEV_GUIDE_SHELL_STYLE_1_0_DRAFT.md` — Guia de estilo Shell
