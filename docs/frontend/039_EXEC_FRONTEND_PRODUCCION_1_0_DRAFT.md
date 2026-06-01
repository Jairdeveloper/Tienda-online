---
id: 039
area: frontend
type: EXEC
module: frontend
version: "1.0"
status: DRAFT
tags:
  - frontend
  - execution
  - deploy
  - production
summary: "Plan de ejecucion detallado para desplegar el frontend SPA a produccion. Define 7 fases secuenciales con tareas, archivos a modificar, comandos y criterios de exito. Estimacion total: 4-5 dias."
keywords:
  - frontend
  - produccion
  - deploy
  - vercel
  - ejecucion
  - fases
  - tareas
  - comandos
changelog:
  - version: "1.0"
    date: 2026-06-01
    author: workflow-agent
    changes:
      - "Creacion inicial del plan de ejecucion para produccion frontend"
---

# Plan de Ejecucion — Frontend a Produccion

## Resumen

Ejecucion del plan definido en `038_FRONTEND_PLAN_PRODUCCION_1_0_DRAFT.md`.
Siete fases secuenciales para llevar el frontend SPA de desarrollo a produccion.
Cada fase incluye tareas detalladas, archivos a modificar, comandos y criterios
de exito.

**Estimacion total:** 4-5 dias.

**Plataforma elegida:** Vercel (proyecto separado del backend).
Ver `038_FRONTEND_PLAN_PRODUCCION_1_0_DRAFT.md` seccion 3.1 para justificacion.

---

## Diagrama de Precedencia

```
Prod.1 (Decidir plataforma + crear proyecto)
   |
   v
Prod.2 (Configurar build y deploy)
   |
   v
Prod.3 (Configurar SPA routing)
   |
   v
Prod.4 (Pruebas de integracion con backend produccion)
   |
   +----------+
   |          |
   v          v
Prod.5     Prod.6
(Optimizac.) (QA final)
   |          |
   +-----+----+
         |
         v
      Prod.7
   (Doc + deploy final)
```

**Dependencias clave:**

- Prod.2 depende de Prod.1 (necesita la plataforma definida)
- Prod.3 depende de Prod.2 (necesita build configurado para probar routing)
- Prod.4 depende de Prod.3 (necesita routing funcionando para probar integracion)
- Prod.5 y Prod.6 pueden ejecutarse en paralelo (optimizaciones y QA son independientes)
- Prod.7 depende de Prod.5 y Prod.6 (deploy final requiere todo aprobado)

---

## Fase Prod.1: Decidir plataforma de deploy + crear proyecto

**Estimacion:** 0.5 dias

**Dependencias:** Ninguna

### Tarea 1.1: Evaluar y confirmar plataforma

**Descripcion:** Revisar la recomendacion de la seccion 3 del plan y confirmar
la plataforma de deploy. Se recomienda Vercel (proyecto separado).

**Archivos a modificar:** Ninguno (decision arquitectonica).

**Comandos:**

```bash
# Verificar cuenta Vercel existente
vercel whoami
# Si no existe, crear cuenta en https://vercel.com
```

**Criterios de exito:**

- [ ] Cuenta Vercel activa
- [ ] Equipo Vercel creado (o reutilizar el existente del backend)
- [ ] Plan de facturacion definido (Hobby gratis para empezar)

### Tarea 1.2: Crear proyecto Vercel

**Descripcion:** Crear el proyecto frontend en Vercel. No conectar repositorio
aun; se configurara en Prod.2.

**Archivos a modificar:** Ninguno.

**Comandos:**

```bash
# Crear proyecto via Vercel CLI o Dashboard
vercel projects add tienda-frontend
# Configurar framework como Vite
```

**Criterios de exito:**

- [ ] Proyecto `tienda-frontend` visible en Vercel Dashboard
- [ ] Team asignado correctamente

### Tarea 1.3: Configurar dominio temporal

**Descripcion:** Vercel asigna automaticamente un dominio `<project>.vercel.app`.
Para esta fase es suficiente el dominio de Vercel.

**Archivos a modificar:** Ninguno.

