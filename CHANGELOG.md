# Changelog

All notable changes to **@tienda/api** are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- Chatbot B2B support foundation and workflow-agent bridge documentation
  - `docs/ai/bot/002_CHATBOT_SPEC_TIENDA_ONLINE_ACTIVE.md`: adds the B2B tienda online chatbot specification with backend/frontend context, roles, permissions, API contract, implementation plan and execution plan
  - `docs/ai/bot/003_CHATBOT_FLOW_TIENDA_ONLINE_ACTIVE.md`: adds ASCII flow diagrams for message processing, admin confirmation, context sources and terminal states
  - `docs/ai/bot/004_CHATBOT_ALGORITHM_TIENDA_ONLINE_ACTIVE.md`: adds the technical pseudocode algorithm using data, information, variables, constants, operators and expressions
  - `bot/tienda-online-support-bot/`: adds a Python chatbot scaffold with session state, auth resolution, text processing, intent classification, policy checks, local knowledge, tool simulation, CLI entrypoint and local virtualenv documentation
  - `docs/ai/bot/005_CHATBOT_IMPLEMENTATION_ACTIONS_1_0_ACTIVE.md`: documents implementation actions, validation commands and known environment notes for the Python bot scaffold
  - `docs/ai/001_CHATBOT_SPEC_ELIZA_v1.0_ACTIVE.md` and `docs/ai/ALGORITMO_ELIZA.md`: add ELIZA reference materials used as chatbot specification precedent
  - `workflow/031_DEV_SPEC_WORKFLOW_BOT_AGENT_1_0_DRAFT.md`: adds the workflow-bot-agent specification to connect `workflow.sh` with the Python bot through file-based orchestration
  - Reason: establishes the initial free/local chatbot support architecture and a path for the workflow script to interact with the bot on behalf of users

- Frontend Prod.1: decision de plataforma y proyecto Vercel
  - Decision estrategica: Opcion B - Vercel (proyecto separado) para el frontend SPA
  - Proyecto `tienda-frontend` creado en Vercel bajo el equipo `zped08s-projects`
  - Analisis de configuracion actual (vercel.json, package.json, vite.config.ts, client.ts)
  - Investigacion de mejores practicas Vercel para SPA Vite (7 fuentes oficiales)
  - Riesgos identificados: CORS, conflicto vercel.json, bundle, SPA 404, Node version, rate limiting
  - Plan estrategico: `docs/frontend/038_FRONTEND_PLAN_PRODUCCION_1_0_DRAFT.md`
  - Plan de ejecucion: `docs/frontend/039_EXEC_FRONTEND_PRODUCCION_1_0_DRAFT.md`
  - Reporte de ejecucion: `docs/frontend/040_FRONTEND_EXEC_PROD1_1_0_DRAFT.md` (seccion Prod.1, v1.0)

- Frontend Prod.2: configurar build y deploy en Vercel
  - `package.json`: script `build:frontend` verificado (vite build, 27 chunks generados)
  - `dist-frontend/` generado con 27 JS chunks + assets de produccion
  - Proyecto `tienda-frontend` linkeado via `vercel link --project tienda-frontend` (projectId: prj_oNCkxw9V7POOAfFyI9CCBO4Qts5Q)
  - `VITE_API_BASE_URL` configurada en Vercel para produccion (`https://tienda-online-zped08s-projects.vercel.app/api/v1`)
  - Frontend desplegado en `https://tienda-frontend-self.vercel.app` con SPA routing funcional
  - SSO protection deshabilitada para acceso publico
  - `vercel.json` raiz modificado localmente: catch-all `/api/(.*)` + SPA rewrite `/(.*)` → `/index.html`
  - Documentacion de ejecucion: `docs/frontend/040_FRONTEND_EXEC_PROD1_1_0_DRAFT.md` extendido con seccion Prod.2 (v1.2)
- `docs/REGISTRO_IDS.md`: registrados IDs 038 (plan produccion), 039 (ejecucion produccion), 040 (reporte Prod.1+Prod.2)
- `.opencode/agents/vercel-deploy.md`: herramienta `bash` agregada para comandos Vercel CLI

- Frontend Prod.3: configurar SPA routing
  - vercel.json verificado con rewrite SPA `/(.*)` → `/index.html` despues de rutas API
  - Prueba local con `npx serve dist-frontend -s`: 10 rutas, todas HTTP 200
  - Prueba en produccion Vercel: 10 rutas, todas HTTP 200, sin 404 en recarga directa

