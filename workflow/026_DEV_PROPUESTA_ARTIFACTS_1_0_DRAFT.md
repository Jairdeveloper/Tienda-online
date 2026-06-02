---
id: 026
area: dev
type: PROPUESTA
module: workflow
version: 1.0
status: DRAFT
tags:
  - workflow
  - proposal
  - artifacts
  - generator
  - automation
  - bash
  - templates
summary: "Propuesta para implementar un sistema de generación de artefactos en workflow.sh que permita producir documentos de tipo Propuesta (Plan/Ejecución), Documentación y Código, con frontmatter YAML, templates parametrizables y registro central de IDs."
keywords:
  - workflow
  - artefactos
  - generacion
  - propuesta
  - plan
  - documentacion
  - codigo
  - template
  - yaml
  - frontmatter
  - ids
  - bash
changelog:
  - version: 1.0
    date: 2026-05-31
    author: workflow-agent
    changes:
      - "Creación inicial de la propuesta para el sistema de generación de artefactos"
---

# Propuesta: Sistema de Generación de Artefactos en `workflow.sh`

## Resumen Ejecutivo

Actualmente `workflow.sh` genera 5 tipos de archivos ad-hoc (instrucción,
propuesta, plan, resultado, verificación) con templates hardcodeados dentro del
propio script. Cada nuevo tipo requiere editar el script, duplicar lógica de
frontmatter, y no hay un mecanismo unificado para producir artefactos
reutilizables (documentación técnica, parches de código, informes).

Esta propuesta describe un **sistema de generación de artefactos** que
centraliza la creación de documentos en 3 categorías (Propuesta, Documentación,
Código), con templates externos, frontmatter YAML automatizado, y registro de
IDs en `docs/REGISTRO_IDS.md`.

---

## 1. Análisis de la Situación Actual

### 1.1 Estado del Arte

El script `workflow.sh` (904 líneas) genera los siguientes tipos de archivos:

| Archivo | Función | Líneas | Frontmatter | Template |
|---------|---------|--------|-------------|----------|
| `cycle_N_instruction.md` | `propose()` | 91–104 | Manual inline | Hardcodeado |
| `cycle_N_PROPUESTA_v1_0_DRAFT.md` | `propose()` | 116–165 | Manual inline | Hardcodeado |
| `cycle_N_PLAN_v1_0_DRAFT.md` | `plan()` | 233–309 | Manual inline | Hardcodeado |
| `cycle_N_RESULTADO_v1_0.md` | `execute()` | 473–493 | Manual inline | Hardcodeado |
| `cycle_N_execution_log.md` | `execute()` | 402–410 | Sin frontmatter | Hardcodeado |
| `cycle_N_VERIFICACION_v1_0.md` | `verify()` | 511–554 | Manual inline | Hardcodeado |

### 1.2 Problemas Identificados

1. **Duplicación de lógica YAML**: Cada función construye su frontmatter con
   `cat > archivo <<-EOF ... EOF`. Si se cambia el formato de frontmatter,
   hay que editar 6+ secciones.

2. **Sin reutilización**: No se pueden generar artefactos independientes del
   ciclo (ej. una guía técnica, un parche de código, un informe de estado)
   sin crear nuevas funciones.

3. **IDs no registrados automáticamente**: Los IDs de ciclo (`propuesta_1`,
   `plan_1`, etc.) no se registran en `docs/REGISTRO_IDS.md`.

4. **Templates no parametrizables**: No hay variables reutilizables ni
   composición de templates. Cada artefacto es un bloque monolítico.

5. **Sin artefactos de código**: No hay forma de generar parches, scripts
   o fragmentos de código como artefactos independientes.

### 1.3 Oportunidades

- Unificar la generación de documentos bajo un solo modo (`artifact`)
- Externalizar templates a archivos `.md.tpl` en `.workflow/templates/`
- Añadir registro automático de IDs
- Permitir generación de código listo para aplicar
- Integrar con el pipeline existente sin romper compatibilidad

---

## 2. Propuesta

### 2.1 Arquitectura del Sistema

```
workflow.sh artifact --type <tipo> [--subtype <subtipo>] [--id <id>] "<descripción>"

Tipo Propuesta:
  ├── Subtipo: Plan        → Documento con pasos detallados a ejecutar
  └── Subtipo: Ejecución   → Documento con resultado de la ejecución

Tipo Documentación:
  └── Documentos de referencia, guías, especificaciones técnicas

Tipo Código:
  └── Parches, scripts, fragmentos de código listos para aplicar
```

### 2.2 Nuevo Modo `artifact`

