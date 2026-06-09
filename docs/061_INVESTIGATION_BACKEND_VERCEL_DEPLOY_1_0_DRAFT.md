---
id: 061
area: backend
type: INVESTIGATION
module: api
version: "1.0"
status: DRAFT
tags:
  - backend
  - deploy
  - vercel
  - serverless
  - lambda
  - nestjs
  - prisma
  - esbuild
  - nft
  - bundle
  - includeFiles
  - investigation
  - debugging
  - regression
summary: "Investigación completa de regresiones de build y runtime en el despliegue de NestJS en Vercel Lambda. Se documentan 3 sesiones de debugging que abarcan: (1) crash de PrismaClient por detección de caching de Vercel, (2) regresión de includeFiles + bundle:false que rompió rutas de require en Lambda, (3) Express 404 tras restaurar bundle:false por duplicación de inicialización de NestJS en handler.js. Se identificaron causas raíz, fixes aplicados, deployment issues, y lecciones aprendidas para prevenir recurrencias."
keywords:
  - vercel
  - nestjs
  - lambda
  - serverless
  - prisma
  - esbuild
  - nft
  - bundle
  - includeFiles
  - handler.js
  - createApp
  - ExpressAdapter
  - __dirname
  - postinstall
  - ciName
  - Vercel caching detection
  - Ba function
  - configOverride
  - fix-prisma-config
  - outputDirectory
  - deployment
  - regression
  - debugging
  - cold start
changelog:
  - version: "1.0"
    date: 2026-06-08
    author: dev-ops-agent
    changes:
      - "Documento de investigacion completo que sintetiza 3 sesiones de debugging de regresiones de build/deploy de NestJS en Vercel Lambda, incluyendo timeline, causas raíz, soluciones aplicadas y lecciones aprendidas"
---

# Investigación: Regresiones de Build y Deploy de NestJS en Vercel Lambda

## 1. Executive Summary

Este documento sintetiza tres sesiones de debugging realizadas entre el **6 y 8 de junio de 2026** para diagnosticar y reparar un conjunto de regresiones encadenadas que dejaron inoperativa la API de NestJS (`@tienda/api`) desplegada en Vercel Lambda.

### Síntomas observados en producción

| Síntoma | Endpoints afectados | Período |
|---------|---------------------|---------|
| `PrismaClientInitializationError` ("built on Vercel") | Todos `/api/v1/*` | Session 1 (Jun 6-7) |
| `FUNCTION_INVOCATION_FAILED` (MODULE_NOT_FOUND) | Todos `/api/v1/*` | Session 2 (Jun 8) |
| Express 404 `Cannot GET /api/v1/health` | Todos `/api/v1/*` | Session 3 (Jun 8) |
| "Error inesperado" en frontend | Login, Register, Catalog | Cross-cutting (Jun 6-8) |

### Causa raíz unificada

Una cadena de **3 regresiones independientes pero encadenadas**:

1. **Prisma 5.22.0** introduce función `Ba()` que lanza excepción en Vercel si detecta `postinstall: true` + `ciName: "Vercel"`
2. **Commit `90b550b`** elimina `bundle: false` de `vercel.json`, activando esbuild bundling que rompe `__dirname` y las rutas de `require('../../dist/...')`
3. **Fix parcial de handler.js** duplica inicialización de NestJS inline (sin usar la función `createApp()` probada de `dist/main`), resultando en routes no registradas → Express 404

### Estado final

- ✅ `bundle: false` restaurado en `vercel.json` (commit `01fbcef`)
- ✅ `handler.js` reescrito para usar `createApp(adapter)` desde `dist/main` (commit `236d94a`)
- ✅ Prisma patcheado via `node -e` script en `installCommand`
- ✅ `outputDirectory` eliminado de `vercel.json` (commit `9b263c7`)
- ⚠️ Fix de Prisma (patch local) nunca desplegado — el deploy se hace desde git, no desde archivos locales

---

## 2. Timeline of Events

### Fase 0: Despliegue inicial funcional

| Fecha | Evento | Detalle |
|-------|--------|---------|
| 2026-06-01 | Primer deploy funcional | NestJS con `bundle: false` + `includeFiles`. Handler.js usa `require("../dist/main")`. Ratas relativas funcionan con nft. |
| 2026-06-01 | Documentación bug inicial | `041_BUGFIX_BACKEND_INIT_1_0_DRAFT.md` documenta error `init_failed` y solución con `bundle: false` + path fallback. |