- Frontend Prod.4: pruebas de integracion con backend produccion
  - Frontend SPA carga correctamente (HTML, JS 561KB, CSS 31KB)
  - Health endpoint `/_health` responde 200
  - Error backend preexistente documentado: `init_failed: Cannot find module '../dist/main'`
  - Bugfix backend documentado en `docs/041_BUGFIX_BACKEND_INIT_1_0_DRAFT.md`

- Frontend Prod.5: optimizaciones pre-produccion
  - Vendor chunks separados: react, router, query, axios (manualChunks en vite.config.ts)
  - Chunk principal reducido de 561KB a 414KB (-26%)
  - Meta tags SEO y Open Graph en index.html
  - Bundle analysis ejecutado con rollup-plugin-visualizer (removido post-analisis)

- Frontend Prod.6: QA final
  - Pruebas responsive: viewport configurado, 11 rutas SPA verificadas
  - Error handling: ErrorBoundary global, HTTP interceptor con auto-refresh, 401 handling
  - Seguridad: HTTPS valido, HSTS, sin sourcemaps en produccion
  - Chunk integrity: 30 archivos (29 JS + 1 CSS), 11/11 rutas HTTP 200
  - Lighthouse: no ejecutable en entorno (falta Chrome/Chromium)

- Frontend Prod.7: security headers y documentacion final
  - `vercel.json`: agregado array `headers` con `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block` para todas las rutas `/(.*)`
  - CORS configurado en proyecto Vercel `tienda-online` con `CORS_ORIGIN=https://tienda-frontend-self.vercel.app`
  - Reason: complete frontend production deployment (Prod.1-7) — SPA deployed, routing, optimized, QA passed, security hardened

- Frontend Fase 6 (QA + Polish): error handling global, loading states, responsive design, code-splitting, empty states
  - `web/components/shared/ErrorBoundary.tsx`: ErrorBoundary global con UI amigable y botón Reintentar
  - `web/components/shared/Toast.tsx`: sistema de toasts (success/error/warning/info) con auto-dismiss 5s y animación slide-in
  - `web/components/shared/Skeleton.tsx`: componente skeleton reutilizable con 5 variantes (text, card, table-row, image, circle)
  - `web/components/shared/TableSkeleton.tsx`: esqueleto para tablas con filas/columnas configurables
  - `web/utils/toast.ts`: emisor de toasts standalone para uso desde client.ts sin dependencia React
  - `web/api/client.ts`: interceptor HTTP que muestra toasts para errores 4xx (mensaje del servidor), 5xx ("Error del servidor") y network ("Error de conexión")
  - `web/App.tsx`: envuelto con ErrorBoundary + ToastProvider
  - `web/routes/index.tsx`: code-splitting con React.lazy + Suspense en todas las rutas (25 chunks separados)
  - `web/index.css`: animación slide-in para toasts
  - `web/pages/admin/Orders.tsx`: TableSkeleton + overflow-x-auto + empty state mejorado
  - `web/pages/admin/Products.tsx`: TableSkeleton + overflow-x-auto + empty state mejorado
  - `web/pages/admin/Inventory.tsx`: TableSkeleton + overflow-x-auto + empty state mejorado
  - Documentación de ejecución: `docs/frontend/037_FRONTEND_EXEC_FASE6_1_0_DRAFT.md`
- `docs/REGISTRO_IDS.md`: registrado ID 037 (Fase 6)
- `docs/041_BUGFIX_BACKEND_INIT_1_0_DRAFT.md`: documentacion del bugfix del error `init_failed` en backend NestJS al desplegar en Vercel, con analisis de causa raiz (esbuild bundling rompe rutas relativas) y soluciones aplicadas (path fallback, bundle:false, CORS_ORIGIN)
- `docs/REGISTRO_IDS.md`: registrado ID 041 (BUGFIX backend init)

