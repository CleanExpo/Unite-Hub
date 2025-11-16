/**
 * Authentication Test Helpers
 * Utilities for mocking authentication in tests
 */

import { vi } from 'vitest';

export const TEST_USER = {
  id: 'test-user-123',
  email: 'test@unite-hub.com',
  name: 'Test User',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const TEST_PROFILE = {
  id: 'test-profile-123',
  user_id: TEST_USER.id,
  username: 'testuser',
  full_name: 'Test User',
  email: TEST_USER.email,
  bio: 'Test bio',
  phone: '+1234567890',
  avatar_url: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const TEST_ORGANIZATION = {
  id: 'test-org-789',
  org_id: 'test-org-789',
  name: 'Test Organization',
  email: 'org@unite-hub.com',
  plan: 'professional' as const,
  status: 'active' as const,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const TEST_WORKSPACE = {
  id: 'test-workspace-456',
  org_id: TEST_ORGANIZATION.id,
  name: 'Test Workspace',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const TEST_SESSION = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_in: 3600,
  expires_at: Date.now() + 3600000,
  token_type: 'bearer',
  user: TEST_USER,
};

/**
 * Mock authenticated Supabase client
 */
export function mockAuthenticatedSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: TEST_USER },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: TEST_SESSION },
        error: null,
      }),
      signOut: vi.fn().mockResolvedValue({
        error: null,
      }),
    },
    from: vi.fn(),
  };
}

/**
 * Mock unauthenticated Supabase client
 */
export function mockUnauthenticatedSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: { message: 'No active session' },
      }),
    },
    from: vi.fn(),
  };
}

/**
 * Create mock Authorization header
 */
export function createAuthHeader(token: string = TEST_SESSION.access_token): Record<string, string> {
  return {
    'Authorization': `Bearer ${token}`,
  };
}

/**
 * Mock NextAuth session
 */
export function mockNextAuthSession() {
  return {
    user: {
      id: TEST_USER.id,
      email: TEST_USER.email,
      name: TEST_USER.name,
    },
    expires: new Date(Date.now() + 86400000).toISOString(), // 24 hours from now
  };
}

/**
 * Create mock user with custom properties
 */
export function createMockUser(overrides: Partial<typeof TEST_USER> = {}) {
  return {
    ...TEST_USER,
    ...overrides,
  };
}

/**
 * Create mock organization with custom properties
 */
export function createMockOrganization(overrides: Partial<typeof TEST_ORGANIZATION> = {}) {
  return {
    ...TEST_ORGANIZATION,
    ...overrides,
  };
}

/**
 * Create mock workspace with custom properties
 */
export function createMockWorkspace(overrides: Partial<typeof TEST_WORKSPACE> = {}) {
  return {
    ...TEST_WORKSPACE,
    ...overrides,
  };
}
