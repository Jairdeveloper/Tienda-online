---
id: 038
area: frontend
type: PLAN
module: frontend
version: "1.0"
status: DRAFT
tags:
  - frontend
  - production
  - deploy
  - plan
summary: "Plan de implementación para llevar el frontend SPA (Vite + React + TypeScript + Tailwind CSS v4) a producción. Define opciones de deploy, configuración necesaria, optimizaciones pre-producción, riesgos y criterios de aceptación."
keywords:
  - frontend
  - produccion
  - deploy
  - vercel
  - netlify
  - SPA
  - react
  - vite
  - tailwind
changelog:
  - version: "1.0"
    date: 2026-06-01
    author: workflow-agent
    changes:
      - "Creación inicial del plan de producción para frontend"
---

# Plan de Produccion — Frontend SPA @tienda/api

## 1. Objetivo

Desplegar el frontend SPA (Vite + React 19 + TypeScript + Tailwind CSS v4) en un entorno de produccion, conectado al backend NestJS ya operativo en `https://tienda-online-zped08s-projects.vercel.app/api/v1`. El resultado debe ser una aplicacion web funcional, rapida, segura y accesible publicamente.

## 2. Requisitos Previos

| Requisito                                | Estado        | Notas                                                           |
| ---------------------------------------- | ------------- | --------------------------------------------------------------- |
| Backend NestJS en produccion (Vercel)    | ✅ Completo   | URL: `https://tienda-online-zped08s-projects.vercel.app/api/v1` |
| Frontend Fases 0-6 completadas           | ✅ Completo   | Ver docs/021, 022, 031-037                                      |
| Build exitoso (`npm run build:frontend`) | ✅ Verificado | 25 chunks, ~561 KB main chunk (166 KB gzip)                     |
| Repositorio GitHub con acceso            | ✅ Completo   | `main` branch, CI configurado                                   |
| Cuenta Vercel/Netlify                    | Pendiente     | Requiere creacion si no existe                                  |
| Dominio propio (opcional)                | Pendiente     | Recomendable para produccion real                               |

### 2.1 Dependencias documentales

| ID  | Documento                              | Relacion                                |
| --- | -------------------------------------- | --------------------------------------- |
| 021 | `021_API_FRONTEND_SPEC_1_0_DRAFT.md`   | Especificacion de API del frontend      |
| 022 | `022_EXEC_FRONTEND_PLAN_1_0_DRAFT.md`  | Plan de ejecucion original del frontend |
| 031 | `031_FRONTEND_EXEC_FASE0_1_0_DRAFT.md` | Setup del proyecto (Fase 0)             |
| 032 | `032_FRONTEND_EXEC_FASE1_1_0_DRAFT.md` | Auth y routing (Fase 1)                 |
| 033 | `033_FRONTEND_EXEC_FASE2_1_0_DRAFT.md` | Catalogo y productos (Fase 2)           |
| 034 | `034_FRONTEND_EXEC_FASE3_1_0_DRAFT.md` | Carrito y checkout (Fase 3)             |
| 035 | `035_FRONTEND_EXEC_FASE4_1_0_DRAFT.md` | Pedidos y pagos (Fase 4)                |
| 036 | `036_FRONTEND_EXEC_FASE5_1_0_DRAFT.md` | Panel admin (Fase 5)                    |
| 037 | `037_FRONTEND_EXEC_FASE6_1_0_DRAFT.md` | QA y polish (Fase 6)                    |

## 3. Opciones de Deploy

### Opcion A: Vercel (mismo proyecto que el backend)

| Aspecto                 | Detalle                                                                        |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Plataforma**          | Vercel - mismo equipo/proyecto que el backend                                  |
| **Dominio**             | Comparte dominio base: `tienda-online.vercel.app` con ruta `/app` o subdominio |
| **Build command**       | Configurable por directorio raiz o con `vercel.json` por framework             |
| **SPA routing**         | Rewrites en `vercel.json` para fallback a `index.html`                         |
| **Preview Deployments** | Automaticos por PR (mismo proyecto)                                            |
| **CI/CD**               | Integracion automatica con GitHub                                              |

**Ventajas:**

- Mismo dominio base = sin CORS (mismo `origin` si se sirve desde ruta `/app`)
- Un unico punto de gestion (equipo, facturacion, logs)
- Preview deployments unificados
- Variables de entorno compartidas en el mismo equipo Vercel

**Desventajas:**

- `vercel.json` compartido puede generar conflictos de configuracion
- Construir frontend y backend en el mismo pipeline complica el build
- Si se usa ruta (`/app`), el backend debe ignorar esas rutas o el frontend debe servirse desde Vercel Edge config
- Mayor riesgo de afectar el deploy del backend al modificar configuracion compartida

### Opcion B: Vercel (proyecto separado)

