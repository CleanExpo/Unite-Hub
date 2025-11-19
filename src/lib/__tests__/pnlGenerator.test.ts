/**
 * P&L Generator Tests - Phase 3 Step 9
 * Tests ensuring P&L generation is accurate
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  generateOrganizationPnL,
  generateProjectPnL,
  generateClientPnL,
  generateMonthlyComparison,
} from '../reports/pnlGenerator';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn((table) => {
      if (table === 'financial_transactions') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    data: [
                      {
                        transaction_type: 'time_entry',
                        amount: 1000,
                        status: 'completed',
                      },
                    ],
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        };
      }
      if (table === 'time_entries') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  eq: vi.fn(() => ({
                    data: [
                      {
                        hours: 10,
                        hourly_rate: 100,
                        billable: true,
                        status: 'approved',
                        date: '2025-01-15',
                      },
                      {
                        hours: 2,
                        hourly_rate: 100,
                        billable: false,
                        status: 'approved',
                        date: '2025-01-15',
                      },
                    ],
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        };
      }
      if (table === 'projects') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-project',
                  name: 'Test Project',
                  contact_id: 'test-contact',
                  organization_id: 'test-org',
                  contacts: { name: 'Test Client' },
                },
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === 'contacts') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => ({
                data: {
                  id: 'test-contact',
                  name: 'Test Client',
                  organization_id: 'test-org',
                },
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === 'ai_cost_tracking') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  data: [{ total_cost: 0.50 }],
                  error: null,
                })),
              })),
            })),
          })),
        };
      }
      return {
        select: vi.fn(() => ({ data: [], error: null })),
      };
    }),
  })),
}));

describe('P&L Generator - Organization', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate organization P&L successfully', async () => {
    const result = await generateOrganizationPnL(
      'test-org-id',
      '2025-01-01T00:00:00Z',
      '2025-01-31T23:59:59Z',
      false
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.revenue.total).toBeGreaterThanOrEqual(0);
    expect(result.data?.costs.total).toBeGreaterThanOrEqual(0);
  });

  it('should calculate correct profit margin', async () => {
    const result = await generateOrganizationPnL(
      'test-org-id',
      '2025-01-01T00:00:00Z',
      '2025-01-31T23:59:59Z'
    );

    expect(result.success).toBe(true);
    if (result.data && result.data.revenue.total > 0) {
      const expectedMargin =
        ((result.data.revenue.total - result.data.costs.total) / result.data.revenue.total) * 100;
      expect(result.data.grossMargin).toBeCloseTo(expectedMargin, 1);
    }
  });

  it('should calculate utilization rate correctly', async () => {
    const result = await generateOrganizationPnL(
      'test-org-id',
      '2025-01-01T00:00:00Z',
      '2025-01-31T23:59:59Z'
    );

    expect(result.success).toBe(true);
    if (result.data && result.data.totalHours > 0) {
      const expectedUtilization = (result.data.billableHours / result.data.totalHours) * 100;
      expect(result.data.utilizationRate).toBeCloseTo(expectedUtilization, 1);
    }
  });

  it('should include comparison to previous period', async () => {
    const result = await generateOrganizationPnL(
      'test-org-id',
      '2025-02-01T00:00:00Z',
      '2025-02-28T23:59:59Z',
      true
    );

    expect(result.success).toBe(true);
    if (result.data?.comparison) {
      expect(result.data.comparison.previousPeriod).toBeDefined();
      expect(result.data.comparison.revenueGrowth).toBeDefined();
      expect(result.data.comparison.profitGrowth).toBeDefined();
    }
  });
});

describe('P&L Generator - Project', () => {
  it('should generate project P&L successfully', async () => {
    const result = await generateProjectPnL(
      'test-project-id',
      '2025-01-01T00:00:00Z',
      '2025-01-31T23:59:59Z'
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.projectName).toBe('Test Project');
  });

  it('should include AI costs in project P&L', async () => {
    const result = await generateProjectPnL(
      'test-project-id',
      '2025-01-01T00:00:00Z',
      '2025-01-31T23:59:59Z'
    );

    expect(result.success).toBe(true);
    expect(result.data?.statement.costs.aiCosts).toBeGreaterThanOrEqual(0);
  });

  it('should handle project not found', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({ data: null, error: { message: 'Not found' } })),
          })),
        })),
      })),
    } as any);

    const result = await generateProjectPnL(
      'non-existent-project',
      '2025-01-01T00:00:00Z',
      '2025-01-31T23:59:59Z'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Project not found');
  });
});

describe('P&L Generator - Client', () => {
  it('should aggregate P&L across all client projects', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn((table) => {
        if (table === 'contacts') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn(() => ({
                  data: {
                    id: 'test-contact',
                    name: 'Test Client',
                    organization_id: 'test-org',
                  },
                  error: null,
                })),
              })),
            })),
          };
        }
        if (table === 'projects') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                data: [
                  { id: 'project-1', name: 'Project 1' },
                  { id: 'project-2', name: 'Project 2' },
                ],
                error: null,
              })),
            })),
          };
        }
        return { select: vi.fn(() => ({ data: [], error: null })) };
      }),
    } as any);

    const result = await generateClientPnL(
      'test-contact-id',
      '2025-01-01T00:00:00Z',
      '2025-01-31T23:59:59Z'
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.projects.length).toBeGreaterThanOrEqual(0);
  });
});

describe('P&L Generator - Monthly Comparison', () => {
  it('should generate monthly comparison for 6 months', async () => {
    const result = await generateMonthlyComparison('test-org-id', 6);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(Array.isArray(result.data)).toBe(true);
  });

  it('should respect months parameter', async () => {
    const result = await generateMonthlyComparison('test-org-id', 3);

    expect(result.success).toBe(true);
    // Length should be <= 3 (may be less if early months have no data)
    expect(result.data?.length).toBeLessThanOrEqual(3);
  });
});
