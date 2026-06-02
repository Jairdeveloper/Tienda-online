---
id: 027
area: dev
type: PLAN
module: workflow
version: 1.0
status: DRAFT
source: .workflow/outbox/026_DEV_PROPUESTA_ARTIFACTS_1_0_DRAFT.md
dependencies:
  - 026
tags:
  - workflow
  - plan
  - artifacts
  - implementation
  - bash
  - execution
summary: "Plan de ejecución detallado para implementar el sistema de generación de artefactos en workflow.sh según la propuesta 026. Incluye 8 pasos con archivos, acciones, comandos y verificación."
keywords:
  - workflow
  - plan
  - implementacion
  - artefactos
  - bash
  - templates
  - ids
changelog:
  - version: 1.0
    date: 2026-05-31
    author: workflow-agent
    changes:
      - "Creación inicial del plan de ejecución para el sistema de artefactos"
---

# Plan de Ejecución: Sistema de Generación de Artefactos

**Propuesta origen:** `.workflow/outbox/026_DEV_PROPUESTA_ARTIFACTS_1_0_DRAFT.md`
**Objetivo:** Implementar el modo `artifact` en `workflow.sh` con 3 tipos
(Propuesta, Documentación, Código), templates externos, frontmatter YAML
automatizado y registro de IDs.

---

## Contexto del Análisis

El script `workflow.sh` (904 líneas) actualmente genera 5 tipos de archivos
con templates hardcodeados. No hay un mecanismo unificado para producir
artefactos reutilizables. Este plan implementa la propuesta 026 añadiendo un
nuevo modo `artifact` que centraliza la generación, externaliza los templates
a `.workflow/templates/`, y automatiza el registro de IDs.

**Principios de implementación:**
1. 100% aditivo — no romper modos existentes
2. Templates externos con fallback inline
3. Frontmatter YAML generado automáticamente
4. Compatibilidad hacia atrás garantizada

---

## Pre-vuelo

- [ ] Leer la propuesta completa: `.workflow/outbox/026_DEV_PROPUESTA_ARTIFACTS_1_0_DRAFT.md`
- [ ] Verificar directorio `.workflow/` existe
- [ ] Verificar `bash` disponible y `bash -n workflow.sh` pasa
- [ ] Tener `docs/REGISTRO_IDS.md` accesible
- [ ] Backup de `workflow.sh` actual
- [ ] Tener `git status` limpio para poder revertir si es necesario

## Prerrequisitos

```bash
# Verificar estado del repositorio
git status

# Verificar sintaxis actual del script
bash -n workflow.sh

# Verificar que los directorios existen
ls -la .workflow/
ls -la docs/REGISTRO_IDS.md
```

---

## Pasos

### Paso 1: Crear directorio de templates y templates base

- **Archivos involucrados:** (nuevos) `.workflow/templates/`
- **Acción:** Crear el directorio `.workflow/templates/` y los 4 archivos de
  template (propuesta_plan, propuesta_ejecucion, documentacion, codigo).
- **Comandos:**
  ```bash
  mkdir -p .workflow/templates
  ```
- **Verificación:** `ls .workflow/templates/` muestra el directorio creado

#### Template: `propuesta_plan.tpl.md`

```markdown
---
id: {{ID}}
area: dev
type: PROPUESTA
subtype: PLAN
module: {{MODULE}}
version: {{VERSION}}
status: DRAFT
tags:
  - {{TAG1}}
  - {{TAG2}}
summary: "{{SUMMARY}}"
---

# Plan: {{TITLE}}

## Contexto

{{CONTEXT}}

## Pre-vuelo

{{PREFLIGHT}}

## Pasos

{{STEPS}}

## Post-ejecución

{{POST_EXECUTION}}

## Rollback

{{ROLLBACK}}

---

_Generado por workflow.sh artifact en {{DATE}}_
```

#### Template: `propuesta_ejecucion.tpl.md`

```markdown
---
id: {{ID}}
area: dev
type: PROPUESTA
subtype: EJECUCION
module: {{MODULE}}
version: {{VERSION}}
status: DRAFT
tags:
  - {{TAG1}}
  - {{TAG2}}
summary: "{{SUMMARY}}"
---

# Resultado de Ejecución: {{TITLE}}

## Resumen

{{SUMMARY}}

## Pasos Ejecutados

{{STEPS}}

## Resultados

{{RESULTS}}

## Pendientes

{{PENDING}}

---

_Generado por workflow.sh artifact en {{DATE}}_
```

#### Template: `documentacion.tpl.md`

