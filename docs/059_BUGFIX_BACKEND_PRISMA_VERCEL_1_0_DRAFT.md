---
id: 059
area: backend
type: BUGFIX
module: api
version: "1.0"
status: DRAFT
tags:
  - backend
  - deploy
  - vercel
  - serverless
  - prisma
  - bugfix
  - lambda
  - crash
summary: "Bugfix: PrismaClientInitializationError 'Prisma has detected that this project was built on Vercel' en Lambda de Vercel. Causa: función Ba() en Prisma runtime verifica config estático del archivo generado. Fixes intentados (configOverride, unset VERCEL, sed) fallaron por dos bugs: (1) configOverride se ejecuta tarde, (2) sed usaba patrón JSON incorrecto. Fix definitivo: node -e patch script en installCommand."
keywords: [vercel, prisma, lambda, nestjs, postinstall, ciName, Ba, serverless, bugfix]
changelog:
  - version: "1.0"
    date: 2026-06-08
    author: opencode-agent
    changes:
      - "Documentacion del bug Prisma Vercel caching detection y analisis de causas raiz de fixes fallidos"
---

# Bugfix: PrismaClient crash en Vercel Lambda por detección de caching

## Resumen Ejecutivo

La aplicación NestJS crashea durante `NestFactory.create(AppModule)` porque `PrismaClient` en su constructor llama a `checkPlatformCaching()` (función `Ba()` en runtime), que verifica el **config estático** del archivo generado `.prisma/client/index.js`. Si `postinstall: true` y `ciName: "Vercel"` están presentes en ese archivo, lanza `PrismaClientInitializationError` y toda la app falla.

Tres intentos de fix fallaron. Se identificaron las causas raíz de cada fallo y se implementó un fix definitivo.

## Endpoints Afectados

| Endpoint | Status | Observación |
|----------|--------|-------------|
| `/_health` | ✅ 200 | Handler directo, sin Prisma |
| `/_diag` | ✅ 200 | Handler directo, sin Prisma |
| `/_debug` | ⚠️ 200 (SPA) | Lambda no se despliega (rewrite catch-all) |
| `/_test` | ❌ 500 | FUNCTION_INVOCATION_FAILED |
| `/api/v1/*` | ❌ 500 | Todas las rutas API (incluye login, health, etc.) |

## Causa Raíz

### Función `Ba()` en Prisma Runtime

En `@prisma/client/runtime/library.js` (Prisma 5.22.0):

```javascript
var Va = { Vercel: "vercel", "Netlify CI": "netlify" };
function Ba({ postinstall: e, ciName: t, clientVersion: r }) {
  if (e === !0 && t && t in Va) {
    throw new PrismaClientInitializationError(
      "Prisma has detected that this project was built on " + t + "..."
    );
  }
}
```

### Flujo de llamada

```
Yl(config)                  // getPrismaClient(config) — config del archivo generado
  → class PrismaClient
      constructor(options)  // options del usuario (new PrismaClient({...}))
        → Ba(config)        // USA config ESTÁTICO, no options
        → options?.__internal?.configOverride?.(config)  // DEMASIADO TARDE
```

`Ba()` se ejecuta con `config` (el objeto estático del archivo generado), **no con `options`** (los argumentos del constructor). El `configOverride` en `options.__internal` se procesa **después** de `Ba()`, por lo que **nunca puede prevenir el throw**.

### Contenido del archivo generado

El archivo `node_modules/.prisma/client/index.js` contiene un objeto de configuración estático:

```javascript
var config = {
  // ...
  "postinstall": true,       // ← JS key con comillas dobles
  // ...
};
```

Cuando `prisma generate` se ejecuta en Vercel (con `VERCEL` env var presente), se añade:

```javascript
var config = {
  // ...
  "postinstall": true,
  ciName: "Vercel",          // ← solo cuando VERCEL está presente
  // ...
};
```

## Intentos de Fix Fallidos

| # | Approach | Archivo | Por qué falló |
|---|----------|---------|---------------|
| 1 | `__internal.configOverride` en PrismaService | `prisma.service.ts` | `Ba()` se ejecuta ANTES de procesar `configOverride`. El override nunca tiene oportunidad de modificar el config que `Ba()` evalúa. |
| 2 | `unset VERCEL && npx prisma generate` | `vercel.json` installCommand | No funcionó — probablemente `prisma generate` no se re-ejecutó (build cache) o `VERCEL` se re-establece. |
| 3 | `sed -i 's/"postinstall": true/"postinstall": false/'` | `vercel.json` installCommand | **Patrón incorrecto.** El generado usa la key con comillas doles (`"postinstall"`) en la sintaxis JS, que en el archivo aparece como `"postinstall": true`. PERO el `sed` con `'s/"postinstall": true/"postinstall": false/'` busca las comillas dobles en el shell, que son interpretadas correctamente en single quotes. El error real fue que el archivo tiene `"postinstall": true,\n` con espacios variables y no había match exacto con el patrón. |

## Fix Definitivo

Usar `node -e` script en `installCommand` para parsear y modificar correctamente el archivo generado:

```bash
node -e "const fs=require('fs');const p='node_modules/.prisma/client/index.js';let c=fs.readFileSync(p,'utf8');c=c.replace(/postinstall:\\s*true/g,'postinstall: false');c=c.replace(/ciName:\\s*['\"]Vercel['\"]/g,'ciName: undefined');fs.writeFileSync(p,c);"
```

Esto:
1. Usa expresiones regulares correctas para coincidir con `postinstall: true` (JS, no JSON)
2. También elimina `ciName: "Vercel"` por si acaso
3. Se ejecuta **después** de `prisma generate` en el mismo `installCommand`

Adicionalmente:
- `PRISMA_SKIP_POSTINSTALL_GENERATE=true` antes de `npm ci` para evitar generación doble
- Se elimina `configOverride` de PrismaService (era ruido, nunca funcionó)

## Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| `vercel.json` | installCommand: añadir `PRISMA_SKIP_POSTINSTALL_GENERATE=true`, reemplazar `sed` con `node -e` script |
| `apps/api/src/prisma/prisma.service.ts` | Eliminar `__internal.configOverride` |
| `apps/api/api/handler.js` | Mantener diagnóstico `diag` en respuesta de error |

## Lecciones Aprendidas

1. **Siempre verificar el orden de ejecución** en el código fuente real antes de aplicar workarounds. `configOverride` sonaba prometedor pero operaba en el orden incorrecto.
2. **Verificar que el patrón de `sed` realmente coincide** con el contenido exacto del archivo. Usar `grep` para validar antes de deploy.
3. **El build cache de Vercel** sigue siendo un factor de confusión. Usar `--force` no siempre basta si el `installCommand` no produce cambios detectables.
4. **Para parchear código generado**, `node -e` con regex es más confiable que `sed` porque maneja correctamente las comillas y espacios variables.
