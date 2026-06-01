---
id: 001
area: CHATBOT
type: SPEC
module: ELIZA
version: v1.0
status: ACTIVE
author: codex
last_updated: 2026-05-31
dependencies:
  - README.md
  - ALGORITMO_ELIZA.md
  - eliza.py
  - doctor.txt
  - test_eliza.py
  - p36-weizenabaum.pdf
  - LICENSE
tags:
  - chatbot
  - eliza
  - rule-based
  - pattern-matching
  - production-system
summary: "Especificacion IA-ready del bot ELIZA: entradas, salidas, pasos deterministas, decisiones, precondiciones, postcondiciones y terminacion como sistema de produccion basado en reglas."
keywords:
  - eliza
  - decomposition
  - reassembly
  - keywords
  - memory
  - deterministic-algorithm
---

# Especificacion del bot ELIZA

## 0. Intencion y alcance

Esta especificacion reconstruye el algoritmo del bot ELIZA implementado en `eliza.py`, alimentado por el guion `doctor.txt`, validado por `test_eliza.py` y contextualizado por el articulo local `p36-weizenabaum.pdf`.

El bot es un sistema conversacional basado en reglas: recibe texto del usuario, detecta palabras clave, aplica reglas de descomposicion, genera una respuesta por re-ensamblaje y mantiene una memoria temporal de respuestas diferidas.

## 1. Fuentes analizadas

- `README.md`: uso interactivo y como libreria.
- `eliza.py`: implementacion ejecutable del algoritmo.
- `doctor.txt`: base de reglas del doctor script.
- `test_eliza.py`: comportamiento esperado de matching, sinonimos, respuestas y cierre.
- `ALGORITMO_ELIZA.md`: analisis previo de ingenieria inversa.
- `p36-weizenabaum.pdf`: referencia original sobre palabras clave, reglas de descomposicion y reglas de re-ensamblaje.
- `LICENSE`: licencia MIT del codigo.

Resumen del guion `doctor.txt`:

- 36 claves (`key`).
- 60 reglas de descomposicion (`decomp`).
- 225 reglas de re-ensamblaje (`reasmb`).
- 16 sustituciones previas (`pre`).
- 9 sustituciones posteriores (`post`).
- 8 grupos de sinonimos (`synon`).

## 2. Modelo del sistema

### Entidades principales

```text
ElizaState = {
  initials: [texto],
  finals: [texto],
  quits: [texto],
  pres: {token -> [token]},
  posts: {token -> [token]},
  synons: {raiz -> [token]},
  keys: {token -> Key},
  memory: [[token]],
  rng_state: estado_del_selector
}

Key = {
  word: token,
  weight: entero,
  decomps: [Decomp]
}

Decomp = {
  parts: [token | "*" | "@raiz"],
  save: boolean,
  reasmbs: [[token | "(n)" | "goto key"]],
  next_reasmb_index: entero
}
```

### Determinismo

El algoritmo de respuesta es determinista si se considera el estado completo como entrada: reglas cargadas, memoria, indices `next_reasmb_index` y estado del selector pseudoaleatorio. En la implementacion actual hay seleccion aleatoria en `initial()`, `final()` y recuperacion desde `memory`; para produccion reproducible se debe fijar una semilla o reemplazar esas selecciones por una politica determinista.

## 3. Inputs — what do we start with?

### Entradas de configuracion

1. Archivo de reglas `doctor.txt`.
2. Conjunto de etiquetas soportadas:
   - `initial`
   - `final`
   - `quit`
   - `pre`
   - `post`
   - `synon`
   - `key`
   - `decomp`
   - `reasmb`
3. Estado inicial vacio de `Eliza`.

### Entradas de conversacion

1. Texto del usuario en cada turno.
2. Estado conversacional acumulado:
   - memoria `memory`;
   - indice de siguiente re-ensamblaje por cada `Decomp`;
   - estado del selector pseudoaleatorio si se usa aleatoriedad.

### Entradas de operacion

1. Modo interactivo: `python eliza.py`.
2. Modo libreria: `Eliza().load("doctor.txt")`, `initial()`, `respond(text)`, `final()`.

## 4. Outputs — what's the desired result?

### Salidas funcionales

1. `initial()`: saludo inicial.
2. `respond(text)`: respuesta textual del bot.
3. `respond(text) == None`: senal de cierre cuando el texto coincide con una palabra de salida.
4. `final()`: despedida final.

### Salidas internas

1. Actualizacion de `next_reasmb_index` para rotar respuestas.
2. Insercion de respuestas diferidas en `memory` cuando una descomposicion tiene prefijo `$`.
3. Extraccion de una respuesta desde `memory` cuando no hay clave aplicable.

