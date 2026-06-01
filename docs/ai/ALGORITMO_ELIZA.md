# Algoritmo del Chatbot ELIZA - Ingeniería Inversa

## 📋 Resumen Ejecutivo

ELIZA es un chatbot clásico que simula un psicólogo (doctor) usando patrones de coincidencia de texto y re-ensamblaje de respuestas. El sistema se basa en reglas predefinidas cargadas desde un archivo de configuración y utiliza técnicas de procesamiento de lenguaje natural simplificadas.

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────┐
│                    FLUJO DEL CHATBOT                    │
├─────────────────────────────────────────────────────────┤
│  1. CARGA DE DATOS → 2. PROCESAMIENTO → 3. COINCIDENCIA │
│  4. RE-ENSAMBLAJE → 5. RESPUESTA → 6. ALMACENAMIENTO   │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 Estructuras de Datos Principales

### 1. **Clase Key** (Clave)
```
Key = {
  word: str,           # Palabra clave a buscar ("hello", "mother", etc)
  weight: int,         # Peso de prioridad (1-100)
  decomps: [Decomp]   # Lista de descomposiciones asociadas
}
```
- Representa palabras clave importantes en la entrada del usuario
- El peso determina el orden de procesamiento (mayor peso = más importante)

### 2. **Clase Decomp** (Descomposición)
```
Decomp = {
  parts: [str],              # Patrón a coincidir (p.ej., ["*", "mother", "*"])
  save: bool,                # Si guardar en memoria
  reasmbs: [[str]],         # Respuestas posibles (re-ensamblajes)
  next_reasmb_index: int    # Índice para rotación de respuestas
}
```
- Define un patrón de palabras con comodines (*) y sinónimos (@)
- Contiene múltiples respuestas posibles

### 3. **Clase Eliza** (Controlador Principal)
```
Eliza = {
  initials: [str],    # Saludos iniciales
  finals: [str],      # Despedidas finales
  quits: [str],       # Palabras para salir
  pres: {},           # Sustituciones PRE (antes de procesar)
  posts: {},          # Sustituciones POST (después de procesar)
  synons: {},         # Sinónimos (@mother, @family, etc)
  keys: {},           # Palabras clave y sus descomposiciones
  memory: []          # Respuestas guardadas para reutilizar
}
```

---

## 🔄 Algoritmo Principal (Método `respond()`)

### **PASO 1: Validar Salida**
```
if texto_entrada.lower() in quits:
  return None  # Termina la conversación
```

### **PASO 2: Normalizar Puntuación**
```
Reemplazar:
  "...." → " . "
  ",," → " , "
  ";;" → " ; "
```
Esto prepara el texto para dividirse en palabras.

### **PASO 3: Dividir en Palabras**
```
"Hello mother" → ["Hello", "mother"]
Elimina espacios vacíos
```

### **PASO 4: Sustituciones PRE (Transformación Inicial)**
```
Diccionario: {"you're" → ["you", "are"], "i'm" → ["i", "am"]}
Resultado: ["i", "am", "feeling", "sad"]
```

### **PASO 5: Buscar Palabras Clave**
```
Algoritmo:
  1. Para cada palabra en la entrada
  2. Si la palabra existe en self.keys
  3. Agregar a lista de claves encontradas
  4. Ordenar por WEIGHT (descendente)
  
Ejemplo:
  Entrada: ["i", "feel", "sad", "about", "my", "mother"]
  Claves encontradas: Keys{word:"mother" weight:4}, Keys{word:"feel" weight:2}
  Orden procesamiento: mother (4) → feel (2)
```

### **PASO 6: Procesar Primera Clave Coincidente**
```
for clave in claves_ordenadas:
  resultado = _match_key(palabras, clave)
  if resultado:
    return resultado  # Devuelve la respuesta
```

### **PASO 7: Fallback - Si No Hay Coincidencia**
```
Orden de intentos:
  1. ¿Hay respuestas guardadas en memoria?
     → Devolver una respuesta aleatoria guardada
  2. Si no hay memoria
     → Usar respuesta por defecto (xnone key)
```

---

## 🎯 Análisis de Coincidencia de Patrones (`_match_decomp()`)

### **Componentes del Patrón**

| Patrón | Significado | Ejemplo |
|--------|------------|---------|
| `*` | Comodín - coincide con 0 o más palabras | `["*", "sad"]` |
| `@synon` | Sinónimo - lista predefinida | `["@family"]` coincide con "mother", "father" |
| Palabra literal | Debe coincidir exactamente (insensible a mayúsculas) | `["am"]` |

### **Algoritmo Recursivo de Coincidencia**

