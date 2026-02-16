/**
 * ATO Integration Tests
 *
 * End-to-end testing scenarios:
 * - OAuth2 M2M authentication flow
 * - ABN validation with caching
 * - BAS lodgement pipeline
 * - Tax obligations sync
 * - Error handling and retry logic
 *
 * Related to: UNI-176 [ATO] ATO API Integration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createATOClient } from '@/lib/integrations/ato/ato-client';
import type { BASData } from '@/lib/integrations/ato/ato-client';

// Mock Supabase - use a shared mock instance so spies persist
const mockFromTracker = vi.fn();
const mockSupabaseInstance = {
  from: mockFromTracker,
  auth: {
    getUser: vi.fn(() => ({
      data: { user: { id: 'user-1' } },
      error: null,
    })),
  },
};

// Default mock data for supabase tables
const defaultMockData: any = {
  ato_credentials: {
    workspace_id: 'workspace-1',
    access_token: 'mock-token',
    expires_at: new Date(Date.now() + 3600000).toISOString(),
    is_active: true,
    sandbox_mode: true,
  },
  abn_lookups: {
    abn: '51824753556',
    entity_name: 'TEST PTY LTD',
    status: 'active',
    gst_registered: true,
    last_verified_at: new Date().toISOString(),
  },
  bas_lodgements: [
    {
      id: 'bas-1',
      workspace_id: 'workspace-1',
      abn: '51824753556',
      period_year: 2026,
      period_quarter: 1,
      status: 'submitted',
      lodged_at: new Date().toISOString(),
    },
  ],
  tax_obligations: [
    {
      workspace_id: 'workspace-1',
      abn: '51824753556',
      obligation_type: 'BAS',
      due_date: '2026-04-28',
      status: 'due',
    },
  ],
};

function setupDefaultMockFrom() {
  mockFromTracker.mockImplementation((table: string) => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => ({
          data: defaultMockData[table] || null,
          error: null,
        })),
        order: vi.fn(() => ({
          data: Array.isArray(defaultMockData[table])
            ? defaultMockData[table]
            : [defaultMockData[table]],
          error: null,
        })),
      })),
      order: vi.fn(() => ({
        data: Array.isArray(defaultMockData[table])
          ? defaultMockData[table]
          : [defaultMockData[table]],
        error: null,
      })),
    })),
    insert: vi.fn(() => ({ data: null, error: null })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ data: null, error: null })),
    })),
    upsert: vi.fn(() => ({ data: null, error: null })),
  }));
}

// Set default implementation
setupDefaultMockFrom();

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => mockSupabaseInstance),
}));

// Mock fetch for ATO API calls
global.fetch = vi.fn((url) => {
  // Token endpoint
  if (url.toString().includes('/oauth2/token')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          access_token: 'mock-ato-token',
          token_type: 'Bearer',
          expires_in: 3600,
          scope: 'https://ato.gov.au/api/v1',
        }),
    } as Response);
  }

  // ABN lookup
  if (url.toString().includes('/abn/lookup/')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          abn: '51824753556',
          entityName: 'TEST PTY LTD',
          entityType: 'Australian Private Company',
          status: 'active',
          gstRegistered: true,
          registeredDate: '2020-01-01',
          statusEffectiveFrom: '2020-01-01',
        }),
    } as Response);
  }

  // BAS lodge
  if (url.toString().includes('/bas/lodge')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          submissionReference: 'BAS-2026-Q1-001',
          receiptId: 'RECEIPT-001',
          status: 'submitted',
        }),
    } as Response);
  }

  // Tax obligations
  if (url.toString().includes('/obligations/')) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          {
            type: 'BAS',
            description: 'Quarterly BAS Q1 2026',
            dueDate: '2026-04-28',
            period: { year: 2026, quarter: 1 },
            status: 'due',
            amount: 5000,
          },
        ]),
    } as Response);
  }

  return Promise.reject(new Error('Unknown endpoint'));
});

describe('ATO Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restore default mock data after clearAllMocks
    setupDefaultMockFrom();
    process.env.ATO_CLIENT_ID = 'test-client-id';
    process.env.ATO_CLIENT_SECRET = 'test-client-secret';
    process.env.ATO_API_URL = 'https://sandbox.api.ato.gov.au/v1';
    process.env.ATO_SANDBOX_MODE = 'true';
  });

  describe('OAuth2 M2M Authentication Flow', () => {
    it('should fetch access token using client credentials', async () => {
      // Override mock to return expired credentials so client must fetch new token
      mockFromTracker.mockImplementation((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: table === 'ato_credentials' ? {
                workspace_id: 'workspace-1',
                access_token: null,
                expires_at: null,
                is_active: true,
                sandbox_mode: true,
              } : null,
              error: null,
            })),
          })),
        })),
        insert: vi.fn(() => ({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: null })),
        })),
      }));

      const client = createATOClient();
      await client.initialize('workspace-1');

      const token = await client.getAccessToken();
      expect(token).toBeDefined();
      expect(fetch).toHaveBeenCalled();
    });

    it('should include required OAuth2 parameters', async () => {
      // Override mock to return expired credentials so client must fetch new token
      mockFromTracker.mockImplementation((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: table === 'ato_credentials' ? {
                workspace_id: 'workspace-1',
                access_token: null,
                expires_at: null,
                is_active: true,
                sandbox_mode: true,
              } : null,
              error: null,
            })),
          })),
        })),
        insert: vi.fn(() => ({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: null })),
        })),
      }));

      const client = createATOClient();
      await client.initialize('workspace-1');

      await client.getAccessToken();

      // Find the token endpoint call (skip any other fetch calls)
      const tokenCall = (fetch as any).mock.calls.find(
        (call: any[]) => call[0]?.toString().includes('/oauth2/token')
      );
      expect(tokenCall).toBeDefined();
      const [url, options] = tokenCall;

      expect(options.method).toBe('POST');
      expect(options.headers['Content-Type']).toBe(
        'application/x-www-form-urlencoded'
      );

      const body = options.body;
      expect(body).toContain('grant_type=client_credentials');
      expect(body).toContain('client_id=');
      expect(body).toContain('client_secret=');
      expect(body).toContain('scope=');
    });

    it('should reuse valid token instead of fetching new one', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      await client.getAccessToken();
      const firstCallCount = (fetch as any).mock.calls.length;

      await client.getAccessToken();
      const secondCallCount = (fetch as any).mock.calls.length;

      // Should not make additional fetch if token is still valid
      expect(secondCallCount).toBe(firstCallCount);
    });
  });

  describe('ABN Validation Pipeline', () => {
    it('should validate ABN via ATO API', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      const result = await client.validateABN('51824753556');

      expect(result).toBeDefined();
      expect(result.abn).toBe('51824753556');
      expect(result.entityName).toBe('TEST PTY LTD');
      expect(result.status).toBe('active');
      expect(result.gstRegistered).toBe(true);
    });

    it('should cache ABN lookup results', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      await client.validateABN('51824753556');

      // Verify cache write happened via shared mock tracker
      expect(mockFromTracker).toHaveBeenCalledWith('abn_lookups');
    });
  });

  describe('BAS Lodgement Flow', () => {
    it('should lodge BAS to ATO', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      const basData: BASData = {
        period: {
          year: 2026,
          quarter: 1,
          startDate: '2026-01-01',
          endDate: '2026-03-31',
        },
        abn: '51824753556',
        businessName: 'TEST PTY LTD',
        gstOnSales: 10000,
        gstOnPurchases: 5000,
        netGst: 5000,
        paygWithheld: 2000,
        paygInstallment: 1000,
        totalAmount: 8000,
        dueDate: '2026-04-28',
      };

      const result = await client.lodgeBAS(basData);

      expect(result.success).toBe(true);
      expect(result.submissionReference).toBe('BAS-2026-Q1-001');
      expect(result.receiptId).toBe('RECEIPT-001');
      expect(result.lodgedAt).toBeDefined();
    });

    it('should store lodgement record in database', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      const basData: BASData = {
        period: {
          year: 2026,
          quarter: 1,
          startDate: '2026-01-01',
          endDate: '2026-03-31',
        },
        abn: '51824753556',
        businessName: 'TEST PTY LTD',
        gstOnSales: 10000,
        gstOnPurchases: 5000,
        netGst: 5000,
        paygWithheld: 2000,
        paygInstallment: 1000,
        totalAmount: 8000,
        dueDate: '2026-04-28',
      };

      await client.lodgeBAS(basData);

      expect(mockFromTracker).toHaveBeenCalledWith('bas_lodgements');
    });
  });

  describe('Tax Obligations Sync', () => {
    it('should fetch tax obligations from ATO', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      const obligations = await client.getTaxObligations('51824753556');

      expect(obligations).toBeDefined();
      expect(Array.isArray(obligations)).toBe(true);
      expect(obligations.length).toBeGreaterThan(0);
      expect(obligations[0].type).toBe('BAS');
      expect(obligations[0].dueDate).toBe('2026-04-28');
    });

    it('should sync obligations to database', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      await client.getTaxObligations('51824753556');

      expect(mockFromTracker).toHaveBeenCalledWith('tax_obligations');
    });
  });

  describe('Connection Management', () => {
    it('should check connection status', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      const status = await client.getConnectionStatus();

      expect(status).toBeDefined();
      expect(status.connected).toBe(true);
      expect(status.sandboxMode).toBe(true);
      expect(status.lastAuth).toBeDefined();
      expect(status.expiresAt).toBeDefined();
    });

    it('should disconnect gracefully', async () => {
      const client = createATOClient();
      await client.initialize('workspace-1');

      await client.disconnect();

      expect(mockFromTracker).toHaveBeenCalledWith('ato_credentials');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle API errors gracefully', async () => {
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        })
      );

      const client = createATOClient();
      await client.initialize('workspace-1');

      await expect(client.validateABN('51824753556')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      // Override the mock to return expired credentials so it needs to fetch a new token
      mockFromTracker.mockImplementation((table: string) => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => ({
              data: table === 'ato_credentials' ? {
                workspace_id: 'workspace-1',
                access_token: null,
                expires_at: null,
                is_active: false,
                sandbox_mode: true,
              } : null,
              error: null,
            })),
          })),
        })),
        insert: vi.fn(() => ({ data: null, error: null })),
        update: vi.fn(() => ({
          eq: vi.fn(() => ({ data: null, error: null })),
        })),
      }));

      const client = createATOClient();
      await client.initialize('workspace-1');

      // Now mock fetch to fail on the token request
      (global.fetch as any).mockImplementationOnce(() =>
        Promise.reject(new Error('Network error'))
      );

      await expect(client.getAccessToken()).rejects.toThrow('Network error');
    });
  });
});
