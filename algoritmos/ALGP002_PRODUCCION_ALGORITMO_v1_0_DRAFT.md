---
id: alg_p_002
area: algorithms
type: ALGP
module: production
version: 1.0
status: DRAFT
author: system
created: 2026-05-30
last_updated: 2026-05-30
dependencies:
  - alg_p_001
tags:
  - algorithm
  - production
  - devops
  - automation
summary: "Versión algorítmica formal del plan de producción: pasos atómicos con verificación, ramas de decisión (eu.org vs Tunnel), diagrama de flujo y runbook."
keywords:
  - algoritmo
  - produccion
  - automatizacion
  - devops
  - oracle cloud
  - cloudflare
  - deployment
changelog:
  - version: 1.0
    date: 2026-05-30
    author: system
    changes:
      - "Migración a formato ALGP con frontmatter YAML y vocabulario controlado de tags"
---

# Algoritmo de Producción — @tienda/api

**Versión:** 1.0 | **Estado:** DRAFT | **Tipo:** Algoritmo de automatización

---

## Definición formal

```
ALGORITMO:      ProduccionAPI
OBJETIVO:       Llevar @tienda/api desde estado "desarrollo" a estado "producción"
                con monitoreo, seguridad, backups y CI/CD automatizados.

ENTRADA:        Código fuente en repositorio GitHub (branch main)
                Variables de entorno de producción (JWT_SECRET, DATABASE_URL, etc.)

SALIDA:         API en producción accesible via HTTPS
                Pipeline CI/CD operativo
                Monitoreo y alertas activos
                Backups automáticos configurados

PRECONDICIÓN:   npm run build compila sin errores
                npm test pasa (cobertura ≥ thresholds)
                npm run test:e2e pasa (7 suites)
                Cuenta en Oracle Cloud (o proveedor elegido)
                Cuenta en Cloudflare (free tier)
                Cuenta en GitHub

POSTCONDICIÓN:  API responde 200 en GET /api/v1/health
                CI/CD deploya automáticamente al hacer push a main
                Sentry captura errores
                Grafana muestra métricas
                Backups diarios activos
                Uptime Kuma monitorea disponibilidad
```

---

## Estructura del algoritmo

```
FASE 0: PREPARACIÓN          (1-2 días)
FASE 1: INFRAESTRUCTURA      (2-3 días, depende de F0)
FASE 2: CI/CD                (1-2 días, depende de F1)
FASE 3: MONITOREO            (1-2 días, depende de F1)
FASE 4: SEGURIDAD            (1-2 días, depende de F1)
FASE 5: BACKUPS Y DR         (1 día, depende de F1)
FASE O: OPERACIÓN CONTINUA   (indefinido, depende de F0-F5)
```

Cada fase contiene **pasos atómicos** con verificación obligatoria antes de avanzar.

---

## FASE 0: PREPARACIÓN DEL CÓDIGO

```
OBJETIVO:   Endurecer el código para producción
DURACIÓN:   1-2 días
DEPENDE DE: —
TERMINACIÓN: Todos los pasos P0.1 a P0.7 completados y verificados
```

### Paso 0.1 — Instalar helmet (seguridad HTTP)

```bash
npm install helmet
```

Editar `src/main.ts`:
```typescript
import helmet from 'helmet';
app.use(helmet());
```

**VERIFICACIÓN:**
```bash
npm run build          # debe compilar sin errores
npm test               # 89 tests deben pasar
```

### Paso 0.2 — Deshabilitar Swagger en producción

Editar `src/main.ts`:
```typescript
const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED');
if (swaggerEnabled === 'true' || swaggerEnabled === true) { /* habilitar */ }
// si no, Swagger no se inicializa
```

**VERIFICACIÓN:** `SWAGGER_ENABLED=false npm run start:prod` → ruta `/docs` devuelve 404

### Paso 0.3 — CORS restrictivo

Editar `src/main.ts`:
```typescript
const origins = corsOrigin.split(',').map(o => o.trim()).filter(Boolean);
app.enableCors({
  origin: origins.length > 0 ? origins : false,
  credentials: true,
});
```

