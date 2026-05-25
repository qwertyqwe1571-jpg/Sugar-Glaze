const test = require('node:test');
const assert = require('node:assert/strict');

const {
  createSupabaseServiceHealthRequester,
  createSupabaseWakeHandler,
  createSupabaseRestoreRequester,
  extractSupabaseProjectRef,
  isSupabaseUnavailableError,
} = require('../lib/supabase-wake');

function createResponse() {
  return {
    statusCode: 200,
    body: null,
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

test('Supabase wake handler sends a lightweight database query', async () => {
  const calls = [];
  const supabase = {
    from(table) {
      calls.push(['from', table]);
      return {
        select(columns) {
          calls.push(['select', columns]);
          return {
            limit(count) {
              calls.push(['limit', count]);
              return Promise.resolve({ data: [{ id: 1 }], error: null });
            },
          };
        },
      };
    },
  };
  const handler = createSupabaseWakeHandler({ supabase, timeoutMs: 1000 });
  const res = createResponse();

  await handler({}, res);

  assert.deepEqual(calls, [
    ['from', 'sweets'],
    ['select', 'id'],
    ['limit', 1],
  ]);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ok: true });
});

test('Supabase wake handler reports temporary unavailability', async () => {
  const supabase = {
    from() {
      return {
        select() {
          return {
            limit() {
              return Promise.resolve({ data: null, error: new Error('paused') });
            },
          };
        },
      };
    },
  };
  const handler = createSupabaseWakeHandler({ supabase, timeoutMs: 1000 });
  const res = createResponse();

  await handler({}, res);

  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.body, {
    ok: false,
    waking: true,
    error: 'Supabase is waking up. Try again shortly.',
  });
});

test('Supabase wake handler requests platform restore when configured', async () => {
  let restoreCalls = 0;
  const supabase = {
    from() {
      return {
        select() {
          return {
            limit() {
              return Promise.resolve({ data: null, error: new Error('Project is paused') });
            },
          };
        },
      };
    },
  };
  const handler = createSupabaseWakeHandler({
    supabase,
    timeoutMs: 1000,
    restoreProject: async () => {
      restoreCalls += 1;
      return { configured: true, requested: true, ok: true, status: 200 };
    },
  });
  const res = createResponse();

  await handler({}, res);

  assert.equal(restoreCalls, 1);
  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.body.restore, {
    configured: true,
    requested: true,
    status: 200,
  });
});

test('Supabase wake handler includes Management API service health', async () => {
  const supabase = {
    from() {
      return {
        select() {
          return {
            limit() {
              return Promise.resolve({ data: null, error: new Error('Project is paused') });
            },
          };
        },
      };
    },
  };
  const handler = createSupabaseWakeHandler({
    supabase,
    timeoutMs: 1000,
    getServiceHealth: async () => ({
      configured: true,
      services: [
        { key: 'db', label: 'Database', status: 'ACTIVE_HEALTHY', state: 'healthy' },
        { key: 'rest', label: 'PostgREST', status: 'COMING_UP', state: 'starting' },
      ],
    }),
  });
  const res = createResponse();

  await handler({}, res);

  assert.equal(res.statusCode, 202);
  assert.deepEqual(res.body.services, [
    { key: 'db', label: 'Database', status: 'ACTIVE_HEALTHY', state: 'healthy' },
    { key: 'rest', label: 'PostgREST', status: 'COMING_UP', state: 'starting' },
  ]);
});

test('Supabase service health requester calls Management API health endpoint', async () => {
  const calls = [];
  const getServiceHealth = createSupabaseServiceHealthRequester({
    supabaseUrl: 'https://abc123.supabase.co',
    accessToken: 'sbp_test_token',
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      return {
        ok: true,
        status: 200,
        json: async () => ([
          { name: 'db', healthy: true, status: 'ACTIVE_HEALTHY' },
          { name: 'rest', healthy: false, status: 'COMING_UP' },
          { name: 'auth', healthy: false, status: 'UNHEALTHY', error: 'booting' },
        ]),
      };
    },
  });

  const result = await getServiceHealth();

  assert.equal(calls.length, 1);
  assert.match(calls[0][0], /^https:\/\/api\.supabase\.com\/v1\/projects\/abc123\/health\?/);
  assert.match(calls[0][0], /services=db/);
  assert.match(calls[0][0], /services=rest/);
  assert.equal(calls[0][1].headers.Authorization, 'Bearer sbp_test_token');
  assert.deepEqual(result.services, [
    { key: 'db', label: 'Database', status: 'ACTIVE_HEALTHY', state: 'healthy' },
    { key: 'rest', label: 'PostgREST', status: 'COMING_UP', state: 'starting' },
    { key: 'auth', label: 'Auth', status: 'UNHEALTHY', state: 'unhealthy', detail: 'booting' },
  ]);
});

test('Supabase restore requester calls Management API restore endpoint', async () => {
  const calls = [];
  const restoreProject = createSupabaseRestoreRequester({
    supabaseUrl: 'https://abc123.supabase.co',
    accessToken: 'sbp_test_token',
    fetchImpl: async (url, options) => {
      calls.push([url, options]);
      return { ok: true, status: 200 };
    },
    now: () => 1000,
  });

  const result = await restoreProject();

  assert.deepEqual(result, {
    configured: true,
    requested: true,
    ok: true,
    status: 200,
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0][0], 'https://api.supabase.com/v1/projects/abc123/restore');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer sbp_test_token');
});

test('Supabase restore requester stays inactive without a Management token', async () => {
  const restoreProject = createSupabaseRestoreRequester({
    supabaseUrl: 'https://abc123.supabase.co',
    accessToken: '',
  });

  const result = await restoreProject();

  assert.deepEqual(result, {
    configured: false,
    requested: false,
  });
});

test('Supabase helper detects paused or unreachable project errors', () => {
  assert.equal(isSupabaseUnavailableError(new Error('TypeError: fetch failed')), true);
  assert.equal(isSupabaseUnavailableError(new Error('Project is paused')), true);
  assert.equal(isSupabaseUnavailableError({ message: 'syntax error at or near "from"' }), false);
});

test('Supabase project ref can be extracted from project URL', () => {
  assert.equal(extractSupabaseProjectRef('https://abc123.supabase.co'), 'abc123');
  assert.equal(extractSupabaseProjectRef('not a url'), '');
});
