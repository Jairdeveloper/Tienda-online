---
id: alg_p_004
area: algorithms
type: ALGP
module: system
version: 1.0
status: DRAFT
author: system
created: 2026-05-30
last_updated: 2026-05-30
tags:
  - algorithm
  - workflow
  - agent-driven
  - human-in-the-loop
  - convention
summary: "Algoritmo formal de 9 pasos para desarrollo asistido por agentes IA con revisión humana en cada fase. Define el ciclo propuesta → plan → ejecución."
keywords:
  - flujo
  - programacion
  - agentes
  - algoritmo
  - human-in-the-loop
  - propuesta
  - plan ejecucion
dependencies:
  - alg_p_003
changelog:
  - version: 1.0
    date: 2026-05-30
    author: system
    changes:
      - "Migración a formato ALGP con ID alg_p_004 y vocabulario controlado de tags"
---

# Algoritmo: Flujo de Programación con Agentes IA

## Definición Formal

| Elemento | Descripción |
|----------|-------------|
| **INPUT** | `I` = Instrucción del programador a opencode sobre una tarea a realizar |
| **OUTPUT** | `O` = Código, archivos o documentación producida y validada por humano |
| **PRECONDICIÓN** | opencode está operativo en el proyecto. El programador conoce el objetivo general. |
| **POSTCONDICIÓN** | El cambio está implementado en el sistema de archivos, verificado por opencode, y aceptado por el programador. |
| **INVARIANTE** | Nunca se ejecuta código ni se aplican cambios sin aprobación humana explícita. |
| **DOMINIO** | Todo archivo modificable dentro del proyecto: `src/`, `docs/`, `prisma/`, `test/`, `algoritmos/`, `.opencode/`, `scripts/`, configuraciones. |

---

## Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────────────┐
│                        INICIO                                   │
│  Programador tiene una tarea/idea/requerimiento                 │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  PASO 1: SOLICITUD       │
              │  Programador escribe     │
              │  instrucción a opencode  │
              │  para crear PROPUESTA    │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  PASO 2: ENTREGA         │
              │  opencode genera         │
              │  archivo PROPUESTA.md    │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  PASO 3: REVISIÓN HUMANA │◄────┐
              │  Programador LEE y       │     │
              │  ACEPTA / RECHAZA /      │     │
              │  MODIFICA la propuesta   │     │
              └────────────┬─────────────┘     │
                           │                    │
                     ┌─────┴─────┐             │
                     │           │             │
                  RECHAZA     ACEPTA           │
                     │           │             │
                     ▼           ▼             │
              ┌──────────┐  ┌──────────────────┴──┐
              │  FIN     │  │  PASO 4: INSTRUCCIÓN │
              │ (tarea   │  │  Programador pide    │
              │  muerta) │  │  PLAN DE EJECUCIÓN   │
              └──────────┘  └─────────┬────────────┘
                                      │
                                      ▼
                     ┌──────────────────────────┐
                     │  PASO 5: ENTREGA         │
                     │  opencode genera         │
                     │  archivo PLAN.md         │
                     └────────────┬─────────────┘
                                  │
                                  ▼
                     ┌──────────────────────────┐
                     │  PASO 6: REVISIÓN HUMANA │◄────┐
                     │  Programador LEE y       │     │
                     │  ACEPTA / RECHAZA /      │     │
                     │  MODIFICA el plan        │     │
                     └────────────┬─────────────┘     │
                                  │                    │
                            ┌─────┴─────┐             │
                            │           │             │
                         RECHAZA     ACEPTA           │
                            │           │             │
                            ▼           ▼             │
                     ┌──────────┐  ┌──────────────────┴──┐
                     │  FIN     │  │  PASO 7: INSTRUCCIÓN │
                     │ (tarea   │  │  Programador dice    │
                     │  muerta) │  │  "ejecuta el plan"   │
                     └──────────┘  └─────────┬────────────┘
                                              │
                                              ▼
                              ┌──────────────────────────┐
                              │  PASO 8: EJECUCIÓN       │
                              │  opencode sigue las      │
                              │  instrucciones del plan  │
                              │  y escribe/modifica      │
                              │  archivos del proyecto   │
                              └────────────┬─────────────┘
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │  PASO 9: VERIFICACIÓN    │
                              │  opencode ejecuta        │
                              │  validaciones (test,     │
                              │  lint, build, typecheck) │
                              │  e informa resultados    │
                              └────────────┬─────────────┘
                                            │
                                            ▼
                              ┌──────────────────────────┐
                              │       FINAL              │
                              │  Cambio implementado     │
                              │  y verificado.           │
                              │  Programador confirma    │
                              │  o itera desde paso 1.   │
                              └──────────────────────────┘