**VERIFICACIÓN:** Request desde origen no listado recibe error CORS

### Paso 0.4 — WEBHOOK_SECRET requerido en producción

Editar `src/config/env.validation.ts`:
```typescript
WEBHOOK_SECRET: Joi.string().min(16).when('NODE_ENV', {
  is: 'production',
  then: Joi.required(),
  otherwise: Joi.string().min(16).default('dev-webhook-secret-change-in-production'),
}),
```

**VERIFICACIÓN:** `NODE_ENV=production npm run start:prod` falla si falta WEBHOOK_SECRET

### Paso 0.5 — Graceful shutdown

Editar `src/main.ts`:
```typescript
app.enableShutdownHooks();
```

**VERIFICACIÓN:** Al enviar SIGTERM, la app cierra conexiones Prisma y Redis correctamente

### Paso 0.6 — ESLint + Prettier

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier
npx eslint --init
npx prettier --check src/
```

**VERIFICACIÓN:** `npx eslint src/` reporta 0 errores

### Paso 0.7 — Verificar scripts de producción

```bash
npm run build            # debe compilar en dist/
npm run start:prod &     # debe iniciar sin errores
curl http://localhost:3000/api/v1/health  # debe responder 200
kill %1
```

---

## FASE 1: INFRAESTRUCTURA

```
OBJETIVO:   Provisionar servidor, dominio, y servicios base
DURACIÓN:   2-3 días
DEPENDE DE: FASE 0 completada
TERMINACIÓN: Health check responde 200 desde internet
```

### Paso 1.1 — Obtener servidor (Oracle Cloud Free Tier)

```
ENTRADA:   Cuenta Oracle Cloud activa
SALIDA:    VM con Ubuntu 24.04 LTS, IP pública, SSH key configurado
```

1. Ir a https://www.oracle.com/cloud/free/
2. Crear VM.ARM.Standard.A1 (4 OCPU, 24 GB RAM, 200 GB disco)
3. Elegir Canonical Ubuntu 24.04 LTS
4. Configurar security list: abrir puertos 22, 80, 443
5. Descargar y guardar SSH private key (`~/.ssh/tienda-prod.pem`)
6. Anotar IP pública → variable `VPS_IP`

**VERIFICACIÓN:**
```bash
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} "uname -a"
# Debe mostrar Linux ... Ubuntu 24.04
```

### Paso 1.2 — Instalar Docker + Docker Compose en VPS

```bash
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} << 'REMOTE'
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER
  docker --version
  docker compose version
REMOTE
```

**VERIFICACIÓN:** `docker --version` imprime versión 27+ y `docker compose version` imprime versión 2+

### Paso 1.3 — Elegir e implementar dominio

```
DECISIÓN:   Elegir Opción A (eu.org) o Opción B (Cloudflare Tunnel)
CRITERIO:   Si se necesita dominio personalizado sin costo → A
            Si se prefiere cero configuración de red y sin IP pública → B
```

#### Rama A: Dominio .eu.org (recomendada)

| Subpaso | Acción | Comando/URL |
|---------|--------|-------------|
| 1.3.A.1 | Registrar dominio en nic.eu.org | https://nic.eu.org → register → `tienda-api.eu.org` |
| 1.3.A.2 | Esperar aprobación (1-3 días) | Verificar email |
| 1.3.A.3 | Agregar a Cloudflare | Cloudflare → Add Site → `tienda-api.eu.org` |
| 1.3.A.4 | Cambiar nameservers | nic.eu.org → DNS → usar NS de Cloudflare |
| 1.3.A.5 | Crear registro A | Cloudflare → DNS → `A @ ${VPS_IP}` (proxy ON) |
| 1.3.A.6 | SSL Full strict | Cloudflare → SSL/TLS → Full (strict) |
| 1.3.A.7 | WAF rate limiting | Cloudflare → WAF → 100 req/min por IP |
| 1.3.A.8 | Crear `ops/nginx/nginx.conf` | Ver contenido en [Anexo A](#anexo-a-nginx-conf) |
| 1.3.A.9 | Incluir Nginx en docker-compose | Ver contenido en [Anexo C](#anexo-c-docker-compose-prod) |

**VERIFICACIÓN:** `curl -I https://tienda-api.eu.org/api/v1/health` responde 200 con header `cf-ray`

