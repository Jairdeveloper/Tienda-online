---
id: 051
area: architecture
type: DEBUG
module: monorepo
version: 1.0
status: ACTIVE
tags:
  - monorepo
  - vercel
  - deploy
  - debug
  - 404
  - troubleshooting
summary: "Documento de debugging para resolver el error 404 en produccion tras deploy en Vercel. Compila diagnostico, causa raiz, soluciones y verificacion post-fix."
keywords:
  - monorepo
  - vercel
  - deploy
  - debug
  - 404
  - builds
  - serverless
  - static-files
  - troubleshooting
changelog:
  - version: 1.0
    date: 2026-06-03
    author: general-agent
    description: Creacion del documento de debug para error 404 en deploy Vercel
  - version: 1.1
    date: 2026-06-03
    author: workflow-agent
    description: Fix aplicado y deploy exitoso — ver seccion 8
---

## 1. Síntoma

El deploy en Vercel se completa exitosamente (build exitoso en ~7s) pero **todas las rutas HTTP responden 404**:
- `GET /` → 404
- `GET /api/v1/health` → 404
- `GET /_health` → 404
- `GET /_diag` → 404
- Cualquier URL → 404

## 2. Diagnóstico

### 2.1 Build logs en Vercel

```
Build Completed in /vercel/output [7s]
```

El build dura solo **7 segundos**. No se observa en los logs:
- Output de `npx prisma generate`
- Output de `nest build` (compilación NestJS)
- Output de `tsc -b && vite build` (compilación frontend)

### 2.2 Dependencias instaladas

"134 packages are looking for funding" — esto corresponde solo a las dependencias de `apps/api/`. Las dependencias de `apps/web/` (~161 packages, ~885 en total) no se ven reflejadas.

### 2.3 Cache de build restaurado

```
Restored build cache from previous deployment
```

Vercel restaura la caché de un deploy anterior. Como el deploy anterior ya estaba roto (sin archivos estáticos del SPA), la caché replica exactamente ese mismo output defectuoso.

## 3. Causa Raíz

### 3.1 El array `builds` legacy solo despliega serverless functions

El root `vercel.json` contiene:

```json
"builds": [
  { "src": "apps/api/api/diagnostic.js", "use": "@vercel/node" },
  { "src": "apps/api/api/health.js", "use": "@vercel/node" },
  { "src": "apps/api/api/index.js", "use": "@vercel/node", ... }
]
```

En el sistema legacy de Vercel, cuando declaras un array `builds`, estás diciendo explícitamente "esto es TODO lo que quiero desplegar". **Vercel NO despliega ningún otro archivo automáticamente.**

### 3.2 outputDirectory es ignorado

```json
"outputDirectory": "apps/web/dist"
```

El `outputDirectory` **es ignorado** cuando existe el array `builds`. Vercel solo incluye en el deployment los outputs de los builders listados. Como no hay un builder `@vercel/static` para `apps/web/dist/**`, los archivos del SPA nunca se despliegan.

### 3.3 Por qué el rewrite `/(.*)` → `/index.html` da 404

```
Request a / → rewrite "/(.*)" → "/index.html"
  → Busca /index.html en el deployment
  → NO EXISTE (nunca fue desplegado)
  → 404 Not Found
```

### 3.4 Conclusión de causa raíz

**El array `builds` solo despliega 3 funciones serverless. Los archivos estáticos del frontend (`apps/web/dist/*`) no son output de ningún builder y por lo tanto no están incluidos en el deployment.** Todas las rutas → 404 porque no hay `index.html` ni assets estáticos.

## 4. Soluciones

### 4.1 Opción A: Fix mínimo (agregar @vercel/static)

Agregar el builder de archivos estáticos al array `builds` en el root `vercel.json`:

```json
{
  "installCommand": "cd apps/api && npm ci --include=dev && cd ../../apps/web && npm ci --include=dev",
  "buildCommand": "cd apps/api && npx prisma generate && cd ../.. && npm run build",
  "outputDirectory": "apps/web/dist",
  "builds": [
    {
      "src": "apps/web/dist/**",
      "use": "@vercel/static"
    },
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
    { "source": "/_diag", "destination": "apps/api/api/diagnostic.js" },
    { "source": "/_health", "destination": "apps/api/api/health.js" },
    { "source": "/api/(.*)", "destination": "apps/api/api/index.js" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

**Ventajas**: Cambio mínimo, un solo proyecto Vercel, una URL.
**Desventajas**: Sigue usando sistema legacy `builds` (Vercel lo está depreciando). La serverless function de NestJS es frágil. Si la lambda crashea, todo el sitio se cae.

### 4.2 Opción B: Separar en 2 proyectos Vercel (RECOMENDADA)

Crear dos proyectos independientes en Vercel Dashboard, cada uno con su Root Directory:

**Proyecto 1: API** (`apps/api/`)
- Framework Preset: Other
- Root Directory: `apps/api`
- Build Command: `npx prisma generate && npm run build`
- Output Directory: `dist`
- Install Command: `npm ci --include=dev`
- Env vars: `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, etc.