Se añade un nuevo modo principal al script:

```bash
# Sintaxis general
./workflow.sh artifact <tipo> [flags] "<descripción>"

# Flags opcionales
--id <id>           # ID específico (por defecto: auto-asignado)
--subtype <subtipo> # Subtipo dentro del tipo (ej. plan, ejecucion)
--output <ruta>     # Directorio de salida (por defecto: outbox/)
--dry-run           # Muestra el artefacto sin escribirlo
--register          # Registra el ID en REGISTRO_IDS.md (por defecto: true)
--template <nombre> # Usa un template específico en lugar del default
```

### 2.3 Estructura de Archivos de Salida

```
.workflow/
├── outbox/
│   ├── <ID>_PROPUESTA_PLAN_<nombre>_v1_0_DRAFT.md        # Tipo Propuesta/Plan
│   ├── <ID>_PROPUESTA_EJECUCION_<nombre>_v1_0_DRAFT.md   # Tipo Propuesta/Ejecución
│   ├── <ID>_DOCUMENTACION_<nombre>_v1_0_DRAFT.md          # Tipo Documentación
│   └── <ID>_CODIGO_<nombre>_v1_0_DRAFT.sh/.ts/.md         # Tipo Código
└── templates/                          # ← NUEVO: directorio de templates
    ├── propuesta_plan.tpl.md
    ├── propuesta_ejecucion.tpl.md
    ├── documentacion.tpl.md
    └── codigo.tpl.sh
```

#### Nomenclatura de artefactos

```
[ID]_[TIPO]_[SUBTIPO]_[NOMBRE]_v[VERSION]_[ESTADO].[ext]
```

| Componente | Descripción | Ejemplo |
|-----------|-------------|---------|
| `ID` | ID secuencial | `026` |
| `TIPO` | Tipo de artefacto | `PROPUESTA`, `DOCUMENTACION`, `CODIGO` |
| `SUBTIPO` | Subtipo (opcional) | `PLAN`, `EJECUCION` |
| `NOMBRE` | Nombre semántico UPPER_SNAKE_CASE | `SISTEMA_ARTEFACTOS` |
| `VERSION` | Versión del artefacto | `1_0` |
| `ESTADO` | Estado del documento | `DRAFT` |
| `ext` | Extensión según tipo | `.md`, `.sh`, `.ts` |

### 2.4 Templates

Los templates se almacenan como archivos `.tpl.md`/`.tpl.sh` en
`.workflow/templates/`. Usan variables `{{VAR}}` que el script reemplaza
con `sed`.

#### Template de Propuesta/Plan

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
```

#### Template de Documentación

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
---

# {{TITLE}}

## Descripción

{{DESCRIPTION}}

## Contenido

{{CONTENT}}

## Referencias

{{REFERENCES}}
```

#### Template de Código

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

```{{LANGUAGE}}
{{CODE}}
```

## Instrucciones de Aplicación

{{INSTRUCTIONS}}
```

### 2.5 Integración con el Sistema de Templates Existente

El sistema actual usa templates hardcodeados dentro de las funciones del script
(`cat > archivo <<-EOF`). La migración sigue estas reglas:

1. **Fase 1 — Compatibilidad hacia atrás**: Las funciones existentes
   (`propose`, `plan`, `execute`, `verify`) siguen funcionando con sus
   templates inline. El nuevo modo `artifact` coexiste en paralelo.

2. **Fase 2 — Migración progresiva**: Cada función existente se refactoriza
   para usar `artifact` internamente. Ejemplo:
   ```bash
   propose() {
       artifact propuesta plan --id "propuesta_${cycle}" "$instruction"
   }
   ```

3. **Fase 3 — Templates externos por defecto**: Las funciones existentes
   leen templates de `.workflow/templates/` si están disponibles, con
   fallback al template inline.

### 2.6 Registro de IDs

El comando `artifact --register` (activo por defecto) añade automáticamente
una entrada en `docs/REGISTRO_IDS.md`:

```bash
# Formato de registro
| {{ID}} | `{{FILENAME}}` | {{AREA}} | {{TYPE}} | DRAFT | {{DATE}} |
```

Se añade una nueva función `register_id()` en `workflow.sh`:

```bash
register_id() {
    id="$1"
    filename="$2"
    area="$3"
    type="$4"
    registry="$PROJECT_ROOT/docs/REGISTRO_IDS.md"
    
    # Verificar que el ID no exista ya
    if grep -q "| ${id} |" "$registry"; then
        log "ERROR: ID $id ya registrado en REGISTRO_IDS.md"
        return 1
    fi
    
    # Añadir entrada
    echo "| ${id} | \`${filename}\` | ${area} | ${type} | DRAFT | $(date +%F) |" >> "$registry"
    log "ID $id registrado: $filename"
}
```

### 2.7 Ejemplos de Uso

```bash
# Generar un plan (Propuesta/Plan)
./workflow.sh artifact propuesta --subtype plan \
    "Implementar módulo de notificaciones"

