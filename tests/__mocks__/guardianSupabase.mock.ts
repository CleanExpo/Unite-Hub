/**
 * Centralized Guardian Supabase Mock
 * Ensures consistent, chainable query builder across all Guardian tests
 */
import { vi } from 'vitest';

/**
 * Create a chainable Supabase query object with all methods
 * CRITICAL: Create the chain once, not recursively, to avoid memory leaks
 */
export const createMockSupabaseQuery = (defaultData = null) => {
  const mockData = {
    data: defaultData || {
      id: 'test-id',
      tenant_id: 'test-tenant-001',
      created_at: new Date().toISOString(),
    },
    error: null,
  };

  // Create the chainable object once - all methods return THE SAME CHAIN
  // This prevents recursive memory explosion
  const chain = {} as any;

  const methods = [
    'select', 'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in',
    'contains', 'containedBy', 'range', 'order', 'limit', 'offset',
    'insert', 'update', 'delete', 'upsert', 'count'
  ];

  methods.forEach(method => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });

  chain.single = vi.fn().mockResolvedValue(mockData);
  chain.maybeSingle = vi.fn().mockResolvedValue(mockData);

  return chain;
};

/**
 * Create a complete Supabase server mock with from() method
 */
export const createMockSupabaseServer = () => ({
  from: vi.fn(() => createMockSupabaseQuery()),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
    getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user' } } } }),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
});

/**
 * Setup global Supabase mock for tests
 */
export function mockGuardianSupabase() {
  return vi.mock('@/lib/supabase', () => ({
    getSupabaseServer: vi.fn(() => createMockSupabaseServer()),
  }));
}

/**
 * Helper to configure specific table mocks with custom data
 */
export function configureTableMock(
  mockFrom: ReturnType<typeof vi.fn>,
  tableName: string,
  mockData: any
) {
  mockFrom.mockImplementation((table: string) => {
    if (table === tableName) {
      return createMockSupabaseQuery(mockData);
    }
    return createMockSupabaseQuery();
  });
}
