import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn((url: string) => {
    throw new Error(`REDIRECT:${url}`);
  }),
}));

vi.mock('../../lib/supabase/server', () => ({
  getUser: vi.fn(),
}));

import { redirect } from 'next/navigation';
import { getUser } from '../../lib/supabase/server';
import RootPage from '../page';

describe('root page redirect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('redirects unauthenticated users to /auth/login', async () => {
    vi.mocked(getUser).mockResolvedValue(null);

    await expect(RootPage()).rejects.toThrow('REDIRECT:/auth/login');
    expect(redirect).toHaveBeenCalledWith('/auth/login');
  });

  it('redirects authenticated users to the founder dashboard', async () => {
    vi.mocked(getUser).mockResolvedValue({ id: 'founder-123' } as any);

    await expect(RootPage()).rejects.toThrow('REDIRECT:/founder/dashboard');
    expect(redirect).toHaveBeenCalledWith('/founder/dashboard');
  });
});
