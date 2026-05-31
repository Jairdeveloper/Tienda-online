---
id: 025
area: dev
type: REFERENCE
module: workflow
version: 1.0
status: DRAFT
tags:
  - workflow
  - reference
  - dev-tools
  - script
  - bash
  - automation
  - specification
summary: "Referencia completa del script workflow.sh: lista exhaustiva de modos y funciones, explicación detallada de cada uno, variables de entorno y flags de comportamiento, flujo de trabajo típico, métodos y procesos internos (parseo, checkpoint, rollback, templates, logging), y registro cronológico de cambios y mejoras implementadas."
keywords:
  - workflow
  - script
  - reference
  - specification
  - modes
  - environment-variables
  - internal-methods
  - changelog
  - bash
  - automation
changelog:
  - version: 1.0
    date: 2026-05-31
    author: system
    changes:
      - "Creación inicial del documento de referencia completa de workflow.sh"
      - "Catalogación de todos los modos, flags de entorno, métodos internos y flujos"
      - "Registro de todas las mejoras implementadas hasta la fecha"
---

# Referencia de `workflow.sh` — Features, Modos, Métodos y Procesos

## 1. Descripción General

`workflow.sh` es un script de shell (POSIX `/bin/sh`) que implementa un
**algoritmo de flujo de programación semiautónomo con agentes IA**. Sigue la
filosofía Unix **"everything is a file"**: cada paso del ciclo escribe y lee
archivos de texto plano en el directorio `.workflow/`. Es **recursivo**: se
invoca a sí mismo para cada paso del ciclo, permitiendo composición,
autonomía y ejecución en cadena.

**Localización:** `/home/john/tienda-online/Tienda-online-agnostica/workflow.sh`
**Documentos relacionados:**
- `workflow/020_DEV_WORKFLOW_1_0_DRAFT.md` — Documentación original del script
- `workflow/023_EXEC_WORKFLOW_IMPROVEMENTS_1_0_DRAFT.md` — Plan de mejoras
- `workflow/024_DEV_GUIDE_WORKFLOW_1_0_DRAFT.md` — Guía de uso rápida
- `.opencode/agents/workflow-agent.md` — Prompt del agente orquestador

---

## 2. Modos del Script (Catálogo Completo)

El script expone **11 modos** de operación y **2 sub-modos internos** (await).
Se invocan como `./workflow.sh <modo> [argumentos]`.

### 2.1 Tabla Resumen

| # | Modo | Línea | Propósito | Requiere args | Produce |
|---|------|-------|-----------|---------------|---------|
| 1 | `full` | 800 | Ciclo completo autónomo | `<instrucción>` | Propuesta → Plan → Ejecución → Verificación |
| 2 | `propose` | 77 | Genera propuesta desde instrucción | `<texto>` | `cycle_N_PROPUESTA_v1_0_DRAFT.md` |
| 3 | `plan` | 208 | Genera plan desde propuesta | `<ruta-propuesta>` | `cycle_N_PLAN_v1_0_DRAFT.md` |
| 4 | `execute` | 360 | Ejecuta plan paso a paso | `<ruta-plan>` | `cycle_N_RESULTADO_v1_0.md` + `execution_log.md` |
| 5 | `verify` | 501 | Ejecuta validaciones y reporta | — | `cycle_N_VERIFICACION_v1_0.md` |
| 6 | `analyze` | 669 | Escanea `src/` y genera contexto | `<texto>` | `.workflow/context.md` |
| 7 | `ai` / `ai-propose` | 705 | Propuesta vía opencode con contexto | `<texto>` | `cycle_N_PROPUESTA_v1_0_DRAFT.md` |
| 8 | `listen` | 562 | Modo escucha continuo (daemon) | — | Procesa archivos `.md` en `inbox/` |
| 9 | `status` | 624 | Muestra estado actual del workflow | — | Salida por consola |
| 10 | `clean` | 643 | Resetea estado a idle | — | `state → idle`, `cycle → 0` |
| 11 | `clean-all` / `cleanall` | 661 | clean + borra inbox/outbox | — | Limpieza total |
| — | `await-propuesta` | 174 | Espera aprobación de propuesta | `<archivo>` | Loop hasta `.approve`/`.reject` |
| — | `await-plan` | 317 | Espera aprobación de plan | `<archivo>` | Loop hasta `.approve`/`.reject` |