### Session 1: Prisma Vercel Crash (Jun 6-7, 2026)

| Fecha/Hora | Commit | Evento |
|------------|--------|--------|
| Jun 6 19:06 | `6aec65c` | Build-time `PRISMA_CLIENT_ENGINE_TYPE` y limpieza de prisma.service.ts |
| Jun 6 19:15 | `6d51dac` | Simplificación de api/index.js |
| Jun 6 19:18 | `c3d90d2` / `38fb43b` | Reconfiguración builds → functions |
| Jun 6 19:19 | `90b550b` | **Lazy-load NestJS + elimina `bundle:false`** ← Regresión clave |
| Jun 6 19:21 | `3234b1e` | Rename index.js → handler.js |
| Jun 6 19:23 | `5468f4b` | Test sin includeFiles |
| Jun 6 19:26 | `c18c7a9` | includeFiles solo .js |
| Jun 6 19:27-20:01 | Múltiples commits | Aislamiento de crash — se descubre que `new PrismaClient()` causa SEGFAULT |
| Jun 6 20:01 | `eceec6c` | **Proxy lazy en PrismaService (evita SEGFAULT)** |
| Jun 6 20:35 | `372969d` | Debug: `_debug` endpoint añadido |
| Jun 7 09:03 | `9fc86f8` | Fix: `__decorate` crash evitado con function calls directas |
| Jun 7 09:08 | `fa75822` | Fix: `||` fallback para preservar class reference en Module decorator |
| Jun 7 09:46 | `60f45d9` | Scripts deploy:preview y deploy:prod añadidos |
| Jun 7 09:47 | `db95613` | Fix: remove `--token` flag |
| Jun 7 09:49-10:12 | Múltiples commits | **Bisecado de crash**: Se descubre que PrismaClient lanza `Ba()` — función de detección de caching de Vercel |
| Jun 7 10:12 | `fc33987` | **Fix temporal**: handler.js con creación inline de NestJS, bypass de dist/main.js |
| Jun 7 10:13-10:22 | Múltiples commits | Tests de módulo mínimo, inline AppModule |
| Jun 7 10:22 | `da2db45` | Restaura extends PrismaClient, elimina Proxy |
| Jun 7 10:56 | `1f8af42` | **Intento fix Prisma**: `configOverride` en PrismaService — **NO funciona** (orden incorrecto) |
| Jun 8 22:02 | `e63ba5e` | **Fix Prisma definitivo**: `fix-prisma-config.js` con node -e script + restore extends PrismaClient |
| Jun 8 22:02 | `6a6a6ce` | Remove nested `apps/api/vercel.json` |
| Jun 8 22:04 | `fb3847b` | Docs + changelog |

### Session 2: includeFiles + bundle:false Discovery (Jun 8, 2026)

| Fecha/Hora | Commit | Evento |
|------------|--------|--------|
| Jun 8 22:27 | `9b263c7` | **Fix outputDirectory**: removido de vercel.json para desbloquear includeFiles |
| Jun 8 22:28 | `33eb792` | Changelog update [build:ok] |
| Jun 8 22:45 | `02d936c` | **Feature**: filesystem tree listing en _debug endpoint (diagnóstico de Lambda) |
| Jun 8 22:45 | `419fcb5` | Changelog update |
| Jun 8 23:05 | `01fbcef` | **Fix bundle:false**: restaurado en vercel.json |
| Jun 8 23:25 | `236d94a` | **Fix handler.js**: usar `createApp(adapter)` desde dist/main |

### Session 3: Express 404 Post-bundle:false (Jun 8, 2026)

| Fecha/Hora | Commit | Evento |
|------------|--------|--------|
| Jun 8 23:05 | `01fbcef` | `bundle:false` restaurado → dist files se cargan correctamente |
| Jun 8 ~23:10 | — | Test muestra: `_test` y `_debug` endpoints funcionan, pero `/api/v1/*` retorna Express 404 |
| Jun 8 ~23:15 | — | `x-request-id` header presente → NestJS middleware se ejecuta pero rutas no registradas |
| Jun 8 23:25 | `236d94a` | **Fix**: handler.js reescrito para usar `createApp(adapter)` de `dist/main` |

### Vercel Deployment Issue (Cross-cutting)

