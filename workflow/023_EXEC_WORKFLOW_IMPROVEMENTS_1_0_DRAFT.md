---
id: 023
area: dev
type: EXEC
module: workflow
version: 1.0
status: DRAFT
tags:
  - workflow
  - execution-plan
  - improvements
  - automation
summary: "Plan de ejecución para convertir workflow.sh en un robot de programación semiautónomo. Define 9 mejoras priorizadas con pasos de implementación, verificación y rollback."
keywords:
  - workflow
  - plan
  - mejoras
  - robot
  - automatizacion
  - bash
  - script
changelog:
  - version: 1.2
    date: 2026-05-30
    author: system
    changes:
      - "Fase 2 P1 completada: parseo robusto, rollback git"
      - "Fase 3 P2 completada: modo analyze, templates dinámicos con contexto"
      - "Fase 4 P3 completada: checkpoint/reanudación, integración LLM (opencode)"
      - "Bug fix: full --auto ya no duplica llamadas a await-propuesta/await-plan"
  - version: 1.1
    date: 2026-05-30
    author: system
    changes:
      - "Fase 1 P0 completada: eval activo, --dry-run, --auto, fix echo -e"
  - version: 1.0
    date: 2026-05-30
    author: system
    changes:
      - "Creación inicial del plan de mejoras para workflow.sh"
---

# Plan de Ejecución — Mejoras workflow.sh

**Objetivo:** Convertir `workflow.sh` de un orquestador de plantillas a un
robot de programación semiautónomo que pueda ejecutar pasos reales, analizar
el código base, revertir errores, y operar sin intervención humana cuando se
solicite.

## Resumen de Mejoras

| ID | Mejora | Prioridad | Esfuerzo | Archivos |
|----|--------|-----------|----------|----------|
| P0-1 | Activar `eval` + `--dry-run` | P0 ✅ | 10 min | `workflow.sh` |
| P0-2 | Flag `--auto` (auto-aprobación) | P0 ✅ | 5 min | `workflow.sh` |
| P0-3 | Fix `echo -e` → `printf` | P0 ✅ | 2 min | `workflow.sh` |
| P1-1 | Parseo robusto de steps | P1 ✅ | 5 min | `workflow.sh` |
| P1-2 | Rollback git automático | P1 ✅ | 15 min | `workflow.sh` |
| P2-1 | Modo `analyze` | P2 ✅ | 30 min | `workflow.sh` |
| P2-2 | Templates dinámicos con contexto | P2 ✅ | 30 min | `workflow.sh` |
| P3-1 | Checkpoint / reanudación | P3 ✅ | 15 min | `workflow.sh` |
| P3-2 | Integración LLM | P3 ✅ | 1 hr | `workflow.sh`, prompts/ |

---

## Fase 1: P0 — Funcionalidad base (30 min) ✅ COMPLETADA

### P0-1: Activar ejecución real de comandos

**Archivos:** `workflow.sh` (función `execute`)

**Cambios:**
- Reemplazar `# eval "$commands" >> "$exec_log" 2>&1` por `eval` activo
- Capturar código de salida por paso
- Si un paso falla: loguear error, marcar en exec_log, abortar o continuar según flag
- Flag `--dry-run` para mostrar comandos sin ejecutarlos

**Código:**
```bash
# Reemplazar líneas 365-369 en workflow.sh
if [ -n "$commands" ]; then
    log "Ejecutando comandos del paso $step_num..."
    echo "### Ejecución Paso $step_num" >> "$exec_log"
    echo "\`\`\`bash" >> "$exec_log"
    echo "$commands" >> "$exec_log"
    echo "\`\`\`" >> "$exec_log"
    
    if [ "$DRY_RUN" != "true" ]; then
        if eval "$commands" >> "$exec_log" 2>&1; then
            echo "✅ Paso $step_num completado" >> "$exec_log"
            log "Paso $step_num: OK"
        else
            echo "❌ Paso $step_num FALLÓ (exit code: $?)" >> "$exec_log"
            log "ERROR: Paso $step_num falló"
            echo "- **Paso $step_num:** $step_name ❌ FALLÓ" >> "$exec_log"
            if [ "$CONTINUE_ON_ERROR" != "true" ]; then
                log "Abortando ejecución por error en paso $step_num"
                break
            fi
        fi
    else
        log "[DRY-RUN] Comandos del paso $step_num (no ejecutados)"
        echo "✅ Paso $step_num: DRY-RUN (sin ejecución)" >> "$exec_log"
    fi
fi
```

