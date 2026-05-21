// src/lib/bookkeeper/__tests__/bas-calculator.test.ts
// Comprehensive tests for the BAS (Business Activity Statement) calculator.

import {
  calculateBAS,
  getFinancialYearQuarter,
  generateBASPeriods,
} from '../bas-calculator'
import type { BASPeriod, BASCalculation } from '../bas-calculator'
import type { ReconciliationMatch } from '../reconciliation'
import type { XeroBankTransaction } from '@/lib/integrations/xero/types'

// ---------------------------------------------------------------------------
// Test helpers: factory functions
// ---------------------------------------------------------------------------

function makeMatch(overrides: Partial<ReconciliationMatch> = {}): ReconciliationMatch {
  return {
    bankTransactionId: 'bt-001',
    matchedInvoiceId: null,
    matchedBillId: null,
    reconciliationStatus: 'unmatched',
    confidence: 0.60,
    taxCode: 'INPUT',
    taxCategory: null,
    isDeductible: true,
    gstAmountCents: 0,
    deductionCategory: null,
    deductionNotes: null,
    reasoning: 'Test match',
    ...overrides,
  }
}

function makeBankTxn(overrides: Partial<XeroBankTransaction> = {}): XeroBankTransaction {
  return {
    BankTransactionID: 'bt-001',
    Type: 'SPEND',
    Contact: { ContactID: 'c-001', Name: 'Supplier' },
    LineItems: [{ LineItemID: 'li-001', Description: 'General purchase' }],
    BankAccount: { AccountID: 'ba-001' },
    Total: -500.00,
    Date: '2026-01-15T00:00:00',
    Status: 'AUTHORISED',
    IsReconciled: false,
    ...overrides,
  }
}

function makeQ3FY2526Period(): BASPeriod {
  return {
    startDate: new Date(2026, 0, 1),  // 1 Jan 2026
    endDate: new Date(2026, 2, 31),    // 31 Mar 2026
    label: 'Q3 FY2025-26 (Jan-Mar 2026)',
  }
}

// ---------------------------------------------------------------------------
// 1. getFinancialYearQuarter
// ---------------------------------------------------------------------------

describe('getFinancialYearQuarter', () => {
  it('maps July dates to Q1', () => {
    const period = getFinancialYearQuarter(new Date(2025, 6, 15)) // 15 Jul 2025
    expect(period.label).toContain('Q1')
    expect(period.label).toContain('Jul-Sep')
    expect(period.startDate.getMonth()).toBe(6)  // July
    expect(period.endDate.getMonth()).toBe(8)     // September
  })

  it('maps September dates to Q1', () => {
    const period = getFinancialYearQuarter(new Date(2025, 8, 30)) // 30 Sep 2025
    expect(period.label).toContain('Q1')
    expect(period.startDate.getFullYear()).toBe(2025)
  })

  it('maps October dates to Q2', () => {
    const period = getFinancialYearQuarter(new Date(2025, 9, 1)) // 1 Oct 2025
    expect(period.label).toContain('Q2')
    expect(period.label).toContain('Oct-Dec')
    expect(period.startDate.getMonth()).toBe(9)   // October
    expect(period.endDate.getMonth()).toBe(11)     // December
  })

  it('maps December dates to Q2', () => {
    const period = getFinancialYearQuarter(new Date(2025, 11, 31)) // 31 Dec 2025
    expect(period.label).toContain('Q2')
  })

  it('maps January dates to Q3', () => {
    const period = getFinancialYearQuarter(new Date(2026, 0, 1)) // 1 Jan 2026
    expect(period.label).toContain('Q3')
    expect(period.label).toContain('Jan-Mar')
    expect(period.startDate.getMonth()).toBe(0)   // January
    expect(period.endDate.getMonth()).toBe(2)      // March
  })

  it('maps March dates to Q3', () => {
    const period = getFinancialYearQuarter(new Date(2026, 2, 15)) // 15 Mar 2026
    expect(period.label).toContain('Q3')
    expect(period.label).toContain('FY2025-26')
  })

  it('maps April dates to Q4', () => {
    const period = getFinancialYearQuarter(new Date(2026, 3, 1)) // 1 Apr 2026
    expect(period.label).toContain('Q4')
    expect(period.label).toContain('Apr-Jun')
    expect(period.startDate.getMonth()).toBe(3)   // April
    expect(period.endDate.getMonth()).toBe(5)      // June
  })

  it('maps June dates to Q4', () => {
    const period = getFinancialYearQuarter(new Date(2026, 5, 30)) // 30 Jun 2026
    expect(period.label).toContain('Q4')
    expect(period.label).toContain('FY2025-26')
  })

  it('correctly calculates the FY label across calendar year boundary', () => {
    // FY2025-26: Jul 2025 - Jun 2026
    const periodQ1 = getFinancialYearQuarter(new Date(2025, 7, 1))  // Aug 2025 → Q1 FY2025-26
    const periodQ3 = getFinancialYearQuarter(new Date(2026, 1, 1))  // Feb 2026 → Q3 FY2025-26

    expect(periodQ1.label).toContain('FY2025-26')
    expect(periodQ3.label).toContain('FY2025-26')
  })

  it('sets end date to the last day of the quarter', () => {
    // Q3 ends on 31 March
    const period = getFinancialYearQuarter(new Date(2026, 1, 15))
    expect(period.endDate.getDate()).toBe(31)
    expect(period.endDate.getMonth()).toBe(2) // March

    // Q2 ends on 31 December
    const periodQ2 = getFinancialYearQuarter(new Date(2025, 10, 15))
    expect(periodQ2.endDate.getDate()).toBe(31)
    expect(periodQ2.endDate.getMonth()).toBe(11) // December

    // Q1 ends on 30 September
    const periodQ1 = getFinancialYearQuarter(new Date(2025, 7, 15))
    expect(periodQ1.endDate.getDate()).toBe(30)
    expect(periodQ1.endDate.getMonth()).toBe(8) // September

    // Q4 ends on 30 June
    const periodQ4 = getFinancialYearQuarter(new Date(2026, 4, 15))
    expect(periodQ4.endDate.getDate()).toBe(30)
    expect(periodQ4.endDate.getMonth()).toBe(5) // June
  })
})