- Frontend Fase 5 (Admin Panel): panel de administración completo con layout, route guard, y CRUD de pedidos, productos, variantes e inventario
  - `web/types/admin.ts`: interfaces TypeScript para CreateProductInput, UpdateProductInput, CreateVariantInput, UpdateVariantInput, UpdateOrderStatusInput, InventoryItem, UpdateInventoryInput
  - `web/components/admin/AdminRoute.tsx`: route guard que verifica autenticación y rol admin, con spinner loading y mensaje de acceso denegado
  - `web/components/admin/AdminLayout.tsx`: sidebar oscuro (bg-gray-900, w-64) con 4 enlaces, breadcrumb, toggle mobile
  - `web/components/admin/VariantManager.tsx`: CRUD de variantes con modal inline para crear/editar, tabla con SKU/precio/atributos/acciones
  - `web/pages/admin/Dashboard.tsx`: cards con estadísticas rápidas (total pedidos, productos, bajo stock)
  - `web/pages/admin/Orders.tsx`: tabla paginada de pedidos con filtro por estado (pills) y navegación a detalle
  - `web/pages/admin/OrderDetail.tsx`: detalle de orden con items, payments y formulario de cambio de estado (select + textarea)
  - `web/pages/admin/Products.tsx`: tabla paginada de productos con búsqueda, botones nuevo/editar/eliminar con confirmación
  - `web/pages/admin/ProductForm.tsx`: formulario crear/editar producto con categorías (checkboxes), atributos dinámicos, y VariantManager en edición
  - `web/pages/admin/Inventory.tsx`: tabla paginada de inventario con toggle low-stock, filas destacadas en rojo, modal de edición inline
  - `web/routes/index.tsx`: 7 nuevas rutas admin protegidas por AdminRoute con AdminLayout
  - Documentación de ejecución: `docs/frontend/036_FRONTEND_EXEC_FASE5_1_0_DRAFT.md`
- `docs/REGISTRO_IDS.md`: registrado ID 036 (Fase 5)

### Fixed

- Backend `init_failed` error en Vercel: `Cannot find module '../dist/main'` en todos los endpoints `/api/v1/*` — resuelto con path fallback en `api/index.js` (prueba `../dist/main`, luego `./dist/main`) + `bundle: false` + `includeFiles: dist/**` en `vercel.json`
- CORS deshabilitado en producción: `CORS_ORIGIN` vacío causaba `origin: false` en NestJS — configurado `CORS_ORIGIN=https://tienda-frontend-self.vercel.app` en proyecto Vercel `tienda-online`

- CORS configurado para origen del frontend (CORS_ORIGIN en proyecto tienda-online)
- Frontend: Faltaban headers de seguridad (X-Content-Type-Options, X-Frame-Options) en Vercel — resuelto en Prod.7 con array `headers` en vercel.json

- Redis graceful degradation: `UpstashClient`, `CacheService` y `RedisLockService` ahora capturan errores de conexión Redis (WRONGPASS, timeouts) y degradan gracefulmente — cache miss retorna null, locks retornan false, el endpoint `/api/v1/health` reporta `status: degraded` con detalle del error en `redisDetail`
- Migraciones de Prisma aplicadas correctamente a Neon DB (`prisma migrate deploy`): 3 migraciones (baseline, business entities, remove telegram fields) ejecutadas contra la base de datos de producción

### Changed

- `vercel.json`: las variables de entorno `REDIS_URL` y `UPSTASH_REDIS_TOKEN` actualizadas con los valores correctos de Upstash (REST API)

### Added

- Frontend Fase 4 (Pagos): flujo completo de pago mock con intent, confirmación y polling
  - `web/types/payments.ts`: interfaces TypeScript para PaymentIntentRequest, PaymentIntentResponse, PaymentConfirmRequest, PaymentConfirmResponse
  - `web/pages/Payment.tsx`: página de pago con creación de intent (POST /payments/:orderId/intent) y confirmación mock (POST /payments/:orderId/confirm), skeleton loading, manejo de errores y redirect post-pago
  - `web/pages/PaymentResult.tsx`: pantalla de resultado con check verde (éxito) o X roja (fallo), botones "Ver mi pedido" y "Reintentar"
  - `web/pages/OrderDetail.tsx`: botón "Pagar ahora" con navegación a `/orders/:id/pay` + polling de estado cada 3s (máx 30 intentos) con indicador "Verificando pago..."
  - `web/routes/index.tsx`: nuevas rutas `/orders/:orderId/pay` y `/payment/result`
  - Documentación de ejecución: `docs/frontend/035_FRONTEND_EXEC_FASE4_1_0_DRAFT.md`

