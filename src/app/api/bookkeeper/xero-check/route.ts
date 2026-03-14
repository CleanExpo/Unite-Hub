// TEMPORARY diagnostic — tests Xero API connectivity and data
// GET /api/bookkeeper/xero-check?business=dr

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import {
  loadXeroTokens,
  getValidXeroToken,
  saveXeroTokens,
  xeroApiFetch,
} from '@/lib/integrations/xero/client'
import type { StoredXeroTokens, XeroBankTransaction } from '@/lib/integrations/xero/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business') ?? 'dr'

  const results: Record<string, unknown> = { businessKey, founderId: user.id }

  // Step 1: Load tokens from vault
  const storedTokens = await loadXeroTokens(user.id, businessKey)
  if (!storedTokens) {
    return NextResponse.json({ ...results, error: 'No tokens in vault' })
  }
  results.tokenLoaded = true
  results.tokenExpired = storedTokens.expires_at < Date.now()
  results.expiresAt = new Date(storedTokens.expires_at).toISOString()
  results.tenantId = storedTokens.tenant_id

  // Step 2: Refresh if needed
  let validTokens: StoredXeroTokens
  try {
    validTokens = await getValidXeroToken(storedTokens, businessKey)
    results.tokenRefreshed = validTokens.access_token !== storedTokens.access_token
    if (results.tokenRefreshed) {
      await saveXeroTokens(user.id, businessKey, validTokens)
      results.newExpiresAt = new Date(validTokens.expires_at).toISOString()
    }
  } catch (e) {
    return NextResponse.json({
      ...results,
      error: `Token refresh failed: ${e instanceof Error ? e.message : String(e)}`,
    })
  }

  // Step 3: Test Organisation endpoint
  try {
    const org = await xeroApiFetch<{ Organisations: Array<{ Name: string; LegalName: string; OrganisationType: string }> }>(
      validTokens,
      '/Organisation'
    )
    results.organisation = org.Organisations?.[0]?.Name ?? 'unknown'
    results.orgType = org.Organisations?.[0]?.OrganisationType ?? 'unknown'
  } catch (e) {
    results.orgError = e instanceof Error ? e.message : String(e)
  }

  // Step 4: Fetch bank transactions (last 90 days, wider window)
  try {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    const fromDate = d.toISOString().slice(0, 10)
    const [year, month, day] = fromDate.split('-').map(Number)
    const where = `Date>=DateTime(${year},${month},${day})`

    const txnRes = await xeroApiFetch<{
      BankTransactions: XeroBankTransaction[]
      pagination?: { itemCount: number }
    }>(validTokens, `/BankTransactions?where=${encodeURIComponent(where)}&page=1`)

    results.bankTransactions = {
      count: txnRes.BankTransactions?.length ?? 0,
      pagination: txnRes.pagination,
      allTransactions: (txnRes.BankTransactions ?? []).map(t => ({
        id: t.BankTransactionID,
        type: t.Type,
        date: t.Date,
        total: t.Total,
        status: t.Status,
        isReconciled: t.IsReconciled,
        reference: t.Reference,
        contact: t.Contact?.Name,
        lineItems: t.LineItems?.length ?? 0,
      })),
    }
  } catch (e) {
    results.bankTransactionError = e instanceof Error ? e.message : String(e)
  }

  // Step 5: Fetch invoices (last 90 days)
  try {
    const d = new Date()
    d.setDate(d.getDate() - 90)
    const fromDate = d.toISOString().slice(0, 10)
    const [year, month, day] = fromDate.split('-').map(Number)
    const where = `Date>=DateTime(${year},${month},${day})`

    const invRes = await xeroApiFetch<{
      Invoices: Array<{ InvoiceID: string; Type: string; Status: string; Total: number; Contact?: { Name: string } }>
    }>(validTokens, `/Invoices?where=${encodeURIComponent(where)}&page=1`)

    results.invoices = {
      count: invRes.Invoices?.length ?? 0,
      sample: (invRes.Invoices ?? []).slice(0, 3).map(i => ({
        id: i.InvoiceID,
        type: i.Type,
        status: i.Status,
        total: i.Total,
        contact: i.Contact?.Name,
      })),
    }
  } catch (e) {
    results.invoiceError = e instanceof Error ? e.message : String(e)
  }

  // Step 6: Fetch bank accounts
  try {
    const acctRes = await xeroApiFetch<{
      Accounts: Array<{ AccountID: string; Name: string; Type: string; BankAccountNumber?: string; Status: string }>
    }>(validTokens, `/Accounts?where=${encodeURIComponent('Type=="BANK"')}`)

    results.bankAccounts = (acctRes.Accounts ?? []).map(a => ({
      name: a.Name,
      type: a.Type,
      status: a.Status,
      hasNumber: Boolean(a.BankAccountNumber),
    }))
  } catch (e) {
    results.bankAccountError = e instanceof Error ? e.message : String(e)
  }

  return NextResponse.json(results)
}
