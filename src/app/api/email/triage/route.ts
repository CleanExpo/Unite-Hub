// src/app/api/email/triage/route.ts
// POST /api/email/triage — trigger AI triage for a set of threads
// GET  /api/email/triage?account=<email> — fetch today's triage results for an account

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { fetchThreadsPaginated } from '@/lib/integrations/google'
import { triageThreadBatch } from '@/lib/ai/capabilities/email-triage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// ── GET — fetch today's triage results for display badges ───────────────────

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const account = searchParams.get('account')
  if (!account) return NextResponse.json({ error: 'account param required' }, { status: 400 })

  const supabase = createServiceClient()
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('email_triage_results')
    .select('thread_id, category, action, priority, reason')
    .eq('founder_id', user.id)
    .eq('account_email', account)
    .gte('created_at', todayStart.toISOString())
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ results: data ?? [] })
}

// ── POST — run AI triage on specified threads ────────────────────────────────

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { account, threadIds } = await request.json() as {
    account: string
    threadIds: string[]
  }

  if (!account || !threadIds?.length) {
    return NextResponse.json({ error: 'account and threadIds required' }, { status: 400 })
  }

  // Fetch thread summaries for the specified IDs
  const { threads } = await fetchThreadsPaginated(user.id, account, {
    query: threadIds.map(id => `rfc822msgid:${id}`).join(' OR '),
    maxResults: threadIds.length,
  })

  // Use threads from the paginated fetch, or fall back to fetching individually
  // For a clean implementation, just triage based on the threadIds passed
  // The caller should pass subject+from+snippet in a real implementation
  // Here we triage with whatever metadata we have
  const toTriage = threads.length > 0
    ? threads.map(t => ({ threadId: t.id, subject: t.subject, from: t.from, snippet: t.snippet }))
    : threadIds.map(id => ({ threadId: id, subject: '', from: '', snippet: '' }))

  const results = await triageThreadBatch(toTriage)

  // Persist results to DB
  const supabase = createServiceClient()
  const rows = results.map(r => ({
    founder_id: user.id,
    account_email: account,
    thread_id: r.threadId,
    subject: r.subject ?? null,
    from_email: r.fromEmail ?? null,
    category: r.category,
    action: r.action,
    priority: r.priority,
    reason: r.reason,
  }))

  if (rows.length > 0) {
    await supabase
      .from('email_triage_results')
      .upsert(rows, { onConflict: 'founder_id,account_email,thread_id' })
  }

  return NextResponse.json({ results })
}
