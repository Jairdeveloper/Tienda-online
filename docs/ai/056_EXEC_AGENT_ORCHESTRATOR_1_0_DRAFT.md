---
id: 056
area: dev
type: EXEC
module: AGENTS
version: 1.0
status: DRAFT
tags:
  - execution
  - agents
  - orchestration
  - pipelines
  - data-flow
summary: "Plan de ejecución detallado para crear el agente de orquestación de flujo de datos entre agentes (agent-orchestrator) en el ecosistema @tienda/api."
keywords:
  - execution-plan
  - agent-orchestrator
  - pipeline
  - multi-agent
  - data-flow
  - traceability
changelog:
  - date: 2026-06-05
    author: workflow-agent
    description: Creación inicial del plan de ejecución
---

# Plan de Ejecución — Agente de Orquestación

## Pre-vuelo

- [x] Estado del workflow limpio
- [x] Contexto del proyecto analizado (AGENTS.md, workflow-agent.md, glosario.md)
- [x] Plan de implementación creado (`055_PRM_AGENT_ORCHESTRATOR_1_0_DRAFT.md`)
- [x] Directorio `.opencode/agents/` existe y es accesible
- [x] Directorio `docs/ai/` existe y es accesible
- [x] IDs 055 y 56 verificados como disponibles en `docs/REGISTRO_IDS.md`
- [ ] IDs 055 y 056 registrados en `docs/REGISTRO_IDS.md`
- [ ] CHANGELOG.md actualizado

## Prerrequisitos

```bash
# No requiere npm ci ni db:generate — solo creación de archivos y edición de documentación
# El agente se crea como archivo .md en .opencode/agents/
```

---

## Pasos

### Paso 1: Crear el agente de orquestación (`agent-orchestrator.md`)

- **Archivos involucrados:** `.opencode/agents/agent-orchestrator.md`
- **Acción:** Escribir el archivo del agente con frontmatter YAML, descripción del propósito, capacidades de orquestación (pipelines multi-agente, transformación de datos, caché, manejo de errores, trazabilidad), tools (read, write, edit, grep, glob), ejemplos de uso, restricciones y formato de output esperado.
- **Comandos:**
  ```bash
  # Crear el archivo usando write tool (no bash)
  # Contenido: agente especializado en orquestar flujo de datos entre agentes
  ```
- **Verificación:**
  ```bash
  ls -la .opencode/agents/agent-orchestrator.md
  head -10 .opencode/agents/agent-orchestrator.md
  ```

### Paso 2: Crear directorio de caché de pipelines

- **Archivos involucrados:** `.workflow/pipeline-cache/`, `.workflow/pipeline-log.json`
- **Acción:** Crear el directorio de caché y el archivo de log inicial (JSON array vacío)
- **Comandos:**
  ```bash
  mkdir -p .workflow/pipeline-cache
  echo '[]' > .workflow/pipeline-log.json
  ```
- **Verificación:**
  ```bash
  ls -la .workflow/pipeline-cache/
  cat .workflow/pipeline-log.json
  ```

### Paso 3: Registrar IDs 055 y 056 en `docs/REGISTRO_IDS.md`

- **Archivos involucrados:** `docs/REGISTRO_IDS.md`
- **Acción:** Añadir entradas para los IDs 055 (PRM) y 056 (EXEC) en sus respectivas áreas
- **Comandos:**
  - Editar `docs/REGISTRO_IDS.md` para agregar:
    - En sección PRM: `| 055 | `055_PRM_AGENT_ORCHESTRATOR_1_0_DRAFT.md` | prompts | PRM | DRAFT | 2026-06-05 |`
    - En sección DEV: `| 056 | `056_EXEC_AGENT_ORCHESTRATOR_1_0_DRAFT.md` | dev | EXEC | DRAFT | 2026-06-05 |`
- **Verificación:**
  ```bash
  grep "055\|056" docs/REGISTRO_IDS.md
  ```

### Paso 4: Actualizar `workflow-agent.md` con el nuevo agente en la tabla de jerarquía

- **Archivos involucrados:** `.opencode/agents/workflow-agent.md`
- **Acción:** 
  1. Añadir Agent 14 (agent-orchestrator) a la tabla de jerarquía en la sección 9.1
  2. Actualizar el árbol de decisión en la sección 9.2 para incluir un nodo de "pipeline multi-agente" que delegue al agent-orchestrator
