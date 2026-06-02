---
id: 033
area: dev
type: SPEC
module: workflow
version: 1.0
status: DRAFT
author: codex
created: 2026-06-01
last_updated: 2026-06-01
dependencies:
  - workflow.sh
  - workflow/032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md
tags:
  - workflow
  - documentation
  - prompt-compiler
  - traceability
  - change-trace
summary: "Especificacion de documentacion de workflow.sh tras implementar el compilador de prompts, con seccion obligatoria de traza de cambios futuros."
keywords:
  - workflow.sh
  - documentacion
  - traza
  - cambios
  - compilador
  - ir
  - tac
  - entrenamiento
changelog:
  - version: 1.0
    date: 2026-06-01
    author: codex
    changes:
      - "Creacion inicial de la especificacion documental de workflow.sh con traza de cambios futuros"
---

# Especificacion de documentacion — `workflow.sh`

## 0. Proposito

Este documento define como debe documentarse `workflow.sh` a partir de la implementacion del compilador orientado a prompt. La documentacion debe explicar la mision del script, sus modos operativos, sus archivos de estado, la representacion intermedia canonica, la traza de tres direcciones, la memoria de entrenamiento y la politica de cambios futuros.

## 1. Mision vigente del script

`workflow.sh` actua en nombre del usuario/programador. Recibe lenguaje natural, lo transforma en artefactos auditablemente persistidos y ejecuta flujos controlados de propuesta, plan, ejecucion y verificacion.

Desde esta version, tambien puede actuar como front-end de compilador de prompts:

```text
lenguaje natural -> tokens -> AST -> IR.json -> TAC.ir -> sintesis -> aprobacion -> ejecucion supervisada
```

La fuente de verdad estructurada es `IR.json`. El codigo de tres direcciones (`TAC.ir`) es una traza explicativa, no bytecode ejecutable.

## 2. Estructura documentada

```text
workflow.sh
├── modos historicos
│   ├── propose
│   ├── plan
│   ├── execute
│   ├── verify
│   ├── listen
│   ├── status
│   ├── clean
│   ├── clean-all
│   ├── analyze
│   ├── ai
│   └── full
└── modos de compilador de prompts
    ├── compile
    ├── ir
    ├── train
    ├── profile
    ├── predict
    └── synthesize
```

## 3. Directorios y archivos

| Ruta | Funcion |
| --- | --- |
| `.workflow/state` | Estado textual del flujo. |
| `.workflow/cycle` | Contador de ciclo. |
| `.workflow/lock` | Lock de exclusion mutua. |
| `.workflow/workflow.log` | Log cronologico. |
| `.workflow/inbox/` | Entrada de instrucciones. |
| `.workflow/outbox/` | Propuestas, planes, resultados, verificaciones y sintesis. |
| `.workflow/ir/` | Tokens, AST, IR canonico, TAC y decision traces. |
| `.workflow/profile/` | Preferencias del usuario y politica de comandos. |
| `.workflow/training/` | Ejemplos aceptados, rechazados y correcciones. |
| `.workflow/templates/` | Templates futuros para sintesis. |

## 4. Modos nuevos

### `compile <texto>`

Compila una instruccion natural a:

- `cycle_N_TOKENS.txt`
- `cycle_N_AST.json`
- `cycle_N_IR.json`
- `cycle_N_TAC.ir`
- `cycle_N_DECISION_TRACE.md`

### `ir [archivo]`

Muestra un IR especifico o el ultimo IR disponible.

### `train <archivo> [estado]`

Registra un ejemplo de entrenamiento. Estados sugeridos:

- `accepted`
- `rejected`
- `correction`

### `profile`

Muestra preferencias iniciales del usuario, politica de comandos y conteo de ejemplos.

### `predict <texto>`

Compila el texto y devuelve intent, target, salida esperada, aprobacion requerida y ruta del IR.

### `synthesize [ir]`

Genera un artefacto Markdown desde el IR. Esta salida es una sintesis segura y revisable, no una ejecucion.

## 5. Politicas de seguridad documentadas

1. `execute` bloquea comandos sensibles salvo `ALLOW_SENSITIVE_COMMANDS=true`.
2. Comandos sensibles iniciales:
   - `npm`
   - `node`
   - `npx`
   - `prisma`
   - `jest`
   - `rm -rf`
   - `git reset`
   - `git checkout`
3. `verify` no ejecuta `npm run build` ni `npm test` salvo `ALLOW_NODE_VERIFY=true`.
4. Todo `push` requiere `CHANGELOG.md` actualizado.
5. La traza TAC nunca reemplaza aprobaciones humanas ni planes.

## 6. Traza de cambios realizados en esta ejecucion