**Variable nueva en sección de constantes:**
```bash
DRY_RUN="${DRY_RUN:-false}"
CONTINUE_ON_ERROR="${CONTINUE_ON_ERROR:-false}"
AUTO_APPROVE="${AUTO_APPROVE:-false}"
```

**Verificación:**
```bash
# Test dry-run
DRY_RUN=true ./workflow.sh execute <plan>
# Debe mostrar comandos sin ejecutarlos

# Test ejecución real
./workflow.sh execute <plan_con_comandos_validos>
# Debe ejecutar los bash y loguear resultado
```

**Rollback:** Re-comentar la línea `eval`

---

### P0-2: Flag `--auto` para ciclo sin intervención

**Archivos:** `workflow.sh` (modo `full`, funciones `await_*`)

**Cambios:**
- Agregar flag `--auto` al dispatch `full`
- Si `AUTO_APPROVE=true`, hacer `touch .approve` automático en lugar de esperar

**Código en `full()`:**
```bash
full) auto=false
    shift
    case "$1" in
        --auto) auto=true; shift ;;
    esac
    instruction="$*"
    
    prop_file=$("$SCRIPT" propose "$instruction")
    if [ "$auto" = "true" ]; then
        touch "${prop_file}.approve"
    fi
    # ... resto del ciclo
```

**Código en `await_*`:**
```bash
await_propuesta_approval() {
    # Si auto-approve está activo, el .approve ya existe
    if [ "$AUTO_APPROVE" = "true" ] && [ ! -f "${1}.approve" ]; then
        touch "${1}.approve"
    fi
    # ... resto igual
}
```

**Verificación:**
```bash
./workflow.sh full --auto "Prueba automática"
# No debe pedir intervención humana
```

**Rollback:** Eliminar condición `if [ "$auto" = "true" ]`

---

### P0-3: Fix `echo -e` → `printf`

**Archivos:** `workflow.sh` (línea 376)

**Cambio:**
```bash
# Reemplazar:
echo -e "\n## Resultado\n- **Estado:** EJECUTADO PARCIALMENTE (rellenar pasos en el plan)" >> "$exec_log"

# Por:
{
    echo ""
    echo "## Resultado"
    echo "- **Estado:** EJECUTADO (comandos ejecutados)" 
} >> "$exec_log"
```

**Verificación:** El execution_log no debe mostrar `-e` como artifacto.

**Rollback:** Revertir a `echo -e`.

---

## Fase 2: P1 — Robustez (20 min)

### P1-1: Parseo robusto de steps

**Archivos:** `workflow.sh` (función `execute`)

**Cambio:**
- Usar `grep -E "^### Paso [0-9]+:"` en lugar de `grep "^### Paso"`
- Esto evita falsos positivos si hay `### Paso` en ejemplos o comentarios

**Código:**
```bash
# Reemplazar línea 333:
steps=$(grep -E "^### Paso [0-9]+:" "$plan_file" || echo "")
```

**Verificación:** Plan con `### Paso` en bloque de código no debe generar pasos falsos.

**Rollback:** Revertir a `grep "^### Paso"`.

---

### P1-2: Rollback git automático

**Archivos:** `workflow.sh` (función `execute`, nueva función `rollback`)

**Cambios:**
- Al iniciar `execute`, guardar snapshot del HEAD de git
- Si un paso falla y NO es `CONTINUE_ON_ERROR`, ejecutar rollback

