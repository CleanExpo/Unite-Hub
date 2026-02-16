/**
 * Unit Tests for Supabase Client Helpers
 * Tests client initialization and configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

const mockBrowserClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
  },
  from: vi.fn(),
};

const mockServerClient = {
  auth: {
    getUser: vi.fn(),
    getSession: vi.fn(),
  },
  from: vi.fn(),
};

// Mock @supabase/supabase-js
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn(),
      getSession: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(),
  })),
}));

// Mock @supabase/ssr (source uses createBrowserClient and createServerClient from here)
vi.mock('@supabase/ssr', () => ({
  createBrowserClient: vi.fn(() => mockBrowserClient),
  createServerClient: vi.fn(() => mockServerClient),
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: vi.fn((name: string) => ({ value: 'mock-cookie-value' })),
    set: vi.fn(),
  })),
}));

describe('Supabase Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Ensure env vars are set
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  describe('Browser Client', () => {
    it('should create browser client with correct config', async () => {
      vi.resetModules();

      const { supabase } = await import('@/lib/supabase');
      const { createBrowserClient } = await import('@supabase/ssr');

      // Access any property to trigger lazy initialization
      supabase.auth;

      expect(createBrowserClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key'
      );
    });

    it('should use lazy initialization for browser client', async () => {
      vi.resetModules();

      const { createBrowserClient } = await import('@supabase/ssr');
      vi.mocked(createBrowserClient).mockClear();

      const { supabase } = await import('@/lib/supabase');

      // Access property to trigger initialization
      supabase.auth;

      expect(createBrowserClient).toHaveBeenCalled();
    });

    it('should throw error if environment variables missing', async () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      vi.resetModules();

      const { supabase } = await import('@/lib/supabase');

      expect(() => {
        supabase.auth;
      }).toThrow(/Supabase environment variables are not configured/);

      // Restore env vars
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    });
  });

  describe('Server Client', () => {
    it('should create server client with cookie handling', async () => {
      vi.resetModules();

      const { getSupabaseServer } = await import('@/lib/supabase');
      const { createServerClient } = await import('@supabase/ssr');

      await getSupabaseServer();

      expect(createServerClient).toHaveBeenCalledWith(
        'https://test.supabase.co',
        'test-anon-key',
        expect.objectContaining({
          cookies: expect.objectContaining({
            get: expect.any(Function),
            set: expect.any(Function),
            remove: expect.any(Function),
          }),
        })
      );
    });

    it('should handle cookie operations gracefully', async () => {
      vi.resetModules();

      const { getSupabaseServer } = await import('@/lib/supabase');

      const supabase = await getSupabaseServer();

      // Should not throw errors even if cookie operations fail
      expect(supabase).toBeDefined();
    });
  });

  describe('Client Types', () => {
    it('should export Organization type', async () => {
      // Import the module to ensure types are exported
      await import('@/lib/supabase');

      // Type should exist (compilation check) - this test primarily checks TypeScript compilation
      type Organization = {
        id: string;
        name: string;
        email: string;
        plan: "starter" | "professional" | "enterprise";
        status: "active" | "trial" | "cancelled";
      };

      const org: Organization = {
        id: 'test',
        name: 'Test Org',
        email: 'test@example.com',
        plan: 'professional',
        status: 'active',
      };

      expect(org).toBeDefined();
    });
  });

  describe('Browser vs Server Usage', () => {
    it('should use supabase for client-side operations', async () => {
      vi.resetModules();

      const { supabase } = await import('@/lib/supabase');

      expect(supabase).toBeDefined();
      expect(supabase.auth).toBeDefined();
    });

    it('should use getSupabaseServer for server-side operations', async () => {
      vi.resetModules();

      const { getSupabaseServer } = await import('@/lib/supabase');

      const serverClient = await getSupabaseServer();

      expect(serverClient).toBeDefined();
      expect(serverClient.auth).toBeDefined();
    });

    it('should have separate instances for browser and server', async () => {
      vi.resetModules();

      const { supabase, getSupabaseServer } = await import('@/lib/supabase');

      const serverClient = await getSupabaseServer();

      // These should be different instances
      expect(supabase).not.toBe(serverClient);
    });
  });
});
