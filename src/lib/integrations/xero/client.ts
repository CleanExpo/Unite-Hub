// src/lib/integrations/xero/client.ts
// Xero Accounting API client — vault-backed OAuth tokens per business
// Falls back to mocks when XERO_CLIENT_ID/SECRET not configured or no token stored

import type {
  StoredXeroTokens,
  XeroRevenueMTD,
  XeroReportRow,
  XeroBankTransaction,
  XeroBankTransactionOptions,
  XeroInvoice,
  XeroInvoiceOptions,
  XeroContact,
  XeroAccount,
  XeroTaxRate,
  XeroPaginatedResponse,
} from './types'

// ── Constants ───────────────────────────────────────────────────────────────

const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0'
const XERO_IDENTITY_URL = 'https://identity.xero.com/connect/token'

/** Rate-limit delay between consecutive Xero API calls (ms) */
const RATE_LIMIT_DELAY_MS = 1_000

// ── Multi-account credential routing ────────────────────────────────────────
// DR Xero Account:   businesses dr, nrpg, dr_qld → DR_CLIENT_ID / DR_Client_Secret
// CARSI Xero Account: all other businesses       → XERO_CLIENT_ID / XERO_CLIENT_SECRET

const DR_BUSINESS_KEYS = new Set(['dr', 'nrpg', 'dr_qld'])

export function getXeroCredentials(businessKey: string): {
  clientId: string
  clientSecret: string
} {
  if (DR_BUSINESS_KEYS.has(businessKey)) {
    return {
      clientId: process.env.DR_CLIENT_ID ?? '',
      clientSecret: process.env.DR_CLIENT_SECRET ?? '',
    }
  }
  return {
    clientId: process.env.XERO_CLIENT_ID ?? '',
    clientSecret: process.env.XERO_CLIENT_SECRET ?? '',
  }
}

// ── Configuration check ─────────────────────────────────────────────────────

export function isXeroConfigured(): boolean {
  const drOk = Boolean(process.env.DR_CLIENT_ID && process.env.DR_Client_Secret)
  const carsiOk = Boolean(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET)
  return drOk || carsiOk
}

// ── Mock data (dev / pre-connect fallback) ──────────────────────────────────

export function getMockRevenueMTD(businessKey: string): XeroRevenueMTD {
  const mocks: Record<string, XeroRevenueMTD> = {
    dr:    { businessKey: 'dr',    revenueCents: 2_475_000, expensesCents: 1_100_000, growth: 12,  invoiceCount: 47, lastUpdated: new Date().toISOString() },
    nrpg:  { businessKey: 'nrpg',  revenueCents:   840_000, expensesCents:   320_000, growth: 5,   invoiceCount: 12, lastUpdated: new Date().toISOString() },
    carsi: { businessKey: 'carsi', revenueCents: 1_220_000, expensesCents:   580_000, growth: -3,  invoiceCount: 8,  lastUpdated: new Date().toISOString() },
    ccw:   { businessKey: 'ccw',   revenueCents: 3_150_000, expensesCents: 1_800_000, growth: 8,   invoiceCount: 15, lastUpdated: new Date().toISOString() },
  }
  return mocks[businessKey] ?? {
    businessKey,
    revenueCents: 0,
    expensesCents: 0,
    growth: 0,
    invoiceCount: 0,
    lastUpdated: new Date().toISOString(),
  }
}

// ── Rate-limit helper ───────────────────────────────────────────────────────

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// ── Token management ────────────────────────────────────────────────────────

export async function refreshXeroToken(
  tokens: StoredXeroTokens,
  businessKey: string
): Promise<StoredXeroTokens> {
  const { clientId, clientSecret } = getXeroCredentials(businessKey)
  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const res = await fetch(XERO_IDENTITY_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
    }),
  })

  if (!res.ok) throw new Error('Xero token refresh failed')

  const data = await res.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? tokens.refresh_token,
    expires_at: Date.now() + data.expires_in * 1000,
    tenant_id: tokens.tenant_id,
  }
}

