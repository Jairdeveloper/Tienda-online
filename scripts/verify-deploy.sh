#!/usr/bin/env bash
set -euo pipefail

URL="${1:-https://tienda-online-jair08-zped08s-projects.vercel.app}"
echo "Verificando deploy en $URL"

echo -n "✓ /_health ... "
curl -sf "$URL/_health" > /dev/null && echo "OK" || { echo "FAIL"; exit 1; }

echo -n "✓ /_diag ... "
curl -sf "$URL/_diag" > /dev/null && echo "OK" || { echo "FAIL"; exit 1; }

echo -n "✓ /api/v1/health ... "
curl -sf "$URL/api/v1/health" > /dev/null && echo "OK" || { echo "FAIL"; exit 1; }

echo -n "✓ POST /api/v1/auth/login ... "
curl -sf -X POST "$URL/api/v1/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@tienda.local","password":"Admin123!"}' > /dev/null \
  && echo "OK" || { echo "FAIL"; exit 1; }

echo ""
echo "✅ Todos los checks pasaron"
