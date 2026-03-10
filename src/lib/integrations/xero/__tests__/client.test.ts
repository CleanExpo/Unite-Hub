import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ── Mocks (hoisted above all imports by Vitest transform) ────────────────────

const mockSingle = vi.fn()
const mockEq3 = vi.fn(() => ({ single: mockSingle }))
const mockEq2 = vi.fn(() => ({ eq: mockEq3 }))
const mockEq1 = vi.fn(() => ({ eq: mockEq2 }))
const mockSelect = vi.fn(() => ({ eq: mockEq1 }))
const mockUpsert = vi.fn(() => ({ error: null }))
const mockFrom = vi.fn((table: string) => {
  if (table === 'credentials_vault') {
    return { select: mockSelect, upsert: mockUpsert }
  }
  return { select: mockSelect, upsert: mockUpsert }
})

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: vi.fn(() => ({ from: mockFrom })),
}))

vi.mock('@/lib/vault', () => ({
  encrypt: vi.fn((plaintext: string) => ({
    encryptedValue: `encrypted:${plaintext}`,
    iv: 'mock-iv',
    salt: 'mock-salt',
  })),
  decrypt: vi.fn((payload: { encryptedValue: string }) => {
    // Strip the 'encrypted:' prefix if present, otherwise return as-is
    const raw = payload.encryptedValue.startsWith('encrypted:')
      ? payload.encryptedValue.slice('encrypted:'.length)
      : payload.encryptedValue
    return raw
  }),
}))

// ── Static imports (resolved AFTER vi.mock() hoisting) ───────────────────────

import {
  isXeroConfigured,
  getMockRevenueMTD,
  refreshXeroToken,
  getValidXeroToken,
  loadXeroTokens,
  saveXeroTokens,
  xeroApiFetch,
  parsePandLRevenue,
  parsePandLExpenses,
  calculateMoMGrowth,
  fetchRevenueMTD,
  fetchBankTransactions,
  fetchInvoices,
  fetchContacts,
  fetchAccounts,
  fetchTaxRates,
  reconcileTransaction,
} from '../client'

import type { StoredXeroTokens } from '../types'

// ── Test fixtures ───────────────────────────────────────────────────────────

const MOCK_TOKENS: StoredXeroTokens = {
  access_token: 'test-access-token',
  refresh_token: 'test-refresh-token',
  expires_at: Date.now() + 3600_000, // 1 hour from now
  tenant_id: 'test-tenant-id',
}

const EXPIRED_TOKENS: StoredXeroTokens = {
  ...MOCK_TOKENS,
  expires_at: Date.now() - 60_000, // expired 1 min ago
}

const FOUNDER_ID = 'founder-123'
const BUSINESS_KEY = 'dr'

// ── Helper to set up vault mock for loadXeroTokens ──────────────────────────

