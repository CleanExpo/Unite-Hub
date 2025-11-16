/**
 * Test Utilities - React Context Providers
 *
 * Provides wrapper components for testing React components that depend on context.
 * Use these helpers to avoid mock timing issues with Vitest.
 */

import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { AuthContext } from '@/contexts/AuthContext';

// Default mock auth values
const defaultAuthValue = {
  session: {
    access_token: 'test-token-123',
    refresh_token: 'test-refresh-token',
    expires_at: Date.now() + 3600000,
    user: {
      id: 'test-user-123',
      email: 'test@example.com',
      aud: 'authenticated',
      role: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  user: {
    id: 'test-user-123',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  profile: {
    id: 'test-profile-123',
    user_id: 'test-user-123',
    username: 'testuser',
    full_name: 'Test User',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  currentOrganization: {
    id: 'test-org-123',
    org_id: 'test-org-123',
    name: 'Test Organization',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  organizations: [
    {
      id: 'test-org-123',
      org_id: 'test-org-123',
      name: 'Test Organization',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ],
  loading: false,
  signOut: async () => {},
  setCurrentOrganization: () => {},
  refreshProfile: async () => {},
};

export type MockAuthValue = typeof defaultAuthValue;

interface AuthProviderProps {
  children: React.ReactNode;
  value?: Partial<MockAuthValue>;
}

/**
 * AuthProvider wrapper for tests
 *
 * @example
 * ```tsx
 * render(
 *   <TestAuthProvider value={{ loading: true }}>
 *     <MyComponent />
 *   </TestAuthProvider>
 * )
 * ```
 */
export function TestAuthProvider({ children, value = {} }: AuthProviderProps) {
  const authValue = { ...defaultAuthValue, ...value };

  return (
    <AuthContext.Provider value={authValue as any}>
      {children}
    </AuthContext.Provider>
  );
}

interface RenderWithAuthOptions extends Omit<RenderOptions, 'wrapper'> {
  authValue?: Partial<MockAuthValue>;
}

/**
 * Render component with AuthContext provider
 *
 * @example
 * ```tsx
 * const { getByText } = renderWithAuth(
 *   <MyComponent />,
 *   { authValue: { loading: true } }
 * )
 * ```
 */
export function renderWithAuth(
  ui: React.ReactElement,
  options: RenderWithAuthOptions = {}
) {
  const { authValue, ...renderOptions } = options;

  return render(
    <TestAuthProvider value={authValue}>
      {ui}
    </TestAuthProvider>,
    renderOptions
  );
}

/**
 * Get default mock auth value for use in tests
 */
export function getMockAuthValue(overrides: Partial<MockAuthValue> = {}): MockAuthValue {
  return { ...defaultAuthValue, ...overrides };
}
