// src/lib/bookkeeper/__tests__/deduction-optimiser.test.ts
// Comprehensive tests for the ATO deduction optimisation engine.

import { optimiseDeductions } from '../deduction-optimiser'
import type { DeductionOptimisationResult } from '../deduction-optimiser'
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
    Date: '2026-03-01T00:00:00',
    Status: 'AUTHORISED',
    IsReconciled: false,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// 1. Instant Asset Write-Off Detection (S.328-180)
// ---------------------------------------------------------------------------

describe('Instant Asset Write-Off Detection', () => {
  it('flags equipment purchases between $300 and $20,000 as potential write-offs', () => {
    const match = makeMatch({ bankTransactionId: 'bt-asset-1', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-asset-1',
      Total: -5500.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'New laptop computer for office' }],
    })

    const result = optimiseDeductions([match], [txn])

    expect(result.suggestions).toHaveLength(1)
    expect(result.suggestions[0].atoReference).toBe('S.328-180')
    expect(result.suggestions[0].bankTransactionId).toBe('bt-asset-1')
    expect(result.suggestions[0].potentialSavingsCents).toBe(165000) // 550000 * 0.30
    expect(result.matches[0].deductionCategory).toBe('instant_asset_writeoff')
    expect(result.matches[0].deductionNotes).toContain('S.328-180')
  })

  it('flags various asset keywords: furniture, vehicle, tools, machinery', () => {
    const keywords = ['furniture', 'vehicle', 'tools', 'machinery', 'equipment', 'printer', 'monitor']

    for (const keyword of keywords) {
      const match = makeMatch({ bankTransactionId: `bt-${keyword}`, isDeductible: true })
      const txn = makeBankTxn({
        BankTransactionID: `bt-${keyword}`,
        Total: -1000.00,
        LineItems: [{ LineItemID: 'li-1', Description: `Purchase of ${keyword}` }],
      })

      const result = optimiseDeductions([match], [txn])

      expect(result.suggestions.length).toBeGreaterThanOrEqual(1)
      const assetSuggestion = result.suggestions.find((s) => s.atoReference === 'S.328-180')
      expect(assetSuggestion).toBeDefined()
    }
  })

  it('does NOT flag purchases under $300', () => {
    const match = makeMatch({ bankTransactionId: 'bt-small', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-small',
      Total: -250.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Small computer accessory' }],
    })

    const result = optimiseDeductions([match], [txn])

    const assetSuggestion = result.suggestions.find((s) => s.atoReference === 'S.328-180')
    expect(assetSuggestion).toBeUndefined()
  })

  it('does NOT flag purchases at or above $20,000', () => {
    const match = makeMatch({ bankTransactionId: 'bt-big', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-big',
      Total: -20000.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Industrial equipment' }],
    })

    const result = optimiseDeductions([match], [txn])

    const assetSuggestion = result.suggestions.find((s) => s.atoReference === 'S.328-180')
    expect(assetSuggestion).toBeUndefined()
  })

  it('does NOT flag non-asset keyword purchases', () => {
    const match = makeMatch({ bankTransactionId: 'bt-food', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-food',
      Total: -500.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Catering for team lunch' }],
    })

    const result = optimiseDeductions([match], [txn])

    const assetSuggestion = result.suggestions.find((s) => s.atoReference === 'S.328-180')
    expect(assetSuggestion).toBeUndefined()
  })

  it('does NOT flag non-deductible purchases', () => {
    const match = makeMatch({ bankTransactionId: 'bt-nd', isDeductible: false })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-nd',
      Total: -5000.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'New laptop computer' }],
    })

    const result = optimiseDeductions([match], [txn])

    const assetSuggestion = result.suggestions.find((s) => s.atoReference === 'S.328-180')
    expect(assetSuggestion).toBeUndefined()
  })

  it('does NOT flag exactly $300.00 (boundary: must be strictly greater than $300)', () => {
    const match = makeMatch({ bankTransactionId: 'bt-300', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-300',
      Total: -300.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Small computer monitor' }],
    })

    const result = optimiseDeductions([match], [txn])

    const assetSuggestion = result.suggestions.find((s) => s.atoReference === 'S.328-180')
    expect(assetSuggestion).toBeUndefined()
  })

  it('flags $300.01 (boundary: just above $300 minimum)', () => {
    const match = makeMatch({ bankTransactionId: 'bt-300-01', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-300-01',
      Total: -300.01,
      LineItems: [{ LineItemID: 'li-1', Description: 'Small computer monitor' }],
    })

    const result = optimiseDeductions([match], [txn])

    const assetSuggestion = result.suggestions.find((s) => s.atoReference === 'S.328-180')
    expect(assetSuggestion).toBeDefined()
  })
})