// ---------------------------------------------------------------------------
// 2. generateBASPeriods
// ---------------------------------------------------------------------------

describe('generateBASPeriods', () => {
  it('generates a single quarter for dates within one quarter', () => {
    const periods = generateBASPeriods(
      new Date(2026, 0, 1),  // 1 Jan 2026
      new Date(2026, 2, 31), // 31 Mar 2026
    )

    expect(periods).toHaveLength(1)
    expect(periods[0].label).toContain('Q3')
  })

  it('generates multiple quarters across a full financial year', () => {
    const periods = generateBASPeriods(
      new Date(2025, 6, 1),  // 1 Jul 2025
      new Date(2026, 5, 30), // 30 Jun 2026
    )

    expect(periods).toHaveLength(4)
    expect(periods[0].label).toContain('Q1')
    expect(periods[1].label).toContain('Q2')
    expect(periods[2].label).toContain('Q3')
    expect(periods[3].label).toContain('Q4')
  })

  it('returns empty array when endDate is before startDate', () => {
    const periods = generateBASPeriods(
      new Date(2026, 5, 30),
      new Date(2025, 6, 1),
    )

    expect(periods).toHaveLength(0)
  })

  it('handles dates within the same quarter (single period)', () => {
    const periods = generateBASPeriods(
      new Date(2026, 0, 15), // 15 Jan 2026
      new Date(2026, 1, 28), // 28 Feb 2026
    )

    expect(periods).toHaveLength(1)
    expect(periods[0].label).toContain('Q3')
  })

  it('generates two quarters for adjacent quarter dates', () => {
    const periods = generateBASPeriods(
      new Date(2026, 0, 1),  // 1 Jan 2026 (Q3)
      new Date(2026, 4, 15), // 15 May 2026 (Q4)
    )

    expect(periods).toHaveLength(2)
    expect(periods[0].label).toContain('Q3')
    expect(periods[1].label).toContain('Q4')
  })

  it('does not produce duplicate periods', () => {
    const periods = generateBASPeriods(
      new Date(2025, 6, 1),
      new Date(2026, 5, 30),
    )

    const labels = periods.map((p) => p.label)
    const unique = new Set(labels)
    expect(unique.size).toBe(labels.length)
  })
})

// ---------------------------------------------------------------------------
// 3. calculateBAS — Correct GST Aggregation
// ---------------------------------------------------------------------------

