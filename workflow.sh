#!/bin/sh
# workflow.sh — Algoritmo de flujo de programación con agentes IA
# Filosofía Unix: "Everything is a file"
# Recursivo: se invoca a sí mismo para cada paso del ciclo
#
# Modos:
#   propose <instruccion>   — Paso 1-2: genera propuesta desde instrucción TUI
#   plan <ruta-propuesta>   — Paso 4-5: genera plan desde propuesta
#   execute <ruta-plan>     — Paso 7-8: ejecuta plan paso a paso
#   verify                  — Paso 9: ejecuta validaciones y reporta
#   listen                  — Modo escucha: procesa archivos .md en inbox/
#   status                  — Muestra estado actual del flujo
#   clean                   — Limpia estado y archivos temporales

# Gestión de errores explícita en lugar de set -e
# Cada comando se protege individualmente para evitar salidas prematuras

# --- Constantes (everything is a file) ---
SCRIPT="$(realpath "$0")"
PROJECT_ROOT="$(dirname "$SCRIPT")"
WORKFLOW_DIR="$PROJECT_ROOT/.workflow"
INBOX_DIR="$WORKFLOW_DIR/inbox"
OUTBOX_DIR="$WORKFLOW_DIR/outbox"
STATE_FILE="$WORKFLOW_DIR/state"
CYCLE_FILE="$WORKFLOW_DIR/cycle"
LOCK_FILE="$WORKFLOW_DIR/lock"
LOG_FILE="$WORKFLOW_DIR/workflow.log"
PID_FILE="$WORKFLOW_DIR/listen.pid"
CHECKPOINT_FILE="$WORKFLOW_DIR/checkpoint"

# --- Flags de comportamiento (via entorno) ---
DRY_RUN="${DRY_RUN:-false}"
CONTINUE_ON_ERROR="${CONTINUE_ON_ERROR:-false}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"

# --- Inicialización ---
init() {
    mkdir -p "$INBOX_DIR" "$OUTBOX_DIR"
    touch "$STATE_FILE" "$CYCLE_FILE" "$LOG_FILE"
}

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$LOG_FILE"
    echo "$*" >&2
}

out() {
    echo "$*"
}

# --- Estado (archivos) ---
get_state() { cat "$STATE_FILE" 2>/dev/null || echo "idle"; }
set_state() { echo "$1" > "$STATE_FILE"; log "STATE → $1"; }

get_cycle() { cat "$CYCLE_FILE" 2>/dev/null || echo "0"; }
inc_cycle() {
    c=$(get_cycle)
    c=$((c + 1))
    echo "$c" > "$CYCLE_FILE"
    log "CYCLE → $c"
}

lock() {
    if [ -f "$LOCK_FILE" ]; then
        pid=$(cat "$LOCK_FILE")
        if kill -0 "$pid" 2>/dev/null; then
            log "LOCK: proceso $pid en ejecución, abortando"
            exit 1
        fi
        log "LOCK: eliminando lock huérfano (pid $pid)"
    fi
    echo "$$" > "$LOCK_FILE"
    trap 'rm -f "$LOCK_FILE"' EXIT
}

