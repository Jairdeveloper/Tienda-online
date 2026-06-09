---
id: 062
area: backend
type: PLAYBOOK
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
  - playbook
  - debugging
  - troubleshooting
  - health-check
summary: "Guía paso a paso para diagnosticar y resolver fallos de deployment de la API NestJS (@tienda/api) en Vercel Lambda. Cubre diagnóstico rápido, verificación de bundle, errores comunes con soluciones, procedimiento de deploy manual y comandos útiles."
keywords:
  - vercel
  - nestjs
  - lambda
  - serverless
  - deploy
  - debugging
  - troubleshooting
  - playbook
  - health-check
  - handler.js
  - bundle
  - prisma
  - rollback
  - alias
changelog:
  - version: "1.0"
    date: 2026-06-09
    author: dev-ops-agent
    changes:
      - "Creación del playbook de deploy en Vercel basado en lecciones aprendidas de las sesiones de debugging 061"
---

# Vercel Deployment Playbook — @tienda/api

## 1. Diagnóstico Rápido

Cuando la API de producción no responde o retorna errores, el orden de verificación
debe ser **de menor a mayor dependencia** — así se aísla rápidamente si el problema
está en la infraestructura, en la configuración o en el código NestJS.

### 1.1 Orden de Endpoints

| Paso | Endpoint | Propósito | Dependencias | Esperado |
|------|----------|-----------|--------------|----------|
| 1 | `/_health` | ¿El Lambda está vivo? | Ninguna | `{"status":"ok"}` |
| 2 | `/_diag` | ¿Las env vars están correctas? | Ninguna | `{"status":"ok","env":[...]}` |
| 3 | `/_test` | ¿Los módulos NestJS cargan? | `dist/` + Prisma | `{"pm":"ok","am":"ok","main":"ok","create":"ok"}` |
| 4 | `/_debug` | ¿El filesystem tiene los archivos esperados? | `dist/` + Prisma | `{"steps":[...],"fs":{...}}` |
| 5 | `/api/v1/health` | ¿NestJS responde correctamente? | NestJS + DB + Redis | `{"status":"ok","service":"api"}` |
| 6 | `POST /api/v1/auth/login` | ¿La autenticación funciona end-to-end? | NestJS + DB + Redis + JWT | `{"tokens":{...}}` |
| 7 | `/direct-test` | Ruta directa de Express (bypass NestJS routing) | handler.js | `{"status":"direct_ok"}` |

### 1.2 Diagnóstico con curl

```bash
# 1. Lambda vivo
curl -s https://<url>/_health | jq .

# 2. Env vars
curl -s https://<url>/_diag | jq .

# 3. Carga de módulos
curl -s https://<url>/_test | jq .

# 4. Filesystem en Lambda
curl -s https://<url>/_debug | jq .

# 5. Health completo
curl -s https://<url>/api/v1/health | jq .

# 6. Login de prueba
curl -s -X POST https://<url>/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tienda.local","password":"Admin123!"}' | jq .

# 7. Ruta directa
curl -s https://<url>/direct-test | jq .
```

### 1.3 Interpretación Rápida

| Resultado de `/api/v1/health` | Causa probable |
|-------------------------------|----------------|
| ✅ `200 {"status":"ok"}` | Todo funciona |
| ❌ `500` HTML genérico | Lambda crash — revisar `/_test` y `/_debug` |
| ❌ `404 Cannot GET` | handler.js no delegó rutas a NestJS |
| ❌ `200 {"error":"init_failed"}` | NestJS no pudo inicializarse |
| ❌ Timeout (>10s) | Prisma/Redis no conectan, o cold start muy lento |
| ⚠️ `200` sin `x-request-id` | Middleware global no se registró |

---

## 2. Verificación de Bundle

Cuando los endpoints `/_test` o `/_debug` fallan, el problema suele ser que
el bundle de la Lambda no incluye los archivos necesarios.

### 2.1 Usar `/_debug` para listar el filesystem

```bash
curl -s https://<url>/_debug | jq '.fs.taskdir'
```

Esto lista el árbol de directorios de `/var/task/apps` dentro de la Lambda.
Verificar:

