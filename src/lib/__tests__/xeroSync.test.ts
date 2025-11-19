/**
 * Xero Sync Unit Tests - Phase 3 Step 8 Priority 2
 * Tests Xero sync stub behavior and error cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateXeroSyncPayload,
  prepareXeroLineItems,
  syncToXero,
  getXeroSyncStatus,
} from '../timetracking/xeroSyncAdapter';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  getSupabaseServer: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        in: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({ data: [], error: null })),
          })),
        })),
      })),
      update: vi.fn(() => ({
        in: vi.fn(() => ({ error: null })),
      })),
      insert: vi.fn(() => ({ error: null })),
    })),
  })),
}));

describe('Xero Sync - Payload Validation', () => {
  it('should validate correct payload', () => {
    const payload = {
      entryIds: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
      ],
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = validateXeroSyncPayload(payload);

    expect(result.valid).toBe(true);
    expect(result.data).toEqual(payload);
    expect(result.error).toBeUndefined();
  });

  it('should reject null payload', () => {
    const result = validateXeroSyncPayload(null);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('Payload is required');
  });

  it('should reject payload without entryIds', () => {
    const payload = {
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = validateXeroSyncPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('entryIds must be an array');
  });

  it('should reject empty entryIds array', () => {
    const payload = {
      entryIds: [],
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = validateXeroSyncPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('At least one entry ID is required');
  });

  it('should reject payload without organizationId', () => {
    const payload = {
      entryIds: ['550e8400-e29b-41d4-a716-446655440001'],
    };

    const result = validateXeroSyncPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('organizationId is required and must be a string');
  });

  it('should reject invalid UUID format for organizationId', () => {
    const payload = {
      entryIds: ['550e8400-e29b-41d4-a716-446655440001'],
      organizationId: 'invalid-uuid',
    };

    const result = validateXeroSyncPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.error).toBe('organizationId must be a valid UUID');
  });

  it('should reject invalid UUID format for entryIds', () => {
    const payload = {
      entryIds: ['invalid-uuid', '550e8400-e29b-41d4-a716-446655440001'],
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = validateXeroSyncPayload(payload);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid entry ID');
  });

  it('should accept single entry ID', () => {
    const payload = {
      entryIds: ['550e8400-e29b-41d4-a716-446655440001'],
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = validateXeroSyncPayload(payload);

    expect(result.valid).toBe(true);
  });

  it('should accept multiple entry IDs', () => {
    const payload = {
      entryIds: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ],
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = validateXeroSyncPayload(payload);

    expect(result.valid).toBe(true);
    expect(result.data?.entryIds).toHaveLength(3);
  });
});

describe('Xero Sync - Line Items Preparation', () => {
  it('should prepare line items from time entries', async () => {
    // Mock Supabase response with entries
    const mockEntries = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        staff_id: '550e8400-e29b-41d4-a716-446655440010',
        project_id: 'proj-123',
        hours: 3.5,
        hourly_rate: 75.0,
        date: '2025-11-19',
        description: 'Code review',
        status: 'approved',
        xero_synced: false,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        staff_id: '550e8400-e29b-41d4-a716-446655440010',
        project_id: 'proj-123',
        hours: 2.0,
        hourly_rate: 75.0,
        date: '2025-11-19',
        description: 'Documentation',
        status: 'approved',
        xero_synced: false,
      },
    ];

    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ data: mockEntries, error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const result = await prepareXeroLineItems(
      ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result.success).toBe(true);
    expect(result.lineItems).toHaveLength(2);
    expect(result.lineItems![0]).toMatchObject({
      employeeID: '550e8400-e29b-41d4-a716-446655440010',
      trackingItemID: 'proj-123',
      numberOfUnits: 3.5,
      ratePerUnit: 75.0,
      date: '2025-11-19',
      description: 'Code review',
    });
  });

  it('should handle no approved entries found', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ data: [], error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const result = await prepareXeroLineItems(
      ['550e8400-e29b-41d4-a716-446655440001'],
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('No approved, unsynced entries found');
  });

  it('should handle database errors', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ data: null, error: { message: 'Database error' } })),
            })),
          })),
        })),
      })),
    } as any);

    const result = await prepareXeroLineItems(
      ['550e8400-e29b-41d4-a716-446655440001'],
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});

describe('Xero Sync - Sync Operation (Stub)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should simulate successful sync', async () => {
    const mockEntries = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        staff_id: '550e8400-e29b-41d4-a716-446655440010',
        project_id: 'proj-123',
        hours: 3.5,
        hourly_rate: 75.0,
        date: '2025-11-19',
        description: 'Code review',
        status: 'approved',
        xero_synced: false,
      },
    ];

    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn((table) => {
        if (table === 'time_entries') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({ data: mockEntries, error: null })),
                })),
              })),
            })),
            update: vi.fn(() => ({
              in: vi.fn(() => ({ error: null })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({ error: null })),
        };
      }),
    } as any);

    const result = await syncToXero({
      entryIds: ['550e8400-e29b-41d4-a716-446655440001'],
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(1);
    expect(result.failedCount).toBe(0);
    expect(result.xeroTimesheetIds).toBeDefined();
    expect(result.message).toContain('Successfully synced');
    expect(result.message).toContain('STUB');
  });

  it('should fail with invalid payload', async () => {
    const result = await syncToXero({
      entryIds: [],
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(false);
    expect(result.failedCount).toBe(0);
    expect(result.message).toBe('Validation failed');
  });

  it('should handle sync of multiple entries', async () => {
    const mockEntries = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        staff_id: '550e8400-e29b-41d4-a716-446655440010',
        hours: 3.5,
        hourly_rate: 75.0,
        date: '2025-11-19',
        description: 'Entry 1',
        status: 'approved',
        xero_synced: false,
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        staff_id: '550e8400-e29b-41d4-a716-446655440010',
        hours: 2.0,
        hourly_rate: 75.0,
        date: '2025-11-19',
        description: 'Entry 2',
        status: 'approved',
        xero_synced: false,
      },
    ];

    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn((table) => {
        if (table === 'time_entries') {
          return {
            select: vi.fn(() => ({
              in: vi.fn(() => ({
                eq: vi.fn(() => ({
                  eq: vi.fn(() => ({ data: mockEntries, error: null })),
                })),
              })),
            })),
            update: vi.fn(() => ({
              in: vi.fn(() => ({ error: null })),
            })),
          };
        }
        return {
          insert: vi.fn(() => ({ error: null })),
        };
      }),
    } as any);

    const result = await syncToXero({
      entryIds: [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
      ],
      organizationId: '550e8400-e29b-41d4-a716-446655440000',
    });

    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(2);
    expect(result.xeroTimesheetIds).toHaveLength(2);
  });
});

describe('Xero Sync - Status Checking', () => {
  it('should get sync status for entries', async () => {
    const mockEntries = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        xero_synced: true,
        xero_timesheet_id: 'xero-123',
        xero_synced_at: '2025-11-19T10:00:00Z',
      },
      {
        id: '550e8400-e29b-41d4-a716-446655440002',
        xero_synced: false,
        xero_timesheet_id: null,
        xero_synced_at: null,
      },
    ];

    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({ data: mockEntries, error: null })),
          })),
        })),
      })),
    } as any);

    const result = await getXeroSyncStatus(
      ['550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002'],
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result.success).toBe(true);
    expect(result.status).toHaveLength(2);
    expect(result.status![0]).toMatchObject({
      entryId: '550e8400-e29b-41d4-a716-446655440001',
      synced: true,
      xeroTimesheetId: 'xero-123',
      syncedAt: '2025-11-19T10:00:00Z',
    });
    expect(result.status![1]).toMatchObject({
      entryId: '550e8400-e29b-41d4-a716-446655440002',
      synced: false,
    });
  });

  it('should handle database errors when fetching status', async () => {
    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({ data: null, error: { message: 'Database error' } })),
          })),
        })),
      })),
    } as any);

    const result = await getXeroSyncStatus(
      ['550e8400-e29b-41d4-a716-446655440001'],
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('Database error');
  });
});

describe('Xero Sync - Edge Cases', () => {
  it('should handle entries without hourly rate', async () => {
    const mockEntries = [
      {
        id: '550e8400-e29b-41d4-a716-446655440001',
        staff_id: '550e8400-e29b-41d4-a716-446655440010',
        hours: 3.5,
        hourly_rate: null, // No rate
        date: '2025-11-19',
        description: 'Non-billable work',
        status: 'approved',
        xero_synced: false,
      },
    ];

    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ data: mockEntries, error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const result = await prepareXeroLineItems(
      ['550e8400-e29b-41d4-a716-446655440001'],
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result.success).toBe(true);
    expect(result.lineItems![0].ratePerUnit).toBeUndefined();
  });

  it('should only sync approved entries', async () => {
    const mockEntries = []; // No approved entries

    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ data: mockEntries, error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const result = await prepareXeroLineItems(
      ['550e8400-e29b-41d4-a716-446655440001'],
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result.success).toBe(false);
    expect(result.error).toBe('No approved, unsynced entries found');
  });

  it('should not sync already synced entries', async () => {
    const mockEntries = []; // All entries already synced

    const { getSupabaseServer } = await import('@/lib/supabase');
    vi.mocked(getSupabaseServer).mockResolvedValue({
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          in: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({ data: mockEntries, error: null })),
            })),
          })),
        })),
      })),
    } as any);

    const result = await prepareXeroLineItems(
      ['550e8400-e29b-41d4-a716-446655440001'],
      '550e8400-e29b-41d4-a716-446655440000'
    );

    expect(result.success).toBe(false);
  });
});
