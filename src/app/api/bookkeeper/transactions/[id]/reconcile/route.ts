// src/app/api/bookkeeper/transactions/[id]/reconcile/route.ts
import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { reconcileTransaction } from '@/lib/integrations/xero/client'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const body = await request.json() as { invoiceId?: string }

  const supabase = await createClient()

  const { data: txn, error: fetchError } = await supabase
    .from('bookkeeper_transactions')
    .select('business_key, xero_transaction_id, xero_tenant_id')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (fetchError || !txn) {
    return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
  }

  try {
    await reconcileTransaction(
      user.id,
      txn.business_key,
      txn.xero_transaction_id,
      body.invoiceId
    )

    const { error: updateError } = await supabase
      .from('bookkeeper_transactions')
      .update({
        reconciliation_status: 'reconciled',
        matched_invoice_id: body.invoiceId ?? null,
        approved_by: user.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('founder_id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reconciliation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
