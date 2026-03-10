// src/lib/bookkeeper/__tests__/reconciliation.test.ts
// Comprehensive tests for the 3-pass reconciliation engine.

import {
  reconcileTransactions,
  isWithinBusinessDays,
  descriptionSimilarity,
} from '../reconciliation'
import type { ReconciliationMatch, ReconciliationResult } from '../reconciliation'
import type {
  XeroBankTransaction,
  XeroInvoice,
  XeroContact,
} from '@/lib/integrations/xero/types'

// ---------------------------------------------------------------------------
// Test helpers: factory functions
// ---------------------------------------------------------------------------

function makeBankTxn(overrides: Partial<XeroBankTransaction> = {}): XeroBankTransaction {
  return {
    BankTransactionID: 'bt-001',
    Type: 'RECEIVE',
    Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    LineItems: [{ LineItemID: 'li-001', Description: 'Payment received' }],
    BankAccount: { AccountID: 'ba-001' },
    Total: 1100.00,
    Date: '2026-03-01T00:00:00',
    Status: 'AUTHORISED',
    IsReconciled: false,
    ...overrides,
  }
}

function makeInvoice(overrides: Partial<XeroInvoice> = {}): XeroInvoice {
  return {
    InvoiceID: 'inv-001',
    Type: 'ACCREC',
    InvoiceNumber: 'INV-0001',
    Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    Total: 1100.00,
    AmountDue: 1100.00,
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
    Name: 'Acme Pty Ltd',
    ContactStatus: 'ACTIVE',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// 1. isWithinBusinessDays helper
// ---------------------------------------------------------------------------

describe('isWithinBusinessDays', () => {
  it('returns true for same date (0 business days)', () => {
    const date = new Date('2026-03-02')
    expect(isWithinBusinessDays(date, date, 0)).toBe(true)
  })

  it('counts weekdays only between two dates', () => {
    // Monday 2 March to Friday 6 March = 4 business days
    const mon = new Date('2026-03-02')
    const fri = new Date('2026-03-06')
    expect(isWithinBusinessDays(mon, fri, 4)).toBe(true)
    expect(isWithinBusinessDays(mon, fri, 3)).toBe(false)
  })

  it('skips weekends', () => {
    // Friday 6 March to Monday 9 March = 1 business day (Mon only)
    const fri = new Date('2026-03-06')
    const mon = new Date('2026-03-09')
    expect(isWithinBusinessDays(fri, mon, 1)).toBe(true)
    expect(isWithinBusinessDays(fri, mon, 0)).toBe(false)
  })

  it('works regardless of argument order', () => {
    const earlier = new Date('2026-03-02')
    const later = new Date('2026-03-06')
    expect(isWithinBusinessDays(later, earlier, 4)).toBe(true)
    expect(isWithinBusinessDays(earlier, later, 4)).toBe(true)
  })

  it('handles a full week span', () => {
    // Mon 2 Mar to Mon 9 Mar = 5 business days
    const start = new Date('2026-03-02')
    const end = new Date('2026-03-09')
    expect(isWithinBusinessDays(start, end, 5)).toBe(true)
    expect(isWithinBusinessDays(start, end, 4)).toBe(false)
  })

  it('handles two consecutive weekends', () => {
    // Friday 6 Mar to Monday 16 Mar = 6 business days
    const fri = new Date('2026-03-06')
    const mon = new Date('2026-03-16')
    expect(isWithinBusinessDays(fri, mon, 6)).toBe(true)
    expect(isWithinBusinessDays(fri, mon, 5)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// 2. descriptionSimilarity helper
// ---------------------------------------------------------------------------

describe('descriptionSimilarity', () => {
  it('returns 1.0 for exact match', () => {
    expect(descriptionSimilarity('Acme Pty Ltd', 'Acme Pty Ltd')).toBe(1.0)
  })

  it('returns 0.0 when no words match', () => {
    expect(descriptionSimilarity('Payment from client', 'Zenith Corp')).toBe(0.0)
  })

  it('is case-insensitive', () => {
    expect(descriptionSimilarity('PAYMENT FROM ACME PTY LTD', 'acme pty ltd')).toBe(1.0)
  })

  it('returns partial score for partial word matches', () => {
    // "Acme" matches, "Holdings" doesn't => 1/2 = 0.5
    const score = descriptionSimilarity('Payment from Acme', 'Acme Holdings')
    expect(score).toBe(0.5)
  })

  it('ignores single-character contact name words', () => {
    // Contact "A B Corp" — "A" and "B" are < 2 chars, only "Corp" is checked
    const score = descriptionSimilarity('Corp payment', 'A B Corp')
    expect(score).toBe(1.0) // only "Corp" matters
  })

  it('returns 0.0 for empty contact name', () => {
    expect(descriptionSimilarity('some description', '')).toBe(0.0)
  })
})

// ---------------------------------------------------------------------------
// 3. Pass 1 — Exact Match
// ---------------------------------------------------------------------------

describe('Pass 1 — Exact Match', () => {
  it('matches with confidence 1.00 when amount, date, and description all match', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-100',
      Total: 1100.00,
      Date: '2026-03-02T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
      LineItems: [{ LineItemID: 'li-1', Description: 'INV-0001 payment' }],
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-100',
      InvoiceNumber: 'INV-0001',
      AmountDue: 1100.00,
      DueDate: '2026-03-01T00:00:00',
      Type: 'ACCREC',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })
    const contact = makeContact()

    const result = reconcileTransactions([txn], [inv], [contact])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).toBe('auto_matched')
    expect(result.matches[0].confidence).toBe(1.00)
    expect(result.matches[0].matchedInvoiceId).toBe('inv-100')
    expect(result.matches[0].matchedBillId).toBeNull()
    expect(result.summary.autoMatched).toBe(1)
  })

  it('matches with confidence 0.95 when amount and date match but description does not', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-101',
      Total: 550.00,
      Date: '2026-03-03T00:00:00',
      Contact: { ContactID: 'c-999', Name: 'Unknown' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Direct deposit' }],
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-101',
      InvoiceNumber: 'INV-0050',
      AmountDue: 550.00,
      DueDate: '2026-03-02T00:00:00',
      Type: 'ACCREC',
      Contact: { ContactID: 'c-002', Name: 'Widget Co' },
    })
    const contact = makeContact({ ContactID: 'c-002', Name: 'Widget Co' })

    const result = reconcileTransactions([txn], [inv], [contact])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).toBe('auto_matched')
    expect(result.matches[0].confidence).toBe(0.95)
  })

  it('matches SPEND transactions to ACCPAY bills', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-102',
      Type: 'SPEND',
      Total: -2200.00,
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-003', Name: 'Supplier Inc' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Bill payment Supplier Inc' }],
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-102',
      Type: 'ACCPAY',
      InvoiceNumber: 'BILL-001',
      AmountDue: 2200.00,
      DueDate: '2026-03-04T00:00:00',
      Contact: { ContactID: 'c-003', Name: 'Supplier Inc' },
    })
    const contact = makeContact({ ContactID: 'c-003', Name: 'Supplier Inc' })

    const result = reconcileTransactions([txn], [inv], [contact])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].matchedBillId).toBe('inv-102')
    expect(result.matches[0].matchedInvoiceId).toBeNull()
    expect(result.matches[0].reconciliationStatus).toBe('auto_matched')
    expect(result.matches[0].isDeductible).toBe(true)
  })

  it('picks the closest-date invoice when multiple exact-amount candidates exist', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-103',
      Total: 500.00,
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-x', Name: 'Generic' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Payment' }],
    })
    const inv1 = makeInvoice({
      InvoiceID: 'inv-103a',
      AmountDue: 500.00,
      DueDate: '2026-03-01T00:00:00', // 4 business days away
      Contact: { ContactID: 'c-004', Name: 'Alpha Co' },
    })
    const inv2 = makeInvoice({
      InvoiceID: 'inv-103b',
      AmountDue: 500.00,
      DueDate: '2026-03-04T00:00:00', // 1 business day away
      Contact: { ContactID: 'c-005', Name: 'Beta Co' },
    })

    const result = reconcileTransactions(
      [txn],
      [inv1, inv2],
      [
        makeContact({ ContactID: 'c-004', Name: 'Alpha Co' }),
        makeContact({ ContactID: 'c-005', Name: 'Beta Co' }),
      ],
    )

    expect(result.matches).toHaveLength(1)
    // inv-103b is closer in date
    expect(result.matches[0].matchedInvoiceId).toBe('inv-103b')
  })

  it('does not match when date exceeds 5 business days', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-104',
      Total: 1000.00,
      Date: '2026-03-16T00:00:00', // Monday 16 Mar
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-104',
      AmountDue: 1000.00,
      DueDate: '2026-03-02T00:00:00', // Monday 2 Mar — 10 business days apart
    })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    // Should not be an exact match (falls to pass 2 or 3)
    const pass1Matches = result.matches.filter(
      (m) => m.reconciliationStatus === 'auto_matched',
    )
    expect(pass1Matches).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// 4. Pass 2 — Fuzzy Match
