---
id: 055
area: prompts
type: PRM
module: AGENTS
version: 1.0
status: DRAFT
tags:
  - prompts
  - agents
  - orchestration
  - pipelines
  - data-flow
summary: "Plan de implementación para un agente de orquestación de flujo de datos entre agentes del ecosistema @tienda/api. Gestiona pipelines multi-agente, cachea resultados intermedios, maneja errores y provee trazabilidad."
keywords:
  - agent-orchestrator
  - pipeline
  - data-flow
  - multi-agent
  - orchestration
  - traceability
changelog:
  - date: 2026-06-05
    author: workflow-agent
    description: Creación inicial del plan de implementación
---

# Plan de Implementación — Agente de Orquestación

## 1. Resumen Ejecutivo

Se implementará un **agente de orquestación de flujo de datos entre agentes** (`agent-orchestrator`) en el ecosistema `.opencode/agents/` de `@tienda/api`.

| # | Agente | Propósito | Tools |
|---|--------|-----------|-------|
| 1 | **agent-orchestrator** | Orquestar el flujo de datos entre agentes: recibir datos de un agente, transformarlos y pasarlos a otro; gestionar pipelines multi-agente; cachear resultados intermedios; manejar errores; proveer trazabilidad | read, write, edit, grep, glob |

El agente se integrará en la tabla de jerarquía del `workflow-agent` como el **Agente 14**, y será invocado por el workflow-agent cuando el árbol de decisión detecte un pipeline multi-agente.

---

## 2. Análisis del Contexto

### 2.1 Estado Actual del Ecosistema

- **14 agentes existentes** en `.opencode/agents/` (workflow-agent, about, current-instruction, nestjs-architect, prisma-reviewer, security-reviewer, backend-reviewer, frontend-reviewer, test-writer, changelog-writer, compaction, reverse-engineer, vercel-deploy, glosario)
- El **workflow-agent** es el orquestador jefe. Su árbol de decisión (sección 9.2) actualmente maneja tareas que requieren un solo agente especialista o tareas simples.
- **No existe un mecanismo formal** para secuenciar múltiples agentes en una pipeline donde el output de uno sea input del siguiente.
- Cuando una tarea requiere múltiples agentes, el workflow-agent los consulta secuencialmente "usando el output de uno como input del siguiente" (sección 9.2, reglas de delegación), pero esto es ad-hoc y no reutilizable.
- **No hay caché de resultados intermedios** — si un pipeline se repite, todos los agentes se ejecutan de nuevo.
- **No hay trazabilidad formal** del flujo de datos entre agentes (qué agente produjo qué, cuándo, y cómo se transformó).

### 2.2 Necesidades Detectadas

1. **Pipeline multi-agente reutilizable**: Definir secuencias de agentes que se ejecuten en cadena, con transformación automática de datos entre pasos.
2. **Caché de resultados intermedios**: Almacenar outputs de agentes para evitar re-ejecuciones cuando los inputs no han cambiado.
3. **Manejo de errores configurable**: Estrategias retry/skip/abort/fallback según criticidad del pipeline.
4. **Trazabilidad**: Log estructurado de qué agente produjo qué dato, cuándo, y cómo se transformó.
5. **Integración con workflow-agent**: El workflow-agent debe poder delegar pipelines complejos al agent-orchestrator.

### 2.3 Análisis de la Demanda

Revisando el árbol de decisión actual del workflow-agent y la complejidad de las tareas típicas en `@tienda/api`, se identifican los siguientes patrones de pipeline multi-agente:

| Patrón | Descripción | Frecuencia |
|--------|-------------|------------|
| **Análisis → Documentación → Tests** | reverse-engineer analiza un módulo → generan documentación → test-writer crea tests | Alta (cada nuevo módulo) |
| **Schema → Seguridad → Tests** | prisma-reviewer propone schema → security-reviewer valida → test-writer escribe tests | Media (cambios en DB) |
| **Arquitectura → Backend → Frontend → Tests** | nestjs-architect diseña → backend-reviewer/frontend-reviewer implementan → test-writer valida | Media (nuevas features) |
| **Full pipeline: Diseño → DB → Backend → Frontend → Tests → Docs** | Pipeline completo de principio a fin | Baja (features grandes) |

---

## 3. Diseño del Agente

### 3.1 Agente de Orquestación (`agent-orchestrator`)

**Archivo destino:** `.opencode/agents/agent-orchestrator.md`

#### Propósito
Orquestar el flujo de datos entre agentes del ecosistema. Recibir datos de un agente, transformarlos al formato que necesita el siguiente, gestionar pipelines multi-agente, cachear resultados intermedios, manejar errores (reintentar, saltar o abortar), y proveer trazabilidad completa.