| Aspecto              | Detalle                                                               |
| -------------------- | --------------------------------------------------------------------- |
| **Plataforma**       | Vercel - proyecto independiente del backend                           |
| **Dominio**          | Dominio separado: `tienda-frontend.vercel.app`                        |
| **Build command**    | `npm run build:frontend`                                              |
| **Output directory** | `dist-frontend/`                                                      |
| **SPA routing**      | Rewrites en `vercel.json` para SPA                                    |
| **CI/CD**            | Integracion automatica con GitHub (mismo repo, distintos directorios) |

**Ventajas:**

- Independencia total: cambios en frontend no afectan backend
- Configuracion de build dedicada y optimizada solo para frontend
- Escalado independiente (funciones serverless del backend vs static del frontend)
- Despliegues y rollbacks independientes

**Desventajas:**

- CORS necesario: el frontend en `tienda-frontend.vercel.app` debe llamar al backend en `tienda-online.vercel.app`
- Dos proyectos que gestionar
- Dominio separado (menos profesional si se busca unidad)

### Opcion C: Netlify

| Aspecto              | Detalle                                          |
| -------------------- | ------------------------------------------------ |
| **Plataforma**       | Netlify                                          |
| **Dominio**          | `tienda-frontend.netlify.app`                    |
| **Build command**    | `npm run build:frontend`                         |
| **Output directory** | `dist-frontend/`                                 |
| **SPA routing**      | `netlify.toml` con redirect `/* /index.html 200` |
| **CI/CD**            | Integracion automatica con GitHub                |

**Ventajas:**

- Configuracion SPA routing extremadamente simple (`netlify.toml`)
- Excelente rendimiento global (CDN global)
- Formularios, funciones serverless y redirects nativos
- Plan gratuito generoso

**Desventajas:**

- Plataforma adicional que gestionar (si ya se usa Vercel para backend)
- Sin preview deployments integrados con el ecosistema Vercel
- Funciones serverless en otra plataforma (si se necesitan)

### 3.1 Recomendacion

**Opcion recomendada: Opcion B - Vercel (proyecto separado)**

Justificacion:

1. El backend ya esta en Vercel - mismo ecosistema, misma cuenta
2. Independencia total de configuracion: el `vercel.json` del frontend no interfiere con el del backend
3. CORS es un problema conocido y resoluble: el backend ya deberia tener CORS configurado para el origen del frontend
4. Despliegues y rollbacks independientes: critical para un entorno de produccion real
5. Preview deployments separados: cada PR del frontend genera su propia preview URL
6. Facil migracion futura a dominio personalizado (subdominio `app.tienda.com`)

## 4. Configuracion Necesaria

### 4.1 Archivo `vercel.json` (raiz del proyecto)

```json
{
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "dist-frontend",
  "devCommand": "npm run dev:frontend",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Este archivo debe colocarse en la raiz del repositorio. Vercel detectara automaticamente Vite como framework.

### 4.2 Build command

El comando de build debe ser:

```bash
npm run build:frontend
```

Verificar que `package.json` contenga este script:

```json
{
  "scripts": {
    "build:frontend": "vite build --config vite.config.ts --outDir dist-frontend"
  }
}
```

### 4.3 Output directory

`dist-frontend/` - directorio donde Vite genera los archivos estaticos (HTML, JS, CSS, assets).

### 4.4 Environment Variables

| Variable            | Valor                                                      | Donde configurar                                   |
| ------------------- | ---------------------------------------------------------- | -------------------------------------------------- |
| `VITE_API_BASE_URL` | `https://tienda-online-zped08s-projects.vercel.app/api/v1` | Vercel Dashboard > Project > Environment Variables |

### 4.5 Node.js version

Vercel usa Node.js 22.x por defecto (compatible con el proyecto). Si es necesario fijar la version, usar `engines` en `package.json`:

```json
{
  "engines": {
    "node": ">=22.0.0"
  }
}
```

## 5. Dominio

### Opciones de dominio:

1. **Subdominio**: `app.tienda.com` o `tienda.example.com` - recomendado para produccion real
2. **Ruta**: `tienda.com/app` - si se unifica con el backend en el mismo dominio
3. **Subdominio de Vercel**: `<project>.vercel.app` - gratuito, para primeras etapas

Para configurar dominio personalizado en Vercel:

1. Agregar dominio en Vercel Dashboard > Project > Domains
2. Configurar registro CNAME en el DNS del dominio apuntando a `cname.vercel-dns.com`
3. Vercel provee SSL/TLS automatico (Let's Encrypt)

## 6. CI/CD

### 6.1 Vercel Auto-deploy (recomendado)

Vercel detecta cambios en la rama `main` del repositorio y despliega automaticamente. Por cada PR genera una preview URL.

Configuracion minima necesaria en Vercel:

- **Production Branch**: `main`
- **Build command**: `npm run build:frontend`
- **Output directory**: `dist-frontend`
- **Root directory**: `/` (raiz del repo)

### 6.2 GitHub Actions (alternativa)

Si se prefiere un pipeline manual, crear `.github/workflows/deploy-frontend.yml`:

```yaml
name: Deploy Frontend

on:
  push:
    branches: [main]
    paths:
      - "web/**"
      - "vite.config.ts"
      - "tsconfig.frontend.json"
      - "package.json"

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run build:frontend
      - uses: JamesIves/github-pages-deploy-action@v4
        with:
          folder: dist-frontend
          clean: true
```

## 7. Optimizaciones Pre-produccion

### 7.1 Bundle Size

Estado actual: chunk principal 561 KB (166 KB gzip), 25 chunks totales.

Acciones recomendadas:

| Accion                                                                                         | Impacto                      | Prioridad |
| ---------------------------------------------------------------------------------------------- | ---------------------------- | --------- |
| Analizar bundle con `vite build --analyze`                                                     | Identifica librerias pesadas | Alta      |
| Mover React a CDN externo via `vite.config.ts` `build.rollupOptions.external`                  | Reduce bundle principal      | Media     |
| Comprimir imagenes estaticas                                                                   | Reduce assets                | Baja      |
| Revisar dependencias no usadas                                                                 | Reduce bundle                | Media     |
| Configurar `manualChunks` para separar vendors (React, Router, Query) en chunks independientes | Mejora caching               | Alta      |

### 7.2 Meta Tags y SEO

Agregar en `index.html`:

```html
<title>Tienda Online</title>
<meta name="description" content="Tienda online de productos" />
<meta property="og:title" content="Tienda Online" />
<meta property="og:description" content="Tu tienda de confianza" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
```

### 7.3 Analytics y Monitoreo

Opciones recomendadas:

- **Vercel Analytics**: nativo, sin configuracion extra, gratis
- **Sentry**: monitoreo de errores en frontend (recomendado)
- **Google Analytics 4** o **Plausible**: analitica de usuarios

### 7.4 Performance

- Verificar Lighthouse score > 90
- Configurar `Cache-Control` headers via vercel.json
- Preload fuentes y assets criticos
- Server-side rendering no necesario (SPA con code-splitting suficiente)

## 8. Riesgos y Mitigaciones

| Riesgo                                                       | Impacto    | Probabilidad | Mitigacion                                                                                         |
| ------------------------------------------------------------ | ---------- | ------------ | -------------------------------------------------------------------------------------------------- |
| **CORS**: frontend y backend en dominios separados           | Bloqueante | Alta         | Configurar CORS en backend para aceptar el origen del frontend. Verificar `config/cors.config.ts`  |
| **JWT en localStorage**: expuesto a XSS                      | Alto       | Baja         | Usar httpOnly cookies si es posible; implementar Content-Security-Policy headers; sanitizar inputs |
| **Tamaño de bundle**: 561 KB main chunk                      | Medio      | Media        | Implementar `manualChunks` para separar vendors; analizar dependencias pesadas                     |
| **Rate limiting**: API bloquea peticiones del frontend       | Medio      | Media        | Configurar rate limiting por origin en backend; implementar retry logic en Axios                   |
| **Cache CDN**: versiones antiguas servidas                   | Bajo       | Alta         | Configurar headers de cache; usar hash en nombres de archivo (Vite lo hace por defecto)            |
| **DNS propagation**: cambios de dominio tardan en propagarse | Bajo       | Media        | Planificar ventana de deploy; mantener URL anterior funcionando                                    |
| **Node version incompatibility**: version de Node en Vercel  | Bloqueante | Baja         | Fijar `engines.node` en `package.json`                                                             |

## 9. Criterios de Aceptacion

| ID    | Criterio                                                                  | Medicion                   | Metodo de verificacion                               |
| ----- | ------------------------------------------------------------------------- | -------------------------- | ---------------------------------------------------- |
| CA-01 | Landing page carga en <3s en 3G                                           | Tiempo de carga            | Lighthouse simulado en 3G                            |
| CA-02 | Login/registro funcional                                                  | Flujo completo             | Prueba manual: registrar -> login -> logout -> login |
| CA-03 | Catalogo con productos visibles                                           | API responde con productos | Ver pagina ProductList                               |
| CA-04 | Flujo completo: login -> catalogo -> carrito -> checkout -> pago -> orden | Sin errores                | Prueba E2E manual                                    |
| CA-05 | Panel admin accesible con rol admin                                       | Rutas protegidas           | Login como admin -> navegar admin                    |
| CA-06 | Sin errores 4xx/5xx en consola                                            | Network tab                | Navegar todas las paginas                            |
| CA-07 | HTTPS activo                                                              | Certificado valido         | Inspeccionar URL                                     |
| CA-08 | Responsive: mobile y desktop                                              | Layout correcto            | Prueba en viewports 375px y 1440px                   |
| CA-09 | Code-splitting funcional: chunks se cargan bajo demanda                   | Network tab                | Verificar carga de chunk por pagina                  |
| CA-10 | ErrorBoundary y toasts funcionan                                          | Simular error              | Desconectar API y ver UI de error                    |

## 10. Proximo paso

El presente documento define **que** hay que hacer. Para la ejecucion detallada de cada fase, consultar `039_EXEC_FRONTEND_PRODUCCION_1_0_DRAFT.md` que contiene las tareas, comandos y criterios de exito paso a paso.