**Criterios de exito:**

- [ ] Dominio `https://tienda-frontend.vercel.app` accesible (mostrara 404 hasta deploy)

---

## Fase Prod.2: Configurar build y deploy

**Estimacion:** 0.5 dias

**Dependencias:** Prod.1 completada

### Tarea 2.1: Verificar script de build frontend

**Descripcion:** Asegurar que `package.json` tiene el script correcto para
construir el frontend.

**Archivos a modificar:** `package.json`

**Verificar que existe:**

```json
{
  "scripts": {
    "build:frontend": "vite build --config vite.config.ts --outDir dist-frontend"
  }
}
```

**Comandos:**

```bash
# Verificar que npm run build:frontend funciona
npm run build:frontend
# Verificar que genera dist-frontend/
ls -la dist-frontend/
```

**Criterios de exito:**

- [ ] `npm run build:frontend` completa sin errores
- [ ] Directorio `dist-frontend/` creado con index.html + assets/
- [ ] 25+ chunks generados (code-splitting funcional)

### Tarea 2.2: Conectar repositorio a Vercel

**Descripcion:** Conectar el repositorio GitHub al proyecto Vercel.

**Pasos en Vercel Dashboard:**

1. Importar repositorio desde GitHub
2. Seleccionar proyecto `tienda-frontend`
3. Configurar:
   - **Root Directory:** `./` (raiz del repositorio)
   - **Build Command:** `npm run build:frontend`
   - **Output Directory:** `dist-frontend`
   - **Install Command:** `npm ci`

**Archivos a modificar:** Ninguno (configuracion via Dashboard).

**Criterios de exito:**

- [ ] Repositorio conectado a Vercel
- [ ] Primer build automatico iniciado
- [ ] Build exitoso (green check en Vercel Dashboard)

### Tarea 2.3: Configurar environment variables

**Descripcion:** Agregar la variable de entorno `VITE_API_BASE_URL` en el
proyecto Vercel.

**Archivos a modificar:** Ninguno (configuracion via Vercel Dashboard o CLI).

**Comandos:**

```bash
vercel env add VITE_API_BASE_URL production
# Valor: https://tienda-online-zped08s-projects.vercel.app/api/v1

# Verificar
vercel env ls
```

**Criterios de exito:**

- [ ] `VITE_API_BASE_URL` configurada en produccion
- [ ] Build reciente con la variable visible en el bundle (verificar en `dist-frontend/assets/*.js`)

### Tarea 2.4: Verificar build en Vercel

**Descripcion:** Una vez configurado el proyecto, Vercel ejecuta un build
automatico. Verificar que el deploy sea exitoso y que la URL de preview
sirva el contenido estatico.

**Comandos:**

```bash
# Verificar deploy mas reciente
vercel list --all

# Abrir URL de preview
open https://tienda-frontend.vercel.app
```

**Criterios de exito:**

- [ ] Deploy exitoso (status "Ready")
- [ ] URL devuelve HTML del frontend
- [ ] Consola del navegador sin errores de carga de recursos

---

## Fase Prod.3: Configurar SPA routing

**Estimacion:** 0.5 dias

**Dependencias:** Prod.2 completada

### Tarea 3.1: Crear/verificar `vercel.json`

**Descripcion:** Vercel necesita una configuracion de rewrites para que todas
las rutas del SPA (incluyendo `/products`, `/cart`, `/checkout`, `/admin/*`)
sirvan `index.html` en lugar de devolver 404.

**Archivos a modificar:** `vercel.json` (crear en raiz del repositorio si no
existe; si ya existe por el backend, crear configuracion separada o unificar).

**Contenido de `vercel.json`:**

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

**Comandos:**

```bash
# Verificar que el archivo existe
cat vercel.json
# Si el backend ya tiene un vercel.json, considerar crear
# un archivo separado o usar configuracion por framework
```

**Nota importante:** Si el backend ya usa `vercel.json` en la raiz, hay dos
opciones:

- **Opcion A (recomendada):** Usar proyecto Vercel separado (Opcion B del
  plan), cada uno con su propio `vercel.json` en el mismo repositorio pero
  con configuracion de Root Directory diferente.
- **Opcion B:** Unificar en un unico `vercel.json` que sirva el frontend desde
  `/app/*` y el backend desde `/api/*`. Mas complejo y no recomendado.

**Criterios de exito:**

- [ ] `vercel.json` presente en raiz
- [ ] Rewrites configurados correctamente
- [ ] Tras deploy, rutas como `/login`, `/cart`, `/checkout` sirven el SPA sin 404

### Tarea 3.2: Probar SPA routing localmente

**Descripcion:** Antes de desplegar, verificar que el comportamiento de SPA
routing funciona localmente.

**Comandos:**

```bash
# Probar que el build sirve correctamente con un servidor estatico
npx serve dist-frontend -s -l 3000
# -s: modo SPA (todas las rutas sirven index.html)
# Abrir http://localhost:3000/login
# Abrir http://localhost:3000/cart
```

**Criterios de exito:**

- [ ] `serve dist-frontend -s` sirve todas las rutas
- [ ] Navegacion cliente (React Router) funciona sin recarga de pagina
- [ ] Recarga de pagina en cualquier ruta no da 404

### Tarea 3.3: Desplegar y verificar routing en Vercel

**Descripcion:** Hacer push a `main` (o deploy manual) y verificar que el
routing funciona en el entorno de produccion.

**Comandos:**

```bash
git add vercel.json
git commit -m "feat: add vercel.json with SPA rewrites for frontend"
git push origin main
# Esperar a que Vercel deploye automaticamente
```

**Criterios de exito:**

- [ ] Deploy automatico exitoso
- [ ] Verificar rutas manualmente en URL de produccion:
  - `/` → Home
  - `/login` → Login page
  - `/products` → ProductList
  - `/cart` → Cart
  - `/checkout` → Checkout
  - `/admin` → Admin Dashboard (pide login si no autenticado)
- [ ] Recarga de pagina en cada ruta funciona (no 404)

---

## Fase Prod.4: Pruebas de integracion con backend produccion

**Estimacion:** 1 dia

**Dependencias:** Prod.3 completada

### Tarea 4.1: Verificar CORS

**Descripcion:** El backend en produccion debe aceptar peticiones desde el
origen del frontend.

**Archivos a modificar (backend):** `src/config/cors.config.ts` o similar

**Verificar:**

```bash
# Probar peticion CORS desde el frontend desplegado
curl -H "Origin: https://tienda-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  https://tienda-online-zped08s-projects.vercel.app/api/v1/health \
  -v 2>&1 | grep -i "access-control"
```

**Deberia mostrar:**

```
< access-control-allow-origin: https://tienda-frontend.vercel.app
< access-control-allow-methods: GET,POST,PUT,PATCH,DELETE
< access-control-allow-headers: Content-Type,Authorization
```

**Si falla:** Modificar backend para incluir el origen del frontend en CORS.

**Criterios de exito:**

- [ ] Preflight OPTIONS responde con headers CORS correctos
- [ ] Peticiones GET/POST desde frontend funcionan sin errores CORS en consola

### Tarea 4.2: Probar flujo de autenticacion

**Descripcion:** Verificar registro, login y persistencia de sesion contra
el backend de produccion.

**Pasos:**

1. Abrir `https://tienda-frontend.vercel.app`
2. Ir a `/register` y crear un usuario nuevo
3. Verificar redireccion a `/login` o auto-login
4. Hacer login con las credenciales creadas
5. Verificar que el JWT se almacena (localStorage)
6. Recargar pagina y verificar que la sesion persiste

**Criterios de exito:**

- [ ] Registro exitoso: 201 desde backend
- [ ] Login exitoso: 200 con JWT
- [ ] Sesion persiste tras recarga
- [ ] Logout elimina tokens y redirige a login

### Tarea 4.3: Probar flujo catalogo

**Descripcion:** Verificar que el catalogo de productos carga y permite
busqueda, filtrado y paginacion.

**Pasos:**

