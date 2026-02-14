/**
 * Vitest Test Setup
 *
 * Global test configuration, mocks, and utilities
 */

import { vi } from 'vitest';
import { config } from 'dotenv';
import '@testing-library/jest-dom/vitest';

// Load test environment variables
config({ path: '.env.test' });

// =====================================================
// SUPABASE MOCK FACTORY
// =====================================================

/**
 * Creates a chainable Supabase mock that works with all query patterns
 *
 * This mock handles:
 * - Method chaining (select().eq().single())
 * - Promise resolution (await or .then())
 * - Multiple query patterns (CRUD operations)
 * - Custom return values per test
 */
function createSupabaseMock(defaultData: any = null) {
  const createChain = (finalValue: any = { data: defaultData, error: null }): any => {
    const chain = {
      from: vi.fn(() => createChain(finalValue)),
      select: vi.fn(() => createChain(finalValue)),
      insert: vi.fn(() => createChain(finalValue)),
      update: vi.fn(() => createChain(finalValue)),
      delete: vi.fn(() => createChain(finalValue)),
      upsert: vi.fn(() => createChain(finalValue)),
      eq: vi.fn(() => createChain(finalValue)),
      neq: vi.fn(() => createChain(finalValue)),
      gt: vi.fn(() => createChain(finalValue)),
      gte: vi.fn(() => createChain(finalValue)),
      lt: vi.fn(() => createChain(finalValue)),
      lte: vi.fn(() => createChain(finalValue)),
      like: vi.fn(() => createChain(finalValue)),
      ilike: vi.fn(() => createChain(finalValue)),
      in: vi.fn(() => createChain(finalValue)),
      is: vi.fn(() => createChain(finalValue)),
      or: vi.fn(() => createChain(finalValue)),
      not: vi.fn(() => createChain(finalValue)),
      order: vi.fn(() => createChain(finalValue)),
      limit: vi.fn(() => createChain(finalValue)),
      range: vi.fn(() => createChain(finalValue)),
      single: vi.fn(() => Promise.resolve(finalValue)),
      maybeSingle: vi.fn(() => Promise.resolve(finalValue)),
      then: vi.fn((resolve: any) => Promise.resolve(finalValue).then(resolve)),
      catch: vi.fn((reject: any) => Promise.reject(finalValue).catch(reject)),
    };
    return chain;
  };

  const mockClient = createChain();

  // Add auth methods
  mockClient.auth = {
    getUser: vi.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-123', email: 'test@example.com' } },
      error: null,
    })),
    getSession: vi.fn(() => Promise.resolve({
      data: { session: { access_token: 'test-token', user: { id: 'test-user-123' } } },
      error: null,
    })),
    signInWithPassword: vi.fn(() => Promise.resolve({
      data: { user: { id: 'test-user-123' }, session: { access_token: 'test-token' } },
      error: null,
    })),
    signOut: vi.fn(() => Promise.resolve({ error: null })),
  };

  // Add RPC method
  mockClient.rpc = vi.fn(() => Promise.resolve({ data: null, error: null }));

  // Add storage methods
  mockClient.storage = {
    from: vi.fn(() => ({
      upload: vi.fn(() => Promise.resolve({ data: { path: 'test-file.txt' }, error: null })),
      download: vi.fn(() => Promise.resolve({ data: new Blob(), error: null })),
      remove: vi.fn(() => Promise.resolve({ data: null, error: null })),
      list: vi.fn(() => Promise.resolve({ data: [], error: null })),
      getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.txt' } })),
    })),
  };

  return mockClient;
}

// Create default mock instance
const defaultMockSupabase = createSupabaseMock();

// Mock @/lib/supabase/server (for server-side imports)
// Individual tests can override this with their own vi.mock() calls
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => defaultMockSupabase),
}));

// Note: We don't mock @/lib/supabase globally because many individual test files
// have their own custom mocks. Global mocking would conflict with test-specific mocks.
// Tests that need @/lib/supabase should create their own mocks using createSupabaseMock().

// Export factory for tests that need custom mocks
export { createSupabaseMock };

// Mock Google Secret Manager
vi.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: vi.fn(() => ({
    accessSecretVersion: vi.fn().mockResolvedValue([{
      payload: {
        data: Buffer.from(JSON.stringify({ access_token: 'mock-token' })),
      },
    }]),
    createSecret: vi.fn().mockResolvedValue([{ name: 'mock-secret' }]),
    addSecretVersion: vi.fn().mockResolvedValue([{ name: 'mock-version' }]),
    deleteSecret: vi.fn().mockResolvedValue([{}]),
  })),
}));

// Mock console methods to reduce test output noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.GOOGLE_APPLICATION_CREDENTIALS = './test-service-account.json';
process.env.GCP_PROJECT_ID = 'test-project';
process.env.ANTHROPIC_API_KEY = 'sk-ant-test-key-12345';
process.env.OPENROUTER_API_KEY = 'test-openrouter-key';
process.env.PERPLEXITY_API_KEY = 'test-perplexity-key';
