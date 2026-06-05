---
id: 049
area: architecture
type: EXEC
module: monorepo
version: 1.0
status: ACTIVE
tags:
  - monorepo
  - vercel
  - deploy
  - serverless
  - routing
  - production
summary: "Documentacion de la Fase 6 (Deploy en Vercel) del plan de migracion monorepo. Incluye analisis de configuracion vercel.json, verificación de serverless entry points, routing map y procedimiento de deploy."
keywords:
  - monorepo
  - vercel
  - deploy
  - serverless
  - nestjs
  - vite
  - routing
  - produccion
changelog:
  - version: 1.0
    date: 2026-06-03
    author: vercel-deploy-agent
    description: Creacion del reporte de Fase 6 — Deploy en Vercel
  - version: 1.1
    date: 2026-06-03
    author: workflow-agent
    description: Deploy exitoso — fix 404 agregando @vercel/static y corrigiendo rewrites a /apps/web/dist/index.html
---

# Fase 6: Deploy en Vercel — @tienda/api

## 1. Resumen ejecutivo

Se analizó y verificó la configuración de Vercel para el despliegue del monorepo `@tienda/monorepo`, que contiene dos aplicaciones:

| App | Tecnología | Output | URL |
| --- | ---------- | ------ | --- |
| **Backend API** (`apps/api/`) | NestJS 11 + Prisma + PostgreSQL (Neon) + Redis (Upstash) | Serverless Functions (`@vercel/node`) | `https://tienda-online-zped08s-projects.vercel.app/api/v1/*` |
| **Frontend SPA** (`apps/web/`) | Vite 6 + React 19 + Tailwind 4 | Static files (`apps/web/dist/`) | `https://tienda-frontend-self.vercel.app/*` |

El deploy es **un solo proyecto Vercel** con un `vercel.json` en la raíz que define el pipeline completo: instalación de dependencias de ambas apps, build secuencial (Prisma Generate → NestJS Build → Vite Build), y routing.

---

## 2. Configuración Vercel

### 2.1 Root `/vercel.json`

Archivo único de configuración (los archivos `apps/api/vercel.json` y `apps/web/vercel.json` son heredados de la arquitectura pre-monorepo y **no son utilizados** por Vercel cuando existe un `vercel.json` raíz).

```json
{
  "installCommand": "cd apps/api && npm ci --include=dev && cd ../../apps/web && npm ci --include=dev",
  "buildCommand": "cd apps/api && npx prisma generate && cd ../.. && npm run build",
  "outputDirectory": "apps/web/dist",
  "builds": [
    {
      "src": "apps/api/api/diagnostic.js",
      "use": "@vercel/node"
    },
    {
      "src": "apps/api/api/health.js",
      "use": "@vercel/node"
    },
    {
      "src": "apps/api/api/index.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": "apps/api/dist/**",
        "bundle": false
      }
    }
  ],
  "rewrites": [
    { "source": "/_diag",       "destination": "apps/api/api/diagnostic.js" },
    { "source": "/_health",     "destination": "apps/api/api/health.js" },
    { "source": "/api/(.*)",    "destination": "apps/api/api/index.js" },
    { "source": "/(.*)",        "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options",        "value": "DENY" },
        { "key": "X-XSS-Protection",       "value": "1; mode=block" }
      ]
    }
  ]
}
```

### 2.2 Análisis de cada campo

#### `installCommand`
- **Valor**: `cd apps/api && npm ci --include=dev && cd ../../apps/web && npm ci --include=dev`
- **Análisis**: Correcto. Primero instala dependencias de `apps/api/` (incluyendo devDependencies necesarias para `nest build`, `prisma generate`, etc.), luego sube dos niveles (`../../`) para llegar a la raíz y entra a `apps/web/` para instalar las del frontend.
- **Verificación de paths**: 
  - Desde raíz → `apps/api` → OK
  - Desde `apps/api` → `../../apps/web` → raíz → `apps/web` → OK