#### Rama B: Cloudflare Tunnel (sin IP pública)

| Subpaso | Acción | Comando |
|---------|--------|---------|
| 1.3.B.1 | Instalar cloudflared en VPS | `curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared && chmod +x /usr/local/bin/cloudflared` |
| 1.3.B.2 | Autenticar tunnel | `cloudflared tunnel login` (abre browser) |
| 1.3.B.3 | Crear tunnel | `cloudflared tunnel create tienda-api` |
| 1.3.B.4 | Crear `ops/cloudflared/config.yml` | Ver contenido en [Anexo B](#anexo-b-cloudflared-config) |
| 1.3.B.5 | Route DNS | `cloudflared tunnel route dns tienda-api tienda-api.usuario.workers.dev` |
| 1.3.B.6 | Incluir cloudflared en docker-compose | Ver contenido en [Anexo C](#anexo-c-docker-compose-prod) |

**VERIFICACIÓN:** `curl -I https://tienda-api.usuario.workers.dev/api/v1/health` responde 200

### Paso 1.4 — Crear estructura de directorios en VPS

```bash
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} << 'REMOTE'
  mkdir -p /opt/tienda/{nginx,cloudflared,prometheus,grafana,loki,scripts}
  ls -la /opt/tienda/
REMOTE
```

**VERIFICACIÓN:** Los 6 subdirectorios existen

### Paso 1.5 — Subir archivos de configuración al VPS

```bash
scp -i ~/.ssh/tienda-prod.pem ops/docker-compose.prod.yml ubuntu@${VPS_IP}:/opt/tienda/
scp -i ~/.ssh/tienda-prod.pem ops/nginx/nginx.conf ubuntu@${VPS_IP}:/opt/tienda/nginx/
scp -i ~/.ssh/tienda-prod.pem ops/scripts/*.sh ubuntu@${VPS_IP}:/opt/tienda/scripts/
chmod +x /opt/tienda/scripts/*.sh
```

**VERIFICACIÓN:** `ssh ubuntu@${VPS_IP} "ls -la /opt/tienda/"` muestra todos los archivos

### Paso 1.6 — Iniciar servicios base

```bash
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} << 'REMOTE'
  cd /opt/tienda
  export DOMAIN=tienda-api.eu.org
  export DB_PASS=$(openssl rand -base64 32)
  export REDIS_PASS=$(openssl rand -base64 32)
  export JWT_SECRET=$(openssl rand -base64 48)
  export WEBHOOK_SECRET=$(openssl rand -base64 32)

  docker compose -f docker-compose.prod.yml up -d postgres redis
  sleep 10

  docker compose -f docker-compose.prod.yml up -d api
  sleep 5

  docker compose -f docker-compose.prod.yml up -d nginx
REMOTE
```

**VERIFICACIÓN:**
```bash
curl -I https://${DOMAIN}/api/v1/health
# HTTP/2 200
```

---

## FASE 2: CI/CD

```
OBJETIVO:   Automatizar build + test + deploy en cada push a main
DURACIÓN:   1-2 días
DEPENDE DE: FASE 1 completada (VPS + dominio operativos)
TERMINACIÓN: Push a main → deploy automático exitoso
```

### Paso 2.1 — Configurar secrets en GitHub

```
NAVEGAR A:  GitHub repo → Settings → Secrets and variables → Actions
CREAR:
  - VPS_HOST        = ${VPS_IP}
  - VPS_USER        = ubuntu
  - VPS_SSH_KEY     = contenido de ~/.ssh/tienda-prod.pem
  - JWT_SECRET      = $(openssl rand -base64 48)
  - WEBHOOK_SECRET  = $(openssl rand -base64 32)
  - DB_PASS         = $(openssl rand -base64 32)
  - REDIS_PASS      = $(openssl rand -base64 32)
```

**VERIFICACIÓN:** Los 8 secrets aparecen en GitHub UI con valores ocultos

### Paso 2.2 — Crear `.github/workflows/deploy.yml`

Contenido completo en [Anexo D](#anexo-d-deploy-yml). Debe incluir:

```
jobs:
  test:
    - services: postgres + redis
    - steps: npm ci → prisma generate → prisma migrate deploy → build → test → e2e

  deploy:
    needs: test
    - login to GHCR
    - build + push Docker image (tag: latest + commit-sha)
    - SSH to VPS → docker compose pull api → docker compose up -d → prune
```

**VERIFICACIÓN:** Hacer push a main → GitHub Actions ejecuta test + deploy → green check

### Paso 2.3 — Verificar deploy automático

```
1. git commit --allow-empty -m "test deploy pipeline"
2. git push origin main
3. Ir a GitHub → Actions → verificar que test pasa y deploy se ejecuta
4. curl https://${DOMAIN}/api/v1/health  # debe responder 200
```

---

## FASE 3: MONITOREO

```
OBJETIVO:   Visibilidad total de la aplicación en producción
DURACIÓN:   1-2 días
DEPENDE DE: FASE 1 completada
TERMINACIÓN: Alertas configuradas, dashboards visibles, errores capturados
```

### Paso 3.1 — Error tracking (Sentry)

```bash
npm install @sentry/node @sentry/profiling-node
```

Editar `src/main.ts`:
```typescript
import * as Sentry from '@sentry/node';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
});
```

Agregar `SENTRY_DSN` a GitHub secrets y docker-compose.

**VERIFICACIÓN:** Provocar un error 500 → aparece en sentry.io dashboard

### Paso 3.2 — Prometheus + Grafana

Agregar al `docker-compose.prod.yml`:

```yaml
prometheus:
  image: prom/prometheus:v2.54
  volumes:
    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
    - prometheus_data:/prometheus

grafana:
  image: grafana/grafana:11.3-oss
  environment:
    GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}

loki:
  image: grafana/loki:3.1
  volumes:
    - ./loki/loki-config.yml:/etc/loki/loki-config.yml:ro
    - loki_data:/loki
```

**VERIFICACIÓN:** Grafana accesible en `https://${DOMAIN}/grafana/` con dashboards visibles

### Paso 3.3 — Prometheus metrics en NestJS

```bash
npm install @willsoto/nestjs-prometheus
```

Editar `src/app.module.ts`:
```typescript
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
PrometheusModule.register({ path: '/metrics', defaultMetrics: { enabled: true } })
```

**VERIFICACIÓN:** `curl https://${DOMAIN}/api/v1/metrics` devuelve métricas en texto plano

### Paso 3.4 — Uptime Kuma

Agregar a `docker-compose.prod.yml`:
```yaml
uptime-kuma:
  image: louislam/uptime-kuma:1
  volumes:
    - uptime_kuma_data:/app/data
```

Configurar monitor HTTP cada 60s para `https://${DOMAIN}/api/v1/health`.

**VERIFICACIÓN:** Uptime Kuma muestra status UP con latencia < 500ms

---

## FASE 4: SEGURIDAD

```
OBJETIVO:   Endurecer servidor y código contra ataques
DURACIÓN:   1-2 días
DEPENDE DE: FASE 1 completada
TERMINACIÓN: Escaneo de seguridad sin vulnerabilidades críticas
```

### Paso 4.1 — Hardening del servidor

```bash
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} << 'REMOTE'
  # Firewall
  sudo ufw default deny incoming
  sudo ufw default allow outgoing
  sudo ufw allow ssh
  sudo ufw allow http
  sudo ufw allow https
  sudo ufw enable

  # Fail2ban
  sudo apt update && sudo apt install fail2ban -y
  sudo systemctl enable fail2ban

  # SSH hardening
  sudo sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
  sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
  sudo systemctl restart sshd

  # Auto-updates
  sudo apt install unattended-upgrades -y
  sudo dpkg-reconfigure -plow unattended-upgrades
REMOTE
```

**VERIFICACIÓN:**
```bash
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} "sudo ufw status verbose"
# Status: active
```

### Paso 4.2 — Dependabot

Crear `.github/dependabot.yml`:
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

**VERIFICACIÓN:** GitHub → Insights → Dependency graph → Dependabot activo

### Paso 4.3 — npm audit en CI

Agregar a `.github/workflows/ci.yml` antes de los tests:
```yaml
- run: npm audit --audit-level=high || true
```

**VERIFICACIÓN:** CI muestra `npm audit` en los logs sin fallar el pipeline

### Paso 4.4 — Verificación final de seguridad

```
EJECUTAR:
  - npm audit                  → 0 high/critical
  - ssh audit:                 → PermitRootLogin no, PasswordAuthentication no
  - Test rate limiting:        → 101 requests en 1 min → HTTP 429
  - Test CORS:                 → curl -H "Origin: https://evil.com" → sin Access-Control
  - Test SSL:                  → https://www.ssllabs.com/ssltest/ → A+
  - Test JWT:                  → token expirado → 401
  - Test roles:                → token customer → /admin → 403
```

---

## FASE 5: BACKUPS Y DISASTER RECOVERY

```
OBJETIVO:   Garantizar recuperación ante fallos
DURACIÓN:   1 día
DEPENDE DE: FASE 1 completada
TERMINACIÓN: Backup automático funcionando y restore probado
```

### Paso 5.1 — Script de backup

Crear `ops/scripts/backup-db.sh`:
```bash
#!/bin/bash
set -e
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/postgres"
DB_NAME="${DB_NAME:-tienda_online}"
DB_USER="${DB_USER:-tienda}"
mkdir -p "$BACKUP_DIR"
docker exec tienda_postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete
echo "Backup: ${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
```

Subir al VPS y dar permisos:
```bash
scp -i ~/.ssh/tienda-prod.pem ops/scripts/backup-db.sh ubuntu@${VPS_IP}:/opt/tienda/scripts/
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} "chmod +x /opt/tienda/scripts/backup-db.sh"
```

### Paso 5.2 — Programar cron

```bash
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} << 'REMOTE'
  (crontab -l 2>/dev/null; echo "0 3 * * * /opt/tienda/scripts/backup-db.sh") | crontab -
REMOTE
```

**VERIFICACIÓN:**
```bash
ssh -i ~/.ssh/tienda-prod.pem ubuntu@${VPS_IP} "crontab -l"
# 0 3 * * * /opt/tienda/scripts/backup-db.sh
```

### Paso 5.3 — Script de restore

Crear `ops/scripts/restore-db.sh`:
```bash
#!/bin/bash
set -e
BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
  echo "Uso: $0 <backup.sql.gz>"
  exit 1
fi
gunzip -c "$BACKUP_FILE" | docker exec -i tienda_postgres psql -U tienda tienda_online
echo "Restore completado desde: $BACKUP_FILE"
```

**VERIFICACIÓN:** Ejecutar restore contra staging DB y verificar datos íntegros

---

## FASE O: OPERACIÓN CONTINUA

```
OBJETIVO:   Mantener el sistema en producción con procedimientos documentados
DURACIÓN:   Indefinido (runbook vivo)
DEPENDE DE: FASES 0-5 completadas
```

### Paso O.1 — Runbook de operaciones

```
┌────────────────────────────────────────────────────────────┐
│                    RUNBOOK DE OPERACIONES                   │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  DEPLOY (normal):                                          │
│    git push origin main → CI/CD automático                 │
│    Verificar: curl https://${DOMAIN}/api/v1/health         │
│                                                            │
│  DEPLOY (manual, si CI falla):                             │
│    ssh ubuntu@${DOMAIN}                                    │
│    cd /opt/tienda                                          │
│    docker compose -f ops/docker-compose.prod.yml pull api  │
│    docker compose -f ops/docker-compose.prod.yml up -d api │
│    docker image prune -f                                   │
│                                                            │
│  ROLLBACK:                                                 │
│    docker compose -f ops/docker-compose.prod.yml pull api  │
│      :tag-anterior                                         │
│    docker compose -f ops/docker-compose.prod.yml up -d api │
│                                                            │
│  RESTORE DB:                                               │
│    ./ops/scripts/restore-db.sh /opt/backups/postgres/      │
│      tienda_online_$(date +%Y%m%d)_030000.sql.gz           │
│                                                            │
│  VER HEALTH:                                               │
│    curl https://${DOMAIN}/api/v1/health                    │
│                                                            │
│  VER LOGS:                                                 │
│    docker compose -f ops/docker-compose.prod.yml logs -f   │
│      --tail=100 api                                        │
│                                                            │
│  REINICIAR SERVICIO:                                       │
│    docker compose -f ops/docker-compose.prod.yml restart   │
│      api                                                   │
│                                                            │
│  ESCALAR (futuro):                                         │
│    docker compose -f ops/docker-compose.prod.yml up -d     │
│      api --scale api=3                                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### Paso O.2 — Prueba de estrés

```bash
npm install -g artillery
artillery quick --count 50 --num 10 https://${DOMAIN}/api/v1/health
artillery quick --count 20 --num 5 https://${DOMAIN}/api/v1/catalog/products
```

**CRITERIO DE ACEPTACIÓN:** P50 < 200ms, P95 < 500ms, 0% errores

### Paso O.3 — Mejora continua

```
Repetir mensualmente:
  1. npm audit → revisar vulnerabilidades
  2. Revisar Sentry → errores más frecuentes
  3. Revisar Grafana → tendencias de latencia y memoria
  4. Revisar Uptime Kuma → disponibilidad del período
  5. Verificar backups → restore test en staging
  6. CHANGELOG.md → actualizar con cambios del mes
```

---

## ANEXOS

### Anexo A: Nginx config

Archivo: `ops/nginx/nginx.conf`

```nginx
server {
    listen 80;
    server_name ${DOMAIN};
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN};

    ssl_certificate /etc/nginx/ssl/fullchain.pem;
    ssl_certificate_key /etc/nginx/ssl/privkey.pem;

    location /api/v1/health {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-Id $http_x_request_id;
        access_log off;
    }

    location / {
        proxy_pass http://api:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Request-Id $http_x_request_id;
        limit_req zone=api burst=20 nodelay;
    }
}
```

### Anexo B: Cloudflared config

Archivo: `ops/cloudflared/config.yml`

```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: tienda-api.<usuario>.workers.dev
    service: http://api:3000
  - service: http_status:404
```

### Anexo C: Docker Compose producción

Archivo: `ops/docker-compose.prod.yml`

```yaml
version: '3.8'

networks:
  tienda-net:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
  loki_data:
  uptime_kuma_data:

x-deploy: &default-deploy
  restart: unless-stopped
  networks:
    - tienda-net

services:
  api:
    <<: *default-deploy
    image: ghcr.io/${GITHUB_REPOSITORY:-usuario/tienda-api}:latest
    pull_policy: always
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASS}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://:${REDIS_PASS}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
      CORS_ORIGIN: https://${DOMAIN}
      CORS_ENABLED: 'true'
      SWAGGER_ENABLED: 'false'
      SENTRY_DSN: ${SENTRY_DSN}
    depends_on:
      postgres: { condition: service_healthy }
      redis: { condition: service_healthy }
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits: { cpus: '1', memory: 512M }

  postgres:
    <<: *default-deploy
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DB_NAME:-tienda_online}
      POSTGRES_USER: ${DB_USER:-tienda}
      POSTGRES_PASSWORD: ${DB_PASS}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-tienda} -d ${DB_NAME:-tienda_online}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits: { cpus: '1', memory: 1G }

  redis:
    <<: *default-deploy
    image: redis:7-alpine
    command: ["redis-server", "--requirepass", "${REDIS_PASS}"]
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASS}", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits: { cpus: '0.5', memory: 256M }

  # Opción A: Nginx (descomentar para eu.org, comentar cloudflared)
  nginx:
    <<: *default-deploy
    image: nginx:1.27-alpine
    ports: ["80:80", "443:443"]
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on: [api]

  # Opción B: Cloudflare Tunnel (descomentar para tunnel, comentar nginx)
  # cloudflared:
  #   <<: *default-deploy
  #   image: cloudflare/cloudflared:latest
  #   command: tunnel --config /etc/cloudflared/config.yml run
  #   volumes:
  #     - ./cloudflared:/etc/cloudflared

  # Monitoreo (Fase 3)
  prometheus:
    <<: *default-deploy
    image: prom/prometheus:v2.54
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command: ['--config.file=/etc/prometheus/prometheus.yml', '--storage.tsdb.path=/prometheus']

  grafana:
    <<: *default-deploy
    image: grafana/grafana:11.3-oss
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}

  loki:
    <<: *default-deploy
    image: grafana/loki:3.1
    volumes:
      - ./loki/loki-config.yml:/etc/loki/loki-config.yml:ro
      - loki_data:/loki
    command: -config.file=/etc/loki/loki-config.yml

  uptime-kuma:
    <<: *default-deploy
    image: louislam/uptime-kuma:1
    volumes:
      - uptime_kuma_data:/app/data