// ---------------------------------------------------------------------------
// 2. Home Office Deduction (TR 93/30)
// ---------------------------------------------------------------------------

describe('Home Office Deduction', () => {
  it('flags electricity-related transactions with home office note', () => {
    const match = makeMatch({ bankTransactionId: 'bt-elec', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-elec',
      Total: -180.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Quarterly electricity bill' }],
    })

    const result = optimiseDeductions([match], [txn])

    expect(result.suggestions).toHaveLength(1)
    expect(result.suggestions[0].atoReference).toBe('TR 93/30')
    expect(result.matches[0].deductionNotes).toContain('$0.67/hour')
    expect(result.matches[0].deductionNotes).toContain('TR 93/30')
  })

  it('flags internet-related transactions', () => {
    const match = makeMatch({ bankTransactionId: 'bt-net', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-net',
      Total: -89.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Home office internet plan' }],
    })

    const result = optimiseDeductions([match], [txn])

    const homeSuggestion = result.suggestions.find((s) => s.atoReference === 'TR 93/30')
    expect(homeSuggestion).toBeDefined()
  })

  it('does NOT flag non-home-office expenses', () => {
    const match = makeMatch({ bankTransactionId: 'bt-other', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-other',
      Total: -50.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Office stationery order' }],
    })

    const result = optimiseDeductions([match], [txn])

    const homeSuggestion = result.suggestions.find((s) => s.atoReference === 'TR 93/30')
    expect(homeSuggestion).toBeUndefined()
  })
})

// ---------------------------------------------------------------------------
// 3. Motor Vehicle Log Book (Div 28)
// ---------------------------------------------------------------------------