#### `buildCommand`
- **Valor**: `cd apps/api && npx prisma generate && cd ../.. && npm run build`
- **Análisis**: Correcto. Genera Prisma Client dentro de `apps/api/`, luego sube a raíz y ejecuta `npm run build` (que corre `build:api && build:web`).
- **Pipeline**:
  1. `npx prisma generate` → genera `@prisma/client` en `apps/api/node_modules/.prisma/client/`
  2. `npm run build:api` → `cd apps/api && npm run build` → `nest build` → output en `apps/api/dist/`
  3. `npm run build:web` → `cd apps/web && npm run build` → `tsc -b && vite build` → output en `apps/web/dist/`

#### `outputDirectory`
- **Valor**: `apps/web/dist`
- **Análisis**: Correcto. `vite build` en `apps/web/` produce los archivos estáticos en `apps/web/dist/`. Vercel sirve estos archivos como static assets.
- **Nota**: Las serverless functions no dependen de este directorio. Cada función se define en `builds[]`.

#### `builds[]`
Tres serverless functions:

| Entry Point | Bundle | includeFiles | Propósito |
| ----------- | ------ | ------------ | --------- |
| `apps/api/api/index.js` | `false` | `apps/api/dist/**` | API NestJS completa (ruteo `/api/*`) |
| `apps/api/api/health.js` | (default) | (default) | Health check simple y rápido |
| `apps/api/api/diagnostic.js` | (default) | (default) | Diagnóstico de entorno |

- **`bundle: false`** es **necesario** para `index.js`: NestJS tiene un árbol de dependencias complejo y el bundling de Vercel puede fallar. Con `bundle: false`, Vercel usa `includeFiles` para empaquetar `apps/api/dist/**` (el build de NestJS) junto con `node_modules` necesarios.
- **`includeFiles: "apps/api/dist/**"`**: Incluye el build completo de NestJS en el paquete de la serverless function.

#### `rewrites[]`
Routing de entrada:

| Source | Destination | Uso |
| ------ | ----------- | --- |
| `/_diag` | `apps/api/api/diagnostic.js` | Diagnóstico (ver vars de entorno sin secrets) |
| `/_health` | `apps/api/api/health.js` | Health check simple (sin inicializar NestJS) |
| `/api/(.*)` | `apps/api/api/index.js` | **Toda** la API REST (incluye `/api/v1/health`, `/api/v1/docs`, etc.) |
| `/(.*)` | `/index.html` | Catch-all SPA: cualquier otra ruta va al frontend |

#### `headers[]`
Encabezados de seguridad aplicados globalmente:
- `X-Content-Type-Options: nosniff` — previene MIME-sniffing
- `X-Frame-Options: DENY` — previene clickjacking
- `X-XSS-Protection: 1; mode=block` — previene XSS reflejado

---

## 3. Routing Map

```
Solicitud HTTP
    │
    ├── /_diag ──────────────────► apps/api/api/diagnostic.js (serverless)
    │                                 └─ res.json({ status, env, headers })
    │
    ├── /_health ────────────────► apps/api/api/health.js (serverless)
    │                                 └─ res.json({ status: "ok", time })
    │
    ├── /api/v1/health ──────────► apps/api/api/index.js (serverless)
    │                                 └─ NestJS.createApp() → GET /api/v1/health
    │
    ├── /api/v1/docs ────────────► apps/api/api/index.js (serverless)
    │                                 └─ NestJS.createApp() → Swagger UI
    │
    ├── /api/v1/auth/login ──────► apps/api/api/index.js (serverless)
    │                                 └─ NestJS.createApp() → AuthController.login()
    │
    ├── /api/v1/products ────────► apps/api/api/index.js (serverless)
    │                                 └─ NestJS.createApp() → CatalogController.findAll()
    │
    ├── / ───────────────────────► apps/web/dist/index.html (static)
    │                                 └─ React SPA (react-router-dom maneja routing interno)
    │
    ├── /products ───────────────► /index.html (catch-all rewrite)
    │                                 └─ React SPA → <Route path="/products">
    │
    └── /cart/checkout ──────────► /index.html (catch-all rewrite)
                                     └─ React SPA → <Route path="/cart/checkout">
```