# Generar documentación técnica
./workflow.sh artifact documentacion \
    --id 028 --module auth \
    "Guía de autenticación JWT"

# Generar un script de código listo para aplicar
./workflow.sh artifact codigo \
    --language typescript --output src/ \
    "Parche: añadir endpoint GET /health/detailed"

# Dry run: mostrar sin escribir
./workflow.sh artifact propuesta --subtype plan --dry-run \
    "Revisar seguridad de endpoints"
```

### 2.8 Backward Compatibility

- El modo `artifact` es **aditivo**: no modifica ningún comportamiento existente.
- Los modos actuales (`propose`, `plan`, `execute`, `verify`, `analyze`, `ai`,
  `full`, `listen`, `status`, `clean`) siguen funcionando idénticamente.
- Los archivos en `outbox/` generados por `artifact` tienen un naming diferente
  pero coexisten sin conflicto con los archivos `cycle_N_*`.
- Si no hay templates en `.workflow/templates/`, el sistema usa templates
  inline por defecto (no se rompe nada).

---

## 3. Implicaciones

### 3.1 Rendimiento

- **Impacto mínimo**: Las operaciones son puramente de E/S de archivos
  (lectura de template, reemplazo de variables, escritura). No hay
  dependencies externas ni cómputo intensivo.
- Templates pequeños (< 10 KB cada uno). La lectura es instantánea.

### 3.2 Mantenibilidad

- **Positivo**: Externalizar los templates reduce la complejidad del script
  principal. Cada template es un archivo independiente y editable.
- **Positivo**: El registro automático de IDs elimina errores humanos de
  documentación.
- **Precaución**: Mantener sincronizados los templates con el esquema de
  frontmatter si este cambia.

### 3.3 Seguridad

- **Bajo riesgo**: Los templates se leen de `.workflow/templates/` y se
  procesan con `sed`. No hay ejecución de código desde los templates.
- El modo `codigo` debe advertir que el output no se ejecuta automáticamente
  (consistente con la política de "no ejecutar npm/node/prisma/jest").

### 3.4 Base de Datos

- Sin impacto. No hay cambios de esquema.

### 3.5 Compatibilidad hacia atrás

- **Completa**: El modo `artifact` es 100% aditivo.
- Ningún script o proceso existente se ve afectado.

---

## 4. Criterios de Éxito

1. `./workflow.sh artifact propuesta --subtype plan "test"` genera un archivo
   en `outbox/` con frontmatter YAML válido y contenido estructurado.
2. `./workflow.sh artifact documentacion "test"` genera un archivo con
   secciones Descripción, Contenido y Referencias.
3. `./workflow.sh artifact codigo --language bash "test"` genera un archivo
   con bloque de código y frontmatter.
4. `--dry-run` muestra el contenido por stdout sin escribir archivo.
5. `--register` añade la entrada en `docs/REGISTRO_IDS.md`.
6. El flag `--id` permite forzar un ID específico.
7. Todos los modos existentes siguen funcionando sin cambios.

---

## 5. Pruebas

- **Validación de sintaxis**: `bash -n workflow.sh` tras cada cambio.
- **Prueba unitaria**: Ejecutar cada variante de `artifact` con `--dry-run`
  y verificar que la salida contenga frontmatter YAML.
- **Prueba de integración**: Ciclo `full --auto` post-implementación.
- **Prueba de regresión**: Verificar que `propose`, `plan`, `execute`,
  `verify` y `full` sigan generando archivos correctamente.

---

## 6. Archivos Potencialmente Afectados

- `workflow.sh` — Añadir modo `artifact`, función `register_id()`, carga
  de templates externos
- `docs/REGISTRO_IDS.md` — Nuevas entradas automáticas
- `.workflow/templates/` — Nuevo directorio con 4+ templates (crear)
- `workflow/025_DEV_REFERENCE_WORKFLOW_1_0_DRAFT.md` — Nueva sección 11
  documentando el sistema de artefactos
- `.opencode/agents/workflow-agent.md` — Actualizar prompt con nuevo modo

---

_Generado por workflow-agent el 2026-05-31_
