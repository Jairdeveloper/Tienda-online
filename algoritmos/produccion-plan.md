# Plan de Producción — @tienda/api

**Versión:** 1.0 | **Estado:** DRAFT | **Herramientas:** 100% gratuitas/open-source

---

## Arquitectura objetivo

```
  ┌─────────────────────────────────────┐
  │        Opción A: Dominio .eu.org    │
  │  (gratis, aprobación manual 1-3d)  │
  └──────────────┬──────────────────────┘
                 │
  ┌──────────────▼──────────────────────┐
  │   Opción B: Cloudflare Tunnel       │
  │  (tunel directo, sin puertos        │
  │   abiertos, sin IP pública)         │
  │  + workers.dev como subdominio      │
  └──────────────┬──────────────────────┘
                 │
        ┌────────▼─────────┐
        │   Nginx / Caddy  │
        │  (mismo servidor)│
        └────────┬─────────┘
                 │
  ┌──────────────┼──────────────────────┐
  │              │                      │
 ┌▼─────────┐ ┌──▼────────┐ ┌─────────▼─┐
 │API Docker│ │PostgreSQL │ │   Redis   │
 │ (NestJS) │ │   16      │ │    7      │
 └────┬─────┘ └────┬──────┘ └─────┬─────┘
      │            │              │
 ┌────▼─────┐     │              │
 │Prometheus│◄────┘              │
 │+ Grafana │                     │
 └──────────┘           ┌─────────▼─────┐
                        │  Uptime Kuma  │
                        │(self-hosted)  │
                        └───────────────┘
```

## Infraestructura (Todo gratis)

| Recurso | Proveedor | Costo | Detalle |
|---------|-----------|-------|---------|
| **Servidor** | Oracle Cloud Always Free | **$0** | VM.ARM.Standard.A1 (4 OCPU, 24GB RAM, 200GB disco) |
| **Dominio** | Opción A: eu.org | **$0** | Dominio .eu.org gratis (aprobación manual 1-3 días) |
| **Dominio** | Opción B: Cloudflare Tunnel | **$0** | Tunel directo + workers.dev subdominio, sin IP pública |
| **DNS + SSL + CDN** | Cloudflare (free tier) | **$0** | DNS, SSL automático, WAF básico, DDoS protection |
| **CI/CD** | GitHub Actions | **$0** | 2000 min/mes (público) o 300 min/mes (privado) |
| **Container Registry** | GitHub Container Registry (GHCR) | **$0** | Sin límites de pull |
| **Base de datos** | PostgreSQL auto-gestionado en el VPS | **$0** | Docker + backups automáticos vía cron |
| **Redis** | Redis auto-gestionado en el VPS | **$0** | Docker |
| **Monitoreo** | Prometheus + Grafana (auto-gestionados) | **$0** | Open source, mismo VPS |
| **Uptime monitoring** | Uptime Kuma (auto-gestionado) | **$0** | Open source, mismo VPS |
| **Error tracking** | Sentry (free tier) | **$0** | 5k eventos/mes |
| **Logging** | Loki + Grafana (auto-gestionado) | **$0** | Open source, mismo VPS |
| **Backups** | cron + rclone + Backblaze B2 | **$0** | B2: 10GB free, rclone encrypts |
| **Notificaciones** | Telegram Bot API | **$0** | Alertas de monitoreo |

> **Alternativa serverless (sin VPS):** Fly.io (3 VMs gratis) + Neon Postgres (0.5GB free) + Upstash Redis (10MB free). Límites más ajustados pero cero mantenimiento de servidor.

---

## Fase 0: Preparación del código (1-2 días)

### 0.1 — Seguridad HTTP (helmet)

```bash
npm install helmet
```

Agregar en `src/main.ts`:

```typescript
import helmet from 'helmet';
app.use(helmet());
```

### 0.2 — Swagger deshabilitado en producción

En `src/main.ts`, respetar `SWAGGER_ENABLED`:

```typescript
const swaggerEnabled = configService.get<string>('SWAGGER_ENABLED');
if (swaggerEnabled === 'true' || swaggerEnabled === true) { ... }
```

### 0.3 — CORS restrictivo en producción

```typescript
const origins = corsOrigin
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

app.enableCors({
  origin: origins.length > 0 ? origins : false,
  credentials: true,
});
```

### 0.4 — WEBHOOK_SECRET sin default inseguro

En `env.validation.ts`:

```typescript
WEBHOOK_SECRET: Joi.string().min(16).when('NODE_ENV', {
  is: 'production',
  then: Joi.required(),
  otherwise: Joi.string().min(16).default('dev-webhook-secret-change-in-production'),
}),
```

### 0.5 — Graceful shutdown