### 3.1 Orden de las rewrites

Vercel evalúa las rewrites en **orden de definición**. La primera coincidencia gana:

1. `/_diag` — diagnósticos
2. `/_health` — health checks rápidos
3. `/api/(.*)` — todo el backend
4. `/(.*)` — catch-all SPA

Este orden es **correcto**: las rutas específicas van primero, el catch-all al final.

### 3.2 Consideración importante: `/api/v1/health` y `/_health`

- `/_health`: respondido por `health.js`, es un endpoint **ultraligero** que no inicializa NestJS. Ideal para health checks externos (uptime monitoring) que requieren respuesta rápida sin cold start.
- `/api/v1/health`: respondido por NestJS (a través de `index.js`). Es el health check completo que verifica la base de datos, Redis, etc.

---

## 4. Serverless Entry Points

### 4.1 `apps/api/api/index.js` — Entry point principal (API NestJS)

```javascript
const prismaModule = require("@prisma/client");
const OrigPrismaClient = prismaModule.PrismaClient;

// Proxy PrismaClient para evitar postinstall checks en serverless
prismaModule.PrismaClient = new Proxy(OrigPrismaClient, {
  construct(target, args) {
    const opts = args[0] || {};
    opts.__internal = opts.__internal || {};
    const origOverride = opts.__internal.configOverride;
    opts.__internal.configOverride = (cfg) => {
      let result = origOverride ? origOverride(cfg) : { ...cfg };
      result.postinstall = false;
      result.ciName = undefined;
      return result;
    };
    args[0] = opts;
    return Reflect.construct(target, args);
  },
});

const path = require("path");

let app;
let initError;
let mod;

try {
  mod = require("../dist/main");       // desde api/ → apps/api/dist/main
} catch (_) {
  try {
    mod = require("./dist/main");      // fallback (no esperado, pero seguro)
  } catch (err2) {
    initError = new Error(
      `Cannot find dist/main. Tried: ${path.join(__dirname, "..", "dist", "main")}, ${path.join(__dirname, "dist", "main")}`,
    );
  }
}

// Manejadores de errores globales
process.on("uncaughtException", (err) => { ... });
process.on("unhandledRejection", (err) => { ... });

module.exports = async (req, res) => {
  // Lazy initialization: la app NestJS se crea UNA SOLA VEZ
  // y se reutiliza en requests subsecuentes (warm instances)
  try {
    if (initError) throw initError;
    if (!app) {
      app = await mod.createApp();
      await app.init();
    }
    const expressInstance = app.getHttpAdapter().getInstance();
    return new Promise((resolve) => {
      res.on("finish", () => resolve());
      expressInstance(req, res);
    });
  } catch (err) {
    console.error("HANDLER_ERROR:", err.message, ...);
    if (!res.headersSent) {
      res.status(500).json({ error: "init_failed", message: err.message });
    }
  }
};
```

**Verificación**: ✅ Funcional y correcto.
- **Require path**: `require("../dist/main")` desde `apps/api/api/` resuelve a `apps/api/dist/main.js`.
- **Lazy init**: La app NestJS se inicializa en el primer request y se reutiliza.
- **Error handling**: Captura `uncaughtException` y `unhandledRejection`.
- **PrismaProxy**: Parchea PrismaClient para evitar postinstall checks en entorno serverless.

### 4.2 `apps/api/api/health.js` — Health check rápido

```javascript
module.exports = async (req, res) => {
  res.json({ status: "ok", time: Date.now() });
};
```

**Verificación**: ✅ Correcto. Endpoint ligero sin dependencias.