### 2.2 Modo `full` — Ciclo Completo

**Líneas:** 800–853  
**Sintaxis:** `./workflow.sh full [--auto] "<instrucción>"`  
**Flags:** `--auto` — salta las pausas de aprobación humana

Secuencia interna:
1. Llama a `propose "<instrucción>"`
2. Si `--auto` está activo, establece `AUTO_APPROVE=true` y llama a `await-propuesta`
3. Si aprobado, llama a `plan` con la propuesta
4. Si `--auto` está activo, establece `AUTO_APPROVE=true` y llama a `await-plan`
5. Si aprobado, llama a `execute` con el plan
6. Llama a `verify`
7. Reporta resultado final

Si en cualquier paso la propuesta o el plan son rechazados, el ciclo se aborta
con un mensaje claro.

### 2.3 Modo `propose` — Generar Propuesta

**Líneas:** 77–170  
**Sintaxis:** `./workflow.sh propose "<instrucción>"`

Proceso:
1. Adquiere lock de exclusión mutua
2. Cambia estado a `proposing`
3. Incrementa el contador de ciclo
4. Valida que la instrucción no esté vacía
5. Escribe la instrucción a `.workflow/inbox/cycle_N_instruction.md` con
   frontmatter YAML (id, type, actor, timestamp, status)
6. Si existe `.workflow/context.md` (generado por `analyze`), lo inyecta en
   el template de propuesta (máximo 1000 caracteres); si no, usa los primeros
   500 caracteres de la instrucción
7. Genera `cycle_N_PROPUESTA_v1_0_DRAFT.md` en `outbox/` con frontmatter YAML
   y secciones: Contexto, Análisis, Propuesta, Implicaciones
8. Cambia estado a `awaiting_review:propuesta:N`
9. Imprime la ruta del archivo generado

### 2.4 Modo `plan` — Generar Plan

**Líneas:** 208–314  
**Sintaxis:** `./workflow.sh plan <ruta-propuesta>`

Proceso:
1. Adquiere lock
2. Cambia estado a `planning`
3. Valida que el archivo de propuesta exista
4. Lee el ciclo actual
5. Extrae el título y summary de la propuesta
6. Si existe `.workflow/context.md`, lo inyecta (máximo 800 caracteres)
7. Genera `cycle_N_PLAN_v1_0_DRAFT.md` con frontmatter YAML y secciones:
   Contexto del análisis, Pre-vuelo (checklist), Prerrequisitos (comandos),
   Pasos (estructura atómica), Post-ejecución (checklist), Rollback, Riesgos
8. Cambia estado a `awaiting_review:plan:N`
9. Imprime la ruta del archivo generado

### 2.5 Modo `execute` — Ejecutar Plan

**Líneas:** 360–498  
**Sintaxis:** `./workflow.sh execute <ruta-plan>`  
**Flags de entorno:** `DRY_RUN`, `CONTINUE_ON_ERROR`

Proceso:
1. Adquiere lock
2. Cambia estado a `executing`
3. Valida que el archivo de plan exista
4. Toma un snapshot de git (`git rev-parse HEAD`) para rollback
5. Verifica checkpoint existente en `.workflow/checkpoint`
6. Extrae pasos del plan buscando líneas `### Paso N:`
7. Itera sobre cada paso:
   - Si existe checkpoint y el paso ya fue completado, lo salta
   - Extrae los comandos entre bloques ` ```bash ` y ` ``` `
   - Si `DRY_RUN=true`, solo registra los comandos sin ejecutarlos
   - Si ejecución real: `eval "$commands"` y captura salida
     - Si OK: guarda checkpoint, continúa
     - Si falla y `CONTINUE_ON_ERROR=false`: ejecuta rollback y aborta
     - Si falla y `CONTINUE_ON_ERROR=true`: registra error pero continúa
8. Genera `cycle_N_execution_log.md` con el historial completo
9. Genera `cycle_N_RESULTADO_v1_0.md` con frontmatter y estado COMPLETADO
10. Limpia archivos temporales (steps.tmp, checkpoint)
11. Cambia estado a `executed:N`

### 2.6 Modo `verify` — Verificación