```
_match_decomp_r(partes, palabras, resultados):
  
  BASE CASES:
  ├─ Si no hay partes Y no hay palabras → TRUE (éxito)
  ├─ Si no hay partes pero SÍ hay palabras → FALSE (fallo)
  └─ Si hay partes pero no hay palabras (excepto "*") → FALSE
  
  RECURSIVE CASES:
  ├─ Si primera parte es "*":
  │   └─ Intentar coincidencia con 0, 1, 2... palabras
  │       hasta encontrar una que funcione (backtracking)
  │
  ├─ Si primera parte es "@sinónimo":
  │   └─ Verificar si primera palabra está en lista de sinónimos
  │       Si SÍ: guardar palabra y continuar
  │       Si NO: fallar
  │
  └─ Si primera parte es palabra literal:
      └─ Comparar con primera palabra (ignorar mayúsculas)
          Si coinciden: continuar
          Si no: fallar
```

### **Ejemplo de Ejecución**

```
Patrón:     ["*", "mother", "*"]
Palabras:   ["i", "hate", "my", "mother", "sometimes"]

Paso 1: "*" intenta coincidir
  ├─ Intenta 0 palabras: ["i", "hate", "my", "mother", "sometimes"]
  │   "mother" != "i" → FALLO
  ├─ Intenta 1 palabra: ["hate", "my", "mother", "sometimes"]
  │   "mother" != "hate" → FALLO
  ├─ Intenta 2 palabras: ["my", "mother", "sometimes"]
  │   "mother" != "my" → FALLO
  ├─ Intenta 3 palabras: ["mother", "sometimes"]
  │   "mother" == "mother" → ÉXITO
  │   Guardar resultados: [["i", "hate", "my"], ["sometimes"]]
```

**Resultados Guardados:**
- `(1)` = ["i", "hate", "my"] - lo que coincidió ANTES
- `(2)` = ["sometimes"] - lo que coincidió DESPUÉS

---

## 🔧 Re-ensamblaje de Respuestas (`_reassemble()`)

### **Estructura de Re-ensamblaje**

```
Patrón original:    ["*", "mother", "*"]
Respuesta plantilla: ["tell", "me", "more", "about", "your", "(2)"]

Procesamiento:
  ├─ "tell" → agregar
  ├─ "me" → agregar
  ├─ "more" → agregar
  ├─ "about" → agregar
  ├─ "your" → agregar
  ├─ "(2)" → REEMPLAZAR por resultados[2-1] = ["sometimes"]
  
Resultado final: ["tell", "me", "more", "about", "your", "sometimes"]
```

### **Reglas de Re-ensamblaje**

```
1. Si palabra comienza y termina con paréntesis: "(N)"
   → Reemplazar por N-ésimo resultado
   → Limpiar puntuación (,. ;) del texto

2. Si es palabra normal
   → Agregar tal cual

3. Palabras vacías se ignoran
```

---

## 💾 Sustituciones POST y Limpieza

```
Después de re-ensamblaje:
  ["you", "are", "sad"]
  
Aplicar POST substitutions:
  {"you're" → ["you", "are"]}
  {"i" → ["you"], "you" → ["i"]}  # Intercambio de perspectiva
  
Resultado: ["i", "am", "sad"]  # Cambio de perspectiva en la respuesta
```

---

## 🧠 Sistema de Memoria

### **Almacenamiento en Memoria**

```
Si Decomp.save == True:
  └─ GUARDAR respuesta en self.memory

Ejemplo:
  Patrón: ["*"]
  Respuesta: ["please", "tell", "me", "more"]
  save: True
  
  → Se guarda en memory para usar después
```

### **Recuperación de Memoria**

```
Si ningún patrón coincide:
  1. Verificar if self.memory no está vacío
  2. Elegir respuesta ALEATORIA
  3. ELIMINAR de memory (pop)
  4. Devolver respuesta
```

---

## 📁 Formato del Archivo de Configuración (`doctor.txt`)

```
initial: Hi there! How are you feeling today?
initial: Hello! What troubles you?

final: Goodbye, take care of yourself!
final: See you next time!

quit: bye
quit: goodbye
quit: quit

pre: you're you are
pre: i'm i am
pre: don't do not

post: you i
post: i you
post: me you

synon: family mother father sister brother
synon: sad unhappy depressed miserable

key: mother 4
decomp: * mother *
reasmb: tell me more about your mother
reasmb: how do you feel about your mother?

key: feel 2
decomp: i feel *
reasmb: why do you feel (1) ?
reasmb: when did you start feeling (1) ?

key: xnone 0
decomp: *
reasmb: i see
reasmb: go on
```