**Proyecto 2: Web** (`apps/web/`)
- Framework Preset: Vite (detección automática)
- Root Directory: `apps/web`
- Build Command: `vite build` (default)
- Output Directory: `dist` (default)
- Install Command: `npm ci` (default)
- Env vars: `VITE_API_URL` → URL del proyecto API

**Ventajas**: Zero-config de Vercel para cada app, builds/caches/logs separados, escalado independiente, sin sistema legacy.
**Desventajas**: Dos URLs (requiere CORS entre ellas), crear proyecto extra en Vercel.

## 5. Pasos para implementar la solución

### 5.1 Invalidar la caché de Vercel

Antes de cualquier nuevo deploy, forzar build fresco:

- **Dashboard**: Ir a proyecto → Settings → Build & Development Settings → "Clear Build Cache"
- **CLI**: `npx vercel deploy --prod --force`

O usar env var temporal: `VERCEL_FORCE_NO_BUILD_CACHE=1`

### 5.2 Verificar buildCommand localmente

Para asegurar que el build funciona fuera de caché:

```bash
cd apps/api && npx prisma generate && npm run build && ls dist/main.js
cd ../.. && npm run build && ls apps/web/dist/index.html
```

### 5.3 Opción A: Editar root vercel.json

Editar `/home/john/tienda-online/Tienda-online-agnostica/vercel.json` agregando `@vercel/static` a `builds` (ver sección 4.1).

### 5.4 Opción B: Crear proyectos en Vercel Dashboard

1. Ir a [vercel.com](https://vercel.com) → Add New → Project
2. Importar el repositorio
3. Configurar Root Directory: `apps/api` (o `apps/web`)
4. Configurar framework preset, env vars
5. Deploy
6. Repetir para el segundo proyecto

## 6. Verificación post-fix

- [x] `GET /_health` → `{ "status": "ok", "time": ... }`
- [x] `GET /_diag` → JSON con lista de env vars (sin secrets)
- [x] `GET /api/v1/health` → HTTP 200 (NestJS inicializado)
- [x] `GET /` → HTML del SPA
- [x] `GET /cualquier-ruta-spa` → SPA serving (no 404)
- [x] Logs de Vercel sin errores

## 7. Resultado del Fix

El fix se aplicó y verificó exitosamente el 2026-06-03. Todos los endpoints responden correctamente.

**URL de producción**: `https://tienda-online-jair08-zped08s-projects.vercel.app`

| Endpoint | Estado | Respuesta |
|----------|--------|-----------|
| `GET /` | ✅ 200 | HTML del SPA (Vite + React) |
| `GET /_health` | ✅ 200 | `{"status":"ok","time":...}` |
| `GET /_diag` | ✅ 200 | Diagnóstico de entorno |
| `GET /api/v1/health` | ✅ 200 | DB ok, Redis ok |
| `GET /api/v1/docs` | ✅ (si habilitado) | Swagger UI |

### Cambios aplicados en `vercel.json`

1. **Agregado `@vercel/static`** al array `builds` con `src: "apps/web/dist/**"` para incluir archivos estáticos del SPA en el deployment
2. **Corregido rewrite `/(.*)`** → `/apps/web/dist/index.html` (antes apuntaba a `/index.html` que no existía porque `@vercel/static` despliega en ruta completa)
3. **Agregado rewrite `/assets/(.*)`** → `/apps/web/dist/assets/$1` para archivos estáticos (CSS, JS, imágenes)

### Causa raíz confirmada

El array `builds` legacy solo incluye en el deployment los outputs de los builders listados. Como no había un builder `@vercel/static` para `apps/web/dist/**`, los archivos estáticos del SPA nunca se desplegaban. Además, cuando `@vercel/static` despliega archivos, lo hace en su ruta completa relativa al root (`/apps/web/dist/index.html`), no en la raíz (`/index.html`), por lo que el rewrite original `/(.*) → /index.html` no encontraba el archivo.

## 8. Referencias

- [Vercel Docs: Legacy Builds - por qué evitarlo](https://vercel.com/docs/deployments/configure-a-build#builds)
- [Vercel Docs: @vercel/static builder](https://vercel.com/docs/builders/static)
- [Vercel Docs: Monorepos](https://vercel.com/docs/deployments/monorepos)
- `043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md` — Plan de migración monorepo
- `049_EXEC_DEPLOY_VERCEL_1_0_DRAFT.md` — Documentación de Fase 6
- Root `vercel.json` — Config actual de Vercel
- `apps/api/api/index.js` — Serverless entry point principal