### Resultado deseado

Una conversacion estilo terapeuta rogeriano, basada en reglas, donde cada respuesta proviene de una plantilla de re-ensamblaje asociada a la clave mas prioritaria que pueda descomponer el texto de entrada.

## 5. Steps — ordered, finite, deterministic operations

### A. Carga del sistema (`load`)

1. Inicializar `ElizaState` con listas y diccionarios vacios.
2. Abrir `doctor.txt`.
3. Leer cada linea no vacia.
4. Separar la linea en `tag` y `content` usando `:`.
5. Aplicar la accion correspondiente al `tag`:
   - `initial`: agregar saludo.
   - `final`: agregar despedida.
   - `quit`: agregar palabra de salida.
   - `pre`: registrar sustitucion previa.
   - `post`: registrar sustitucion posterior.
   - `synon`: registrar grupo de sinonimos.
   - `key`: crear clave con peso; si no hay peso, usar `1`.
   - `decomp`: crear regla de descomposicion bajo la clave actual; si inicia con `$`, activar `save`.
   - `reasmb`: agregar plantilla de respuesta bajo la descomposicion actual.
6. Finalizar con un estado de reglas listo para responder.

### B. Inicio de sesion

1. Seleccionar un saludo desde `initials`.
2. Mostrar el saludo.
3. Entrar en bucle de turnos.

### C. Respuesta por turno (`respond`)

1. Recibir `text`.
2. Comparar `text.lower()` contra `quits`.
3. Si coincide, devolver `None`.
4. Normalizar puntuacion:
   - secuencias de puntos a ` . `;
   - secuencias de comas a ` , `;
   - secuencias de punto y coma a ` ; `.
5. Tokenizar por espacios y eliminar tokens vacios.
6. Aplicar sustituciones `pre` token por token.
7. Buscar claves: para cada token normalizado, si existe en `keys`, agregar su `Key`.
8. Ordenar claves por peso descendente; si hay empate, conservar orden estable de aparicion.
9. Para cada clave ordenada:
   1. Intentar cada `Decomp` de esa clave.
   2. Si una descomposicion coincide, aplicar `post` a cada captura.
   3. Seleccionar la siguiente plantilla `reasmb` usando `next_reasmb_index`.
   4. Si la plantilla empieza por `goto`, reiniciar el matching con la clave destino.
   5. Si no es `goto`, re-ensamblar la respuesta.
   6. Si `save == true`, guardar la respuesta en `memory` y continuar buscando otra descomposicion.
   7. Si `save == false`, devolver la respuesta.
10. Si ninguna clave produce respuesta:
    1. Si `memory` no esta vacia, seleccionar una respuesta almacenada, removerla y devolverla.
    2. Si `memory` esta vacia, usar la siguiente respuesta de `xnone`.
11. Unir tokens con espacios y devolver texto final.

### D. Cierre de sesion

1. Si `respond(text)` devuelve `None`, salir del bucle.
2. Seleccionar una despedida desde `finals`.
3. Mostrar la despedida.

## 6. Decision points — branches

| Punto | Condicion | Rama verdadera | Rama falsa |
| --- | --- | --- | --- |
| Salida | `text.lower() in quits` | devolver `None` | continuar procesamiento |
| Etiqueta de carga | `tag == ...` | mutar estructura asociada | probar siguiente etiqueta |
| Sustitucion | `word.lower() in pres/posts` | expandir tokens sustitutos | conservar token original |
| Clave encontrada | `word.lower() in keys` | agregar `Key` candidata | ignorar token |
| Descomposicion | `_match_decomp(...) != None` | usar capturas | probar siguiente `Decomp` |
| Comodin | `part == "*"` | intentar capturar N tokens | evaluar sinonimo/literal |
| Sinonimo | `part.startswith("@")` | validar grupo y token | evaluar literal |
| Literal | `part.lower() == word.lower()` | avanzar recursion | fallo de descomposicion |
| Reassembly | `reasmb[0] == "goto"` | saltar a clave destino | re-ensamblar respuesta |
| Memoria | `decomp.save == true` | guardar y seguir | devolver respuesta |
| Fallback | `memory` no vacia | recuperar memoria | usar `xnone` |

## 7. Preconditions — what must be true before each step

