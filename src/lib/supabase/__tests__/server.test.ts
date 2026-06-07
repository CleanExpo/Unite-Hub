import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

import { createServerClient } from '@supabase/ssr';
import { getSession, getUser, getUserWithRole } from '../server';

describe('supabase server helpers', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
  });

  it('returns null user when Supabase config is missing', async () => {
    await expect(getUser()).resolves.toBeNull();
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it('returns null session when Supabase config is missing', async () => {
    await expect(getSession()).resolves.toBeNull();
    expect(createServerClient).not.toHaveBeenCalled();
  });

  it('returns null user-with-role when Supabase config is missing', async () => {
    await expect(getUserWithRole()).resolves.toBeNull();
    expect(createServerClient).not.toHaveBeenCalled();
  });
});
