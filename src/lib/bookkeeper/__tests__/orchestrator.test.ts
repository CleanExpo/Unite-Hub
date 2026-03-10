// src/lib/bookkeeper/__tests__/orchestrator.test.ts
// Tests for the nightly bookkeeper orchestrator pipeline.

import { vi, describe, it, expect, beforeEach } from 'vitest'
import type {
  XeroBankTransaction,
  XeroInvoice,
  XeroContact,
  StoredXeroTokens,
} from '@/lib/integrations/xero/types'
import type { ReconciliationResult } from '../reconciliation'
import type { DeductionOptimisationResult } from '../deduction-optimiser'
import type { BASCalculation, BASPeriod } from '../bas-calculator'

// ---------------------------------------------------------------------------
// Mock modules BEFORE importing the system under test
// ---------------------------------------------------------------------------

// Mock Supabase service client
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: mockFrom,
  }),
}))

// Mock Xero client
const mockLoadXeroTokens = vi.fn()
const mockGetValidXeroToken = vi.fn()
const mockSaveXeroTokens = vi.fn()
const mockFetchBankTransactions = vi.fn()
const mockFetchInvoices = vi.fn()
const mockFetchContacts = vi.fn()

vi.mock('@/lib/integrations/xero/client', () => ({
  loadXeroTokens: (...args: unknown[]) => mockLoadXeroTokens(...args),
  getValidXeroToken: (...args: unknown[]) => mockGetValidXeroToken(...args),
  saveXeroTokens: (...args: unknown[]) => mockSaveXeroTokens(...args),
  fetchBankTransactions: (...args: unknown[]) => mockFetchBankTransactions(...args),
  fetchInvoices: (...args: unknown[]) => mockFetchInvoices(...args),
  fetchContacts: (...args: unknown[]) => mockFetchContacts(...args),
}))

// Mock reconciliation
const mockReconcileTransactions = vi.fn()
vi.mock('@/lib/bookkeeper/reconciliation', () => ({
  reconcileTransactions: (...args: unknown[]) => mockReconcileTransactions(...args),
}))

// Mock deduction optimiser
const mockOptimiseDeductions = vi.fn()
vi.mock('@/lib/bookkeeper/deduction-optimiser', () => ({
  optimiseDeductions: (...args: unknown[]) => mockOptimiseDeductions(...args),
}))

// Mock BAS calculator
const mockCalculateBAS = vi.fn()
const mockGetFinancialYearQuarter = vi.fn()
vi.mock('@/lib/bookkeeper/bas-calculator', () => ({
  calculateBAS: (...args: unknown[]) => mockCalculateBAS(...args),
  getFinancialYearQuarter: (...args: unknown[]) => mockGetFinancialYearQuarter(...args),
}))

// NOW import the system under test (after all mocks are set up)
import { runBookkeeperForAllBusinesses, processOneBusiness } from '../orchestrator'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const FOUNDER_ID = 'founder-001'
const RUN_ID = 'run-001'

function makeTokens(overrides: Partial<StoredXeroTokens> = {}): StoredXeroTokens {
  return {
    access_token: 'valid-access-token',
    refresh_token: 'valid-refresh-token',
    expires_at: Date.now() + 3600_000, // 1 hour from now
    tenant_id: 'tenant-001',
    ...overrides,
  }
}

function makeBankTxn(overrides: Partial<XeroBankTransaction> = {}): XeroBankTransaction {
  return {
    BankTransactionID: 'bt-001',
    Type: 'SPEND',
    Contact: { ContactID: 'c-001', Name: 'Supplier Co' },
    LineItems: [{ LineItemID: 'li-001', Description: 'Office supplies' }],
    BankAccount: { AccountID: 'ba-001' },
    Total: -550.00,
    Date: '2026-03-01T00:00:00',
    Status: 'AUTHORISED',
    IsReconciled: false,
    ...overrides,
  }
}

