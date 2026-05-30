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