| Archivo | Ruta esperada | Si falta… |
|---------|---------------|-----------|
| `dist/main.js` | `apps/api/dist/main.js` | build no se ejecutó o `includeFiles` no lo incluye |
| `dist/app.module.js` | `apps/api/dist/app.module.js` | build incompleto |
| `dist/prisma/` | `apps/api/dist/prisma/` | build incompleto |
| `.prisma/client/index.js` | `node_modules/.prisma/client/index.js` | Prisma generate falló |
| `handler.js` | `apps/api/api/handler.js` | `includeFiles` incorrecto |

### 2.2 Verificar includeFiles

En `vercel.json`, las funciones que dependen de `dist/` deben tener:

```json
{
  "src": "apps/api/api/handler.js",
  "use": "@vercel/node",
  "config": {
    "includeFiles": "apps/api/dist/**",
    "bundle": false
  }
}
```

**Regla de oro:** Si un archivo JS hace `require(path.join(__dirname, "..", "dist", "..."))`,
necesita tanto `includeFiles` (para que el archivo exista en la Lambda) como
`bundle: false` (para que `__dirname` apunte al path correcto).

### 2.3 Verificar bundle: false

Cuando `bundle` está en `true` (o ausente, que es el default):

| Consecuencia | Explicación |
|-------------|-------------|
| `__dirname` apunta a `.vercel/output/functions/.../` | esbuild empaqueta handler.js en un solo archivo |
| `require("../dist/main")` falla | La ruta relativa no resuelve a donde `includeFiles` copió los archivos |
| `FUNCTION_INVOCATION_FAILED` | Excepción no capturada: MODULE_NOT_FOUND |

**Solución:** Siempre usar `"bundle": false` cuando se usen `require()` con
`path.join()` o cualquier expresión dinámica.

### 2.4 Verificar outputDirectory

`outputDirectory` en `vercel.json` hace que Vercel espere contenido estático
**antes** de ejecutar el build personalizado. Esto puede interferir con las
rewrites que apuntan a paths absolutos.

| outputDirectory | Rewrite a index.html | Resultado |
|----------------|---------------------|-----------|
| Definido | `/apps/web/dist/index.html` | ❌ No resuelve |
| No definido | `/apps/web/dist/index.html` | ✅ Resuelve correctamente |

**Solución:** No usar `outputDirectory` a menos que sea estrictamente necesario.
Vercel sirve todo el repositorio como sistema de archivos virtual sin esa directiva.

---

## 3. Errores Comunes y Soluciones

### 3.1 Tabla de Errores

| Error | Síntoma | Causa | Solución |
|-------|---------|-------|----------|
| **500 en todas las API** | `/_health` ✅, `/api/v1/*` ❌ | `bundle: true` rompe `__dirname` | Agregar `"bundle": false` en vercel.json |
| **404 en rutas API** | `x-request-id` presente, body "Cannot GET /api/v1/..." | handler.js no usa `createApp` de dist/main | Usar `createApp(adapter)` de `dist/main` (commit `236d94a`) |
| **Prisma crash al iniciar** | `/_test` muestra error en `create` | `postinstall=true` + `ciName:"Vercel"` detectado por `Ba()` | Parchear con `fix-prisma-config.js` en installCommand |
| **includeFiles no funciona** | `_test` y `_debug` fallan con MODULE_NOT_FOUND | `outputDirectory` conflictivo o `bundle:true` | Sacar `outputDirectory` + `bundle:false` |
| **Producción no se actualiza** | Preview funciona, prod no | Alias de producción no promocionado | `vercel --prod --force` |
| **500 FUNCTION_INVOCATION_FAILED** | Logs de Vercel muestran error de módulo | Módulo no encontrado por nft/esbuild | Verificar `includeFiles` y `bundle` config |
| **Error de Prisma "engine type"** | PrismaClient no encuentra engine | `PRISMA_CLIENT_ENGINE_TYPE` no configurado | Agregar `PRISMA_CLIENT_ENGINE_TYPE=library` |
| **Cold start > 10s** | Primera request muy lenta | NestJS inicializa muchos módulos | Evaluar lazy-loading módulos no críticos |
| **200 con error body** | API responde 200, body `{"error":"init_failed"}` | handler.js siempre retorna 200 (bypass de 5xx de Vercel) | No es un bug del deploy pero confunde al frontend |

### 3.2 Error: PrismaClientInitializationError ("built on Vercel")

