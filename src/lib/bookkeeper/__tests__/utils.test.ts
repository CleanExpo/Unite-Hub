// src/lib/bookkeeper/__tests__/utils.test.ts
// Tests for shared bookkeeper utility helpers.

import { toCents, parseXeroDate, getBankTransactionDescription } from '../utils'
import type { XeroBankTransaction } from '@/lib/integrations/xero/types'

// ---------------------------------------------------------------------------
// toCents
// ---------------------------------------------------------------------------

describe('toCents', () => {
  it('converts whole dollar amounts to cents', () => {
    expect(toCents(100)).toBe(10000)
    expect(toCents(0)).toBe(0)
    expect(toCents(1)).toBe(100)
  })

  it('converts fractional amounts to cents', () => {
    expect(toCents(10.50)).toBe(1050)
    expect(toCents(99.99)).toBe(9999)
    expect(toCents(0.01)).toBe(1)
  })

  it('rounds floating-point drift correctly', () => {
    // 19.99 * 100 = 1998.9999999999998 without rounding
    expect(toCents(19.99)).toBe(1999)
    // 0.1 + 0.2 = 0.30000000000000004 in IEEE 754
    expect(toCents(0.1 + 0.2)).toBe(30)
  })

  it('handles negative amounts', () => {
    expect(toCents(-500)).toBe(-50000)
    expect(toCents(-10.50)).toBe(-1050)
  })
})

// ---------------------------------------------------------------------------
// parseXeroDate
// ---------------------------------------------------------------------------

describe('parseXeroDate', () => {
  it('parses ISO format date strings', () => {
    const result = parseXeroDate('2026-03-01T00:00:00')
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(2) // March (0-indexed)
    expect(result.getDate()).toBe(1)
  })

  it('parses Xero /Date(...)/ format', () => {
    // 1709251200000 = 2024-03-01T00:00:00.000Z
    const result = parseXeroDate('/Date(1709251200000)/')
    expect(result.getTime()).toBe(1709251200000)
  })

  it('parses /Date(...)/ format with timezone offset', () => {
    const result = parseXeroDate('/Date(1709251200000+1000)/')
    // The timezone offset in the /Date/ format is ignored — ms value is absolute
    expect(result.getTime()).toBe(1709251200000)
  })

  it('parses plain date string', () => {
    const result = parseXeroDate('2026-06-30')
    expect(result.getFullYear()).toBe(2026)
    expect(result.getMonth()).toBe(5) // June (0-indexed)
  })
})

// ---------------------------------------------------------------------------
// getBankTransactionDescription
// ---------------------------------------------------------------------------

describe('getBankTransactionDescription', () => {
  function makeTxn(overrides: Partial<XeroBankTransaction> = {}): XeroBankTransaction {
    return {
      BankTransactionID: 'bt-001',
      Type: 'SPEND',
      Contact: { ContactID: 'c-001', Name: 'Supplier Co' },
      LineItems: [{ LineItemID: 'li-001', Description: 'Office supplies' }],
      BankAccount: { AccountID: 'ba-001' },
      Total: -100,
      Date: '2026-03-01T00:00:00',
      Status: 'AUTHORISED',
      IsReconciled: false,
      ...overrides,
    }
  }

  it('combines reference, contact name, and line item descriptions', () => {
    const txn = makeTxn({ Reference: 'REF-123' })
    const result = getBankTransactionDescription(txn)
    expect(result).toBe('REF-123 Supplier Co Office supplies')
  })

  it('omits reference if not present', () => {
    const txn = makeTxn()
    const result = getBankTransactionDescription(txn)
    expect(result).toBe('Supplier Co Office supplies')
  })

  it('handles multiple line items', () => {
    const txn = makeTxn({
      LineItems: [
        { LineItemID: 'li-001', Description: 'Paper' },
        { LineItemID: 'li-002', Description: 'Ink cartridge' },
      ],
    })
    const result = getBankTransactionDescription(txn)
    expect(result).toBe('Supplier Co Paper Ink cartridge')
  })

  it('skips line items with no description', () => {
    const txn = makeTxn({
      LineItems: [
        { LineItemID: 'li-001' },
        { LineItemID: 'li-002', Description: 'Widget' },
      ],
    })
    const result = getBankTransactionDescription(txn)
    expect(result).toBe('Supplier Co Widget')
  })

  it('returns empty string when no parts are available', () => {
    const txn = makeTxn({
      Contact: { ContactID: 'c-001', Name: '' },
      LineItems: [{ LineItemID: 'li-001' }],
    })
    const result = getBankTransactionDescription(txn)
    expect(result).toBe('')
  })
})
