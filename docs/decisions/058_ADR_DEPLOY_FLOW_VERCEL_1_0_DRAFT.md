---
id: 058
area: decisions
type: ADR
module: devops
version: 1.0
status: DRAFT
author: system
created: 2026-06-07
last_updated: 2026-06-07
dependencies:
  - 049
  - 057
tags:
  - adr
  - devops
  - vercel
  - deploy
  - workflow
summary: "ADR sobre el flujo de deploy Preview ↔ Production en Vercel para @tienda/api, incluyendo script de automatización, promoción y rollback."
keywords:
  - adr
  - devops
  - vercel
  - deploy
  - preview
  - production
  - workflow
changelog:
  - version: 1.0
    date: 2026-06-07
    author: system
    changes:
      - "Creación inicial del documento"
---

# ADR: Flujo de Deploy Preview ↔ Production en Vercel

## Status

Accepted

## Context

El proyecto @tienda/api se despliega en Vercel usando `vercel.json` con `builds` personalizados
(no Serverless Framework de Vercel, sino build manual con `@vercel/node` + `includeFiles`).
Esto implica que:

1. **No hay GitHub Auto-Deploy** — Vercel no detecta pushes automáticamente porque `builds`
   en `vercel.json` desactiva la integración nativa de Git.
2. **Deploys manuales via CLI** — `npx vercel` para preview, `npx vercel --prod` para producción.
3. **Dominio personalizado** — `tienda-online-jair08-zped08s-projects.vercel.app` debe actualizarse
   con `--prod`.
4. **Sin distinción de entornos** — Preview y Production comparten exactamente el mismo build
   y configuración. La única diferencia es el alias DNS.

Históricamente, el flujo era completamente manual:
```
git commit → git push → npx vercel (preview) → test → npx vercel --prod (production)
```

Esto introduce riesgos:
- Deployar a producción sin haber testeado en preview
- Olvidar el paso `--prod` y dejar producción desactualizada
- Errores de tipeo en comandos manuales

## Decision

Automatizar el flujo completo con dos scripts npm en la raíz del monorepo:

### `npm run deploy:preview`

```
git push origin main
npx vercel --token $VERCEL_TOKEN
```

Propósito: Desplegar el estado actual de `main` a una URL preview única para validación.

### `npm run deploy:prod`

```
npx vercel --prod --token $VERCEL_TOKEN
```

Propósito: Promocionar el último deploy preview a producción (alias al dominio personalizado).

### Flujo resultante

```
git commit → npm run deploy:preview → test → npm run deploy:prod
                      ↑                            ↑
                preview URL única           dominio personalizado
```

### Promoción explícita, no automática

Se rechaza la promoción automática (deploy a producción en cada push) porque:
- El crash de Lambda (`057_BUGFIX_BACKEND_LAMBDA_CRASH`) demostró que el entorno serverless
  tiene comportamientos impredecibles que no se detectan en build-time.
- Cada deploy a producción debe ser una decisión consciente después de validar en preview.

### Token de Vercel

`VERCEL_TOKEN` debe estar disponible en el entorno de desarrollo local (`.env` o variable de shell).
Se obtiene desde [Vercel Tokens](https://vercel.com/account/tokens).

### Rollback

Si un deploy a producción falla:
1. `npx vercel --prod --token $VERCEL_TOKEN` redeploya el último commit de `main`
2. Si el bug está en el código, hacer `git revert` del commit problemático, luego `npm run deploy:prod`

No se necesita rollback automático — el deploy de Vercel es inmutable y cada `--prod` simplemente
actualiza el alias al último deploy exitoso.

## Consequences

### Positive

- Flujo reproducible y documentado
- Elimina errores manuales
- Preview y production usan exactamente el mismo build
- Scripts cortos y fáciles de mantener

### Negative

- Dependencia de `VERCEL_TOKEN` en entorno local
- Dos comandos en vez de uno (pero la separación es intencional)
- No hay CI gate (tests antes de deploy) — se asume que el desarrollador valida localmente

### Neutral

- Los scripts asumen `origin/main` como rama de deploy. Si se trabaja en features branches,
  hay que hacer `git push origin feature-branch` manualmente antes del deploy preview.

## Alternatives Considered

### GitHub Actions CI/CD — Rechazado

Podría automatizar todo: push → test → build → deploy preview → deploy prod.
Se rechaza porque:
- El crash de Lambda no es detectable en CI (ocurre solo en runtime serverless)
- Añade complejidad (mantener workflow de Actions + debugging remoto)
- El flujo actual manual es manejable para un equipo pequeño

### Vercel GitHub Integration — Rechazado

Vercel ofrece auto-deploy por rama. Se rechaza porque `builds` en `vercel.json`
desactiva esta integración. Migrar a `@vercel/node` sin `builds` requeriría
refactor del proyecto.

## Implementation

```bash
# ~/.bashrc o .env
export VERCEL_TOKEN="..."

# En package.json raíz
{
  "scripts": {
    "deploy:preview": "git push origin main && npx vercel --token $VERCEL_TOKEN",
    "deploy:prod": "npx vercel --prod --token $VERCEL_TOKEN"
  }
}
```