export async function getValidXeroToken(
  tokens: StoredXeroTokens,
  businessKey: string
): Promise<StoredXeroTokens> {
  // Refresh if token expires within 60 seconds
  if (tokens.expires_at > Date.now() + 60_000) return tokens
  return refreshXeroToken(tokens, businessKey)
}

// ── Vault-backed token loader ───────────────────────────────────────────────

export async function loadXeroTokens(
  founderId: string,
  businessKey: string
): Promise<StoredXeroTokens | null> {
  const { createServiceClient } = await import('@/lib/supabase/service')
  const { decrypt } = await import('@/lib/vault')

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('credentials_vault')
    .select('encrypted_value, iv, salt')
    .eq('founder_id', founderId)
    .eq('service', 'xero')
    .eq('label', businessKey)
    .single()

  if (!data) return null

  try {
    return JSON.parse(
      decrypt({ encryptedValue: data.encrypted_value, iv: data.iv, salt: data.salt })
    ) as StoredXeroTokens
  } catch {
    return null
  }
}

// ── Vault-backed token saver ────────────────────────────────────────────────

export async function saveXeroTokens(
  founderId: string,
  businessKey: string,
  tokens: StoredXeroTokens
): Promise<void> {
  const { createServiceClient } = await import('@/lib/supabase/service')
  const { encrypt } = await import('@/lib/vault')

  const payload = encrypt(JSON.stringify(tokens))
  const supabase = createServiceClient()

  const { error } = await supabase
    .from('credentials_vault')
    .upsert(
      {
        founder_id: founderId,
        service: 'xero',
        label: businessKey,
        encrypted_value: payload.encryptedValue,
        iv: payload.iv,
        salt: payload.salt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'founder_id,service,label' }
    )

  if (error) {
    throw new Error(`Failed to save Xero tokens for ${businessKey}: ${error.message}`)
  }
}

// ── Core API fetch helper ───────────────────────────────────────────────────

export async function xeroApiFetch<T>(
  tokens: StoredXeroTokens,
  path: string,
  options?: { method?: string; body?: unknown }
): Promise<T> {
  // Centralised rate-limit delay before every API call
  await delay(RATE_LIMIT_DELAY_MS)

  const url = path.startsWith('http') ? path : `${XERO_API_BASE}${path}`

  const res = await fetch(url, {
    method: options?.method ?? 'GET',
    headers: {
      Authorization: `Bearer ${tokens.access_token}`,
      'Xero-Tenant-Id': tokens.tenant_id,
      Accept: 'application/json',
      ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
  })

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error')
    throw new Error(`Xero API error ${res.status}: ${errorText}`)
  }

  return res.json() as Promise<T>
}

// ── P&L Report parsers ─────────────────────────────────────────────────────

/**
 * Extract a SummaryRow total (in cents) for named P&L sections.
 * cellIndex 1 = current period, cellIndex 2 = prior period (when periods=2).
 */
function parseSectionSummaryCents(
  rows: XeroReportRow[],
  sectionTitles: string[],
  cellIndex: number,
): number {
  let total = 0
  for (const section of rows) {
    if (
      section.RowType === 'Section' &&
      sectionTitles.some((t) => section.Title?.includes(t))
    ) {
      const summaryRow = section.Rows?.find((r) => r.RowType === 'SummaryRow')
      const valueStr = summaryRow?.Cells?.[cellIndex]?.Value ?? '0'
      const dollars = parseFloat(valueStr.replace(/[^0-9.-]/g, '')) || 0
      total += Math.round(dollars * 100)
    }
  }
  return total
}

/** Total income (revenue) for the current period, in cents */
export function parsePandLRevenue(
  report: { Reports?: Array<{ Rows?: XeroReportRow[] }> }
): number {
  return parseSectionSummaryCents(report.Reports?.[0]?.Rows ?? [], ['Income'], 1)
}

/** Total expenses (Cost of Sales + Operating Expenses) for the current period, in cents */
export function parsePandLExpenses(
  report: { Reports?: Array<{ Rows?: XeroReportRow[] }> }
): number {
  return parseSectionSummaryCents(
    report.Reports?.[0]?.Rows ?? [],
    ['Less Cost of Sales', 'Less Operating Expenses'],
    1,
  )
}

