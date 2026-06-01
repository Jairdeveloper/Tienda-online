---
id: 028
area: prompts
type: PRM
module: AGENTS
version: 1.0
status: DRAFT
tags:
  - prompts
  - agents
  - reverse-engineering
  - vercel
  - deploy
summary: "Plan de implementación para 2 sub-agentes de opencode: (1) agente de ingeniería inversa que traduce código fuente a lenguaje natural, (2) agente experto en deploy de NestJS en Vercel."
keywords:
  - sub-agents
  - opencode
  - reverse-engineering
  - vercel-deploy
  - nestjs
changelog:
  - date: 2026-05-31
    author: workflow-agent
    description: Creación inicial del plan de implementación
---

# Plan de Implementación — 2 Sub-Agentes de Opencode

## 1. Resumen Ejecutivo

Se implementarán **dos nuevos sub-agentes** en el ecosistema `.opencode/agents/` de `@tienda/api`:

| # | Agente | Propósito | Tools |
|---|--------|-----------|-------|
| 1 | **reverse-engineer** | Analizar código fuente NestJS/TypeScript y producir documentación técnica en lenguaje natural | read, glob, grep, write |
| 2 | **vercel-deploy** | Investigar y guiar el despliegue de aplicaciones NestJS con Prisma + PostgreSQL (Neon) + Redis (Upstash) en Vercel | webfetch, websearch, write, read |

Ambos agentes se integrarán en la tabla de jerarquía del `workflow-agent` y seguirán las convenciones del proyecto.

---

## 2. Análisis del Contexto

### 2.1 Estado Actual del Ecosistema

- **11 agentes existentes** en `.opencode/agents/` (workflow-agent, about, current-instruction, nestjs-architect, prisma-reviewer, security-reviewer, backend-reviewer, frontend-reviewer, test-writer, changelog-writer, compaction)
- El **workflow-agent** es el orquestador jefe y contiene la tabla de jerarquía en su sección 8.
- Los agentes se comunican exclusivamente a través del workflow-agent (no entre sí).
- Algunos agentes tienen `tools: { write: true, edit: true, bash: true }` (ej. test-writer, changelog-writer, frontend-reviewer).
- Otros son read-only (sin tools activas).

### 2.2 Stack del Proyecto `@tienda/api`

| Componente | Tecnología | Detalle |
|-----------|-----------|---------|
| Backend | NestJS (TypeScript 5.9.3) | src/ estructurado en módulos |
| ORM | Prisma | 22 modelos, 3 migraciones |
| BD Principal | PostgreSQL (Neon serverless) | DATABASE_URL |
| Cache/Session | Redis (Upstash serverless) | REDIS_URL |
| Auth | JWT + RBAC + Permisos | JWT_SECRET |
| Deploy | Vercel (serverless) | URL: tienda-online-zped08s-projects.vercel.app |

### 2.3 Necesidades Detectadas

1. **Documentación del código**: No existe un agente dedicado a analizar el código fuente existente y producir documentación técnica legible por humanos.
2. **Deploy en Vercel**: El proyecto ya está desplegado en Vercel pero no hay un agente con conocimiento actualizado de las mejores prácticas, limitaciones y configuración específica de Vercel para NestJS serverless.

---

## 3. Diseño de los Agentes

### 3.1 Agente 1: Reverse Engineering Agent (`reverse-engineer`)

**Archivo destino:** `.opencode/agents/reverse-engineer.md`

#### Propósito
Analizar código fuente de `@tienda/api` (NestJS, TypeScript, Prisma) y producir documentación estructurada en lenguaje natural: diagramas de flujo, descripción de módulos, relaciones entre servicios, contratos de API, etc.

#### Capacidades específicas
- Leer archivos `.ts`, `.prisma`, `.module.ts`, `.controller.ts`, `.service.ts`
- Identificar patrones NestJS (módulos, controladores, servicios, guards, decorators)
- Mapear dependencias entre módulos
- Extraer contratos de API (endpoints, DTOs, validación)
- Describir flujos de datos (request → guard → controller → service → prisma → response)
- Generar documentación en formato Markdown siguiendo la convención del proyecto

#### Tools asignadas
```yaml
tools:
  read: true
  glob: true
  grep: true
  write: true
```

- `read`: Para leer archivos fuente
- `glob`: Para encontrar archivos por patrón
- `grep`: Para buscar referencias y patrones
- `write`: Para generar documentación como archivos `.md`

