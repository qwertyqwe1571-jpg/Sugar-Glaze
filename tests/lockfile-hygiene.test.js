const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const lockfile = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'package-lock.json'), 'utf8')
);

test('package-lock does not install stale Telegram/Cypress request dependencies', () => {
  const packagePaths = Object.keys(lockfile.packages || {});
  const stalePackages = packagePaths.filter(packagePath =>
    /node_modules[\\/](node-telegram-bot-api|request|request-promise-core|@cypress[\\/]request|@cypress[\\/]request-promise)$/.test(packagePath)
  );

  assert.deepEqual(stalePackages, []);
});