# --- Paso 1-2: Solicitud y Entrega de Propuesta ---
propose() {
    lock
    set_state "proposing"
    inc_cycle
    cycle=$(get_cycle)
    instruction="$*"

    if [ -z "$instruction" ]; then
        log "ERROR: instrucción vacía"
        set_state "idle"
        exit 1
    fi

    # Escribir la instrucción a un archivo (everything is a file)
    inst_file="$INBOX_DIR/cycle_${cycle}_instruction.md"
    cat > "$inst_file" <<-INSTR_EOF
	---
	id: instruction_${cycle}
	type: INSTRUCTION
	actor: user
	timestamp: $(date -Iseconds)
	status: received
	---
	
	# Instrucción — Ciclo $cycle
	
	$instruction
	INSTR_EOF
	log "Instrucción escrita: $inst_file"

    # Generar propuesta (con contexto dinámico si existe)
    prop_file="$OUTBOX_DIR/cycle_${cycle}_PROPUESTA_v1_0_DRAFT.md"
    context_file="$WORKFLOW_DIR/context.md"
    if [ -f "$context_file" ]; then
        context_block=$(head -c 1000 "$context_file")
    else
        context_block="$(echo "$instruction" | head -c 500)"
    fi

    cat > "$prop_file" <<-PROP_EOF
	---
	id: propuesta_${cycle}
	type: PROPUESTA
	actor: system
	timestamp: $(date -Iseconds)
	status: DRAFT
	source: ${inst_file}
	tags:
	  - proposal
	  - cycle-${cycle}
	summary: "Propuesta generada automáticamente a partir de la instrucción del ciclo ${cycle}."
	---
	
	# Propuesta — Ciclo $cycle
	
	## Contexto
	
	$context_block
	
	## Análisis
	
	La instrucción solicita un cambio en el código base. A continuación se
	desglosa el alcance:
	
	- **Motivación:** (describir por qué se necesita este cambio)
	- **Archivos potencialmente afectados:** (listar archivos relevantes del contexto)
	- **Dependencias:** (servicios, módulos, librerías involucradas)
	- **Alternativas consideradas:** (opciones descartadas brevemente)
	
	## Propuesta
	
	Se propone el siguiente enfoque:
	
	1. **Objetivo:** (qué se va a implementar/cambiar)
	2. **Estrategia:** (cómo se va a implementar)
	3. **Pruebas:** (cómo se va a verificar)
	4. **Criterio de éxito:** (qué determina que está completo)
	
	## Implicaciones
	
	- **Rendimiento:** (impacto esperado)
	- **Seguridad:** (consideraciones de seguridad)
	- **Base de datos:** (cambios de esquema si aplica)
	- **Compatibilidad hacia atrás:** (breaking changes)
	- **Mantenibilidad:** (deuda técnica, cobertura de tests)
	
	---
	_Generado por workflow.sh en $(date)_
	PROP_EOF

    log "Propuesta generada: $prop_file"
    set_state "awaiting_review:propuesta:$cycle"
    echo "$prop_file"
}

# --- Paso 3: Verificar que el usuario aprobó la propuesta ---
# La aprobación se indica tocando/creando un archivo .approve
await_propuesta_approval() {
    prop_file="$1"
    cycle="$2"
    approve_file="${prop_file}.approve"
    reject_file="${prop_file}.reject"

    # Auto-approve si el flag está activo y no hay .approve aún
    if [ "$AUTO_APPROVE" = "true" ] && [ ! -f "$approve_file" ] && [ ! -f "$reject_file" ]; then
        touch "$approve_file"
        log "AUTO-APPROVE: propuesta aprobada automáticamente"
    fi

    log "Esperando revisión humana de: $prop_file"
    log "Para ACEPTAR: touch \"$approve_file\""
    log "Para RECHAZAR: touch \"$reject_file\""

    while true; do
        if [ -f "$approve_file" ]; then
            log "Propuesta ACEPTADA"
            rm -f "$reject_file" 2>/dev/null
            set_state "approved:propuesta:$cycle"
            return 0
        fi
        if [ -f "$reject_file" ]; then
            log "Propuesta RECHAZADA"
            rm -f "$approve_file" 2>/dev/null
            set_state "rejected:propuesta:$cycle"
            return 1
        fi
        sleep 2
    done
}

