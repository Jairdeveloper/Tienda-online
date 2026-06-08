const fs = require('fs');
const path = require('path');

const target = path.join(__dirname, '..', 'node_modules', '.prisma', 'client', 'index.js');

if (!fs.existsSync(target)) {
  console.error('ERROR: Generated Prisma client not found at', target);
  process.exit(1);
}

let content = fs.readFileSync(target, 'utf8');
const before = content;
content = content.replace(/"postinstall":\s*true/, '"postinstall": false');
content = content.replace(/ciName:\s*['"]Vercel['"]/, 'ciName: undefined');

if (content === before) {
  console.error('WARNING: No changes made — pattern not found in', target);
  console.error('Checking for postinstall and ciName patterns...');
  if (/"postinstall"/.test(before)) console.error('  postinstall FOUND');
  else console.error('  postinstall NOT FOUND');
  if (/ciName/.test(before)) console.error('  ciName FOUND');
  else console.error('  ciName NOT FOUND');
  process.exit(1);
}

fs.writeFileSync(target, content);
console.log('OK: Patched postinstall and ciName in', target);