- Frontend Fase 3 (Checkout + Órdenes): flujo completo de checkout y gestión de pedidos
  - `web/types/orders.ts`: interfaces TypeScript para Order, OrderItem, PaymentInfo, CheckoutRequest, CheckoutResponse, PaginatedOrders
  - `web/components/orders/OrderStatusBadge.tsx`: badge de estado con mapeo de colores para 7 estados del pedido
  - `web/components/orders/OrderCard.tsx`: tarjeta resumen de pedido para listas (N° orden, fecha, badge, total, items count)
  - `web/pages/Checkout.tsx`: flujo multi-step (4 pasos) — resumen de carrito, selección de dirección de envío con AddressForm inline, selección de método de pago, confirmación con idempotencyKey, redirect post-checkout a /orders/:id
  - `web/pages/OrderDetail.tsx`: detalle de pedido con breadcrumb, tabla de artículos, sección de pagos, modal de cancelación con confirmación, link "Pagar ahora" para payment_pending
  - `web/pages/OrderList.tsx`: historial de pedidos con filtro por estado (pills), paginación reutilizando Pagination de catalog, loading skeleton, empty state con link a catálogo
- `web/routes/index.tsx`: rutas `/checkout` → CheckoutPage, `/orders` → OrderList, `/orders/:id` → OrderDetail (reemplazados placeholders)

- Frontend Fase 2 (Catálogo + Carrito): páginas y componentes de catálogo y carrito de compras
  - `web/types/catalog.ts`: interfaces TypeScript para Category, Product, ProductVariant, PaginatedResponse, Cart, CartItem, InventoryInfo
  - `web/components/catalog/ProductCard.tsx`: tarjeta de producto con imagen placeholder, nombre, badges de categorías, precio mínimo
  - `web/components/catalog/ProductGrid.tsx`: grid responsive (1-4 columnas) de tarjetas de producto
  - `web/components/catalog/Pagination.tsx`: controles de paginación con ventana de 5 páginas y elipsis
  - `web/components/catalog/CategoryFilter.tsx`: barra horizontal de categorías con fetch y skeleton loading
  - `web/components/catalog/VariantSelector.tsx`: selector de variantes con precio y descuento
  - `web/components/catalog/StockIndicator.tsx`: indicador de stock (verde/amarillo/rojo) con fetch de inventario
  - `web/pages/ProductList.tsx`: listado de productos con búsqueda, filtro por categoría, paginación, estados loading/empty/error
  - `web/pages/ProductDetail.tsx`: detalle de producto con breadcrumb, variantes, stock, botón add-to-cart con auth check
  - `web/pages/Cart.tsx`: carrito protegido con CRUD de items, +/- cantidad, vaciar, resumen y checkout
- `web/routes/index.tsx`: rutas actualizadas — `/products` → ProductList, `/products/:id` → ProductDetail, `/cart` → CartPage
- `web/components/layout/Navbar.tsx`: enlace "Catálogo" añadido en navegación desktop y mobile
- Documentación de ejecución: `docs/frontend/033_FRONTEND_EXEC_FASE2_1_0_DRAFT.md`

### Changed

- `package.json`: añadidas dependencias frontend (React, Vite, Tailwind, etc.) y scripts de build/dev
- `docs/REGISTRO_IDS.md`: registrados IDs 031 (Fase 0), 032 (Fase 1), 033 (Fase 2), 034 (Fase 3), 035 (Fase 4)
- `.gitignore`: añadido `dist-frontend/`

- `api/index.js`: monkey-patch para PrismaClient (`configOverride`) que fuerza `postinstall: false` y `ciName: undefined`, solucionando el error "Prisma has detected that this project was built on Vercel" en runtime serverless
- `vercel.json`: añadido `npx prisma migrate deploy` al build command para aplicar migraciones automáticamente en cada deploy
- `.opencode/agents/reverse-engineer.md`: nuevo agente de ingeniería inversa para analizar código NestJS/TypeScript y producir documentación en lenguaje natural
- `.opencode/agents/vercel-deploy.md`: nuevo agente experto en deploy de NestJS en Vercel con Prisma + Neon + Upstash
- `.opencode/agents/028_PRM_BUILD_AGENTS_1_0_DRAFT.md`: plan de implementación para los 2 nuevos sub-agentes
- `.opencode/agents/029_EXEC_BUILD_AGENTS_1_0_DRAFT.md`: plan de ejecución para los 2 nuevos sub-agentes
- `workflow/001_DEV_SPEC_WORKFLOW_AGENT_1_0_DRAFT.md`: especificación completa de comportamiento del workflow-agent (propósito, capacidades, modo de operación, árbol de decisión, restricciones, protocolo de documentación)
- `workflow/030_DEV_REFERENCE_AGENT_AUTOIMPROVEMENT_1_0_DRAFT.md`: documento de referencia del proceso de auto-mejora del workflow-agent