1. Ir a `/products`
2. Verificar que la lista de productos se carga
3. Probar busqueda por texto
4. Probar filtro por categoria
5. Probar paginacion
6. Hacer clic en un producto y ver detalle con variantes y stock

**Criterios de exito:**

- [ ] Lista de productos visible (datos del seed: 5 productos)
- [ ] Busqueda funciona (debounced)
- [ ] Filtro por categoria funciona
- [ ] Paginacion funciona (siguiente/anterior)
- [ ] ProductDetail muestra variantes con stock

### Tarea 4.4: Probar flujo carrito y checkout

**Descripcion:** Verificar el flujo completo de compra.

**Pasos:**

1. Ir a un producto y agregarlo al carrito
2. Ir a `/cart` y verificar items
3. Modificar cantidad (+/-)
4. Eliminar item
5. Volver a agregar producto
6. Ir a `/checkout`
7. Seguir el flujo multi-step: resumen -> direccion -> pago -> confirmar

**Criterios de exito:**

- [ ] Agregar al carrito funciona (actualiza badge)
- [ ] Cantidad actualizable
- [ ] Item eliminable
- [ ] Carrito vacio muestra empty state
- [ ] Checkout multi-step funcional
- [ ] Orden creada exitosamente

### Tarea 4.5: Probar flujo de pedidos

**Descripcion:** Verificar que los pedidos se listan y el detalle funciona.

**Pasos:**

1. Ir a `/orders`
2. Verificar lista de pedidos (debe mostrar el pedido creado en 4.4)
3. Abrir detalle de pedido
4. Verificar estado y items

**Criterios de exito:**

- [ ] OrderList muestra pedidos del usuario
- [ ] OrderDetail muestra informacion completa
- [ ] Estados de pago correctos

### Tarea 4.6: Probar panel admin

**Descripcion:** Verificar acceso al panel de administracion con usuario admin.

**Pasos:**

1. Login con admin (`admin@tienda.local` / `Admin123!`)
2. Ir a `/admin`
3. Navegar Dashboard, Orders, Products, Inventory
4. Probar cambio de estado de orden
5. Probar edicion de producto

**Criterios de exito:**

- [ ] Admin route guard redirige a login si no es admin
- [ ] Dashboard muestra datos
- [ ] CRUD de ordenes funcional
- [ ] CRUD de productos funcional
- [ ] Inventory management funcional

---

## Fase Prod.5: Optimizaciones pre-produccion

**Estimacion:** 1 dia

**Dependencias:** Prod.4 completada

### Tarea 5.1: Optimizar chunk de vendors

**Descripcion:** Separar las librerias principales (React, React Router,
TanStack Query, Axios) en chunks de vendors independientes para mejorar
caching.

**Archivos a modificar:** `vite.config.ts`

**Cambio sugerido:**

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'vendor-react': ['react', 'react-dom'],
        'vendor-router': ['react-router-dom'],
        'vendor-query': ['@tanstack/react-query'],
        'vendor-axios': ['axios'],
      },
    },
  },
},
```

**Comandos:**

```bash
# Rebuild y verificar nueva distribucion de chunks
npm run build:frontend
ls -la dist-frontend/assets/
# Verificar que aparecen vendor-react-*.js, vendor-router-*.js, etc.
```

**Criterios de exito:**

- [ ] Chunks de vendors separados con hashes estables
- [ ] Chunk principal reducido significativamente
- [ ] Carga inicial no aumenta (puede haber mas requests paralelos pero mejor caching)

### Tarea 5.2: Analizar bundle en busca de dependencias pesadas

**Descripcion:** Usar `vite-plugin-visualizer` o `rollup-plugin-visualizer`
para identificar dependencias que inflan el bundle.

**Archivos a modificar:** `vite.config.ts` (agregar plugin temporalmente)

**Comandos:**

```bash
# Instalar visualizer como devDependency
npm install -D rollup-plugin-visualizer