describe('calculateBAS — GST Aggregation', () => {
  it('aggregates OUTPUT transactions into Label 1A and 1B', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-sale-1',
      taxCode: 'OUTPUT',
      gstAmountCents: 10000, // $100 GST
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-sale-1',
      Type: 'RECEIVE',
      Total: 1100.00,
      Date: '2026-02-15T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.label1A_totalSalesCents).toBe(110000)  // $1100
    expect(result.label1B_gstOnSalesCents).toBe(10000)   // $100 GST
  })

  it('aggregates EXEMPTOUTPUT transactions into Label 1A with no GST', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-exempt-sale',
      taxCode: 'EXEMPTOUTPUT',
      gstAmountCents: 0,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-exempt-sale',
      Type: 'RECEIVE',
      Total: 500.00,
      Date: '2026-01-20T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.label1A_totalSalesCents).toBe(50000)
    expect(result.label1B_gstOnSalesCents).toBe(0)
    expect(result.gstFreeIncomeCents).toBe(50000)
  })

  it('aggregates INPUT transactions into Label 7 and 9', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-purchase-1',
      taxCode: 'INPUT',
      gstAmountCents: 5000, // $50 GST
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-purchase-1',
      Total: -550.00,
      Date: '2026-02-10T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.label7_totalPurchasesCents).toBe(55000)  // $550
    expect(result.label9_gstOnPurchasesCents).toBe(5000)   // $50 GST
  })

  it('aggregates EXEMPTINPUT transactions into Label 7 with no GST', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-exempt-purchase',
      taxCode: 'EXEMPTINPUT',
      gstAmountCents: 0,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-exempt-purchase',
      Total: -200.00,
      Date: '2026-03-01T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.label7_totalPurchasesCents).toBe(20000)
    expect(result.label9_gstOnPurchasesCents).toBe(0)
    expect(result.gstFreeExpensesCents).toBe(20000)
  })

  it('aggregates INPUTTAXED transactions into Label 7 with no GST claimable', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-inputtaxed',
      taxCode: 'INPUTTAXED',
      gstAmountCents: 0,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-inputtaxed',
      Total: -15.00, // Bank fee
      Date: '2026-01-05T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.label7_totalPurchasesCents).toBe(1500)
    expect(result.label9_gstOnPurchasesCents).toBe(0)
    expect(result.inputTaxedCents).toBe(1500)
  })

  it('excludes BASEXCLUDED transactions from BAS labels', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-excluded',
      taxCode: 'BASEXCLUDED',
      gstAmountCents: 0,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-excluded',
      Total: -5000.00, // Wages
      Date: '2026-02-01T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.label1A_totalSalesCents).toBe(0)
    expect(result.label1B_gstOnSalesCents).toBe(0)
    expect(result.label7_totalPurchasesCents).toBe(0)
    expect(result.label9_gstOnPurchasesCents).toBe(0)
    expect(result.basExcludedCents).toBe(500000)
    expect(result.transactionCount).toBe(1)
  })

  it('includes GSTONIMPORTS in Label 7 and 9', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-import',
      taxCode: 'GSTONIMPORTS',
      gstAmountCents: 2000,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-import',
      Total: -220.00,
      Date: '2026-01-15T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.label7_totalPurchasesCents).toBe(22000)
    expect(result.label9_gstOnPurchasesCents).toBe(2000)
  })

  it('includes EXEMPTEXPORT in Label 1A with no GST', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-export',
      taxCode: 'EXEMPTEXPORT',
      gstAmountCents: 0,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-export',
      Type: 'RECEIVE',
      Total: 3000.00,
      Date: '2026-02-20T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.label1A_totalSalesCents).toBe(300000)
    expect(result.label1B_gstOnSalesCents).toBe(0)
    expect(result.gstFreeIncomeCents).toBe(300000)
  })
})

// ---------------------------------------------------------------------------
// 4. calculateBAS — Label 11 (Net GST Payable)
// ---------------------------------------------------------------------------

