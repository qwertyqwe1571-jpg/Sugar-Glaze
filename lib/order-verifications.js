const crypto = require('crypto');

const ORDER_VERIFICATION_TTL_MS = 1000 * 60 * 3;
const ORDER_VERIFICATION_MAX_ATTEMPTS = 5;
const ORDER_VERIFICATION_HASH_BYTES = 80;

function createOrderVerificationId() {
  return crypto.randomBytes(24).toString('hex');
}

function generateOrderVerificationCode() {
  return crypto.randomInt(100000, 1000000).toString();
}

function hashOrderVerificationCode(code, salt = crypto.randomBytes(32).toString('hex')) {
  const hash = crypto.scryptSync(code, salt, ORDER_VERIFICATION_HASH_BYTES).toString('hex');
  return { salt, hash };
}

function verifyOrderVerificationCode(code, salt, expectedHash) {
  if (!code || !salt || !expectedHash) return false;

  try {
    const hash = crypto.scryptSync(code, salt, ORDER_VERIFICATION_HASH_BYTES).toString('hex');
    const actualBuffer = Buffer.from(hash, 'hex');
    const expectedBuffer = Buffer.from(expectedHash, 'hex');

    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }

    return crypto.timingSafeEqual(actualBuffer, expectedBuffer);
  } catch {
    return false;
  }
}

function buildOrderVerificationInsert({
  verificationId,
  verificationCode,
  userId,
  draft,
  now = Date.now,
  ttlMs = ORDER_VERIFICATION_TTL_MS,
}) {
  const { salt, hash } = hashOrderVerificationCode(verificationCode);

  return {
    verification_id: verificationId,
    user_id: userId,
    draft,
    code_salt: salt,
    code_hash: hash,
    attempts: 0,
    expires_at: new Date(now() + ttlMs).toISOString(),
  };
}

function parseDraftField(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function normalizeOrderVerificationRow(row) {
  if (!row) return null;

  return {
    userId: Number(row.user_id),
    draft: parseDraftField(row.draft),
    salt: row.code_salt,
    hash: row.code_hash,
    expiresAt: new Date(row.expires_at).getTime(),
    attempts: Number(row.attempts || 0),
  };
}

async function cleanupExpiredOrderVerifications(supabase, now = Date.now) {
  const { error } = await supabase
    .from('order_verifications')
    .delete()
    .lte('expires_at', new Date(now()).toISOString());

  if (error) {
    console.warn('Order verification cleanup:', error.message);
  }
}

async function storePendingOrderVerification(supabase, {
  verificationId,
  verificationCode,
  userId,
  draft,
}) {
  await cleanupExpiredOrderVerifications(supabase);

  const row = buildOrderVerificationInsert({
    verificationId,
    verificationCode,
    userId,
    draft,
  });

  const { error } = await supabase
    .from('order_verifications')
    .upsert([row], { onConflict: 'verification_id' });

  if (error) throw error;

  return new Date(row.expires_at).getTime();
}

async function getPendingOrderVerification(supabase, verificationId, now = Date.now) {
  const { data, error } = await supabase
    .from('order_verifications')
    .select('verification_id, user_id, draft, code_salt, code_hash, attempts, expires_at')
    .eq('verification_id', verificationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  if (new Date(data.expires_at).getTime() <= now()) {
    await clearPendingOrderVerification(supabase, verificationId);
    return null;
  }

  return normalizeOrderVerificationRow(data);
}

async function updatePendingOrderVerificationAttempts(supabase, verificationId, attempts) {
  const { error } = await supabase
    .from('order_verifications')
    .update({ attempts })
    .eq('verification_id', verificationId);

  if (error) throw error;
}

async function clearPendingOrderVerification(supabase, verificationId) {
  if (!verificationId) return;

  const { error } = await supabase
    .from('order_verifications')
    .delete()
    .eq('verification_id', verificationId);

  if (error) throw error;
}

module.exports = {
  ORDER_VERIFICATION_TTL_MS,
  ORDER_VERIFICATION_MAX_ATTEMPTS,
  ORDER_VERIFICATION_HASH_BYTES,
  buildOrderVerificationInsert,
  cleanupExpiredOrderVerifications,
  clearPendingOrderVerification,
  createOrderVerificationId,
  generateOrderVerificationCode,
  getPendingOrderVerification,
  hashOrderVerificationCode,
  storePendingOrderVerification,
  updatePendingOrderVerificationAttempts,
  verifyOrderVerificationCode,
};
