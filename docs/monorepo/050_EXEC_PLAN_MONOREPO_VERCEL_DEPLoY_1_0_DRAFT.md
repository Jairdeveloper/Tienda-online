Plan de Deploy en Vercel — Fase 6
1. Diagnóstico del Estado Actual
1.1 Proyectos en Vercel
Existen dos proyectos separados pre-migración:
Proyecto	URL	Estado
tienda-online	https://tienda-online-git-main-zped08s-projects.vercel.app	❌ Caído (500 error)
tienda-frontend	https://tienda-frontend-self.vercel.app	❌ Caído (404)
La configuración actual del proyecto tienda-online es incompatible con el monorepo:
Framework Preset: NestJS    ← INCORRECTO, debe ser "Other"
Root Directory:    .        ← OK
Node.js Version:   24.x     ← INCORRECTO, debe ser 22.x
Build Command:     None     ← Usa preset, ignora vercel.json
1.2 Causa Raíz del Error 500
{"error":"init_failed","message":"Cannot find dist/main. Tried:
  /var/task/apps/api/dist/main,
  /var/task/apps/api/api/dist/main"}
El Framework Preset NestJS hace que Vercel ejecute su build por defecto (busca nest-cli.json en la raíz, ejecuta nest build desde la raíz) e ignora el buildCommand personalizado del vercel.json. Como no hay proyecto NestJS en la raíz, no se genera dist/, y la serverless function no encuentra el bundle.
1.3 Archivos Build Existentes (correctos)
apps/api/dist/        → 1.6M  (NestJS compilado)
apps/web/dist/        → 548K  (Vite SPA compilado)
1.4 Package-lock Files (correctos)
apps/api/package-lock.json    (352 KB)
apps/web/package-lock.json    (118 KB)
1.5 Redis/Upstash
El AppModule ya maneja correctamente el throttler para producción (storage: undefined = in-memory), evitando la llamada EVAL no soportada por Upstash REST API. ✅
1.6 Prisma/Neon
El schema usa DATABASE_URL directamente (TCP). Para serverless Node.js esto funciona. La optimización con @prisma/adapter-neon es opcional (mejora cold starts pero no es crítica).
---
2. Plan de Acción Paso a Paso
Fase 6.1 — Reconfigurar Proyecto Vercel (Dashboard)
Acción: Ir a Vercel Dashboard → Project: tienda-online → Settings → General (https://vercel.com/zped08s-projects/tienda-online/settings/general)
Cambiar estas configuraciones:
Configuración	Valor Actual	Valor Nuevo	Razón
Framework Preset	NestJS	Other	Para que Vercel lea vercel.json y ejecute nuestro buildCommand
Node.js Version	24.x	22.x	Coincide con engines en package.json
Root Directory	.	. (sin cambio)	✅ Correcto
Build Command	None	(dejar vacío)	Lo gestiona vercel.json
Output Directory	None	(dejar vacío)	Lo gestiona vercel.json
Install Command	None	(dejar vacío)	Lo gestiona vercel.json
> Cómo hacerlo: Ve a Settings → General, haz clic en "Edit" en cada sección. Para Framework Preset, selecciona "Other" del dropdown. Para Node.js Version, selecciona "22.x".
Fase 6.2 — Configurar Variables de Entorno (Dashboard)
Acción: Ir a Project Settings → Environment Variables (https://vercel.com/zped08s-projects/tienda-online/settings/environment-variables)
Añadir TODAS estas variables (Marcar "Production" + "Preview" + "Development"):
Variable	Valor	Requerida
JWT_SECRET	<string aleatorio, min 8 chars>	✅ Sí
DATABASE_URL	<Neon pooled URL, puerto 5433>	✅ Sí
REDIS_URL	<Upstash REST URL>	✅ Sí
UPSTASH_REDIS_TOKEN	<Upstash token>	✅ Sí (producción)
NODE_ENV	production	Sí
API_PREFIX	api/v1	Default
CORS_ENABLED	false	Mismo origen, sin CORS
CORS_ORIGIN	(vacío)	Mismo origen
LOG_LEVEL	error	Producción
SWAGGER_ENABLED	false	Deshabilitar en prod
JWT_ACCESS_TTL	900	Default
JWT_REFRESH_TTL	604800	Default
WEBHOOK_SECRET	<string aleatorio, min 16 chars>	Producción
Para Neon:
- DATABASE_URL = Connection string pooled (contiene -pooler en el hostname, puerto 5433)
  - Ej: postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/db?sslmode=require&connect_timeout=15
- Para CI, también necesitarás DATABASE_URL_DIRECT (sin pooler, puerto 5432) en GitHub Secrets
Para Upstash:
- REDIS_URL = https://us1-xxx-38101.upstash.io (REST URL)
- UPSTASH_REDIS_TOKEN = token de la base de datos Upstash
> 💡 Alternativa rápida: Usa la integración nativa de Vercel con Upstash desde Vercel Marketplace → Upstash Redis (https://vercel.com/marketplace/upstash/upstash-kv). Esto configura las variables automáticamente.
Fase 6.3 — Vincular Repositorio y Hacer Deploy
Opción A: Deploy manual con Vercel CLI (recomendado para primera vez)
# 1. Vincular directorio local al proyecto Vercel
npx vercel link --project tienda-online
# 2. Verificar configuración (opcional)
npx vercel env pull .env.production
# 3. Deploy a production (desde la raíz del monorepo)
npx vercel --prod
Opción B: Trigger via GitHub
Si el proyecto ya está conectado a GitHub (Settings → Git), un push a main disparará el deploy automáticamente. Pero primero hay que actualizar la configuración del proyecto (Fase 6.1).
Fase 6.4 — Health Checks Post-Deploy
Una vez desplegado, verificar:
# Health check simple (sin DB)
curl https://tienda-online.vercel.app/_health
# → {"status":"ok","time":...}
# Endpoint diagnóstico
curl https://tienda-online.vercel.app/_diag
# → { status, method, path, env: [...] }
# Health check de la app (con DB + Redis)
curl https://tienda-online.vercel.app/api/v1/health
# → HTTP 200
# SPA
curl https://tienda-online.vercel.app/
# → HTML del frontend (no 404)
# Swagger (si habilitado)
curl https://tienda-online.vercel.app/api/v1/docs
# → HTML de Swagger UI o redirect
Fase 6.5 — Actualizar CI/CD
El archivo .github/workflows/deploy.yml actual no hace deploy explícito a Vercel — solo corre tests y espera el auto-deploy. Dos problemas:
1. Health check URL incorrecta: Usa tienda-online.vercel.app en vez de tienda-online-git-main-zped08s-projects.vercel.app
2. No despliega explícitamente: Depende de la integración GitHub de Vercel, que puede no estar configurada
Recomendación: Agregar un paso de deploy explícito con Vercel CLI (usando token):
# En deploy.yml, después de tests exitosos:
- name: Deploy to Vercel
  run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
También necesitas agregar el secreto VERCEL_TOKEN en GitHub Settings → Secrets and variables → Actions.
Fase 6.6 — Limpiar Proyectos Antiguos (Opcional)
- El proyecto tienda-frontend ya no es necesario (todo sirve desde tienda-online)
- Opciones:
  - Eliminarlo: npx vercel project remove tienda-frontend
  - Redirigirlo: Configurar redirect en tienda-frontend → tienda-online
  - Mantenerlo: Sin costo si no hay deploys activos
---
3. Problemas Identificados en Configuración Actual
🔴 Crítico: Framework Preset incorrecto
Archivo: Vercel Dashboard → Project Settings → General
- Framework Preset: NestJS
+ Framework Preset: Other
Sin este cambio, Vercel ignora tu vercel.json y ejecuta el build por defecto de NestJS desde la raíz, que no existe.
🔴 Crítico: Node.js Version incompatible
- Node.js Version: 24.x
+ Node.js Version: 22.x
El proyecto usa @nestjs/core@11, @prisma/client@5, etc. — todas probadas con Node 22. Node 24 puede tener breaking changes no testeados.
🟡 Medio: apps/api/vercel.json y apps/web/vercel.json son ignorados
Con Root Directory ., estos archivos no son leídos por Vercel. Son ruido documental. Recomendación:
- Eliminarlos (para evitar confusión): rm apps/api/vercel.json apps/web/vercel.json
- O mantenerlos como documentación interna (no dañan, solo confunden)
🟡 Medio: outputDirectory en vercel.json duplica path
"outputDirectory": "apps/web/dist"
Vercel sirve estáticos desde apps/web/dist/ relativo al root. Esto es correcto para el monorepo, pero hay que confirmar que el catch-all rewrite /(.*) → /index.html no intercepte archivos estáticos reales. Vercel prioriza archivos estáticos sobre rewrites, así que es seguro.
🟡 Medio: La configuración de Throttler usa undefined storage en producción
// app.module.ts - Línea 40
storage: isProduction ? undefined : new RedisThrottlerStorage(redisClient),
En producción el throttler usa almacenamiento in-memory. Cada instancia serverless tiene su propio contador de rate limiting. Para la mayoría de casos (60 req/min) es aceptable. Si se necesita rate limiting distribuido, habría que reemplazar el Lua script por otro mecanismo compatible con Upstash REST API.
🟢 Info: El hack de PrismaClient en api/index.js
// api/index.js - Líneas 1-18
prismaModule.PrismaClient = new Proxy(OrigPrismaClient, { ... });
Este hack desactiva el postinstall de Prisma. En Prisma 5.22.0 es funcional, pero es frágil ante actualizaciones. Monitorear en próxima actualización de Prisma.
🟢 Info: --include=dev en installCommand
"installCommand": "cd apps/api && npm ci --include=dev && cd ../../apps/web && npm ci --include=dev"
--include=dev es el comportamiento por defecto de npm ci. Es redundante pero inofensivo. Se puede simplificar a:
"installCommand": "cd apps/api && npm ci && cd ../../apps/web && npm ci"
---
4. Configuración vercel.json — Validación Completa
El archivo vercel.json actual es correcto para el monorepo. Análisis línea por línea:
{
  "installCommand": "cd apps/api && npm ci --include=dev && cd ../../apps/web && npm ci --include=dev",
  // ✅ API: instala en apps/api/ (package-lock.json existe)
  // ✅ WEB: cd ../../apps/web desde apps/api/ → apps/web/ (package-lock.json existe)
  "buildCommand": "cd apps/api && npx prisma generate && cd ../.. && npm run build",
  // ✅ Prisma generate en apps/api/
  // ✅ cd ../.. vuelve a root
  // ✅ npm run build → npm run build:api → cd apps/api && nest build (genera dist/)
  //                   → npm run build:web → cd apps/web && tsc -b && vite build (genera dist/)
  "outputDirectory": "apps/web/dist",
  // ✅ Vercel sirve estáticos desde apps/web/dist/
  "builds": [
    {
      "src": "apps/api/api/diagnostic.js",
      "use": "@vercel/node"
      // ✅ Sin bundle, el archivo es pequeño y autónomo
    },
    {
      "src": "apps/api/api/health.js",
      "use": "@vercel/node"
      // ✅ Sin bundle, archivo mínimo
    },
    {
      "src": "apps/api/api/index.js",
      "use": "@vercel/node",
      "config": {
        "includeFiles": "apps/api/dist/**",
        "bundle": false
      }
      // ✅ bundle: false → necesario porque NestJS es grande
      // ✅ includeFiles: apps/api/dist/** → incluye todo el build de NestJS
    }
  ],
  "rewrites": [
    { "source": "/_diag", "destination": "apps/api/api/diagnostic.js" },
    { "source": "/_health", "destination": "apps/api/api/health.js" },
    { "source": "/api/(.*)", "destination": "apps/api/api/index.js" },
    // ✅ /api/v1/* → NestJS serverless
    { "source": "/(.*)", "destination": "/index.html" }
    // ✅ Catch-all SPA routing
    // ⚠️ Vercel sirve archivos estáticos antes de rewrites,
    //    así que assets reales no son interceptados
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
---
5. Configuración Neon + Prisma para Serverless
Configuración Actual (Funcional)
El PrismaService usa PrismaClient directamente con DATABASE_URL. En Vercel Functions (Node.js runtime, no Edge), las conexiones TCP funcionan.
Recomendación para Neon:
1. Usar URL pooler para la app: La DATABASE_URL debe ser la pooled (puerto 5433, -pooler en hostname):
      postgresql://user:pass@ep-xxx-pooler.us-east-2.aws.neon.tech/db?sslmode=require&connect_timeout=15
   
2. Usar URL directa para migraciones: DATABASE_URL_DIRECT (puerto 5432, sin pooler) para prisma migrate deploy en CI
3. Ajustar PrismaService para mejorar cold starts:
// apps/api/src/prisma/prisma.service.ts — versión optimizada
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'production' 
        ? [] 
        : ['query', 'info', 'warn', 'error'],
      // Reducir connection limit para serverless
      connectionLimit: 3,
    });
  }
  async onModuleInit(): Promise<void> {
    // Lazy connect — solo conectar cuando se hace la primera query
    // await this.$connect(); ← Opcional, Prisma conecta automáticamente
  }
}
Mejora opcional (no crítica): Usar @prisma/adapter-neon para conexiones HTTP, que elimina la latencia de cold start de TCP. Requeriría:
npm install @prisma/adapter-neon
// PrismaService con adapter Neon
import { PrismaNeon } from '@prisma/adapter-neon';
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
Pero esto no es necesario para el primer deploy. El setup actual funciona.
---
6. Configuración Upstash + Redis para Serverless
Configuración Actual (Correcta)
El RedisModule ya distingue entre producción (Upstash via REST) y desarrollo (ioredis via TCP):
if (nodeEnv === "production") {
  const token = configService.get<string>("UPSTASH_REDIS_TOKEN") || "";
  return new UpstashClient(redisUrl, token);  // HTTP-based
}
const Redis = require("ioredis");
return new Redis(redisUrl);  // TCP-based
Throttler en Producción
El AppModule desactiva correctamente RedisThrottlerStorage en producción, porque Upstash REST API no soporta el comando EVAL que necesita el Lua script de rate limiting:
storage: isProduction ? undefined : new RedisThrottlerStorage(redisClient),
✅ Esto es correcto. En producción el rate limiting es in-memory (por instancia serverless).
---
7. Comandos de Deploy
7.1 Primer Deploy (manual)
# 1. Verificar builds locales
cd apps/api && npm run build && ls dist/main.js
cd apps/web && npm run build && ls dist/index.html
cd / (root)
# 2. Vincular proyecto Vercel (primera vez)
npx vercel link --project tienda-online
# → Crea .vercel/project.json
# 3. Ver configuración vinculada
npx vercel pull
# 4. Deploy a preview (test)
npx vercel
# → URL preview: https://tienda-online-xxx.vercel.app
# 5. Verificar preview
curl https://tienda-online-xxx.vercel.app/_health
curl https://tienda-online-xxx.vercel.app/api/v1/health
# 6. Deploy a producción
npx vercel --prod
7.2 Deploy Automático (GitHub Actions)
El workflow actual en .github/workflows/deploy.yml solo tests + espera auto-deploy. Para mejor control:
1. Obtener un token de Vercel: https://vercel.com/account/tokens
2. Agregar VERCEL_TOKEN a GitHub Secrets
3. Actualizar deploy.yml para incluir un paso de deploy explícito:
- name: Deploy to Vercel
  run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
  env:
    VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
    VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
También corregir la URL del health check:
API_URL="${VERCEL_URL:-https://tienda-online.vercel.app}/api/v1/health"
---
## 8. Verificación Post-Deploy
### Checklist
- [ ] `/_health` → `{"status":"ok","time":...}` ⚡️ 200
- [ ] `/_diag` → JSON con env vars listadas
- [ ] `/api/v1/health` → 200 (verifica DB + Redis)
- [ ] `/api/v1/docs` → Swagger UI o 404 (si deshabilitado)
- [ ] `/` → HTML del SPA
- [ ] `/login` → SPA route (no 404)
- [ ] `/api/v1/auth/login` → 401 (JWT requerido, endpoint existe)
- [ ] Logs de Vercel sin errores de timeout o out-of-memory
- [ ] Cold start < 5 segundos (primer request después de inactividad)
---
9. Resumen de Riesgos y Advertencias
Riesgo	Impacto	Mitigación
Framework Preset "NestJS" impide build correcto	🔴 Alto — deploy falla	Cambiar a "Other" en Dashboard
Node 24.x no testado con dependencias	🟡 Medio — errores runtime	Cambiar a 22.x en Dashboard
Cold starts lentos (Prisma + NestJS)	🟡 Medio — primeros requests lentos	Aceptable para plan Hobby (10s timeout); considerar Pro para 60s
Throttler no distribuido en producción	🟢 Bajo — tasa por instancia	Aceptable para ~60 req/min por instancia
Hack de PrismaClient Proxy frágil	🟢 Bajo — fallo silencioso en upgrade	Monitorear en próxima actualización de Prisma
includeFiles: apps/api/dist/ puede no incluir archivos generados	🟡 Medio — función sin módulos	BuildCommand debe generar antes de que Vercel empaquete. El orden en vercel.json es correcto
URLs de producción desactualizadas en AGENTS.md	🟢 Bajo — documentación incorrecta	Actualizar después del deploy exitoso
No hay .vercel/project.json — proyecto no vinculado localmente	🟢 Info	Se crea con vercel link
---
10. Secuencia de Ejecución Recomendada
1. [Dashboard] Cambiar Framework Preset a "Other"
2. [Dashboard] Cambiar Node.js Version a 22.x
3. [Dashboard] Configurar Environment Variables (JWT_SECRET, DATABASE_URL, REDIS_URL, etc.)
4. [Terminal] npx vercel link --project tienda-online
5. [Terminal] npx vercel (preview deploy — test)
6. [Terminal] curl <preview-url>/_health (verificar)
7. [Terminal] curl <preview-url>/api/v1/health (verificar DB)
8. [Terminal] npx vercel --prod
9. [Terminal] curl <prod-url>/api/v1/health (verificar)
10. [Dashboard] Verificar logs de Vercel — sin errores
11. [Dashboard] Deshabilitar Swagger (SWAGGER_ENABLED=false)
12. [Git] Actualizar AGENTS.md con nueva URL única
13. [Dashboard] Opcional: eliminar proyecto tienda-frontend