- `AGENTS.md`: nueva sección "Git & Documentation Protocol" — establece que todo agente DEBE actualizar `CHANGELOG.md` antes de cualquier `git push`, usando `changelog-writer`; aplica a TODOS los agentes del ecosistema
- `.opencode/agents/workflow-agent.md`: sección 9 "Git Push Protocol" — flujo obligatorio pre-push (analizar cambios → invocar changelog-writer → verificar entrada → incluir en commit → push); sección 9.5 de integración con el árbol de delegación 8.2; nodo `git push` añadido al árbol de decisión de delegación
- `.opencode/agents/changelog-writer.md`: nuevo sub-workflow "Pre-push invocation" — describe cómo el agente debe ser invocado automáticamente antes de push para documentar cambios
- `.opencode/agents/current-instruction.md`: regla 7 — documentación obligatoria antes de git push (referencia a AGENTS.md)
- `.opencode/agents/about.md`: nueva sección "Protocolo de documentación" con referencia a la regla de pre-push
- `.opencode/agents/frontend-reviewer.md`: sección "Git & Documentation Protocol" — prohíbe push directo, obliga coordinación con workflow-agent
- `.opencode/agents/test-writer.md`: sección "Git & Documentation Protocol" — prohíbe push directo, obliga coordinación con workflow-agent

### Changed

- `api/index.js`: mejorado logging (timestamps, contadores ms, env vars) y manejo de errores con try/catch en handler
- `vercel.json`: build command actualizado para incluir migrations deploy antes de prisma generate
- `src/prisma/prisma.service.ts`: bypass de VERCEL env var en constructor (aunque es read-only en runtime)
- `src/redis/redis.module.ts`: mejor manejo de Upstash Redis en producción (lectura de UPSTASH_REDIS_TOKEN)
- `src/main.ts`: export de createApp() con bootstrap condicional
- `.opencode/agents/workflow-agent.md`: auto-mejora completa — 8 gaps corregidos contra especificación 001 (nuevas secciones: formato de output, restricciones, convención de documentación; renumeración de secciones 8→9→10)
- `docs/REGISTRO_IDS.md`: registrados IDs 028, 029, 030

- `.opencode/agents/workflow-agent.md`: ciclo de auto-mejora completo — alineación con especificación `001_DEV_SPEC_WORKFLOW_AGENT_1_0_DRAFT.md`:
  - Sección 1: añadidas referencias a `001_DEV_SPEC` y `025_DEV_REFERENCE`
  - Sección 3: Fase 6 marcada como opcional; nuevas subsecciones 3.1 (forma abreviada) y 3.2 (modo solo-propuesta)
  - Sección 5: nueva subsección 5.1 con 6 reglas "NO hacer" (restricciones de la especificación)
  - Sección 7 (nueva): "Formato de output" — describe propuestas, planes y comunicación con el usuario
  - Sección 8: referencias rápidas actualizadas con los nuevos documentos
  - Secciones renumeradas: Directorio de Agentes 8→9, Git Push Protocol 9→10
  - Sección 10: nueva subsección 10.6 con convención de documentación del proyecto
  - Referencias internas corregidas (9.2→10.2 en Enforcement)
- `workflow/030_DEV_REFERENCE_AGENT_AUTOIMPROVEMENT_1_0_DRAFT.md`: nuevo documento de referencia del proceso de auto-mejora del agente, incluyendo tabla de gaps, cambios realizados y estado post-mejora
- `docs/REGISTRO_IDS.md`: registro del nuevo ID 030 para el documento de auto-mejora

### Changed

