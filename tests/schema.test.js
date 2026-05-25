const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');

test('production schema stores orders.items as jsonb and persists verification codes', () => {
  const schema = fs.readFileSync(path.join(rootDir, 'database', 'sugar_glaze_schema.sql'), 'utf8');

  assert.match(schema, /items\s+jsonb\s+not\s+null/i);
  assert.doesNotMatch(schema, /items\s+text\s+not\s+null/i);
  assert.match(schema, /create\s+table\s+if\s+not\s+exists\s+public\.order_verifications/i);
  assert.match(schema, /draft\s+jsonb\s+not\s+null/i);
  assert.match(schema, /alter\s+table\s+public\.orders\s+enable\s+row\s+level\s+security/i);
  assert.match(schema, /create\s+policy\s+orders_service_role_all/i);
});

test('demo setup is marked demo-only and avoids external placeholder images', () => {
  const demoSetup = fs.readFileSync(path.join(rootDir, 'database', 'sugar_glaze_full_setup.sql'), 'utf8');

  assert.match(demoSetup, /DEMO ONLY/i);
  assert.doesNotMatch(demoSetup, /placehold\.co/i);
});