describe('Motor Vehicle Log Book', () => {
  it('adds log book note to fuel purchases', () => {
    const match = makeMatch({
      bankTransactionId: 'bt-fuel',
      isDeductible: true,
      taxCategory: 'motor_vehicle',
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-fuel',
      Total: -95.00,
      Contact: { ContactID: 'c-bp', Name: 'BP' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Fuel purchase' }],
    })

    const result = optimiseDeductions([match], [txn])

    const vehicleSuggestion = result.suggestions.find((s) => s.atoReference === 'Div 28')
    expect(vehicleSuggestion).toBeDefined()
    expect(vehicleSuggestion!.suggestion).toContain('log book')
    expect(result.matches[0].deductionNotes).toContain('Div 28')
    expect(result.matches[0].deductionNotes).toContain('12-week')
  })

  it('detects fuel brand names (Shell, Caltex, Ampol)', () => {
    const brands = ['Shell', 'Caltex', 'Ampol']

    for (const brand of brands) {
      const match = makeMatch({ bankTransactionId: `bt-${brand}`, isDeductible: true })
      const txn = makeBankTxn({
        BankTransactionID: `bt-${brand}`,
        Total: -80.00,
        Contact: { ContactID: `c-${brand}`, Name: brand },
        LineItems: [{ LineItemID: 'li-1', Description: 'Petrol' }],
      })

      const result = optimiseDeductions([match], [txn])

      const vehicleSuggestion = result.suggestions.find((s) => s.atoReference === 'Div 28')
      expect(vehicleSuggestion).toBeDefined()
    }
  })

  it('sets motor_vehicle deduction category for fuel purchases without existing category', () => {
    const match = makeMatch({
      bankTransactionId: 'bt-fuel-nocat',
      isDeductible: true,
      deductionCategory: null,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-fuel-nocat',
      Total: -75.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Diesel fuel for van' }],
    })

    const result = optimiseDeductions([match], [txn])

    expect(result.matches[0].deductionCategory).toBe('motor_vehicle')
  })
})

// ---------------------------------------------------------------------------
// 4. Prepaid Expenses (S.8-1)
// ---------------------------------------------------------------------------

describe('Prepaid Expenses', () => {
  it('flags annual subscription payments', () => {
    const match = makeMatch({ bankTransactionId: 'bt-annual', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-annual',
      Total: -1200.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Annual software subscription renewal' }],
    })

    const result = optimiseDeductions([match], [txn])

    const prepaidSuggestion = result.suggestions.find((s) => s.atoReference === 'S.8-1')
    expect(prepaidSuggestion).toBeDefined()
    expect(prepaidSuggestion!.potentialSavingsCents).toBe(36000) // 120000 * 0.30
    expect(result.matches[0].deductionNotes).toContain('S.8-1')
    expect(result.matches[0].deductionNotes).toContain('Prepaid')
  })

  it('flags yearly membership payments', () => {
    const match = makeMatch({ bankTransactionId: 'bt-membership', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-membership',
      Total: -350.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Yearly industry membership fee' }],
    })

    const result = optimiseDeductions([match], [txn])

    const prepaidSuggestion = result.suggestions.find((s) => s.atoReference === 'S.8-1')
    expect(prepaidSuggestion).toBeDefined()
  })

  it('sets subscriptions deduction category for prepaid without existing category', () => {
    const match = makeMatch({
      bankTransactionId: 'bt-prepaid-nocat',
      isDeductible: true,
      deductionCategory: null,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-prepaid-nocat',
      Total: -600.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Prepaid domain registration' }],
    })

    const result = optimiseDeductions([match], [txn])

    expect(result.matches[0].deductionCategory).toBe('subscriptions')
  })
})

// ---------------------------------------------------------------------------
// 5. No Mutation of Originals
// ---------------------------------------------------------------------------

describe('No mutation of originals', () => {
  it('does not modify the original match objects', () => {
    const originalMatch = makeMatch({
      bankTransactionId: 'bt-immutable',
      isDeductible: true,
      deductionCategory: null,
      deductionNotes: null,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-immutable',
      Total: -5000.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'New laptop computer' }],
    })

    // Capture original values
    const originalCategory = originalMatch.deductionCategory
    const originalNotes = originalMatch.deductionNotes

    optimiseDeductions([originalMatch], [txn])

    // Original must remain unchanged
    expect(originalMatch.deductionCategory).toBe(originalCategory)
    expect(originalMatch.deductionNotes).toBe(originalNotes)
  })

  it('does not modify the original transaction objects', () => {
    const match = makeMatch({ bankTransactionId: 'bt-txn-immutable', isDeductible: true })
    const originalTxn = makeBankTxn({
      BankTransactionID: 'bt-txn-immutable',
      Total: -1000.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Equipment purchase' }],
    })

    const originalTotal = originalTxn.Total
    const originalDesc = originalTxn.LineItems[0].Description

    optimiseDeductions([match], [originalTxn])

    expect(originalTxn.Total).toBe(originalTotal)
    expect(originalTxn.LineItems[0].Description).toBe(originalDesc)
  })

  it('does not change taxCode or gstAmountCents on enriched matches', () => {
    const match = makeMatch({
      bankTransactionId: 'bt-nochange',
      isDeductible: true,
      taxCode: 'INPUT',
      gstAmountCents: 500,
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-nochange',
      Total: -5500.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'New computer equipment' }],
    })

    const result = optimiseDeductions([match], [txn])

    expect(result.matches[0].taxCode).toBe('INPUT')
    expect(result.matches[0].gstAmountCents).toBe(500)
  })
})

