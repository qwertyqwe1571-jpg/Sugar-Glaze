const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildCorsOptions,
  securityHeaders,
} = require('../lib/http-security');

test('security headers include CSP and browser hardening headers', () => {
  assert.equal(securityHeaders['X-Content-Type-Options'], 'nosniff');
  assert.equal(securityHeaders['X-Frame-Options'], 'DENY');
  assert.match(securityHeaders['Content-Security-Policy'], /default-src 'self'/);
  assert.match(securityHeaders['Content-Security-Policy'], /script-src 'self'/);
  assert.doesNotMatch(securityHeaders['Content-Security-Policy'], /script-src[^;]*unsafe-inline/);
});

test('CORS allows same-origin/no-origin and configured app origins only', () => {
  const corsOptions = buildCorsOptions({
    APP_URL: 'https://sugar-glaze.onrender.com',
    CORS_ORIGIN: 'https://admin.example.com, https://preview.example.com',
  });

  assert.doesNotThrow(() => corsOptions.origin(undefined, err => { if (err) throw err; }));
  assert.doesNotThrow(() => corsOptions.origin('https://sugar-glaze.onrender.com', err => { if (err) throw err; }));
  assert.doesNotThrow(() => corsOptions.origin('https://preview.example.com', err => { if (err) throw err; }));
  assert.throws(
    () => corsOptions.origin('https://attacker.example.com', err => { if (err) throw err; }),
    /CORS/
  );
});