**Líneas:** 501–559  
**Sintaxis:** `./workflow.sh verify`

Proceso:
1. Adquiere lock
2. Cambia estado a `verifying`
3. Ejecuta `npm run build` (si npm y package.json existen)
4. Ejecuta `npm test` (si npm y package.json existen)
5. Genera `cycle_N_VERIFICACION_v1_0.md` con:
   - Resultados de build y test (✅/❌)
   - Listado de archivos del ciclo en outbox/
   - Checklist de pendientes (confirmación visual, limpieza)
6. Cambia estado a `verified:N`

### 2.7 Modo `analyze` — Análisis de Código

**Líneas:** 669–702  
**Sintaxis:** `./workflow.sh analyze "<texto>"`

Proceso:
1. Toma cada palabra del texto de instrucción (mínimo 4 caracteres)
2. Busca en `src/` archivos `.ts` cuyo nombre contenga la palabra
3. Busca decoradores de controladores/endpoints (`@Controller`, `@Public`,
   `@Roles`, `@Get`, `@Post`, etc.) en `src/`
4. Busca archivos de módulo y rutas (`*.module.ts`, `*.routes.ts`)
5. Escribe todo en `.workflow/context.md`
6. Imprime la ruta del archivo generado

### 2.8 Modo `ai` — Propuesta con IA

**Líneas:** 705–754  
**Sintaxis:** `./workflow.sh ai "<texto>"`

Proceso:
1. Ejecuta `analyze` para generar contexto
2. Verifica si `opencode` está disponible en `$PATH`
3. Si no está disponible: fallback a `propose` estándar
4. Si está disponible:
   - Construye un prompt estructurado con la instrucción y el contexto
   - Lo envía a `opencode --model big-pickle --quiet`
   - Captura la salida en `cycle_N_PROPUESTA_v1_0_DRAFT.md`
   - Si falla la generación (archivo vacío o inexistente), fallback a `propose`

### 2.9 Modo `listen` — Escucha Continua (Daemon)

**Líneas:** 562–621  
**Sintaxis:** `./workflow.sh listen` (ejecutar en background con `&`)

Proceso:
1. Inicializa directorios
2. Escribe su PID en `.workflow/listen.pid`
3. Cambia estado a `listening`
4. Loop infinito (sleep 5s entre ciclos):
   - Escanea `inbox/` en busca de archivos `.md`
   - Toma el primer archivo encontrado, lo renombra a `.processing`
   - Extrae la instrucción (elimina frontmatter YAML)
   - Llama recursivamente a `propose` → `await-propuesta` → `plan` →
     `await-plan` → `execute` → `verify`
   - Renombra el archivo a `.done`
5. Se detiene con `./workflow.sh clean` (mata el PID guardado)

### 2.10 Modo `status` — Estado

**Líneas:** 624–640  
**Sintaxis:** `./workflow.sh status`

Muestra:
- PID del proceso actual
- Ruta del script
- Directorio de trabajo `.workflow/`
- Estado actual (del `state` file)
- Número de ciclo actual
- Archivos en `inbox/` y `outbox/`
- Últimas 5 líneas del log

### 2.11 Modo `clean` y `clean-all`

**Líneas:** 643–666  
**Sintaxis:**
- `./workflow.sh clean` — Resetea estado a `idle`, ciclo a `0`, elimina lock y
  detiene el listener si está corriendo
- `./workflow.sh clean-all` — Ejecuta `clean` + borra todos los archivos en
  `inbox/` y `outbox/`

### 2.12 Modos Internos: `await-propuesta` y `await-plan`

**Líneas:** 174–205 y 317–348  
**Sintaxis (uso interno, no desde CLI directamente):**
- `$SCRIPT await-propuesta <archivo>`
- `$SCRIPT await-plan <archivo>`

Ambos siguen el mismo patrón:
1. Si `AUTO_APPROVE=true` y no hay `.approve`/`.reject`, crea `.approve`
2. Loop infinito (sleep 2s):
   - Si existe `.approve`: cambia estado a `approved:...`, return 0
   - Si existe `.reject`: cambia estado a `rejected:...`, return 1

---

## 3. Variables de Entorno y Flags de Comportamiento

