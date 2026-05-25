const test = require('node:test');
const assert = require('node:assert/strict');

const { resolveSupabaseConfig } = require('../lib/supabase-config');

test('requires the server-only Supabase service role key', () => {
  assert.throws(
    () => resolveSupabaseConfig({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_ANON_KEY: 'anon-key',
    }),
    /SUPABASE_SERVICE_ROLE_KEY/
  );
});

test('rejects placeholder service role values', () => {
  assert.throws(
    () => resolveSupabaseConfig({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'your_service_role_key',
    }),
    /SUPABASE_SERVICE_ROLE_KEY/
  );
});

test('returns the Supabase URL and service role key', () => {
  assert.deepEqual(
    resolveSupabaseConfig({
      SUPABASE_URL: 'https://example.supabase.co',
      SUPABASE_SERVICE_ROLE_KEY: 'service-role-key',
      SUPABASE_ANON_KEY: 'anon-key',
    }),
    {
      url: 'https://example.supabase.co',
      key: 'service-role-key',
    }
  );
});