**Código:**
```bash
# Al inicio de execute():
ROLLBACK_HASH=""
if command -v git >/dev/null 2>&1 && git rev-parse --git-dir >/dev/null 2>&1; then
    ROLLBACK_HASH=$(git rev-parse HEAD)
    log "Git snapshot: $ROLLBACK_HASH"
fi

# Nueva función:
rollback() {
    log "ROLLBACK: revirtiendo cambios no commiteados"
    if [ -n "$ROLLBACK_HASH" ]; then
        git checkout -- "$PROJECT_ROOT" 2>/dev/null || true
        log "ROLLBACK: archivos restaurados a $ROLLBACK_HASH"
    fi
}

# En execute(), cuando un paso falla:
if [ "$CONTINUE_ON_ERROR" != "true" ]; then
    rollback
    break
fi
```

**Verificación:** Crear un archivo de prueba, ejecutar plan con paso que falla, verificar que el archivo se restaura.

**Rollback:** Comentar las llamadas a `rollback()`.

---

## Fase 3: P2 — Contexto del proyecto (1 hr) ✅ COMPLETADA

### P2-1: Modo `analyze`

**Archivos:** `workflow.sh` (nuevo modo `analyze`, nuevo archivo `.workflow/context.md`)

**Cambios:**
- Nuevo modo que escanea el código fuente en busca de archivos, endpoints, y módulos relacionados con la instrucción
- El output se guarda en `.workflow/context.md`
- Hookear en `propose` para enriquecer el template

**Código:**
```bash
# Nueva función
analyze() {
    instruction="$*"
    context_file="$WORKFLOW_DIR/context.md"
    
    echo "# Contexto del Proyecto" > "$context_file"
    echo "" >> "$context_file"
    echo "Instrucción: $instruction" >> "$context_file"
    echo "" >> "$context_file"
    
    # Buscar archivos relacionados
    echo "## Archivos potencialmente relevantes" >> "$context_file"
    for word in $instruction; do
        [ ${#word} -lt 4 ] && continue
        found=$(find "$PROJECT_ROOT/src" -name "*.ts" -path "*/${word}*" 2>/dev/null | head -5)
        if [ -n "$found" ]; then
            echo "### $word" >> "$context_file"
            echo "$found" >> "$context_file"
        fi
    done
    
    # Buscar controladores
    echo "" >> "$context_file"
    echo "## Controladores y endpoints" >> "$context_file"
    grep -rn "@Controller\|@Public\|@Roles\|@Get\|@Post\|@Put\|@Patch\|@Delete" \
        "$PROJECT_ROOT/src" --include="*.ts" 2>/dev/null | head -30 >> "$context_file"
    
    log "Contexto generado: $context_file"
    echo "$context_file"
}
```

**Agregar al dispatch:**
```bash
analyze)
    shift
    analyze "$*"
    ;;
```

**Verificación:**
```bash
./workflow.sh analyze "auth users"
# Debe generar .workflow/context.md con archivos de auth y users
```

---

### P2-2: Templates dinámicos con contexto

**Archivos:** `workflow.sh` (funciones `propose`, `plan`)

**Cambios:**
- En `propose`, si `context.md` existe, inyectar secciones de contexto real
- Reemplazar los "parenthesis hints" con datos concretos del proyecto
- Si se detecta un módulo específico, incluir sus endpoints

**Código (hook en propose):**
```bash
# Después de escribir la instrucción, en propose():
context_file="$WORKFLOW_DIR/context.md"
template_context=""
if [ -f "$context_file" ]; then
    template_context=$(cat "$context_file")
fi

# En el template, reemplazar contexto:
if [ -n "$template_context" ]; then
    analysis_section="$template_context"
else
    analysis_section="$(echo "$instruction" | head -c 500)"
fi

# Usar en el heredoc:
echo "$analysis_section" | head -c 1000
```

---

## Fase 4: P3 — Avanzadas (1.5 hr) ✅ COMPLETADA

### P3-1: Checkpoint / reanudación