/**
 * Month-on-month revenue growth (%) from a two-period P&L (periods=2).
 * Column index 1 = current period, index 2 = prior period.
 * Returns 0 when prior period is zero to avoid division by zero.
 */
export function calculateMoMGrowth(
  report: { Reports?: Array<{ Rows?: XeroReportRow[] }> }
): number {
  const rows = report.Reports?.[0]?.Rows ?? []
  const current = parseSectionSummaryCents(rows, ['Income'], 1)
  const prior = parseSectionSummaryCents(rows, ['Income'], 2)
  if (prior === 0) return 0
  return Math.round(((current - prior) / prior) * 100)
}

// ── Revenue MTD fetch ───────────────────────────────────────────────────────

export async function fetchRevenueMTD(
  founderId: string,
  businessKey: string
): Promise<{ data: XeroRevenueMTD; source: 'xero' | 'mock' }> {
  if (!isXeroConfigured()) {
    return { data: getMockRevenueMTD(businessKey), source: 'mock' }
  }

  try {
    const tokens = await getTokensForBusiness(founderId, businessKey)

    const now = new Date()
    const fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const toDate = now.toISOString().slice(0, 10)

    const report = await xeroApiFetch<{ Reports?: Array<{ Rows?: XeroReportRow[] }> }>(
      tokens,
      `/Reports/ProfitAndLoss?fromDate=${fromDate}&toDate=${toDate}&periods=2`
    )

    const revenueCents = parsePandLRevenue(report)
    const expensesCents = parsePandLExpenses(report)
    const growth = calculateMoMGrowth(report)

    // Count paid sales invoices this month — best-effort, non-fatal
    let invoiceCount = 0
    try {
      const dateWhere = buildDateWhereClause(fromDate, toDate)
      const where = `Type=="ACCREC"&&Status=="PAID"${dateWhere ? '&&' + dateWhere : ''}`
      const invoiceResponse = await xeroApiFetch<{ Invoices?: XeroInvoice[] }>(
        tokens,
        `/Invoices?${new URLSearchParams({ where, page: '1' }).toString()}`
      )
      invoiceCount = invoiceResponse.Invoices?.length ?? 0
    } catch {
      // Invoice count is a KPI metric only — do not fail the whole fetch
    }

    return {
      data: {
        businessKey,
        revenueCents,
        expensesCents,
        growth,
        invoiceCount,
        lastUpdated: new Date().toISOString(),
      },
      source: 'xero',
    }
  } catch {
    return { data: getMockRevenueMTD(businessKey), source: 'mock' }
  }
}

// ── Date helpers for Xero OData filters ─────────────────────────────────────

function toXeroDateFilter(isoDate: string): string {
  // Xero uses DateTime(YYYY,M,D) format in OData where clauses
  const [year, month, day] = isoDate.split('-').map(Number)
  return `DateTime(${year},${month},${day})`
}

function buildDateWhereClause(fromDate?: string, toDate?: string): string {
  const parts: string[] = []
  if (fromDate) parts.push(`Date>=${toXeroDateFilter(fromDate)}`)
  if (toDate) parts.push(`Date<=${toXeroDateFilter(toDate)}`)
  return parts.join('&&')
}

// ── Token + rate-limit wrapper for business API calls ───────────────────────

async function getTokensForBusiness(
  founderId: string,
  businessKey: string
): Promise<StoredXeroTokens> {
  const storedTokens = await loadXeroTokens(founderId, businessKey)
  if (!storedTokens) {
    throw new Error(`No Xero tokens found for business "${businessKey}"`)
  }
  const validTokens = await getValidXeroToken(storedTokens, businessKey)

  // Persist refreshed tokens to vault if they changed (Xero uses rotating refresh tokens)
  if (validTokens.access_token !== storedTokens.access_token) {
    await saveXeroTokens(founderId, businessKey, validTokens)
  }

  return validTokens
}

// ── Bank Transactions ───────────────────────────────────────────────────────

