const test = require('node:test');
const assert = require('node:assert/strict');

const { createRateLimiter } = require('../lib/rate-limit');

function createResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function runMiddleware(middleware, req) {
  const res = createResponse();
  let nextCalled = false;

  middleware(req, res, () => {
    nextCalled = true;
  });

  return { res, nextCalled };
}

test('allows requests under the configured limit', () => {
  let now = 1000;
  const limiter = createRateLimiter({
    windowMs: 1000,
    max: 2,
    message: 'Ліміт запитів вичерпано.',
    keyGenerator: req => req.key,
    now: () => now,
  });

  assert.equal(runMiddleware(limiter, { key: 'client-a' }).nextCalled, true);
  assert.equal(runMiddleware(limiter, { key: 'client-a' }).nextCalled, true);

  now = 2001;
  assert.equal(runMiddleware(limiter, { key: 'client-a' }).nextCalled, true);
});

test('returns 429 and Retry-After after too many requests', () => {
  const limiter = createRateLimiter({
    windowMs: 5000,
    max: 1,
    message: 'Забагато спроб.',
    keyGenerator: req => req.key,
    now: () => 1000,
  });

  assert.equal(runMiddleware(limiter, { key: 'client-b' }).nextCalled, true);

  const blocked = runMiddleware(limiter, { key: 'client-b' });
  assert.equal(blocked.nextCalled, false);
  assert.equal(blocked.res.statusCode, 429);
  assert.equal(blocked.res.headers['retry-after'], 5);
  assert.deepEqual(blocked.res.body, { error: 'Забагато спроб.' });
});