function makeInvoice(overrides: Partial<XeroInvoice> = {}): XeroInvoice {
  return {
    InvoiceID: 'inv-001',
    Type: 'ACCPAY',
    InvoiceNumber: 'BILL-0001',
    Contact: { ContactID: 'c-001', Name: 'Supplier Co' },
    Total: 550.00,
    AmountDue: 550.00,
    AmountPaid: 0,
    Status: 'AUTHORISED',
    Date: '2026-02-25T00:00:00',
    DueDate: '2026-03-01T00:00:00',
    ...overrides,
  }
}

function makeContact(overrides: Partial<XeroContact> = {}): XeroContact {
  return {
    ContactID: 'c-001',
    Name: 'Supplier Co',
    ...overrides,
  }
}

const defaultBASPeriod: BASPeriod = {
  startDate: new Date(2026, 0, 1), // Q3 FY2025-26 (Jan-Mar)
  endDate: new Date(2026, 2, 31),
  label: 'Q3 FY2025-26 (Jan-Mar 2026)',
}

const defaultBASResult: BASCalculation = {
  period: defaultBASPeriod,
  label1A_totalSalesCents: 0,
  label1B_gstOnSalesCents: 5000,
  label7_totalPurchasesCents: 0,
  label9_gstOnPurchasesCents: 3000,
  label11_gstPayableCents: 2000,
  transactionCount: 1,
  gstFreeIncomeCents: 0,
  gstFreeExpensesCents: 0,
  basExcludedCents: 0,
  inputTaxedCents: 0,
  breakdownByTaxCode: {},
}

function makeReconciliationResult(matchCount = 1): ReconciliationResult {
  return {
    matches: Array.from({ length: matchCount }, (_, i) => ({
      bankTransactionId: `bt-${String(i + 1).padStart(3, '0')}`,
      matchedInvoiceId: null,
      matchedBillId: null,
      reconciliationStatus: 'auto_matched' as const,
      confidence: 0.95,
      taxCode: 'INPUT',
      taxCategory: null,
      isDeductible: true,
      gstAmountCents: 5000,
      deductionCategory: null,
      deductionNotes: null,
      reasoning: 'Test match',
    })),
    summary: {
      total: matchCount,
      autoMatched: matchCount,
      suggestedMatch: 0,
      unmatched: 0,
      manualReview: 0,
    },
  }
}

function makeDeductionResult(matchCount = 1): DeductionOptimisationResult {
  return {
    matches: Array.from({ length: matchCount }, (_, i) => ({
      bankTransactionId: `bt-${String(i + 1).padStart(3, '0')}`,
      matchedInvoiceId: null,
      matchedBillId: null,
      reconciliationStatus: 'auto_matched' as const,
      confidence: 0.95,
      taxCode: 'INPUT',
      taxCategory: null,
      isDeductible: true,
      gstAmountCents: 5000,
      deductionCategory: null,
      deductionNotes: null,
      reasoning: 'Test match',
    })),
    suggestions: [],
    totalDeductibleCents: matchCount * 55000,
    totalNonDeductibleCents: 0,
  }
}

// ---------------------------------------------------------------------------
// Setup: configure mock chains for Supabase
// ---------------------------------------------------------------------------

function setupSupabaseMocks(options?: {
  runId?: string
  insertError?: { message: string } | null
  runInsertError?: { message: string } | null
}) {
  const runId = options?.runId ?? RUN_ID

  mockFrom.mockImplementation((table: string) => {
    if (table === 'bookkeeper_runs') {
      return {
        insert: mockInsert.mockReturnValue({
          select: mockSelect.mockReturnValue({
            single: mockSingle.mockResolvedValue(
              options?.runInsertError
                ? { data: null, error: options.runInsertError }
                : { data: { id: runId }, error: null },
            ),
          }),
        }),
        update: mockUpdate.mockReturnValue({
          eq: mockEq.mockResolvedValue({ error: null }),
        }),
      }
    }
    if (table === 'bookkeeper_transactions') {
      return {
        insert: mockInsert.mockResolvedValue({
          error: options?.insertError ?? null,
        }),
      }
    }
    return { insert: vi.fn().mockResolvedValue({ error: null }) }
  })
}