```markdown
---
id: {{ID}}
area: {{AREA}}
type: {{TYPE}}
module: {{MODULE}}
version: {{VERSION}}
status: DRAFT
tags:
  - {{TAG1}}
  - {{TAG2}}
summary: "{{SUMMARY}}"
keywords:
  - {{KEYWORD1}}
  - {{KEYWORD2}}
---

# {{TITLE}}

## Descripción

{{DESCRIPTION}}

## Contenido

{{CONTENT}}

## Referencias

{{REFERENCES}}

---

_Generado por workflow.sh artifact en {{DATE}}_
```

#### Template: `codigo.tpl.md`

```markdown
---
id: {{ID}}
area: code
type: CODIGO
module: {{MODULE}}
version: {{VERSION}}
status: DRAFT
language: {{LANGUAGE}}
summary: "{{SUMMARY}}"
---

# Parche/Script: {{TITLE}}

## Descripción

{{DESCRIPTION}}

## Código

\`\`\`{{LANGUAGE}}
{{CODE}}
\`\`\`

## Instrucciones de Aplicación

{{INSTRUCTIONS}}

---

_Generado por workflow.sh artifact en {{DATE}}_
```

### Paso 2: Añadir función `generate_frontmatter()` a `workflow.sh`

- **Archivos involucrados:** `workflow.sh` (antes de línea 76, junto a las
  otras funciones de utilidad)
- **Acción:** Crear una función que genere frontmatter YAML a partir de
  parámetros, evitando duplicación de lógica YAML.
- **Comandos:** Editar `workflow.sh` insertando la función después de `out()`.
- **Verificación:** `bash -n workflow.sh` valida sintaxis

#### Función a implementar

```bash
# --- Generación de frontmatter YAML (compartido por todos los artefactos) ---
generate_frontmatter() {
    id="$1"
    area="$2"
    type="$3"
    module="${4:-workflow}"
    version="${5:-1.0}"
    status="${6:-DRAFT}"
    summary="$7"
    tags="$8"    # string separado por comas

    cat <<-FM_EOF
	---
	id: ${id}
	area: ${area}
	type: ${type}
	module: ${module}
	version: ${version}
	status: ${status}
	tags:
$(echo "$tags" | tr ',' '\n' | sed 's/^[[:space:]]*/  - /')
	summary: "${summary}"
	---
	FM_EOF
}
```

### Paso 3: Añadir función `load_template()` a `workflow.sh`

- **Archivos involucrados:** `workflow.sh`
- **Acción:** Crear función que cargue un template desde
  `.workflow/templates/` con fallback a un template inline por defecto.
- **Verificación:** `bash -n workflow.sh`

#### Función a implementar

```bash
# --- Carga de templates (con fallback inline) ---
load_template() {
    template_name="$1"
    template_file="$WORKFLOW_DIR/templates/${template_name}.tpl.md"

    if [ -f "$template_file" ]; then
        cat "$template_file"
    else
        log "Template $template_name no encontrado, usando inline"
        case "$template_name" in
            propuesta_plan)
                cat <<-'TPL_EOF'
				---
				id: {{ID}}
				area: dev
				type: PROPUESTA
				subtype: PLAN
				summary: "{{SUMMARY}}"
				---

				# Plan: {{TITLE}}

				## Contexto
				{{CONTEXT}}

				## Pasos
				{{STEPS}}
				TPL_EOF
                ;;
            *)
                log "ERROR: template desconocido: $template_name"
                return 1
                ;;
        esac
    fi
}
```

### Paso 4: Añadir función `render_template()` a `workflow.sh`

- **Archivos involucrados:** `workflow.sh`
- **Acción:** Crear función que reemplace variables `{{VAR}}` en el template
  usando `sed`, recibiendo un conjunto de pares clave=valor.
- **Verificación:** Probar con entrada controlada

#### Función a implementar

```bash
# --- Renderizado de template (reemplazo de {{VARIABLES}}) ---
render_template() {
    template="$1"
    shift
    result="$template"
    for pair in "$@"; do
        key=$(echo "$pair" | cut -d'=' -f1)
        value=$(echo "$pair" | cut -d'=' -f2-)
        # Escapar caracteres especiales para sed
        value=$(echo "$value" | sed 's/[\/&]/\\&/g')
        result=$(echo "$result" | sed "s/{{${key}}}/${value}/g")
    done
    echo "$result"
}
```

### Paso 5: Añadir función `register_id()` a `workflow.sh`

- **Archivos involucrados:** `workflow.sh`, `docs/REGISTRO_IDS.md`
- **Acción:** Crear función que verifique y añada entradas en
  `docs/REGISTRO_IDS.md`.
- **Verificación:** Ejecutar `register_id` manualmente y verificar que la
  entrada aparezca en REGISTRO_IDS.md

#### Función a implementar

