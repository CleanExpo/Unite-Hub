// src/lib/integrations/xero/types.ts
// All Xero-related TypeScript interfaces

// ── Token & Auth ────────────────────────────────────────────────────────────

export interface StoredXeroTokens {
  access_token: string
  refresh_token: string
  expires_at: number   // epoch ms
  tenant_id: string
}

// ── Revenue ─────────────────────────────────────────────────────────────────

export interface XeroRevenueMTD {
  businessKey: string
  revenueCents: number  // AUD cents, month-to-date
  expensesCents: number
  growth: number        // MoM % (0 until historical data collected)
  invoiceCount: number  // paid invoices this month
  lastUpdated: string
}

// ── P&L Report row (internal parser type) ───────────────────────────────────

export interface XeroReportRow {
  RowType: string
  Title?: string
  Cells?: Array<{ Value?: string }>
  Rows?: XeroReportRow[]
}

// ── Bank Transactions ───────────────────────────────────────────────────────

export interface XeroBankTransactionLineItem {
  LineItemID: string
  Description?: string
  Quantity?: number
  UnitAmount?: number
  AccountCode?: string
  TaxType?: string
  LineAmount?: number
}

export interface XeroBankTransaction {
  BankTransactionID: string
  Type: 'RECEIVE' | 'SPEND' | 'RECEIVE-OVERPAYMENT' | 'RECEIVE-PREPAYMENT' | 'SPEND-OVERPAYMENT' | 'SPEND-PREPAYMENT'
  Contact: { ContactID: string; Name: string }
  LineItems: XeroBankTransactionLineItem[]
  BankAccount: { AccountID: string; Code?: string; Name?: string }
  Total: number
  Date: string        // /Date(...)/ or ISO string
  Status: 'AUTHORISED' | 'DELETED' | 'VOIDED'
  IsReconciled: boolean
  Reference?: string
  CurrencyCode?: string
  UpdatedDateUTC?: string
}

// ── Invoices ────────────────────────────────────────────────────────────────

export interface XeroInvoice {
  InvoiceID: string
  Type: 'ACCREC' | 'ACCPAY'    // ACCREC = sales invoice, ACCPAY = bill
  InvoiceNumber?: string
  Contact: { ContactID: string; Name: string }
  Total: number
  AmountDue: number
  AmountPaid: number
  Status: 'DRAFT' | 'SUBMITTED' | 'AUTHORISED' | 'PAID' | 'VOIDED' | 'DELETED'
  Date: string
  DueDate: string
  Reference?: string
  CurrencyCode?: string
  LineItems?: XeroBankTransactionLineItem[]
  UpdatedDateUTC?: string
}

// ── Contacts ────────────────────────────────────────────────────────────────

export interface XeroContact {
  ContactID: string
  Name: string
  EmailAddress?: string
  FirstName?: string
  LastName?: string
  ContactStatus?: 'ACTIVE' | 'ARCHIVED' | 'GDPRREQUEST'
  IsSupplier?: boolean
  IsCustomer?: boolean
  Phones?: Array<{ PhoneType: string; PhoneNumber?: string }>
  UpdatedDateUTC?: string
}

// ── Accounts (Chart of Accounts) ────────────────────────────────────────────

export interface XeroAccount {
  AccountID: string
  Code: string
  Name: string
  Type: string          // REVENUE, EXPENSE, BANK, CURRENT, etc.
  TaxType?: string
  Status?: 'ACTIVE' | 'ARCHIVED'
  Description?: string
  Class?: string        // ASSET, EQUITY, EXPENSE, LIABILITY, REVENUE
  BankAccountNumber?: string
  CurrencyCode?: string
  UpdatedDateUTC?: string
}

// ── Tax Rates ───────────────────────────────────────────────────────────────

export interface XeroTaxRate {
  Name: string
  TaxType: string
  EffectiveRate: number
  Status: 'ACTIVE' | 'DELETED' | 'ARCHIVED'
  ReportTaxType?: string
  CanApplyToAssets?: boolean
  CanApplyToEquity?: boolean
  CanApplyToExpenses?: boolean
  CanApplyToLiabilities?: boolean
  CanApplyToRevenue?: boolean
}

// ── Paginated response wrapper ──────────────────────────────────────────────

export interface XeroPagination {
  page: number
  pageCount: number
  pageSize: number
  itemCount: number
}

export interface XeroPaginatedResponse<T> {
  items: T[]
  pagination?: XeroPagination
}

// ── Fetch options ───────────────────────────────────────────────────────────

export interface XeroBankTransactionOptions {
  fromDate?: string   // ISO date string YYYY-MM-DD
  toDate?: string     // ISO date string YYYY-MM-DD
  page?: number       // 1-indexed
}

export interface XeroInvoiceOptions {
  fromDate?: string
  toDate?: string
  type?: 'ACCREC' | 'ACCPAY'
}
