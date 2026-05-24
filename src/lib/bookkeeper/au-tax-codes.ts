// src/lib/bookkeeper/au-tax-codes.ts
// Australian tax code reference data and transaction classification engine.
// Aligned to Xero AU chart of accounts and ATO deduction categories.

// ---------------------------------------------------------------------------
// 1. Tax Code Reference Data
// ---------------------------------------------------------------------------

export interface AuTaxCode {
  code: string
  description: string
  rate: number
  gstType: 'collected' | 'paid' | 'exempt' | 'excluded'
  basReportable: boolean
}

export const AU_TAX_CODES: Record<string, AuTaxCode> = {
  OUTPUT:       { code: 'OUTPUT',       description: 'GST on Income',     rate: 0.10, gstType: 'collected', basReportable: true },
  INPUT:        { code: 'INPUT',        description: 'GST on Expenses',   rate: 0.10, gstType: 'paid',      basReportable: true },
  GSTONIMPORTS: { code: 'GSTONIMPORTS', description: 'GST on Imports',    rate: 0.10, gstType: 'paid',      basReportable: true },
  EXEMPTOUTPUT: { code: 'EXEMPTOUTPUT', description: 'GST-Free Income',   rate: 0,    gstType: 'exempt',    basReportable: true },
  EXEMPTINPUT:  { code: 'EXEMPTINPUT',  description: 'GST-Free Expenses', rate: 0,    gstType: 'exempt',    basReportable: true },
  INPUTTAXED:   { code: 'INPUTTAXED',   description: 'Input Taxed',       rate: 0,    gstType: 'exempt',    basReportable: true },
  BASEXCLUDED:  { code: 'BASEXCLUDED',  description: 'BAS Excluded',      rate: 0,    gstType: 'excluded',  basReportable: false },
  EXEMPTEXPORT: { code: 'EXEMPTEXPORT', description: 'Export Income',     rate: 0,    gstType: 'exempt',    basReportable: true },
}

// ---------------------------------------------------------------------------
// 2. Deduction Category Reference (ATO-aligned)
// ---------------------------------------------------------------------------

export interface DeductionCategory {
  key: string
  name: string
  atoReference: string
  description: string
  defaultTaxCode: string
}

export const DEDUCTION_CATEGORIES: Record<string, DeductionCategory> = {
  motor_vehicle: {
    key: 'motor_vehicle',
    name: 'Motor Vehicle',
    atoReference: 'Div 28',
    description: 'Fuel, rego, insurance, lease payments',
    defaultTaxCode: 'INPUT',
  },
  travel: {
    key: 'travel',
    name: 'Travel',
    atoReference: 'Div 32',
    description: 'Flights, accommodation, meals (business)',
    defaultTaxCode: 'INPUT',
  },
  professional_services: {
    key: 'professional_services',
    name: 'Professional Services',
    atoReference: 'S.8-1',
    description: 'Accounting, legal, consulting fees',
    defaultTaxCode: 'INPUT',
  },
  insurance: {
    key: 'insurance',
    name: 'Insurance',
    atoReference: 'S.8-1',
    description: 'Business insurance premiums',
    defaultTaxCode: 'INPUT',
  },
  office_supplies: {
    key: 'office_supplies',
    name: 'Office Supplies',
    atoReference: 'S.8-1',
    description: 'Stationery, software subscriptions',
    defaultTaxCode: 'INPUT',
  },
  phone_internet: {
    key: 'phone_internet',
    name: 'Phone & Internet',
    atoReference: 'S.8-1',
    description: 'Business % of phone/internet',
    defaultTaxCode: 'INPUT',
  },
  repairs_maintenance: {
    key: 'repairs_maintenance',
    name: 'Repairs & Maintenance',
    atoReference: 'S.25-10',
    description: 'Equipment repairs, building maintenance',
    defaultTaxCode: 'INPUT',
  },
  instant_asset_writeoff: {
    key: 'instant_asset_writeoff',
    name: 'Instant Asset Write-Off',
    atoReference: 'S.328-180',
    description: 'Assets under $20,000 (small business)',
    defaultTaxCode: 'INPUT',
  },
  super_contributions: {
    key: 'super_contributions',
    name: 'Superannuation',
    atoReference: 'SG Div 292',
    description: 'Employer super (currently 11.5%)',
    defaultTaxCode: 'BASEXCLUDED',
  },
  wages_salaries: {
    key: 'wages_salaries',
    name: 'Wages & Salaries',
    atoReference: 'BASEXCLUDED',
    description: 'Employee wages — GST-free, BAS excluded',
    defaultTaxCode: 'BASEXCLUDED',
  },
  contractors: {
    key: 'contractors',
    name: 'Contractors',
    atoReference: 'S.8-1',
    description: 'Subcontractor payments',
    defaultTaxCode: 'INPUT',
  },
  advertising_marketing: {
    key: 'advertising_marketing',
    name: 'Advertising & Marketing',
    atoReference: 'S.8-1',
    description: 'Google Ads, social media, printing',
    defaultTaxCode: 'INPUT',
  },
  training_education: {
    key: 'training_education',
    name: 'Training & Education',
    atoReference: 'S.8-1',
    description: 'Professional development, courses',
    defaultTaxCode: 'INPUT',
  },
  subscriptions: {
    key: 'subscriptions',
    name: 'Subscriptions',
    atoReference: 'S.8-1',
    description: 'Industry memberships, software',
    defaultTaxCode: 'INPUT',
  },
  interest_charges: {
    key: 'interest_charges',
    name: 'Interest & Charges',
    atoReference: 'S.8-1',
    description: 'Business loan interest',
    defaultTaxCode: 'INPUTTAXED',
  },
  bank_fees: {
    key: 'bank_fees',
    name: 'Bank Fees',
    atoReference: 'S.8-1',
    description: 'Bank account and merchant fees',
    defaultTaxCode: 'INPUTTAXED',
  },
}