Todas se controlan mediante variables de entorno, consultadas al inicio del
script (líneas 32–34). No requieren exportación previa, pueden anteponerse:

```bash
DRY_RUN=true ./workflow.sh execute plan.md
CONTINUE_ON_ERROR=true AUTO_APPROVE=true ./workflow.sh full --auto "..."
```

### 3.1 `DRY_RUN`

| Valor por defecto | `false` |
|-------------------|---------|
| Valores válidos | `true`, `false` |
| Ámbito | Modo `execute` |
| Efecto | Cuando es `true`, los comandos de cada paso del plan se muestran en el log de ejecución pero **no se ejecutan**. Ideal para ensayar antes de aplicar cambios. |
| Implementación | Línea 455: `log "[DRY-RUN] Comandos del paso $step_num (no ejecutados)"` |

### 3.2 `CONTINUE_ON_ERROR`

| Valor por defecto | `false` |
|-------------------|---------|
| Valores válidos | `true`, `false` |
| Ámbito | Modo `execute` |
| Efecto | Cuando un paso del plan falla y esta variable es `false`, se ejecuta rollback y se aborta la ejecución. Cuando es `true`, se registra el error pero se continúa con el siguiente paso. |
| Implementación | Líneas 449–453 |

### 3.3 `AUTO_APPROVE`

| Valor por defecto | `false` |
|-------------------|---------|
| Valores válidos | `true`, `false` |
| Ámbito | Modos `await-propuesta` y `await-plan` (usado internamente por `full --auto`) |
| Efecto | Cuando es `true`, las aprobaciones humanas se saltan automáticamente: se crea el archivo `.approve` de forma programática. |
| Implementación | Líneas 181 y 324 |

---

## 4. Flujo de Trabajo Típico

### 4.1 Ciclo Completo Automático (recomendado para CI)

```bash
./workflow.sh clean
./workflow.sh full --auto "Descripción de la tarea"
```

Esto ejecuta sin intervención: propose → plan → execute → verify.

### 4.2 Ciclo Completo con Revisión Humana

```bash
./workflow.sh clean
./workflow.sh full "Descripción de la tarea"
# El script se pausa dos veces esperando aprobación:
#   touch <archivo>.approve  (para aceptar)
#   touch <archivo>.reject   (para rechazar)
```

### 4.3 Ciclo Paso a Paso (máximo control)

```bash
# 1. Análisis + Contexto
./workflow.sh clean
./workflow.sh analyze "palabras clave de la tarea"

# 2. Propuesta
./workflow.sh ai "Descripción de la tarea"
prop=$(ls -t .workflow/outbox/*_PROPUESTA_*.md | head -1)
echo "Propuesta: $prop"
# Revisar y aprobar:
touch "${prop}.approve"

# 3. Plan
plan=$(./workflow.sh plan "$prop")
echo "Plan: $plan"
# Revisar y aprobar:
touch "${plan}.approve"

# 4. Dry-run + Ejecución
DRY_RUN=true ./workflow.sh execute "$plan"
./workflow.sh execute "$plan"

# 5. Verificación
./workflow.sh verify
```

### 4.4 Modo Escucha (Daemon)

```bash
# Terminal 1: Iniciar listener
./workflow.sh listen &

# Terminal 2: Enviar instrucciones
echo "Implementar módulo X" > .workflow/inbox/tarea.md

# Terminal 1: Ver progreso
./workflow.sh status

# Para detener:
./workflow.sh clean
```

### 4.5 Mejora del Script (auto-mejora)

```bash
# 1. Validar sintaxis tras editar
bash -n workflow.sh

# 2. Probar con ciclo corto
./workflow.sh clean
timeout 15 ./workflow.sh full --auto "test post-edit" 2>&1
./workflow.sh clean
```

---

## 5. Métodos y Procesos Internos

### 5.1 Inicialización: `init()` (línea 37)

Crea los directorios `.workflow/inbox/` y `.workflow/outbox/`, y los archivos
`state`, `cycle` y `workflow.log` si no existen. Se ejecuta al inicio de
cada invocación.

### 5.2 Sistema de Estado: `get_state()` / `set_state()` (líneas 52–53)

El estado se persiste en `.workflow/state` como texto plano:

| Estado | Significado |
|--------|-------------|
| `idle` | Reposo, listo para recibir instrucciones |
| `proposing` | Generando propuesta |
| `awaiting_review:propuesta:N` | Esperando aprobación humana de la propuesta |
| `approved:propuesta:N` | Propuesta aprobada |
| `rejected:propuesta:N` | Propuesta rechazada |
| `planning` | Generando plan |
| `awaiting_review:plan:N` | Esperando aprobación humana del plan |
| `approved:plan:N` | Plan aprobado |
| `rejected:plan:N` | Plan rechazado |
| `executing` | Ejecutando pasos del plan |
| `executed:N` | Ejecución completada |
| `verifying` | Ejecutando validaciones |
| `verified:N` | Verificación completada |
| `listening` | Modo escucha activo |

### 5.3 Contador de Ciclo: `get_cycle()` / `inc_cycle()` (líneas 55–61)

El archivo `.workflow/cycle` contiene un número entero que se incrementa en
cada llamada a `propose`. Se usa para nombrar todos los archivos del ciclo.

### 5.4 Lock de Exclusión Mutua: `lock()` (línea 63)

Evita ejecuciones concurrentes del script:
1. Comprueba si `.workflow/lock` existe y contiene un PID vivo
2. Si el PID no existe (lock huérfano), lo elimina
3. Escribe su propio PID en el lock
4. Registra un `trap` para limpiar el lock al salir (signal EXIT)

### 5.5 Logging: `log()` (línea 42)

Escribe mensajes con timestamp ISO (`[YYYY-MM-DD HH:MM:SS]`) a:
- `.workflow/workflow.log` (append)
- `stderr` (echo)

### 5.6 Output: `out()` (línea 47)

Wrapper para `echo` a stdout. Se usa para devolver rutas de archivos.

### 5.7 Parseo de Instrucciones (listen mode, línea 582)

Al recibir un archivo `.md` en `inbox/`, el modo `listen` extrae el contenido:
1. Elimina líneas de frontmatter YAML (todo entre `---`)
2. Elimina campos `id:`, `type:`, `actor:`, `timestamp:`, `status:`, `tags:`,
   `summary:` y líneas que comienzan con `- ` (items de lista)
3. Si el resultado es vacío, usa `tail -n +20` como fallback

### 5.8 Templates

El script genera 5 tipos de archivos, todos con frontmatter YAML:

#### Propuesta (`propose()`, línea 116)
Secciones: Contexto, Análisis, Propuesta, Implicaciones  
Frontmatter: `id`, `type`, `actor`, `timestamp`, `status`, `source`, `tags`, `summary`

#### Plan (`plan()`, línea 233)
Secciones: Contexto del análisis, Pre-vuelo (checklist), Prerrequisitos,
Pasos (estructura atómica), Post-ejecución, Rollback, Riesgos  
Frontmatter: `id`, `type`, `actor`, `timestamp`, `status`, `source`,
`dependencies`, `tags`, `summary`

#### Resultado (`execute()`, línea 473)
Contenido: referencias al plan y log de ejecución, estado COMPLETADO,
pendientes post-ejecución  
Frontmatter: `id`, `type`, `actor`, `timestamp`, `status`, `source`

#### Log de Ejecución (`execute()`, línea 402)
Formato Markdown plano con historial de cada paso, comandos ejecutados,
y estado (✅ completado / ❌ falló)

#### Reporte de Verificación (`verify()`, línea 511)
Secciones: build, test, archivos modificados, pendientes  
Frontmatter: `id`, `type`, `actor`, `timestamp`, `status`

### 5.9 Checkpoint y Reanudación (líneas 384–388, 443)

Durante la ejecución, cada paso exitoso escribe su número en
`.workflow/checkpoint`. Si el script se interrumpe y se reinicia (con el mismo
plan), detecta el checkpoint y retoma desde el paso siguiente.

El checkpoint se elimina al finalizar la ejecución (línea 465) o al limpiar
con `clean`.

### 5.10 Rollback (líneas 351–357)

Si un paso falla y `CONTINUE_ON_ERROR=false`:
1. Si `ROLLBACK_HASH` está definido (valor del `git rev-parse HEAD` inicial),
   ejecuta `git checkout -- .` para restaurar archivos no commiteados
2. Si no hay repo git o el comando falla, se omite silenciosamente (`|| true`)