- Knowledge base documentation in `/docs/` with 19 files covering architecture, database schema, API specs, business flows, ADRs, and AI agent prompts
- `_opencode.json` project configuration referencing `opencode/big-pickle` model and `prompts/build.txt`
- `prompts/build.txt` with concise build agent instructions (tech stack, commands, patterns, CI)
- `workflow.sh` — script de flujo de programación con agentes IA (7 modos: propose, plan, execute, verify, listen, status, clean/full)
- `workflow/020_DEV_WORKFLOW_1_0_DRAFT.md` — documentación del script workflow.sh
- `docs/frontend/021_API_FRONTEND_SPEC_1_0_DRAFT.md` — especificación frontend basada en Postman (10 módulos, 30+ endpoints)
- `docs/frontend/022_EXEC_FRONTEND_PLAN_1_0_DRAFT.md` — plan de ejecución frontend (7 fases, 22 días estimados)
- `.opencode/agents/workflow-agent.md`: nueva subsección 4.5 "Mejora de agentes subordinados" — capacidad de orquestador para detectar y corregir inconsistencias en agentes de menor jerarquía

### Changed

- `.opencode/agents/about.md`: referencias `opencode.json` corregidas a `_opencode.json` (líneas 150, 161); lista de agentes actualizada con backend-reviewer, frontend-reviewer, workflow-agent y compaction (desactivado)
- `.opencode/agents/current-instruction.md`: indentación corregida en lista de referencias (líneas 117-119 ya no aparecen como sub-items de `_opencode.json`)

### Fixed

- PrismaClient "Prisma has detected that this project was built on Vercel" error — resuelto mediante monkey-patch con configOverride en api/index.js
- `api/index.js`: movido `require("../dist/main")` de handler lazy a scope top-level para que Vercel static file tracing (nft) detecte la dependencia — soluciona `Cannot find module '../dist/main'` en producción
- `vercel.json`: añadido `includeFiles: dist/**` en build config de `api/index.js` para garantizar que `dist/` se incluya en el lambda bundle

- `workflow.sh`: `grep -n` contaminaba `step_num` con números de línea (bug 1)
- `workflow.sh`: subshell en pipe impedía persistencia de `exec_log` (bug 2)
- `workflow.sh`: `set -e` causaba salidas prematuras en errores menores (bug 3)
- `workflow.sh`: templates con `_PENDING_` reemplazados por contenido estructurado (bug 4)
- `workflow.sh`: `echo -e` producía artifacto `-e` en execution_log (P0-3)

### Changed

- `workflow.sh`: `execute()` ahora ejecuta comandos reales con `eval`, soporta `DRY_RUN=true` y `CONTINUE_ON_ERROR=true` (P0-1)
- `workflow.sh`: nuevo flag `--auto` en modo `full` para ciclo sin intervención humana, `AUTO_APPROVE=true` como variable de entorno (P0-2)
- `workflow.sh`: parseo de steps usa `grep -E "^### Paso [0-9]+:"` para evitar falsos positivos (P1-1)
- `workflow.sh`: nuevo rollback git automático al fallar un paso, restaura archivos no commiteados (P1-2)

### Added

- `workflow/023_EXEC_WORKFLOW_IMPROVEMENTS_1_0_DRAFT.md` — plan de mejoras para workflow.sh (9 items, P0-P3)
- `workflow.sh`: nuevo modo `analyze` que escanea `src/` en busca de archivos, endpoints y módulos relevantes, generando `.workflow/context.md` (P2-1)
- `workflow.sh`: modo `ai` (ai-propose) que genera propuestas usando `opencode` con contexto del proyecto (P3-2)

### Changed

- `workflow.sh`: templates de `propose()` y `plan()` ahora inyectan `.workflow/context.md` si existe, reemplazando los hints genéricos con datos concretos del proyecto (P2-2)
- `workflow.sh`: `execute()` guarda checkpoint tras cada paso y puede reanudar desde el último checkpoint si se interrumpe (P3-1)

### Fixed

- `workflow.sh`: `full --auto` ya no llama `await-propuesta`/`await-plan` dos veces (bug: líneas 684-685 y 698-699 duplicaban la espera)

### Changed

- `.opencode/agents/current-instruction.md`: referencia `opencode.json` corregida a `_opencode.json` (línea 115)
- `.opencode/agents/current-instruction.md`: añadidas referencias a `workflow-agent.md`, `workflow.sh` y `024_DEV_GUIDE_WORKFLOW_1_0_DRAFT.md` en sección de referencias (líneas 117-119)
- `.env.example`: añadida documentación para `UPSTASH_REDIS_TOKEN` y `REDIS_URL` de producción (esquema `https://` para Upstash REST API), clarificando la diferencia entre desarrollo local (ioredis TCP) y producción (Upstash REST)