# Agregar al final de vite.config.ts
# import { visualizer } from 'rollup-plugin-visualizer';
# plugins: [..., visualizer({ open: true })]
# Luego:
npm run build:frontend
# Se abrira un grafico en el navegador mostrando el peso de cada modulo
```

**Criterios de exito:**

- [ ] Identificadas las 5 dependencias mas pesadas
- [ ] Evaluada posibilidad de reemplazar o eliminar dependencias innecesarias
- [ ] Reporte generado (opcional: adjuntar a documentacion)

### Tarea 5.3: Configurar meta tags y SEO basico

**Descripcion:** Mejorar `index.html` con meta tags para SEO y redes sociales.

**Archivos a modificar:** `index.html`

**Campos a agregar:**

```html
<title>Tienda Online</title>
<meta
  name="description"
  content="Tu tienda online de confianza. Compra productos con envio rapido y seguro."
/>
<meta name="keywords" content="tienda, online, productos, ecommerce" />
<meta name="robots" content="index, follow" />
<meta property="og:title" content="Tienda Online" />
<meta property="og:description" content="Tu tienda online de confianza." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://tienda-frontend.vercel.app" />
<link rel="canonical" href="https://tienda-frontend.vercel.app" />
```

**Comandos:**

```bash
npm run build:frontend
# Verificar que los meta tags aparecen en dist-frontend/index.html
grep -i "og:" dist-frontend/index.html
grep -i "description" dist-frontend/index.html
```

**Criterios de exito:**

- [ ] Meta tags visibles en HTML generado
- [ ] Open Graph tags presentes
- [ ] Canonical URL configurada

### Tarea 5.4: Configurar monitoreo de errores (Sentry)

**Descripcion:** Integrar Sentry para monitoreo de errores en produccion.

**Archivos a modificar:**

- `web/main.tsx` (inicializar Sentry)
- `.env` (agregar `VITE_SENTRY_DSN`)

**Comandos:**

```bash
npm install @sentry/react
```

**Cambio en `web/main.tsx`:**

```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
});
```

**Criterios de exito:**

- [ ] Sentry inicializado en produccion
- [ ] Errores capturados visibles en dashboard de Sentry
- [ ] No afecta rendimiento en desarrollo (entorno condicional)

---

## Fase Prod.6: QA final

**Estimacion:** 1 dia

**Dependencias:** Prod.4 completada. Puede ejecutarse en paralelo con Prod.5.

### Tarea 6.1: Pruebas de rendimiento (Lighthouse)

**Descripcion:** Ejecutar Lighthouse en la URL de produccion y verificar
puntuaciones minimas.

**Comandos:**

```bash
# Usando Lighthouse CLI
npx lighthouse https://tienda-frontend.vercel.app --view --preset=desktop
npx lighthouse https://tienda-frontend.vercel.app --view --preset=desktop --throttling.cpuSlowdownMultiplier=4
```

**Criterios de exito minimos:**

- [ ] Performance > 85
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90

### Tarea 6.2: Pruebas responsive

**Descripcion:** Verificar que todas las paginas se ven correctamente en
viewport mobile (375px) y desktop (1440px).

**Paginas a verificar:**

- Home
- Login / Register
- ProductList (con y sin resultados)
- ProductDetail
- Cart (con items y vacio)
- Checkout (cada paso)
- OrderList (con y sin pedidos)
- OrderDetail
- Admin Dashboard
- Admin Orders / Products / Inventory

**Criterios de exito:**

- [ ] Sin overflow horizontal en 375px
- [ ] Tablas admin con scroll horizontal en mobile
- [ ] Header/menu responsive (hamburguesa en mobile)
- [ ] Formularios usables en mobile
- [ ] Botones con tamano tactil adecuado (> 44px)

### Tarea 6.3: Pruebas de error handling

**Descripcion:** Simular condiciones de error y verificar que la UI responde
adecuadamente.

**Escenarios:**

1. Desconectar internet y navegar → ErrorBoundary o toast de error de conexion
2. Token expirado → Auto-refresh o redireccion a login
3. API devuelve 500 → Toast de error del servidor
4. Pagina inexistente → 404 page (o SPA fallback)
5. Acceso admin sin rol admin → Redireccion a home o error

**Criterios de exito:**

- [ ] ErrorBoundary captura errores de React
- [ ] Toasts muestran errores HTTP (4xx/5xx)
- [ ] Token expirado se refresca automaticamente
- [ ] Redireccion a login si refresh falla
- [ ] Admin route guard funciona

### Tarea 6.4: Prueba de integridad de chunks

**Descripcion:** Verificar que todos los chunks de code-splitting se cargan
correctamente navegando por todas las rutas.

**Comandos:**

```bash
# Usar curl para verificar que todas las rutas SPA sirven HTML
for route in / /login /register /products /cart /checkout /orders /admin /admin/orders /admin/products /admin/inventory; do
  echo "=== Testing $route ==="
  curl -s -o /dev/null -w "HTTP %{http_code}" https://tienda-frontend.vercel.app$route
  echo ""