**Causa raíz:** Prisma 5.22.0 introdujo la función `Ba()` en
`@prisma/client/runtime/library.js` que verifica el config estático del
archivo generado `.prisma/client/index.js`. Si detecta `postinstall: true`
y `ciName: "Vercel"`, lanza excepción.

**Solución en `installCommand` de vercel.json:**

```json
"installCommand": "cd apps/api && PRISMA_SKIP_POSTINSTALL_GENERATE=true npm ci --include=dev && PRISMA_CLIENT_ENGINE_TYPE=library npx prisma generate && node api/fix-prisma-config.js && cd ../../apps/web && npm ci --include=dev"
```

**El script `fix-prisma-config.js`** parchea el archivo generado:

```javascript
const fs = require('fs');
const path = require('path');
const target = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'index.js');
let content = fs.readFileSync(target, 'utf8');
content = content.replace(/"postinstall":\s*true/, '"postinstall": false');
content = content.replace(/ciName:\s*['"]Vercel['"]/, 'ciName: undefined');
fs.writeFileSync(target, content);
```

### 3.3 Error: 404 en rutas /api/v1/ (Express 404)

**Causa raíz:** Handler.js con inicialización inline de NestJS duplicaba
(pero divergía de) la función `createApp()` en `main.ts`. Las rutas de los
módulos no se registraban.

**Solución:** Handler.js debe usar `createApp(adapter)` desde dist/main:

```javascript
const { ExpressAdapter } = require("@nestjs/platform-express");
const { createApp } = require(path.join(__dirname, "..", "dist", "main"));

const adapter = new ExpressAdapter();
app = await createApp(adapter);
```

**Verificación:** El header `x-request-id` debe estar presente. Si está pero
el body es "Cannot GET ...", el problema es que las rutas no se registraron.

### 3.4 Error: Producción no refleja cambios

**Causa raíz:** Vercel auto-deploy crea deployments pero no los promociona
al alias de producción automáticamente.

**Verificación:**

```bash
# Listar alias
npx vercel alias ls

# Ver qué URL apunta el alias de producción
curl -sI https://tienda-online-jair08-zped08s-projects.vercel.app/_health | head -5
```

**Soluciones:**

1. Desde GitHub Actions: Usar `vercel --prod` explícitamente
2. Desde CLI: `npx vercel --prod --force`
3. Desde Vercel Dashboard: Verificar que `main` sea la rama de producción
   y que auto-promote esté habilitado

---

## 4. Procedimiento de Deploy Manual

### 4.1 Pre-deploy (verificación local)

```bash
# 1. Build local (debe pasar con [build:ok])
cd apps/api && npm run build
echo $?  # debe ser 0

# 2. Verificar que dist/ se generó correctamente
ls apps/api/dist/main.js
ls apps/api/dist/app.module.js
ls apps/api/dist/prisma/

# 3. Verificar tests unitarios
cd apps/api && npm test
```

### 4.2 Deploy a Vercel

```bash
# 1. Desplegar a producción
cd /path/to/repo/root
npx vercel --prod --force

# 2. Verificar con el script de health check
bash scripts/verify-deploy.sh https://tienda-online-jair08-zped08s-projects.vercel.app

# 3. Verificación manual adicional
curl -s https://tienda-online-jair08-zped08s-projects.vercel.app/_test | jq .
curl -s https://tienda-online-jair08-zped08s-projects.vercel.app/_debug | jq '.fs.taskdir | length'
```

### 4.3 Post-deploy

```bash
# 1. Si todo pasa, marcar commit con [deploy:ok]
git commit -m "feat: descripción del cambio [build:ok] [deploy:ok]"

# 2. Si algo falla, revertir
npx vercel rollback

# 3. Y debuggear usando este playbook
```

### 4.4 Rollback Manual

```bash
# Revertir al deployment anterior
npx vercel rollback --token=$VERCEL_TOKEN

# O desplegar un commit específico
npx vercel deploy --prod <commit-sha>
```

---

## 5. Comandos Útiles

### 5.1 Vercel CLI

| Comando | Propósito |
|---------|-----------|
| `npx vercel` | Deploy a preview |
| `npx vercel --prod` | Deploy a producción |
| `npx vercel --prod --force` | Forzar deploy a producción (ignora cache) |
| `npx vercel deploy --prebuilt --prod` | Deploy usando build previo |
| `npx vercel rollback` | Revertir al deployment anterior |
| `npx vercel ls` | Listar deployments |
| `npx vercel alias ls` | Listar alias configurados |
| `npx vercel logs <url>` | Ver logs de una deployment |
| `npx vercel pull` | Sincronizar variables de entorno de Vercel |
| `npx vercel env pull` | Descargar .env desde Vercel |