### Fixed

- `vercel.json`: reemplazado preset `"framework": "nestjs"` por build explícito con `@vercel/node` apuntando a `api/index.js` — el preset de NestJS no funcionaba correctamente (seguía mostrando error `"Invalid export in main.js"` aunque el build se completaba)
- `src/main.ts`: bootstrap condicional (`if (!process.env.VERCEL)`) para que `api/index.js` pueda importar `createApp()` sin que `app.listen()` se ejecute en el entorno serverless

### Added

- `api/index.js`: entry point serverless para Vercel — cachea la instancia de NestJS (cold start), envuelve el adaptador Express con una Promise que resuelve en el evento `finish` para compatibilidad con `@vercel/node`

### Removed

- `serverless-http` — incompatible con la firma `(req, res)` de Vercel (espera formato AWS Lambda `(event, context)`); reemplazado por wrapper directo con Promise

---

## [0.1.0] — 2026-05-29

### Added

#### Core Infrastructure

- NestJS 11.1.24 application scaffolded with TypeScript 5.9.3 (strict mode, ES2021 target)
- Global `ValidationPipe` with whitelist, transform, and forbidNonWhitelisted enabled
- Global `HttpExceptionFilter` with structured JSON error responses and request ID tracing
- `x-request-id` middleware — reads header or generates UUID, echoes on every response, logs all HTTP requests
- JSON logging via `JsonLoggerService` (one-line JSON payloads for log aggregators)
- Joi-based environment validation schema for all config vars (`src/config/env.validation.ts`)
- Docker multi-stage build (`node:22-alpine`) with tini init, production-only dependencies
- `docker-compose.yml` with PostgreSQL 16, Redis 7, and API service (health-check dependencies)
- GitHub Actions CI pipeline — PostgreSQL + Redis service containers, full test suite
- Rate limiting via `@nestjs/throttler` with Redis storage (60 req/min global)

#### Database (Prisma + PostgreSQL)

- Prisma 5.22.0 ORM with PostgreSQL provider
- 22 models: `HealthProbe`, `User`, `Role`, `Permission`, `RolePermission`, `UserRole`, `Session`, `Address`, `Category`, `Product`, `ProductCategory`, `ProductVariant`, `Inventory`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`, `AuditLog`, `Notification`, `Favorite`, `Review`
- Composite keys on join tables, UUID primary keys, JSONB for flexible attributes
- Soft delete support on `User` and `Product` (`deletedAt` timestamptz)
- Self-referencing `Category` hierarchy via `parentId`
- Seed script — 3 roles (admin, operator, customer), 10 permissions, 4 categories, 5 products with 10 variants, admin user (`admin@tienda.local`)
- Migration `20260526000100_baseline` — initial schema (health_probes, users with telegram_id, roles, permissions, sessions, addresses, categories, products, carts)
- Migration `20260527113724_create_business_entities` — orders, order_items, payments, inventory, audit_logs, notifications, favorites, reviews

#### Authentication & Authorization

- JWT authentication via `@nestjs/jwt` + Passport strategy (HS256, configurable TTL)
- Refresh token rotation — UUID stored as PBKDF2 hash in `Session` table (7-day TTL)
- Three global guards in chain: `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`
- `@Public()` decorator to bypass authentication on specific routes
- `@Roles('admin')` and `@Permissions('products:write')` decorators for fine-grained authorization
- PBKDF2 + SHA-256 password hashing (310,000 iterations, salt:hash hex format)
- Auth endpoints: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`
- Rate limiting on auth endpoints: register (5/min), login (10/min), refresh (5/min)

#### User Management

- Profile CRUD: `GET /users/me`, `PATCH /users/me`
- Address CRUD: `GET /users/me/addresses`, `POST /users/me/addresses`, `PATCH /users/me/addresses/:id`, `DELETE /users/me/addresses/:id`

#### Catalog

- Public read-only catalog: `GET /catalog/categories`, `GET /catalog/products`, `GET /catalog/products/:id`, `GET /catalog/products/:id/variants`
- Public inventory lookup: `GET /catalog/inventory/:variantId`
- Paginated product listing with search, category filter, price range, and sorting

