---
id: 047
area: architecture
type: EXEC
module: monorepo
version: 1.0
status: DRAFT
tags:
  - monorepo
  - redis
  - upstash
  - production
  - serverless
summary: "Reporte de ejecucion de Fase 4: Redis del plan de migracion monorepo. Verificacion de servicios Redis locales y configuracion Upstash para produccion."
keywords:
  - redis
  - upstash
  - serverless
  - ioredis
  - lock
  - deploy
changelog:
  - version: 1.0
    date: 2026-06-03
    author: system
    description: Ejecucion de Fase 4 - Redis
---

# Ejecucion Fase 4: Redis — @tienda/api

## Resumen

Se ejecuto la Fase 4 del plan de migracion monorepo (`043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md`),
que comprende la verificacion de los servicios Redis locales, la configuracion de
Upstash para produccion serverless, y las pruebas unitarias del modulo Redis.

---

## Arquitectura actual

El modulo Redis (`apps/api/src/redis/`) tiene una arquitectura de **provider pattern**:

```
redis/
├── index.ts                   # Barrel exports
├── redis.constants.ts         # REDIS_CLIENT token + IRedisClient interface
├── redis.module.ts            # @Global() module con factory: Upstash vs ioredis
├── redis.service.ts           # Wrapper: get, set, del, exists
├── redis-lock.service.ts      # Distributed lock con SET EX NX
├── redis.service.spec.ts      # Tests RedisService (8 tests)
├── redis-lock.service.spec.ts # Tests RedisLockService (10 tests)
└── upstash-client.ts          # Upstash REST client (serverless)
└── upstash-client.spec.ts     # Tests UpstashClient (20 tests)
```

### RedisModule factory

En `redis.module.ts`, el cliente se selecciona segun entorno:

| Condicion | Cliente | Uso |
|-----------|---------|-----|
| `REDIS_URL` vacio | `noopClient` | Sin Redis — operaciones no-op |
| `NODE_ENV=production` | `UpstashClient` | REST API via `@upstash/redis` |
| Desarrollo | `ioredis` | Conexion TCP directa |

---

## Modificaciones realizadas

### 1. Bugfix en `upstash-client.ts`

Se encontraron 3 lugares donde `return promise` no usaba `await`, impidiendo que el `try/catch` atrapara rechazos:

| Metodo | Linea | Cambio |
|--------|-------|--------|
| `set` (sin args) | 24 | `return this.client.set(...)` → `return await this.client.set(...)` |
| `set` (con options) | 39 | `return this.client.set(...)` → `return await this.client.set(...)` |
| `del` (single key) | 51 | `return this.client.del(...)` → `return await this.client.del(...)` |

### 2. Tests agregados

| Archivo | Tests | Cobertura |
|---------|-------|-----------|
| `redis-lock.service.spec.ts` | 10 | acquire (4), release (3), isLocked (3) |
| `upstash-client.spec.ts` | 20 | get (3), set (4), del (4), exists (3), ping (2), scan (2), eval (1), quit (1) |

### 3. `.env.example` actualizado

Se agrego documentacion sobre la deteccion automatica de entorno del `RedisModule`.

---

## Configuracion Upstash para produccion

### Paso a paso

1. Crear base de datos Redis en [console.upstash.com](https://console.upstash.com)
2. Copiar `UPSTASH_REDIS_TOKEN` y `REDIS_URL` (REST API URL, formato `https://<region>.upstash.io`)
3. Configurar en Vercel:

   | Variable | Valor |
   |----------|-------|
   | `REDIS_URL` | `https://<region>.upstash.io` |
   | `UPSTASH_REDIS_TOKEN` | `<token>` |
   | `NODE_ENV` | `production` |

4. No requiere cambios de codigo — `RedisModule` detecta `NODE_ENV=production` y usa `UpstashClient` automaticamente.

### Limitaciones conocidas

- **EVAL no soportado**: Upstash REST API no soporta Lua scripting (`EVAL`). El metodo `upstashClient.eval()` lanza error explicitamente.
- **Lock release no atomico**: `RedisLockService.release()` usa `get` + compare + `del` (3 operaciones). No es atomicamente seguro como lo seria con Lua. Para propositos de la tienda online, es aceptable.

---

## Tests

```bash
cd apps/api && npx jest --testPathPattern="redis"

# Resultados:
# 3 suites, 38 tests, all passed
# - redis.service.spec.ts       8 tests
# - redis-lock.service.spec.ts  10 tests
# - upstash-client.spec.ts      20 tests
```

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `apps/api/src/redis/upstash-client.ts` | Fix `return await` en set y del |
| `apps/api/src/redis/upstash-client.spec.ts` | Creado — 20 tests |
| `apps/api/src/redis/redis-lock.service.spec.ts` | Creado — 10 tests |
| `.env.example` | Documentacion del auto-detect de RedisModule |
| `docs/REGISTRO_IDS.md` | ID 047 registrado |
| `docs/monorepo/047_EXEC_MONOREPO_REDIS_1_0_DRAFT.md` | Este reporte |

---

## Referencias

- `043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md` — Plan de migracion monorepo
- `apps/api/src/redis/redis.module.ts` — Factory del cliente Redis
- `apps/api/src/redis/upstash-client.ts` — Cliente Upstash REST
- [Upstash Docs](https://upstash.com/docs)
