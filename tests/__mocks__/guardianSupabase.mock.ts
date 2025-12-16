/**
 * Centralized Guardian Supabase Mock
 * Ensures consistent, chainable query builder across all Guardian tests
 */
import { vi } from 'vitest';

// Global state for mock tables to support stateful operations
// Structure: tableStates[tableName][tenantId] = data
const tableStates: Record<string, Record<string, any>> = {};

/**
 * Create a chainable Supabase query object with all methods
 * CRITICAL: Create the chain once, not recursively, to avoid memory leaks
 */
export const createMockSupabaseQuery = (defaultData = null, tableName: string = 'default', tenantId: string = 'test-tenant-001') => {
  const mockData = {
    data: defaultData || {
      id: 'test-id',
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
    },
    error: null,
  };

  // Initialize table state if needed
  if (!tableStates[tableName]) {
    tableStates[tableName] = {};
  }
  if (!tableStates[tableName][tenantId]) {
    tableStates[tableName][tenantId] = mockData.data || {};
  }

  // Track query type and operation - needed to determine response shape on await
  let isCountQuery = false;
  let operationType: 'read' | 'write' | null = null;
  let writeData: any = null;
  let filterTenantId: string | null = null; // Track if eq('tenant_id', ...) was called

  // Create the chainable object once - all methods return THE SAME CHAIN
  // This prevents recursive memory explosion
  const chain = {} as any;

  const filterMethods = [
    'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike', 'is', 'in',
    'contains', 'containedBy', 'range', 'order', 'limit', 'offset'
  ];

  filterMethods.forEach(method => {
    chain[method] = vi.fn().mockReturnValue(chain);
  });

  // eq() method - special handling for tenant_id filtering
  chain.eq = vi.fn((column: string, value: any) => {
    if (column === 'tenant_id') {
      filterTenantId = value;
    }
    return chain;
  });

  // Write operations - capture the data being written
  chain.insert = vi.fn((data) => {
    operationType = 'write';
    writeData = data;
    const tid = (data as any)?.tenant_id || filterTenantId || tenantId;
    const recordData = Array.isArray(data) ? data[0] : data;
    // Add auto-generated ID if not present
    tableStates[tableName][tid] = {
      ...recordData,
      id: recordData.id || `id-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      created_at: recordData.created_at || new Date().toISOString(),
    };
    return chain;
  });

  chain.update = vi.fn((data) => {
    operationType = 'write';
    writeData = data;
    // Merge with existing data
    const tid = filterTenantId || tenantId;
    tableStates[tableName][tid] = { ...tableStates[tableName][tid], ...data };
    return chain;
  });

  chain.upsert = vi.fn((data) => {
    operationType = 'write';
    writeData = data;
    // Merge with existing data for upsert
    const tid = (data as any)?.tenant_id || filterTenantId || tenantId;
    tableStates[tableName][tid] = { ...tableStates[tableName][tid], ...data };
    return chain;
  });

  chain.delete = vi.fn(() => {
    operationType = 'write';
    const tid = filterTenantId || tenantId;
    tableStates[tableName][tid] = {};
    return chain;
  });

  // select() method - keeps chaining but makes query awaitable
  chain.select = vi.fn().mockReturnValue(chain);

  // count() method - marks this as a count query
  chain.count = vi.fn().mockReturnValue((() => {
    isCountQuery = true;
    return chain;
  })());

  const getTenantData = () => {
    const tid = filterTenantId || tenantId;
    return tableStates[tableName][tid];
  };

  // single() mimics Supabase behavior: throws PGRST116 when no row found
  chain.single = vi.fn().mockImplementation(() => {
    const data = getTenantData();
    if (!data || Object.keys(data).length === 0) {
      // Return error like Supabase does when no row found
      return Promise.resolve({
        data: null,
        error: { code: 'PGRST116', message: 'Returned more than one row' },
      });
    }
    return Promise.resolve({ data, error: null });
  });

  chain.maybeSingle = vi.fn().mockImplementation(() => {
    const data = getTenantData();
    return Promise.resolve({ data: data || null, error: null });
  });

  // Make the chain itself awaitable for both regular queries and count queries
  chain.then = vi.fn((onFulfilled, onRejected) => {
    // Return appropriate response shape based on query type
    let result: any;
    if (isCountQuery) {
      result = { count: 0, error: null };
    } else {
      // Return tenant-specific data
      result = { data: getTenantData(), error: null };
    }
    try {
      return Promise.resolve(result).then(onFulfilled, onRejected);
    } catch (e) {
      return Promise.reject(e).catch(onRejected);
    }
  });

  chain.catch = vi.fn((onRejected) => {
    const result = isCountQuery
      ? { count: 0, error: null }
      : { data: getTenantData(), error: null };
    return Promise.resolve(result).catch(onRejected);
  });

  return chain;
};

// Singleton Supabase server mock - maintains state across entire test
let mockSupabaseInstance: any = null;

/**
 * Create a complete Supabase server mock with from() method
 * Routes table-specific queries to maintain state across multiple calls
 * Uses singleton pattern so state persists across test
 */
export const createMockSupabaseServer = () => {
  if (mockSupabaseInstance) {
    return mockSupabaseInstance;
  }

  const fromFn = vi.fn((tableName: string) => {
    // Extract tenant_id from previous eq() call if it exists
    // Create table-specific queries that maintain state
    return createMockSupabaseQuery(null, tableName);
  });

  mockSupabaseInstance = {
    from: fromFn,
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user' } } }),
      getSession: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'test-user' } } } }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return mockSupabaseInstance;
};

/**
 * Reset the mock server state between tests
 */
export const resetMockSupabaseServer = () => {
  mockSupabaseInstance = null;
  // Clear all table states
  Object.keys(tableStates).forEach(key => {
    delete tableStates[key];
  });
};

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