function setupDefaultMocks() {
  const tokens = makeTokens()
  const bankTxns = [makeBankTxn()]
  const invoices = [makeInvoice()]
  const contacts = [makeContact()]
  const reconciliation = makeReconciliationResult()
  const deductions = makeDeductionResult()

  mockLoadXeroTokens.mockResolvedValue(tokens)
  mockGetValidXeroToken.mockResolvedValue(tokens)
  mockSaveXeroTokens.mockResolvedValue(undefined)
  mockFetchBankTransactions.mockResolvedValue({ items: bankTxns, pagination: undefined })
  mockFetchInvoices.mockResolvedValue({ items: invoices, pagination: undefined })
  mockFetchContacts.mockResolvedValue(contacts)
  mockReconcileTransactions.mockReturnValue(reconciliation)
  mockOptimiseDeductions.mockReturnValue(deductions)
  mockGetFinancialYearQuarter.mockReturnValue(defaultBASPeriod)
  mockCalculateBAS.mockReturnValue(defaultBASResult)

  setupSupabaseMocks()
}

beforeEach(() => {
  vi.clearAllMocks()
  setupDefaultMocks()
})

// ---------------------------------------------------------------------------
// processOneBusiness
// ---------------------------------------------------------------------------

describe('processOneBusiness', () => {
  it('returns skipped status when no Xero tokens are found', async () => {
    mockLoadXeroTokens.mockResolvedValue(null)

    const mockSupabase = { from: mockFrom } as unknown as import('@supabase/supabase-js').SupabaseClient

    const result = await processOneBusiness(FOUNDER_ID, 'dr', 'Disaster Recovery', RUN_ID, mockSupabase)

    expect(result.status).toBe('skipped')
    expect(result.error).toContain('No Xero tokens')
    expect(result.transactionCount).toBe(0)
    expect(mockFetchBankTransactions).not.toHaveBeenCalled()
  })

  it('persists refreshed tokens when access token changes', async () => {
    const originalTokens = makeTokens({ access_token: 'old-token' })
    const refreshedTokens = makeTokens({ access_token: 'new-token' })

    mockLoadXeroTokens.mockResolvedValue(originalTokens)
    mockGetValidXeroToken.mockResolvedValue(refreshedTokens)

    const mockSupabase = { from: mockFrom } as unknown as import('@supabase/supabase-js').SupabaseClient

    await processOneBusiness(FOUNDER_ID, 'dr', 'Disaster Recovery', RUN_ID, mockSupabase)

    expect(mockSaveXeroTokens).toHaveBeenCalledWith(FOUNDER_ID, 'dr', refreshedTokens)
  })

  it('does not persist tokens when they have not changed', async () => {
    const tokens = makeTokens()
    mockLoadXeroTokens.mockResolvedValue(tokens)
    mockGetValidXeroToken.mockResolvedValue(tokens)

    const mockSupabase = { from: mockFrom } as unknown as import('@supabase/supabase-js').SupabaseClient

    await processOneBusiness(FOUNDER_ID, 'dr', 'Disaster Recovery', RUN_ID, mockSupabase)

    expect(mockSaveXeroTokens).not.toHaveBeenCalled()
  })

  it('calls reconcileTransactions with fetched data', async () => {
    const mockSupabase = { from: mockFrom } as unknown as import('@supabase/supabase-js').SupabaseClient

    await processOneBusiness(FOUNDER_ID, 'dr', 'Disaster Recovery', RUN_ID, mockSupabase)

    expect(mockReconcileTransactions).toHaveBeenCalledTimes(1)
    expect(mockOptimiseDeductions).toHaveBeenCalledTimes(1)
    expect(mockCalculateBAS).toHaveBeenCalledTimes(1)
  })

  it('returns success with correct transaction counts', async () => {
    const deductions = makeDeductionResult(3)
    // Make one match flagged for review
    deductions.matches[2].reconciliationStatus = 'manual_review'
    mockOptimiseDeductions.mockReturnValue(deductions)

    const mockSupabase = { from: mockFrom } as unknown as import('@supabase/supabase-js').SupabaseClient

    const result = await processOneBusiness(FOUNDER_ID, 'dr', 'Disaster Recovery', RUN_ID, mockSupabase)

    expect(result.status).toBe('success')
    expect(result.transactionCount).toBe(3)
    expect(result.autoReconciled).toBe(2)
    expect(result.flaggedForReview).toBe(1)
  })

  it('returns GST totals from BAS calculation', async () => {
    const mockSupabase = { from: mockFrom } as unknown as import('@supabase/supabase-js').SupabaseClient

    const result = await processOneBusiness(FOUNDER_ID, 'dr', 'Disaster Recovery', RUN_ID, mockSupabase)

    expect(result.gstCollectedCents).toBe(5000)
    expect(result.gstPaidCents).toBe(3000)
  })

  it('throws when transaction insert fails', async () => {
    setupSupabaseMocks({ insertError: { message: 'insert failed' } })

    const mockSupabase = { from: mockFrom } as unknown as import('@supabase/supabase-js').SupabaseClient

    await expect(
      processOneBusiness(FOUNDER_ID, 'dr', 'Disaster Recovery', RUN_ID, mockSupabase),
    ).rejects.toThrow('Failed to insert transaction records')
  })

  it('inserts records into bookkeeper_transactions', async () => {
    const mockSupabase = { from: mockFrom } as unknown as import('@supabase/supabase-js').SupabaseClient

    await processOneBusiness(FOUNDER_ID, 'dr', 'Disaster Recovery', RUN_ID, mockSupabase)

    // Verify that bookkeeper_transactions.insert was called
    expect(mockFrom).toHaveBeenCalledWith('bookkeeper_transactions')
  })
})