describe('calculateBAS — Label 11', () => {
  it('calculates positive GST payable when collections exceed claims', () => {
    const period = makeQ3FY2526Period()
    const matches = [
      makeMatch({
        bankTransactionId: 'bt-sale',
        taxCode: 'OUTPUT',
        gstAmountCents: 10000, // $100 GST collected
      }),
      makeMatch({
        bankTransactionId: 'bt-expense',
        taxCode: 'INPUT',
        gstAmountCents: 3000, // $30 GST paid
      }),
    ]
    const transactions = [
      makeBankTxn({
        BankTransactionID: 'bt-sale',
        Type: 'RECEIVE',
        Total: 1100.00,
        Date: '2026-02-01T00:00:00',
      }),
      makeBankTxn({
        BankTransactionID: 'bt-expense',
        Total: -330.00,
        Date: '2026-02-15T00:00:00',
      }),
    ]

    const result = calculateBAS(matches, transactions, period)

    // Label 11 = 1B - 9 = 10000 - 3000 = 7000 (owe ATO $70)
    expect(result.label11_gstPayableCents).toBe(7000)
  })

  it('calculates negative GST payable (refund) when claims exceed collections', () => {
    const period = makeQ3FY2526Period()
    const matches = [
      makeMatch({
        bankTransactionId: 'bt-sale',
        taxCode: 'OUTPUT',
        gstAmountCents: 2000, // $20 GST collected
      }),
      makeMatch({
        bankTransactionId: 'bt-expense',
        taxCode: 'INPUT',
        gstAmountCents: 8000, // $80 GST paid
      }),
    ]
    const transactions = [
      makeBankTxn({
        BankTransactionID: 'bt-sale',
        Type: 'RECEIVE',
        Total: 220.00,
        Date: '2026-01-10T00:00:00',
      }),
      makeBankTxn({
        BankTransactionID: 'bt-expense',
        Total: -880.00,
        Date: '2026-01-20T00:00:00',
      }),
    ]

    const result = calculateBAS(matches, transactions, period)

    // Label 11 = 2000 - 8000 = -6000 (refund of $60)
    expect(result.label11_gstPayableCents).toBe(-6000)
  })

  it('returns zero when no GST transactions exist', () => {
    const period = makeQ3FY2526Period()

    const result = calculateBAS([], [], period)

    expect(result.label11_gstPayableCents).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 5. calculateBAS — Period Filtering
// ---------------------------------------------------------------------------

describe('calculateBAS — Period Filtering', () => {
  it('excludes transactions outside the BAS period', () => {
    const period = makeQ3FY2526Period() // Jan-Mar 2026

    const matchInPeriod = makeMatch({
      bankTransactionId: 'bt-in',
      taxCode: 'OUTPUT',
      gstAmountCents: 5000,
    })
    const matchOutside = makeMatch({
      bankTransactionId: 'bt-out',
      taxCode: 'OUTPUT',
      gstAmountCents: 3000,
    })

    const txnInPeriod = makeBankTxn({
      BankTransactionID: 'bt-in',
      Total: 550.00,
      Date: '2026-02-15T00:00:00', // Within Q3
    })
    const txnOutside = makeBankTxn({
      BankTransactionID: 'bt-out',
      Total: 330.00,
      Date: '2025-12-15T00:00:00', // Q2 — outside Q3
    })

    const result = calculateBAS(
      [matchInPeriod, matchOutside],
      [txnInPeriod, txnOutside],
      period,
    )

    // Only the in-period transaction should be counted
    expect(result.label1A_totalSalesCents).toBe(55000)
    expect(result.label1B_gstOnSalesCents).toBe(5000)
    expect(result.transactionCount).toBe(1)
  })

  it('includes transactions on the period boundary dates', () => {
    const period = makeQ3FY2526Period() // 1 Jan - 31 Mar 2026

    const matchStart = makeMatch({
      bankTransactionId: 'bt-start',
      taxCode: 'OUTPUT',
      gstAmountCents: 1000,
    })
    const matchEnd = makeMatch({
      bankTransactionId: 'bt-end',
      taxCode: 'OUTPUT',
      gstAmountCents: 2000,
    })

    const txnStart = makeBankTxn({
      BankTransactionID: 'bt-start',
      Total: 110.00,
      Date: '2026-01-01T00:00:00', // First day of Q3
    })
    const txnEnd = makeBankTxn({
      BankTransactionID: 'bt-end',
      Total: 220.00,
      Date: '2026-03-31T00:00:00', // Last day of Q3
    })

    const result = calculateBAS(
      [matchStart, matchEnd],
      [txnStart, txnEnd],
      period,
    )

    expect(result.transactionCount).toBe(2)
    expect(result.label1A_totalSalesCents).toBe(33000) // 11000 + 22000
  })
})

// ---------------------------------------------------------------------------
// 6. calculateBAS — Empty Data
// ---------------------------------------------------------------------------

describe('calculateBAS — Empty Data', () => {
  it('returns zero values for empty matches and transactions', () => {
    const period = makeQ3FY2526Period()

    const result = calculateBAS([], [], period)

    expect(result.label1A_totalSalesCents).toBe(0)
    expect(result.label1B_gstOnSalesCents).toBe(0)
    expect(result.label7_totalPurchasesCents).toBe(0)
    expect(result.label9_gstOnPurchasesCents).toBe(0)
    expect(result.label11_gstPayableCents).toBe(0)
    expect(result.transactionCount).toBe(0)
    expect(result.gstFreeIncomeCents).toBe(0)
    expect(result.gstFreeExpensesCents).toBe(0)
    expect(result.basExcludedCents).toBe(0)
    expect(result.inputTaxedCents).toBe(0)
    expect(Object.keys(result.breakdownByTaxCode)).toHaveLength(0)
  })

  it('handles matches with no corresponding transaction gracefully', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-orphan',
      taxCode: 'OUTPUT',
      gstAmountCents: 5000,
    })

    const result = calculateBAS([match], [], period)

    expect(result.transactionCount).toBe(0)
    expect(result.label1A_totalSalesCents).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// 7. calculateBAS — Mixed Tax Codes
// ---------------------------------------------------------------------------

describe('calculateBAS — Mixed Tax Codes', () => {
  it('correctly processes a realistic mix of tax codes', () => {
    const period = makeQ3FY2526Period()

    const matches = [
      // Sale with GST
      makeMatch({ bankTransactionId: 'bt-1', taxCode: 'OUTPUT', gstAmountCents: 10000 }),
      // GST-free sale
      makeMatch({ bankTransactionId: 'bt-2', taxCode: 'EXEMPTOUTPUT', gstAmountCents: 0 }),
      // Purchase with GST
      makeMatch({ bankTransactionId: 'bt-3', taxCode: 'INPUT', gstAmountCents: 3000 }),
      // GST-free purchase
      makeMatch({ bankTransactionId: 'bt-4', taxCode: 'EXEMPTINPUT', gstAmountCents: 0 }),
      // Bank fee (input taxed)
      makeMatch({ bankTransactionId: 'bt-5', taxCode: 'INPUTTAXED', gstAmountCents: 0 }),
      // Wages (BAS excluded)
      makeMatch({ bankTransactionId: 'bt-6', taxCode: 'BASEXCLUDED', gstAmountCents: 0 }),
    ]

    const transactions = [
      makeBankTxn({ BankTransactionID: 'bt-1', Total: 1100.00, Date: '2026-01-15T00:00:00' }),
      makeBankTxn({ BankTransactionID: 'bt-2', Total: 500.00, Date: '2026-01-20T00:00:00' }),
      makeBankTxn({ BankTransactionID: 'bt-3', Total: -330.00, Date: '2026-02-10T00:00:00' }),
      makeBankTxn({ BankTransactionID: 'bt-4', Total: -200.00, Date: '2026-02-15T00:00:00' }),
      makeBankTxn({ BankTransactionID: 'bt-5', Total: -15.00, Date: '2026-02-28T00:00:00' }),
      makeBankTxn({ BankTransactionID: 'bt-6', Total: -5000.00, Date: '2026-03-01T00:00:00' }),
    ]

    const result = calculateBAS(matches, transactions, period)

    // Label 1A: OUTPUT (110000) + EXEMPTOUTPUT (50000) = 160000
    expect(result.label1A_totalSalesCents).toBe(160000)

    // Label 1B: OUTPUT GST only = 10000
    expect(result.label1B_gstOnSalesCents).toBe(10000)

    // Label 7: INPUT (33000) + EXEMPTINPUT (20000) + INPUTTAXED (1500) = 54500
    expect(result.label7_totalPurchasesCents).toBe(54500)

    // Label 9: INPUT GST only = 3000
    expect(result.label9_gstOnPurchasesCents).toBe(3000)

    // Label 11: 10000 - 3000 = 7000
    expect(result.label11_gstPayableCents).toBe(7000)

    // Supporting data
    expect(result.gstFreeIncomeCents).toBe(50000)
    expect(result.gstFreeExpensesCents).toBe(20000)
    expect(result.inputTaxedCents).toBe(1500)
    expect(result.basExcludedCents).toBe(500000)
    expect(result.transactionCount).toBe(6)
  })
})

// ---------------------------------------------------------------------------
// 8. calculateBAS — Breakdown by Tax Code
// ---------------------------------------------------------------------------

describe('calculateBAS — Breakdown by Tax Code', () => {
  it('produces correct breakdown counts and totals', () => {
    const period = makeQ3FY2526Period()

    const matches = [
      makeMatch({ bankTransactionId: 'bt-a', taxCode: 'OUTPUT', gstAmountCents: 5000 }),
      makeMatch({ bankTransactionId: 'bt-b', taxCode: 'OUTPUT', gstAmountCents: 3000 }),
      makeMatch({ bankTransactionId: 'bt-c', taxCode: 'INPUT', gstAmountCents: 2000 }),
    ]

    const transactions = [
      makeBankTxn({ BankTransactionID: 'bt-a', Total: 550.00, Date: '2026-01-15T00:00:00' }),
      makeBankTxn({ BankTransactionID: 'bt-b', Total: 330.00, Date: '2026-02-15T00:00:00' }),
      makeBankTxn({ BankTransactionID: 'bt-c', Total: -220.00, Date: '2026-03-15T00:00:00' }),
    ]

    const result = calculateBAS(matches, transactions, period)

    expect(result.breakdownByTaxCode['OUTPUT']).toEqual({
      count: 2,
      totalCents: 88000, // 55000 + 33000
      gstCents: 8000,     // 5000 + 3000
    })

    expect(result.breakdownByTaxCode['INPUT']).toEqual({
      count: 1,
      totalCents: 22000,
      gstCents: 2000,
    })
  })
})

// ---------------------------------------------------------------------------
// 9. calculateBAS — Xero Date Formats
// ---------------------------------------------------------------------------

describe('calculateBAS — Xero Date Formats', () => {
  it('handles /Date(...)/ format from Xero API', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-xero-date',
      taxCode: 'OUTPUT',
      gstAmountCents: 1000,
    })
    // Use a date within Q3 FY2025-26 (Jan-Mar 2026)
    // 1 Feb 2026 UTC = 1769904000000
    const txn = makeBankTxn({
      BankTransactionID: 'bt-xero-date',
      Total: 110.00,
      Date: '/Date(1769904000000+0000)/',
    })

    const result = calculateBAS([match], [txn], period)

    // Should be included in the period
    expect(result.transactionCount).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 10. calculateBAS — Period Label
// ---------------------------------------------------------------------------

describe('calculateBAS — Period passthrough', () => {
  it('includes the period in the result', () => {
    const period = makeQ3FY2526Period()

    const result = calculateBAS([], [], period)

    expect(result.period).toBe(period)
    expect(result.period.label).toContain('Q3')
  })
})

// ---------------------------------------------------------------------------
// 11. Edge cases
// ---------------------------------------------------------------------------

describe('Edge cases', () => {
  it('handles matches with null tax code', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-null-tax',
      taxCode: null,
      gstAmountCents: 0,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-null-tax',
      Total: -100.00,
      Date: '2026-02-01T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    // Should be counted but not contribute to BAS labels
    expect(result.transactionCount).toBe(1)
    expect(result.label1A_totalSalesCents).toBe(0)
    expect(result.label7_totalPurchasesCents).toBe(0)
  })

  it('handles zero-amount transactions', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-zero',
      taxCode: 'OUTPUT',
      gstAmountCents: 0,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-zero',
      Total: 0,
      Date: '2026-01-15T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    expect(result.transactionCount).toBe(1)
    expect(result.label1A_totalSalesCents).toBe(0)
    expect(result.label1B_gstOnSalesCents).toBe(0)
  })

  it('uses absolute values for negative amounts in labels', () => {
    const period = makeQ3FY2526Period()
    const match = makeMatch({
      bankTransactionId: 'bt-neg',
      taxCode: 'INPUT',
      gstAmountCents: 4545,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-neg',
      Total: -500.00,
      Date: '2026-01-15T00:00:00',
    })

    const result = calculateBAS([match], [txn], period)

    // Should use absolute value
    expect(result.label7_totalPurchasesCents).toBe(50000)
    expect(result.label9_gstOnPurchasesCents).toBe(4545)
  })
})