```bash
# --- Registro de IDs en REGISTRO_IDS.md ---
register_id() {
    id="$1"
    filename="$2"
    area="$3"
    type="$4"
    registry="$PROJECT_ROOT/docs/REGISTRO_IDS.md"

    if [ ! -f "$registry" ]; then
        log "ERROR: $registry no encontrado"
        return 1
    fi

    if grep -q "| ${id} |" "$registry"; then
        log "WARN: ID $id ya registrado en REGISTRO_IDS.md, omitiendo"
        return 0
    fi

    echo "| ${id} | \`${filename}\` | ${area} | ${type} | DRAFT | $(date +%F) |" >> "$registry"
    log "ID $id registrado en REGISTRO_IDS.md"
}
```

### Paso 6: Añadir modo `artifact` al dispatch principal

- **Archivos involucrados:** `workflow.sh` (función `main()`, case dispatch)
- **Acción:** Añadir el caso `artifact` en el switch principal (línea 760)
  que llame a una nueva función `artifact()`.
- **Verificación:** `./workflow.sh artifact --help` muestra uso

#### Función `artifact()` a implementar

```bash
# --- Modo artifact: generación unificada de artefactos ---
artifact() {
    # Parsear argumentos
    type=""
    subtype=""
    custom_id=""
    output_dir="$OUTBOX_DIR"
    dry_run=false
    do_register=true
    template_name=""
    description=""

    while [ $# -gt 0 ]; do
        case "$1" in
            --type) type="$2"; shift 2 ;;
            --subtype) subtype="$2"; shift 2 ;;
            --id) custom_id="$2"; shift 2 ;;
            --output) output_dir="$2"; shift 2 ;;
            --dry-run) dry_run=true; shift ;;
            --no-register) do_register=false; shift ;;
            --template) template_name="$2"; shift 2 ;;
            --help) artifact_help; return 0 ;;
            *) description="$*"; break ;;
        esac
    done

    # Si no hay type como flag, usar primer argumento posicional
    if [ -z "$type" ] && [ -n "$1" ]; then
        type="$1"
        shift
        # Re-parsear el resto
        description="$*"
    fi

    if [ -z "$type" ] || [ -z "$description" ]; then
        log "ERROR: uso: artifact <tipo> [--subtype <st>] [--id <id>] [--dry-run] <descripción>"
        artifact_help
        exit 1
    fi

    # Validar tipo
    case "$type" in
        propuesta|documentacion|codigo) ;;
        *) log "ERROR: tipo inválido: $type. Válidos: propuesta, documentacion, codigo"; exit 1 ;;
    esac

    # Generar ID si no se especificó
    if [ -z "$custom_id" ]; then
        # ID auto: timestamp + hash corto
        custom_id="art_$(date +%s)_$$"
    fi

    # Construir nombre de template
    if [ -z "$template_name" ]; then
        case "$type" in
            propuesta)
                case "$subtype" in
                    plan|ejecucion) template_name="${type}_${subtype}" ;;
                    *) template_name="${type}_plan" ;;
                esac
                ;;
            *) template_name="$type" ;;
        esac
    fi

    version="1_0"
    estado="DRAFT"
    module="workflow"

    # Generar nombre de archivo
    safe_name=$(echo "$description" | tr ' ' '_' | tr -cd 'A-Za-z0-9_-' | head -c 40)
    case "$type" in
        codigo) ext=".sh" ;;
        *) ext=".md" ;;
    esac
    filename="${custom_id}_${type}"
    [ -n "$subtype" ] && filename="${filename}_${subtype}"
    filename="${filename}_${safe_name}_v${version}_${estado}${ext}"
    output_path="${output_dir}/${filename}"

    # Cargar y renderizar template
    template=$(load_template "$template_name")
    if [ $? -ne 0 ]; then
        log "ERROR: no se pudo cargar el template $template_name"
        exit 1
    fi

    summary=$(echo "$description" | head -c 100)
    title=$(echo "$description" | head -c 60)

    rendered=$(render_template "$template" \
        "ID=$custom_id" \
        "MODULE=$module" \
        "VERSION=$version" \
        "STATUS=$estado" \
        "SUMMARY=$summary" \
        "TITLE=$title" \
        "DATE=$(date -Iseconds)" \
        "DESCRIPTION=$description" \
    )

    if [ "$dry_run" = "true" ]; then
        echo "$rendered"
        log "[DRY-RUN] Artefacto simulado: $output_path"
        echo "$output_path"
        return 0
    fi

    echo "$rendered" > "$output_path"
    log "Artefacto generado: $output_path"

    # Registrar ID
    if [ "$do_register" = "true" ]; then
        register_id "$custom_id" "$filename" "dev" "${type}"
    fi

    set_state "artifact:${type}:${custom_id}"
    echo "$output_path"
}

artifact_help() {
    echo "workflow.sh artifact — Generación de artefactos"
    echo ""
    echo "Tipos:"
    echo "  propuesta       Documento de tipo Propuesta (Plan/Ejecución)"
    echo "  documentacion   Documento de referencia, guía, especificación"
    echo "  codigo          Parche, script, fragmento de código"
    echo ""
    echo "Flags:"
    echo "  --subtype <st>   Subtipo: plan, ejecucion"
    echo "  --id <id>        ID específico (default: auto)"
    echo "  --output <dir>   Directorio de salida (default: .workflow/outbox/)"
    echo "  --dry-run        Mostrar sin escribir"
    echo "  --no-register    No registrar en REGISTRO_IDS.md"
    echo "  --template <nom> Template específico"
    echo ""
    echo "Ejemplos:"
    echo "  $0 artifact propuesta --subtype plan 'Implementar X'"
    echo "  $0 artifact documentacion 'Guía de despliegue'"
    echo "  $0 artifact codigo --dry-run 'Script de backup'"
}
```

