const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('SVG rect rx attributes use a single length value', () => {
  const publicDir = path.join(__dirname, '..', 'public');
  const files = fs.readdirSync(publicDir)
    .filter((file) => file.endsWith('.js'))
    .map((file) => path.join(publicDir, file));

  const offenders = [];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    const matches = content.matchAll(/<rect\b[^>]*\brx="([^"]*\s+[^"]*)"/g);

    for (const match of matches) {
      offenders.push(`${path.basename(file)}: ${match[0]}`);
    }
  }

  assert.deepEqual(offenders, []);
});