function setupVaultMock(tokens: StoredXeroTokens | null) {
  if (tokens) {
    mockSingle.mockResolvedValue({
      data: {
        encrypted_value: `encrypted:${JSON.stringify(tokens)}`,
        iv: 'mock-iv',
        salt: 'mock-salt',
      },
    })
  } else {
    mockSingle.mockResolvedValue({ data: null })
  }
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Xero Client', () => {
  const originalFetch = global.fetch
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers({ shouldAdvanceTime: true })
    process.env.XERO_CLIENT_ID = 'test-client-id'
    process.env.XERO_CLIENT_SECRET = 'test-client-secret'
  })

  afterEach(() => {
    global.fetch = originalFetch
    process.env = { ...originalEnv }
    vi.useRealTimers()
  })

  // ── isXeroConfigured ────────────────────────────────────────────────────

  describe('isXeroConfigured', () => {
    it('returns true when both XERO_CLIENT_ID and XERO_CLIENT_SECRET are set', () => {
      expect(isXeroConfigured()).toBe(true)
    })

    it('returns false when XERO_CLIENT_ID is missing', () => {
      delete process.env.XERO_CLIENT_ID
      expect(isXeroConfigured()).toBe(false)
    })

    it('returns false when XERO_CLIENT_SECRET is missing', () => {
      delete process.env.XERO_CLIENT_SECRET
      expect(isXeroConfigured()).toBe(false)
    })
  })

  // ── getMockRevenueMTD ─────────────────────────────────────────────────

  describe('getMockRevenueMTD', () => {
    it('returns known mock data for a configured business key', () => {
      const result = getMockRevenueMTD('dr')
      expect(result.businessKey).toBe('dr')
      expect(result.revenueCents).toBe(2_475_000)
    })

    it('returns zeroed data for an unknown business key', () => {
      const result = getMockRevenueMTD('unknown')
      expect(result.businessKey).toBe('unknown')
      expect(result.revenueCents).toBe(0)
      expect(result.invoiceCount).toBe(0)
    })
  })

  // ── parsePandLRevenue ──────────────────────────────────────────────────

  describe('parsePandLRevenue', () => {
    it('extracts revenue cents from a valid P&L report', () => {
      const report = {
        Reports: [{
          Rows: [
            {
              RowType: 'Section',
              Title: 'Income',
              Rows: [
                {
                  RowType: 'SummaryRow',
                  Cells: [{ Value: 'Total Income' }, { Value: '24,750.00' }],
                },
              ],
            },
          ],
        }],
      }
      expect(parsePandLRevenue(report)).toBe(2_475_000)
    })

    it('returns 0 when there is no Income section', () => {
      const report = { Reports: [{ Rows: [{ RowType: 'Section', Title: 'Expenses' }] }] }
      expect(parsePandLRevenue(report)).toBe(0)
    })

    it('returns 0 when Reports is empty', () => {
      expect(parsePandLRevenue({})).toBe(0)
      expect(parsePandLRevenue({ Reports: [] })).toBe(0)
    })
  })

  // ── parsePandLExpenses ────────────────────────────────────────────────

  describe('parsePandLExpenses', () => {
    it('sums Cost of Sales and Operating Expenses sections', () => {
      const report = {
        Reports: [{
          Rows: [
            {
              RowType: 'Section',
              Title: 'Less Cost of Sales',
              Rows: [{
                RowType: 'SummaryRow',
                Cells: [{ Value: 'Total Cost of Sales' }, { Value: '5,000.00' }],
              }],
            },
            {
              RowType: 'Section',
              Title: 'Less Operating Expenses',
              Rows: [{
                RowType: 'SummaryRow',
                Cells: [{ Value: 'Total Operating Expenses' }, { Value: '3,000.00' }],
              }],
            },
          ],
        }],
      }
      // 5,000 + 3,000 = 8,000 dollars → 800,000 cents
      expect(parsePandLExpenses(report)).toBe(800_000)
    })

    it('returns 0 when no expense sections exist', () => {
      const report = {
        Reports: [{ Rows: [{ RowType: 'Section', Title: 'Income' }] }],
      }
      expect(parsePandLExpenses(report)).toBe(0)
    })

    it('returns 0 for empty report', () => {
      expect(parsePandLExpenses({})).toBe(0)
    })
  })

  // ── calculateMoMGrowth ────────────────────────────────────────────────

  describe('calculateMoMGrowth', () => {
    it('calculates positive month-on-month growth percentage', () => {
      const report = {
        Reports: [{
          Rows: [{
            RowType: 'Section',
            Title: 'Income',
            Rows: [{
              RowType: 'SummaryRow',
              // Cells[1] = current (11,000), Cells[2] = prior (10,000)
              Cells: [{ Value: 'Total' }, { Value: '11,000.00' }, { Value: '10,000.00' }],
            }],
          }],
        }],
      }
      // (11000 - 10000) / 10000 * 100 = 10%
      expect(calculateMoMGrowth(report)).toBe(10)
    })

    it('calculates negative month-on-month growth', () => {
      const report = {
        Reports: [{
          Rows: [{
            RowType: 'Section',
            Title: 'Income',
            Rows: [{
              RowType: 'SummaryRow',
              Cells: [{ Value: 'Total' }, { Value: '9,000.00' }, { Value: '10,000.00' }],
            }],
          }],
        }],
      }
      // (9000 - 10000) / 10000 * 100 = -10%
      expect(calculateMoMGrowth(report)).toBe(-10)
    })

    it('returns 0 when prior period is zero (no division by zero)', () => {
      const report = {
        Reports: [{
          Rows: [{
            RowType: 'Section',
            Title: 'Income',
            Rows: [{
              RowType: 'SummaryRow',
              Cells: [{ Value: 'Total' }, { Value: '5,000.00' }, { Value: '0' }],
            }],
          }],
        }],
      }
      expect(calculateMoMGrowth(report)).toBe(0)
    })

    it('returns 0 for empty report', () => {
      expect(calculateMoMGrowth({})).toBe(0)
    })
  })

  // ── Token management ──────────────────────────────────────────────────

  describe('refreshXeroToken', () => {
    it('exchanges refresh token for new access token', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access',
          refresh_token: 'new-refresh',
          expires_in: 1800,
        }),
      })

      const result = await refreshXeroToken(MOCK_TOKENS)

      expect(result.access_token).toBe('new-access')
      expect(result.refresh_token).toBe('new-refresh')
      expect(result.tenant_id).toBe(MOCK_TOKENS.tenant_id)
      expect(result.expires_at).toBeGreaterThan(Date.now())
    })

    it('throws when refresh fails', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: false })

      await expect(refreshXeroToken(MOCK_TOKENS)).rejects.toThrow('Xero token refresh failed')
    })

    it('keeps old refresh token when new one is not returned', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'new-access',
          refresh_token: undefined,
          expires_in: 1800,
        }),
      })

      const result = await refreshXeroToken(MOCK_TOKENS)
      expect(result.refresh_token).toBe(MOCK_TOKENS.refresh_token)
    })
  })

  describe('getValidXeroToken', () => {
    it('returns existing token when it is still valid', async () => {
      const result = await getValidXeroToken(MOCK_TOKENS)
      expect(result).toBe(MOCK_TOKENS)
    })

    it('refreshes token when it is near expiry', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'refreshed',
          refresh_token: 'refreshed-rt',
          expires_in: 1800,
        }),
      })

      const result = await getValidXeroToken(EXPIRED_TOKENS)
      expect(result.access_token).toBe('refreshed')
    })
  })

  // ── Vault operations ──────────────────────────────────────────────────

  describe('loadXeroTokens', () => {
    it('loads and decrypts tokens from the vault', async () => {
      setupVaultMock(MOCK_TOKENS)

      const result = await loadXeroTokens(FOUNDER_ID, BUSINESS_KEY)

      expect(result).not.toBeNull()
      expect(result!.access_token).toBe(MOCK_TOKENS.access_token)
      expect(result!.tenant_id).toBe(MOCK_TOKENS.tenant_id)
    })

    it('returns null when no vault entry exists', async () => {
      setupVaultMock(null)

      const result = await loadXeroTokens(FOUNDER_ID, BUSINESS_KEY)
      expect(result).toBeNull()
    })
  })

  describe('saveXeroTokens', () => {
    it('encrypts and upserts tokens to the vault', async () => {
      await saveXeroTokens(FOUNDER_ID, BUSINESS_KEY, MOCK_TOKENS)

      expect(mockFrom).toHaveBeenCalledWith('credentials_vault')
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          founder_id: FOUNDER_ID,
          service: 'xero',
          label: BUSINESS_KEY,
          encrypted_value: expect.stringContaining('encrypted:'),
          iv: 'mock-iv',
          salt: 'mock-salt',
        }),
        { onConflict: 'founder_id,service,label' }
      )
    })

    it('throws when Supabase upsert returns an error', async () => {
      mockUpsert.mockReturnValueOnce({ error: { message: 'unique constraint violated' } })

      await expect(saveXeroTokens(FOUNDER_ID, BUSINESS_KEY, MOCK_TOKENS))
        .rejects.toThrow('Failed to save Xero tokens for dr: unique constraint violated')
    })
  })

  // ── getTokensForBusiness (tested indirectly via endpoint functions) ──

  describe('token persistence on refresh', () => {
    it('persists refreshed tokens back to the vault when they change', async () => {
      // Set up vault with expired tokens so a refresh will occur
      setupVaultMock(EXPIRED_TOKENS)

      // Mock the token refresh response
      const refreshResponse = {
        ok: true,
        json: () => Promise.resolve({
          access_token: 'refreshed-access',
          refresh_token: 'refreshed-refresh',
          expires_in: 1800,
        }),
      }

      // Mock fetch: first call = token refresh, second call = actual API call
      global.fetch = vi.fn()
        .mockResolvedValueOnce(refreshResponse)
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ Contacts: [] }),
        })

      await fetchContacts(FOUNDER_ID, BUSINESS_KEY)

      // Verify saveXeroTokens was called (upsert with new tokens)
      expect(mockUpsert).toHaveBeenCalledWith(
        expect.objectContaining({
          founder_id: FOUNDER_ID,
          service: 'xero',
          label: BUSINESS_KEY,
        }),
        { onConflict: 'founder_id,service,label' }
      )
    })

    it('does not persist tokens when they have not changed', async () => {
      // Set up vault with valid (non-expired) tokens
      setupVaultMock(MOCK_TOKENS)

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Contacts: [] }),
      })

      await fetchContacts(FOUNDER_ID, BUSINESS_KEY)

      // saveXeroTokens should NOT have been called (mockUpsert not invoked)
      expect(mockUpsert).not.toHaveBeenCalled()
    })
  })

  // ── xeroApiFetch ──────────────────────────────────────────────────────

  describe('xeroApiFetch', () => {
    it('makes authenticated GET request with correct headers', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const promise = xeroApiFetch(MOCK_TOKENS, '/TestEndpoint')
      await vi.advanceTimersByTimeAsync(1_000)
      await promise

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.xero.com/api.xro/2.0/TestEndpoint',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: `Bearer ${MOCK_TOKENS.access_token}`,
            'Xero-Tenant-Id': MOCK_TOKENS.tenant_id,
            Accept: 'application/json',
          }),
        })
      )
    })

    it('makes PUT request with JSON body when specified', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: true }),
      })

      const body = { BankTransactions: [{ IsReconciled: true }] }
      const promise = xeroApiFetch(MOCK_TOKENS, '/BankTransactions', { method: 'PUT', body })
      await vi.advanceTimersByTimeAsync(1_000)
      await promise

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.xero.com/api.xro/2.0/BankTransactions',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(body),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('throws with status code on API error', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        text: () => Promise.resolve('Forbidden'),
      })

      // Attach rejection handler immediately to prevent PromiseRejectionHandledWarning
      const promise = xeroApiFetch(MOCK_TOKENS, '/TestEndpoint').catch((e: Error) => e)
      await vi.advanceTimersByTimeAsync(1_000)
      const error = await promise
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Xero API error 403: Forbidden')
    })

    it('applies rate-limit delay before making the API call', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: 'test' }),
      })

      const start = Date.now()
      const promise = xeroApiFetch(MOCK_TOKENS, '/TestEndpoint')
      await vi.advanceTimersByTimeAsync(1_000)
      await promise
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(1_000)
    })
  })

  // ── fetchBankTransactions ─────────────────────────────────────────────

  describe('fetchBankTransactions', () => {
    beforeEach(() => {
      setupVaultMock(MOCK_TOKENS)
    })

    it('fetches bank transactions with date filters', async () => {
      const mockTransactions = [
        { BankTransactionID: 'bt-1', Type: 'RECEIVE', Total: 500, IsReconciled: false },
        { BankTransactionID: 'bt-2', Type: 'SPEND', Total: 200, IsReconciled: true },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          BankTransactions: mockTransactions,
          pagination: { page: 1, pageCount: 1, pageSize: 100, itemCount: 2 },
        }),
      })

      const result = await fetchBankTransactions(FOUNDER_ID, BUSINESS_KEY, {
        fromDate: '2026-03-01',
        toDate: '2026-03-10',
        page: 1,
      })

      expect(result.items).toHaveLength(2)
      expect(result.items[0].BankTransactionID).toBe('bt-1')
      expect(result.pagination?.itemCount).toBe(2)

      // Verify the URL includes date filter
      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('BankTransactions')
      // URLSearchParams encodes parentheses and commas
      expect(url).toContain('DateTime%282026%2C3%2C1%29')
      expect(url).toContain('DateTime%282026%2C3%2C10%29')
    })

    it('fetches with defaults when no options provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ BankTransactions: [] }),
      })

      const result = await fetchBankTransactions(FOUNDER_ID, BUSINESS_KEY)

      expect(result.items).toHaveLength(0)

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('page=1')
    })

    it('throws when no vault tokens exist', async () => {
      setupVaultMock(null)

      await expect(fetchBankTransactions(FOUNDER_ID, BUSINESS_KEY))
        .rejects.toThrow('No Xero tokens found for business "dr"')
    })
  })

  // ── fetchInvoices ─────────────────────────────────────────────────────

  describe('fetchInvoices', () => {
    beforeEach(() => {
      setupVaultMock(MOCK_TOKENS)
    })

    it('fetches sales invoices (ACCREC) with date filter', async () => {
      const mockInvoices = [
        { InvoiceID: 'inv-1', Type: 'ACCREC', Total: 1100, Status: 'AUTHORISED' },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Invoices: mockInvoices }),
      })

      const result = await fetchInvoices(FOUNDER_ID, BUSINESS_KEY, {
        type: 'ACCREC',
        fromDate: '2026-03-01',
      })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].Type).toBe('ACCREC')

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('Type%3D%3D%22ACCREC%22')
      // URLSearchParams encodes parentheses and commas
      expect(url).toContain('DateTime%282026%2C3%2C1%29')
    })

    it('fetches bills (ACCPAY)', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Invoices: [{ InvoiceID: 'bill-1', Type: 'ACCPAY' }] }),
      })

      const result = await fetchInvoices(FOUNDER_ID, BUSINESS_KEY, { type: 'ACCPAY' })

      expect(result.items).toHaveLength(1)
      expect(result.items[0].Type).toBe('ACCPAY')
    })

    it('fetches all invoice types when no type filter specified', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Invoices: [] }),
      })

      await fetchInvoices(FOUNDER_ID, BUSINESS_KEY)

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const url = fetchCall[0] as string
      // Should NOT contain Type filter
      expect(url).not.toContain('Type')
    })

    it('passes page parameter to the Xero API', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          Invoices: [],
          pagination: { page: 3, pageCount: 5, pageSize: 100, itemCount: 450 },
        }),
      })

      const result = await fetchInvoices(FOUNDER_ID, BUSINESS_KEY, { page: 3 })

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('page=3')
      expect(result.pagination?.page).toBe(3)
    })

    it('defaults to page 1 when no page option provided', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Invoices: [] }),
      })

      await fetchInvoices(FOUNDER_ID, BUSINESS_KEY, { type: 'ACCREC' })

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const url = fetchCall[0] as string
      expect(url).toContain('page=1')
    })
  })

  // ── fetchContacts ─────────────────────────────────────────────────────

  describe('fetchContacts', () => {
    beforeEach(() => {
      setupVaultMock(MOCK_TOKENS)
    })

    it('fetches all contacts', async () => {
      const mockContacts = [
        { ContactID: 'c-1', Name: 'Acme Corp', EmailAddress: 'info@acme.com.au' },
        { ContactID: 'c-2', Name: 'Smith Trading', EmailAddress: 'smith@trading.com.au' },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Contacts: mockContacts }),
      })

      const result = await fetchContacts(FOUNDER_ID, BUSINESS_KEY)

      expect(result).toHaveLength(2)
      expect(result[0].Name).toBe('Acme Corp')
    })

    it('returns empty array when no contacts exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Contacts: [] }),
      })

      const result = await fetchContacts(FOUNDER_ID, BUSINESS_KEY)
      expect(result).toHaveLength(0)
    })
  })

  // ── fetchAccounts ─────────────────────────────────────────────────────

  describe('fetchAccounts', () => {
    beforeEach(() => {
      setupVaultMock(MOCK_TOKENS)
    })

    it('fetches chart of accounts', async () => {
      const mockAccounts = [
        { AccountID: 'a-1', Code: '200', Name: 'Sales Revenue', Type: 'REVENUE' },
        { AccountID: 'a-2', Code: '400', Name: 'Advertising', Type: 'EXPENSE' },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ Accounts: mockAccounts }),
      })

      const result = await fetchAccounts(FOUNDER_ID, BUSINESS_KEY)

      expect(result).toHaveLength(2)
      expect(result[0].Code).toBe('200')
      expect(result[1].Type).toBe('EXPENSE')
    })
  })

  // ── fetchTaxRates ─────────────────────────────────────────────────────

  describe('fetchTaxRates', () => {
    beforeEach(() => {
      setupVaultMock(MOCK_TOKENS)
    })

    it('fetches tax rates', async () => {
      const mockTaxRates = [
        { Name: 'GST on Income', TaxType: 'OUTPUT', EffectiveRate: 10, Status: 'ACTIVE' },
        { Name: 'GST on Expenses', TaxType: 'INPUT', EffectiveRate: 10, Status: 'ACTIVE' },
        { Name: 'BAS Excluded', TaxType: 'EXEMPTEXPENSES', EffectiveRate: 0, Status: 'ACTIVE' },
      ]

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ TaxRates: mockTaxRates }),
      })

      const result = await fetchTaxRates(FOUNDER_ID, BUSINESS_KEY)

      expect(result).toHaveLength(3)
      expect(result[0].Name).toBe('GST on Income')
      expect(result[0].EffectiveRate).toBe(10)
    })
  })

  // ── reconcileTransaction ──────────────────────────────────────────────

  describe('reconcileTransaction', () => {
    beforeEach(() => {
      setupVaultMock(MOCK_TOKENS)
    })

    it('reconciles a bank transaction', async () => {
      const reconciled = {
        BankTransactionID: 'bt-1',
        IsReconciled: true,
        Type: 'RECEIVE',
        Total: 500,
      }

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ BankTransactions: [reconciled] }),
      })

      const result = await reconcileTransaction(FOUNDER_ID, BUSINESS_KEY, 'bt-1')

      expect(result.BankTransactionID).toBe('bt-1')
      expect(result.IsReconciled).toBe(true)

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const requestInit = fetchCall[1] as RequestInit
      expect(requestInit.method).toBe('PUT')

      const body = JSON.parse(requestInit.body as string)
      expect(body.BankTransactions[0].IsReconciled).toBe(true)
    })

    it('reconciles with an invoice ID link', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          BankTransactions: [{ BankTransactionID: 'bt-2', IsReconciled: true }],
        }),
      })

      await reconcileTransaction(FOUNDER_ID, BUSINESS_KEY, 'bt-2', 'inv-1')

      const fetchCall = vi.mocked(global.fetch).mock.calls[0]
      const body = JSON.parse((fetchCall[1] as RequestInit).body as string)
      expect(body.BankTransactions[0].LineItems[0].LinkedTransactions[0].SourceTransactionID).toBe('inv-1')
    })

    it('throws when reconciliation returns no result', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ BankTransactions: [] }),
      })

      await expect(reconcileTransaction(FOUNDER_ID, BUSINESS_KEY, 'bt-999'))
        .rejects.toThrow('Reconciliation failed for transaction bt-999')
    })
  })

  // ── fetchRevenueMTD ───────────────────────────────────────────────────

  describe('fetchRevenueMTD', () => {
    it('returns mock data when Xero is not configured', async () => {
      delete process.env.XERO_CLIENT_ID

      const result = await fetchRevenueMTD(FOUNDER_ID, BUSINESS_KEY)

      expect(result.source).toBe('mock')
      expect(result.data.businessKey).toBe(BUSINESS_KEY)
    })

    it('returns mock data when no vault tokens exist', async () => {
      setupVaultMock(null)

      const result = await fetchRevenueMTD(FOUNDER_ID, BUSINESS_KEY)
      expect(result.source).toBe('mock')
    })

    it('fetches real revenue, expenses, growth and invoice count from Xero', async () => {
      setupVaultMock(MOCK_TOKENS)

      // Two-period P&L: Cells[1] = current, Cells[2] = prior
      const pandlResponse = {
        Reports: [{
          Rows: [
            {
              RowType: 'Section',
              Title: 'Income',
              Rows: [{
                RowType: 'SummaryRow',
                Cells: [{ Value: 'Total Income' }, { Value: '15,000.00' }, { Value: '12,000.00' }],
              }],
            },
            {
              RowType: 'Section',
              Title: 'Less Cost of Sales',
              Rows: [{
                RowType: 'SummaryRow',
                Cells: [{ Value: 'Total CoS' }, { Value: '4,000.00' }],
              }],
            },
            {
              RowType: 'Section',
              Title: 'Less Operating Expenses',
              Rows: [{
                RowType: 'SummaryRow',
                Cells: [{ Value: 'Total OpEx' }, { Value: '3,500.00' }],
              }],
            },
          ],
        }],
      }

      const invoiceResponse = {
        Invoices: [
          { InvoiceID: 'inv-1', Type: 'ACCREC', Status: 'PAID', Total: 5000 },
          { InvoiceID: 'inv-2', Type: 'ACCREC', Status: 'PAID', Total: 10000 },
        ],
      }

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(pandlResponse) })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(invoiceResponse) })

      const result = await fetchRevenueMTD(FOUNDER_ID, BUSINESS_KEY)

      expect(result.source).toBe('xero')
      expect(result.data.revenueCents).toBe(1_500_000)  // 15,000.00
      expect(result.data.expensesCents).toBe(750_000)   // 4,000 + 3,500 = 7,500
      expect(result.data.growth).toBe(25)               // (15000 - 12000) / 12000 * 100 = 25%
      expect(result.data.invoiceCount).toBe(2)
    })

    it('returns live revenue data even when invoice count fetch fails', async () => {
      setupVaultMock(MOCK_TOKENS)

      const pandlResponse = {
        Reports: [{
          Rows: [{
            RowType: 'Section',
            Title: 'Income',
            Rows: [{
              RowType: 'SummaryRow',
              Cells: [{ Value: 'Total Income' }, { Value: '10,000.00' }, { Value: '8,000.00' }],
            }],
          }],
        }],
      }

      global.fetch = vi.fn()
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(pandlResponse) })
        .mockResolvedValueOnce({ ok: false, status: 429 }) // invoice count rate-limited

      const result = await fetchRevenueMTD(FOUNDER_ID, BUSINESS_KEY)

      // Primary data intact — invoice count gracefully degraded
      expect(result.source).toBe('xero')
      expect(result.data.revenueCents).toBe(1_000_000)
      expect(result.data.invoiceCount).toBe(0)
    })

    it('falls back to mock when P&L API call fails', async () => {
      setupVaultMock(MOCK_TOKENS)

      global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

      const result = await fetchRevenueMTD(FOUNDER_ID, BUSINESS_KEY)
      expect(result.source).toBe('mock')
    })
  })

  // ── Rate limiting (centralised in xeroApiFetch) ────────────────────────

  describe('rate limiting', () => {
    beforeEach(() => {
      setupVaultMock(MOCK_TOKENS)
    })

    it('applies a 1-second delay before each API call via xeroApiFetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ BankTransactions: [] }),
      })

      const start = Date.now()
      const promise = fetchBankTransactions(FOUNDER_ID, BUSINESS_KEY)
      // Advance timers to let the centralised delay resolve
      await vi.advanceTimersByTimeAsync(1_000)
      await promise
      const elapsed = Date.now() - start

      expect(elapsed).toBeGreaterThanOrEqual(1_000)
    })
  })
})