| Fecha | Evento |
|-------|--------|
| Todo el período | Producción (`tienda-online-jair08-zped08s-projects.vercel.app`) **no se actualizaba** con nuevos deploys |
| Todo el período | Deploys disponibles solo en preview URL (`tienda-online-git-main-zped08s-projects.vercel.app`) |
| — | **Causa**: Auto-deploy creaba deployments pero no los promocionaba al alias de producción |

---

## 3. Detailed Findings Per Session

### 3.1 Session 1: Prisma Vercel Crash

#### 3.1.1 Síntoma

Durante `NestFactory.create(AppModule)`, `new PrismaClient()` lanza:

```
PrismaClientInitializationError:
Prisma has detected that this project was built on Vercel.
The generated Prisma Client was downloaded specifically for Vercel's
serverless environments or was built with the wrong engine type.
```

#### 3.1.2 Causa Raíz

Prisma 5.22.0 incluye una función **`Ba()`** en `@prisma/client/runtime/library.js` que verifica el **config estático** del archivo generado `.prisma/client/index.js`:

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

Cuando `prisma generate` se ejecuta en el entorno Vercel (con `VERCEL` env var presente), el archivo generado incluye:

```javascript
var config = {
  "postinstall": true,    // ← detonante 1
  ciName: "Vercel",       // ← detonante 2
  // ...
};
```

#### 3.1.3 Fixes Intentados

| # | Approach | Resultado |
|---|----------|-----------|
| 1 | `__internal.configOverride` en PrismaService | ❌ **Falla**: `Ba()` se ejecuta **antes** de procesar `configOverride`. El override nunca modifica el config que `Ba()` evalúa. |
| 2 | `unset VERCEL && npx prisma generate` en installCommand | ❌ **Falla**: `prisma generate` posiblemente no se re-ejecuta por build cache, o `VERCEL` se re-establece. |
| 3 | `sed -i 's/"postinstall": true/"postinstall": false/'` en installCommand | ❌ **Falla**: El patrón JSON de `sed` no coincide con la sintaxis JS real del archivo generado (espacios variables, comillas). |
| 4 | **Proxy lazy**: PrismaService con Proxy que difiere `new PrismaClient()` | ✅ **Funciona** como workaround para SEGFAULT, pero no resuelve el error de `Ba()` |
| 5 | **`node -e` patch script**: Regex JS para modificar `postinstall` y `ciName` | ✅ **Fix definitivo**: script `fix-prisma-config.js` parchea el archivo generado después de `prisma generate` |

#### 3.1.4 Bug en fix-prisma-config.js

El script `fix-prisma-config.js` (nunca desplegado porque el deploy es desde git, no desde archivos locales) tenía:

```javascript
// fix-prisma-config.js (versión inicial)
// Salió con código de salida 1 porque el patrón no coincidía
```

El fix definitivo en `installCommand`:
```bash
node -e "const fs=require('fs');const p='node_modules/.prisma/client/index.js';let c=fs.readFileSync(p,'utf8');c=c.replace(/postinstall:\\s*true/g,'postinstall: false');c=c.replace(/ciName:\\s*['\"]Vercel['\"]/g,'ciName: undefined');fs.writeFileSync(p,c);"
```

---

### 3.2 Session 2: includeFiles + bundle:false Discovery

#### 3.2.1 Síntoma

Todos los endpoints `/api/v1/*` retornan **500 FUNCTION_INVOCATION_FAILED**. Endpoints `_health`, `_diag` (sin dependencia de dist/) funcionan. Endpoints `_test` y `_debug` (con includeFiles) retornan 500.

#### 3.2.2 Causa Raíz

El commit **`90b550b`** (Jun 6 19:19) con mensaje:

> `fix: lazy-load NestJS in api/index.js to avoid cold start crash + remove bundle:false [build:ok]`

**Eliminó `"bundle": false` de todos los function configs en `vercel.json`:**

```diff
-        "includeFiles": "apps/api/dist/**",
-        "bundle": false
+        "includeFiles": "apps/api/dist/**"
```

#### 3.2.3 Mecanismo del Fallo

| Estado | Bundler | `__dirname` | Resultado |
|--------|---------|-------------|-----------|
| `bundle: true` (default) | esbuild | Apunta a `.vercel/output/functions/.../` | `require('../dist/...')` resuelve a ruta incorrecta ❌ |
| `bundle: false` | nft (Node File Trace) | Apunta a `apps/api/api/` (estructura original) | `require('../dist/...')` resuelve correctamente ✅ |