- **Contenido de la nueva fila en tabla 9.1:**
  ```
  | 14 | **agent-orchestrator** | Orquestación de flujo de datos entre agentes: pipelines multi-agente, caché, errores, trazabilidad | read, write, edit, grep, glob | Necesitas ejecutar una secuencia de agentes donde el output de uno es input del siguiente; pipeline complejo que requiere caché y trazabilidad; manejo de errores configurable | ★★★ |
  ```
- **Contenido del nuevo nodo en árbol 9.2 (entre el nodo de backend y frontend, o como nueva rama):**
  ```
  ├─ ¿Necesito un pipeline multi-agente (secuencia de agentes)?
  │   └─→ Consultar agent-orchestrator (define pipeline, transforma datos entre pasos, cachea resultados, maneja errores)
  ```
- **Verificación:**
  ```bash
  grep -A2 "agent-orchestrator" .opencode/agents/workflow-agent.md
  ```

### Paso 5: Actualizar `CHANGELOG.md`

- **Archivos involucrados:** `CHANGELOG.md`
- **Acción:** Añadir entrada en `[Unreleased]` → `### Added` describiendo los 5 cambios:
  1. Nuevo agente `agent-orchestrator.md`
  2. Documentos de propuesta y plan
  3. IDs 055, 056 en REGISTRO_IDS.md
  4. Directorio de caché `.workflow/pipeline-cache/`
  5. Actualización de `workflow-agent.md` con jerarquía
- **Verificación:**
  ```bash
  grep -A5 "Agent Orchestrator" CHANGELOG.md
  ```

### Paso 6: Validar sintaxis y estructura de todos los archivos

- **Archivos involucrados:** Todos los archivos creados/modificados
- **Acción:** Confirmar que el frontmatter YAML es válido, que las referencias son correctas y que los archivos siguen las convenciones del proyecto.
- **Verificación:**
  ```bash
  for f in .opencode/agents/agent-orchestrator.md docs/ai/055_PRM_AGENT_ORCHESTRATOR_1_0_DRAFT.md docs/ai/056_EXEC_AGENT_ORCHESTRATOR_1_0_DRAFT.md; do
    echo "=== $f ==="
    head -12 "$f"
    echo ""
  done
  ```

---

## Post-ejecución

- [ ] Archivo `agent-orchestrator.md` existe en `.opencode/agents/`
- [ ] Archivos `055_PRM_AGENT_ORCHESTRATOR_1_0_DRAFT.md` y `056_EXEC_AGENT_ORCHESTRATOR_1_0_DRAFT.md` existen en `docs/ai/`
- [ ] Directorio `.workflow/pipeline-cache/` existe
- [ ] Archivo `.workflow/pipeline-log.json` existe con `[]`
- [ ] `docs/REGISTRO_IDS.md` tiene los IDs 055 y 056
- [ ] `workflow-agent.md` tiene la tabla de jerarquía actualizada con Agent 14
- [ ] `workflow-agent.md` tiene el árbol de decisión actualizado con el nodo de pipelines
- [ ] `CHANGELOG.md` tiene la entrada en `[Unreleased]` → `### Added`
- [ ] Todos los frontmatters YAML son válidos
- [ ] El agent-orchestrator puede ser invocado por el workflow-agent

## Rollback

| Paso | Reversión |
|------|-----------|
| 1 | `rm -f .opencode/agents/agent-orchestrator.md` |
| 2 | `rm -rf .workflow/pipeline-cache/` && `rm -f .workflow/pipeline-log.json` |
| 3 | Revertir cambios en `docs/REGISTRO_IDS.md` (editar manual) |
| 4 | Revertir cambios en `workflow-agent.md` (editar manual) |
| 5 | Revertir cambios en `CHANGELOG.md` (editar manual) |

**Regla general:** Si algún paso falla, detener y notificar. El paso 1 y 2 son independientes (pueden ejecutarse en paralelo). Los pasos 3-5 dependen de 1.

## Riesgos

- **Riesgo de ID duplicado:** Ya verificado — IDs 055 y 056 están disponibles (más alto: 054).
- **Riesgo de frontmatter inválido:** Verificar que las 3 líneas `---` delimitan correctamente el YAML en cada archivo.
- **Riesgo de tabla desactualizada:** workflow-agent.md debe reflejar exactamente la nueva entrada del agent-orchestrator y el nodo en el árbol de decisión.
- **Riesgo de pipeline-cache sin gitignore:** Añadir `.workflow/pipeline-cache/` y `.workflow/pipeline-log.json` a `.gitignore` si contienen datos temporales.

---

_Generado por workflow-agent el 2026-06-05_