```

---

## Pasos Detallados

### Paso 1: Solicitud de Propuesta

**Actor**: Programador → opencode  
**Acción**: El programador escribe una instrucción clara pidiendo una propuesta en formato `.md`.

**Formato de instrucción**:

```
[Crear/Generar/Escribir] un archivo .md con una propuesta para [describir tarea].
La propuesta debe incluir:
- [requisito 1]
- [requisito 2]
- [requisito n]
Formato: seguir la convención de documentación del proyecto.
```

**Ejemplo real**:
> "Creemos una especificación para crear una convención de programación para este proyecto. Crea un archivo .md con un plan propuesta para dicha convención, créalo en la siguiente ruta: /home/john/tienda-online/Tienda-online-agnostica/algoritmos, incluye convención en el archivo creado."

**Verificación**: El programador confirmó que la instrucción fue enviada y opencode la recibió.

---

### Paso 2: Entrega de Propuesta

**Actor**: opencode → Programador  
**Acción**: opencode genera un archivo `.md` con la propuesta y lo escribe en el sistema de archivos.

**Reglas para opencode**:
- El archivo DEBE seguir la convención de nombres del proyecto (según corresponda a su área: `docs/`, `algoritmos/`, etc.)
- El archivo DEBE incluir frontmatter YAML
- El archivo DEBE ser auto-contenido (puede ser entendido sin contexto adicional)
- El archivo DEBE incluir secciones claras con `##`
- opencode DEBE informar la ruta exacta del archivo creado

**Verificación**: El archivo existe en el sistema de archivos. El programador puede leerlo.

---

### Paso 3: Revisión Humana de Propuesta

**Actor**: Programador  
**Acción**: El programador LEE la propuesta completa y decide:

| Decisión | Acción | Siguiente Paso |
|----------|--------|----------------|
| **ACEPTAR** | No hace cambios, pasa al paso 4 | → Paso 4 |
| **MODIFICAR** | Edita el archivo `.md` manualmente o da instrucciones a opencode para modificarlo | → Vuelve a paso 2 (iteración) |
| **RECHAZAR** | Descarta la propuesta. Comunica la razón. | → FIN |

**Reglas**:
- Esta es una decisión humana exclusivamente. opencode NO decide aceptar o rechazar.
- Si se modifica, opencode debe actualizar `version` y `last_updated` en el frontmatter.
- Si se rechaza, el archivo puede eliminarse o marcarse como `status: DEPRECATED`.

**Verificación**: El programador comunica explícitamente su decisión.

---

### Paso 4: Solicitud de Plan de Ejecución

**Actor**: Programador → opencode  
**Acción**: El programador envía una instrucción para crear un PLAN DE EJECUCIÓN basado en la propuesta aceptada.

**Formato de instrucción**:

```
He leído y aceptado la propuesta en [ruta/al/archivo.md].
Crea un plan de ejecución detallado como archivo .md en [ruta/destino].
El plan debe desglosar la propuesta en pasos accionables y secuenciales.
Cada paso debe incluir: acción concreta, archivos a modificar, comandos a ejecutar.
```

**Ejemplo real**:
> "Lee la propuesta de convención en [ruta] y crea un plan de ejecución paso a paso para implementar todos los cambios necesarios. Incluye migración de archivos existentes, validaciones, y scripts necesarios."

**Verificación**: La instrucción fue enviada y opencode la recibió.

---

### Paso 5: Entrega de Plan de Ejecución

**Actor**: opencode → Programador  
**Acción**: opencode lee la propuesta (archivo `.md` del paso 2) y genera un plan de ejecución en un nuevo archivo `.md`.

