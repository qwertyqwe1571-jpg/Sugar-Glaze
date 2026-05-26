const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.join(__dirname, '..');

function readProjectFile(...parts) {
  return fs.readFileSync(path.join(rootDir, ...parts), 'utf8');
}

test('cart keeps product images and renders thumbnails', () => {
  const script = readProjectFile('public', 'script.js');

  assert.match(script, /function addToCart\(id, name, price, imageUrl = ''\)/);
  assert.match(script, /cart\.push\(\{ id, name, price, imageUrl: safeImageUrl, qty: 1 \}\)/);
  assert.match(script, /String\(product\.image_url \|\| ''\)/);
  assert.match(script, /class="cart-item-img"/);
  assert.match(script, /class="cart-item-placeholder"/);
});

test('cart item list scrolls independently from cart panel', () => {
  const styles = readProjectFile('public', 'style.scss');

  assert.match(styles, /\.cart-panel\s*\{[\s\S]*overflow: hidden;/);
  assert.match(styles, /\.cart-items\s*\{[\s\S]*min-height: 0;[\s\S]*overflow-y: auto;/);
  assert.match(styles, /\.cart-header,\s*\n\.cart-footer\s*\{[\s\S]*flex-shrink: 0;/);
  assert.match(styles, /\.cart-item-media/);
});