### Paso 7: Integrar `artifact` en el dispatch `main()`

- **Archivos involucrados:** `workflow.sh` (línea ~760, bloque case)
- **Acción:** Añadir el caso `artifact` en el switch de `main()`.
- **Verificación:** `./workflow.sh artifact --help` funciona

#### Cambio en `main()`

En el case dispatch (después del caso `ai|ai-propose`), añadir:

```bash
artifact)
    shift
    artifact "$@"
    ;;
```

También añadir la entrada en el help (sección `help|--help|-h`):

```
echo "  $0 artifact <tipo> [flags] <desc>  Genera artefactos (propuesta, documentacion, codigo)"
```

### Paso 8: Actualizar documentación y pruebas

- **Archivos involucrados:**
  - `workflow/025_DEV_REFERENCE_WORKFLOW_1_0_DRAFT.md` — Nueva sección 11
  - `workflow/024_DEV_GUIDE_WORKFLOW_1_0_DRAFT.md` — Nuevos ejemplos
  - `.opencode/agents/workflow-agent.md` — Nuevo modo en tabla
- **Acción:** Añadir documentación del nuevo modo en los 3 documentos.
- **Verificación:** Revisar que la documentación sea consistente

---

## Post-ejecución

- [ ] Ejecutar `bash -n workflow.sh` para validar sintaxis
- [ ] Probar `./workflow.sh artifact --help`
- [ ] Probar `./workflow.sh artifact propuesta --subtype plan --dry-run "test"`
- [ ] Probar `./workflow.sh artifact documentacion --dry-run "test"`
- [ ] Probar `./workflow.sh artifact codigo --dry-run "test"`
- [ ] Ejecutar ciclo corto: `./workflow.sh full --auto "test post-artifact"`
- [ ] Verificar que los modos existentes siguen funcionando:
  ```bash
  ./workflow.sh clean
  ./workflow.sh status
  ./workflow.sh clean
  ```
- [ ] Verificar REGISTRO_IDS.md para confirmar IDs registrados
- [ ] Si todo OK: `./workflow.sh clean`

---

## Rollback

### Paso 1 (templates):
```bash
rm -rf .workflow/templates/
```

### Pasos 2–6 (cambios en workflow.sh):
```bash
git checkout -- workflow.sh
```

### Paso 7 (dispatch):
```bash
git checkout -- workflow.sh
```

### Paso 8 (documentación):
```bash
git checkout -- workflow/025_DEV_REFERENCE_WORKFLOW_1_0_DRAFT.md
git checkout -- workflow/024_DEV_GUIDE_WORKFLOW_1_0_DRAFT.md
git checkout -- .opencode/agents/workflow-agent.md
```

### Regla general:
Si algún paso falla, detener la ejecución y revertir usando `git checkout`
para cambios no commiteados. Para cambios ya commiteados, usar `git revert`.

---

## Riesgos

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| Sintaxis incorrecta al editar `workflow.sh` | Alto — script no funciona | `bash -n workflow.sh` después de cada cambio |
| Template con variables mal nombradas | Medio — artefacto con placeholders | Probar con `--dry-run` antes de generar real |
| Conflicto de IDs en `REGISTRO_IDS.md` | Bajo — entrada duplicada | `register_id()` verifica duplicados |
| Regresión en modo existente | Alto — ciclo de trabajo roto | Prueba de regresión post-implementación |
| Archivos de template se eliminan accidentalmente | Bajo — fallback inline disponible | `load_template()` implementa fallback |

---

_Generado por workflow-agent el 2026-05-31 a partir de la propuesta 026_