| Paso | Precondiciones |
| --- | --- |
| Cargar reglas | `doctor.txt` existe, es legible y cada linea relevante contiene una etiqueta seguida de `:`. |
| Crear `key` | El contenido incluye una palabra; el peso, si existe, es entero. |
| Crear `decomp` | Ya existe una `key` activa. |
| Crear `reasmb` | Ya existe una `decomp` activa. |
| Resolver sinonimo | Toda referencia `@raiz` existe en `synons`. |
| Resolver placeholder | Cada `(n)` referencia una captura existente. |
| Resolver `goto` | La clave destino existe en `keys`. |
| Ejecutar `respond` | Se ejecuto `load`; existe al menos la clave `xnone` con una descomposicion y una respuesta. |
| Terminar sesion | `quits` contiene al menos una palabra de salida o el invocador puede cortar el bucle externamente. |
| Produccion determinista | El selector pseudoaleatorio esta fijado o sustituido por una politica determinista. |

## 8. Postconditions — what's true after each step

| Paso | Postcondiciones |
| --- | --- |
| Carga de reglas | `ElizaState` contiene saludos, despedidas, salidas, sustituciones, sinonimos y claves. |
| Tokenizacion | El texto de entrada se representa como lista finita de tokens no vacios. |
| Sustitucion `pre` | Los tokens quedan normalizados para maximizar coincidencias con claves y patrones. |
| Ordenacion de claves | Las claves candidatas quedan priorizadas por peso descendente. |
| Matching de descomposicion | Si hay exito, `results` contiene las capturas de comodines y sinonimos en orden. |
| Sustitucion `post` | Las capturas cambian perspectiva gramatical, por ejemplo `my -> your` o `you -> I`. |
| Re-ensamblaje | La plantilla se convierte en una lista finita de tokens de respuesta. |
| Rotacion de respuesta | `next_reasmb_index` de la descomposicion usada aumenta en `1`. |
| Guardado en memoria | Si `save == true`, la respuesta se agrega a `memory` y no se devuelve todavia. |
| Fallback | Siempre se produce una respuesta si existe `xnone` valido o memoria disponible. |
| Salida | Si el usuario escribe una palabra de salida, `respond` devuelve `None` sin mutar reglas. |

## 9. Algoritmo reconstruido

```text
ALGORITHM LoadDoctorScript(path):
  state = new ElizaState()
  current_key = null
  current_decomp = null

  FOR each non_empty line IN path:
    tag, content = split_once(line, ":")

    SWITCH tag:
      CASE "initial":
        state.initials.append(content)
      CASE "final":
        state.finals.append(content)
      CASE "quit":
        state.quits.append(content)
      CASE "pre":
        source, replacement[] = split_words(content)
        state.pres[source] = replacement
      CASE "post":
        source, replacement[] = split_words(content)
        state.posts[source] = replacement
      CASE "synon":
        root, members[] = split_words(content)
        state.synons[root] = [root] + members
      CASE "key":
        word, optional_weight = split_words(content)
        weight = optional_weight OR 1
        current_key = Key(word, weight, [])
        state.keys[word] = current_key
      CASE "decomp":
        parts = split_words(content)
        save = parts[0] == "$"
        IF save:
          parts = parts[1:]
        current_decomp = Decomp(parts, save, [])
        current_key.decomps.append(current_decomp)
      CASE "reasmb":
        current_decomp.reasmbs.append(split_words(content))

  RETURN state
```

```text
ALGORITHM Respond(state, text):
  IF lower(text) IN state.quits:
    RETURN None

  normalized = normalize_punctuation(text)
  words = remove_empty(split(normalized, " "))
  words = Substitute(words, state.pres)

  candidate_keys = []
  FOR word IN words:
    IF lower(word) IN state.keys:
      candidate_keys.append(state.keys[lower(word)])

  candidate_keys = stable_sort(candidate_keys, by descending weight)

  FOR key IN candidate_keys:
    output = MatchKey(state, words, key)
    IF output is not null and output is not empty:
      RETURN join(output, " ")

  IF state.memory is not empty:
    output = select_and_remove_memory_item(state)
  ELSE:
    output = NextReassembly(state.keys["xnone"].decomps[0])

  RETURN join(output, " ")
```

```text
ALGORITHM MatchKey(state, words, key):
  FOR decomp IN key.decomps:
    captures = MatchDecomp(state, decomp.parts, words)
    IF captures is null:
      CONTINUE

    captures = [Substitute(capture, state.posts) FOR capture IN captures]
    reasmb = NextReassembly(decomp)

    IF reasmb[0] == "goto":
      target = reasmb[1]
      RETURN MatchKey(state, words, state.keys[target])

    output = Reassemble(reasmb, captures)

    IF decomp.save:
      state.memory.append(output)
      CONTINUE

    RETURN output

  RETURN null
```

