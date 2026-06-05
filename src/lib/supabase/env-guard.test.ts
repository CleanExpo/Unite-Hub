import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { requireSupabaseEnv, getSupabaseAnonConfig, getSupabaseUrl } from './env-guard';

// A representative real-shaped anon key (>200 chars). Not a live secret.
const FAKE_VALID_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.' +
  'eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4YW1wbGUiLCJyb2xlIjoiYW5vbiIsImlhdCI6MSwiZXhwIjoyfQ.' +
  'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

describe('requireSupabaseEnv', () => {
  it('returns the trimmed value when a valid key is present', () => {
    expect(requireSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', `  ${FAKE_VALID_KEY}  `)).toBe(
      FAKE_VALID_KEY,
    );
  });

  it('throws a clear, named error when the var is undefined', () => {
    expect(() => requireSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', undefined)).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime/,
    );
  });

  it('throws when the var is an empty / whitespace string', () => {
    expect(() => requireSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '   ')).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime/,
    );
  });

  it('throws when the value contains a truncation placeholder ("...")', () => {
    expect(() =>
      requireSupabaseEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'eyJhbGciOiJ...'),
    ).toThrow(/looks truncated\/placeholder/);
  });

  it('throws when the value is shorter than the minimum key length', () => {
    expect(() => requireSupabaseEnv('SUPABASE_SERVICE_ROLE_KEY', 'short-key')).toThrow(
      /looks truncated\/placeholder/,
    );
  });

  it('error message names the missing variable so it is actionable', () => {
    expect(() => requireSupabaseEnv('SUPABASE_SERVICE_ROLE_KEY', undefined)).toThrow(
      /SUPABASE_SERVICE_ROLE_KEY/,
    );
  });
});

describe('getSupabaseAnonConfig / getSupabaseUrl', () => {
  const ORIGINAL = { ...process.env };

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL };
  });

  it('getSupabaseAnonConfig throws when the anon key is missing', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    expect(() => getSupabaseAnonConfig()).toThrow(
      /Missing NEXT_PUBLIC_SUPABASE_ANON_KEY at runtime/,
    );
  });

  it('getSupabaseAnonConfig returns url + anonKey when both are valid', () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = FAKE_VALID_KEY;
    expect(getSupabaseAnonConfig()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: FAKE_VALID_KEY,
    });
  });

  it('getSupabaseUrl throws when the URL is missing', () => {
    expect(() => getSupabaseUrl()).toThrow(/Missing NEXT_PUBLIC_SUPABASE_URL at runtime/);
  });

  it('validates a service-role key value via requireSupabaseEnv (truncated → throws)', () => {
    // The actual service.ts reads process.env.SUPABASE_SERVICE_ROLE_KEY (under its
    // lint allowlist) then passes the value here; we assert the validation path.
    expect(() => requireSupabaseEnv('SUPABASE_SERVICE_ROLE_KEY', 'eyJ...')).toThrow(
      /looks truncated\/placeholder/,
    );
  });
});