```

### Anexo D: GitHub Actions deploy.yml

Archivo: `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_DB: tienda_online
          POSTGRES_USER: tienda
          POSTGRES_PASSWORD: tienda_dev
        ports: [5432:5432]
        options: >-
          --health-cmd pg_isready -U tienda
          --health-interval 10s --health-timeout 5s --health-retries 5
      redis:
        image: redis:7-alpine
        ports: [6379:6379]
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm audit --audit-level=high || true
      - run: npx prisma generate
      - run: npx prisma migrate deploy
        env:
          DATABASE_URL: postgresql://tienda:tienda_dev@localhost:5432/tienda_online
      - run: npm run build
      - run: npm test
      - run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://tienda:tienda_dev@localhost:5432/tienda_online
          REDIS_URL: redis://localhost:6379
          JWT_SECRET: test-secret-ci

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Login to GHCR
        uses: docker/login-action@v3
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - name: Build and push
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            ghcr.io/${{ github.repository }}:latest
            ghcr.io/${{ github.repository }}:${{ github.sha }}
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/tienda
            export DOMAIN=${{ secrets.DOMAIN }}
            export DB_PASS=${{ secrets.DB_PASS }}
            export REDIS_PASS=${{ secrets.REDIS_PASS }}
            export JWT_SECRET=${{ secrets.JWT_SECRET }}
            export WEBHOOK_SECRET=${{ secrets.WEBHOOK_SECRET }}
            docker compose -f ops/docker-compose.prod.yml pull api
            docker compose -f ops/docker-compose.prod.yml up -d api
            docker image prune -f
