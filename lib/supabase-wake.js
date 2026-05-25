const WAKE_ERROR_MESSAGE = 'Supabase is waking up. Try again shortly.';
const DEFAULT_HEALTH_SERVICES = ['db', 'rest', 'auth', 'realtime', 'storage', 'pooler'];
const SERVICE_LABELS = {
  auth: 'Auth',
  db: 'Database',
  db_postgres_user: 'Postgres user',
  pg_bouncer: 'PgBouncer',
  pooler: 'Pooler',
  realtime: 'Realtime',
  rest: 'PostgREST',
  storage: 'Storage',
};

function hasConfiguredValue(value, placeholderFragments = []) {
  const normalized = String(value ?? '').trim();
  if (!normalized) return false;

  return !placeholderFragments.some(fragment => normalized.includes(fragment));
}

function extractSupabaseProjectRef(supabaseUrl) {
  try {
    const { hostname } = new URL(String(supabaseUrl ?? '').trim());
    const [projectRef, domain] = hostname.split('.');

    if (!projectRef || domain !== 'supabase') {
      return '';
    }

    return projectRef;
  } catch {
    return '';
  }
}

function isSupabaseUnavailableError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  const code = String(error?.code || '').toLowerCase();

  return [
    'fetch failed',
    'failed to fetch',
    'service unavailable',
    'temporarily unavailable',
    'project is paused',
    'project paused',
    'paused',
    'econnreset',
    'etimedout',
  ].some(fragment => message.includes(fragment)) || ['503', 'pgrst000'].includes(code);
}

function normalizeServiceState(status, healthy) {
  if (status === 'ACTIVE_HEALTHY' || healthy === true) {
    return 'healthy';
  }

  if (status === 'COMING_UP') {
    return 'starting';
  }

  if (status === 'UNHEALTHY' || healthy === false) {
    return 'unhealthy';
  }

  return 'unknown';
}

function normalizeSupabaseServiceHealth(records = []) {
  if (!Array.isArray(records)) return [];

  return records
    .filter(record => record?.name)
    .map(record => ({
      key: String(record.name),
      label: SERVICE_LABELS[record.name] || String(record.name),
      status: String(record.status || (record.healthy ? 'ACTIVE_HEALTHY' : 'UNHEALTHY')),
      state: normalizeServiceState(record.status, record.healthy),
      ...(record.error ? { detail: String(record.error) } : {}),
    }));
}

function createSupabaseServiceHealthRequester({
  supabaseUrl,
  projectRef,
  accessToken,
  fetchImpl = globalThis.fetch,
  services = DEFAULT_HEALTH_SERVICES,
} = {}) {
  const resolvedProjectRef = String(projectRef || extractSupabaseProjectRef(supabaseUrl)).trim();
  const resolvedAccessToken = String(accessToken ?? '').trim();
  const configured = hasConfiguredValue(resolvedProjectRef, ['your_project_ref', 'your-project-ref']) &&
    hasConfiguredValue(resolvedAccessToken, ['your_management_api_token']);

  return async function getSupabaseServiceHealth() {
    if (!configured || typeof fetchImpl !== 'function') {
      return { configured: false, services: [] };
    }

    const params = new URLSearchParams();
    for (const service of services) {
      params.append('services', service);
    }

    try {
      const response = await fetchImpl(
        `https://api.supabase.com/v1/projects/${encodeURIComponent(resolvedProjectRef)}/health?${params.toString()}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${resolvedAccessToken}`,
          },
        }
      );

      if (!response.ok) {
        return {
          configured: true,
          services: [],
          error: `Management API health returned ${response.status}`,
        };
      }

      const payload = await response.json();

      return {
        configured: true,
        services: normalizeSupabaseServiceHealth(payload),
      };
    } catch (error) {
      return {
        configured: true,
        services: [],
        error: error?.message || 'Management API health request failed',
      };
    }
  };
}

