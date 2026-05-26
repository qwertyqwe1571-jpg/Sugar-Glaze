const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const successHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'success.html'), 'utf8');

test('order success page keeps customers in the storefront flow', () => {
  assert.doesNotMatch(successHtml, /href="\/admin\.html"/);
  assert.doesNotMatch(successHtml, /адмін/i);
});