```

### Anexo E: Diagrama de decisión de dominio

```
INICIO
  │
  ├─ ¿Tienes tarjeta para verificar en Oracle Cloud?
  │   NO  → Usar Fly.io (alternativa serverless)
  │   SÍ  → Continuar
  │
  ├─ ¿Necesitas dominio .com .io .dev profesional?
  │   NO  → Continuar
  │   SÍ  → Comprar dominio (~$8-12/año) + Opción A
  │
  ├─ ¿Prefieres no exponer IP pública ni abrir puertos?
  │   SÍ  → Opción B: Cloudflare Tunnel
  │   NO  → Opción A: Dominio .eu.org + Nginx
  │
  └─ FIN
```

---

## Diagrama de flujo general

```
[INICIO] → FASE 0: Preparación
    │                        │
    │                   ¿Compila y tests OK?
    │                        │
    │                   SÍ ← ─ ─ ─ NO → [REPARAR CÓDIGO] → FASE 0
    │                        │
    ▼                        │
FASE 1: Infraestructura ─────┘
    │
    ├─→ 1.1 Oracle Cloud VM
    ├─→ 1.2 Docker + Compose
    ├─→ 1.3 Dominio (A/B)
    ├─→ 1.4 Directorios
    ├─→ 1.5 Subir configs
    └─→ 1.6 Iniciar servicios
    │
    ├─ ¿Health check responde 200?
    │   SÍ → Continuar
    │   NO → [DEPURAR INFRA] → FASE 1
    │
    ▼
