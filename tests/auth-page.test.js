const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');

const authHtml = fs.readFileSync(path.join(__dirname, '..', 'public', 'auth.html'), 'utf8');
const authJs = fs.readFileSync(path.join(__dirname, '..', 'public', 'auth.js'), 'utf8');

test('auth page leaves validation to the server', () => {
  assert.doesNotMatch(authHtml, /\srequired(?:\s|>|\/)/);
  assert.match(authHtml, /<form id="loginForm" novalidate>/);
  assert.match(authHtml, /<form id="registerForm" novalidate>/);
});

test('auth page renders server validation errors by field', () => {
  assert.match(authJs, /validationFields = \{/);
  assert.match(authJs, /setAttribute\('aria-invalid', 'true'\)/);
  assert.match(authJs, /showMessage\(errors\.map\(item => item\.message\), 'error'\)/);
});