function createSupabaseRestoreRequester({
  supabaseUrl,
  projectRef,
  accessToken,
  fetchImpl = globalThis.fetch,
  cooldownMs = 60_000,
  now = Date.now,
} = {}) {
  const resolvedProjectRef = String(projectRef || extractSupabaseProjectRef(supabaseUrl)).trim();
  const resolvedAccessToken = String(accessToken ?? '').trim();
  const configured = hasConfiguredValue(resolvedProjectRef, ['your_project_ref', 'your-project-ref']) &&
    hasConfiguredValue(resolvedAccessToken, ['your_management_api_token']);
  let lastRestoreAt = 0;
  let inFlight = null;

  return async function requestSupabaseRestore() {
    if (!configured || typeof fetchImpl !== 'function') {
      return { configured: false, requested: false };
    }

    if (inFlight) {
      return { configured: true, requested: true, inFlight: true };
    }

    const currentTime = now();
    if (lastRestoreAt && currentTime - lastRestoreAt < cooldownMs) {
      return { configured: true, requested: false, throttled: true };
    }

    lastRestoreAt = currentTime;
    inFlight = fetchImpl(
      `https://api.supabase.com/v1/projects/${encodeURIComponent(resolvedProjectRef)}/restore`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resolvedAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )
      .then(response => ({
        configured: true,
        requested: true,
        ok: Boolean(response.ok),
        status: response.status,
      }))
      .catch(() => ({
        configured: true,
        requested: true,
        ok: false,
        status: 0,
      }))
      .finally(() => {
        inFlight = null;
      });

    return inFlight;
  };
}

function buildWakePayload(restoreResult, serviceHealthResult) {
  const payload = {
    ok: false,
    waking: true,
    error: WAKE_ERROR_MESSAGE,
  };

  if (serviceHealthResult) {
    payload.service_health_configured = Boolean(serviceHealthResult.configured);

    if (Array.isArray(serviceHealthResult.services) && serviceHealthResult.services.length > 0) {
      payload.services = serviceHealthResult.services;
    }

    if (serviceHealthResult.error) {
      payload.service_health_error = String(serviceHealthResult.error);
    }
  }

  if (restoreResult) {
    payload.restore = {
      configured: Boolean(restoreResult.configured),
      requested: Boolean(restoreResult.requested),
    };

    if (typeof restoreResult.status === 'number') {
      payload.restore.status = restoreResult.status;
    }

    if (restoreResult.inFlight) {
      payload.restore.inFlight = true;
    }

    if (restoreResult.throttled) {
      payload.restore.throttled = true;
    }

    if (!restoreResult.configured) {
      payload.manual_restore_required = true;
    }
  }

  return payload;
}

async function sendSupabaseWakeResponse(res, { restoreProject, getServiceHealth } = {}) {
  let restoreResult = null;
  let serviceHealthResult = null;

  if (typeof restoreProject === 'function') {
    restoreResult = await restoreProject();
  }

  if (typeof getServiceHealth === 'function') {
    serviceHealthResult = await getServiceHealth();
  }

  if (typeof res.set === 'function') {
    res.set('Retry-After', '5');
  }

  return res.status(202).json(buildWakePayload(restoreResult, serviceHealthResult));
}

function withTimeout(promise, timeoutMs) {
  let timeoutId;

  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('Supabase wake request timed out.'));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => {
    clearTimeout(timeoutId);
  });
}

function createSupabaseWakeHandler({ supabase, timeoutMs = 8000, restoreProject, getServiceHealth }) {
  return async function supabaseWakeHandler(req, res) {
    try {
      const { error } = await withTimeout(
        supabase
          .from('sweets')
          .select('id')
          .limit(1),
        timeoutMs
      );

      if (error) {
        throw error;
      }

      res.json({ ok: true });
    } catch {
      return sendSupabaseWakeResponse(res, { restoreProject, getServiceHealth });
    }
  };
}

module.exports = {
  createSupabaseServiceHealthRequester,
  createSupabaseRestoreRequester,
  createSupabaseWakeHandler,
  extractSupabaseProjectRef,
  isSupabaseUnavailableError,
  normalizeSupabaseServiceHealth,
  sendSupabaseWakeResponse,
  withTimeout,
};