Con **esbuild bundling** activo:
1. esbuild empaqueta handler.js en un solo archivo JS
2. `__dirname` cambia al directorio de salida de Vercel (`.vercel/output/functions/api/handler.func/`)
3. `require(path.join(__dirname, "..", "dist", "app.module"))` resuelve a:
   - Real: `/var/task/.vercel/output/functions/api/handler.func/dist/app.module` ❌
   - Esperado: `/var/task/apps/api/dist/app.module` ✅
4. `includeFiles` copia los archivos, pero la ruta relativa desde el bundled file no apunta a donde se copiaron

Con **nft** (`bundle: false`):
1. nft copia handler.js y dependencias manteniendo estructura original
2. `__dirname` es `/var/task/apps/api/api/` (correcto)
3. `require('../dist/...')` → `/var/task/apps/api/dist/...` ✅

#### 3.2.4 Comportamiento de Endpoints

| Endpoint | Status | Explicación |
|----------|--------|-------------|
| `/_health` | ✅ 200 | Handler directo, sin includeFiles, sin dist/ |
| `/_diag` | ✅ 200 | Handler directo, sin includeFiles, sin dist/ |
| `/_test` | ❌ 500 | Depende de dist/, includeFiles no funciona con bundle:true |
| `/_debug` | ❌ 200 SPA | Catch-all rewrite (Lambda falla, rewrite a index.html) |
| `/api/v1/*` | ❌ 500 | Todos dependen de dist/, bundle:true rompe rutas |

#### 3.2.5 outputDirectory Conflict

El commit `9b263c7` removió `outputDirectory: "apps/web/dist"` de `vercel.json`. Esta directiva:
- Hace que Vercel espere contenido estático **antes** de ejecutar el build personalizado
- Las rewrites que apuntan a `/apps/web/dist/index.html` fallan porque Vercel maneja el directorio de salida de forma diferente
- Sin `outputDirectory`, las rewrites funcionan correctamente porque Vercel sirve todo el repositorio como sistema de archivos virtual

---

### 3.3 Session 3: Express 404 After bundle:false Fix

#### 3.3.1 Síntoma

Después de restaurar `bundle: false` (commit `01fbcef`), los archivos dist se cargan correctamente: `_test` funciona, `_debug` funciona. Pero **todos los endpoints `/api/v1/*` retornan Express 404**:

```
Cannot GET /api/v1/health
Cannot GET /api/v1/auth/login
Cannot POST /api/v1/auth/login
```

#### 3.3.2 Evidencia Clave

- Header `x-request-id` **SÍ presente** en la respuesta → NestJS middleware se está ejecutando
- Pero el body es HTML plano de Express: `Cannot GET /api/v1/health`
- → NestJS se inicializa (middleware global se registra) pero **las rutas de los módulos no se registran** en la instancia de Express

#### 3.3.3 Causa Raíz

**Handler.js duplicaba la inicialización de NestJS inline** en lugar de usar la función `createApp()` probada desde `dist/main`.

El handler.js post-fix `fc33987` (Jun 7 10:12) contenía ~64 líneas de código de inicialización que replicaban (y se desviaban de) la función `createApp()` en `apps/api/src/main.ts`:

```javascript
// Handler.js — código inline problemático (aproximado)
const app = await NestFactory.create(AppModule, adapter, { bufferLogs: true });
app.setGlobalPrefix('api/v1');
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
// ... Swagger, CORS, helmet, etc.
```

Mientras que `dist/main.ts` exporta:

```typescript
// main.ts — la función probada
export async function createApp(adapter?: AbstractHttpAdapter): Promise<INestApplication> {
  const app = adapter
    ? await NestFactory.create(AppModule, adapter, { bufferLogs: true })
    : await NestFactory.create(AppModule, { bufferLogs: true });
  // ... global prefix, pipes, filters, CORS, Swagger, helmet, middleware ...
  return app;
}
```

**Problemas con la inicialización inline:**

1. **Duplicación de configuración**: Cualquier cambio en `main.ts.createApp()` requería cambios同步 en handler.js
2. **Inconsistencia**: La versión inline no registraba correctamente las rutas en la instancia de ExpressAdapter
3. **Mantenimiento imposible**: Dos fuentes de verdad para la misma inicialización

