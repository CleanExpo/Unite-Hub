// src/lib/advisory/__tests__/auto-trigger.test.ts
import { vi, describe, it, expect, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks — declared before SUT import
// ---------------------------------------------------------------------------

const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockIn = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  createServiceClient: () => ({
    from: mockFrom,
  }),
}))

const mockCollectFinancialContext = vi.fn()
vi.mock('@/lib/advisory/financial-context', () => ({
  collectFinancialContext: (...args: unknown[]) => mockCollectFinancialContext(...args),
}))

// ---------------------------------------------------------------------------
// System under test
// ---------------------------------------------------------------------------

import { triggerMacasAdvisory, type AutoTriggerInput } from '../auto-trigger'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeInput(overrides: Partial<AutoTriggerInput> = {}): AutoTriggerInput {
  return {
    founderId: 'founder-uuid',
    runId: 'run-uuid',
    runCompletedAt: '2026-03-24T11:00:00Z',
    businessResults: [
      {
        businessKey: 'synthex',
        businessName: 'Synthex',
        status: 'success',
        transactionCount: 100,
        autoReconciled: 90,
        flaggedForReview: 5,
      },
    ],
    ...overrides,
  }
}

function setupSupabaseMocks({ insertError = null }: { insertError?: unknown } = {}) {
  // Businesses lookup
  const businessesChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockResolvedValue({ data: [{ id: 'biz-uuid', key: 'synthex' }], error: null }),
  }

  // Advisory cases insert
  const casesChain = {
    insert: vi.fn().mockResolvedValue({ error: insertError }),
  }

  mockFrom.mockImplementation((table: string) => {
    if (table === 'businesses') return businessesChain
    if (table === 'advisory_cases') return casesChain
    return casesChain
  })

  return { businessesChain, casesChain }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('triggerMacasAdvisory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCollectFinancialContext.mockResolvedValue({
      businessKey: 'synthex',
      businessName: 'Synthex',
      snapshotDate: '2026-03-24T11:00:00Z',
    })
  })

  it('creates an advisory case for a business that passes the readiness gate', async () => {
    const { casesChain } = setupSupabaseMocks()
    const result = await triggerMacasAdvisory(makeInput())

    expect(result.casesCreated).toBe(1)
    expect(result.businessesSkipped).toBe(0)
    expect(result.errors).toHaveLength(0)
    expect(casesChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        source: 'auto-bookkeeper',
        status: 'draft',
        founder_id: 'founder-uuid',
        title: expect.stringContaining('Synthex'),
      })
    )
  })

  it('includes business_id UUID when businesses table lookup succeeds', async () => {
    const { casesChain } = setupSupabaseMocks()
    await triggerMacasAdvisory(makeInput())

    expect(casesChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ business_id: 'biz-uuid' })
    )
  })

  it('sets business_id to null when businesses table lookup returns no match', async () => {
    // Businesses lookup returns empty
    const businessesChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({ data: [], error: null }),
    }
    const casesChain = { insert: vi.fn().mockResolvedValue({ error: null }) }
    mockFrom.mockImplementation((table: string) => {
      if (table === 'businesses') return businessesChain
      return casesChain
    })

    await triggerMacasAdvisory(makeInput())

    expect(casesChain.insert).toHaveBeenCalledWith(
      expect.objectContaining({ business_id: null })
    )
  })

  it('skips client-type businesses (ccw) without creating a case', async () => {
    const { casesChain } = setupSupabaseMocks()
    const result = await triggerMacasAdvisory(
      makeInput({
        businessResults: [
          {
            businessKey: 'ccw',
            businessName: 'CCW-ERP/CRM',
            status: 'success',
            transactionCount: 50,
            autoReconciled: 45,
            flaggedForReview: 2,
          },
        ],
      })
    )

    expect(result.casesCreated).toBe(0)
    expect(result.businessesSkipped).toBe(1)
    expect(casesChain.insert).not.toHaveBeenCalled()
  })

  it('skips businesses with high unreconciled ratios', async () => {
    const { casesChain } = setupSupabaseMocks()
    const result = await triggerMacasAdvisory(
      makeInput({
        businessResults: [
          {
            businessKey: 'synthex',
            businessName: 'Synthex',
            status: 'success',
            transactionCount: 100,
            autoReconciled: 70,
            flaggedForReview: 30, // 30% > 20% threshold
          },
        ],
      })
    )

    expect(result.casesCreated).toBe(0)
    expect(result.businessesSkipped).toBe(1)
    expect(casesChain.insert).not.toHaveBeenCalled()
  })

  it('records errors when the DB insert fails but does not throw', async () => {
    setupSupabaseMocks({ insertError: { message: 'DB constraint violation' } })

    const result = await triggerMacasAdvisory(makeInput())

    expect(result.casesCreated).toBe(0)
    expect(result.errors).toHaveLength(1)
    expect(result.errors[0]).toMatch(/synthex/i)
  })

  it('returns early with zero cases when no businesses pass the gate', async () => {
    const { casesChain } = setupSupabaseMocks()
    const result = await triggerMacasAdvisory(
      makeInput({
        businessResults: [
          {
            businessKey: 'synthex',
            businessName: 'Synthex',
            status: 'error',
            transactionCount: 0,
            autoReconciled: 0,
            flaggedForReview: 0,
          },
        ],
      })
    )

    expect(result.casesCreated).toBe(0)
    expect(casesChain.insert).not.toHaveBeenCalled()
  })

  it('collects financial context for each ready business', async () => {
    setupSupabaseMocks()
    await triggerMacasAdvisory(makeInput())

    expect(mockCollectFinancialContext).toHaveBeenCalledWith('founder-uuid', 'synthex')
  })

  it('builds a title containing business name and period label', async () => {
    const { casesChain } = setupSupabaseMocks()
    await triggerMacasAdvisory(makeInput())

    const insertArg = casesChain.insert.mock.calls[0][0]
    expect(insertArg.title).toContain('Synthex')
    expect(insertArg.title).toContain('March 2026')
  })
})