done
```

**Criterios de exito:**

- [ ] Todas las rutas devuelven 200 (no 404)
- [ ] Navegando por todas las rutas en el navegador no hay errores de chunk loading
- [ ] Lazy loading: cada chunk se carga solo cuando se navega a su ruta

### Tarea 6.5: Prueba de seguridad basica

**Descripcion:** Verificar medidas de seguridad minimas.

**Checklist:**

- [ ] HTTPS activo (certificado valido, no caducado)
- [ ] Headers de seguridad presentes (X-Content-Type-Options, X-Frame-Options)
- [ ] JWT no expuesto en URLs ni logs
- [ ] Formularios con validacion cliente y servidor
- [ ] Sin informacion sensible en source maps (deshabilitar sourcemaps en produccion)

**Comandos:**

```bash
# Verificar headers de seguridad
curl -sI https://tienda-frontend.vercel.app | grep -iE "x-content-type-options|x-frame-options|x-xss-protection|strict-transport-security"

# Verificar que sourcemaps estan deshabilitados en produccion
# En vite.config.ts:
# build: { sourcemap: false }
grep -r "sourcemap" dist-frontend/assets/*.js 2>/dev/null | head -5
```

---

## Fase Prod.7: Documentacion + deploy final

**Estimacion:** 0.5 dias

**Dependencias:** Prod.5 y Prod.6 completadas

### Tarea 7.1: Actualizar CHANGELOG.md

**Descripcion:** Documentar el deploy a produccion en el changelog del proyecto.

**Archivos a modificar:** `CHANGELOG.md`

**Contenido sugerido para `[Unreleased]`:**

```markdown
### Added

- Frontend desplegado a produccion en Vercel
- URL de produccion: https://tienda-frontend.vercel.app
- SPA routing configurado con rewrites en vercel.json
- Monitoreo de errores con Sentry
- Meta tags SEO y Open Graph

### Changed

- Vite build optimizado con manualChunks para vendors
- sourcemap deshabilitado en produccion

### Fixed

- CORS configurado para origen del frontend
```

### Tarea 7.2: Actualizar documentacion del proyecto

**Descripcion:** Agregar la URL de produccion del frontend en AGENTS.md y
documentos relevantes.

**Archivos a modificar:**

- `AGENTS.md` (agregar URL del frontend en la seccion de contexto)
- `README.md` (si existe, agregar badge de deploy)

### Tarea 7.3: Configurar dominio personalizado (opcional)

**Descripcion:** Si se cuenta con un dominio propio, configurarlo en Vercel
para que el frontend sirva desde un subdominio como `app.tienda.com`.

**Archivos a modificar:** Ninguno (configuracion via Vercel Dashboard + DNS).

**Pasos en Vercel Dashboard:**

1. Ir a Project > Settings > Domains
2. Agregar dominio: `app.tienda.com` (o el que corresponda)
3. Seguir instrucciones para configurar registro CNAME en el DNS
4. Esperar propagacion (5 min a 48 horas)

**Criterios de exito:**

- [ ] Dominio personalizado configurado en Vercel
- [ ] Certificado SSL generado automaticamente
- [ ] URL accesible via el nuevo dominio

### Tarea 7.4: Deploy final de produccion

**Descripcion:** Hacer commit de todos los cambios, pushear a `main` y
verificar que el deploy final sea exitoso.

**Comandos:**

```bash
# Verificar que todo esta commiteado
git status

# Commit final
git add -A
git commit -m "feat: deploy frontend to production on Vercel

- vercel.json with SPA rewrites
- Optimized vendor chunks in vite.config.ts
- Meta tags and SEO improvements
- Sentry error monitoring
- Production environment configured"

git push origin main

# Verificar deploy en Vercel
vercel list --all
```

**Criterios de exito:**

- [ ] Commit pusheado a `main`
- [ ] Vercel deploy automatico exitoso
- [ ] URL de produccion funcionando con todos los criterios de aceptacion

---

## Riesgos Especificos de la Ejecucion

| Riesgo                                      | Fase afectada | Plan de mitigacion                                                                                   |
| ------------------------------------------- | ------------- | ---------------------------------------------------------------------------------------------------- |
| **DNS propagation lento**                   | Prod.7        | Configurar dominio con TTL bajo (300s) antes del cambio. Usar URL de Vercel como fallback            |
| **CDN cache de versiones anteriores**       | Prod.7        | Vite genera hashes unicos por contenido en nombres de archivo. Cache CDN se invalida automaticamente |
| **Node version incompatible en Vercel**     | Prod.2        | Fijar `engines.node >= 22.0.0` en `package.json`. Vercel usa Node 22.x por defecto                   |
| **CORS bloqueado en backend**               | Prod.4        | Tener preparado el cambio de configuracion CORS en backend antes de la fase 4                        |
| **Rate limiting en API de produccion**      | Prod.4        | Coordinar con backend para aumentar limites durante pruebas                                          |
| **Bundle demasiado grande (> 2 MB)**        | Prod.5        | Posponer deploy, priorizar separacion de vendors y tree-shaking                                      |
| **Errores de chunk loading (lazy loading)** | Prod.6        | Verificar que `React.lazy` paths son correctos. Probar en modo produccion local con `serve`          |

---

## Criterios de Aceptacion Finales

| ID    | Criterio                                                                  | Metodo de verificacion                | Fase   |
| ----- | ------------------------------------------------------------------------- | ------------------------------------- | ------ |
| CA-01 | Landing page carga en <3s en 3G simulado                                  | Lighthouse con CPU throttling 4x      | Prod.6 |
| CA-02 | Login/registro funcional contra backend produccion                        | Prueba manual completa                | Prod.4 |
| CA-03 | Catalogo con productos visibles desde backend produccion                  | Prueba manual                         | Prod.4 |
| CA-04 | Flujo completo: login -> catalogo -> carrito -> checkout -> pago -> orden | Prueba manual E2E                     | Prod.4 |
| CA-05 | Panel admin accesible con rol admin                                       | Prueba manual                         | Prod.4 |
| CA-06 | Sin errores 4xx/5xx en consola del navegador                              | Network tab                           | Prod.6 |
| CA-07 | HTTPS activo con certificado valido                                       | Inspeccionar URL                      | Prod.7 |
| CA-08 | Responsive: mobile (375px) y desktop (1440px)                             | DevTools responsive mode              | Prod.6 |
| CA-09 | Code-splitting: chunks se cargan bajo demanda                             | Network tab                           | Prod.5 |
| CA-10 | ErrorBoundary y toasts funcionan                                          | Simular error de red                  | Prod.6 |
| CA-11 | Sin sourcemaps en produccion                                              | Verificar ausencia de `.map` en build | Prod.5 |
| CA-12 | Performance Lighthouse > 85                                               | Lighthouse report                     | Prod.6 |

---

## Instruccion Final

**Esperar a nuevas instrucciones del usuario antes de ejecutar.**

Este documento es un plan de ejecucion detallado. Ninguna tarea debe
ejecutarse sin autorizacion explicita del usuario. Cuando el usuario
indique que desea proceder, seguir las fases secuencialmente, marcando
cada tarea como completada antes de pasar a la siguiente.