#### 3.3.4 Fix

Handler.js reescrito para cargar `createApp` desde `dist/main` y delegar toda la inicialización:

```javascript
// Handler.js — fix (commit 236d94a)
const { ExpressAdapter } = require("@nestjs/platform-express");
const { createApp } = require(path.join(__dirname, "..", "dist", "main"));

const adapter = new ExpressAdapter();
app = await createApp(adapter);

// Register a direct test route bypassing NestJS routing
const instance = adapter.getInstance();
instance.get("/direct-test", (_req2, _res2) => _res2.json({ status: "direct_ok" }));
```

Eliminando ~64 líneas de código duplicado.

---

### 3.4 Error Inesperado en Frontend (Cross-cutting)

#### 3.4.1 Síntoma

Usuario reporta "Error inesperado" al hacer login, register, o al navegar por el catálogo.

#### 3.4.2 Flujo de Error

```
POST /api/v1/auth/login
  → Vercel rewrite → handler.js
    → init_failed / Lambda crash
      → Handler.js retorna 200 con { error: "init_failed", ... }
        → Axios (client.ts) trata 200 como éxito
          → AuthContext.login() recibe data sin tokens
            → setTokens(undefined) → TypeError
              → Login.tsx catch block → "Credenciales inválidas"

GET /api/v1/catalog/products
  → Lambda crash / Express 404
    → Axios interceptor (client.ts:78-79)
      → Toast "Error del servidor. Intenta nuevamente."
        → ProductList.tsx:127 accede data.items en respuesta inesperada
          → TypeError → ErrorBoundary.tsx:55 → "Ocurrió un error inesperado"
```

#### 3.4.3 Bug secundario: handler.js retorna 200 para errores

```javascript
const respond = (body) => send(200, body);  // Siempre 200
```

Razón: En Vercel Hobby, los 5xx son interceptados y reemplazados por HTML genérico. Pero esto causa que:
- Axios interpreta respuestas de error como exitosas
- El error se manifiesta como TypeError en runtime del frontend
- El usuario ve mensajes confusos ("Credenciales inválidas" cuando el backend ni siquiera cargó)

---

### 3.5 Vercel Deployment Issue

#### 3.5.1 Síntoma

La URL de producción (`tienda-online-jair08-zped08s-projects.vercel.app`) **no reflejaba los nuevos deploys**. Los cambios solo eran visibles en la URL de preview (`tienda-online-git-main-zped08s-projects.vercel.app`).

#### 3.5.2 Causa

Vercel auto-deploy creaba nuevos deployments en cada push a `main`, pero **no los promocionaba al alias de producción**. Esto puede deberse a:

1. Configuración de Git Branch: El proyecto puede no tener `main` como rama de producción en Vercel
2. GitHub Actions: Si el deploy se hace via CI, puede que el workflow no incluya el flag `--prod`
3. Vercel Dashboard: El alias de producción puede estar desvinculado o mal configurado

---

## 4. Root Cause Analysis (Chain of Failures)

### 4.1 Diagrama de Causa-Efecto

```
[Prisma 5.22 Ba() function]
       ↓
PrismaClientInitializationError en Vercel
       ↓
Commit 90b550b: "fix: lazy-load NestJS + remove bundle:false"
       ↓
       ├── Elimina bundle:false → esbuild bundling activado
       │       ↓
       │   __dirname cambia → require(../dist/...) falla
       │       ↓
       │   MODULE_NOT_FOUND → 500 FUNCTION_INVOCATION_FAILED
       │
       └── Lazy-loading: handler.js con creación inline
               ↓
           Commit fc33987: "rewrite handler with inline NestJS creation"
               ↓
           Inicialización duplicada y divergente de main.ts
               ↓
           Rutas no registradas → Express 404
               ↓
           x-request-id presente (middleware funciona) pero sin routes

[Vercel Deploy Issue]
       ↓
  Producción no actualizada → fixes nunca llegan a prod URL
       ↓
  Sesiones de debugging usando preview URL en lugar de prod
```

### 4.2 Factores Contribuyentes

