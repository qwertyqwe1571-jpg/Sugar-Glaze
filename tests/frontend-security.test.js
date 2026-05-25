const test = require('node:test');
const assert = require('node:assert/strict');

const {
  escapeAttribute,
  escapeHtml,
  normalizeSafeImageUrl,
} = require('../public/security');

test('escapes text content and HTML attributes', () => {
  assert.equal(
    escapeHtml('<img src=x onerror=alert(1)> "cake"'),
    '&lt;img src=x onerror=alert(1)&gt; &quot;cake&quot;'
  );
  assert.equal(
    escapeAttribute(`x" onerror="alert(1)`),
    'x&quot; onerror=&quot;alert(1)'
  );
});

test('allows only safe image URL schemes in browser rendering', () => {
  assert.equal(normalizeSafeImageUrl('https://res.cloudinary.com/demo/image.jpg'), 'https://res.cloudinary.com/demo/image.jpg');
  assert.equal(normalizeSafeImageUrl('/favicon.svg'), '/favicon.svg');
  assert.equal(normalizeSafeImageUrl('data:image/svg+xml;base64,PHN2Zy8+'), 'data:image/svg+xml;base64,PHN2Zy8+');
  assert.equal(normalizeSafeImageUrl('javascript:alert(1)'), '');
  assert.equal(normalizeSafeImageUrl('https://example.com/a.jpg" onerror="alert(1)'), '');
});