NestJS ya tiene `enableShutdownHooks`. Agregar en `main.ts`:

```typescript
app.enableShutdownHooks();
```

PrismaService ya implementa `OnModuleDestroy`.

### 0.6 — ESLint + Prettier

```bash
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier eslint-config-prettier
```

Crear `.eslintrc.js` y `.prettierrc` con config estándar NestJS.

### 0.7 — Scripts de producción en package.json

```json
"db:migrate:prod": "prisma migrate deploy",
"db:seed:prod": "ts-node prisma/seed.ts",
"start:prod": "node dist/main"
```

Ya existen, solo verificar que `start:prod` funcione correctamente.

---

## Fase 1: Infraestructura (2-3 días)

### 1.1 — Obtener servidor (Oracle Cloud Free Tier)

1. Registrarse en [Oracle Cloud](https://www.oracle.com/cloud/free/) (requiere tarjeta para verificación, no cobra)
2. Crear VM.ARM.Standard.A1 (4 OCPU, 24GB RAM, 200GB disco)
3. Elegir Canonical Ubuntu 24.04 LTS
4. Configurar firewall (security list): abrir puertos 80, 443, 22 (ssh desde tu IP)
5. Configurar ssh key + deshabilitar password auth

### 1.2 — Instalar Docker y Docker Compose

```bash
# En el VPS
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 1.3 — Dominio y Cloudflare

Elige **una** de estas dos opciones gratuitas:

#### Opción A: Dominio .eu.org (gratis, recomendada)

1. Ir a [nic.eu.org](https://nic.eu.org) y registrarse
2. Solicitar un dominio (ej: `tienda-api.eu.org`)
3. Esperar aprobación manual (1-3 días hábiles)
4. Una vez aprobado, agregar a Cloudflare:
   - Ir a Cloudflare → Add Site → ingresar `tienda-api.eu.org`
   - Cloudflare escanea los DNS existentes
   - Cambiar nameservers en nic.eu.org a los de Cloudflare
5. Crear registro **A** apuntando a la IP del VPS (proxy activado ☁️)
6. SSL/TLS → Full (strict)
7. Crear regla WAF para rate limiting (100 req/min por IP)

#### Opción B: Cloudflare Tunnel (sin dominio, sin IP pública)

1. Instalar `cloudflared` en el VPS:
   ```bash
   curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
   chmod +x /usr/local/bin/cloudflared
   ```
2. Autenticar:
   ```bash
   cloudflared tunnel login
   ```
3. Crear tunel:
   ```bash
   cloudflared tunnel create tienda-api
   ```
4. Crear `ops/cloudflared/config.yml`:
   ```yaml
   tunnel: <tunnel-id>
   credentials-file: /root/.cloudflared/<tunnel-id>.json
   ingress:
     - hostname: tienda-api.<tu-usuario>.workers.dev
       service: http://api:3000
     - service: http_status:404
   ```
5. Configurar DNS en Cloudflare:
   ```bash
   cloudflared tunnel route dns tienda-api tienda-api.<tu-usuario>.workers.dev
   ```
6. Agregar al docker-compose como servicio:
   ```yaml
   cloudflared:
     image: cloudflare/cloudflared:latest
     restart: unless-stopped
     networks:
       - tienda-net
     command: tunnel --config /etc/cloudflared/config.yml run
     volumes:
       - ./cloudflared:/etc/cloudflared
   ```
7. **Ventaja:** No necesitas abrir puertos 80/443, no necesitas IP pública. Cloudflare Tunnel conecta directo.
8. **SSL automático** — Cloudflare maneja el certificado.

### 1.4 — Nginx reverse proxy (solo Opción A)

> Si usas **Opción B (Cloudflare Tunnel)**, no necesitas Nginx expuesto. El Docker Compose de producción incluye `cloudflared` como servicio y se conecta directo a la API interna.

Crear `ops/nginx/nginx.conf` (solo para Opción A):

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

Certificado SSL automático con Cloudflare Origin Certificate (gratis).

### 1.5 — Docker Compose de producción

Crear `ops/docker-compose.prod.yml`:

```yaml
version: '3.8'

networks:
  tienda-net:
    driver: bridge

services:
  api:
    image: ghcr.io/tu-user/tienda-api:latest
    pull_policy: always
    restart: unless-stopped
    networks:
      - tienda-net
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASS}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
      JWT_SECRET: ${JWT_SECRET}
      WEBHOOK_SECRET: ${WEBHOOK_SECRET}
      CORS_ORIGIN: https://${DOMAIN}
      CORS_ENABLED: 'true'
      SWAGGER_ENABLED: 'false'
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--no-verbose", "--tries=1", "--spider", "http://localhost:3000/api/v1/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M

  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    networks:
      - tienda-net
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER} -d ${DB_NAME}"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    networks:
      - tienda-net
    command: ["redis-server", "--requirepass", "${REDIS_PASS}"]
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

  # Opción A: Nginx (usar con dominio .eu.org + Cloudflare DNS)
  nginx:
    image: nginx:1.27-alpine
    restart: unless-stopped
    networks:
      - tienda-net
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - api
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 128M

  # Opción B: Cloudflare Tunnel (alternativa a Nginx, sin puertos abiertos)
  # Descomentar si se usa esta opción (comentar nginx arriba)
  # cloudflared:
  #   image: cloudflare/cloudflared:latest
  #   restart: unless-stopped
  #   networks:
  #     - tienda-net
  #   command: tunnel --config /etc/cloudflared/config.yml run
  #   volumes:
  #     - ./cloudflared:/etc/cloudflared