FASE 2: CI/CD ──────────────┘
    │
    ├─→ 2.1 Secrets en GitHub
    ├─→ 2.2 deploy.yml
    └─→ 2.3 Push test
    │
    ├─ ¿Deploy automático exitoso?
    │   SÍ → Continuar
    │   NO → [DEPURAR CI/CD] → FASE 2
    │
    ▼
FASE 3: Monitoreo ──────────┘
    │
    ├─→ 3.1 Sentry
    ├─→ 3.2 Prometheus + Grafana
    ├─→ 3.3 Métricas API
    └─→ 3.4 Uptime Kuma
    │
    ├─ ¿Métricas visibles en Grafana?
    │   SÍ → Continuar
    │   NO → [DEPURAR MONITOREO] → FASE 3
    │
    ▼
FASE 4: Seguridad ──────────┘
    │
    ├─→ 4.1 Hardening servidor
    ├─→ 4.2 Dependabot
    ├─→ 4.3 npm audit
    └─→ 4.4 Verificación
    │
    ├─ ¿Test SSL A+ y audit 0 critical?
    │   SÍ → Continuar
    │   NO → [CORREGIR SEGURIDAD] → FASE 4
    │
    ▼
FASE 5: Backups ────────────┘
    │
    ├─→ 5.1 Script backup
    ├─→ 5.2 Cron
    └─→ 5.3 Script restore
    │
    ├─ ¿Backup automático funciona?
    │   SÍ → Continuar
    │   NO → [CORREGIR BACKUP] → FASE 5
    │
    ▼