### 5.2 curl (diagnóstico)

| Comando | Propósito |
|---------|-----------|
| `curl -sI <url>/_health \| head -5` | Headers de respuesta (status, content-type, x-request-id) |
| `curl -s <url>/_health \| jq .` | Health check rápido |
| `curl -s <url>/_diag \| jq '.env'` | Listar env vars (filtradas) |
| `curl -s <url>/_test \| jq .` | Verificar carga de módulos NestJS |
| `curl -s <url>/_debug \| jq '.fs.taskdir'` | Listar filesystem de la Lambda |
| `curl -s <url>/_debug \| jq '.steps'` | Ver pasos de inicialización |
| `curl -s -o /dev/null -w "%{http_code}" <url>/api/v1/health` | Solo código de estado |
| `curl -s -X POST <url>/api/v1/auth/login -H 'Content-Type: application/json' -d '{"email":"admin@tienda.local","password":"Admin123!"}' \| jq '.tokens \| keys'` | Verificar que login retorna tokens |

### 5.3 Scripts del proyecto

| Comando | Propósito |
|---------|-----------|
| `bash scripts/verify-deploy.sh <url>` | Health check completo (/_health, /_diag, /api/v1/health, login) |
| `cd apps/api && npm run build` | Build local con NestJS CLI |
| `npm run build:api` | Build local desde raíz |
| `npm run build` | Build completo (api + web) |

### 5.4 Verificación de URL de Producción

```bash
# Verificar que la URL de producción está actualizada
PROD_URL="https://tienda-online-jair08-zped08s-projects.vercel.app"

# Obtener el deployment ID de la URL actual
curl -sI "$PROD_URL/_health" | grep -i "x-vercel-id"

# Comparar con preview
PREVIEW_URL="https://tienda-online-git-main-zped08s-projects.vercel.app"
curl -sI "$PREVIEW_URL/_health" | grep -i "x-vercel-id"

# Si difieren, la producción no está actualizada → ver sección 3.4
```

---

## 6. Referencias

| Documento | Descripción |
|-----------|-------------|
| `061_INVESTIGATION_BACKEND_VERCEL_DEPLOY_1_0_DRAFT.md` | Investigación completa de regresiones de build/deploy |
| `041_BUGFIX_BACKEND_INIT_1_0_DRAFT.md` | Bugfix: Error init_failed en backend NestJS en Vercel |
| `057_BUGFIX_BACKEND_LAMBDA_CRASH_1_0_DRAFT.md` | Bugfix: Lambda crash y 404 en GET /api/v1/bot/status |
| `059_BUGFIX_BACKEND_PRISMA_VERCEL_1_0_DRAFT.md` | Bugfix: PrismaClient crash en Vercel Lambda |
| `060_BUGFIX_BACKEND_INCLUDEFILES_1_0_DRAFT.md` | Bugfix: includeFiles no incluye dist/ en Lambdas de Vercel |
| `058_ADR_DEPLOY_FLOW_VERCEL_1_0_DRAFT.md` | ADR — Deploy Flow Vercel |
| `049_EXEC_DEPLOY_VERCEL_1_0_DRAFT.md` | Plan de Deploy en Vercel |

### Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `vercel.json` | Configuración global de build, installCommand, rewrites, headers |
| `apps/api/api/handler.js` | Entry point serverless para /api/v1/* |
| `apps/api/api/health.js` | Entry point para /_health (sin dependencias) |
| `apps/api/api/diagnostic.js` | Entry point para /_diag (diagnóstico de env vars) |
| `apps/api/api/test.js` | Entry point para /_test (carga de módulos) |
| `apps/api/api/debug.js` | Entry point para /_debug (filesystem en Lambda) |
| `apps/api/api/fix-prisma-config.js` | Script para parchear Prisma postinstall |
| `apps/api/src/main.ts` | Bootstrap + export de createApp() |
| `scripts/verify-deploy.sh` | Health check post-deploy |
| `.github/workflows/ci.yml` | CI pipeline con tests + deploy + health check |
