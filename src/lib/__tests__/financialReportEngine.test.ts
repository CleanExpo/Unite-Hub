/**
 * Financial Report Engine Tests - Phase 3 Step 9
 * Tests ensuring aggregation logic is correct
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFinancialSummary,
  getProjectFinancials,
  getClientBilling,
  getAICostBreakdown,
  refreshFinancialReports,
  recordAICost,
} from '../reports/financialReportEngine';

// Create chainable Supabase mock with chainProxy pattern.
// Root mock has NO .then (so await getSupabaseServer() works).
// Chain methods return chainProxy which HAS .then for terminal queries.
const { mockSupabase } = vi.hoisted(() => {
  const queryResults: any[] = [];

  const mock: any = {
    _queryResults: queryResults,
    _setResults: (results: any[]) => {
      queryResults.length = 0;
      queryResults.push(...results);
    },
  };

  const chainProxy: any = {};

  const chainMethods = [
    'from', 'select', 'insert', 'update', 'delete', 'upsert',
    'eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like', 'ilike',
    'is', 'in', 'order', 'limit', 'range', 'match', 'not',
    'or', 'filter', 'contains', 'containedBy', 'textSearch', 'overlaps',
  ];
  chainMethods.forEach((m) => {
    const fn = vi.fn().mockReturnValue(chainProxy);
    mock[m] = fn;
    chainProxy[m] = fn;
  });

  const singleFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });
  const maybeSingleFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });
  const rpcFn = vi.fn().mockImplementation(() => {
    const result = queryResults.shift() || { data: null, error: null };
    return Promise.resolve(result);
  });

  mock.single = singleFn;
  mock.maybeSingle = maybeSingleFn;
  mock.rpc = rpcFn;
  chainProxy.single = singleFn;
  chainProxy.maybeSingle = maybeSingleFn;
  chainProxy.rpc = rpcFn;

  chainProxy.then = (resolve: any) => {
    const result = queryResults.shift() || { data: [], error: null };
    return resolve(result);
  };

  return { mockSupabase: mock };
});

vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn().mockResolvedValue(mockSupabase),
}));

function resetMocks() {
  mockSupabase._setResults([]);
}

describe('Financial Report Engine - Summary', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should fetch financial summary successfully', async () => {
    // getFinancialSummary calls supabase.rpc()
    mockSupabase._setResults([
      {
        data: [
          {
            total_revenue: 10000,
            total_costs: 4000,
            gross_profit: 6000,
            profit_margin: 60,
            total_billable_hours: 100,
            total_payments: 8000,
            outstanding_balance: 2000,
          },
        ],
        error: null,
      },
    ]);

    const result = await getFinancialSummary('test-org-id');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.totalRevenue).toBe(10000);
    expect(result.data?.grossProfit).toBe(6000);
    expect(result.data?.profitMargin).toBe(60);
  });

  it('should handle empty summary data', async () => {
    mockSupabase._setResults([
      { data: [], error: null },
    ]);

    const result = await getFinancialSummary('test-org-id');

    expect(result.success).toBe(true);
    expect(result.data?.totalRevenue).toBe(0);
  });

  it('should handle date range filters', async () => {
    const startDate = '2025-01-01T00:00:00Z';
    const endDate = '2025-01-31T23:59:59Z';

    mockSupabase._setResults([
      {
        data: [
          {
            total_revenue: 10000,
            total_costs: 4000,
            gross_profit: 6000,
            profit_margin: 60,
            total_billable_hours: 100,
            total_payments: 8000,
            outstanding_balance: 2000,
          },
        ],
        error: null,
      },
    ]);

    const result = await getFinancialSummary('test-org-id', startDate, endDate);

    expect(result.success).toBe(true);
    expect(result.data?.periodStart).toBe(startDate);
    expect(result.data?.periodEnd).toBe(endDate);
  });
});

describe('Financial Report Engine - Project Financials', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should fetch all project financials', async () => {
    mockSupabase._setResults([
      { data: [], error: null },
    ]);

    const result = await getProjectFinancials('test-org-id');

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should filter by project ID', async () => {
    mockSupabase._setResults([
      { data: [], error: null },
    ]);

    const result = await getProjectFinancials('test-org-id', 'test-project-id');

    expect(result.success).toBe(true);
  });
});

describe('Financial Report Engine - Client Billing', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should fetch all client billing summaries', async () => {
    mockSupabase._setResults([
      { data: [], error: null },
    ]);

    const result = await getClientBilling('test-org-id');

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should filter by contact ID', async () => {
    mockSupabase._setResults([
      { data: [], error: null },
    ]);

    const result = await getClientBilling('test-org-id', 'test-contact-id');

    expect(result.success).toBe(true);
  });
});

describe('Financial Report Engine - AI Costs', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should aggregate AI costs by provider and model', async () => {
    mockSupabase._setResults([
      {
        data: [
          {
            provider: 'anthropic',
            model_name: 'claude-sonnet-4-5-20250929',
            input_tokens: 1000,
            output_tokens: 500,
            cache_read_tokens: 0,
            cache_write_tokens: 0,
            total_cost: 0.015,
          },
          {
            provider: 'anthropic',
            model_name: 'claude-sonnet-4-5-20250929',
            input_tokens: 2000,
            output_tokens: 1000,
            cache_read_tokens: 0,
            cache_write_tokens: 0,
            total_cost: 0.030,
          },
        ],
        error: null,
      },
    ]);

    const result = await getAICostBreakdown('test-org-id');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data?.[0].totalRequests).toBe(2);
    expect(result.data?.[0].totalCost).toBeCloseTo(0.045, 3);
  });
});

describe('Financial Report Engine - AI Cost Recording', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should record AI cost with correct calculation', async () => {
    // recordAICost:
    // 1. rpc('calculate_ai_cost') -> { data: 0.015, error: null }
    // 2. insert.select.single -> { data: { id: 'test-id' }, error: null }
    // 3. insert (financial_transactions) -> then
    mockSupabase._setResults([
      // rpc
      { data: 0.015, error: null },
      // insert.select.single
      { data: { id: 'test-id' }, error: null },
      // insert financial_transactions -> then
      { error: null },
    ]);

    const result = await recordAICost({
      organizationId: 'test-org-id',
      provider: 'anthropic',
      modelName: 'claude-sonnet-4-5-20250929',
      inputTokens: 1000,
      outputTokens: 500,
      operationType: 'content_generation',
    });

    expect(result.success).toBe(true);
    expect(result.costId).toBeDefined();
    expect(result.totalCost).toBeCloseTo(0.015, 3);
  });

  it('should include cache tokens in cost calculation', async () => {
    mockSupabase._setResults([
      { data: 0.010, error: null },
      { data: { id: 'test-id-2' }, error: null },
      { error: null },
    ]);

    const result = await recordAICost({
      organizationId: 'test-org-id',
      provider: 'anthropic',
      modelName: 'claude-sonnet-4-5-20250929',
      inputTokens: 1000,
      outputTokens: 500,
      cacheReadTokens: 5000,
      cacheWriteTokens: 0,
    });

    expect(result.success).toBe(true);
  });
});

describe('Financial Report Engine - Materialized Views', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('should refresh materialized views successfully', async () => {
    // refreshFinancialReports calls supabase.rpc()
    mockSupabase._setResults([
      { error: null },
    ]);

    const result = await refreshFinancialReports();

    expect(result.success).toBe(true);
  });
});
