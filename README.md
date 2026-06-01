# @tienda/api — Tienda Online Agnóstica

Backend REST para comercio electrónico construido con **NestJS**, **Prisma** (PostgreSQL) y **Redis**. Proporciona autenticación JWT + RBAC, catálogo de productos, carrito de compras, checkout, gestión de pedidos, procesamiento de pagos (con patrón de proveedores), control de inventario y operaciones administrativas.

## Tech Stack

- **Runtime:** Node.js 22 (Alpine)
- **Framework:** NestJS 11.1.24
- **Lenguaje:** TypeScript 5.9.3 (strict mode, ES2021, decoradores)
- **ORM:** Prisma 5.22.0 (PostgreSQL 16)
- **Cache/Sesión:** Redis 7 (ioredis 5.11.0)
- **Auth:** Passport.js + JWT (HS256) con refresh token rotation
- **Hashing:** PBKDF2 + SHA-256 (310k iteraciones), formato `salt:hash` hex
- **API Docs:** Swagger (swagger-ui-express 5.0.1)
- **Validación:** class-validator + class-transformer (ValidationPipe global)
- **Rate Limiting:** @nestjs/throttler con almacenamiento Redis
- **Testing:** Jest 29.7 (unitarios) + supertest (E2E)
- **Container:** Docker multi-stage (node:22-alpine) + docker-compose
- **CI:** GitHub Actions (PostgreSQL + Redis como service containers)

## Arquitectura

```
┌─────────────────────────────────────────────┐
│              Controllers (REST)              │
├─────────────────────────────────────────────┤
│              Services (Business Logic)       │
├─────────────────────────────────────────────┤
│   Guards (JWT → Roles → Permissions)        │
├─────────────────────────────────────────────┤
│         PrismaService / RedisService         │
├─────────────────────────────────────────────┤
│         PostgreSQL 16 / Redis 7              │
└─────────────────────────────────────────────┘
```

### Principios de diseño

- **Todas las rutas requieren JWT por defecto.** Tres guards globales en cadena: `JwtAuthGuard` → `RolesGuard` → `PermissionsGuard`. Usar `@Public()` para rutas públicas.
- **Módulos globales** (`@Global()`): `PrismaModule`, `RedisModule`, `CommonModule` — disponibles sin re-importar.
- **API prefix**: `api/v1` (configurable). Swagger en `api/v1/docs`.
- **Validación**: ValidationPipe global con `whitelist: true`, `transform: true`, `forbidNonWhitelisted: true`.
- **Password hashing**: PBKDF2 + SHA-256, **no es bcrypt**.
- **Logging**: JSON estructurado vía `JsonLoggerService` (una línea por evento).

## Módulos (17)

| Módulo    | Descripción                                     |
| --------- | ----------------------------------------------- |
| Config    | Validación de entorno con Joi                   |
| Common    | Logger JSON, Cache, Filtro de excepciones       |
| Prisma    | PrismaService (PrismaClient extendido)          |
| Redis     | RedisService, RedisLockService, cliente ioredis |
| Auth      | JWT + RBAC, guards, strategies, decorators      |
| Users     | CRUD de perfil y direcciones                    |
| Catalog   | Catálogo de productos y categorías              |
| Cart      | Carrito persistente por usuario/sesión          |
| Checkout  | Creación de pedidos con idempotencia            |
| Orders    | Gestión de pedidos, estados, cancelación        |
| Payments  | Procesamiento de pagos con patrón provider      |
| Inventory | Control de stock por variante                   |
| Admin     | Operaciones administrativas CRUD                |
| Health    | Health checks de DB y Redis                     |
| Types     | Tipos Express (requestId, user)                 |

## Patrones clave

- **Payment Provider Pattern:** Interfaz `PaymentProvider` → implementaciones `MockPaymentProvider` + `CodPaymentProvider` resueltas vía Factory.
- **Order Status Machine:** `created → stock_reserved → payment_pending → paid/cod_pending → fulfilled/cancelled`.
- **Idempotency Keys:** Checkout y webhooks usan Redis para prevenir duplicados (TTL 24h).
- **RBAC:** 3 roles (customer, admin, operator), 10 permisos, verificación en 3 guards.
- **Soft Delete:** Usuarios y productos usan `deletedAt` para borrado lógico.
- **Refresh Token Rotation:** Se elimina la sesión anterior al hacer refresh.

## Prerrequisitos

- Node.js 22+
- PostgreSQL 16+
- Redis 7+
- npm 10+

## Configuración de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Requeridos
JWT_SECRET=tu-secreto-jwt-min-8-caracteres
DATABASE_URL=postgresql://usuario:password@localhost:5432/tienda
REDIS_URL=redis://localhost:6380

# Opcionales (valores por defecto)
PORT=3000
API_PREFIX=api/v1
CORS_ENABLED=true
CORS_ORIGIN=
SWAGGER_ENABLED=true
SWAGGER_PATH=docs
JWT_ACCESS_TTL=900
JWT_REFRESH_TTL=604800
WEBHOOK_SECRET=dev-webhook-secret-change-in-production
NODE_ENV=development
LOG_LEVEL=log
```

## Instalación y ejecución

```sh
# Instalar dependencias
npm install

# Generar cliente Prisma
npm run db:generate

# Ejecutar migraciones
npm run db:migrate:deploy

# Poblar base de datos con datos de semilla
npm run db:seed

# Iniciar en desarrollo
npm run start:dev

# Construir para producción
npm run build

