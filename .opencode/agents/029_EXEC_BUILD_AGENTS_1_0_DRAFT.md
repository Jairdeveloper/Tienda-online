---
id: 029
area: dev
type: EXEC
module: AGENTS
version: 1.0
status: DRAFT
tags:
  - execution
  - agents
  - reverse-engineering
  - vercel
  - deploy
summary: "Plan de ejecución detallado para crear los 2 sub-agentes de opencode: reverse-engineer (ingeniería inversa) y vercel-deploy (experto en deploy NestJS en Vercel)."
keywords:
  - execution-plan
  - reverse-engineering
  - vercel-deploy
  - agent-creation
changelog:
  - date: 2026-05-31
    author: workflow-agent
    description: Creación inicial del plan de ejecución
---

# Plan de Ejecución — Construcción de 2 Sub-Agentes Opencode

## Pre-vuelo

- [x] Estado del workflow limpio (`./workflow.sh clean`)
- [x] Contexto del proyecto analizado (`./workflow.sh analyze`)
- [x] Plan de implementación creado (`028_PRM_BUILD_AGENTS_1_0_DRAFT.md`)
- [x] Directorio `.opencode/agents/` existe y es accesible
- [x] IDs 028 y 29 registrados en `docs/REGISTRO_IDS.md` (pendiente)

## Prerrequisitos

```bash
# No requiere npm ci ni db:generate — solo creación de archivos
# Los agentes se crean como archivos .md en .opencode/agents/
```

---

## Pasos

### Paso 1: Crear agente de ingeniería inversa (`reverse-engineer.md`)

- **Archivos involucrados:** `.opencode/agents/reverse-engineer.md`
- **Acción:** Escribir el archivo del agente con frontmatter YAML, descripción del propósito, capacidades, tools, ejemplos de uso y restricciones.
- **Comandos:**
  ```bash
  # Crear el archivo usando write tool (no bash)
  # Contenido: agente especializado en analizar codigo fuente NestJS/TypeScript 
  # y producir documentacion en lenguaje natural
  ```
- **Verificación:** 
  ```bash
  # Verificar que el archivo existe
  ls -la .opencode/agents/reverse-engineer.md
  # Verificar que tiene frontmatter YAML valido
  head -10 .opencode/agents/reverse-engineer.md
  ```

### Paso 2: Crear agente experto en deploy Vercel (`vercel-deploy.md`)

- **Archivos involucrados:** `.opencode/agents/vercel-deploy.md`
- **Acción:** Escribir el archivo del agente con frontmatter YAML, descripción, capacidades de investigación (webfetch/websearch), tools, ejemplos de uso y restricciones.
- **Comandos:**
  ```bash
  # Crear el archivo usando write tool (no bash)
  # Contenido: agente especializado en investigar y guiar deploys NestJS en Vercel
  ```
- **Verificación:**
  ```bash
  # Verificar que el archivo existe
  ls -la .opencode/agents/vercel-deploy.md
  # Verificar que tiene frontmatter YAML valido
  head -10 .opencode/agents/vercel-deploy.md
  ```

### Paso 3: Actualizar `workflow-agent.md` con los nuevos agentes en la tabla de jerarquía

- **Archivos involucrados:** `.opencode/agents/workflow-agent.md`
- **Acción:** Añadir Agent 12 (reverse-engineer) y Agent 13 (vercel-deploy) a la tabla de jerarquía en la sección 8.1
- **Comandos:**
  ```bash
  # Editar workflow-agent.md para agregar entradas de los nuevos agentes
  ```
- **Verificación:**
  ```bash
  # Verificar que los nuevos agentes aparecen en la tabla
  grep -A2 "reverse-engineer\|vercel-deploy" .opencode/agents/workflow-agent.md
  ```

### Paso 4: Actualizar `docs/REGISTRO_IDS.md` con los IDs 028 y 029

- **Archivos involucrados:** `docs/REGISTRO_IDS.md`
- **Acción:** Añadir entradas para los IDs 028 y 029 en sus respectivas áreas (PRM y DEV)
- **Comandos:**
  ```bash
  # Editar REGISTRO_IDS.md para agregar las nuevas entradas
  ```
- **Verificación:**
  ```bash
  # Verificar que los IDs 028 y 029 estan registrados
  grep "028\|029" docs/REGISTRO_IDS.md
  ```

### Paso 5: Validar sintaxis y estructura de todos los archivos

- **Archivos involucrados:** Todos los archivos creados/modificados
- **Acción:** Confirmar que el frontmatter YAML es válido, que las referencias son correctas y que los archivos siguen las convenciones del proyecto.
- **Verificación:**
  ```bash
  # Verificar que los frontmatters son correctos (inspeccion visual)
  for f in .opencode/agents/reverse-engineer.md .opencode/agents/vercel-deploy.md; do
    echo "=== $f ==="
    head -12 "$f"
    echo ""
  done
  ```

---

## Post-ejecución

- [ ] Los 2 archivos de agente existen en `.opencode/agents/`
- [ ] `workflow-agent.md` tiene la tabla actualizada
- [ ] `docs/REGISTRO_IDS.md` tiene los IDs 028 y 029
- [ ] Todos los frontmatters YAML son válidos
- [ ] `reverse-engineer.md` puede leer código y generar documentación
- [ ] `vercel-deploy.md` puede investigar en vercel.com/docs

## Rollback

| Paso | Reversión |
|------|-----------|
| 1 | `rm -f .opencode/agents/reverse-engineer.md` |
| 2 | `rm -f .opencode/agents/vercel-deploy.md` |
| 3 | Revertir cambios en `workflow-agent.md` (editar manual) |
| 4 | Revertir cambios en `docs/REGISTRO_IDS.md` (editar manual) |

**Regla general:** Si algún paso falla, detener y notificar. Los pasos 1-2 son independientes (pueden ejecutarse en cualquier orden). Los pasos 3-4 dependen de 1-2.

## Riesgos

- **Riesgo de ID duplicado:** Verificar REGISTRO_IDS.md antes de asignar IDs 028/029
- **Riesgo de frontmatter inválido:** Verificar que las 3 líneas `---` delimitan correctamente el YAML
- **Riesgo de tabla desactualizada:** workflow-agent.md debe reflejar exactamente los nuevos agentes

---
_Generado por workflow-agent el 2026-05-31_
