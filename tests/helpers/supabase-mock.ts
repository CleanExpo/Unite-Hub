/**
 * Shared Supabase Mock Helper
 * Provides properly chainable mock objects for testing
 */

import { vi } from "vitest";

/**
 * Creates a chainable mock Supabase client
 * Each method returns the chain itself, and query ends resolve to the final value
 */
export function createSupabaseMock(defaultData: any = []) {
  const createQueryChain = (resolveValue: any = { data: defaultData, error: null }) => {
    const chain: any = {};

    // All chainable methods return the chain
    const chainableMethods = [
      'from', 'select', 'insert', 'update', 'upsert', 'delete',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
      'is', 'in', 'contains', 'containedBy', 'range',
      'or', 'and', 'not', 'filter',
      'order', 'limit', 'offset', 'range',
      'match', 'textSearch'
    ];

    chainableMethods.forEach(method => {
      chain[method] = vi.fn(() => chain);
    });

    // Terminal methods that resolve
    chain.single = vi.fn(() => Promise.resolve({ data: defaultData[0] || null, error: null }));
    chain.maybeSingle = vi.fn(() => Promise.resolve({ data: defaultData[0] || null, error: null }));

    // Make the chain thenable (for await)
    chain.then = vi.fn((resolve: any, reject?: any) => {
      return Promise.resolve(resolveValue).then(resolve, reject);
    });

    return chain;
  };

  return createQueryChain({ data: defaultData, error: null });
}

/**
 * Creates a mock that can be configured for specific test cases
 */
export function createConfigurableSupabaseMock() {
  const mockData: Record<string, any[]> = {};

  const createQueryChain = (tableName?: string) => {
    const chain: any = {};
    let currentTable = tableName || '';

    chain.from = vi.fn((table: string) => {
      currentTable = table;
      return chain;
    });

    const chainableMethods = [
      'select', 'insert', 'update', 'upsert', 'delete',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
      'is', 'in', 'contains', 'containedBy', 'range',
      'or', 'and', 'not', 'filter',
      'order', 'limit', 'offset',
      'match', 'textSearch'
    ];

    chainableMethods.forEach(method => {
      chain[method] = vi.fn(() => chain);
    });

    chain.single = vi.fn(() => {
      const data = mockData[currentTable]?.[0] || null;
      return Promise.resolve({ data, error: null });
    });

    chain.maybeSingle = vi.fn(() => {
      const data = mockData[currentTable]?.[0] || null;
      return Promise.resolve({ data, error: null });
    });

    chain.then = vi.fn((resolve: any, reject?: any) => {
      const data = mockData[currentTable] || [];
      return Promise.resolve({ data, error: null }).then(resolve, reject);
    });

    return chain;
  };

  const mock = createQueryChain();

  // Method to set mock data for a table
  (mock as any).setMockData = (table: string, data: any[]) => {
    mockData[table] = data;
  };

  // Method to clear all mock data
  (mock as any).clearMockData = () => {
    Object.keys(mockData).forEach(key => delete mockData[key]);
  };

  return mock;
}

/**
 * Default mock to use in vi.mock
 */
export const defaultSupabaseMock = createSupabaseMock([]);