1. **Falta de entornos diferenciados**: No existía un entorno de staging/qa. Todos los fixes se probaban directamente contra producción (o preview).
2. **Commit `[build:ok]` no garantiza deploy ok**: El build local (`npm run build`) compila TypeScript, pero Vercel tiene su propio proceso de build (esbuild bundling, nft tracing, deployment de Lambdas). Un build local exitoso no implica que el deploy funcione.
3. **Sin tests de integración en Vercel**: No había forma automatizada de verificar que el handler.js funcionaba correctamente en el entorno Lambda antes del deploy.
4. **Múltiples fuentes de verdad para inicialización**: `main.ts.createApp()` y handler.js tenían código duplicado de inicialización de NestJS, lo que llevó a divergencia.

### 4.3 Concurrencia de Problemas

| Componente | Problema | Commit que lo introdujo | Commit que lo fixeó |
|------------|----------|------------------------|---------------------|
| Prisma | `Ba()` detection | Prisma 5.22.0 | `e63ba5e` + fix-prisma-config.js |
| vercel.json | bundle:false eliminado | `90b550b` | `01fbcef` |
| handler.js | Inicialización inline duplicada | `fc33987` | `236d94a` |
| vercel.json | outputDirectory conflictivo | Anterior a `9b263c7` | `9b263c7` |
| Vercel Deploy | Producción no actualizada | Configuración de proyecto | Pendiente |

---

## 5. Solutions Applied

### 5.1 Fixes en Código

| ID | Archivo | Cambio | Commit |
|----|---------|--------|--------|
| F1 | `vercel.json` | Restaurar `"bundle": false` en handler.js, test.js, debug.js | `01fbcef` |
| F2 | `vercel.json` | Eliminar `"outputDirectory": "apps/web/dist"` | `9b263c7` |
| F3 | `apps/api/api/handler.js` | Usar `createApp(adapter)` desde `dist/main` en lugar de inicialización inline | `236d94a` |
| F4 | `vercel.json` (installCommand) | `node -e` script para patch de Prisma postinstall/ciName | `e63ba5e` |
| F5 | `apps/api/src/prisma/prisma.service.ts` | Restaurar `extends PrismaClient` (eliminar Proxy) | `e63ba5e` |
| F6 | `vercel.json` (installCommand) | `PRISMA_SKIP_POSTINSTALL_GENERATE=true` para evitar generación doble | `e63ba5e` |

### 5.2 Fixes en Configuración

| ID | Cambio | Detalle |
|----|--------|---------|
| C1 | Vercel Project Settings | Verificar que `main` esté configurada como rama de producción |
| C2 | GitHub Actions | Asegurar que `vercel --prod` se use en CI para promocionar a producción |
| C3 | Vercel Dashboard | Verificar alias de producción y desvinculación |

### 5.3 Fixes Pendientes

| ID | Pendiente | Prioridad |
|----|-----------|-----------|
| P1 | Fix de Prisma (fix-prisma-config.js) desplegado desde git (no local) | Alta |
| P2 | Verificar que producción URL se actualice tras deploy | Alta |
| P3 | Considerar cambiar handler.js para retornar errores HTTP reales (503) en lugar de 200 con error body | Media |
| P4 | Actualizar interceptor de Axios para detectar `data.error` en respuestas 200 | Media |

---

## 6. Lessons Learned

### 6.1 Técnicas

1. **`bundle: false` es obligatorio para require() dinámicos**: Cuando se usan `require()` con `path.join()` (expresiones dinámicas), `bundle: false` es indispensable. Sin él, esbuild empaqueta la función y `__dirname` cambia, rompiendo rutas relativas. Los string literals en `require()` son trazables por nft; las expresiones dinámicas no.

2. **`build:ok` no implica deploy ok**: El commit puede tener `[build:ok]` porque `npm run build` pasa localmente, pero el build de Vercel (esbuild bundling, nft tracing, deployment de Lambdas) es un proceso diferente. Separar `[build:ok]` (build local) de `[deploy:ok]` (deploy en Vercel verificado).

3. **Siempre verificar el orden de ejecución en código fuente real**: `configOverride` sonaba prometedor para el fix de Prisma, pero operaba en el orden incorrecto (`Ba()` se ejecuta antes). Siempre verificar el orden real de ejecución en el código.

4. **nft solo traza string literals**: Nunca reemplazar `require("../dist/main")` por `require(path.join(...))` en entry points serverless de Vercel. Mantener SIEMPRE un `require()` con string literal para nft tracing.