volumes:
  postgres_data:
  redis_data:
```

---

## Fase 2: CI/CD (1-2 días)

### 2.1 — GitHub Actions: CI + CD

Crear `.github/workflows/deploy.yml`:

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
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready -U tienda
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
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

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ghcr.io/${{ github.repository }}:latest,ghcr.io/${{ github.repository }}:${{ github.sha }}

      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/tienda
            docker compose -f ops/docker-compose.prod.yml pull api
            docker compose -f ops/docker-compose.prod.yml up -d --no-deps api
            docker image prune -f
```

### 2.2 — GitHub Actions secrets

Configurar en GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Valor |
|--------|-------|
| `VPS_HOST` | IP del VPS |
| `VPS_USER` | ubuntu |
| `VPS_SSH_KEY` | Clave privada SSH para deploy |
| `JWT_SECRET` | string aleatorio min 32 chars |
| `WEBHOOK_SECRET` | string aleatorio min 32 chars |
| `DB_PASS` | contraseña PostgreSQL |
| `REDIS_PASS` | contraseña Redis |

---

## Fase 3: Monitoreo (1-2 días)

### 3.1 — Error tracking (Sentry)

```bash
npm install @sentry/node @sentry/profiling-node
```

En `src/main.ts`:

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,
});
```

Registrarse en [sentry.io](https://sentry.io) (free tier: 5k eventos/mes).

### 3.2 — Prometheus + Grafana (auto-gestionado)

Agregar al `docker-compose.prod.yml`:

```yaml
  prometheus:
    image: prom/prometheus:v2.54
    restart: unless-stopped
    networks:
      - tienda-net
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'

  grafana:
    image: grafana/grafana:11.3-oss
    restart: unless-stopped
    networks:
      - tienda-net
    ports:
      - "3001:3000"  # No exponer directo, usar Nginx con auth
    volumes:
      - grafana_data:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD}
      GF_INSTALL_PLUGINS: grafana-piechart-panel

  loki:
    image: grafana/loki:3.1
    restart: unless-stopped
    networks:
      - tienda-net
    volumes:
      - ./loki/loki-config.yml:/etc/loki/loki-config.yml:ro
      - loki_data:/loki
    command: -config.file=/etc/loki/loki-config.yml
```

Métricas a monitorear en Grafana:
- Requests por segundo (agregar contador en middleware)
- Latencia P50/P95/P99
- Tasa de error 4xx y 5xx
- Conexiones DB activas
- Memoria Redis usada
- Stock bajo (consulta periódica)

### 3.3 — Uptime Kuma (monitoreo externo)

```yaml
  uptime-kuma:
    image: louislam/uptime-kuma:1
    restart: unless-stopped
    networks:
      - tienda-net
    ports:
      - "3002:3001"  # No exponer directo, usar Nginx
    volumes:
      - uptime_kuma_data:/app/data
```

Configurar monitor HTTP para `https://${DOMAIN}/api/v1/health` cada 1 minuto.

### 3.4 — Prometheus metrics en la API

Instalar:

```bash
npm install @willsoto/nestjs-prometheus
```

En `app.module.ts`:

```typescript
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
    // ...
  ],
})
```

> **Nota:** `/metrics` debe estar detrás de autenticación o solo accesible desde red interna (Nginx bloquea acceso externo).

---

## Fase 4: Seguridad (1-2 días)

### 4.1 — Hardening del servidor

```bash
# Firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# Fail2ban
sudo apt install fail2ban
sudo systemctl enable fail2ban

# SSH hardening
# /etc/ssh/sshd_config:
#   PermitRootLogin no
#   PasswordAuthentication no
#   Port 2222 (cambiar y abrir en ufw)

# Auto-updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4.2 — Dependabot

En `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10

  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

### 4.3 — npm audit en CI

Agregar paso en `ci.yml`:

```yaml
- run: npm audit --audit-level=high || true
```

---

## Fase 5: Backups y DR (1 día)

### 5.1 — Backup de PostgreSQL

Crear `ops/scripts/backup-db.sh`:

```bash
#!/bin/bash
set -e

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups/postgres"
DB_NAME="${DB_NAME:-tienda_online}"
DB_USER="${DB_USER:-tienda}"

mkdir -p "$BACKUP_DIR"

# Dump comprimido
docker exec tienda_postgres pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

# Mantener solo últimos 7 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: ${BACKUP_DIR}/${DB_NAME}_${TIMESTAMP}.sql.gz"
```

Cron diario (`sudo crontab -e`):

```
0 3 * * * /opt/tienda/ops/scripts/backup-db.sh
```

### 5.2 — Restore script

Crear `ops/scripts/restore-db.sh`:

```bash
#!/bin/bash
set -e

BACKUP_FILE="$1"
if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup-file.sql.gz>"
  exit 1
fi

gunzip -c "$BACKUP_FILE" | docker exec -i tienda_postgres psql -U tienda tienda_online
echo "Restore completed from: $BACKUP_FILE"
```

---

## Fase 6: Operaciones (continuo)

### 6.1 — Runbook de deploy

```markdown
## Deploy manual (si CI falla)

1. SSH al VPS: `ssh ubuntu@${DOMAIN}`
2. cd /opt/tienda
3. docker compose -f ops/docker-compose.prod.yml pull api
4. docker compose -f ops/docker-compose.prod.yml up -d --no-deps api
5. docker image prune -f

## Rollback

1. docker compose -f ops/docker-compose.prod.yml pull api:anterior-tag
2. docker compose -f ops/docker-compose.prod.yml up -d --no-deps api:anterior-tag

## Restore DB

1. ssh ubuntu@${DOMAIN}
2. cd /opt/tienda
3. ./ops/scripts/restore-db.sh /opt/backups/postgres/tienda_online_20260530_030000.sql.gz

## Ver health

curl https://${DOMAIN}/api/v1/health
```

### 6.2 — Prueba de estrés

```bash
npm install -g artillery
artillery quick --count 50 --num 10 https://api.tudominio.com/api/v1/health
```

---

## Timeline estimado

| Fase | Duración | Depende de |
|------|----------|------------|
| Fase 0: Preparación | 1-2 días | — |
| Fase 1: Infraestructura | 2-3 días | Fase 0 |
| Fase 2: CI/CD | 1-2 días | Fase 1 |
| Fase 3: Monitoreo | 1-2 días | Fase 1 |
| Fase 4: Seguridad | 1-2 días | Fase 1 |
| Fase 5: Backups | 1 día | Fase 1 |
| **Total** | **7-12 días** | |

---

## Lista de verificación pre-producción

- [ ] Código compila sin errores (`npm run build`)
- [ ] Tests unitarios pasan (89/89)
- [ ] Tests E2E pasan (7/7)
- [ ] npm audit sin vulnerabilidades high/critical
- [ ] Swagger deshabilitado en producción
- [ ] CORS configurado con origen específico
- [ ] helmet habilitado
- [ ] WEBHOOK_SECRET sin default
- [ ] JWT_SECRET rotado (no el de desarrollo)
- [ ] Secrets en GitHub Actions (no hardcodeados)
- [ ] Docker build exitoso
- [ ] Health check responde ok
- [ ] Prometheus + Grafana accesibles
- [ ] Sentry capturando errores
- [ ] Backups automáticos configurados
- [ ] Uptime Kuma monitoreando endpoint
- [ ] Cloudflare SSL activo (Full strict)
- [ ] Firewall configurado
- [ ] Fail2ban activo
- [ ] SSH con key-only + puerto no estándar
- [ ] Rollback plan documentado

---

## Costo mensual total

| Recurso | Costo |
|---------|-------|
| Oracle Cloud VPS | $0 |
| Dominio (eu.org o Cloudflare Tunnel) | $0 |
| Cloudflare (DNS + SSL + WAF) | $0 |
| GitHub Actions CI/CD | $0 |
| GHCR (Container Registry) | $0 |
| Sentry (5k eventos/mes) | $0 |
| Backblaze B2 (10GB) | $0 |
| **Total** | **$0/mes** |

> **Alternativa de pago (futuro):** Dominio .com .io .dev (~$8-12/año en Cloudflare Registrar o Namecheap). Recomendado cuando el proyecto esté consolidado, por profesionalismo y confianza del usuario.
>
> Otros upgrades opcionales: Sentry Team ($26/mes) si excedes 5k eventos/mes, o Backblaze B2 (+$0.01/GB/mes) si excedes 10GB.