| Fase | Cambio | Archivo | Resultado |
| --- | --- | --- | --- |
| Fase 1 | Se agregaron directorios y constantes para IR, perfil, entrenamiento y templates | `workflow.sh` | Implementado |
| Fase 1 | Se agrego modo `compile` | `workflow.sh` | Implementado y probado |
| Fase 1 | Se emite `IR.json`, `TAC.ir`, `AST.json`, tokens y decision trace | `.workflow/ir/` | Implementado |
| Fase 2 | Se agrego tokenizacion simple, clasificacion de intent y deteccion de target | `workflow.sh` | Implementado |
| Fase 3 | Se agrego modo `synthesize` desde IR | `workflow.sh` | Implementado y probado |
| Fase 4 | Se agrego modo `train` y archivos JSONL | `workflow.sh`, `.workflow/training/` | Implementado y probado |
| Fase 5 | Se agrego modo `profile` con preferencias y politica de comandos | `workflow.sh`, `.workflow/profile/` | Implementado y probado |
| Fase 6 | Se bloqueo ejecucion de comandos sensibles salvo permiso explicito | `workflow.sh` | Implementado |
| Fase 6 | Se bloqueo verificacion Node por defecto | `workflow.sh` | Implementado y probado |
| Fase 7 | Se valido sintaxis shell | `workflow.sh` | `sh -n workflow.sh` OK |

## 7. Traza obligatoria de cambios futuros

A partir de esta especificacion, toda modificacion significativa a `workflow.sh` debe documentarse con la siguiente estructura.

### 7.1 Registro por cambio

```markdown
### Cambio YYYY-MM-DD-N

- **Motivo:**
- **Entrada natural:**
- **IR generado:**
- **TAC generado:**
- **Archivos modificados:**
- **Politica aplicada:**
- **Comandos ejecutados:**
- **Validacion:**
- **Resultado:**
- **Rollback disponible:**
- **Decision del usuario:**
```

### 7.2 Campos obligatorios

| Campo | Descripcion |
| --- | --- |
| Motivo | Por que se hizo el cambio. |
| Entrada natural | Prompt o instruccion original. |
| IR generado | Ruta del `cycle_N_IR.json` relacionado. |
| TAC generado | Ruta del `cycle_N_TAC.ir` relacionado. |
| Archivos modificados | Lista precisa de archivos tocados. |
| Politica aplicada | Reglas de seguridad, aprobacion o bloqueo. |
| Comandos ejecutados | Solo comandos realmente ejecutados. |
| Validacion | Resultado de `sh -n`, pruebas Python, dry-run u otras verificaciones. |
| Resultado | Exito, parcial, bloqueado o fallido. |
| Rollback disponible | Como revertir el cambio si falla. |
| Decision del usuario | Aprobado, rechazado, pendiente o corregido. |

### 7.3 Ejemplo de traza

```markdown
### Cambio 2026-06-01-1

- **Motivo:** Implementar modo `compile` del compilador de prompts.
- **Entrada natural:** "Ejecuta el plan de implementacion de la especificacion 032".
- **IR generado:** `.workflow/ir/cycle_1_IR.json`
- **TAC generado:** `.workflow/ir/cycle_1_TAC.ir`
- **Archivos modificados:** `workflow.sh`
- **Politica aplicada:** No ejecutar Node automaticamente; comandos sensibles bloqueados.
- **Comandos ejecutados:** `sh -n workflow.sh`, `./workflow.sh compile ...`
- **Validacion:** Sintaxis OK, IR generado, TAC generado.
- **Resultado:** Exito.
- **Rollback disponible:** Revertir cambios de `workflow.sh`.
- **Decision del usuario:** Pendiente de revision.
```

## 8. Validaciones ejecutadas

Durante esta ejecucion se validaron:

```sh
sh -n workflow.sh
./workflow.sh compile "Analiza workflow.sh y crea una especificacion en workflow/"
./workflow.sh predict "Haz commit y push de cambios del bot"
./workflow.sh synthesize
./workflow.sh train .workflow/ir/cycle_2_IR.json accepted
./workflow.sh profile
./workflow.sh verify
```

`verify` omitio Node/npm/prisma/jest por politica de seguridad. Para permitir validaciones Node, debe usarse explicitamente:

```sh
ALLOW_NODE_VERIFY=true ./workflow.sh verify
```

## 9. Criterios de documentacion completa

La documentacion de `workflow.sh` se considera completa cuando:

1. Cada modo tiene descripcion, entrada, salida y archivos generados.
2. Cada cambio significativo tiene traza segun la seccion 7.
3. Cada decision automatica puede explicarse desde `IR.json` y `TAC.ir`.
4. Cada accion sensible tiene aprobacion, bloqueo o justificacion.
5. Cada ciclo conserva evidencia en `.workflow/`.

## 10. Referencias

- `workflow.sh`
- `workflow/032_DEV_SPEC_PROMPT_COMPILER_WORKFLOW_1_0_DRAFT.md`
- `.workflow/ir/`
- `.workflow/profile/`
- `.workflow/training/`
