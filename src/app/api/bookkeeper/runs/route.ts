// src/app/api/bookkeeper/runs/route.ts
import { NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import type { RunsResponse, BookkeeperRun } from '@/lib/bookkeeper/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20', 10)))

  const supabase = await createClient()

  const { count } = await supabase
    .from('bookkeeper_runs')
    .select('id', { count: 'exact', head: true })
    .eq('founder_id', user.id)

  const { data, error } = await supabase
    .from('bookkeeper_runs')
    .select('*')
    .eq('founder_id', user.id)
    .order('started_at', { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const runs: BookkeeperRun[] = (data ?? []).map((r) => ({
    id: r.id,
    status: r.status,
    startedAt: r.started_at,
    completedAt: r.completed_at,
    businessesProcessed: r.businesses_processed ?? [],
    totalTransactions: r.total_transactions,
    autoReconciled: r.auto_reconciled,
    flaggedForReview: r.flagged_for_review,
    failedCount: r.failed_count,
    gstCollectedCents: r.gst_collected_cents,
    gstPaidCents: r.gst_paid_cents,
    netGstCents: r.net_gst_cents,
    errorLog: r.error_log,
  }))

  const response: RunsResponse = { runs, total: count ?? 0, page, pageSize }
  return NextResponse.json(response)
}
