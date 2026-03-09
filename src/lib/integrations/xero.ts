// src/lib/integrations/xero.ts
// Xero Accounting API integration — vault-backed OAuth tokens per business
// Falls back to mocks when XERO_CLIENT_ID/SECRET not configured or no token stored

export function isXeroConfigured(): boolean {
  return Boolean(process.env.XERO_CLIENT_ID && process.env.XERO_CLIENT_SECRET)
}

export interface XeroRevenueMTD {
  businessKey: string
  revenueCents: number  // AUD cents, month-to-date
  expensesCents: number
  growth: number        // MoM % (0 until historical data collected)
  invoiceCount: number  // paid invoices this month
  lastUpdated: string
}

// ─── Mock data (dev / pre-connect fallback) ──────────────────────────────────

export function getMockRevenueMTD(businessKey: string): XeroRevenueMTD {
  const mocks: Record<string, XeroRevenueMTD> = {
    dr:    { businessKey: 'dr',    revenueCents: 2_475_000, expensesCents: 1_100_000, growth: 12,  invoiceCount: 47, lastUpdated: new Date().toISOString() },
    nrpg:  { businessKey: 'nrpg', revenueCents:   840_000, expensesCents:   320_000, growth: 5,   invoiceCount: 12, lastUpdated: new Date().toISOString() },
    carsi: { businessKey: 'carsi',revenueCents: 1_220_000, expensesCents:   580_000, growth: -3,  invoiceCount: 8,  lastUpdated: new Date().toISOString() },
    ccw:   { businessKey: 'ccw',  revenueCents: 3_150_000, expensesCents: 1_800_000, growth: 8,   invoiceCount: 15, lastUpdated: new Date().toISOString() },
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

// ─── Token helpers ───────────────────────────────────────────────────────────

interface StoredXeroTokens {
  access_token: string
  refresh_token: string
  expires_at: number   // epoch ms
  tenant_id: string
}

async function refreshXeroToken(tokens: StoredXeroTokens): Promise<StoredXeroTokens> {
  const credentials = Buffer.from(
    `${process.env.XERO_CLIENT_ID}:${process.env.XERO_CLIENT_SECRET}`
  ).toString('base64')

  const res = await fetch('https://identity.xero.com/connect/token', {
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

async function getValidXeroToken(tokens: StoredXeroTokens): Promise<StoredXeroTokens> {
  if (tokens.expires_at > Date.now() + 60_000) return tokens
  return refreshXeroToken(tokens)
}

// ─── Vault-backed token loader ───────────────────────────────────────────────

async function loadXeroTokens(
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

// ─── P&L Report parser ───────────────────────────────────────────────────────

interface XeroReportRow {
  RowType: string
  Title?: string
  Cells?: Array<{ Value?: string }>
  Rows?: XeroReportRow[]
}

function parsePandLRevenue(report: { Reports?: Array<{ Rows?: XeroReportRow[] }> }): number {
  const rows = report.Reports?.[0]?.Rows ?? []
  for (const section of rows) {
    if (section.RowType === 'Section' && section.Title === 'Income') {
      const summaryRow = section.Rows?.find(r => r.RowType === 'SummaryRow')
      const valueStr = summaryRow?.Cells?.[1]?.Value ?? '0'
      const dollars = parseFloat(valueStr.replace(/[^0-9.-]/g, '')) || 0
      return Math.round(dollars * 100)
    }
  }
  return 0
}

// ─── Real Xero fetch ─────────────────────────────────────────────────────────

export async function fetchRevenueMTD(
  founderId: string,
  businessKey: string
): Promise<{ data: XeroRevenueMTD; source: 'xero' | 'mock' }> {
  if (!isXeroConfigured()) {
    return { data: getMockRevenueMTD(businessKey), source: 'mock' }
  }

  const storedTokens = await loadXeroTokens(founderId, businessKey)
  if (!storedTokens) {
    return { data: getMockRevenueMTD(businessKey), source: 'mock' }
  }

  try {
    const tokens = await getValidXeroToken(storedTokens)

    const now = new Date()
    const fromDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    const toDate = now.toISOString().slice(0, 10)

    const res = await fetch(
      `https://api.xero.com/api.xro/2.0/Reports/ProfitAndLoss?fromDate=${fromDate}&toDate=${toDate}&periods=2`,
      {
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          'Xero-Tenant-Id': tokens.tenant_id,
          Accept: 'application/json',
        },
      }
    )

    if (!res.ok) return { data: getMockRevenueMTD(businessKey), source: 'mock' }

    const report = await res.json() as { Reports?: Array<{ Rows?: XeroReportRow[] }> }
    const revenueCents = parsePandLRevenue(report)

    return {
      data: {
        businessKey,
        revenueCents,
        expensesCents: 0,
        growth: 0,
        invoiceCount: 0,
        lastUpdated: new Date().toISOString(),
      },
      source: 'xero',
    }
  } catch {
    return { data: getMockRevenueMTD(businessKey), source: 'mock' }
  }
}