---

## 🎭 Casos Especiales y Flujos

### **1. GOTO (Salto de Clave)**
```
reasmb: goto mother
  → Ignora respuentas de descomposición actual
  → Procesa nuevamente con clave "mother"
  → Útil para redirigir conversación
```

### **2. Intercambio de Perspectiva (PRE/POST)**
```
Entrada:  "You made me feel sad"
Pre:      ["you", "made", "me", "feel", "sad"]
Post:     ["i", "made", "you", "feel", "sad"]
Respuesta: "How did I make you feel sad?"
```

### **3. Manejo de Múltiples Respuestas**
```
Decomp con 3 respuestas:
  reasmb[0]: response A
  reasmb[1]: response B
  reasmb[2]: response C

First call:  índice=0 → respuesta A, next_index=1
Second call: índice=1 → respuesta B, next_index=2
Third call:  índice=2 → respuesta C, next_index=3
Fourth call: índice=3 % 3 = 0 → respuesta A (cicla)
```

---

## 📈 Flujo Completo - Ejemplo Paso a Paso

```
ENTRADA: "I feel my mother doesn't love me"

┌─ PASO 1: Normalizar
│  "I feel my mother doesn't love me" → "I feel my mother does not love me"
│
├─ PASO 2: Palabras
│  ["i", "feel", "my", "mother", "does", "not", "love", "me"]
│
├─ PASO 3: Sustituciones PRE
│  {"doesn't" → ["does", "not"]}  (ya hecho)
│  → ["i", "feel", "my", "mother", "does", "not", "love", "me"]
│
├─ PASO 4: Encontrar Claves
│  Clave "feel" (weight: 2)
│  Clave "mother" (weight: 4)
│  Ordenar por peso: [mother(4), feel(2)]
│
├─ PASO 5: Procesar Clave "mother"
│  Descomposición: ["*", "mother", "*"]
│  ¿Coincide? Sí
│  Resultados: (1)=["i","feel","my"], (2)=["does","not","love","me"]
│
├─ PASO 6: Re-ensamblaje
│  Plantilla: ["tell", "me", "more", "about", "your", "(2)"]
│  Resultado: ["tell", "me", "more", "about", "your", "does", "not", "love", "me"]
│
├─ PASO 7: Sustituciones POST
│  {"you" ↔ "i"}: sin cambios
│  → ["tell", "me", "more", "about", "your", "does", "not", "love", "me"]
│
└─ RESPUESTA FINAL
   "tell me more about your does not love me"
```

---

## 🔑 Conceptos Clave

| Concepto | Descripción | Propósito |
|----------|-------------|----------|
| **Pattern Matching** | Coincidencia de palabras con comodines | Flexibilidad en entrada |
| **Decomposition** | Dividir entrada en partes definidas | Extraer información relevante |
| **Reassembly** | Reconstruir respuesta con información | Personalizar respuestas |
| **Synonyms** | Mapear palabras similares | Reconocer variaciones |
| **Memory** | Almacenar respuestas no usadas | Recuperarse en impasses |
| **Weight** | Priorizar palabras clave | Enfatizar temas importantes |
| **Substitution** | Cambiar palabras PRE/POST | Normalizar y perspectiva |

---

## ⚠️ Limitaciones del Algoritmo

1. **Sin comprensión semántica** - Solo coincidencia de patrones
2. **Sin contexto persistente** - Olvida temas anteriores
3. **Sin aprendizaje** - No mejora con el tiempo
4. **Respuestas predefinidas** - No genera texto nuevo
5. **Sensible al formato** - Errores de tipeo rompen patrones
6. **Memoria limitada** - Solo guarda frases incompletas

---

## 📚 Variantes y Mejoras Posibles

```
1. Incorporar embeddings (Word2Vec, BERT)
2. Agregar contexto de conversación (últimas N mensajes)
3. Usar ML para puntuar respuestas relevantes
4. Integrar APIs externas (Wikipedia, APIs)
5. Aprendizaje por feedback del usuario
6. Análisis de sentimientos
7. Generación de texto con modelos neurales
```

---

## 🎓 Conclusión

ELIZA es un ejemplo clásico de chatbot basado en reglas (Rule-Based Chatbot). Su elegancia radica en la simplicidad: con patrones y re-ensamblajes bien diseñados, puede simular conversación inteligente sin ML. Sin embargo, es completamente determinístico y predecible una vez conoces las reglas.

El algoritmo es la base de muchos chatbots modernos, aunque ahora se combinan con redes neuronales para mayor naturalidad y comprensión.
