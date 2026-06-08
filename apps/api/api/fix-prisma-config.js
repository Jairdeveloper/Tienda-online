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
  console.warn('WARNING: No changes made — pattern not found in', target);
  console.warn('Checking for postinstall and ciName patterns...');
  if (/"postinstall"/.test(before)) console.warn('  postinstall FOUND');
  else console.warn('  postinstall NOT FOUND');
  if (/ciName/.test(before)) console.warn('  ciName FOUND');
  else console.warn('  ciName NOT FOUND');
} else {
  fs.writeFileSync(target, content);
  console.log('OK: Patched postinstall and ciName in', target);
}