// ---------------------------------------------------------------------------
// 6. Total Calculations
// ---------------------------------------------------------------------------

describe('Total calculations', () => {
  it('correctly sums deductible and non-deductible totals', () => {
    const matches = [
      makeMatch({ bankTransactionId: 'bt-ded-1', isDeductible: true }),
      makeMatch({ bankTransactionId: 'bt-ded-2', isDeductible: true }),
      makeMatch({ bankTransactionId: 'bt-nond-1', isDeductible: false }),
    ]
    const transactions = [
      makeBankTxn({ BankTransactionID: 'bt-ded-1', Total: -1000.00 }),
      makeBankTxn({ BankTransactionID: 'bt-ded-2', Total: -500.00 }),
      makeBankTxn({ BankTransactionID: 'bt-nond-1', Total: 2000.00 }),
    ]

    const result = optimiseDeductions(matches, transactions)

    expect(result.totalDeductibleCents).toBe(150000) // 100000 + 50000
    expect(result.totalNonDeductibleCents).toBe(200000)
  })

  it('uses absolute values for totals (negative amounts treated as positive)', () => {
    const matches = [makeMatch({ bankTransactionId: 'bt-neg', isDeductible: true })]
    const transactions = [makeBankTxn({ BankTransactionID: 'bt-neg', Total: -750.00 })]

    const result = optimiseDeductions(matches, transactions)

    expect(result.totalDeductibleCents).toBe(75000)
  })

  it('handles empty inputs gracefully', () => {
    const result = optimiseDeductions([], [])

    expect(result.matches).toHaveLength(0)
    expect(result.suggestions).toHaveLength(0)
    expect(result.totalDeductibleCents).toBe(0)
    expect(result.totalNonDeductibleCents).toBe(0)
  })

  it('handles matches with no corresponding transaction', () => {
    const match = makeMatch({ bankTransactionId: 'bt-orphan', isDeductible: true })

    const result = optimiseDeductions([match], [])

    expect(result.matches).toHaveLength(1)
    expect(result.suggestions).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 7. Multiple rules on single transaction
// ---------------------------------------------------------------------------

describe('Multiple rules on single transaction', () => {
  it('collects suggestions from multiple applicable rules', () => {
    // A fuel purchase that is also an annual subscription — both rules should trigger suggestions
    const match = makeMatch({ bankTransactionId: 'bt-multi', isDeductible: true })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-multi',
      Total: -800.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Annual fuel card subscription' }],
    })

    const result = optimiseDeductions([match], [txn])

    // Should have suggestions from both fuel (Div 28) and prepaid (S.8-1)
    expect(result.suggestions.length).toBeGreaterThanOrEqual(2)
    const atoRefs = result.suggestions.map((s) => s.atoReference)
    expect(atoRefs).toContain('Div 28')
    expect(atoRefs).toContain('S.8-1')
  })
})

// ---------------------------------------------------------------------------
// 8. Non-deductible income transactions
// ---------------------------------------------------------------------------

describe('Non-deductible income transactions', () => {
  it('skips deduction enrichment for income (non-deductible) transactions', () => {
    const match = makeMatch({
      bankTransactionId: 'bt-income',
      isDeductible: false,
      taxCode: 'OUTPUT',
    })
    const txn = makeBankTxn({
      BankTransactionID: 'bt-income',
      Type: 'RECEIVE',
      Total: 5000.00,
      LineItems: [{ LineItemID: 'li-1', Description: 'Computer equipment sale' }],
    })

    const result = optimiseDeductions([match], [txn])

    // No suggestions for income
    expect(result.suggestions).toHaveLength(0)
    // Match passes through unchanged (deduction fields stay null)
    expect(result.matches[0].deductionCategory).toBeNull()
    expect(result.matches[0].deductionNotes).toBeNull()
  })
})