**Archivos:** `workflow.sh` (función `execute`)

**Cambios:**
- Guardar checkpoint después de cada paso exitoso
- Si se interrumpe, poder reanudar desde el último checkpoint

**Código:**
```bash
# Variables:
CHECKPOINT_FILE="$WORKFLOW_DIR/checkpoint"

# En execute(), antes del bucle:
RESUME_FROM=""
if [ -f "$CHECKPOINT_FILE" ]; then
    RESUME_FROM=$(cat "$CHECKPOINT_FILE")
    log "Checkpoint encontrado: paso $RESUME_FROM. Reanudando..."
fi

# En execute(), después de cada paso exitoso:
echo "$step_num" > "$CHECKPOINT_FILE"

# En el bucle, saltar pasos ya completados:
if [ -n "$RESUME_FROM" ] && [ "$step_num" -le "$RESUME_FROM" ]; then
    log "Paso $step_num ya completado, saltando..."
    continue
fi

# Al finalizar/fallar:
rm -f "$CHECKPOINT_FILE"
```

---

### P3-2: Integración LLM

**Archivos:** `workflow.sh` (nuevo modo `ai` o flag en `propose`)

**Cambios:**
- Llamar a `opencode` o `curl` para generar propuestas usando LLM
- Construir prompt con contexto del proyecto + instrucción

**Código:**
```bash
ai_propose() {
    instruction="$*"
    context_file="$WORKFLOW_DIR/context.md"
    prop_file="$OUTBOX_DIR/cycle_${cycle}_PROPUESTA_v1_0_DRAFT.md"
    
    # Construir prompt
    prompt="Eres un arquitecto de software para @tienda/api (NestJS + Prisma + PostgreSQL + Redis)."
    prompt="$prompt\n\n## Instrucción del usuario\n$instruction"
    prompt="$prompt\n\n## Contexto del proyecto\n"
    
    if [ -f "$context_file" ]; then
        prompt="$prompt$(cat "$context_file")"
    fi
    
    prompt="$prompt\n\n## Formato de salida\n"
    prompt="$prompt"': Genera un archivo .md con frontmatter YAML y secciones: Análisis, Propuesta, Implicaciones.'
    
    # Llamar a opencode
    echo "$prompt" | opencode --model big-pickle --quiet > "$prop_file" 2>/dev/null
    
    if [ -f "$prop_file" ] && [ -s "$prop_file" ]; then
        log "Propuesta generada por IA: $prop_file"
        echo "$prop_file"
    else
        log "ERROR: Falló generación por IA, usando template estándar"
        propose "$instruction"
    fi
}
```

---

## Diagrama de Dependencias

```
Fase 1: P0
├── P0-1 (eval + dry-run) ── base para ejecución real
├── P0-2 (--auto)          ── independiente
└── P0-3 (fix echo -e)     ── independiente

Fase 2: P1
├── P1-1 (parseo robusto)  ── independiente
└── P1-2 (rollback git)    ── necesita P0-1 (detectar error)

Fase 3: P2
├── P2-1 (analyze)         ── independiente
└── P2-2 (templates dinámicos) ── necesita P2-1 (contexto)

Fase 4: P3
├── P3-1 (checkpoint)      ── necesita P0-1 (ejecución real)
└── P3-2 (integración LLM) ── necesita P2-1 + P2-2 (contexto)
```

## Criterios de Éxito

1. `workflow.sh full --auto "mensaje"` ejecuta ciclo completo sin intervención
2. `DRY_RUN=true workflow.sh execute <plan>` muestra comandos sin ejecutar
3. Un paso que falla ejecuta rollback git automático
4. `workflow.sh analyze "auth"` genera contexto con endpoints de auth
5. El execution_log no muestra artifacto `-e`
6. `### Paso` en bloque de código no se parsea como step
7. Si el ciclo se interrumpe y se reanuda, retoma desde el último checkpoint

---

_Generado a partir del análisis post-ejecución del workflow.sh_