5. **Una sola fuente de verdad para inicialización de NestJS**: La función `createApp()` en `main.ts` debe ser el único lugar donde se configura la aplicación NestJS. handler.js debe importarla y llamarla, no duplicar su lógica.

### 6.2 De Proceso

6. **No eliminar configuración sin entender su propósito**: `bundle: false` se eliminó porque se pensó que no era necesario con lazy-loading. Pero el propósito de `bundle: false` no es solo lazy-loading — es mantener la estructura de directorios necesaria para `require()` con rutas relativas dinámicas.

7. **Los parches locales no sirven si el deploy es desde git**: El `fix-prisma-config.js` (archivo local) nunca se desplegó porque Vercel deploya desde el repositorio git, no desde archivos locales. El fix debe estar en el `installCommand` de `vercel.json` o en un script commiteado.

8. **Verificar que el patrón de `sed` realmente coincide**: Usar `grep` para validar antes de deploy. `node -e` con regex es más confiable que `sed` para parchear código generado.

9. **Emergency bypass como safety net**: Tener una ruta directa en handler.js para endpoints críticos (`/bot/status`) permite que sigan funcionando aunque NestJS no cargue.

10. **outputDirectory contradictorio**: En Vercel, cuando se usan builds personalizados con `buildCommand`, no usar `outputDirectory` a menos que sea estrictamente necesario. Las rewrites a paths absolutos funcionan sin esa directiva.

---

## 7. Recommendations for Future

### 7.1 Inmediatas

1. **Implementar `[deploy:ok]`**: Además de `[build:ok]`, agregar un marcador `[deploy:ok]` para commits que han sido verificados mediante deploy exitoso en Vercel.

2. **Script de verificación post-deploy**: Crear un script que después de `vercel --prod` verifique:
   ```bash
   curl -f https://<url>/_health && \
   curl -f https://<url>/_diag && \
   curl -f https://<url>/api/v1/health && \
   curl -f -X POST https://<url>/api/v1/auth/login \
     -H 'Content-Type: application/json' \
     -d '{"email":"admin@tienda.local","password":"Admin123!"}'
   ```

3. **Configurar entorno de staging en Vercel**: Crear un preview deployment automático para PRs y un entorno de staging para la rama `main` antes de promover a producción.

4. **Arreglar Vercel Production Alias**: Verificar en el Dashboard de Vercel que el alias de producción esté correctamente vinculado y que los deploys desde `main` se promocionen automáticamente.

### 7.2 Mediano Plazo

5. **Tests de integración contra Lambda**: Implementar tests que ejecuten handler.js localmente con un emulador de Vercel Lambda (ej: `@vercel/node` dev server) para detectar regresiones antes del deploy.

6. **GitHub Actions health check**: En el workflow de CI, después del deploy, ejecutar health checks contra la URL desplegada y hacer rollback automático si fallan.

7. **Documentar el "Vercel Deployment Playbook"**: Crear un documento con el procedimiento paso a paso para debuggear fallos de deploy en Vercel, incluyendo:
   - Cómo verificar logs de Lambda en Vercel Dashboard
   - Cómo usar los endpoints `_test`, `_debug`, `_diag`, `_health`
   - Cómo interpretar errores de esbuild vs nft
   - Cómo verificar qué archivos están en el bundle de Lambda

8. **Separar build local de build Vercel**: Usar Docker o un script local que emule el proceso de build de Vercel (esbuild con `bundle: true`/`false`) para detectar problemas de rutas antes del deploy.

### 7.3 Largo Plazo

9. **Migrar a `@vercel/node` v4+**: Evaluar si versiones más recientes de `@vercel/node` tienen mejor soporte para `includeFiles` o si ofrecen alternativas a `bundle: false`.

10. **Considerar serverless framework alternativo**: Si los problemas de Vercel persisten, evaluar opciones como AWS Lambda + API Gateway con Serverless Framework, o usar Docker containers en lugar de serverless functions.

---

## 8. Appendix

### 8.1 Commits Relevantes

