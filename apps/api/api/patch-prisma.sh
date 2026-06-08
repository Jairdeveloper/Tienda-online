cd "$(dirname "$0")/.." && sed -i 's/"postinstall": true/"postinstall": false/' node_modules/.prisma/client/index.js
