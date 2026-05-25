function isConfiguredValue(value, placeholderFragments = []) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return false;

  return !placeholderFragments.some(fragment => normalized.includes(fragment));
}

function requireConfiguredEnv(env, name, placeholderFragments = []) {
  const value = String(env[name] ?? '').trim();

  if (!isConfiguredValue(value, placeholderFragments)) {
    throw new Error(`${name} is required. Configure it in .env or Render environment variables.`);
  }

  return value;
}

function resolveSupabaseConfig(env = process.env) {
  return {
    url: requireConfiguredEnv(env, 'SUPABASE_URL', ['your-project-ref']),
    key: requireConfiguredEnv(env, 'SUPABASE_SERVICE_ROLE_KEY', ['your_service_role_key']),
  };
}

module.exports = {
  isConfiguredValue,
  resolveSupabaseConfig,
};