### 4.3 `apps/api/api/diagnostic.js` — Diagnóstico de entorno

```javascript
module.exports = async (req, res) => {
  res.status(200).json({
    status: "ok",
    method: req.method,
    path: req.path,
    headers: req.headers,
    env: Object.keys(process.env)
      .sort()
      .filter((k) =>
        !k.includes("TOKEN") &&
        !k.includes("SECRET") &&
        !k.includes("KEY") &&
        !k.includes("PASSWORD") &&
        k !== "DATABASE_URL" &&
        k !== "REDIS_URL"
      ),
  });
};
```

**Verificación**: ✅ Correcto. Filtra variables sensibles (TOKEN, SECRET, KEY, PASSWORD, DATABASE_URL, REDIS_URL) por seguridad.

---

## 5. Build Pipeline

### 5.1 Flujo completo del build en Vercel

```
Vercel detecta push a main (o PR)
    │
    ├── 1. Install
    │     └── cd apps/api && npm ci --include=dev
    │     └── cd ../../apps/web && npm ci --include=dev
    │
    ├── 2. Build
    │     ├── cd apps/api && npx prisma generate
    │     │     └── genera @prisma/client en apps/api/node_modules/.prisma/client/
    │     │
    │     └── cd ../.. && npm run build
    │           ├── npm run build:api
    │           │     └── cd apps/api && nest build (deleteOutDir: true)
    │           │           └── output: apps/api/dist/main.js + chunks
    │           │
    │           └── npm run build:web
    │                 └── cd apps/web && tsc -b && vite build
    │                       └── output: apps/web/dist/index.html + assets/
    │
    ├── 3. Package
    │     ├── Static assets: apps/web/dist/ → CDN
    │     └── Serverless functions:
    │           ├── apps/api/api/index.js + apps/api/dist/** → λ function
    │           ├── apps/api/api/health.js → λ function
    │           └── apps/api/api/diagnostic.js → λ function
    │
    └── 4. Deploy
          ├── Static files served from CDN (edge)
          └── Serverless functions deployed to us-east-1 (default)
```

### 5.2 Tiempos estimados

| Paso | Estimado |
| ---- | -------- |
| `npm ci` (api) | ~30-60s |
| `npm ci` (web) | ~20-40s |
| `prisma generate` | ~10-15s |
| `nest build` (api) | ~30-60s |
| `vite build` (web) | ~20-40s |
| Package + Deploy | ~30-60s |
| **Total** | **~2-4 min** |

---

## 6. Procedimiento de Deploy

### 6.1 Deploy automático (GitHub Integration)

El proyecto está conectado a Vercel via GitHub Integration. El flujo es:

1. **Push a `main`** → GitHub Actions ejecuta CI (`ci.yml`) →
   - Tests unitarios
   - Tests E2E
   - Build verification
2. **CI pasa** → Vercel detecta el push a `main` → ejecuta deploy a producción
3. **Vercel Build** → install → build → package → deploy
4. **URLs actualizadas**:
   - Backend: `https://tienda-online-zped08s-projects.vercel.app`
   - Frontend: `https://tienda-frontend-self.vercel.app`

### 6.2 Deploy manual (vercel CLI)

```bash
# Login
npx vercel login

# Deploy a preview
npx vercel

# Deploy a producción
npx vercel --prod
```

### 6.3 Configuración del proyecto en Vercel Dashboard

| Campo | Valor |
| ----- | ----- |
| Framework Preset | **Other** |
| Root Directory | `/` |
| Build Command | (usar `vercel.json`) |
| Output Directory | (usar `vercel.json`) |
| Install Command | (usar `vercel.json`) |
| Node.js Version | **22.x** (por defecto en Vercel) |

### 6.4 Variables de entorno en Vercel

Configurar en Vercel Dashboard → Project Settings → Environment Variables:

| Variable | Valor | Ambiente |
| -------- | ----- | -------- |
| `DATABASE_URL` | `postgresql://...` (Neon) | Production, Preview |
| `REDIS_URL` | `rediss://...` (Upstash) | Production, Preview |
| `JWT_SECRET` | `<min 8 chars, random>` | Production, Preview |
| `NODE_ENV` | `production` | Production |
| `NODE_ENV` | `preview` | Preview |
| `API_PREFIX` | `api/v1` | All |
| `CORS_ENABLED` | `true` | All |
| `CORS_ORIGIN` | `https://tienda-frontend-self.vercel.app` | Production |
| `CORS_ORIGIN` | `*` (o URL del preview) | Preview |
| `SWAGGER_ENABLED` | `false` | Production |
| `SWAGGER_ENABLED` | `true` | Preview (opcional) |
| `JWT_ACCESS_TTL` | `900` | All |
| `JWT_REFRESH_TTL` | `604800` | All |

---

## 7. URLs de Producción

| Recurso | URL |
| ------- | --- |
| **Backend API** | `https://tienda-online-zped08s-projects.vercel.app/api/v1` |
| **Health check (rápido)** | `https://tienda-online-zped08s-projects.vercel.app/_health` |
| **Diagnóstico** | `https://tienda-online-zped08s-projects.vercel.app/_diag` |
| **Swagger UI** | `https://tienda-online-zped08s-projects.vercel.app/api/v1/docs` (si habilitado) |
| **Frontend SPA** | `https://tienda-frontend-self.vercel.app` |

---

## 8. Troubleshooting

### 8.1 Timeout en serverless function (10s en Hobby)

**Síntoma**: Error `Serverless Function has timed out after 10s`.

**Causa**: El cold start de NestJS puede tomar >10s si la función no se ha usado recientemente.

**Soluciones**:

1. **Upgrade a plan Pro**: Timeout de 60s (recomendado para NestJS).
2. **Optimizar cold start**:
   - Verificar que `bundle: false` está activo en `index.js`.
   - Reducir imports en `main.ts` (lazy loading de módulos).
   - Configurar Prisma con engine `library` (más rápido que `binary`).
3. **Mantener warm**: Usar un monitor externo que llame a `/_health` cada 4 minutos.

### 8.2 Bundle too large (>50MB)

**Síntoma**: Error durante el packaging de la serverless function.

**Causa**: NestJS + Prisma + dependencias pueden exceder 50MB.

**Soluciones**:
- `"bundle": false` (ya configurado) desactiva el bundling y usa `includeFiles` para incluir solo lo necesario.
- Verificar que `apps/api/dist/` no incluya archivos innecesarios (`.map`, test files).
- Considerar tree-shaking en `tsconfig.json` (ya está activo con NestJS).

### 8.3 Error de conexión a base de datos

**Síntoma**: `Error: Can't reach database server` en logs de Vercel.

**Causa**: `DATABASE_URL` no configurada o URL incorrecta.

**Solución**:
- Verificar en Vercel Dashboard → Project Settings → Environment Variables que `DATABASE_URL` está presente.
- Para Neon, usar `postgresql://` con `sslmode=require`.
- Verificar que la IP de Vercel no está bloqueada (Neon permite conexiones desde cualquier IP por defecto).

### 8.4 Error de conexión a Redis

**Síntoma**: `Error: connect ECONNREFUSED` o timeout en operaciones Redis.

**Causa**: `REDIS_URL` no configurada o Upstash no está accesible.

**Solución**:
- Upstash usa REST API (no TCP), por lo que funciona sin problemas en serverless.
- Verificar `REDIS_URL` usa protocolo `rediss://` (TLS).
- `@upstash/redis` ya está en las dependencias de `apps/api/package.json`.

### 8.5 404 en rutas del frontend

**Síntoma**: Navegando a `/products` en el browser da 404.

**Causa**: El catch-all rewrite `/(.*)` → `/index.html` no funciona correctamente.

