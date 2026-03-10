import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { BookkeeperRunResult } from '@/lib/bookkeeper/orchestrator'

// ── Mocks (hoisted above all imports by Vitest transform) ────────────────────

vi.mock('@/lib/bookkeeper/orchestrator', () => ({
  runBookkeeperForAllBusinesses: vi.fn(),
}))

// ── Static imports (resolved AFTER vi.mock() hoisting) ──────────────────────

import { runBookkeeperForAllBusinesses } from '@/lib/bookkeeper/orchestrator'
import { GET } from '../route'

// ── Mock helpers ────────────────────────────────────────────────────────────

const mockRunBookkeeper = vi.mocked(runBookkeeperForAllBusinesses)

function makeRequest(authHeader?: string): Request {
  const headers = new Headers()
  if (authHeader) {
    headers.set('authorization', authHeader)
  }
  return new Request('http://localhost:3000/api/cron/bookkeeper', {
    method: 'GET',
    headers,
  })
}

function makeSuccessResult(overrides?: Partial<BookkeeperRunResult>): BookkeeperRunResult {
  return {
    runId: 'run-123',
    status: 'completed',
    startedAt: new Date('2026-03-10T16:00:00Z'),
    completedAt: new Date('2026-03-10T16:02:00Z'),
    businessResults: [
      {
        businessKey: 'dr',
        businessName: 'Digital Rescue',
        status: 'success',
        transactionCount: 42,
        autoReconciled: 35,
        flaggedForReview: 7,
        gstCollectedCents: 150000,
        gstPaidCents: 30000,
      },
      {
        businessKey: 'carsi',
        businessName: 'Carsi Pty Ltd',
        status: 'success',
        transactionCount: 18,
        autoReconciled: 15,
        flaggedForReview: 3,
        gstCollectedCents: 80000,
        gstPaidCents: 20000,
      },
    ],
    totalTransactions: 60,
    autoReconciled: 50,
    flaggedForReview: 10,
    failedCount: 0,
    gstCollectedCents: 230000,
    gstPaidCents: 50000,
    netGstCents: 180000,
    ...overrides,
  }
}

// ── Tests ───────────────────────────────────────────────────────────────────

describe('GET /api/cron/bookkeeper', () => {
  const ORIGINAL_ENV = process.env

  beforeEach(() => {
    vi.clearAllMocks()
    // Isolate env changes per test
    process.env = {
      ...ORIGINAL_ENV,
      CRON_SECRET: 'test-cron-secret',
      FOUNDER_USER_ID: 'founder-uuid-123',
    }
  })

  afterEach(() => {
    process.env = ORIGINAL_ENV
  })

  // ── Authentication ──────────────────────────────────────────────────────

  it('returns 401 when no authorization header is provided', async () => {
    const response = await GET(makeRequest())
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorised')
  })

  it('returns 401 when authorization header has wrong secret', async () => {
    const response = await GET(makeRequest('Bearer wrong-secret'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorised')
  })

  it('returns 401 when authorization header format is invalid', async () => {
    const response = await GET(makeRequest('Basic test-cron-secret'))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.error).toBe('Unauthorised')
  })

  // ── Environment validation ──────────────────────────────────────────────

  it('returns 500 when FOUNDER_USER_ID is not set', async () => {
    delete process.env.FOUNDER_USER_ID

    const response = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.error).toBe('FOUNDER_USER_ID not configured')
  })

  // ── Successful run ──────────────────────────────────────────────────────

  it('returns 200 with run results on successful orchestrator execution', async () => {
    mockRunBookkeeper.mockResolvedValue(makeSuccessResult())

    const response = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.runId).toBe('run-123')
    expect(body.status).toBe('completed')
  })

  it('calls runBookkeeperForAllBusinesses with the correct founder ID', async () => {
    mockRunBookkeeper.mockResolvedValue(makeSuccessResult())

    await GET(makeRequest('Bearer test-cron-secret'))

    expect(mockRunBookkeeper).toHaveBeenCalledOnce()
    expect(mockRunBookkeeper).toHaveBeenCalledWith('founder-uuid-123')
  })

  it('response includes correct summary fields', async () => {
    mockRunBookkeeper.mockResolvedValue(makeSuccessResult())

    const response = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await response.json()

    expect(body.totalTransactions).toBe(60)
    expect(body.autoReconciled).toBe(50)
    expect(body.flaggedForReview).toBe(10)
    expect(body.gstCollectedCents).toBe(230000)
    expect(body.gstPaidCents).toBe(50000)
    expect(body.netGstCents).toBe(180000)
    expect(typeof body.durationMs).toBe('number')
  })

  it('response includes per-business summaries', async () => {
    mockRunBookkeeper.mockResolvedValue(makeSuccessResult())

    const response = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await response.json()

    expect(body.businessResults).toHaveLength(2)
    expect(body.businessResults[0]).toEqual({
      businessKey: 'dr',
      status: 'success',
      transactionCount: 42,
      error: undefined,
    })
    expect(body.businessResults[1]).toEqual({
      businessKey: 'carsi',
      status: 'success',
      transactionCount: 18,
      error: undefined,
    })
  })

  it('returns success=false when orchestrator status is "failed"', async () => {
    mockRunBookkeeper.mockResolvedValue(
      makeSuccessResult({ status: 'failed', failedCount: 2 })
    )

    const response = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(false)
    expect(body.status).toBe('failed')
  })

  it('returns success=true when orchestrator status is "partial"', async () => {
    mockRunBookkeeper.mockResolvedValue(
      makeSuccessResult({ status: 'partial', failedCount: 1 })
    )

    const response = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.status).toBe('partial')
  })

  // ── Error handling ──────────────────────────────────────────────────────

  it('returns 500 when orchestrator throws an error', async () => {
    mockRunBookkeeper.mockRejectedValue(new Error('Xero API rate limit exceeded'))

    const response = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Xero API rate limit exceeded')
    expect(typeof body.durationMs).toBe('number')
  })

  it('returns "Unknown error" for non-Error thrown values', async () => {
    mockRunBookkeeper.mockRejectedValue('string error')

    const response = await GET(makeRequest('Bearer test-cron-secret'))
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body.success).toBe(false)
    expect(body.error).toBe('Unknown error')
  })
})