#### Ejemplos de uso
```
"Analiza el módulo de auth y describe su flujo de autenticación"
"Genera documentación del módulo de payments, incluyendo el patrón provider"
"Describe las relaciones entre cart, checkout y orders"
```

---

### 3.2 Agente 2: Vercel Deploy Expert Agent (`vercel-deploy`)

**Archivo destino:** `.opencode/agents/vercel-deploy.md`

#### Propósito
Investigar y proporcionar guía actualizada sobre el despliegue de aplicaciones NestJS con Prisma + PostgreSQL (Neon) + Redis (Upstash) en Vercel, incluyendo configuración de `vercel.json`, límites serverless, optimizaciones de cold start, manejo de variables de entorno y resolución de problemas comunes.

#### Capacidades específicas
- Investigar en https://vercel.com/docs la configuración actual para Node.js/NestJS
- Analizar `vercel.json` y sugerir optimizaciones
- Diagnosticar errores de deploy (timeouts, cold starts, bundle size)
- Guiar la configuración de Prisma en serverless (generación de cliente, pool de conexiones)
- Configurar variables de entorno para Neon y Upstash
- Documentar límites y restricciones de Vercel serverless (10s timeout, 50MB bundle, etc.)
- Integrar con GitHub Actions CI existente

#### Tools asignadas
```yaml
tools:
  webfetch: true
  websearch: true
  read: true
  write: true
```

- `webfetch`: Para obtener contenido actualizado de https://vercel.com/docs
- `websearch`: Para buscar soluciones y mejores prácticas
- `read`: Para leer configuración local (vercel.json, package.json, etc.)
- `write`: Para documentar hallazgos y generar guías

#### Ejemplos de uso
```
"Investiga la configuracion optima de vercel.json para NestJS con Prisma"
"Diagnostica este error de deploy: '[GET] timed out after 10s'"
"Como configurar Prisma para serverless en Vercel con Neon?"
"Genera una guia de deploy para @tienda/api en Vercel"
```

---

## 4. Formato y Convenciones

Cada agente debe seguir el formato estándar de agente opencode:

```yaml
---
description: "Descripción del propósito del agente"
mode: subagent
model: opencode/big-pickle
temperature: 0.1
tools:
  tool_name: true/false
---
```

- **mode**: Siempre `subagent`
- **model**: `opencode/big-pickle` (modelo del ecosistema)
- **temperature**: `0.1` (baja para respuestas predecibles y técnicas)
- **tools**: Solo tools que el agente necesita realmente

Secciones del documento (orden recomendado):

1. **Frontmatter** (YAML)
2. **Título**: `# Reverse Engineering Agent` / `# Vercel Deploy Expert Agent`
3. **Contexto**: Descripción del proyecto `@tienda/api`, referencias a AGENTS.md
4. **Propósito**: En qué consiste el agente
5. **Capacidades**: Lista detallada de lo que puede hacer
6. **Tools**: Qué herramientas usa y para qué
7. **Ejemplos de prompts**: Instrucciones típicas que recibiría
8. **Restricciones**: Lo que NO debe hacer
9. **Output esperado**: Formato de sus respuestas

---

## 5. Dependencias y Riesgos

### 5.1 Dependencias
- El `workflow-agent` debe actualizar su tabla de jerarquía (sección 8) para incluir los nuevos agentes
- Los nuevos agentes deben referenciar `AGENTS.md` y convenciones del proyecto
- `vercel-deploy` depende de acceso a Internet para consultar docs de Vercel

### 5.2 Riesgos
- **Vercel cambia su configuración**: mitigación documentando la fuente y fecha de la información
- **El agente de reverse engineering puede generar documentación incompleta**: establecer criterios de calidad
- **Ambos agentes son nuevos y no han sido probados en producción**: ciclo de validación

---

## 6. Criterios de Éxito

1. Archivos `reverse-engineer.md` y `vercel-deploy.md` creados en `.opencode/agents/`
2. Ambos archivos siguen el formato de frontmatter del ecosistema
3. El `workflow-agent` reference a los nuevos agentes en su tabla
4. Cada agente puede ser invocado con un prompt de prueba
5. La sintaxis de los archivos es válida (YAML frontmatter correcto)

---

## 7. Próximos Pasos

Ver `029_EXEC_BUILD_AGENTS_1_0_DRAFT.md` para el plan de ejecución detallado con los pasos concretos para crear ambos agentes.

---
_Generado por workflow-agent el 2026-05-31_