### 5.11 Extracción de Pasos del Plan (líneas 392–398)

Usa `grep -E "^### Paso [0-9]+:"` para identificar los pasos. Para cada paso:
- Extrae el número con `sed 's/^### Paso \([0-9]*\):.*/\1/'`
- Extrae el nombre con `sed 's/^### Paso [0-9]*: \(.*\)/\1/'`
- Extrae los comandos entre ` ```bash ` y ` ``` ` con `sed -n '/```bash/,/```/p'`

### 5.12 Sistema de Archivos del Workflow

```
.workflow/                          # Directorio raíz de estado
├── state                           # Estado actual (texto plano)
├── cycle                           # Número de ciclo actual (entero)
├── lock                            # Lock de exclusión mutua (PID)
├── listen.pid                      # PID del modo listen (cuando activo)
├── workflow.log                    # Log completo de operaciones
├── checkpoint                      # Último paso completado (para reanudación)
├── context.md                      # Contexto generado por analyze
├── steps.tmp                       # Archivo temporal de pasos (autolimpieza)
├── inbox/                          # Instrucciones entrantes
│   └── cycle_N_instruction.md      # Instrucción recibida
└── outbox/                         # Archivos generados
    ├── cycle_N_PROPUESTA_v1_0_DRAFT.md     # Propuesta
    ├── cycle_N_PLAN_v1_0_DRAFT.md          # Plan de ejecución
    ├── cycle_N_RESULTADO_v1_0.md           # Resultado de ejecución
    ├── cycle_N_execution_log.md            # Log detallado de ejecución
    └── cycle_N_VERIFICACION_v1_0.md        # Reporte de verificación
```

---

## 6. Historial de Cambios y Mejoras Implementadas

### 6.1 Creación Inicial — 2026-05-30

- Script base con 7 modos: `propose`, `plan`, `execute`, `verify`, `listen`,
  `status`, `clean`
- Filosofía "everything is a file" con directorio `.workflow/`
- Lock de exclusión mutua por PID
- Sistema de estado y ciclo persistente

### 6.2 Bugfix — grep -n contamina step_num

**Problema:** `grep -n "^### Paso"` anteponía el número de línea al extraer
pasos, resultando en `step_num="35:1"` en vez de `"1"`.
**Fix:** Cambiar a `grep "^### Paso"` (sin `-n`) y anclar patrones sed con `^`.

### 6.3 Bugfix — Subshell en bucle while read

**Problema:** `echo "$steps" | while read -r line` crea un subshell por el pipe,
causando que las escrituras a `exec_log` dentro del while no persistieran.
**Fix:** Usar archivo temporal (`steps.tmp`) con redirección
`while ... done < "$steps_file"`.

### 6.4 Bugfix — set -e causa salidas prematuras

**Problema:** `set -e` al inicio del script abortaba en errores menores (grep
sin resultados, comandos que devuelven exit code >0).
**Fix:** Eliminar `set -e` y reemplazar con guards `|| true` explícitos.

### 6.5 Bugfix — Templates con _PENDING_

**Problema:** Propuestas y planes genéricos con 6 placeholders `_PENDING_` sin
contenido útil.
**Fix:** Reemplazar con contenido estructurado: secciones con guías específicas
para motivación, archivos afectados, dependencias, objetivos, estrategia,
rollback y riesgos.

### 6.6 Mejora — Modo `full --auto` (2026-05-30)

**Añadido:** Flag `--auto` para `full` que automatiza las aprobaciones.
**Implementación:** Variable `AUTO_APPROVE` que se pasa como flag de entorno a
`await-propuesta` y `await-plan`.

### 6.7 Mejora — Modo `analyze` (2026-05-30)

**Añadido:** Nuevo modo que escanea `src/` buscando archivos y endpoints
relacionados con palabras clave de la instrucción. Genera `.workflow/context.md`.

### 6.8 Mejora — Modo `ai / ai-propose` (2026-05-30)

**Añadido:** Nuevo modo que integra `opencode` para generar propuestas con IA.
Ejecuta `analyze` primero para obtener contexto, construye un prompt y llama a
`opencode --model big-pickle`. Fallback al template estándar si opencode no
está disponible.

### 6.9 Mejora — Sistema de Checkpoint (2026-05-30)

