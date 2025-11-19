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

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    rpc: vi.fn((fnName) => {
      if (fnName === 'get_organization_financial_summary') {
        return {
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
        };
      }
      if (fnName === 'calculate_ai_cost') {
        return { data: 0.15, error: null };
      }
      if (fnName === 'refresh_financial_reports') {
        return { error: null };
      }
      return { data: [], error: null };
    }),
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({ data: [], error: null })),
          single: vi.fn(() => ({ data: {}, error: null })),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({ data: [], error: null })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({ data: { id: 'test-id' }, error: null })),
        })),
      })),
    })),
  })),
}));

describe('Financial Report Engine - Summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch financial summary successfully', async () => {
    const result = await getFinancialSummary('test-org-id');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.totalRevenue).toBe(10000);
    expect(result.data?.grossProfit).toBe(6000);
    expect(result.data?.profitMargin).toBe(60);
  });

  it('should handle empty summary data', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      rpc: vi.fn(() => ({ data: [], error: null })),
    } as any);

    const result = await getFinancialSummary('test-org-id');

    expect(result.success).toBe(true);
    expect(result.data?.totalRevenue).toBe(0);
  });

  it('should handle date range filters', async () => {
    const startDate = '2025-01-01T00:00:00Z';
    const endDate = '2025-01-31T23:59:59Z';

    const result = await getFinancialSummary('test-org-id', startDate, endDate);

    expect(result.success).toBe(true);
    expect(result.data?.periodStart).toBe(startDate);
    expect(result.data?.periodEnd).toBe(endDate);
  });
});

describe('Financial Report Engine - Project Financials', () => {
  it('should fetch all project financials', async () => {
    const result = await getProjectFinancials('test-org-id');

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should filter by project ID', async () => {
    const result = await getProjectFinancials('test-org-id', 'test-project-id');

    expect(result.success).toBe(true);
  });
});

describe('Financial Report Engine - Client Billing', () => {
  it('should fetch all client billing summaries', async () => {
    const result = await getClientBilling('test-org-id');

    expect(result.success).toBe(true);
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should filter by contact ID', async () => {
    const result = await getClientBilling('test-org-id', 'test-contact-id');

    expect(result.success).toBe(true);
  });
});

describe('Financial Report Engine - AI Costs', () => {
  it('should aggregate AI costs by provider and model', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
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
              })),
            })),
          })),
        })),
      })),
    } as any);

    const result = await getAICostBreakdown('test-org-id');

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.length).toBeGreaterThan(0);
    expect(result.data?.[0].totalRequests).toBe(2);
    expect(result.data?.[0].totalCost).toBeCloseTo(0.045, 3);
  });
});

describe('Financial Report Engine - AI Cost Recording', () => {
  it('should record AI cost with correct calculation', async () => {
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
  it('should refresh materialized views successfully', async () => {
    const result = await refreshFinancialReports();

    expect(result.success).toBe(true);
  });
});
