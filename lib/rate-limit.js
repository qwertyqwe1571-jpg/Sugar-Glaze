function normalizeRateLimitKeyPart(value) {
  return String(value ?? '').trim().toLowerCase() || 'unknown';
}

function getClientIp(req) {
  const forwardedFor = req.headers?.['x-forwarded-for'];
  if (forwardedFor) {
    return String(forwardedFor).split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createRateLimiter({
  windowMs,
  max,
  message,
  keyGenerator = getClientIp,
  now = Date.now,
  store = new Map(),
}) {
  if (!Number.isFinite(windowMs) || windowMs <= 0) {
    throw new Error('windowMs must be a positive number.');
  }

  if (!Number.isInteger(max) || max <= 0) {
    throw new Error('max must be a positive integer.');
  }

  return function rateLimitMiddleware(req, res, next) {
    const currentTime = now();

    for (const [key, record] of store.entries()) {
      if (!record || record.resetAt <= currentTime) {
        store.delete(key);
      }
    }

    const key = normalizeRateLimitKeyPart(keyGenerator(req));
    let record = store.get(key);

    if (!record) {
      record = {
        count: 0,
        resetAt: currentTime + windowMs,
      };
      store.set(key, record);
    }

    record.count += 1;

    if (record.count > max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((record.resetAt - currentTime) / 1000));
      res.setHeader('Retry-After', retryAfterSeconds);
      return res.status(429).json({ error: message });
    }

    return next();
  };
}

module.exports = {
  createRateLimiter,
  getClientIp,
  normalizeRateLimitKeyPart,
};
