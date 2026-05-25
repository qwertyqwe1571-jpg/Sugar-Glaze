const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');

function readProjectFile(...parts) {
  return fs.readFileSync(path.join(rootDir, ...parts), 'utf8');
}

test('storefront contains an accessible Supabase wake modal', () => {
  const html = readProjectFile('public', 'index.html');

  assert.match(html, /id="supabaseWakeModal"/);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-modal="true"/);
  assert.match(html, /id="supabaseWakeTitle"/);
  assert.match(html, /id="supabaseWakeText"/);
  assert.match(html, /id="supabaseWakeStatus"/);
  assert.match(html, /id="supabaseWakeServices"/);
});

test('storefront controls Supabase wake modal during database startup', () => {
  const script = readProjectFile('public', 'script.js');

  assert.match(script, /SUPABASE_WAKE_MODAL_DELAY_MS/);
  assert.match(script, /SUPABASE_WAKE_STATUS_REFRESH_MS\s*=\s*12000/);
  assert.match(script, /function scheduleSupabaseWakeModal/);
  assert.match(script, /function clearSupabaseWakeModalDelay/);
  assert.match(script, /function showSupabaseWakeModal/);
  assert.match(script, /function updateSupabaseWakeModal/);
  assert.match(script, /function renderSupabaseServiceStatus/);
  assert.match(script, /function hideSupabaseWakeModal/);
  assert.match(script, /scheduleSupabaseWakeModal\(/);
  assert.match(script, /hideSupabaseWakeModal\(\)/);
  assert.match(script, /status\.services/);
  assert.match(script, /wait\(SUPABASE_WAKE_STATUS_REFRESH_MS\)/);
  assert.match(script, /supabase-wake-modal--visible/);
  assert.doesNotMatch(script, /Спроба/);
  assert.doesNotMatch(script, /attempt =/);
  assert.doesNotMatch(script, /SUPABASE_WAKE_MAX_ATTEMPTS/);
  assert.doesNotMatch(script, /SUPABASE_WAKE_DELAY_MS/);
});

test('storefront styles the Supabase wake modal overlay', () => {
  const styles = readProjectFile('public', 'style.scss');

  assert.match(styles, /\.supabase-wake-modal/);
  assert.match(styles, /\.supabase-wake-modal--visible/);
  assert.match(styles, /\.supabase-wake-modal__panel/);
  assert.match(styles, /\.supabase-wake-services/);
  assert.match(styles, /\.supabase-wake-service\[data-state='healthy'\]/);
  assert.match(styles, /\.supabase-wake-service\[data-state='starting'\]/);
  assert.match(styles, /\.supabase-wake-modal--visible \.supabase-wake-modal__panel/);
  assert.match(styles, /\.supabase-wake-modal__progress-bar/);
  assert.match(styles, /transform:/);
  assert.match(styles, /opacity \$transition, transform \$transition/);
});
