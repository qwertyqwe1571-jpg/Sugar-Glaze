const securityHeaders = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "connect-src 'self' https://*.supabase.co https://*.supabase.in",
    "font-src 'self' https://fonts.gstatic.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' https: data:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  ].join('; '),
  'Cross-Origin-Resource-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=(), payment=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

function parseAllowedOrigins(env = process.env) {
  return [
    env.APP_URL,
    env.CORS_ORIGIN,
  ]
    .filter(Boolean)
    .flatMap(value => String(value).split(','))
    .map(value => value.trim())
    .filter(Boolean);
}

function buildCorsOptions(env = process.env) {
  const allowedOrigins = new Set(parseAllowedOrigins(env));

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS origin is not allowed.'));
    },
  };
}

function applySecurityHeaders(req, res, next) {
  for (const [name, value] of Object.entries(securityHeaders)) {
    res.setHeader(name, value);
  }

  next();
}

module.exports = {
  applySecurityHeaders,
  buildCorsOptions,
  parseAllowedOrigins,
  securityHeaders,
};