#### Capacidades específicas
1. **Ejecución de pipelines multi-agente**: secuencia ordenada de agentes donde el output de uno se transforma en input del siguiente
2. **Transformación de datos entre agentes**: conoce los formatos de input/output de cada agente y los transforma automáticamente
3. **Caché de resultados intermedios**: almacena en `.workflow/pipeline-cache/` con reutilización si los inputs no cambian
4. **Manejo de errores**: 4 estrategias (retry, skip, abort, fallback) configurables por pipeline o por paso
5. **Trazabilidad**: log estructurado en `.workflow/pipeline-log.json`
6. **Integración con workflow-agent**: recibe pipelines del orquestador jefe y le devuelve resultados consolidados

#### Tools asignadas
```yaml
tools:
  read: true
  write: true
  edit: true
  grep: true
  glob: true
```

- `read`: Leer outputs de agentes, archivos de caché, logs de trazabilidad
- `write`: Escribir resultados intermedios en `.workflow/pipeline-cache/`, actualizar logs
- `edit`: Modificar prompts de agentes para adaptar inputs entre pasos
- `grep`: Buscar en outputs de agentes, logs, archivos de contexto
- `glob`: Encontrar archivos de caché, outputs previos, documentación relevante

**Nota:** `bash` NO está incluida porque el agent-orchestrator no ejecuta comandos directamente; delega la ejecución a los agentes apropiados o al workflow-agent.

#### Formato de pipeline

El workflow-agent delega pipelines al agent-orchestrator usando el siguiente formato YAML:

```yaml
pipeline:
  id: "pl-YYYYMMDD-NNN"
  description: "Descripción del pipeline"
  errorStrategy: "retry"
  maxRetries: 3
  steps:
    - order: 1
      agent: "reverse-engineer"
      input: "Analiza el módulo de checkout"
      transform: "Resume el output para input del siguiente agente"
    - order: 2
      agent: "test-writer"
      # input se genera automáticamente del output del paso 1
```

#### Ejemplos de prompts
```
"Ejecuta el pipeline: [reverse-engineer → security-reviewer → changelog-writer] para documentar y auditar el modulo de pagos. Estrategia: retry(2)."

"Pipeline multi-agente para implementar descuentos: nestjs-architect → prisma-reviewer → backend-reviewer → test-writer. Abort si falla."

"Transforma el output del reverse-engineer sobre el modulo cart al formato de input del security-reviewer."

"Reporta la trazabilidad del pipeline pl-20260605-001."
```

---

## 4. Formato y Convenciones

El agente sigue el formato estándar de agente opencode (ver glosario.md):

- **mode**: `subagent`
- **model**: `opencode/big-pickle`
- **temperature**: `0.1`
- **tools**: Solo las herramientas necesarias para orquestar (sin bash)
- **Secciones**: Frontmatter YAML → Título → Contexto → Propósito → Capacidades → Tools → Ejemplos → Restricciones → Output Esperado

---

## 5. Dependencias y Riesgos

### 5.1 Dependencias
- El `workflow-agent` debe actualizar su tabla de jerarquía (sección 9.1) y árbol de decisión (sección 9.2) para incluir al agent-orchestrator
- El directorio `.workflow/pipeline-cache/` debe crearse (no existe actualmente)
- Cada agente del ecosistema debe tener formatos de input/output bien definidos para que el agent-orchestrator pueda transformar datos entre ellos
- Los agentes que no tienen tools de escritura (about, current-instruction, nestjs-architect, etc.) NO pueden ejecutar cambios — el orchestrator debe delegar al workflow-agent cuando se requieran cambios reales

### 5.2 Riesgos

| Riesgo | Mitigación |
|--------|-----------|
| **Pipelines muy largos (>10 pasos)** | Restricción: dividir en sub-pipelines |
| **Transformación incorrecta entre agentes** | Validación de formato en cada paso; logs detallados para depuración |
| **Caché obsoleta** | Timestamps en cada archivo de caché; invalidación explícita por el workflow-agent |
| **Dependencia circular entre agentes** | Validación de pipeline antes de ejecutar (detección de ciclos) |
| **Logs de trazabilidad demasiado grandes** | Rotación manual; el orchestrator no elimina logs históricos |

---

## 6. Criterios de Éxito

1. Archivo `agent-orchestrator.md` creado en `.opencode/agents/`
2. Archivos `055_PRM_AGENT_ORCHESTRATOR_1_0_DRAFT.md` y `056_EXEC_AGENT_ORCHESTRATOR_1_0_DRAFT.md` creados en `docs/ai/`
3. IDs 055 y 056 registrados en `docs/REGISTRO_IDS.md`
4. El `workflow-agent` referencia al agent-orchestrator en su tabla de jerarquía
5. El agent-orchestrator puede ser invocado con un prompt de prueba de pipeline multi-agente
6. La sintaxis de los archivos es válida (YAML frontmatter correcto)
7. CHANGELOG.md actualizado con los cambios

---

## 7. Próximos Pasos

Ver `056_EXEC_AGENT_ORCHESTRATOR_1_0_DRAFT.md` para el plan de ejecución detallado con los pasos concretos para crear el agente, registrar IDs, actualizar el workflow-agent y el CHANGELOG.

---

_Generado por workflow-agent el 2026-06-05_
