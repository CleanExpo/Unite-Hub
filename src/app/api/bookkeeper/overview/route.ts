// src/app/api/bookkeeper/overview/route.ts
import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import type { BookkeeperOverview } from '@/lib/bookkeeper/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  const { data: lastRunData } = await supabase
    .from('bookkeeper_runs')
    .select('*')
    .eq('founder_id', user.id)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const twelveMonthsAgo = new Date()
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
  const cutoff = twelveMonthsAgo.toISOString().slice(0, 10)

  const { count: pendingReconciliation } = await supabase
    .from('bookkeeper_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)
    .in('reconciliation_status', ['unmatched', 'suggested_match'])
    .gte('transaction_date', cutoff)

  const { count: pendingApproval } = await supabase
    .from('bookkeeper_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)
    .eq('reconciliation_status', 'manual_review')
    .gte('transaction_date', cutoff)

  const { count: totalTransactions12m } = await supabase
    .from('bookkeeper_transactions')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)
    .gte('transaction_date', cutoff)

  const { data: deductibleData } = await supabase
    .from('bookkeeper_transactions')
    .select('amount_cents')
    .eq('founder_id', user.id)
    .eq('is_deductible', true)
    .gte('transaction_date', cutoff)

  const totalDeductibleCents = (deductibleData ?? []).reduce(
    (sum, r) => sum + Math.abs(Number(r.amount_cents)),
    0
  )

  const alertCount = lastRunData?.flagged_for_review ?? 0

  const overview: BookkeeperOverview = {
    lastRun: lastRunData ? {
      id: lastRunData.id,
      status: lastRunData.status,
      startedAt: lastRunData.started_at,
      completedAt: lastRunData.completed_at,
      totalTransactions: lastRunData.total_transactions,
      autoReconciled: lastRunData.auto_reconciled,
      flaggedForReview: lastRunData.flagged_for_review,
      failedCount: lastRunData.failed_count,
      gstCollectedCents: lastRunData.gst_collected_cents,
      gstPaidCents: lastRunData.gst_paid_cents,
      netGstCents: lastRunData.net_gst_cents,
    } : null,
    totals: {
      pendingReconciliation: pendingReconciliation ?? 0,
      pendingApproval: pendingApproval ?? 0,
      totalTransactions12m: totalTransactions12m ?? 0,
      totalDeductibleCents,
    },
    alertCount,
  }

  return NextResponse.json(overview)
}
