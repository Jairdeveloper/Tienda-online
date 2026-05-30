---
id: 024
area: dev
type: GUIDE
module: workflow
version: 1.0
status: DRAFT
tags:
  - workflow
  - guide
  - usage
  - bash
  - quick-reference
summary: "Guía de uso rápida para workflow.sh. Cubre todos los modos, flags de entorno, ciclo completo, ejemplos y resolución de problemas comunes."
keywords:
  - workflow
  - guia
  - uso
  - ejemplos
  - bash
  - script
  - quickstart
  - referencia
changelog:
  - version: 1.0
    date: 2026-05-30
    author: system
    changes:
      - "Creación inicial: guía de uso rápida con ejemplos prácticos"
---

# Guía de Uso — `workflow.sh`

## Índice

1. [Descripción](#descripcion)
2. [Modos principales](#modos-principales)
3. [Flags de entorno](#flags-de-entorno)
4. [Ciclo completo](#ciclo-completo)
5. [Referencia rápida de modos](#referencia-rapida-de-modos)
6. [Ejemplos prácticos](#ejemplos-practicos)
7. [Solución de problemas](#solucion-de-problemas)

---

## Descripción

`workflow.sh` es un script de shell que implementa un flujo de programación
semiautónomo: recibe una instrucción, genera una propuesta, la convierte en un
plan de ejecución, ejecuta los pasos y verifica el resultado.

Filosofía: **everything is a file** — cada paso del ciclo se representa como
archivos `.md` en `.workflow/`. Las aprobaciones humanas son archivos
`.approve`/`.reject`.

---

## Modos principales

| Modo | Función |
|------|---------|
| `propose` | Genera propuesta desde una instrucción de texto |
| `plan` | Convierte propuesta en plan de ejecución con pasos |
| `execute` | Ejecuta los pasos del plan |
| `verify` | Corre `npm run build` y `npm test`, genera reporte |
| `analyze` | Escanea `src/` y genera contexto en `.workflow/context.md` |
| `ai` | Usa `opencode` + contexto del proyecto para generar propuesta |
| `full` | Ciclo completo: propose → plan → execute → verify |
| `listen` | Modo escucha: procesa archivos `.md` en `inbox/` |
| `status` | Muestra estado actual del workflow |
| `clean` | Limpia estado (sin borrar archivos generados) |
| `clean-all` | Limpia estado + archivos de inbox/outbox |

---

## Flags de entorno

| Variable | Valores | Efecto |
|----------|---------|--------|
| `DRY_RUN` | `true`/`false` | Muestra comandos sin ejecutarlos |
| `CONTINUE_ON_ERROR` | `true`/`false` | Continúa aunque un paso falle |
| `AUTO_APPROVE` | `true`/`false` | Auto-aprueba sin intervención humana |

Uso:

```bash
DRY_RUN=true ./workflow.sh execute <plan>
CONTINUE_ON_ERROR=true ./workflow.sh full --auto "mi tarea"
```

---

## Ciclo completo

### Con intervención humana

```bash
./workflow.sh full "Implementar módulo X"
# 1. Genera propuesta → pide aprobación
#    touch .workflow/outbox/cycle_N_PROPUESTA_*.md.approve
# 2. Genera plan → pide aprobación
#    touch .workflow/outbox/cycle_N_PLAN_*.md.approve
# 3. Ejecuta plan
# 4. Verifica con build + test
```

### Sin intervención (automático)

```bash
./workflow.sh full --auto "Implementar módulo X"
# Todo el ciclo se ejecuta sin pausas
```

### Paso a paso

```bash
# 1. Proponer
prop=$(./workflow.sh propose "Agregar endpoint GET /health/detailed")

# 2. Aprobar propuesta (manual o automático)
touch "${prop}.approve"

# 3. Generar plan
plan=$(./workflow.sh plan "$prop")

# 4. Aprobar plan
touch "${plan}.approve"

# 5. Ejecutar (con dry-run primero para verificar)
DRY_RUN=true ./workflow.sh execute "$plan"
./workflow.sh execute "$plan"

# 6. Verificar
./workflow.sh verify
```

---

## Referencia rápida de modos

### `propose <texto>`

Genera una propuesta estructurada en `outbox/`. Si existe
`.workflow/context.md` (generado por `analyze`), lo inyecta en la sección de
contexto del template.

```bash
./workflow.sh propose "Agrega paginación al endpoint GET /catalog/products"
# → .workflow/outbox/cycle_N_PROPUESTA_v1_0_DRAFT.md
```

### `analyze <texto>`

Escanea `src/` buscando archivos y endpoints relacionados con cada palabra
clave (mínimo 4 caracteres). El resultado se guarda en `.workflow/context.md`.

```bash
./workflow.sh analyze "auth users"
# → .workflow/context.md (contiene archivos y endpoints de auth y users)
```

Usar antes de `propose` para enriquecer la propuesta con contexto real:

```bash
./workflow.sh analyze "pagos checkout" && ./workflow.sh propose "Implementar Paypal"
```

### `ai <texto>`

Ejecuta `analyze`, construye un prompt con el contexto del proyecto y llama a
`opencode` para generar la propuesta. Si `opencode` no está disponible, fallback
al template estándar.

```bash
./workflow.sh ai "Añadir logs de auditoría a las órdenes de compra"
# → .workflow/outbox/cycle_N_PROPUESTA_v1_0_DRAFT.md (generado por IA)
```

### `plan <ruta-propuesta>`

Lee una propuesta y genera un plan de ejecución con pasos atómicos.

```bash
./workflow.sh plan .workflow/outbox/cycle_1_PROPUESTA_v1_0_DRAFT.md
# → .workflow/outbox/cycle_N_PLAN_v1_0_DRAFT.md
```

### `execute <ruta-plan>`

Ejecuta cada paso del plan. Soporta:

- **Checkpoint**: guarda el paso completado; si se interrumpe, al reanudar
  retoma desde el último checkpoint.
- **Rollback**: si un paso falla, restaura archivos no commiteados via git.
- **Dry-run**: con `DRY_RUN=true` muestra comandos sin ejecutar.

```bash
./workflow.sh execute .workflow/outbox/cycle_1_PLAN_v1_0_DRAFT.md
# → .workflow/outbox/cycle_N_RESULTADO_v1_0.md
# → .workflow/outbox/cycle_N_execution_log.md
```

### `verify`

Ejecuta `npm run build` y `npm test`, generando un reporte de verificación.

```bash
./workflow.sh verify
# → .workflow/outbox/cycle_N_VERIFICACION_v1_0.md
```

### `listen`

Modo escucha: monitorea `inbox/` en busca de nuevos archivos `.md` y los
procesa automáticamente.

```bash
./workflow.sh listen &     # Inicia en background
echo "Mi tarea" > .workflow/inbox/tarea.md   # Enviar instrucción
```

### `clean` / `clean-all`

```bash
./workflow.sh clean         # Resetea estado a idle, ciclo 0
./workflow.sh clean-all     # clean + borra inbox/ y outbox/
```

### `status`

```bash
./workflow.sh status
# Muestra: PID, estado, ciclo, archivos en inbox/outbox, últimas líneas del log
```

---

## Ejemplos prácticos

### Desarrollo diario

```bash
# 1. Analizar el código relevante primero
./workflow.sh analyze "carrito checkout"

# 2. Ciclo completo automático
./workflow.sh full --auto "Agregar validación de stock antes de añadir al carrito"
```

### Probar sin riesgos

```bash
# Dry-run del plan para ver qué comandos ejecutará
DRY_RUN=true ./workflow.sh execute .workflow/outbox/cycle_1_PLAN_v1_0_DRAFT.md

# Continuar aunque algún paso falle (útil para debugging)
CONTINUE_ON_ERROR=true ./workflow.sh execute .workflow/outbox/cycle_1_PLAN_v1_0_DRAFT.md
```

### Iterar sobre una propuesta fallida

```bash
# Si el plan se rechaza, modificar la propuesta y regenerar
# (editar .workflow/outbox/cycle_N_PROPUESTA_v1_0_DRAFT.md)
plan=$(./workflow.sh plan .workflow/outbox/cycle_N_PROPUESTA_v1_0_DRAFT.md)
touch "${plan}.approve"
./workflow.sh execute "$plan"
```

### Generar propuesta con IA

```bash
# La IA analiza el código y genera una propuesta más precisa
./workflow.sh ai "Refactorizar el módulo de pagos para soportar Stripe"
```

---

## Solución de problemas

| Problema | Causa | Solución |
|----------|-------|----------|
| `lock: proceso X en ejecución` | Ejecución concurrente | Esperar a que termine, o `rm -f .workflow/lock` si es un lock huérfano |
| `npm run build` lento en `verify` | Compilación TypeScript | Usar `--auto` solo con planes pequeños; para ciclos grandes ejecutar `verify` manualmente |
| El checkpoint no retoma | El checkpoint se limpia al terminar/fallar | Si el script se mató con SIGKILL, el checkpoint persiste y funciona |
| `opencode` no disponible en `ai` | No está en `$PATH` | Fallback automático al template estándar |
| Rollback no funciona | No es un repo git | `rollback()` detecta `git rev-parse`; si falla, omite el rollback |
| `./workflow.sh: Permission denied` | Script no ejecutable | `chmod +x workflow.sh` |

---

## Anatomía del directorio `.workflow/`

```
.workflow/
├── state             # Estado actual (idle, proposing, executing, etc.)
├── cycle             # Número de ciclo actual
├── lock              # Archivo de lock (PID)
├── listen.pid        # PID del modo listen
├── workflow.log      # Log completo de operaciones
├── checkpoint        # Último paso completado (para reanudación)
├── context.md        # Contexto generado por analyze
├── steps.tmp         # Archivo temporal de pasos (se limpia solo)
├── inbox/            # Instrucciones entrantes
│   └── cycle_N_instruction.md
└── outbox/           # Archivos generados
    ├── cycle_N_PROPUESTA_v1_0_DRAFT.md
    ├── cycle_N_PLAN_v1_0_DRAFT.md
    ├── cycle_N_RESULTADO_v1_0.md
    ├── cycle_N_VERIFICACION_v1_0.md
    └── cycle_N_execution_log.md
```

---

_Generado por workflow.sh_