// ---------------------------------------------------------------------------
// 3. Classification Rules Engine
// ---------------------------------------------------------------------------

export interface ClassificationResult {
  taxCode: string
  taxCategory: string | null
  isDeductible: boolean
  confidence: number
  reasoning: string
}

/**
 * A single classification rule. Rules are evaluated in priority order;
 * the first match wins.
 */
interface ClassificationRule {
  patterns: RegExp[]
  taxCode: string
  taxCategory: string | null
  isDeductible: boolean
  confidence: number
  reasoning: string
}

/**
 * Ordered classification rules — highest priority first.
 * Each rule contains one or more regex patterns tested against the
 * lowercased transaction description.
 */
const CLASSIFICATION_RULES: ClassificationRule[] = [
  // 1. Inter-account transfers
  {
    patterns: [/\btransfer\b/, /\btfr\b/, /\binternal\b/],
    taxCode: 'BASEXCLUDED',
    taxCategory: null,
    isDeductible: false,
    confidence: 0.60,
    reasoning: 'Inter-account transfer — not assessable income or deductible expense',
  },
  // 2. ATO payments
  {
    patterns: [/\bato\b/, /\baustralian taxation\b/, /\bbas\b/, /\bpayg\b/],
    taxCode: 'BASEXCLUDED',
    taxCategory: null,
    isDeductible: false,
    confidence: 0.65,
    reasoning: 'ATO/BAS/PAYG payment — tax remittance, not a deductible expense',
  },
  // 3. Superannuation
  {
    patterns: [
      /\bsuper\b/,
      /\bsuperannuation\b/,
      /\bsunsuper\b/,
      /\baustralian super\b/,
      /\brest super\b/,
      /\bhostplus\b/,
    ],
    taxCode: 'BASEXCLUDED',
    taxCategory: 'super_contributions',
    isDeductible: true,
    confidence: 0.65,
    reasoning: 'Superannuation contribution — deductible but BAS excluded (no GST)',
  },
  // 4. Wages/salary
  {
    patterns: [/\bwages?\b/, /\bsalary\b/, /\bpayroll\b/, /\bpay run\b/],
    taxCode: 'BASEXCLUDED',
    taxCategory: 'wages_salaries',
    isDeductible: true,
    confidence: 0.65,
    reasoning: 'Wages/salary payment — deductible but BAS excluded (no GST)',
  },
  // 5. Bank fees
  {
    patterns: [
      /\bbank fee\b/,
      /\bmonthly fee\b/,
      /\bmerchant fee\b/,
      /\beftpos fee\b/,
      /\bpayment fee\b/,
    ],
    taxCode: 'INPUTTAXED',
    taxCategory: 'bank_fees',
    isDeductible: true,
    confidence: 0.65,
    reasoning: 'Bank/merchant fee — input taxed (no GST claimable)',
  },
  // 6. Interest
  {
    patterns: [/\binterest charge\b/, /\bloan interest\b/, /\boverdraft interest\b/],
    taxCode: 'INPUTTAXED',
    taxCategory: 'interest_charges',
    isDeductible: true,
    confidence: 0.65,
    reasoning: 'Interest charge — input taxed financial supply (no GST claimable)',
  },
  // 7. Insurance
  {
    patterns: [/\binsurance\b/, /\bqbe\b/, /\ballianz\b/, /\bsuncorp insurance\b/, /\bnrma insurance\b/],
    taxCode: 'INPUT',
    taxCategory: 'insurance',
    isDeductible: true,
    confidence: 0.60,
    reasoning: 'Insurance premium — GST claimable business expense',
  },
  // 8. Fuel (Australian service station brands)
  {
    patterns: [
      /\bbp\b/,
      /\bcaltex\b/,
      /\bshell\b/,
      /\bampol\b/,
      /\bpuma energy\b/,
      /\bunited petroleum\b/,
      /\b7-eleven fuel\b/,
    ],
    taxCode: 'INPUT',
    taxCategory: 'motor_vehicle',
    isDeductible: true,
    confidence: 0.67,
    reasoning: 'Fuel purchase — GST claimable motor vehicle expense',
  },
  // 9. Telco
  {
    patterns: [/\btelstra\b/, /\boptus\b/, /\bvodafone\b/, /\baussie broadband\b/, /\btpg\b/, /\bbelong\b/],
    taxCode: 'INPUT',
    taxCategory: 'phone_internet',
    isDeductible: true,
    confidence: 0.67,
    reasoning: 'Telecommunications provider — GST claimable phone/internet expense',
  },
  // 10. Software subscriptions
  {
    patterns: [
      /\bxero\b/,
      /\badobe\b/,
      /\bmicrosoft\b/,
      /\bgoogle workspace\b/,
      /\bslack\b/,
      /\bnotion\b/,
      /\bcanva\b/,
      /\bfigma\b/,
      /\bgithub\b/,
      /\bvercel\b/,
      /\baws\b/,
      /\bstripe fee\b/,
    ],
    taxCode: 'INPUT',
    taxCategory: 'subscriptions',
    isDeductible: true,
    confidence: 0.65,
    reasoning: 'Software/SaaS subscription — GST claimable business expense',
  },
  // 11. Office supplies
  {
    patterns: [/\bofficeworks\b/, /\bstaples\b/, /\bcartridge world\b/],
    taxCode: 'INPUT',
    taxCategory: 'office_supplies',
    isDeductible: true,
    confidence: 0.67,
    reasoning: 'Office supplies retailer — GST claimable',
  },
  // 12. Hardware / repairs
  {
    patterns: [/\bbunnings\b/, /\btotal tools\b/, /\bsupercheap auto\b/],
    taxCode: 'INPUT',
    taxCategory: 'repairs_maintenance',
    isDeductible: true,
    confidence: 0.60,
    reasoning: 'Hardware/repair supplies — GST claimable repairs & maintenance',
  },
  // 13. Advertising
  {
    patterns: [/\bgoogle ads\b/, /\bfacebook ads\b/, /\bmeta ads\b/, /\blinkedin ads\b/, /\btiktok ads\b/],
    taxCode: 'INPUT',
    taxCategory: 'advertising_marketing',
    isDeductible: true,
    confidence: 0.69,
    reasoning: 'Digital advertising — GST claimable marketing expense',
  },
  // 14. Professional services
  {
    patterns: [/\baccounting\b/, /\bsolicitor\b/, /\blawyer\b/, /\bconsultant\b/, /\badvisory\b/],
    taxCode: 'INPUT',
    taxCategory: 'professional_services',
    isDeductible: true,
    confidence: 0.55,
    reasoning: 'Professional services — GST claimable (accounting, legal, consulting)',
  },
]