**Solución**:
- Verificar que la rewrite `/(.*)` está al **final** del array `rewrites`.
- Verificar que SPA usa `react-router-dom` con `BrowserRouter` (no `HashRouter`).
- El rewrite debe ser a `/index.html` (no a `index.html` sin slash).

### 8.6 Error: `Cannot find module '../dist/main'`

**Síntoma**: Error en logs de Vercel: `Cannot find module '../dist/main'`.

**Causa**: El build de NestJS no generó `dist/main.js` o el path es incorrecto.

**Solución**:
- Verificar que `apps/api/dist/main.js` existe después del build.
- Verificar `nest-cli.json`: `sourceRoot` debe ser `src` (relativo a `apps/api/`).
- Verificar `tsconfig.build.json` incluye `src/main.ts`.

---

## 9. Archivos de configuración sub-app (redundantes)

### 9.1 `apps/api/vercel.json`

```json
{
  "buildCommand": "npx prisma generate && nest build",
  "outputDirectory": "dist",
  "builds": [
    { "src": "api/index.js", "use": "@vercel/node", "config": { "includeFiles": "dist/**", "bundle": false } },
    { "src": "api/diagnostic.js", "use": "@vercel/node" },
    { "src": "api/health.js", "use": "@vercel/node" }
  ],
  "rewrites": [
    { "source": "/api/(.*)", "destination": "api/index.js" },
    { "source": "/_diag", "destination": "api/diagnostic.js" },
    { "source": "/_health", "destination": "api/health.js" }
  ]
}
```

### 9.2 `apps/web/vercel.json`

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

### 9.3 Estado: REDUNDANTE — No eliminados

Estos archivos son **heredados de la arquitectura pre-monorepo** cuando `apps/api/` y `apps/web/` eran proyectos Vercel independientes. **No son utilizados** por Vercel en el esquema actual porque el root `vercel.json` toma precedencia.

**Riesgo potencial**: Si alguien configura un Monorepo Project en Vercel apuntando a `apps/api/` como `rootDirectory`, Vercel podría usar este archivo en lugar del root. Sin embargo, con la configuración actual (root directory = `/`), esto no ocurre.

**Recomendación**: Eliminar ambos archivos (`apps/api/vercel.json` y `apps/web/vercel.json`) para evitar confusión. Su funcionalidad está completamente cubierta por el root `vercel.json`.

---

## 10. Verificación post-deploy

### Checklist

- [ ] `GET https://tienda-online-zped08s-projects.vercel.app/_health` → `{ "status": "ok", "time": ... }`
- [ ] `GET https://tienda-online-zped08s-projects.vercel.app/_diag` → `{ "status": "ok", "method": "GET", ... }`
- [ ] `GET https://tienda-online-zped08s-projects.vercel.app/api/v1/health` → `{ "status": "ok", ... }` (NestJS)
- [ ] `GET https://tienda-frontend-self.vercel.app/` → HTML del SPA
- [ ] `GET https://tienda-frontend-self.vercel.app/products` → SPA routing (no 404)
- [ ] Variables de entorno configuradas en Vercel Dashboard
- [ ] Prisma migrations aplicadas en Neon

---

## 11. Referencias

- `043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md` — Plan de migración monorepo (Fase 6)
- `048_EXEC_VARIABLES_ENTORNO_1_0_DRAFT.md` — Variables de entorno (Fase 5)
- `AGENTS.md` — Guía de agentes con URLs de producción
- `docs/REGISTRO_IDS.md` — Registro de IDs de documentación
- Root `vercel.json` — Configuración global de Vercel
- `apps/api/api/index.js` — Serverless entry point principal
- `apps/api/api/health.js` — Health check rápido
- `apps/api/api/diagnostic.js` — Diagnóstico de entorno
- [Vercel Documentation: Serverless Functions](https://vercel.com/docs/functions)
- [Vercel Documentation: vercel.json](https://vercel.com/docs/projects/project-configuration)