// ---------------------------------------------------------------------------

describe('Pass 2 — Fuzzy Match', () => {
  it('matches with confidence 0.85 when amount is within 2% and description partially matches', () => {
    // 2% of 1000 = 20. So 1010 should match.
    const txn = makeBankTxn({
      BankTransactionID: 'bt-200',
      Total: 1010.00,
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-010', Name: 'Acme' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Acme payment' }],
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-200',
      AmountDue: 1000.00,
      DueDate: '2026-03-01T00:00:00',
      Type: 'ACCREC',
      Contact: { ContactID: 'c-010', Name: 'Acme Corp' },
    })
    const contact = makeContact({ ContactID: 'c-010', Name: 'Acme Corp' })

    const result = reconcileTransactions([txn], [inv], [contact])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).toBe('suggested_match')
    expect(result.matches[0].confidence).toBe(0.85)
  })

  it('matches with confidence 0.70 when amount is within 2% but no description match', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-201',
      Total: 505.00,
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-999', Name: 'Unknown Bank' },
      LineItems: [{ LineItemID: 'li-1', Description: 'EFT deposit' }],
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-201',
      AmountDue: 500.00,
      DueDate: '2026-03-03T00:00:00',
      Type: 'ACCREC',
      Contact: { ContactID: 'c-020', Name: 'Zenith Holdings' },
    })
    const contact = makeContact({ ContactID: 'c-020', Name: 'Zenith Holdings' })

    const result = reconcileTransactions([txn], [inv], [contact])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).toBe('suggested_match')
    expect(result.matches[0].confidence).toBe(0.70)
  })

  it('does not fuzzy match when amount exceeds 2% tolerance', () => {
    // 2% of 1000 = 20. So 1021 should NOT match.
    const txn = makeBankTxn({
      BankTransactionID: 'bt-202',
      Total: 1021.00,
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-010', Name: 'Acme' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Acme payment' }],
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-202',
      AmountDue: 1000.00,
      DueDate: '2026-03-01T00:00:00',
      Type: 'ACCREC',
      Contact: { ContactID: 'c-010', Name: 'Acme Corp' },
    })

    const result = reconcileTransactions([txn], [inv], [makeContact({ ContactID: 'c-010', Name: 'Acme Corp' })])

    // Should fall through to pass 3 (unmatched)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).not.toBe('suggested_match')
  })

  it('does not fuzzy match when date exceeds 15 business days', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-203',
      Total: 1000.00,
      Date: '2026-04-01T00:00:00', // Well beyond 15 biz days from 1 Mar
      Contact: { ContactID: 'c-010', Name: 'Acme' },
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-203',
      AmountDue: 1000.00,
      DueDate: '2026-03-01T00:00:00',
      Type: 'ACCREC',
      Contact: { ContactID: 'c-010', Name: 'Acme Corp' },
    })

    const result = reconcileTransactions([txn], [inv], [makeContact({ ContactID: 'c-010', Name: 'Acme Corp' })])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).not.toBe('suggested_match')
    expect(result.matches[0].reconciliationStatus).not.toBe('auto_matched')
  })
})