export async function fetchBankTransactions(
  founderId: string,
  businessKey: string,
  options?: XeroBankTransactionOptions
): Promise<XeroPaginatedResponse<XeroBankTransaction>> {
  const tokens = await getTokensForBusiness(founderId, businessKey)

  const params = new URLSearchParams()
  const whereClause = buildDateWhereClause(options?.fromDate, options?.toDate)
  if (whereClause) params.set('where', whereClause)
  params.set('page', String(options?.page ?? 1))

  const queryStr = params.toString()
  const response = await xeroApiFetch<{
    BankTransactions: XeroBankTransaction[]
    pagination?: { page: number; pageCount: number; pageSize: number; itemCount: number }
  }>(tokens, `/BankTransactions?${queryStr}`)

  return {
    items: response.BankTransactions ?? [],
    pagination: response.pagination,
  }
}

// ── Invoices (ACCREC = sales, ACCPAY = bills) ───────────────────────────────

export async function fetchInvoices(
  founderId: string,
  businessKey: string,
  options?: XeroInvoiceOptions
): Promise<XeroPaginatedResponse<XeroInvoice>> {
  const tokens = await getTokensForBusiness(founderId, businessKey)

  const whereParts: string[] = []
  if (options?.type) whereParts.push(`Type=="${options.type}"`)

  const dateParts = buildDateWhereClause(options?.fromDate, options?.toDate)
  if (dateParts) whereParts.push(dateParts)

  const params = new URLSearchParams()
  if (whereParts.length > 0) params.set('where', whereParts.join('&&'))
  params.set('page', String(options?.page ?? 1))

  const queryStr = params.toString()
  const response = await xeroApiFetch<{
    Invoices: XeroInvoice[]
    pagination?: { page: number; pageCount: number; pageSize: number; itemCount: number }
  }>(tokens, `/Invoices?${queryStr}`)

  return {
    items: response.Invoices ?? [],
    pagination: response.pagination,
  }
}

// ── Contacts ────────────────────────────────────────────────────────────────

export async function fetchContacts(
  founderId: string,
  businessKey: string
): Promise<XeroContact[]> {
  const tokens = await getTokensForBusiness(founderId, businessKey)

  const response = await xeroApiFetch<{ Contacts: XeroContact[] }>(tokens, '/Contacts')

  return response.Contacts ?? []
}

// ── Accounts (Chart of Accounts) ────────────────────────────────────────────

export async function fetchAccounts(
  founderId: string,
  businessKey: string
): Promise<XeroAccount[]> {
  const tokens = await getTokensForBusiness(founderId, businessKey)

  const response = await xeroApiFetch<{ Accounts: XeroAccount[] }>(tokens, '/Accounts')

  return response.Accounts ?? []
}

// ── Tax Rates ───────────────────────────────────────────────────────────────

export async function fetchTaxRates(
  founderId: string,
  businessKey: string
): Promise<XeroTaxRate[]> {
  const tokens = await getTokensForBusiness(founderId, businessKey)

  const response = await xeroApiFetch<{ TaxRates: XeroTaxRate[] }>(tokens, '/TaxRates')

  return response.TaxRates ?? []
}

// ── Reconcile a bank transaction ────────────────────────────────────────────

export async function reconcileTransaction(
  founderId: string,
  businessKey: string,
  transactionId: string,
  invoiceId?: string
): Promise<XeroBankTransaction> {
  const tokens = await getTokensForBusiness(founderId, businessKey)

  const body: Record<string, unknown> = {
    BankTransactions: [{
      BankTransactionID: transactionId,
      IsReconciled: true,
      ...(invoiceId ? { LineItems: [{ LinkedTransactions: [{ SourceTransactionID: invoiceId }] }] } : {}),
    }],
  }

  const response = await xeroApiFetch<{ BankTransactions: XeroBankTransaction[] }>(
    tokens,
    '/BankTransactions',
    { method: 'PUT', body }
  )

  const result = response.BankTransactions?.[0]
  if (!result) throw new Error(`Reconciliation failed for transaction ${transactionId}`)

  return result
}
