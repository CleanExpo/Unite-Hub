// src/app/api/bookkeeper/transactions/route.ts
import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import type { TransactionsResponse, BookkeeperTransaction } from '@/lib/bookkeeper/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '50', 10)))
  const business = searchParams.get('business')
  const status = searchParams.get('status')
  const from = searchParams.get('from')
  const to = searchParams.get('to')
  const deductible = searchParams.get('deductible')

  const supabase = await createClient()

  let query = supabase
    .from('bookkeeper_transactions')
    .select('*', { count: 'exact' })
    .eq('founder_id', user.id)

  if (business) query = query.eq('business_key', business)
  if (status) query = query.eq('reconciliation_status', status)
  if (deductible === 'true') query = query.eq('is_deductible', true)
  if (from) query = query.gte('transaction_date', from)
  if (to) query = query.lte('transaction_date', to)

  if (!from) {
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    query = query.gte('transaction_date', twelveMonthsAgo.toISOString().slice(0, 10))
  }

  query = query
    .order('transaction_date', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  const { data, count, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const transactions: BookkeeperTransaction[] = (data ?? []).map((t) => ({
    id: t.id,
    runId: t.run_id,
    businessKey: t.business_key,
    xeroTransactionId: t.xero_transaction_id,
    transactionDate: t.transaction_date,
    description: t.description,
    amountCents: t.amount_cents,
    reconciliationStatus: t.reconciliation_status,
    confidenceScore: parseFloat(t.confidence_score),
    matchedInvoiceId: t.matched_invoice_id,
    matchedBillId: t.matched_bill_id,
    taxCode: t.tax_code,
    gstAmountCents: t.gst_amount_cents,
    taxCategory: t.tax_category,
    isDeductible: t.is_deductible,
    deductionCategory: t.deduction_category,
    deductionNotes: t.deduction_notes,
    approvedAt: t.approved_at,
    createdAt: t.created_at,
  }))

  const response: TransactionsResponse = { transactions, total: count ?? 0, page, pageSize }
  return NextResponse.json(response)
}
