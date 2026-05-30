---
id: TEMPLATE_PROMPT
area: PROMPT
type: TEMPLATE
module: GENERAL
version: v1.0
status: ACTIVE
author: system
last_updated: 2026-05-23
tags:
  - prompt
  - template
  - ia
  - convention
---

# Plantilla para Prompts de IA

## Propósito

Esta plantilla establece el estándar para crear prompts y contextos de IA en el proyecto. Todos los prompts deben seguir esta estructura para mantener consistencia y facilitar el RAG (Retrieval Augmented Generation).

## Formato de archivo

Los archivos de prompts deben seguir la convención:

`[ID]_PROMPT_[MODULO]_[VERSION]_[ESTADO].md`

Ejemplos:
- `001_PROMPT_SYSTEM_BOT_v1.0_ACTIVE.md`
- `002_PROMPT_SUPPORT_ORDER_v1.0_ACTIVE.md`
- `003_PROMPT_RECOMMENDER_v1.0_ACTIVE.md`

## Estructura del contenido

```markdown
---
id: [ID]
area: PROMPT
type: [TIPO]
module: [MODULO]
version: v[VERSION]
status: [ESTADO]
author: [AUTOR]
last_updated: [FECHA]
dependencies:
  - [ARCHIVOS_DEPENDE]
tags:
  - [TAG1]
  - [TAG2]
summary: "[RESUMEN_CORTO_DEL_PROPOSITO]"
keywords:
  - [PALABRA_CLAVE_1]
  - [PALABRA_CLAVE_2]
---

# [TÍTULO DEL PROMPT]

## Propósito

[Descripción clara del propósito del prompt]

## Contexto

[Contexto necesario para que la IA entienda el escenario]

## Instrucciones

[Instrucciones específicas y detalladas]

## Ejemplos

### Ejemplo 1: [DESCRIPCIÓN]

**Entrada:**
```
[Ejemplo de entrada]
```

**Salida esperada:**
```
[Ejemplo de salida]
```

## Variables

| Variable | Descripción | Tipo | Ejemplo |
|----------|-------------|------|---------|
| {variable1} | Descripción | string | ejemplo |

## Restricciones

- [Restricción 1]
- [Restricción 2]

## Referencias

- [Enlace a documentación relevante]
```

## Tipos de prompts

- `SYSTEM` - Prompts de sistema principal
- `SUPPORT` - Prompts para soporte y atención
- `RECOMMENDER` - Prompts para recomendaciones
- `ANALYSIS` - Prompts para análisis de datos
- `GENERATION` - Prompts para generación de content
- `CLASSIFICATION` - Prompts para clasificación

## Mejores prácticas

1. **Ser específico**: Cuanto más específico sea el prompt, mejores serán los resultados
2. **Proporcionar contexto**: Incluir información relevante del dominio
3. **Usar ejemplos**: Los ejemplos ayudan a la IA a entender el formato esperado
4. **Definir variables**: Usar `{variable}` para partes dinámicas
5. **Establecer restricciones**: Definir claramente lo que NO debe hacer la IA

## Referencias

- Ver `../master_index.md` para el índice global
- Ver `../AI/` para componentes de IA
- Ver `../Arquitectura/ARCH_AUTOMATION_IA.md` para automatizaciones