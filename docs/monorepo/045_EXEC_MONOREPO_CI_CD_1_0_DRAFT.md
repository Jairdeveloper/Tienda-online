---
id: 045
area: architecture
type: EXEC
module: monorepo
version: 1.0
status: DRAFT
tags:
  - monorepo
  - cicd
  - github-actions
  - cache
summary: "Reporte de la Fase 2 (CI/CD) del plan de migracion monorepo. Se agrego cache-dependency-path a los workflows ci.yml y deploy.yml, y se documento el procedimiento de verificacion manual."
keywords:
  - monorepo
  - cicd
  - github-actions
  - cache
  - setup-node
  - npm-cache
changelog:
  - version: 1.0
    date: 2026-06-03
    author: workflow-agent
    description: Creacion del reporte de Fase 2 CI/CD
---

# Fase 2: CI/CD — @tienda/api

## 1. Resumen

Se ejecuto la **Fase 2 (CI/CD)** del plan de migracion monorepo definido en `043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md`. El objetivo fue solucionar el cacheo de dependencias en GitHub Actions y documentar el procedimiento de verificacion.

### Problema detectado

Los lockfiles de `npm` ya no estan en la raiz del repositorio. Ahora residen en:

- `apps/api/package-lock.json`
- `apps/web/package-lock.json`

El step `actions/setup-node@v4` con `cache: npm` busca automaticamente un `package-lock.json` en la raiz. Al no encontrarlo, el cache simplemente no se genera, resultando en `npm ci` sin cache en cada ejecucion de CI.

---

## 2. Cambios realizados

### 2.1 `.github/workflows/ci.yml`

Se agrego `cache-dependency-path` al step de `actions/setup-node@v4`:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: npm
    cache-dependency-path: |
      apps/api/package-lock.json
      apps/web/package-lock.json
```

### 2.2 `.github/workflows/deploy.yml`

Idem al cambio anterior en el mismo step.

### 2.3 Archivos modificados

| Archivo                        | Cambio                                                                     |
| ------------------------------ | -------------------------------------------------------------------------- |
| `.github/workflows/ci.yml`     | Agregado `cache-dependency-path` apuntando a ambos lockfiles del monorepo  |
| `.github/workflows/deploy.yml` | Agregado `cache-dependency-path` apuntando a ambos lockfiles del monorepo  |

---

## 3. Estado de los workflows

### `ci.yml` — Pull requests a `main`

| Step                            | Comando                                      | Estado esperado |
| ------------------------------- | -------------------------------------------- | --------------- |
| Checkout                        | `actions/checkout@v4`                        | ✅              |
| Setup Node + cache              | `actions/setup-node@v4` + `cache-dependency-path` | ✅ (nuevo) |
| Install API deps                | `cd apps/api && npm ci`                      | ✅              |
| Install web deps                | `cd apps/web && npm ci`                      | ✅              |
| Prisma generate                 | `cd apps/api && npx prisma generate`         | ✅              |
| Prisma migrate deploy           | `cd apps/api && npx prisma migrate deploy`   | ✅              |
| Build                           | `cd apps/api && npm run build`               | ✅              |
| Unit tests                      | `cd apps/api && npm test`                    | ✅              |
| E2E tests                       | `cd apps/api && npm run test:e2e`            | ✅              |

### `deploy.yml` — Push a `main`

Idem al anterior, mas:

| Step                            | Comando / Accion                             | Estado esperado |
| ------------------------------- | -------------------------------------------- | --------------- |
| verify-deploy                   | Espera deploy de Vercel + health check curl  | ✅              |

---

## 4. Procedimiento de verificacion manual

Para verificar que los workflows funcionan correctamente, seguir estos pasos:

### 4.1 Crear branch de prueba

```bash
git checkout -b test/fase2-cicd-verification
git add .
git commit -m "test: verify CI/CD cache-dependency-path"
git push origin test/fase2-cicd-verification
```

### 4.2 Crear PR dummy para triggeriar `ci.yml`

Desde GitHub UI o CLI:

```bash
gh pr create \
  --base main \
  --head test/fase2-cicd-verification \
  --title "test: verify CI/CD workflows" \
  --body "PR de prueba para verificar que ci.yml ejecuta todos los pasos correctamente con cache-dependency-path"
```

### 4.3 Verificar en GitHub Actions

1. Ir a la pestana **Actions** del repositorio en GitHub
2. Confirmar que el workflow `CI` se ejecuta en el PR creado
3. Verificar que **todos los steps pasan**:
   - `actions/setup-node@v4` muestra en los logs: `Cache restored from key: npm-...`
   - `cd apps/api && npm ci` muestra: `restored from cache`
   - `cd apps/web && npm ci` muestra: `restored from cache`
   - Prisma generate, migrate deploy, build, tests sin errores
4. Si es el primer build (cache miss), verificar que **al final del workflow** GitHub muestra: `Cache saved successfully`

### 4.4 Verificar `deploy.yml` (opcional, requiere push a main)

```bash
git checkout main
git merge test/fase2-cicd-verification
git push origin main
```

Verificar que el workflow `Deploy` corre completo, incluyendo el job `verify-deploy` con el health check.

### 4.5 Limpiar

```bash
git push origin --delete test/fase2-cicd-verification
gh pr close test/fase2-cicd-verification
git branch -D test/fase2-cicd-verification
```

---

## 5. Riesgos y consideraciones

1. **Cache miss en primera ejecucion**: La primera vez que corran los workflows tras este cambio, no habra cache. GitHub Actions generara el cache al finalizar exitosamente. Las ejecuciones subsecuentes usaran el cache.

2. **Multiples lockfiles**: Al especificar dos `cache-dependency-path`, GitHub Actions calcula un hash combinado de ambos archivos. Si solo uno cambia, el cache se invalida para ambos. Esto es correcto porque ambos sets de dependencias son independientes.

3. **Deploy en Vercel**: El job `verify-deploy` en `deploy.yml` asume que Vercel ya tiene integracion con GitHub. Si no es el caso, el health check puede fallar. Verificar que la integracion esta activa en Vercel Dashboard > Project > Git.

4. **Compatibilidad con acciones existentes**: No se requiere actualizar ninguna otra accion. `actions/setup-node@v4` soporta `cache-dependency-path` desde su version inicial.

---

## 6. Referencias

- `043_EXEC_MONOREPO_MIGRATION_1_0_DRAFT.md` — Plan de migracion monorepo (Fase 2 checklist)
- `AGENTS.md` — Guia de agentes con estructura monorepo
- [GitHub Actions: Caching dependencies to speed up workflows](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [actions/setup-node: cache-dependency-path](https://github.com/actions/setup-node#caching-global-packages-data)