// ---------------------------------------------------------------------------
// runBookkeeperForAllBusinesses
// ---------------------------------------------------------------------------

describe('runBookkeeperForAllBusinesses', () => {
  it('creates a run record with running status', async () => {
    await runBookkeeperForAllBusinesses(FOUNDER_ID)

    expect(mockFrom).toHaveBeenCalledWith('bookkeeper_runs')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        founder_id: FOUNDER_ID,
        status: 'running',
        businesses_processed: [],
      }),
    )
  })

  it('throws when run record creation fails', async () => {
    setupSupabaseMocks({ runInsertError: { message: 'DB down' } })

    await expect(runBookkeeperForAllBusinesses(FOUNDER_ID)).rejects.toThrow(
      'Failed to create bookkeeper run record',
    )
  })

  it('skips businesses with planning status', async () => {
    // The BUSINESSES array has 'ato' with status: 'planning'
    // We track which business keys processOneBusiness is called with
    const processedKeys: string[] = []
    mockLoadXeroTokens.mockImplementation((_founderId: string, bizKey: string) => {
      processedKeys.push(bizKey)
      return Promise.resolve(makeTokens())
    })

    await runBookkeeperForAllBusinesses(FOUNDER_ID)

    // 'ato' has status: 'planning' — should NOT appear
    expect(processedKeys).not.toContain('ato')
    // All 7 active businesses should be processed
    expect(processedKeys).toHaveLength(7)
  })

  it('processes all active businesses', async () => {
    const processedKeys: string[] = []
    mockLoadXeroTokens.mockImplementation((_founderId: string, bizKey: string) => {
      processedKeys.push(bizKey)
      return Promise.resolve(makeTokens())
    })

    await runBookkeeperForAllBusinesses(FOUNDER_ID)

    expect(processedKeys).toContain('dr')
    expect(processedKeys).toContain('dr_qld')
    expect(processedKeys).toContain('nrpg')
    expect(processedKeys).toContain('carsi')
    expect(processedKeys).toContain('restore')
    expect(processedKeys).toContain('synthex')
    expect(processedKeys).toContain('ccw')
  })

  it('returns completed status when all businesses succeed', async () => {
    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    // Some may be 'skipped' (no tokens) but none should error
    // With our default mocks, all will succeed
    expect(result.status).toBe('completed')
  })

  it('returns partial status when some businesses fail', async () => {
    let callCount = 0
    mockLoadXeroTokens.mockImplementation(() => {
      callCount++
      if (callCount === 3) {
        return Promise.reject(new Error('Xero API timeout'))
      }
      return Promise.resolve(makeTokens())
    })

    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    expect(result.status).toBe('partial')
    expect(result.failedCount).toBe(1)
  })

  it('returns failed status when all businesses fail', async () => {
    mockLoadXeroTokens.mockRejectedValue(new Error('All tokens corrupted'))

    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    expect(result.status).toBe('failed')
    expect(result.failedCount).toBe(7)
  })

  it('error in one business does not prevent others from processing', async () => {
    let callCount = 0
    mockLoadXeroTokens.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(new Error('First business fails'))
      }
      return Promise.resolve(makeTokens())
    })

    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    // 1 failed, 6 succeeded
    const successResults = result.businessResults.filter((r) => r.status === 'success')
    const errorResults = result.businessResults.filter((r) => r.status === 'error')
    expect(errorResults).toHaveLength(1)
    expect(successResults).toHaveLength(6)
  })

  it('captures error message in business result', async () => {
    let callCount = 0
    mockLoadXeroTokens.mockImplementation(() => {
      callCount++
      if (callCount === 1) {
        return Promise.reject(new Error('Token vault unavailable'))
      }
      return Promise.resolve(makeTokens())
    })

    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    const errorResult = result.businessResults.find((r) => r.status === 'error')
    expect(errorResult?.error).toBe('Token vault unavailable')
  })

  it('aggregates GST totals across all businesses', async () => {
    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    // 7 active businesses, each with gstCollected=5000 and gstPaid=3000
    expect(result.gstCollectedCents).toBe(7 * 5000)
    expect(result.gstPaidCents).toBe(7 * 3000)
    expect(result.netGstCents).toBe(7 * (5000 - 3000))
  })

  it('aggregates transaction counts across all businesses', async () => {
    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    // 7 active businesses, each with 1 transaction
    expect(result.totalTransactions).toBe(7)
    expect(result.autoReconciled).toBe(7)
  })

  it('updates run record with final status on completion', async () => {
    await runBookkeeperForAllBusinesses(FOUNDER_ID)

    // Verify the update call was made on bookkeeper_runs
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
      }),
    )
  })

  it('includes error_log when businesses fail', async () => {
    let callCount = 0
    mockLoadXeroTokens.mockImplementation(() => {
      callCount++
      if (callCount === 2) {
        return Promise.reject(new Error('Rate limit exceeded'))
      }
      return Promise.resolve(makeTokens())
    })

    await runBookkeeperForAllBusinesses(FOUNDER_ID)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'partial',
        error_log: expect.arrayContaining([
          expect.objectContaining({
            error: 'Rate limit exceeded',
          }),
        ]),
      }),
    )
  })

  it('sets error_log to null when no errors occur', async () => {
    await runBookkeeperForAllBusinesses(FOUNDER_ID)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        error_log: null,
      }),
    )
  })

  it('returns correct runId in the result', async () => {
    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    expect(result.runId).toBe(RUN_ID)
  })

  it('returns valid timestamps', async () => {
    const before = new Date()
    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)
    const after = new Date()

    expect(result.startedAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(result.completedAt.getTime()).toBeLessThanOrEqual(after.getTime())
    expect(result.completedAt.getTime()).toBeGreaterThanOrEqual(result.startedAt.getTime())
  })

  it('handles businesses with no Xero tokens as skipped (not error)', async () => {
    mockLoadXeroTokens.mockResolvedValue(null)

    const result = await runBookkeeperForAllBusinesses(FOUNDER_ID)

    // All businesses skipped = no errors and no successes
    // Skipped businesses are not counted as errors
    const skippedResults = result.businessResults.filter((r) => r.status === 'skipped')
    const errorResults = result.businessResults.filter((r) => r.status === 'error')
    expect(skippedResults).toHaveLength(7)
    expect(errorResults).toHaveLength(0)
    // With all skipped (0 success, 0 error), status should be 'completed'
    expect(result.status).toBe('completed')
  })
})