/**
 * Classify a bank transaction based on its description and amount.
 *
 * Returns the suggested tax code, deduction category, and confidence
 * level. Rules-based confidence sits in the 0.50 - 0.69 band.
 *
 * @param description - Bank transaction narrative / description
 * @param amountCents - Positive = credit (income), negative = debit (expense)
 */
export function classifyTransaction(
  description: string,
  amountCents: number,
): ClassificationResult {
  const normalised = description.toLowerCase().trim()

  // Walk the rules in priority order — first match wins
  for (const rule of CLASSIFICATION_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(normalised)) {
        return {
          taxCode: rule.taxCode,
          taxCategory: rule.taxCategory,
          isDeductible: rule.isDeductible,
          confidence: rule.confidence,
          reasoning: rule.reasoning,
        }
      }
    }
  }

  // 15. Income (positive amounts, no prior rule matched)
  if (amountCents > 0) {
    return {
      taxCode: 'OUTPUT',
      taxCategory: null,
      isDeductible: false,
      confidence: 0.50,
      reasoning: 'Unmatched credit — defaulting to GST on Income',
    }
  }

  // 16. General expense (negative amounts, no prior rule matched)
  return {
    taxCode: 'INPUT',
    taxCategory: null,
    isDeductible: true,
    confidence: 0.50,
    reasoning: 'Unmatched debit — defaulting to GST on Expenses (review recommended)',
  }
}

// ---------------------------------------------------------------------------
// 4. GST Amount Calculator
// ---------------------------------------------------------------------------

/**
 * Calculate the GST component from a GST-inclusive total.
 *
 * In Australia, prices are GST-inclusive. The GST component of a
 * GST-inclusive price is `total / 11` (since GST is 1/11th of the
 * inclusive amount at a 10% rate).
 *
 * @param totalCents - GST-inclusive amount in cents
 * @param taxCode    - One of the AU_TAX_CODES keys
 * @returns GST amount in cents (truncated towards zero)
 */
export function calculateGstAmount(totalCents: number, taxCode: string): number {
  const code = AU_TAX_CODES[taxCode]
  if (!code || code.rate === 0) {
    return 0
  }

  // GST-inclusive formula: GST = total / 11 for 10% rate
  // Use Math.trunc to truncate towards zero (consistent for +/- amounts)
  return Math.trunc(totalCents / 11)
}