**Reglas para opencode**:
- El plan DEBE desglosar la propuesta en pasos atómicos (cada paso = una acción concreta)
- Cada paso DEBE incluir:
  - **Archivos involucrados**: ruta exacta de cada archivo a crear/modificar/eliminar
  - **Acción**: qué hacer (crear, modificar, renombrar, eliminar)
  - **Contenido/detalle**: qué escribir o qué cambiar
  - **Comandos**: si aplica, qué comando ejecutar (npm, mv, sed, etc.)
  - **Verificación**: cómo confirmar que el paso se completó correctamente
- El plan DEBE ser secuencial (paso 1, paso 2, ..., paso N)
- El plan DEBE incluir una sección de "PRE-VUELO" (prerrequisitos: dependencias, branch, etc.)
- El plan DEBE incluir una sección de "VALIDACIÓN FINAL" (tests, lint, build)
- El plan PUEDE incluir ramas condicionales si aplica

**Verificación**: El archivo de plan existe en el sistema de archivos.

---

### Paso 6: Revisión Humana del Plan de Ejecución

**Actor**: Programador  
**Acción**: El programador LEE el plan de ejecución completo y decide:

| Decisión | Acción | Siguiente Paso |
|----------|--------|----------------|
| **ACEPTAR** | Comunica a opencode "ejecuta el plan" | → Paso 8 |
| **MODIFICAR** | Edita el plan manualmente o pide cambios | → Vuelve a paso 5 |
| **RECHAZAR** | Descarta el plan. Archivo marcado como DEPRECATED o eliminado. | → FIN, o vuelve a paso 1 |

**Reglas**:
- Es responsabilidad del programador verificar que el plan NO incluya acciones destructivas no deseadas.
- Si el plan incluye pasos que el programador no entiende, DEBE pedir aclaración antes de aceptar.
- El plan aceptado se convierte en el contrato de ejecución.

**Verificación**: El programador dice explícitamente "ejecuta el plan" o equivalente.

---

### Paso 7: Instrucción de Ejecución

**Actor**: Programador → opencode  
**Acción**: El programador da la orden de ejecutar el plan aceptado.

**Formato de instrucción** (textual):

```
Ejecuta el plan descrito en [ruta/del/plan.md].
Sigue cada paso en orden. Confirma cuando cada paso se complete.
Si encuentras errores, detente y avísame.
```

**Regla**: La instrucción DEBE ser explícita. "Sigue el plan" o "ejecuta el plan" son frases válidas. Suposiciones implícitas NO son válidas.

**Verificación**: opencode confirma que va a ejecutar el plan.

---

### Paso 8: Ejecución del Plan

**Actor**: opencode  
**Acción**: opencode ejecuta cada paso del plan secuencialmente.

**Reglas para opencode**:
- **NUNCA** saltar pasos. Cada paso debe ejecutarse en orden.
- **NUNCA** modificar archivos que no están listados en el plan.
- **NUNCA** ejecutar comandos destructivos (`rm -rf`, `drop database`, etc.) sin confirmación extra.
- **Después de cada paso**: confirmar que se completó. Si el paso incluía verificación, ejecutarla y reportar resultado.
- **Si un paso falla**:
  1. DETENER la ejecución inmediatamente.
  2. Reportar el error al programador con: qué paso falló, por qué, qué se intentó.
  3. Esperar instrucciones (reintentar, omitir, modificar plan, abortar).
- **Si un paso produce un resultado inesperado** (ej: el diff es mucho mayor de lo esperado): DETENER y reportar.

**Verificación por paso**: opencode reporta "Paso N completado: [acción]" con evidencia (diff, output de comando, etc.).

---

### Paso 9: Validación y Cierre

**Actor**: opencode → Programador  
**Acción**: Una vez ejecutados todos los pasos, opencode ejecuta la validación final.

**Validaciones típicas** (según el proyecto):

```bash
# Verificar que el proyecto compila
npm run build

# Verificar que los tests pasan
npm test

# Verificar tipos
npx tsc --noEmit

# Verificar lint (si existe)
npm run lint
```

**Reporte final**: opencode entrega un resumen estructurado:

```
## RESUMEN DE EJECUCIÓN

Plan: [ruta/del/plan.md]
Estado: COMPLETADO / COMPLETADO CON ERRORES / ABORTADO

### Pasos ejecutados:
- [N] [acción] → ✅ OK
- [N] [acción] → ✅ OK
- [N] [acción] → ❌ FALLÓ

### Archivos creados:
- ruta/archivo1.md
- ruta/archivo2.ts

### Archivos modificados:
- ruta/archivo3.ts

### Validaciones:
- build → ✅ OK
- test → ✅ OK (89 suites, 89 passed)
- typecheck → ✅ OK

### Pendiente:
- [ ] El programador debe confirmar visualmente los cambios
```

**El programador** como paso final:
1. Confirma que los cambios son correctos (puede inspeccionar visualmente los archivos)
2. Si está satisfecho → FIN del ciclo
3. Si no está satisfecho → vuelve a paso 1 con feedback

---

## Convención de Archivos del Ciclo

Cada ciclo de programación produce hasta 2 archivos de especificación:

```
algoritmos/
├── [ID]_PROPUESTA_[NOMBRE]_v[VERSION]_[ESTADO].md    # PASO 2
└── [ID]_PLAN_[NOMBRE]_v[VERSION]_[ESTADO].md           # PASO 5
```

### Propuesta (`*_PROPUESTA_*.md`)

Define el QUÉ y el PORQUÉ. Contenido:
- Contexto / problema a resolver
- Análisis de alternativas (si aplica)
- Propuesta de solución
- Implicaciones y riesgos
- Formato libre pero con frontmatter obligatorio

### Plan de Ejecución (`*_PLAN_*.md`)

Define el CÓMO, CUÁNDO y CON QUÉ. Contenido:

| Sección | Descripción |
|---------|-------------|
| **Pre-vuelo** | Prerrequisitos: branch, dependencias, variables de entorno |
| **Prerrequisitos** | Comandos a ejecutar antes de comenzar (npm install, prisma generate, etc.) |
| **Pasos** | Lista numerada de pasos atómicos con acción, archivo, comando y verificación |
| **Post-ejecución** | Validaciones finales (build, test, lint, typecheck) |
| **Rollback** | Cómo revertir cada paso si algo sale mal |
| **Riesgos** | Puntos críticos donde la ejecución podría fallar |

---

## Variantes del Algoritmo

### Ciclo Corto (3 pasos)

Para tareas triviales donde no se necesita propuesta ni plan formales:

```
PASO 1: Programador instruye directamente la tarea
PASO 2: opencode ejecuta
PASO 3: opencode valida y reporta
```

**Disparador**: Instrucción sin palabras clave "propuesta" o "plan".

### Ciclo Simple (5 pasos)

Para tareas donde la solución es conocida pero se quiere un plan antes de ejecutar:

```
PASO 1: Programador pide plan de ejecución directamente
PASO 4: Programador recibe plan
PASO 6: Programador revisa y acepta
PASO 8: opencode ejecuta
PASO 9: opencode valida y reporta
```

**Disparador**: Instrucción incluye "crea un plan de ejecución" pero no "propuesta".

### Ciclo Completo (9 pasos — el principal)

Para tareas complejas, nuevas características, cambios arquitectónicos, o cuando la solución no está clara:

```
PASO 1 → PASO 2 → PASO 3 → PASO 4 → PASO 5 → PASO 6 → PASO 7 → PASO 8 → PASO 9
```

**Disparador**: Instrucción incluye "propuesta" + "plan de ejecución".

---

## Glosario del Flujo

| Término | Definición |
|---------|------------|
| **Programador** | Humano que define objetivos, revisa propuestas y aprueba ejecución. Toma todas las decisiones finales. |
| **opencode** | Agente IA que ejecuta instrucciones, genera documentos, escribe código y valida resultados. No toma decisiones autónomas. |
| **Propuesta** | Archivo `.md` que explora un problema y sugiere una solución. Define el QUÉ. |
| **Plan de Ejecución** | Archivo `.md` que desglosa la implementación en pasos atómicos. Define el CÓMO. |
| **Ciclo** | Una iteración completa del algoritmo. Puede abortarse en cualquier paso de revisión. |
| **Human-in-the-loop** | Principio de que un humano revisa y aprueba cada fase antes de continuar. |
| **Pre-vuelo** | Lista de condiciones que deben cumplirse antes de comenzar la ejecución. |
| **Rollback** | Conjunto de acciones para revertir cambios si la ejecución falla. |

---

## Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2026-05-30 | Creación inicial del algoritmo de 9 pasos |