```text
ALGORITHM MatchDecompRecursive(state, parts, words, captures):
  IF parts is empty AND words is empty:
    RETURN true

  IF parts is empty:
    RETURN false

  IF words is empty AND parts != ["*"]:
    RETURN false

  head = parts[0]

  IF head == "*":
    FOR index FROM length(words) DOWNTO 0:
      captures.append(words[0:index])
      IF MatchDecompRecursive(state, parts[1:], words[index:], captures):
        RETURN true
      captures.pop()
    RETURN false

  IF starts_with(head, "@"):
    root = head without "@"
    REQUIRE root IN state.synons
    IF lower(words[0]) NOT IN state.synons[root]:
      RETURN false
    captures.append([words[0]])
    RETURN MatchDecompRecursive(state, parts[1:], words[1:], captures)

  IF lower(head) != lower(words[0]):
    RETURN false

  RETURN MatchDecompRecursive(state, parts[1:], words[1:], captures)
```

```text
ALGORITHM Reassemble(reasmb, captures):
  output = []

  FOR token IN reasmb:
    IF token is empty:
      CONTINUE

    IF token matches "(n)":
      n = integer_inside_parentheses(token)
      REQUIRE 1 <= n <= length(captures)
      insert = captures[n - 1]
      insert = truncate_at_first_punctuation(insert, [",", ".", ";"])
      output.extend(insert)
    ELSE:
      output.append(token)

  RETURN output
```

## 10. Termination — the algorithm ends with a production system

### Terminacion del turno

Cada llamada a `respond(text)` termina porque:

1. La entrada se tokeniza en una lista finita.
2. La lista de claves candidatas es finita.
3. Cada clave contiene una lista finita de descomposiciones.
4. Cada descomposicion contiene una lista finita de partes.
5. El comodin `*` explora como maximo `len(words) + 1` particiones.
6. La recursion consume partes del patron, palabras de entrada o una combinacion acotada de ambas.
7. Si no hay match, existe fallback mediante `memory` o `xnone`.

### Terminacion de la sesion

La sesion interactiva termina cuando `respond(text)` devuelve `None`, lo cual ocurre si `text.lower()` coincide exactamente con una entrada de `quits`, por ejemplo:

- `bye`
- `goodbye`
- `quit`

Despues de eso, el sistema emite `final()` y finaliza el proceso interactivo.

### Sistema de produccion resultante

El algoritmo queda definido como un sistema de produccion de reglas:

```text
ProductionSystem = {
  WorkingMemory: tokens_de_entrada + capturas + memory,
  RuleBase: keys + decomps + reasmbs + pres + posts + synons,
  ConflictResolution: ordenar claves por peso descendente y mantener orden estable,
  RuleApplication: match de descomposicion -> post-substitution -> reassembly,
  ControlFlow: goto, save-to-memory, fallback xnone,
  Termination: quit exacto o respuesta producida
}
```

### Requisitos de produccion

Para operar como sistema de produccion robusto:

1. Validar el script antes de servir trafico:
   - `xnone` debe existir;
   - todo `goto` debe apuntar a una clave existente;
   - toda referencia `@synon` debe existir;
   - todo placeholder `(n)` debe tener captura posible;
   - no debe haber ciclos infinitos de `goto`.
2. Fijar una politica de seleccion:
   - semilla estable para RNG; o
   - selector determinista FIFO/LIFO para `memory`; o
   - selector determinista por indice de turno.
3. Mantener estado por sesion de usuario:
   - `memory`;
   - `next_reasmb_index`;
   - estado del selector.
4. Registrar trazas de decision:
   - tokens despues de `pre`;
   - claves candidatas;
   - clave elegida;
   - descomposicion usada;
   - plantilla `reasmb`;
   - fallback usado si aplica.
5. Exponer contrato minimo:
   - `POST /respond` con `session_id` y `text`;
   - respuesta `{ "reply": string, "ended": boolean }`;
   - si `ended == true`, incluir despedida final.

## 11. Observaciones de fidelidad

- La implementacion no comprende semantica; opera por coincidencia textual.
- La prioridad semantica se simula con pesos de `key`.
- Los comodines capturan la porcion mas larga posible primero, porque el bucle prueba desde `len(words)` hasta `0`.
- `post` se aplica a capturas, no a toda la respuesta final.
- `save` no responde inmediatamente; guarda una respuesta y continua buscando otra regla.
- `goto` no re-tokeniza ni re-aplica `pre`; reutiliza los tokens ya normalizados del turno actual.
- El fallback `xnone` garantiza respuesta cuando no hay memoria y no hay match util.
