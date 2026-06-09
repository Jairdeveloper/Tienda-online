---
id: 060
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
  - nft
  - lambda
  - bugfix
  - bundle
  - includeFiles
summary: "Bugfix: includeFiles no incluye archivos compilados de NestJS (apps/api/dist/**) en Lambdas de Vercel. Causa raiz: bundle:false fue eliminado en commit 90b550b, activando esbuild bundling por defecto, lo que rompe require(path.join(...)) porque __dirname en la funcion empaquetada no coincide con la estructura original del proyecto."
keywords: [vercel, nestjs, serverless, bundle, includeFiles, nft, esbuild, lambda, dist]
changelog:
  - version: "1.0"
    date: 2026-06-08
    author: dev-ops-agent
    changes:
      - "Diagnostico completo del bug includeFiles en Vercel Lambda: causa raiz, analysis de cambios, y fix propuesto"
---

# Bugfix: includeFiles no incluye dist/ en Lambdas de Vercel

## Resumen Ejecutivo

**Todos los endpoints `/api/v1/*` retornan 500** porque el handler.js no puede cargar los modulos compilados de NestJS (`apps/api/dist/**`). La causa raiz es que `bundle: false` fue eliminado de `vercel.json` en el commit `90b550b`. Sin `bundle: false`, `@vercel/node` v3+ usa esbuild por defecto (`bundle: true`), lo que empaqueta las funciones serverless en un solo archivo JS. Esto cambia el valor de `__dirname`, por lo que `require(path.join(__dirname, "..", "dist", ...))` resuelve a una ruta incorrecta dentro del Lambda.

## Estado Actual de Endpoints

| Endpoint | Status | Response | Depende de dist/ |
|----------|--------|----------|------------------|
| `/_diag` | ✅ 200 | JSON env listing | No |
| `/_health` | ✅ 200 | `{"status":"ok"}` | No |
| `/_debug` | ❌ SPA HTML | Catch-all rewrite (Lambda no desplegada) | Si (includeFiles) |
| `/_test` | ❌ 500 | `FUNCTION_INVOCATION_FAILED` | Si (includeFiles) |
| `/api/v1/health` | ❌ 500 | FUNCTION_INVOCATION_FAILED | Si (includeFiles) |
| `/api/v1/auth/login` | ❌ 500 | FUNCTION_INVOCATION_FAILED | Si (includeFiles) |
| `/api/v1/*` | ❌ 500 | Todas las rutas API | Si (includeFiles) |
| `/_debug` (SPA) | ❌ 200 | HTML del frontend | N/A (catch-all) |
| `/` (SPA) | ✅ 200 | Frontend SPA | No (static build) |

## Causa Raiz

### Commit `90b550b` — Eliminación de `bundle: false`

El commit `90b550b` (autor: `=`, fecha: 2026-06-06) con mensaje:
> `fix: lazy-load NestJS in api/index.js to avoid cold start crash + remove bundle:false [build:ok]`

**Eliminó `"bundle": false` de todos los function configs en `vercel.json`**:

```diff
-        "includeFiles": "apps/api/dist/**",
-        "bundle": false
+        "includeFiles": "apps/api/dist/**"
```

### Mecanismo del Fallo

`@vercel/node` v3+ tiene `bundle: true` como **default**. Con esbuild bundling activo:

1. **esbuild empaqueta** handler.js, test.js, debug.js en un solo archivo JS cada uno
2. **`__dirname` cambia**: En la funcion empaquetada, `__dirname` apunta al directorio de salida de Vercel (ej: `.vercel/output/functions/api/handler.func/`), NO a `apps/api/api/`
3. **Ruta incorrecta**: `require(path.join(__dirname, "..", "dist", "app.module"))` resuelve a:
   - Real: `/var/task/.vercel/output/functions/api/handler.func/dist/app.module`
   - Esperado: `/var/task/apps/api/dist/app.module`
4. **`includeFiles` no ayuda**: Aunque `includeFiles: "apps/api/dist/**"` copia los archivos al directorio de la funcion, la ruta relativa `../dist` desde el bundled file no apunta ahi

### Por qué funciona con `bundle: false`

