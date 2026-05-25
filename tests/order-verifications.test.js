const test = require('node:test');
const assert = require('node:assert/strict');

const {
  ORDER_VERIFICATION_HASH_BYTES,
  buildOrderVerificationInsert,
  hashOrderVerificationCode,
  verifyOrderVerificationCode,
} = require('../lib/order-verifications');

test('hashes verification codes without storing the raw code', () => {
  const { salt, hash } = hashOrderVerificationCode('123456', 'known-salt');

  assert.equal(salt, 'known-salt');
  assert.equal(hash.length, ORDER_VERIFICATION_HASH_BYTES * 2);
  assert.equal(verifyOrderVerificationCode('123456', salt, hash), true);
  assert.equal(verifyOrderVerificationCode('000000', salt, hash), false);
});

test('builds a persistent verification row with json draft and expiry', () => {
  const row = buildOrderVerificationInsert({
    verificationId: 'verification-id',
    verificationCode: '654321',
    userId: 42,
    draft: {
      orderId: 'SG-1',
      verifiedItems: [{ id: 1, qty: 2 }],
    },
    now: () => 1_700_000_000_000,
    ttlMs: 180_000,
  });

  assert.equal(row.verification_id, 'verification-id');
  assert.equal(row.user_id, 42);
  assert.deepEqual(row.draft, {
    orderId: 'SG-1',
    verifiedItems: [{ id: 1, qty: 2 }],
  });
  assert.equal(row.attempts, 0);
  assert.equal(row.expires_at, '2023-11-14T22:16:20.000Z');
  assert.equal(Object.hasOwn(row, 'verificationCode'), false);
  assert.equal(Object.hasOwn(row, 'code'), false);
  assert.equal(verifyOrderVerificationCode('654321', row.code_salt, row.code_hash), true);
});