| SHA | Mensaje | Fecha |
|-----|---------|-------|
| `90b550b` | `fix: lazy-load NestJS in api/index.js to avoid cold start crash + remove bundle:false [build:ok]` | 2026-06-06 19:19 |
| `fc33987` | `fix: rewrite handler with inline NestJS creation bypassing dist/main.js [build:ok]` | 2026-06-07 10:12 |
| `9b263c7` | `fix: remove outputDirectory to unblock includeFiles for Lambda builds, fix fix-prisma-config.js exit code [build:ok]` | 2026-06-08 22:27 |
| `33eb792` | `docs: update changelog for outputDirectory removal fix [build:ok]` | 2026-06-08 22:28 |
| `01fbcef` | `fix: restore bundle:false in vercel.json to preserve __dirname paths for require(../dist/...)` | 2026-06-08 23:05 |
| `236d94a` | `fix: use createApp(adapter) from dist/main in handler.js to fix Express 404 on API routes` | 2026-06-08 23:25 |

### 8.2 URLs de Producción

| Recurso | URL |
|---------|-----|
| Aplicación unificada | `https://tienda-online-jair08-zped08s-projects.vercel.app` |
| API Backend | `https://tienda-online-jair08-zped08s-projects.vercel.app/api/v1` |
| Health check rápido | `https://tienda-online-jair08-zped08s-projects.vercel.app/_health` |
| Health check completo | `https://tienda-online-jair08-zped08s-projects.vercel.app/api/v1/health` |
| Diagnóstico | `https://tienda-online-jair08-zped08s-projects.vercel.app/_diag` |
| Test endpoint | `https://tienda-online-jair08-zped08s-projects.vercel.app/_test` |
| Debug endpoint | `https://tienda-online-jair08-zped08s-projects.vercel.app/_debug` |
| Preview (git-main) | `https://tienda-online-git-main-zped08s-projects.vercel.app` |

### 8.3 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `vercel.json` | Configuración de build, installCommand, rewrites, headers |
| `apps/api/api/handler.js` | Entry point serverless para rutas `/api/v1/*` |
| `apps/api/api/test.js` | Entry point para `/_test` (diagnóstico de carga de módulos) |
| `apps/api/api/debug.js` | Entry point para `/_debug` (diagnóstico de filesystem en Lambda) |
| `apps/api/api/health.js` | Entry point para `/_health` (health check sin dependencias) |
| `apps/api/api/diagnostic.js` | Entry point para `/_diag` (diagnóstico de env vars) |
| `apps/api/src/main.ts` | Bootstrap de NestJS + export de `createApp()` |
| `apps/api/src/prisma/prisma.service.ts` | Servicio de Prisma (extiende PrismaClient) |
| `apps/api/src/app.module.ts` | Módulo raíz de NestJS |
| `apps/api/api/fix-prisma-config.js` | Script para parchear Prisma postinstall (no desplegado) |

### 8.4 Comandos de Verificación

```bash
# Build local
cd apps/api && npm run build

# Verificar endpoints (usar preview URL después del deploy)
curl https://<preview-url>/_health
curl https://<preview-url>/_diag
curl https://<preview-url>/_test
curl https://<preview-url>/_debug
curl https://<preview-url>/api/v1/health

# Login de prueba
curl -X POST https://<preview-url>/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tienda.local","password":"Admin123!"}'

# Verificar que la ruta direct-test funciona
curl https://<preview-url>/direct-test

# Deploy a producción
cd /path/to/repo && vercel --prod
```

### 8.5 Referencias Cruzadas

| ID | Título | Archivo |
|----|--------|---------|
| 041 | Bugfix: Error init_failed en backend NestJS en Vercel | `041_BUGFIX_BACKEND_INIT_1_0_DRAFT.md` |
| 049 | Plan de Deploy en Vercel | `049_EXEC_DEPLOY_VERCEL_1_0_DRAFT.md` |
| 057 | Bugfix: Lambda crash y 404 en GET /api/v1/bot/status | `057_BUGFIX_BACKEND_LAMBDA_CRASH_1_0_DRAFT.md` |
| 058 | ADR — Deploy Flow Vercel | `058_ADR_DEPLOY_FLOW_VERCEL_1_0_DRAFT.md` |
| 059 | Bugfix: PrismaClient crash en Vercel Lambda | `059_BUGFIX_BACKEND_PRISMA_VERCEL_1_0_DRAFT.md` |
| 060 | Bugfix: includeFiles no incluye dist/ en Lambdas de Vercel | `060_BUGFIX_BACKEND_INCLUDEFILES_1_0_DRAFT.md` |
| 061 | Investigación: Regresiones de Build y Deploy (este documento) | `061_INVESTIGATION_BACKEND_VERCEL_DEPLOY_1_0_DRAFT.md` |