FASE O: Operación ──────────┘
    │
    ├─→ O.1 Runbook
    ├─→ O.2 Stress test
    └─→ O.3 Mejora continua
    │
    ▼
[FIN] — API en producción 🟢
```

---

## Verificación final (algoritmo completo)

```
1.  npm run build                    → exit code 0
2.  npm test                         → 89 passed, coverage ≥ thresholds
3.  npm run test:e2e                 → 7 suites passed
4.  npm audit --audit-level=high     → 0 high/critical
5.  curl https://${DOMAIN}/health    → 200 OK
6.  curl https://${DOMAIN}/docs      → 404 (Swagger off)
7.  git push origin main             → CI/CD: green check
8.  Sentry dashboard                 → errores visibles
9.  Grafana dashboard                → métricas visibles
10. Uptime Kuma                      → status UP
11. ssh hardening check              → pass
12. ls /opt/backups/postgres/        → backup file exists
```

---

## Especificación de recursos

| Recurso | Especificación | Límite |
|---------|---------------|--------|
| CPU API | 1 vCPU | Oracle ARM 4 OCPU total |
| RAM API | 512 MB | Oracle 24 GB total |
| CPU PostgreSQL | 1 vCPU | — |
| RAM PostgreSQL | 1 GB | — |
| CPU Redis | 0.5 vCPU | — |
| RAM Redis | 256 MB | — |
| Disco | 200 GB | Oracle Always Free |
| Backup retention | 7 días | rotación automática |
| Rate limit API | 100 req/min/IP | Cloudflare WAF |
| Rate limit login | 10 req/min | NestJS throttler |
| Uptime SLA | < 99.9% (sin SLA formal) | monitoreo vía Uptime Kuma |