// ---------------------------------------------------------------------------
// 5. Pass 3 — Rule-Based Classification
// ---------------------------------------------------------------------------

describe('Pass 3 — Rule-Based Classification', () => {
  it('classifies unmatched transactions with a tax code', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-300',
      Total: -55.00,
      Type: 'SPEND',
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-100', Name: 'Telstra' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Telstra monthly plan' }],
    })

    // No matching invoices
    const result = reconcileTransactions([txn], [], [])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).toBe('unmatched')
    expect(result.matches[0].taxCode).toBe('INPUT')
    expect(result.matches[0].taxCategory).toBe('phone_internet')
    expect(result.matches[0].isDeductible).toBe(true)
    expect(result.matches[0].matchedInvoiceId).toBeNull()
    expect(result.matches[0].matchedBillId).toBeNull()
    expect(result.summary.unmatched).toBe(1)
  })

  it('defaults unmatched credits to OUTPUT tax code', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-301',
      Total: 250.00,
      Type: 'RECEIVE',
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-100', Name: 'Some Client' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Miscellaneous deposit' }],
    })

    const result = reconcileTransactions([txn], [], [])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].taxCode).toBe('OUTPUT')
  })

  it('classifies bank fees correctly', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-302',
      Total: -15.00,
      Type: 'SPEND',
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-bank', Name: 'Bank' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Monthly bank fee' }],
    })

    const result = reconcileTransactions([txn], [], [])

    expect(result.matches[0].taxCode).toBe('INPUTTAXED')
    expect(result.matches[0].taxCategory).toBe('bank_fees')
  })
})

