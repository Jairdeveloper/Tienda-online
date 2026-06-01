---
id: 041
area: backend
type: BUGFIX
module: api
version: "1.0"
status: ACTIVE
tags:
  - backend
  - deploy
  - vercel
  - serverless
  - bugfix
summary: "Bugfix: error init_failed Cannot find module '../dist/main' en api/index.js al desplegar NestJS en Vercel. Causa: esbuild bundling rompe rutas relativas de require en serverless functions. Solucion: bundle:false en vercel.json + fallback de paths en api/index.js."
keywords: [vercel, nestjs, serverless, bundle, includeFiles, init_failed]
changelog:
  - version: "1.0"
    date: 2026-06-01
    author: workflow-agent
    changes:
      - "Documentacion del bug y solucion del error init_failed en backend NestJS desplegado en Vercel"
---

# Bugfix: Error `init_failed` en backend NestJS en Vercel

## Bug encontrado

### Sintoma

Todos los endpoints `/api/v1/*` devolvian HTTP 500 con:

```json
{ "error": "init_failed", "message": "Cannot find module '../dist/main'" }
```

El unico endpoint que funcionaba era `/_health` (api/health.js) porque es independiente de NestJS.

### Impacto

- 8 de 10 criterios de exito de integracion bloqueados
- Solo frontend SPA y health endpoint funcionaban
- Auth, catalog, carrito, pedidos, admin — todos inaccesibles

## Causa raiz

### Archivo afectado: `api/index.js` linea 25

El entry point serverless hacia `require("../dist/main")` para cargar la app NestJS compilada.

### Dos problemas concurrentes:

1. **Problema de ruta relativa por esbuild bundling** (`api/index.js`):
   - `@vercel/node` v3+ usa esbuild para empaquetar serverless functions
   - esbuild deja los `require()` con string literal como externos, pero la ruta `../dist/main` es relativa a `api/index.js` original
   - El archivo empaquetado se coloca en `.vercel/output/functions/api/index.func/`, NO en `api/`
   - Por lo tanto, `../dist/main` desde ahi apunta al lugar incorrecto
   - La ruta correcta deberia ser `./dist/main` (relativa al directorio de la funcion)

2. **Problema de bundle optimizado** (`vercel.json`):
   - Con `bundle: true` (default), esbuild no solo cambia rutas sino que puede INLINEAR modulos completos
   - El require dinamico falla porque el modulo no existe como archivo separado
   - Funciona con `bundle: false` porque nft (Node File Trace) copia los archivos manteniendo la estructura original

## Solucion aplicada

### Fix 1: `api/index.js` — Path fallback

Se cambio el require estatico por un try/catch con dos rutas alternativas:

```javascript
try {
  mod = require("../dist/main");    // ruta original (cuando no hay bundle)
} catch (_) {
  try {
    mod = require("./dist/main");   // ruta alternativa (bundle:false con nft)
  } catch (err2) {
    initError = new Error(...);
  }
}
```

El string literal `require("../dist/main")` se mantiene para que nft pueda trazarlo (static analysis).

### Fix 2: `vercel.json` — Deshabilitar bundling

```json
{
  "src": "api/index.js",
  "use": "@vercel/node",
  "config": {
    "includeFiles": "dist/**",
    "bundle": false
  }
}
```

`bundle: false` evita que esbuild empaquete la funcion. En su lugar, nft (Node File Trace) copia los archivos necesarios manteniendo la estructura de directorios original. Con `includeFiles: "dist/**"` se asegura que todo el build de NestJS este disponible.

### Fix 3: CORS_ORIGIN (configuracion post-fix)

Se añadio la variable de entorno `CORS_ORIGIN=https://tienda-frontend-self.vercel.app` al proyecto `tienda-online` en Vercel para que el frontend SPA pueda hacer peticiones CORS.

## Resultados

### Endpoints verificados (todos OK)

| Endpoint                     | Metodo  | Status | Respuesta                            |
| ---------------------------- | ------- | ------ | ------------------------------------ |
| `/_health`                   | GET     | 200    | `{"status":"ok"}`                    |
| `/api/v1/auth/login`         | POST    | 200    | JWT + user data                      |
| `/api/v1/catalog/categories` | GET     | 200    | 4 categorias (seed)                  |
| `/api/v1/catalog/products`   | GET     | 200    | 5 productos con variantes            |
| `/api/v1/catalog/status`     | GET     | 200    | `{"module":"catalog","status":"ok"}` |
| `/api/v1/admin/orders`       | GET     | 200    | Lista de ordenes (vacia)             |
| `/api/v1/catalog/categories` | OPTIONS | 204    | CORS headers correctos               |

### CORS headers en produccion

```
access-control-allow-credentials: true
access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE
access-control-allow-origin: https://tienda-frontend-self.vercel.app
```

### Archivos modificados

1. `api/index.js` — Path fallback para dist/main
2. `vercel.json` — bundle: false + includeFiles
3. Variables de entorno Vercel — CORS_ORIGIN añadido

## Lecciones aprendidas

1. **`@vercel/node` v3+**: esbuild bundling cambia las rutas de `require()` con string literal. Usar `bundle: false` cuando se necesite acceso a archivos compilados externos.
2. **nft vs esbuild**: nft mantiene la estructura de directorios; esbuild empaqueta en un unico archivo. Para aplicaciones NestJS compiladas (dist/), nft es mas predecible.
3. **includeFiles**: Funciona correctamente con `bundle: false`. Asegura que archivos fuera del tracing de nft esten disponibles.
4. **CORS en Vercel + NestJS**: La configuracion de CORS de NestJS se aplica correctamente solo si `CORS_ORIGIN` tiene valor. Con valor vacio, NestJS deshabilita CORS (`origin: false`).
