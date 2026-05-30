---
id: 020
area: dev
type: DEV
module: workflow
version: 1.0
status: DRAFT
tags:
  - workflow
  - script
  - bash
  - automation
  - testing
summary: "Documentación del script workflow.sh: algoritmo de flujo de programación con agentes IA. Implementa el ciclo instrucción → propuesta → revisión → plan → revisión → ejecución → verificación."
keywords:
  - workflow
  - script
  - agentes
  - bash
  - ciclo
  - documentacion
  - pruebas
changelog:
  - version: 1.0
    date: 2026-05-30
    author: system
    changes:
      - "Creación inicial del documento"
---

# Script Workflow — `workflow.sh`

## Descripción General

`workflow.sh` es un script de shell que implementa el algoritmo de flujo de
programación con agentes IA definido en
`algoritmos/ALGP004_FLUJO_PROGRAMACION_AGENTES_v1_0_DRAFT.md`. Sigue la
filosofía Unix "everything is a file": cada paso del ciclo escribe y lee
archivos en `.workflow/`.

El script es **recursivo**: se invoca a sí mismo para cada paso del ciclo,
permitiendo composición y autonomía.

## Arquitectura

```
workflow.sh
├── propose          →  .workflow/inbox/cycle_N_instruction.md
│                      .workflow/outbox/cycle_N_PROPUESTA_v1_0_DRAFT.md
├── await-propuesta  →  espera .approve / .reject
├── plan             →  .workflow/outbox/cycle_N_PLAN_v1_0_DRAFT.md
├── await-plan       →  espera .approve / .reject
├── execute          →  .workflow/outbox/cycle_N_RESULTADO_v1_0.md
│                      .workflow/outbox/cycle_N_execution_log.md
├── verify           →  .workflow/outbox/cycle_N_VERIFICACION_v1_0.md
├── listen           →  modo escucha continuo (inbox/)
├── status           →  reporte de estado
├── clean            →  limpia estado
├── clean-all        →  limpia estado + archivos
└── full             →  ciclo completo automático
```

### Directorio de Estado (`.workflow/`)

| Archivo/Dir | Propósito |
|-------------|-----------|
| `state` | Estado actual del flujo |
| `cycle` | Número de ciclo actual |
| `lock` | Lock de exclusión mutua |
| `workflow.log` | Log de operaciones |
| `inbox/` | Instrucciones entrantes |
| `outbox/` | Propuestas, planes, resultados, reportes |

## Modos de Operación

### `propose <instrucción>`
Pasos 1-2 del algoritmo. Escribe la instrucción a
`.workflow/inbox/cycle_N_instruction.md` y genera una propuesta en
`.workflow/outbox/cycle_N_PROPUESTA_v1_0_DRAFT.md`.

### `await-propuesta <archivo>`
Paso 3. Espera en loop hasta que el humano cree `<archivo>.approve` o
`<archivo>.reject`.

### `plan <archivo-propuesta>`
Pasos 4-5. Lee la propuesta aprobada y genera un plan de ejecución en
`.workflow/outbox/cycle_N_PLAN_v1_0_DRAFT.md`.

### `await-plan <archivo>`
Paso 6. Espera aprobación humana del plan.

### `execute <archivo-plan>`
Pasos 7-8. Extrae los pasos del plan (líneas `### Paso`) y los ejecuta.
Genera un log de ejecución y un archivo de resultado.

### `verify`
Paso 9. Ejecuta validaciones automáticas (`npm run build`, `npm test`) y
genera un reporte de verificación.

### `listen`
Modo escucha continuo. Procesa archivos `.md` depositados en `inbox/` y
ejecuta el ciclo completo para cada uno.

### `full <instrucción>`
Ciclo completo: propose → await → plan → await → execute → verify.

## Historial de Bugs y Correcciones

### Bug 1: `grep -n` contamina `step_num`

- **Síntoma:** `step_num="35:1"` en vez de `"1"` porque `grep -n` antepone
  el número de línea.
- **Causa raíz:** Línea 301 usaba `grep -n "^### Paso"` y el sed en línea 320
  no limpiaba el prefijo.
- **Fix:** Cambiar a `grep "^### Paso"` (sin `-n`) y anclar los patrones sed
  con `^`.

### Bug 2: Subshell en bucle `while read -r line`

- **Síntoma:** Las escrituras a `exec_log` dentro del while no persistían.
- **Causa raíz:** `echo "$steps" | while read -r line` crea un subshell por
  el pipe.
- **Fix:** Usar archivo temporal (`steps.tmp`) con redirección
  `while ... done < "$steps_file"`.

### Bug 3: `set -e` causa salidas prematuras

- **Síntoma:** El script abortaba en errores menores (grep sin resultados).
- **Causa raíz:** `set -e` al inicio del script.
- **Fix:** Eliminar `set -e` y reemplazar con guards `|| true` explícitos en
  comandos riesgosos.

### Bug 4: Templates con `_PENDING_`

- **Síntoma:** Propuestas y planes genéricos sin contenido útil.
- **Causa raíz:** 6 placeholders `_PENDING_` en templates de propose() y
  plan().
- **Fix:** Reemplazar con contenido estructurado: secciones con guías
  específicas para motivación, archivos afectados, dependencias, objetivos,
  estrategia, rollback y riesgos.

## Resultados de Pruebas — Ciclo 1

### Ejecución

| Paso | Resultado | Detalle |
|------|-----------|---------|
| propose | ✅ | Propuesta generada con template mejorado |
| await-propuesta | ✅ | Aprobada vía `touch .approve` |
| plan | ✅ | Plan generado con template mejorado |
| await-plan | ✅ | Aprobada vía `touch .approve` |
| execute | ✅ | `step_num="1"` (bug 1 corregido) |
| verify | ✅ | build: OK, test: OK |

### Artefactos Generados

```
.workflow/outbox/
├── cycle_1_PROPUESTA_v1_0_DRAFT.md
├── cycle_1_PLAN_v1_0_DRAFT.md
├── cycle_1_RESULTADO_v1_0.md
├── cycle_1_execution_log.md
└── cycle_1_VERIFICACION_v1_0.md
```

### Log Relevante

```
# Log línea 49 (con bug fix) vs línea 11 (sin bug fix):
#   Antes: Ejecutando Paso 35:1: 35:[Acción]
#   Después: Ejecutando Paso 1: [Acción]
```

## Observaciones

- El ciclo completo funciona correctamente con los 4 bugs corregidos.
- El paso `verify` ejecuta `npm run build` y `npm test`, que requieren
  PostgreSQL y Redis corriendo localmente.
- `npm run build` y `npm test` toman >60s, lo que puede exceder timeouts
  de herramientas externas.
- `echo -e` en el execution_log produce un artifacto `-e` en ciertos shells
  (cosmético, no funcional).

## Referencias

- `workflow.sh` — script principal (raíz del proyecto)
- `algoritmos/ALGP004_FLUJO_PROGRAMACION_AGENTES_v1_0_DRAFT.md` — algoritmo
- `algoritmos/ALGP003_CONVENCION_DOCUMENTACION_v1_0_DRAFT.md` — convención