// ---------------------------------------------------------------------------
// 6. Edge Cases
// ---------------------------------------------------------------------------

describe('Edge Cases', () => {
  it('skips already reconciled transactions', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-400',
      IsReconciled: true,
    })
    const inv = makeInvoice()

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    expect(result.matches).toHaveLength(0)
    expect(result.summary.total).toBe(0)
  })

  it('skips paid invoices', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-401',
      Total: 1100.00,
      Date: '2026-03-01T00:00:00',
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-401',
      Status: 'PAID',
      AmountDue: 0,
    })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    // Transaction should be unmatched (pass 3)
    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).not.toBe('auto_matched')
  })

  it('skips voided invoices', () => {
    const txn = makeBankTxn({ BankTransactionID: 'bt-402' })
    const inv = makeInvoice({ InvoiceID: 'inv-402', Status: 'VOIDED' })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].matchedInvoiceId).toBeNull()
  })

  it('skips deleted bank transactions', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-403',
      Status: 'DELETED',
    })

    const result = reconcileTransactions([txn], [makeInvoice()], [makeContact()])
    expect(result.matches).toHaveLength(0)
  })

  it('enforces one-to-one matching — invoice cannot match twice', () => {
    const inv = makeInvoice({
      InvoiceID: 'inv-500',
      AmountDue: 1100.00,
      DueDate: '2026-03-01T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })
    const txn1 = makeBankTxn({
      BankTransactionID: 'bt-500',
      Total: 1100.00,
      Date: '2026-03-02T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })
    const txn2 = makeBankTxn({
      BankTransactionID: 'bt-501',
      Total: 1100.00,
      Date: '2026-03-03T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })

    const result = reconcileTransactions([txn1, txn2], [inv], [makeContact()])

    const autoMatched = result.matches.filter(
      (m) => m.reconciliationStatus === 'auto_matched',
    )
    expect(autoMatched).toHaveLength(1)

    // Second transaction should fall through to pass 2 or 3
    const otherMatch = result.matches.find(
      (m) => m.bankTransactionId === (autoMatched[0].bankTransactionId === 'bt-500' ? 'bt-501' : 'bt-500'),
    )
    expect(otherMatch).toBeDefined()
    expect(otherMatch!.reconciliationStatus).not.toBe('auto_matched')
  })

  it('handles empty inputs gracefully', () => {
    const result = reconcileTransactions([], [], [])
    expect(result.matches).toHaveLength(0)
    expect(result.summary.total).toBe(0)
  })

  it('handles zero-amount invoices (skips them)', () => {
    const txn = makeBankTxn({ BankTransactionID: 'bt-404', Total: 0 })
    const inv = makeInvoice({ InvoiceID: 'inv-404', AmountDue: 0 })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    // Invoice with AmountDue=0 is filtered out; txn goes to pass 3
    const matched = result.matches.find((m) => m.matchedInvoiceId === 'inv-404')
    expect(matched).toBeUndefined()
  })

  it('handles /Date(...)/ format from Xero API', () => {
    // /Date(1772524800000)/ = 2026-03-01T00:00:00Z
    const txn = makeBankTxn({
      BankTransactionID: 'bt-405',
      Total: 1100.00,
      Date: '/Date(1772524800000+0000)/',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-405',
      AmountDue: 1100.00,
      DueDate: '2026-03-01T00:00:00',
    })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).toBe('auto_matched')
  })

  it('does not match RECEIVE transactions to ACCPAY bills', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-406',
      Type: 'RECEIVE',
      Total: 500.00,
      Date: '2026-03-01T00:00:00',
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-406',
      Type: 'ACCPAY',
      AmountDue: 500.00,
      DueDate: '2026-03-01T00:00:00',
    })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    expect(result.matches).toHaveLength(1)
    // Should NOT be auto_matched or suggested_match to the ACCPAY bill
    expect(result.matches[0].matchedBillId).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// 7. Manual Review Flagging
// ---------------------------------------------------------------------------

describe('Manual Review Flagging', () => {
  it('flags transactions over $5,000 AUD for manual review', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-600',
      Total: 5500.00, // $5,500 > $5,000
      Date: '2026-03-01T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-600',
      AmountDue: 5500.00,
      DueDate: '2026-03-01T00:00:00',
    })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    expect(result.matches).toHaveLength(1)
    expect(result.matches[0].reconciliationStatus).toBe('manual_review')
    expect(result.matches[0].reasoning).toContain('$5,000')
  })

  it('flags transactions exactly at $5,000 threshold as NOT manual review', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-601',
      Total: 5000.00, // Exactly $5,000 — not > $5,000
      Date: '2026-03-01T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-601',
      AmountDue: 5000.00,
      DueDate: '2026-03-01T00:00:00',
    })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    expect(result.matches).toHaveLength(1)
    // 500000 cents is NOT > 500000, so no manual review flag for this reason
    expect(result.matches[0].reconciliationStatus).toBe('auto_matched')
  })

  it('flags low-confidence unclassified transactions for manual review', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-602',
      Total: 75.00,
      Type: 'SPEND',
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-unknown', Name: '' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Miscellaneous payment' }],
    })

    const result = reconcileTransactions([txn], [], [])

    expect(result.matches).toHaveLength(1)
    // classifyTransaction returns confidence 0.50 with no taxCategory for generic expenses
    // confidence < 0.70 AND no taxCategory → manual review
    expect(result.matches[0].reconciliationStatus).toBe('manual_review')
  })

  it('flags potential duplicate transactions for manual review', () => {
    // Two transactions: same absolute amount, same date, similar descriptions
    const txn1 = makeBankTxn({
      BankTransactionID: 'bt-700',
      Total: -250.00,
      Type: 'SPEND',
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-dup', Name: 'Supplier' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Office supplies order' }],
    })
    const txn2 = makeBankTxn({
      BankTransactionID: 'bt-701',
      Total: -250.00,
      Type: 'SPEND',
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-dup', Name: 'Supplier' },
      LineItems: [{ LineItemID: 'li-2', Description: 'Office supplies delivery' }],
    })

    const result = reconcileTransactions([txn1, txn2], [], [])

    // Both should be flagged for manual review (duplicate detection)
    const manualReview = result.matches.filter(
      (m) => m.reconciliationStatus === 'manual_review',
    )
    expect(manualReview.length).toBeGreaterThanOrEqual(1)
  })
})