**Añadido:** Durante la ejecución, cada paso exitoso guarda su número en
`.workflow/checkpoint`. Al reanudar una ejecución interrumpida, se retoma
desde el último checkpoint.

### 6.10 Mejora — Sistema de Rollback (2026-05-30)

**Añadido:** Antes de ejecutar, se toma un snapshot de git (`git rev-parse HEAD`).
Si un paso falla (y `CONTINUE_ON_ERROR=false`), se ejecuta `git checkout -- .`
para restaurar archivos no commiteados.

### 6.11 Mejora — Flag `CONTINUE_ON_ERROR` (2026-05-30)

**Añadido:** Variable de entorno que permite continuar la ejecución incluso si
un paso del plan falla, en lugar de abortar con rollback.

### 6.12 Mejora — Modo `clean-all` (2026-05-30)

**Añadido:** Extensión de `clean` que además borra todos los archivos en
`inbox/` y `outbox/`.

### 6.13 Mejora — Modo `full` con ciclo completo (2026-05-30)

**Añadido:** El modo `full` ahora ejecuta el ciclo completo:
`propose → await-propuesta → plan → await-plan → execute → verify`.
Soporta flag `--auto` para automatización total.

---

## 7. Arquitectura de Invocación Recursiva

El script sigue un patrón de **dispatch recursivo** (línea 757):

```
main()
  └── case "$1"
        ├── propose   → propose "$*"
        ├── plan      → plan "$2"
        ├── execute   → execute "$2"
        ├── verify    → verify
        ├── full      → llama a "$SCRIPT" propose → "$SCRIPT" await-propuesta →
        │               "$SCRIPT" plan → "$SCRIPT" await-plan →
        │               "$SCRIPT" execute → "$SCRIPT" verify
        ├── listen    → loop infinito llamando a "$SCRIPT" propose →
        │               "$SCRIPT" await-propuesta → "$SCRIPT" plan →
        │               "$SCRIPT" await-plan → "$SCRIPT" execute → "$SCRIPT" verify
        └── help      → muestra uso
```

La recursión permite:
- Composición de pasos: `full` y `listen` orquestan llamadas a otros modos
- Aislamiento: cada modo se ejecuta en un proceso hijo separado
- Logging centralizado: todas las salidas se redirigen al mismo `workflow.log`

---

## 8. Gestión de Errores

El script **no usa `set -e`** (eliminado en bugfix 6.4). En su lugar:

| Técnica | Implementación |
|---------|---------------|
| Guards explícitos | `comando || true` para ignorar errores esperados |
| Validación de archivos | `[ ! -f "$archivo" ]` → `exit 1` con mensaje |
| Validación de argumentos | `[ -z "$instruction" ]` → `exit 1` |
| Lock de procesos | `lock()` evita ejecución concurrente |
| Rollback automático | `rollback()` en fallo de ejecución |
| Fallback de IA | `ai()` → `propose()` si opencode no disponible |
| Detección de lock huérfano | `kill -0 $pid` para verificar PID vivo |

---

## 9. Compatibilidad y Requisitos

| Requisito | Detalle |
|-----------|---------|
| Shell | POSIX `/bin/sh` (probado en bash, dash, zsh) |
| Dependencias opcionales | `opencode` (para modo `ai`), `git` (para rollback) |
| Dependencias de verificación | `npm`, `node` (para `verify`) |
| Sistema de archivos | Permisos de escritura en el directorio del proyecto |
| Variables de entorno | Ninguna obligatoria para el script base |

---

## 10. Referencias

- `workflow.sh` — Script principal (raíz del proyecto)
- `workflow/020_DEV_WORKFLOW_1_0_DRAFT.md` — Documentación original del script
- `workflow/023_EXEC_WORKFLOW_IMPROVEMENTS_1_0_DRAFT.md` — Plan de mejoras
- `workflow/024_DEV_GUIDE_WORKFLOW_1_0_DRAFT.md` — Guía de uso rápida
- `.opencode/agents/workflow-agent.md` — Prompt del agente orquestador
- `algoritmos/flujo-programacion-agentes.md` — Algoritmo de flujo de programación
- `algoritmos/propuesta-convencion-documentacion.md` — Convención de documentación
- `docs/REGISTRO_IDS.md` — Registro central de IDs

