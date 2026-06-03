Key elements de un algoritmo:
1. Inputs — what do we start with?
2. Outputs — what's the desired result?
3. Steps — ordered, finite, deterministic operations
4. Decision points — branches (if/else, switch)
5. Preconditions — what must be true before each step
6. Postconditions — what's true after each step
7. Termination — the algorithm ends with a production system

I already read the production plan in the previous turn, so I have the content. Now I need to create an algorithmic version of it — structured as a finite, ordered set of operations with:
- Formal definition (INPUT, OUTPUT, PRECONDITIONS, POSTCONDITIONS)
- Decision points with branches
- Sequential steps with verification gates
- Error handling and rollback
- Termination condition

Escribe un script tipo sistema para siguiendo el siguiendo algoritmo, El script debe ser generado con la filosofia de UNIX que dice "Everithing is a file", El script en cuestion debe ser creado para extencion recursiva y/o programacion recursiva utilizando la recursividad con la proyeccion de que se invoque a si mismo..., 
# algoritmo:

## Existen dos tipos de instrucciones/solicitudes:
1. Directamente en la TUI
2. Mediante archivos .md

## Existen dos tipos de actores:

1. Sistema/opencode
2. Usuario/programador

## flujo de datos

1. actor Usuario: escribe le da instrucciones, 
2. autor sistema debe diferenciar entre las dos instrucciones y tener la capacidad de entender la solicitud del usuario leyendo/analizando/escaneando la instruccion independientemente del formato en el que venga
3. actor Usuario: verifica que la instruccion fue eneviada.
4. actor Usuario: verifica que la instruccion fue recibida
5. actor Sistema: debe estar en escucha
6. actor Sistema: Verifica que Sistema esta funcionando
7. Actor Sistema: Lee/analiza/escanea su base de instrucciones
8. Actor Sistema: Opencode genera .md o cualquier archivo de acuerdo a las instrucciones dadas(genera "Plan propuesta") baso especificacion del proyecto
9. actor Usuario : Verifica que el/los archivos existen en el sistema de archivos.
10. actor Sistema: Verifica que el/los archivos existen en el sistema de archivos.
11. Actor Usuario: Acepta/Modifica/Rechaza archivos. 
 11.1 Acepta: No hace cambio, pasa a sig
uiente instruccion -> Pasa a siguiente instruccion.
 11.2 Modifica: Edita el archivo el/los archivo manualmente -> Siguiente paso (itera)
12. Actor Usuario: Se indica explicitamente realizar acciones. 
13. actor Agente : Recibe respuesta por parte del usuario. -> Realiza acciones
14. itera sobre el paso 1 pero esta vez 

Lee especificacion /home/john/tienda-online/Tienda-online-agnostica/algoritmos/ALGP004_FLUJO_PROGRAMACION_AGENTES_v1_0_DRAFT.md especialmente la seccion ## Pasos Detallados para que tengas contexto de el dominio del script y de la convencion que se quiere lograr con el script

Crear un frontend web y un bot de soporte para @tienda/api. El frontend debe ser una SPA React que consuma los endpoints del backend. El bot de soporte debe ser un agente IA RAG que use la base de conocimiento en docs/ para responder preguntas

Key things to preserve:
1. All modes: propose, plan, execute, verify, full, analyze, ai, train (naming, example, list, show), listen, status, clean, clean-all, help
2. All helper functions: init, log, output, get_state, set_state, get_cycle, inc_cycle, lock, sanitize_slug, make_filename, set_naming_pattern, get_naming_pattern
3. All environment flags: DRY_RUN, CONTINUE_ON_ERROR, AUTO_APPROVE
4. File-based state machine
5. Recursive calling pattern
6. Training system
7. Rollback capability
8. Listen mode
9. AI proposal generation
Let me write the complete rewrite now.
I'll organize it as:
1. Header
2. Constants
3. Environment flags
4. Utility functions (log, output, init)
5. State management (get_state, set_state, get_cycle, inc_cycle)
6. Lock management
7. Naming/file helpers (sanitize_slug, get_naming_pattern, make_filename, set_naming_pattern)
8. Training functions (train_example, train_list, train_show, train)
9. Core workflow functions (propose, await_propuesta_approval, plan, await_plan_approval, execute, verify, rollback)
10. Analysis/AI functions (analyze, ai_propose)
11. Listening mode
12. Status and cleanup
13. Full cycle
14. Help
15. Main dispatch

Flujo completo ideal (compilador):
Usuario: "Crea un módulo de pagos en NestJS"
  ↓
workflow.sh compile "Crea un módulo de pagos..."
  ↓ LEX: tokeniza → [ACTION(crea), TARGET(modulo), DOMAIN(pagos), TECH(NestJS)]
  ↓ PARSE: construye AST
  ↓ SEMANTIC: resuelve con perfil + tabla de símbolos
  ↓ SCORE: busca acciones similares en training
  ↓ IR.json: representación intermedia canónica
  ↓ TRACE: three-address code (trazabilidad)
  ↓ SYNTHESIS: genera propuesta, plan, o ejecuta directamente
  ↓ (opcional) BOT: responde por chat

  entrenar al bot con opciones comandos modos para que le responda a workflow.sh

  Arch Linux workflow. This is a meta-level concept - workflow.sh as the OS kernel/framework for the user's interactions with Arch Linux.