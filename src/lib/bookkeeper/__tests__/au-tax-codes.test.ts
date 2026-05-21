// src/lib/bookkeeper/__tests__/au-tax-codes.test.ts
import {
  AU_TAX_CODES,
  DEDUCTION_CATEGORIES,
  classifyTransaction,
  calculateGstAmount,
} from '../au-tax-codes'
import type { AuTaxCode, DeductionCategory, ClassificationResult } from '../au-tax-codes'

// ---------------------------------------------------------------------------
// 1. AU_TAX_CODES reference data
// ---------------------------------------------------------------------------

describe('AU_TAX_CODES', () => {
  it('contains exactly 8 tax codes', () => {
    expect(Object.keys(AU_TAX_CODES)).toHaveLength(8)
  })

  it('has all expected code keys', () => {
    const expectedKeys = [
      'OUTPUT',
      'INPUT',
      'GSTONIMPORTS',
      'EXEMPTOUTPUT',
      'EXEMPTINPUT',
      'INPUTTAXED',
      'BASEXCLUDED',
      'EXEMPTEXPORT',
    ]
    expect(Object.keys(AU_TAX_CODES).sort()).toEqual(expectedKeys.sort())
  })

  it('every entry has the correct shape', () => {
    for (const [key, entry] of Object.entries(AU_TAX_CODES)) {
      expect(entry.code).toBe(key)
      expect(typeof entry.description).toBe('string')
      expect(entry.description.length).toBeGreaterThan(0)
      expect(typeof entry.rate).toBe('number')
      expect(entry.rate).toBeGreaterThanOrEqual(0)
      expect(entry.rate).toBeLessThanOrEqual(1)
      expect(['collected', 'paid', 'exempt', 'excluded']).toContain(entry.gstType)
      expect(typeof entry.basReportable).toBe('boolean')
    }
  })

  it('GST-rated codes have 10% rate', () => {
    const gstRatedCodes = ['OUTPUT', 'INPUT', 'GSTONIMPORTS']
    for (const key of gstRatedCodes) {
      expect(AU_TAX_CODES[key].rate).toBe(0.10)
    }
  })

  it('zero-rated codes have 0% rate', () => {
    const zeroRatedCodes = ['EXEMPTOUTPUT', 'EXEMPTINPUT', 'INPUTTAXED', 'BASEXCLUDED', 'EXEMPTEXPORT']
    for (const key of zeroRatedCodes) {
      expect(AU_TAX_CODES[key].rate).toBe(0)
    }
  })

  it('OUTPUT is collected GST', () => {
    expect(AU_TAX_CODES.OUTPUT.gstType).toBe('collected')
  })

  it('INPUT and GSTONIMPORTS are paid GST', () => {
    expect(AU_TAX_CODES.INPUT.gstType).toBe('paid')
    expect(AU_TAX_CODES.GSTONIMPORTS.gstType).toBe('paid')
  })

  it('BASEXCLUDED is not BAS reportable', () => {
    expect(AU_TAX_CODES.BASEXCLUDED.basReportable).toBe(false)
  })

  it('all other codes are BAS reportable', () => {
    const others = Object.entries(AU_TAX_CODES).filter(([key]) => key !== 'BASEXCLUDED')
    for (const [, entry] of others) {
      expect(entry.basReportable).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// 2. DEDUCTION_CATEGORIES reference data
// ---------------------------------------------------------------------------

describe('DEDUCTION_CATEGORIES', () => {
  it('contains exactly 16 categories', () => {
    expect(Object.keys(DEDUCTION_CATEGORIES)).toHaveLength(16)
  })

  it('every category has the correct shape', () => {
    for (const [key, cat] of Object.entries(DEDUCTION_CATEGORIES)) {
      expect(cat.key).toBe(key)
      expect(typeof cat.name).toBe('string')
      expect(cat.name.length).toBeGreaterThan(0)
      expect(typeof cat.atoReference).toBe('string')
      expect(cat.atoReference.length).toBeGreaterThan(0)
      expect(typeof cat.description).toBe('string')
      expect(typeof cat.defaultTaxCode).toBe('string')
      // Ensure the default tax code actually exists
      expect(AU_TAX_CODES).toHaveProperty(cat.defaultTaxCode)
    }
  })

  it('wages_salaries defaults to BASEXCLUDED', () => {
    expect(DEDUCTION_CATEGORIES.wages_salaries.defaultTaxCode).toBe('BASEXCLUDED')
  })

  it('super_contributions defaults to BASEXCLUDED', () => {
    expect(DEDUCTION_CATEGORIES.super_contributions.defaultTaxCode).toBe('BASEXCLUDED')
  })

  it('bank_fees defaults to INPUTTAXED', () => {
    expect(DEDUCTION_CATEGORIES.bank_fees.defaultTaxCode).toBe('INPUTTAXED')
  })

  it('interest_charges defaults to INPUTTAXED', () => {
    expect(DEDUCTION_CATEGORIES.interest_charges.defaultTaxCode).toBe('INPUTTAXED')
  })

  it('motor_vehicle defaults to INPUT', () => {
    expect(DEDUCTION_CATEGORIES.motor_vehicle.defaultTaxCode).toBe('INPUT')
  })

  it('advertising_marketing references S.8-1', () => {
    expect(DEDUCTION_CATEGORIES.advertising_marketing.atoReference).toBe('S.8-1')
  })

  it('instant_asset_writeoff references S.328-180', () => {
    expect(DEDUCTION_CATEGORIES.instant_asset_writeoff.atoReference).toBe('S.328-180')
  })
})

// ---------------------------------------------------------------------------
// 3. classifyTransaction — rules engine
// ---------------------------------------------------------------------------

describe('classifyTransaction', () => {
  // Helper to assert the basic shape of every result
  function expectValidResult(result: ClassificationResult) {
    expect(typeof result.taxCode).toBe('string')
    expect(AU_TAX_CODES).toHaveProperty(result.taxCode)
    expect(typeof result.isDeductible).toBe('boolean')
    expect(result.confidence).toBeGreaterThanOrEqual(0.50)
    expect(result.confidence).toBeLessThanOrEqual(0.69)
    expect(typeof result.reasoning).toBe('string')
    expect(result.reasoning.length).toBeGreaterThan(0)
    if (result.taxCategory !== null) {
      expect(DEDUCTION_CATEGORIES).toHaveProperty(result.taxCategory)
    }
  }

  // --- Rule 1: Inter-account transfers ---
  describe('inter-account transfers', () => {
    it.each([
      'Transfer to savings',
      'Internal TFR',
      'INTERNAL TRANSFER 12345',
      'tfr from cheque',
    ])('classifies "%s" as BASEXCLUDED transfer', (desc) => {
      const result = classifyTransaction(desc, -50000)
      expectValidResult(result)
      expect(result.taxCode).toBe('BASEXCLUDED')
      expect(result.taxCategory).toBeNull()
      expect(result.isDeductible).toBe(false)
    })
  })

  // --- Rule 2: ATO payments ---
  describe('ATO payments', () => {
    it.each([
      'ATO Payment',
      'Australian Taxation Office',
      'BAS Q3 2025',
      'PAYG Instalment',
    ])('classifies "%s" as BASEXCLUDED', (desc) => {
      const result = classifyTransaction(desc, -120000)
      expectValidResult(result)
      expect(result.taxCode).toBe('BASEXCLUDED')
      expect(result.isDeductible).toBe(false)
    })
  })

  // --- Rule 3: Superannuation ---
  describe('superannuation', () => {
    it.each([
      'Australian Super contribution',
      'SUNSUPER EMPLOYER',
      'Hostplus SG payment',
      'Super guarantee Q4',
      'Rest Super',
    ])('classifies "%s" as BASEXCLUDED / super_contributions', (desc) => {
      const result = classifyTransaction(desc, -85000)
      expectValidResult(result)
      expect(result.taxCode).toBe('BASEXCLUDED')
      expect(result.taxCategory).toBe('super_contributions')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 4: Wages/salary ---
  describe('wages and salary', () => {
    it.each([
      'Wages payment - John',
      'Salary payment',
      'Payroll run #42',
      'Pay run March 2026',
    ])('classifies "%s" as BASEXCLUDED / wages_salaries', (desc) => {
      const result = classifyTransaction(desc, -350000)
      expectValidResult(result)
      expect(result.taxCode).toBe('BASEXCLUDED')
      expect(result.taxCategory).toBe('wages_salaries')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 5: Bank fees ---
  describe('bank fees', () => {
    it.each([
      'Monthly bank fee',
      'Merchant fee Nov',
      'EFTPOS Fee',
      'Payment fee - Stripe',
    ])('classifies "%s" as INPUTTAXED / bank_fees', (desc) => {
      const result = classifyTransaction(desc, -2500)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUTTAXED')
      expect(result.taxCategory).toBe('bank_fees')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 6: Interest ---
  describe('interest charges', () => {
    it.each([
      'Interest charge on loan',
      'Loan interest Feb',
      'Overdraft interest',
    ])('classifies "%s" as INPUTTAXED / interest_charges', (desc) => {
      const result = classifyTransaction(desc, -15000)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUTTAXED')
      expect(result.taxCategory).toBe('interest_charges')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 7: Insurance ---
  describe('insurance', () => {
    it.each([
      'QBE Business Insurance',
      'Allianz premium',
      'NRMA Insurance renewal',
      'Suncorp Insurance',
      'Public liability insurance',
    ])('classifies "%s" as INPUT / insurance', (desc) => {
      const result = classifyTransaction(desc, -120000)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('insurance')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 8: Fuel ---
  describe('fuel', () => {
    it.each([
      'BP NORTH LAKES',
      'CALTEX WOOLWORTHS',
      'SHELL FORTITUDE VALLEY',
      'AMPOL SPRINGWOOD',
      'Puma Energy Springfield',
      'United Petroleum Logan',
    ])('classifies "%s" as INPUT / motor_vehicle', (desc) => {
      const result = classifyTransaction(desc, -8500)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('motor_vehicle')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 9: Telco ---
  describe('telecommunications', () => {
    it.each([
      'Telstra mobile plan',
      'Optus business',
      'Vodafone monthly',
      'Aussie Broadband NBN',
      'TPG Internet',
      'Belong plan',
    ])('classifies "%s" as INPUT / phone_internet', (desc) => {
      const result = classifyTransaction(desc, -9900)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('phone_internet')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 10: Software subscriptions ---
  describe('software subscriptions', () => {
    it.each([
      'XERO MONTHLY',
      'Adobe Creative Cloud',
      'Microsoft 365',
      'Google Workspace',
      'Slack Pro',
      'Notion team',
      'Canva Pro',
      'Figma professional',
      'GitHub Team',
      'Vercel Pro',
      'AWS monthly',
      'Stripe fee Oct',
    ])('classifies "%s" as INPUT / subscriptions', (desc) => {
      const result = classifyTransaction(desc, -5500)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('subscriptions')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 11: Office supplies ---
  describe('office supplies', () => {
    it.each([
      'OFFICEWORKS PTY LTD',
      'Staples online',
      'Cartridge World',
    ])('classifies "%s" as INPUT / office_supplies', (desc) => {
      const result = classifyTransaction(desc, -4500)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('office_supplies')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 12: Hardware / repairs ---
  describe('hardware and repairs', () => {
    it.each([
      'BUNNINGS WAREHOUSE',
      'Total Tools Brisbane',
      'Supercheap Auto parts',
    ])('classifies "%s" as INPUT / repairs_maintenance', (desc) => {
      const result = classifyTransaction(desc, -25000)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('repairs_maintenance')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 13: Advertising ---
  describe('advertising', () => {
    it.each([
      'Google Ads campaign',
      'Facebook Ads Nov',
      'Meta Ads spend',
      'LinkedIn Ads',
      'TikTok Ads',
    ])('classifies "%s" as INPUT / advertising_marketing', (desc) => {
      const result = classifyTransaction(desc, -30000)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('advertising_marketing')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 14: Professional services ---
  describe('professional services', () => {
    it.each([
      'Accounting fee',
      'Solicitor retainer',
      'Lawyer settlement',
      'Business consultant',
      'Tax advisory',
    ])('classifies "%s" as INPUT / professional_services', (desc) => {
      const result = classifyTransaction(desc, -45000)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('professional_services')
      expect(result.isDeductible).toBe(true)
    })
  })

  // --- Rule 15: Unmatched income ---
  describe('unmatched income (positive amounts)', () => {
    it('classifies an unknown credit as OUTPUT', () => {
      const result = classifyTransaction('CUSTOMER PAYMENT REF 12345', 250000)
      expectValidResult(result)
      expect(result.taxCode).toBe('OUTPUT')
      expect(result.taxCategory).toBeNull()
      expect(result.isDeductible).toBe(false)
      expect(result.confidence).toBe(0.50)
    })
  })

  // --- Rule 16: Unmatched expense ---
  describe('unmatched expense (negative amounts)', () => {
    it('classifies an unknown debit as INPUT', () => {
      const result = classifyTransaction('UNKNOWN VENDOR PTY LTD', -17500)
      expectValidResult(result)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBeNull()
      expect(result.isDeductible).toBe(true)
      expect(result.confidence).toBe(0.50)
    })
  })

  // --- Priority ordering ---
  describe('rule priority', () => {
    it('transfer rule takes priority over other matches', () => {
      // "Transfer to ATO" should match transfer (rule 1) not ATO (rule 2)
      const result = classifyTransaction('Transfer to ATO', -100000)
      expect(result.taxCode).toBe('BASEXCLUDED')
      expect(result.taxCategory).toBeNull()
      expect(result.isDeductible).toBe(false)
    })

    it('ATO rule takes priority over super', () => {
      // "ATO Super Guarantee" should match ATO (rule 2) not super (rule 3)
      const result = classifyTransaction('ATO Super Guarantee', -50000)
      expect(result.taxCode).toBe('BASEXCLUDED')
      expect(result.taxCategory).toBeNull()
      expect(result.isDeductible).toBe(false)
    })
  })

  // --- Case insensitivity ---
  describe('case insensitivity', () => {
    it('matches regardless of case', () => {
      const lower = classifyTransaction('telstra monthly', -9900)
      const upper = classifyTransaction('TELSTRA MONTHLY', -9900)
      const mixed = classifyTransaction('Telstra Monthly', -9900)

      expect(lower.taxCode).toBe(upper.taxCode)
      expect(lower.taxCode).toBe(mixed.taxCode)
      expect(lower.taxCategory).toBe('phone_internet')
    })
  })

  // --- Whitespace handling ---
  describe('whitespace handling', () => {
    it('handles leading/trailing whitespace', () => {
      const result = classifyTransaction('  BP FUEL PURCHASE  ', -7500)
      expect(result.taxCode).toBe('INPUT')
      expect(result.taxCategory).toBe('motor_vehicle')
    })
  })

  // --- Confidence ranges ---
  describe('confidence values', () => {
    it('all results have confidence between 0.50 and 0.69', () => {
      const testCases = [
        { desc: 'Transfer to savings', amount: -50000 },
        { desc: 'ATO PAYG', amount: -120000 },
        { desc: 'Sunsuper', amount: -85000 },
        { desc: 'Monthly bank fee', amount: -1500 },
        { desc: 'BP fuel', amount: -8500 },
        { desc: 'Google Ads', amount: -30000 },
        { desc: 'Random vendor', amount: -5000 },
        { desc: 'Random payment received', amount: 100000 },
      ]

      for (const { desc, amount } of testCases) {
        const result = classifyTransaction(desc, amount)
        expect(result.confidence).toBeGreaterThanOrEqual(0.50)
        expect(result.confidence).toBeLessThanOrEqual(0.69)
      }
    })

    it('specific brand matches have higher confidence than generic patterns', () => {
      const specificResult = classifyTransaction('Google Ads campaign', -30000)
      const genericResult = classifyTransaction('Some random expense', -30000)
      expect(specificResult.confidence).toBeGreaterThan(genericResult.confidence)
    })
  })
})

// ---------------------------------------------------------------------------
// 4. calculateGstAmount
// ---------------------------------------------------------------------------

describe('calculateGstAmount', () => {
  it('calculates GST as total / 11 for OUTPUT', () => {
    // $110.00 GST-inclusive → GST = $10.00
    expect(calculateGstAmount(11000, 'OUTPUT')).toBe(1000)
  })

  it('calculates GST as total / 11 for INPUT', () => {
    // $55.00 GST-inclusive → GST = $5.00
    expect(calculateGstAmount(5500, 'INPUT')).toBe(500)
  })

  it('calculates GST as total / 11 for GSTONIMPORTS', () => {
    expect(calculateGstAmount(11000, 'GSTONIMPORTS')).toBe(1000)
  })

  it('returns 0 for zero-rated tax codes', () => {
    const zeroRatedCodes = [
      'EXEMPTOUTPUT',
      'EXEMPTINPUT',
      'INPUTTAXED',
      'BASEXCLUDED',
      'EXEMPTEXPORT',
    ]
    for (const code of zeroRatedCodes) {
      expect(calculateGstAmount(11000, code)).toBe(0)
    }
  })

  it('returns 0 for unknown tax codes', () => {
    expect(calculateGstAmount(11000, 'INVALID_CODE')).toBe(0)
  })

  it('truncates towards zero for non-divisible amounts', () => {
    // $100.00 GST-inclusive → GST = 10000 / 11 = 909.09... → 909
    expect(calculateGstAmount(10000, 'INPUT')).toBe(909)
  })

  it('handles negative amounts (expense debits)', () => {
    // -$110.00 → GST = -$10.00
    expect(calculateGstAmount(-11000, 'INPUT')).toBe(-1000)
  })

  it('handles negative non-divisible amounts', () => {
    // -$100.00 → GST = -10000 / 11 = -909.09... → -909 (truncated towards zero)
    expect(calculateGstAmount(-10000, 'INPUT')).toBe(-909)
  })

  it('returns 0 for zero amount', () => {
    expect(calculateGstAmount(0, 'INPUT')).toBe(0)
    expect(calculateGstAmount(0, 'OUTPUT')).toBe(0)
  })

  it('handles typical Australian transaction amounts', () => {
    // $29.95 → GST = 2995 / 11 = 272.27... → 272
    expect(calculateGstAmount(2995, 'INPUT')).toBe(272)

    // $1,199.00 → GST = 119900 / 11 = 10900
    expect(calculateGstAmount(119900, 'INPUT')).toBe(10900)

    // $49.99 → GST = 4999 / 11 = 454.45... → 454
    expect(calculateGstAmount(4999, 'OUTPUT')).toBe(454)
  })
})