Con `bundle: false`, nft (Node File Trace) copia los archivos manteniendo la estructura original:

1. **nft no empaqueta**: Copia handler.js y dependencias tracedas manteniendo rutas relativas
2. **`__dirname` correcto**: handler.js esta en `apps/api/api/`, entonces `__dirname` es `/var/task/apps/api/api/`
3. **Ruta correcta**: `require(path.join(__dirname, "..", "dist", ...))` → `/var/task/apps/api/dist/...` ✅
4. **`includeFiles` complementa**: Los archivos de `apps/api/dist/**` se copian al mismo nivel que `apps/api/api/handler.js`

### Diferencia de Comportamiento entre Lambdas

| Funcion | Comportamiento | Explicacion |
|---------|---------------|-------------|
| `handler.js` | 500 (FUNCTION_INVOCATION_FAILED) | Lambda desplegada pero crash en require() |
| `test.js` | 500 (FUNCTION_INVOCATION_FAILED) | Lambda desplegada pero crash en require() |
| `debug.js` | SPA HTML (catch-all) | Lambda posiblemente no desplegada (build falla) |
| `diagnostic.js` | ✅ 200 | Sin includeFiles, no depende de dist/ |
| `health.js` | ✅ 200 | Sin includeFiles, no depende de dist/ |

La diferencia entre `test.js` (500) y `debug.js` (SPA HTML) probablemente se debe a que `debug.js` tiene un `require("fs")` y llamadas a `fs.readdirSync/statSync` que podrian causar un error de build diferente bajo esbuild. O Vercel maneja la caida de rewrite de forma distinta para `/_debug` vs `/_test`.

## Investigacion: "Error inesperado" en Login/Register

### Flujo de Error

1. Usuario hace login → `POST /api/v1/auth/login`
2. Vercel rewrites a `apps/api/api/handler.js`
3. Handler.js intenta `require(path.join(__dirname, "..", "dist", "app.module"))` → FALLA
4. Handler.js retorna **200** con body: `{ error: "init_failed", message: "Cannot find module...", stack: [...], diag: {...} }`
5. Axios trata 200 como exito → `AuthContext.login()` recibe `data = { error: "init_failed", ... }`
6. `data.tokens` es `undefined` → `setTokens(undefined)` lanza **TypeError**
7. El TypeError se propaga a `Login.tsx:handleSubmit()` catch block

### Mensaje que ve el usuario

**Dos posibles caminos:**

| Camino | HTTP Status | User sees |
|--------|------------|-----------|
| Handler.js catcha error y retorna 200 | 200 | `"Credenciales invalidas"` (Login.tsx:49) |
| Lambda crash total (FUNCTION_INVOCATION_FAILED) | 500 | Toast: `"Error del servidor. Intenta nuevamente."` (client.ts:79) + Banner: `"Credenciales invalidas"` (Login.tsx:49) |

Para **register**, el mensaje es `"Error al registrarse"` (Register.tsx:68).

### Bug secundario: handler.js retorna 200 para errores

El handler.js usa `respond()` que siempre retorna **200** incluso para errores, porque en Vercel Hobby los 5xx son interceptados y reemplazados por HTML generico:
```javascript
const respond = (body) => send(200, body);
```

Esto causa que:
- La capa de red (Axios) interpreta la respuesta como exitosa
- El error se manifiesta como un **TypeError en tiempo de ejecucion** en el frontend
- El usuario ve un mensaje confuso en lugar de un error de red claro
- El mensaje de error real del backend (e.g., "Cannot find module...") nunca llega al frontend

## Archivos Modificados vs Ultimo Build Estable

Comparacion entre `33eb792` (ultimo [build:ok]) y `HEAD`:

```
 CHANGELOG.md          |  7 +++++++
 apps/api/api/debug.js | 31 ++++++++++++++++++++++++++++++-
```

Solo cambios en debug.js (filesystem listing) y CHANGELOG. **vercel.json no ha cambiado** desde el ultimo build:ok — el bug ya existia en `33eb792`.

## Fix Propuesto

### 1. Restaurar `bundle: false` en vercel.json

Agregar `"bundle": false` a los tres function configs que usan `includeFiles`:

```json
{
  "src": "apps/api/api/handler.js",
  "use": "@vercel/node",
  "config": {
    "includeFiles": "apps/api/dist/**",
    "bundle": false
  }
},
{
  "src": "apps/api/api/test.js",
  "use": "@vercel/node",
  "config": {
    "includeFiles": "apps/api/dist/**",
    "bundle": false
  }
},
{
  "src": "apps/api/api/debug.js",
  "use": "@vercel/node",
  "config": {
    "includeFiles": "apps/api/dist/**",
    "bundle": false
  }
}
```

### 2. Consideracion alternativa: Restaurar outputDirectory

Si el problema persiste incluso con `bundle: false` (porque `includeFiles` sigue sin funcionar), considerar:

```json
"outputDirectory": "apps/web/dist"
```

Aunque esto se elimino en commit `9b263c7` porque "conflictaba con includeFiles", vale la pena probar esta combinacion:
- `outputDirectory: "apps/web/dist"` para que Vercel sirva el SPA correctamente
- `bundle: false` + `includeFiles: "apps/api/dist/**"` para los Lambdas

### 3. Verificacion

```bash
# 1. Verificar que el build local funciona
cd apps/api && npm run build

# 2. Desplegar a Vercel
vercel --prod

# 3. Verificar endpoints
curl https://<deploy>.vercel.app/api/v1/health
curl https://<deploy>.vercel.app/_test
curl https://<deploy>.vercel.app/_debug
curl -X POST https://<deploy>.vercel.app/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tienda.local","password":"Admin123!"}'
```

### 4. Bug secundario: Errores 200 en handler.js

Considerar cambiar handler.js para retornar codigos de error HTTP reales a pesar de la limitacion de Vercel Hobby. Opciones:

a) Retornar 503 Service Unavailable con headers para que Vercel no intercepte:
```javascript
res.writeHead(503, {
  'content-type': 'application/json',
  'cache-control': 'no-cache',
  'x-vercel-error': 'init_failed'
});
```

b) Mantener 200 pero incluir `error: true` en el body para que el frontend pueda distinguir:
```javascript
respond({ error: true, code: "init_failed", message: e.message, ... });
```

Y actualizar el interceptor de Axios para verificar `data.error`:
```typescript
client.interceptors.response.use(
  (response) => {
    if (response.data?.error) {
      return Promise.reject({ ...response, data: response.data });
    }
    return response;
  },
  // ...
);
```

## Lecciones Aprendidas

1. **`bundle: false` es obligatorio** cuando se usan `require()` con `path.join()` (expresiones dinamicas). Sin `bundle: false`, esbuild empaqueta la funcion y las rutas relativas dejan de funcionar. Los string literals en `require()` son trazables por nft; las expresiones dinamicas no.

2. **`build:ok` no implica deploy ok**: El commit `90b550b` y `33eb792` tienen `[build:ok]` porque `npm run build` pasa localmente. Pero el build de Vercel (que involucra bundling y deploy de Lambdas) es diferente. Separar `[build:ok]` local de `[deploy:ok]` en Vercel.

3. **No eliminar configuracion sin entender su proposito**: `bundle: false` se elimino porque se penso que no era necesario con lazy-loading. Pero el proposito de `bundle: false` no es solo para lazy-loading — es para mantener la estructura de directorios necesaria para `require()` con rutas relativas dinamicas.

4. **`__dirname` cambia con esbuild**: En funciones empaquetadas con esbuild, `__dirname` apunta al directorio de salida de Vercel, no al directorio original del archivo fuente. Cualquier `require()` con ruta relativa dinámica fallara.

## Referencias

| ID | Titulo |
|----|--------|
| 041 | [Bugfix: Error init_failed en backend NestJS en Vercel](./041_BUGFIX_BACKEND_INIT_1_0_DRAFT.md) |
| 057 | [Bugfix: Lambda crash y 404 en GET /api/v1/bot/status](./057_BUGFIX_BACKEND_LAMBDA_CRASH_1_0_DRAFT.md) |
| 059 | [Bugfix: PrismaClient crash en Vercel Lambda](./059_BUGFIX_BACKEND_PRISMA_VERCEL_1_0_DRAFT.md) |