#### Shopping Cart

- Persistent cart per user: `GET /cart`, `POST /cart/items`, `PATCH /cart/items/:id`, `DELETE /cart/items/:id`, `POST /cart/clear`
- Price snapshot at add time, cart status lifecycle (active → completed)

#### Checkout

- Order creation: `POST /checkout` with idempotency key (Redis-backed, 24h TTL)
- Stock validation before order placement
- Transactional order creation + stock reservation in Prisma `$transaction`
- Automatic cart cleanup on successful checkout

#### Orders

- Order management: `GET /orders`, `GET /orders/:id`, `GET /orders/:id/status`, `POST /orders/:id/cancel`
- Order status machine: `created → stock_reserved → payment_pending → paid/cod_pending → fulfilled/cancelled`
- Cancellable statuses with stock release logic

#### Payments

- Provider pattern via `PaymentProvider` interface with factory
- `MockPaymentProvider` — auto-approves for development/testing
- `CodPaymentProvider` — cash on delivery flow
- Payment intent: `POST /payments/:orderId/intent`
- Payment confirmation: `POST /payments/:orderId/confirm`
- Webhook processing: `POST /payments/webhooks/mock` with HMAC guard and Redis idempotency
- Webhook events: `payment.completed`, `payment.failed`, `payment.refunded`

#### Inventory

- Stock availability: `GET /inventory/variants/:variantId`
- Internal stock operations: reserve, release, confirm deduction (used by checkout and payments)

#### Admin

- Admin-only controller (`@Roles('admin')`) with full CRUD:
  - Orders: list, detail, status update
  - Products: list, detail, create, update, soft delete
  - Variants: create, update, delete
  - Inventory: list (with low-stock filter), update

#### Health

- `GET /health` endpoint checking PostgreSQL connectivity (`SELECT 1`) and Redis (`PING`)
- Response format: `{ status, service, timestamp, checks: { database, redis } }`

#### API Documentation

- Swagger UI at `api/v1/docs` with Bearer JWT authentication
- DTOs decorated with `@ApiProperty()` for auto-generated OpenAPI spec
- All endpoints documented with `@ApiTags`, `@ApiOkResponse`, `@ApiBearerAuth`

#### Testing

- 14 unit test suites with Jest (89 tests), coverage thresholds: branches 60%, functions 70%, lines 75%, statements 75%
- 7 E2E test suites (supertest, 120s timeout): app, auth, catalog, cart, checkout, orders, payments
- Health check helper for E2E tests verifying DB + Redis connectivity before each suite
- Jest setup file with safe defaults for required environment variables
- Provider unit tests for `MockPaymentProvider` and `CodPaymentProvider`

#### DevOps

- Postman collection with Newman config for API testing
- `.env.example` with all configurable environment variables
- `.dockerignore` and `.gitignore` for clean builds

### Changed

- Restructured from broken monorepo (`service/api/` with workspace paths `services/*`) to single flat package
- Fixed `package.json` — removed workspace references, corrected scripts (build, test, DB commands)
- Updated `Dockerfile` — flat paths instead of nested monorepo structure
- Fixed `tsconfig.build.json` to exclude `test/` directory from production builds

### Removed

- All `telegram_id` references — removed from `User` model, source code (14 files), Prisma schema, seed, Postman collection, and configuration
- Migration `20260529193900_remove_telegram_fields` — drops `telegram_id` column and its two indexes (`users_telegram_id_key`, `users_telegram_idx`)
- Monorepo workspace configuration and related tooling

### Security

- PBKDF2 + SHA-256 password hashing (310,000 iterations) — not bcrypt
- JWT access token with configurable TTL (default 15min)
- Refresh token rotation — old session deleted on each refresh
- HMAC-signed webhook verification via `HmacWebhookGuard`
- Idempotency keys preventing duplicate order and webhook processing
- CORS with configurable origin whitelist

---

## [0.0.1] — 2026-05-26

### Added

- Initial NestJS project scaffold with `@nestjs/cli`
- Prisma ORM setup with PostgreSQL datasource
- Docker Compose with PostgreSQL 16 and Redis 7
- Basic module structure and configuration loading

---

_Template: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) · [SemVer](https://semver.org/spec/v2.0.0.html)_