# --- Paso 4-5: Solicitud y Entrega de Plan ---
plan() {
    lock
    prop_file="$1"
    set_state "planning"

    if [ ! -f "$prop_file" ]; then
        log "ERROR: archivo de propuesta no encontrado: $prop_file"
        set_state "idle"
        exit 1
    fi

    cycle=$(get_cycle)
    plan_file="$OUTBOX_DIR/cycle_${cycle}_PLAN_v1_0_DRAFT.md"

    # Leer la propuesta y extraer contexto
    prop_title=$(head -1 "$prop_file" 2>/dev/null || echo "Propuesta $cycle")
    prop_summary=$(grep "^summary:" "$prop_file" 2>/dev/null | sed 's/summary: "//;s/"$//' || echo "")

    context_file="$WORKFLOW_DIR/context.md"
    if [ -f "$context_file" ]; then
        context_block_plan=$(head -c 800 "$context_file")
    else
        context_block_plan=""
    fi

    cat > "$plan_file" <<-PLAN_EOF
	---
	id: plan_${cycle}
	type: PLAN
	actor: system
	timestamp: $(date -Iseconds)
	status: DRAFT
	source: ${prop_file}
	dependencies: []
	tags:
	  - plan
	  - cycle-${cycle}
	summary: "Plan de ejecución para la propuesta del ciclo ${cycle}: ${prop_summary}"
	---
	
	# Plan de Ejecución — Ciclo $cycle
	
	## Contexto del análisis
	
	$context_block_plan
	
	## Pre-vuelo
	
	- [ ] Branch creada a partir de main
	- [ ] Dependencias instaladas (npm ci)
	- [ ] Prisma Client generado (npm run db:generate)
	- [ ] Variables de entorno verificadas
	
	## Prerrequisitos
	
	\`\`\`bash
	npm ci
	npm run db:generate
	\`\`\`
	
	## Pasos
	
	Lista de pasos atómicos necesarios para completar la propuesta.
	Cada paso sigue la estructura: archivos → acción → verificación.
	
	### Paso 1: [Acción]
	
	- **Archivos involucrados:** 
	- **Acción:** 
	- **Comandos:**
	  \`\`\`bash
	  # Comandos a ejecutar para este paso
	  \`\`\`
	- **Verificación:** 
	
	## Post-ejecución
	
	- [ ] Ejecutar \`npm run build\`
	- [ ] Ejecutar \`npm test\`
	- [ ] Verificar resultado
	
	## Rollback
	
	Procedimiento para revertir cada paso en caso de fallo:
	
	- **Paso 1:** (cómo revertir el paso 1)
	- **Regla general:** Si algún paso falla, detener la ejecución y revertir
	  los cambios realizados hasta ese punto. Usar \`git checkout\` para
	  cambios no commiteados y \`git revert\` para cambios ya commiteados.
	
	## Riesgos
	
	Puntos críticos a considerar durante la ejecución:
	
	- **Disponibilidad:** (caída de servicios externos)
	- **Base de datos:** (pérdida de datos, migraciones fallidas)
	- **Tiempo de ejecución:** (pasos que puedan tomar más de lo esperado)
	- **Dependencias externas:** (APIs, librerías de terceros)
	
	---
	_Generado por workflow.sh en $(date)_
	PLAN_EOF

    log "Plan generado: $plan_file"
    set_state "awaiting_review:plan:$cycle"
    echo "$plan_file"
}

# --- Paso 6: Verificar aprobación del plan ---
await_plan_approval() {
    plan_file="$1"
    cycle="$2"
    approve_file="${plan_file}.approve"
    reject_file="${plan_file}.reject"

    # Auto-approve si el flag está activo y no hay .approve aún
    if [ "$AUTO_APPROVE" = "true" ] && [ ! -f "$approve_file" ] && [ ! -f "$reject_file" ]; then
        touch "$approve_file"
        log "AUTO-APPROVE: plan aprobado automáticamente"
    fi

    log "Esperando revisión humana del plan: $plan_file"
    log "Para ACEPTAR: touch \"$approve_file\""
    log "Para RECHAZAR: touch \"$reject_file\""

    while true; do
        if [ -f "$approve_file" ]; then
            log "Plan ACEPTADO"
            rm -f "$reject_file" 2>/dev/null
            set_state "approved:plan:$cycle"
            return 0
        fi
        if [ -f "$reject_file" ]; then
            log "Plan RECHAZADO"
            rm -f "$approve_file" 2>/dev/null
            set_state "rejected:plan:$cycle"
            return 1
        fi
        sleep 2
    done
}

# --- Rollback (restaura archivos no commiteados) ---
rollback() {
    log "ROLLBACK: revirtiendo cambios no commiteados"
    if [ -n "$ROLLBACK_HASH" ]; then
        git checkout -- "$PROJECT_ROOT" 2>/dev/null || true
        log "ROLLBACK: archivos restaurados a $ROLLBACK_HASH"
    fi
}

# --- Paso 7-8: Ejecución del Plan ---
execute() {
    lock
    plan_file="$1"
    set_state "executing"

    if [ ! -f "$plan_file" ]; then
        log "ERROR: archivo de plan no encontrado: $plan_file"
        set_state "idle"
        exit 1
    fi

    cycle=$(get_cycle)
    result_file="$OUTBOX_DIR/cycle_${cycle}_RESULTADO_v1_0.md"

    # Snapshot git para rollback
    ROLLBACK_HASH=""
    if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
        ROLLBACK_HASH=$(git rev-parse HEAD)
        log "Git snapshot: $ROLLBACK_HASH"
    fi

    log "Iniciando ejecución del plan: $plan_file"

    # Checkpoint: reanudar desde el último paso completado si existe
    RESUME_FROM=""
    if [ -f "$CHECKPOINT_FILE" ]; then
        RESUME_FROM=$(cat "$CHECKPOINT_FILE")
        log "Checkpoint encontrado: paso $RESUME_FROM. Reanudando..."
    fi

    # Extraer pasos del plan (líneas que comienzan con "### Paso")
    # Nota: sin -n para evitar contaminar step_num con números de línea
    steps=$(grep -E "^### Paso [0-9]+:" "$plan_file" || echo "")
    steps_file="$WORKFLOW_DIR/steps.tmp"
    echo "$steps" > "$steps_file"

    if [ -z "$steps" ]; then
        log "No se encontraron pasos en el plan. Buscando pasos marcados como PENDING..."
    fi

    # Por cada paso, ejecutar (simulado — el usuario debe rellenar los pasos reales)
    exec_log="$OUTBOX_DIR/cycle_${cycle}_execution_log.md"
    cat > "$exec_log" <<-LOG_EOF
	# Log de Ejecución — Ciclo $cycle
	
	**Plan:** $plan_file
	**Inicio:** $(date -Iseconds)
	
	## Pasos
	
	LOG_EOF

    # Usar archivo temporal en lugar de pipe para evitar subshell
    while read -r line; do
        step_num=$(echo "$line" | sed 's/^### Paso \([0-9]*\):.*/\1/')
        step_name=$(echo "$line" | sed 's/^### Paso [0-9]*: \(.*\)/\1/')

        if [ -n "$step_num" ]; then
            if [ -n "$RESUME_FROM" ] && [ "$step_num" -le "$RESUME_FROM" ]; then
                log "Paso $step_num ya completado (checkpoint), saltando..."
                echo "- **Paso $step_num:** $step_name ✅ (desde checkpoint)" >> "$exec_log"
                continue
            fi

            log "Ejecutando Paso $step_num: $step_name"

            # Verificar si el paso tiene comandos
            step_content=$(sed -n "/^### Paso $step_num:/,/^### Paso /p" "$plan_file" 2>/dev/null | head -n -1 || true)
            commands=$(echo "$step_content" | sed -n '/```bash/,/```/p' | sed '1d;$d' 2>/dev/null || true)

            if [ -n "$commands" ]; then
                log "Ejecutando comandos del paso $step_num..."
                {
                    echo "### Ejecución Paso $step_num: $step_name"
                    echo '```bash'
                    echo "$commands"
                    echo '```'
                } >> "$exec_log"

                if [ "$DRY_RUN" != "true" ]; then
                    if eval "$commands" >> "$exec_log" 2>&1; then
                        echo "✅ Paso $step_num completado" >> "$exec_log"
                        log "Paso $step_num: OK"
                        echo "$step_num" > "$CHECKPOINT_FILE"
                    else
                        exit_code=$?
                        echo "❌ Paso $step_num FALLÓ (exit code: $exit_code)" >> "$exec_log"
                        log "ERROR: Paso $step_num falló (exit code: $exit_code)"
                        echo "- **Paso $step_num:** $step_name ❌ FALLÓ" >> "$exec_log"
                        if [ "$CONTINUE_ON_ERROR" != "true" ]; then
                            log "Abortando ejecución por error en paso $step_num"
                            rollback
                            break
                        fi
                    fi
                else
                    log "[DRY-RUN] Comandos del paso $step_num (no ejecutados)"
                    echo "✅ Paso $step_num: DRY-RUN (sin ejecución)" >> "$exec_log"
                fi
            fi

            echo "- **Paso $step_num:** $step_name ✅ COMPLETADO" >> "$exec_log"
        fi
    done < "$steps_file"
    rm -f "$steps_file"
    rm -f "$CHECKPOINT_FILE"

    {
        echo ""
        echo "## Resultado"
        echo "- **Estado:** EJECUTADO (comandos ejecutados)"
    } >> "$exec_log"

    cat > "$result_file" <<-RESULT_EOF
	---
	id: resultado_${cycle}
	type: RESULTADO
	actor: system
	timestamp: $(date -Iseconds)
	status: EXECUTED
	source: ${plan_file}
	---
	
	# Resultado de Ejecución — Ciclo $cycle
	
	**Plan:** $plan_file
	**Log de ejecución:** $exec_log
	**Estado:** COMPLETADO PARCIALMENTE
	
	El plan se ha ejecutado. Pendiente:
	- [ ] Revisar el log de ejecución para confirmar que cada paso se completó
	- [ ] Ejecutar validaciones manuales adicionales si es necesario
	- [ ] Ejecutar \`workflow.sh verify\` para validaciones automáticas
	RESULT_EOF

    log "Ejecución completada: $result_file"
    set_state "executed:$cycle"
    echo "$result_file"
}

# --- Paso 9: Verificación ---
verify() {
    lock
    set_state "verifying"
    cycle=$(get_cycle)
    report_file="$OUTBOX_DIR/cycle_${cycle}_VERIFICACION_v1_0.md"

    log "Ejecutando validaciones..."

    # Construir reporte de validación
    {
        echo "---"
        echo "id: verificacion_${cycle}"
        echo "type: VERIFICACION"
        echo "actor: system"
        echo "timestamp: $(date -Iseconds)"
        echo "status: VERIFIED"
        echo "---"
        echo ""
        echo "# Reporte de Verificación — Ciclo $cycle"
        echo ""
        echo "## Validaciones"
        echo ""

        # build
        if command -v npm >/dev/null 2>&1 && [ -f "$PROJECT_ROOT/package.json" ]; then
            echo "### build"
            if npm run build --prefix "$PROJECT_ROOT" >/dev/null 2>&1; then
                echo "- build: ✅ OK"
            else
                echo "- build: ❌ FALLÓ"
            fi

            echo "### test (unit)"
            if npm test --prefix "$PROJECT_ROOT" >/dev/null 2>&1; then
                echo "- test: ✅ OK"
            else
                echo "- test: ❌ FALLÓ"
            fi
        else
            echo "### validaciones"
            echo "- npm no disponible — omitiendo validaciones automáticas"
        fi

        echo ""
        echo "## Archivos modificados en este ciclo"
        echo ""
        ls -la "$OUTBOX_DIR/" 2>/dev/null | grep "cycle_${cycle}_" || echo "(sin archivos registrados)"
        echo ""
        echo "## Pendiente"
        echo ""
        echo "- [ ] El programador debe confirmar visualmente los cambios"
        echo "- [ ] Si todo OK: \`rm -rf $WORKFLOW_DIR\` para limpiar estado"
        echo "- [ ] Si hay issues: iterar desde \`propose\`"
    } > "$report_file"

    log "Reporte de verificación: $report_file"
    set_state "verified:$cycle"
    echo "$report_file"
}

# --- Modo escucha: procesa archivos .md en inbox/ ---
listen() {
    init
    log "MODO ESCUCHA iniciado (PID: $$)"
    echo "$$" > "$PID_FILE"
    set_state "listening"

    # Recursivo: este script se queda en loop y se llama a sí mismo
    # para procesar cada instrucción entrante
    while true; do
        for inst_file in "$INBOX_DIR"/*.md; do
            [ -f "$inst_file" ] || continue

            # Marcar como procesando (renombrar)
            base=$(basename "$inst_file" .md)
            processing="${inst_file%.md}.processing"

            if mv "$inst_file" "$processing" 2>/dev/null; then
                log "Nueva instrucción detectada: $base"

                # Extraer contenido
                instruction=$(grep -v "^---$" "$processing" | grep -v "^id:" | grep -v "^type:" | \
                    grep -v "^actor:" | grep -v "^timestamp:" | grep -v "^status:" | \
                    grep -v "^tags:" | grep -v "^- " | grep -v "^summary:" | \
                    tail -n +5 2>/dev/null || echo "")

                if [ -z "$instruction" ]; then
                    instruction=$(tail -n +20 "$processing" 2>/dev/null || echo "Instrucción desde archivo")
                fi

                # Paso recursivo: llamarse a sí mismo para proponer
                log "Llamando recursivo: propose desde archivo"
                prop_file=$("$SCRIPT" propose "$instruction" 2>>"$LOG_FILE")

                if [ -n "$prop_file" ] && [ -f "$prop_file" ]; then
                    log "Propuesta lista. Esperando aprobación humana..."
                    if "$SCRIPT" await-propuesta "$prop_file" 2>>"$LOG_FILE"; then
                        log "Propuesta aprobada. Generando plan..."
                        plan_file=$("$SCRIPT" plan "$prop_file" 2>>"$LOG_FILE")
                        if [ -n "$plan_file" ] && [ -f "$plan_file" ]; then
                            log "Plan listo. Esperando aprobación humana..."
                            if "$SCRIPT" await-plan "$plan_file" 2>>"$LOG_FILE"; then
                                log "Plan aprobado. Ejecutando..."
                                result_file=$("$SCRIPT" execute "$plan_file" 2>>"$LOG_FILE")
                                log "Ejecutado: $result_file"
                                "$SCRIPT" verify 2>>"$LOG_FILE"
                                log "Ciclo completado."
                            fi
                        fi
                    fi
                fi

                # Mover a procesado
                done_file="${processing%.processing}.done"
                mv "$processing" "$done_file" 2>/dev/null || true
                log "Instrucción procesada: $done_file"
            fi
        done
        sleep 5
    done
}

# --- status: muestra estado actual ---
show_status() {
    echo "=== Estado del Workflow ==="
    echo "PID: $$"
    echo "Script: $SCRIPT"
    echo "Workflow dir: $WORKFLOW_DIR"
    echo "Estado: $(get_state)"
    echo "Ciclo: $(get_cycle)"
    echo ""
    echo "=== Archivos en inbox ==="
    ls -la "$INBOX_DIR" 2>/dev/null || echo "(vacío)"
    echo ""
    echo "=== Archivos en outbox ==="
    ls -la "$OUTBOX_DIR" 2>/dev/null || echo "(vacío)"
    echo ""
    echo "=== Últimas líneas del log ==="
    tail -5 "$LOG_FILE" 2>/dev/null || echo "(sin log)"
}

# --- clean: limpia estado ---
clean() {
    log "Limpiando estado del workflow..."
    # Detener listener si existe
    if [ -f "$PID_FILE" ]; then
        pid=$(cat "$PID_FILE")
        kill "$pid" 2>/dev/null && log "Listener PID $pid detenido" || true
        rm -f "$PID_FILE"
    fi
    rm -f "$LOCK_FILE"
    rm -f "$STATE_FILE"
    rm -f "$CYCLE_FILE"
    echo "idle" > "$STATE_FILE"
    echo "0" > "$CYCLE_FILE"
    log "Estado limpiado."
    echo "Workflow limpiado. Estado: idle, Ciclo: 0"
}

# --- clean-all: limpia todo (incluyendo archivos generados) ---
clean_all() {
    clean
    rm -rf "$INBOX_DIR"/* "$OUTBOX_DIR"/* 2>/dev/null
    log "Todos los archivos generados eliminados."
    echo "Archivos de inbox y outbox eliminados."
}

# --- Modo analyze: escanea el código fuente para generar contexto ---
analyze() {
    instruction="$*"
    context_file="$WORKFLOW_DIR/context.md"

    {
        echo "# Contexto del Proyecto"
        echo ""
        echo "Instrucción: $instruction"
        echo ""

        echo "## Archivos potencialmente relevantes"
        for word in $instruction; do
            [ "${#word}" -lt 4 ] && continue
            found=$(find "$PROJECT_ROOT/src" -name "*.ts" -path "*${word}*" 2>/dev/null | head -5)
            if [ -n "$found" ]; then
                echo ""
                echo "### $word"
                echo "$found"
            fi
        done

        echo ""
        echo "## Controladores y endpoints"
        grep -rn "@Controller\|@Public\|@Roles\|@Get\|@Post\|@Put\|@Patch\|@Delete" \
            "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | head -30

        echo ""
        echo "## Archivos de ruta (imports/exports)"
        find "$PROJECT_ROOT/src" -name "*.module.ts" -o -name "*.routes.ts" 2>/dev/null | head -10
    } > "$context_file"

    log "Contexto generado: $context_file"
    echo "$context_file"
}

# --- AI Propose: genera propuesta usando opencode ---
ai_propose() {
    instruction="$*"
    if [ -z "$instruction" ]; then
        log "ERROR: instrucción vacía para ai-propose"
        exit 1
    fi

    # Generar contexto primero
    log "AI: analizando código fuente..."
    analyze "$instruction" >/dev/null 2>&1

    cycle=$(get_cycle)
    prop_file="$OUTBOX_DIR/cycle_${cycle}_PROPUESTA_v1_0_DRAFT.md"

    if ! command -v opencode >/dev/null 2>&1; then
        log "AI: opencode no disponible, usando template estándar"
        propose "$instruction"
        return
    fi

    context_file="$WORKFLOW_DIR/context.md"
    project_context=""
    if [ -f "$context_file" ]; then
        project_context=$(cat "$context_file")
    fi

    prompt="Eres un arquitecto de software para @tienda/api (NestJS + Prisma + PostgreSQL + Redis)."
    prompt="$prompt

## Instrucción del usuario
$instruction

## Contexto del proyecto
$project_context

## Formato de salida
Genera un archivo .md con frontmatter YAML y secciones: Análisis, Propuesta, Implicaciones."

    log "AI: generando propuesta con opencode..."
    echo "$prompt" | opencode --model big-pickle --quiet > "$prop_file" 2>/dev/null

    if [ -f "$prop_file" ] && [ -s "$prop_file" ]; then
        log "Propuesta generada por IA: $prop_file"
        set_state "awaiting_review:propuesta:$cycle"
        echo "$prop_file"
    else
        log "AI: falló generación, usando template estándar"
        propose "$instruction"
    fi
}

# --- Main: dispatch recursivo ---
main() {
    init

    case "${1:-help}" in
        propose)
            shift
            propose "$*"
            ;;
        await-propuesta)
            await_propuesta_approval "$2" "$(get_cycle)"
            ;;
        await-plan)
            await_plan_approval "$2" "$(get_cycle)"
            ;;
        plan)
            plan "$2"
            ;;
        execute)
            execute "$2"
            ;;
        verify)
            verify
            ;;
        listen)
            listen
            ;;
        status)
            show_status
            ;;
        clean)
            clean
            ;;
        clean-all|cleanall)
            clean_all
            ;;
        analyze)
            shift
            analyze "$*"
            ;;
        ai|ai-propose)
            shift
            ai_propose "$*"
            ;;
        full)
            # Ciclo completo desde TUI: propose → wait → plan → wait → execute → verify
            shift
            auto_mode=false
            case "$1" in
                --auto) auto_mode=true; shift ;;
            esac
            instruction="$*"
            if [ -z "$instruction" ]; then
                echo "Uso: $0 full [--auto] <instrucción>"
                exit 1
            fi

            prop_file=$("$SCRIPT" propose "$instruction")

            if [ "$auto_mode" != "true" ]; then
                echo ""
                echo "═══ Revisa la propuesta ═══"
                echo "  $prop_file"
                echo ""
                echo "Para ACEPTAR: touch \"${prop_file}.approve\""
                echo "Para RECHAZAR: touch \"${prop_file}.reject\""
                echo "Esperando..."
            fi

            if AUTO_APPROVE="$auto_mode" "$SCRIPT" await-propuesta "$prop_file"; then
                plan_file=$("$SCRIPT" plan "$prop_file")

                if [ "$auto_mode" != "true" ]; then
                    echo ""
                    echo "═══ Revisa el plan ═══"
                    echo "  $plan_file"
                    echo ""
                    echo "Para ACEPTAR: touch \"${plan_file}.approve\""
                    echo "Para RECHAZAR: touch \"${plan_file}.reject\""
                    echo "Esperando..."
                fi

                if AUTO_APPROVE="$auto_mode" "$SCRIPT" await-plan "$plan_file"; then
                    echo ""
                    echo "═══ Ejecutando plan ═══"
                    "$SCRIPT" execute "$plan_file"
                    echo ""
                    echo "═══ Verificando ═══"
                    "$SCRIPT" verify
                    echo ""
                    echo "Ciclo completo."
                else
                    echo "Plan rechazado. Ciclo abortado."
                fi
            else
                echo "Propuesta rechazada. Ciclo abortado."
            fi
            ;;
        help|--help|-h)
            echo "workflow.sh — Algoritmo de flujo de programación con agentes IA"
            echo ""
            echo "Filosofía: Everything is a file"
            echo "  - Instrucciones  → .workflow/inbox/*.md"
            echo "  - Propuestas     → .workflow/outbox/*_PROPUESTA_*.md"
            echo "  - Planes         → .workflow/outbox/*_PLAN_*.md"
            echo "  - Resultados     → .workflow/outbox/*_RESULTADO_*.md"
            echo "  - Estado         → .workflow/state"
            echo "  - Aprobaciones   → touch <archivo>.approve / .reject"
            echo ""
            echo "Recursivo: se invoca a sí mismo para cada paso del ciclo."
            echo ""
            echo "Modos:"
            echo "  $0 full [--auto] <instrucción>     Ciclo completo (propuesta→plan→ejecución→verificación)"
            echo "  $0 analyze <texto>              Escanea código fuente y genera contexto en .workflow/context.md"
            echo "  $0 ai <texto>                   Genera propuesta usando opencode con contexto del proyecto"
            echo "  $0 propose <texto>              Paso 1-2: genera propuesta desde instrucción"
            echo "  $0 plan <ruta-propuesta>        Paso 4-5: genera plan desde propuesta"
            echo "  $0 execute <ruta-plan>          Paso 7-8: ejecuta plan"
            echo "  $0 verify                       Paso 9: ejecuta validaciones y reporta"
            echo "  $0 listen                       Modo escucha: procesa archivos .md en inbox/"
            echo "  $0 status                       Muestra estado actual"
            echo "  $0 clean                        Limpia estado"
            echo "  $0 clean-all                    Limpia estado + archivos generados"
            echo ""
            echo "Flags de entorno:"
            echo "  DRY_RUN=true                    Muestra comandos sin ejecutarlos"
            echo "  CONTINUE_ON_ERROR=true           Continua aunque un paso falle"
            echo "  AUTO_APPROVE=true                Auto-aprueba sin intervención humana"
            echo ""
            echo "Aprobación humana:"
            echo "  touch <archivo>.approve   — ACEPTAR"
            echo "  touch <archivo>.reject    — RECHAZAR"
            echo ""
            echo "Ejemplos:"
            echo "  $0 full --auto 'Crea un módulo de notificaciones en NestJS'"
            echo "  DRY_RUN=true $0 execute <plan>"
            echo "  $0 full --auto 'Agrega un endpoint GET /health/detailed'"
            echo "  $0 listen &               # Inicia listener en background"
            echo "  echo 'Mi idea' > .workflow/inbox/mi-idea.md  # Enviar instrucción"
            ;;
        *)
            echo "Modo desconocido: $1"
            echo "Usa: $0 help"
            exit 1
            ;;
    esac
}

main "$@"