# Iniciar en producción
npm run start:prod
```

## Comandos disponibles

| Comando                     | Descripción                             |
| --------------------------- | --------------------------------------- |
| `npm run build`             | Compila TypeScript a JS en `dist/`      |
| `npm run start`             | Inicia la app                           |
| `npm run start:dev`         | Inicia con hot-reload (watch mode)      |
| `npm run start:debug`       | Inicia con debugger + watch             |
| `npm run start:prod`        | Inicia desde `dist/main.js`             |
| `npm run test`              | Ejecuta tests unitarios (con cobertura) |
| `npm run test:watch`        | Tests en modo watch                     |
| `npm run test:e2e`          | Tests end-to-end (requiere DB + Redis)  |
| `npm run db:generate`       | Genera Prisma Client                    |
| `npm run db:migrate:dev`    | Crea nueva migración                    |
| `npm run db:migrate:deploy` | Aplica migraciones existentes           |
| `npm run db:migrate:status` | Estado de migraciones                   |
| `npm run db:seed`           | Pobla DB con datos iniciales            |

## Docker

```sh
# Iniciar todos los servicios (PostgreSQL + Redis + API)
docker-compose up --build

# La API estará disponible en http://localhost:3000/api/v1
# Swagger UI en http://localhost:3000/api/v1/docs
```

## Tests

```sh
# Tests unitarios (14 suites, 89 tests)
npm run test

# Tests E2E (requiere PostgreSQL y Redis corriendo)
npm run test:e2e
```

### Usuario admin de prueba (seed)

- Email: `admin@tienda.local`
- Password: `Admin123!`
- Rol: admin (todos los permisos)

## Estructura del proyecto

```
/
├── src/                    # Código fuente (17 módulos NestJS)
│   ├── main.ts             # Bootstrap, middleware, Swagger
│   ├── app.module.ts       # Módulo raíz
│   ├── config/             # Validación Joi de entorno
│   ├── common/             # Logger, Cache, Filtros globales
│   ├── prisma/             # PrismaService (global)
│   ├── redis/              # RedisService, RedisLockService
│   ├── auth/               # JWT, guards, decoradores
│   ├── users/              # Perfil y direcciones
│   ├── catalog/            # Productos y categorías
│   ├── inventory/          # Stock por variante
│   ├── cart/               # Carrito de compras
│   ├── checkout/           # Flujo de checkout
│   ├── orders/             # Pedidos
│   ├── payments/           # Pagos (provider pattern)
│   ├── admin/              # Admin CRUD
│   └── types/              # Tipos Express
├── prisma/
│   ├── schema.prisma       # 22 modelos
│   ├── migrations/         # 3 migraciones
│   └── seed.ts             # Datos iniciales
├── test/                   # Tests E2E
├── docs/                   # Base de conocimiento (19 docs)
│   ├── MASTER_INDEX.md     # Mapa del sistema
│   ├── REGISTRO_IDS.md     # Registro de IDs
│   ├── architecture/       # Documentos de arquitectura
│   ├── api/                # Especificaciones de API
│   ├── database/           # Schema de base de datos
│   ├── flows/              # Diagramas de flujo
│   ├── decisions/          # ADRs
│   ├── prompts/            # Convenciones de prompts
│   ├── ai/                 # Knowledge base para agentes
│   ├── security/           # Documentación de seguridad
│   ├── devops/             # Documentación DevOps
│   └── archive/            # Documentos deprecated
├── algoritmos/             # Planes y algoritmos
├── .opencode/
│   └── agents/             # Prompts para subagentes IA
├── prompts/
│   └── build.txt           # Prompt de build para opencode
├── opencode.json           # Configuración de opencode
├── AGENTS.md               # Guía para agentes IA
├── CHANGELOG.md            # Historial de versiones
├── Dockerfile              # Build multi-etapa
├── docker-compose.yml      # PostgreSQL + Redis + API
└── postman/                # Colección de API + Newman
```

## Documentación

El proyecto sigue una convención de documentación formal definida en `algoritmos/propuesta-convencion-documentacion.md`. Todos los documentos en `docs/` usan:

- **Nombres**: `[ID]_[AREA]_[TIPO]_[MODULO]_[VERSION]_[ESTADO].md`
- **Frontmatter**: YAML con metadatos (id, area, type, module, version, status, tags, summary, keywords, changelog)
- **IDs**: Registro central en `docs/REGISTRO_IDS.md`

## Frontend SPA

El frontend de la tienda es una SPA construida con **React + TypeScript + Vite + Tailwind CSS**, desplegada en Vercel como proyecto independiente.

- **URL de producción**: [https://tienda-frontend-self.vercel.app](https://tienda-frontend-self.vercel.app)
- **Repositorio**: integrado en este mismo monorepo (`web/`)
- **API base**: `https://tienda-online-zped08s-projects.vercel.app/api/v1`
- **SPA Routing**: configurado con rewrites en Vercel (`/(.*)` → `/index.html`)
- **Code Splitting**: 29 JS chunks + 1 CSS, chunk principal 414KB
- **Optimizaciones**: vendor chunks separados (react, router, query, axios), meta tags SEO/OG, HSTS, sin sourcemaps en producción

### Build y deploy

```sh
# Construir frontend
npm run build:frontend

# Probar localmente
npx serve dist-frontend -s

# Deploy (requiere Vercel CLI y proyecto linkeado)
vercel --prod
```

## CI/CD

GitHub Actions en `.github/workflows/ci.yml`:

- Push/PR a `main` → PostgreSQL + Redis services → `npm ci` → `prisma generate` → `prisma migrate deploy` → `npm run build` → `npm test` → `npm run test:e2e`

## Licencia

Privado — @tienda/api (no publicado en npm).