## 10.4 Propuesta de Sistema de Artefactos (026)

El documento `.workflow/outbox/026_DEV_PROPUESTA_ARTIFACTS_1_0_DRAFT.md`
propone un nuevo sistema de generación de artefactos para `workflow.sh`.
Cuando esté implementado, esta sección documentará el sistema completo.

---

## 11. Sistema de Generación de Artefactos (futuro)

> **Estado:** PROPUESTA (documento 026). Esta sección es una vista previa
> de la funcionalidad. Una vez implementada, actualizar este documento a
> versión 2.0 y cambiar status a ACTIVE.

El **Sistema de Generación de Artefactos** centraliza la creación de
documentos en `workflow.sh` bajo un único modo `artifact`. Reemplaza los
templates hardcodeados por archivos externos en `.workflow/templates/` y
automatiza el registro de IDs en `docs/REGISTRO_IDS.md`.

### 11.1 Modo `artifact`

**Sintaxis:** `./workflow.sh artifact <tipo> [flags] "<descripción>"`
**Propuesta en:** `026_DEV_PROPUESTA_ARTIFACTS_1_0_DRAFT.md`
**Plan de ejecución:** `027_DEV_PLAN_ARTIFACTS_1_0_DRAFT.md`

### 11.2 Tipos de Artefactos

| Tipo | Subtipo | Descripción | Extensión |
|------|---------|-------------|-----------|
| `propuesta` | `plan` | Documento con pasos detallados a ejecutar | `.md` |
| `propuesta` | `ejecucion` | Documento con resultado de la ejecución | `.md` |
| `documentacion` | — | Guías, referencias, especificaciones técnicas | `.md` |
| `codigo` | — | Parches, scripts, fragmentos de código | `.sh`, `.ts`, `.md` |

### 11.3 Flags del Modo `artifact`

| Flag | Descripción | Default |
|------|-------------|---------|
| `--subtype <st>` | Subtipo del artefacto | — |
| `--id <id>` | ID específico (auto si no se especifica) | auto |
| `--output <dir>` | Directorio de salida | `.workflow/outbox/` |
| `--dry-run` | Muestra el contenido sin escribir archivo | false |
| `--no-register` | No registrar en REGISTRO_IDS.md | false |
| `--template <nom>` | Template específico en `.workflow/templates/` | auto |

### 11.4 Estructura de Templates

```
.workflow/templates/
├── propuesta_plan.tpl.md
├── propuesta_ejecucion.tpl.md
├── documentacion.tpl.md
└── codigo.tpl.sh
```

Los templates usan variables `{{VAR}}` que el script reemplaza con `sed`.
Si un template no existe en el directorio, se usa un template inline por
defecto (fallback).

### 11.5 Nomenclatura de Archivos Generados

```
[ID]_[TIPO]_[SUBTIPO]_[NOMBRE]_v[VERSION]_[ESTADO].[ext]

Ejemplo:
026_PROPUESTA_PLAN_SISTEMA_ARTEFACTOS_v1_0_DRAFT.md
```

### 11.6 Funciones Internas Asociadas

| Función | Propósito |
|---------|-----------|
| `generate_frontmatter()` | Genera bloque YAML a partir de parámetros |
| `load_template()` | Carga template de `.workflow/templates/` con fallback inline |
| `render_template()` | Reemplaza variables `{{VAR}}` en el template |
| `register_id()` | Añade entrada en `docs/REGISTRO_IDS.md` verificando duplicados |
| `artifact_help()` | Muestra ayuda del modo artifact |

### 11.7 Integración con el Sistema Existente

- El modo `artifact` es **100% aditivo**: no modifica ningún modo existente.
- Los modos `propose`, `plan`, `execute`, `verify`, `analyze`, `ai`, `full`,
  `listen`, `status`, `clean` y `clean-all` siguen funcionando exactamente
  igual.
- Los archivos generados por `artifact` coexisten con los archivos
  `cycle_N_*` sin conflicto de nombres.
- En una fase futura, los modos existentes pueden refactorizarse para usar
  `artifact` internamente (Fase 2 de la propuesta 026).

---

_Generado el 2026-05-31. Mantener sincronizado con `workflow.sh`._