// ---------------------------------------------------------------------------
// 8. Summary statistics
// ---------------------------------------------------------------------------

describe('Summary statistics', () => {
  it('correctly counts all reconciliation statuses', () => {
    // Create a mix: 1 exact match, 1 fuzzy match, 1 unmatched
    const txnExact = makeBankTxn({
      BankTransactionID: 'bt-800',
      Total: 1100.00,
      Date: '2026-03-02T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
      LineItems: [{ LineItemID: 'li-1', Description: 'Acme Pty Ltd INV-0001' }],
    })
    const invExact = makeInvoice({
      InvoiceID: 'inv-800',
      AmountDue: 1100.00,
      DueDate: '2026-03-01T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })

    const txnFuzzy = makeBankTxn({
      BankTransactionID: 'bt-801',
      Total: 505.00,
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-002', Name: 'Beta' },
      LineItems: [{ LineItemID: 'li-2', Description: 'Beta Corp payment' }],
    })
    const invFuzzy = makeInvoice({
      InvoiceID: 'inv-801',
      AmountDue: 500.00,
      DueDate: '2026-03-03T00:00:00',
      Type: 'ACCREC',
      Contact: { ContactID: 'c-002', Name: 'Beta Corp' },
    })

    const txnUnmatched = makeBankTxn({
      BankTransactionID: 'bt-802',
      Total: -30.00,
      Type: 'SPEND',
      Date: '2026-03-05T00:00:00',
      Contact: { ContactID: 'c-bank', Name: 'Bank' },
      LineItems: [{ LineItemID: 'li-3', Description: 'Monthly bank fee' }],
    })

    const result = reconcileTransactions(
      [txnExact, txnFuzzy, txnUnmatched],
      [invExact, invFuzzy],
      [
        makeContact({ ContactID: 'c-001', Name: 'Acme Pty Ltd' }),
        makeContact({ ContactID: 'c-002', Name: 'Beta Corp' }),
      ],
    )

    expect(result.summary.total).toBe(3)
    expect(result.summary.autoMatched).toBe(1)
    expect(result.summary.suggestedMatch).toBe(1)
    // Bank fee has taxCategory so won't be flagged for manual review,
    // but it IS unmatched
    expect(result.summary.unmatched).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// 9. GST calculation
// ---------------------------------------------------------------------------

describe('GST calculation', () => {
  it('calculates GST for matched sales invoices', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-900',
      Total: 1100.00,
      Date: '2026-03-01T00:00:00',
      Contact: { ContactID: 'c-001', Name: 'Acme Pty Ltd' },
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-900',
      AmountDue: 1100.00,
      DueDate: '2026-03-01T00:00:00',
    })

    const result = reconcileTransactions([txn], [inv], [makeContact()])

    expect(result.matches[0].taxCode).toBe('OUTPUT')
    // GST = 110000 / 11 = 10000 cents = $100
    expect(result.matches[0].gstAmountCents).toBe(10000)
  })

  it('calculates GST for matched bills', () => {
    const txn = makeBankTxn({
      BankTransactionID: 'bt-901',
      Total: -550.00,
      Type: 'SPEND',
      Date: '2026-03-01T00:00:00',
      Contact: { ContactID: 'c-003', Name: 'Supplier' },
    })
    const inv = makeInvoice({
      InvoiceID: 'inv-901',
      Type: 'ACCPAY',
      AmountDue: 550.00,
      DueDate: '2026-03-01T00:00:00',
      Contact: { ContactID: 'c-003', Name: 'Supplier' },
    })

    const result = reconcileTransactions(
      [txn],
      [inv],
      [makeContact({ ContactID: 'c-003', Name: 'Supplier' })],
    )

    expect(result.matches[0].taxCode).toBe('INPUT')
    // GST = 55000 / 11 = 5000 cents = $50 (truncated)
    expect(result.matches[0].gstAmountCents).toBe(5000)
  })
})

// ---------------------------------------------------------------------------
// 10. Integration: full pipeline
// ---------------------------------------------------------------------------

describe('Integration: full pipeline', () => {
  it('processes a realistic batch with all three passes', () => {
    const contacts = [
      makeContact({ ContactID: 'c-alpha', Name: 'Alpha Services Pty Ltd' }),
      makeContact({ ContactID: 'c-beta', Name: 'Beta Supplies' }),
      makeContact({ ContactID: 'c-gamma', Name: 'Gamma Tech' }),
    ]

    const invoices = [
      // Exact match candidate
      makeInvoice({
        InvoiceID: 'inv-alpha',
        InvoiceNumber: 'INV-1001',
        Type: 'ACCREC',
        AmountDue: 3300.00,
        DueDate: '2026-03-03T00:00:00',
        Contact: { ContactID: 'c-alpha', Name: 'Alpha Services Pty Ltd' },
      }),
      // Fuzzy match candidate
      makeInvoice({
        InvoiceID: 'inv-beta',
        InvoiceNumber: 'BILL-202',
        Type: 'ACCPAY',
        AmountDue: 800.00,
        DueDate: '2026-03-10T00:00:00',
        Contact: { ContactID: 'c-beta', Name: 'Beta Supplies' },
      }),
      // Already paid — should be filtered out
      makeInvoice({
        InvoiceID: 'inv-paid',
        Status: 'PAID',
        AmountDue: 0,
      }),
    ]

    const transactions = [
      // Should exact match to inv-alpha (amount, date, description all match)
      makeBankTxn({
        BankTransactionID: 'bt-a',
        Type: 'RECEIVE',
        Total: 3300.00,
        Date: '2026-03-04T00:00:00',
        Contact: { ContactID: 'c-alpha', Name: 'Alpha Services Pty Ltd' },
        LineItems: [{ LineItemID: 'li-a', Description: 'INV-1001 payment' }],
      }),
      // Should fuzzy match to inv-beta (amount within 2%, date within 15 days)
      makeBankTxn({
        BankTransactionID: 'bt-b',
        Type: 'SPEND',
        Total: -808.00, // 1% over 800
        Date: '2026-03-12T00:00:00',
        Contact: { ContactID: 'c-beta', Name: 'Beta Supplies' },
        LineItems: [{ LineItemID: 'li-b', Description: 'Beta payment' }],
      }),
      // Should be unmatched — no invoice, classified as telco
      makeBankTxn({
        BankTransactionID: 'bt-c',
        Type: 'SPEND',
        Total: -99.00,
        Date: '2026-03-05T00:00:00',
        Contact: { ContactID: 'c-telstra', Name: 'Telstra' },
        LineItems: [{ LineItemID: 'li-c', Description: 'Telstra mobile plan' }],
      }),
      // Already reconciled — should be skipped entirely
      makeBankTxn({
        BankTransactionID: 'bt-d',
        IsReconciled: true,
        Total: 500.00,
        Date: '2026-03-01T00:00:00',
      }),
    ]

    const result = reconcileTransactions(transactions, invoices, contacts)

    // 3 eligible transactions (bt-d is skipped)
    expect(result.summary.total).toBe(3)
    expect(result.summary.autoMatched).toBe(1)
    expect(result.summary.suggestedMatch).toBe(1)
    expect(result.summary.unmatched).toBe(1)

    // Verify exact match
    const exactMatch = result.matches.find((m) => m.bankTransactionId === 'bt-a')
    expect(exactMatch).toBeDefined()
    expect(exactMatch!.reconciliationStatus).toBe('auto_matched')
    expect(exactMatch!.matchedInvoiceId).toBe('inv-alpha')
    expect(exactMatch!.confidence).toBe(1.00)

    // Verify fuzzy match
    const fuzzyMatch = result.matches.find((m) => m.bankTransactionId === 'bt-b')
    expect(fuzzyMatch).toBeDefined()
    expect(fuzzyMatch!.reconciliationStatus).toBe('suggested_match')
    expect(fuzzyMatch!.matchedBillId).toBe('inv-beta')
    expect(fuzzyMatch!.confidence).toBe(0.85)

    // Verify rule-based classification
    const classified = result.matches.find((m) => m.bankTransactionId === 'bt-c')
    expect(classified).toBeDefined()
    expect(classified!.reconciliationStatus).toBe('unmatched')
    expect(classified!.taxCode).toBe('INPUT')
    expect(classified!.taxCategory).toBe('phone_internet')
  })
})
