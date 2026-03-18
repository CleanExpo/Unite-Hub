// src/app/api/cron/email-triage/route.ts
// GET /api/cron/email-triage
// Daily email triage CRON — runs at 05:00 AEST (19:00 UTC prev day)
// Fetches last 50 unread threads per Gmail account, runs AI triage, auto-archives noise

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getConnectedGoogleAccounts, fetchThreadsPaginated, archiveThread } from '@/lib/integrations/google'
import { triageThreadBatch, type TriageResult } from '@/lib/ai/capabilities/email-triage'
import { createIssue } from '@/lib/integrations/linear'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const AUTO_ARCHIVE_CATEGORIES = new Set(['NEWSLETTER', 'PROMOTIONAL', 'SPAM'])
const BATCH_SIZE = 10

export async function GET(request: Request) {
  const startTime = Date.now()

  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const founderId = process.env.FOUNDER_USER_ID
  if (!founderId) {
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  const supabase = createServiceClient()
  const accounts = await getConnectedGoogleAccounts(founderId)

  let totalTriaged = 0
  let totalAutoArchived = 0
  let totalTasksCreated = 0
  const accountSummaries: string[] = []

  for (const account of accounts) {
    try {
      // Fetch last 50 unread threads
      const { threads } = await fetchThreadsPaginated(founderId, account.email, {
        query: 'in:inbox is:unread',
        maxResults: 50,
      })

      if (threads.length === 0) continue

      // Triage in batches of 10 (parallel within each batch)
      const allResults: TriageResult[] = []
      for (let i = 0; i < threads.length; i += BATCH_SIZE) {
        const batch = threads.slice(i, i + BATCH_SIZE)
        const results = await triageThreadBatch(
          batch.map(t => ({ threadId: t.id, subject: t.subject, from: t.from, snippet: t.snippet }))
        )
        allResults.push(...results)
      }

      // Persist all triage results
      const rows = allResults.map(r => ({
        founder_id: founderId,
        account_email: account.email,
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

      // AUTO-APPLY: archive NEWSLETTER / PROMOTIONAL / SPAM
      const toArchive = allResults.filter(r => AUTO_ARCHIVE_CATEGORIES.has(r.category))
      const archiveResults = await Promise.allSettled(
        toArchive.map(r => archiveThread(founderId, account.email, r.threadId))
      )
      const archived = archiveResults.filter(r => r.status === 'fulfilled').length

      if (archived > 0) {
        await supabase
          .from('email_triage_results')
          .update({ auto_applied: true, applied_at: new Date().toISOString() })
          .eq('founder_id', founderId)
          .eq('account_email', account.email)
          .in('thread_id', toArchive.map(r => r.threadId))
      }

      // CREATE_TASK: create Linear issues for important items
      const taskItems = allResults.filter(r => r.action === 'CREATE_TASK')
      const linearResults = await Promise.allSettled(
        taskItems.map(async r => {
          const issue = await createIssue({
            title: `Email: ${r.subject ?? '(no subject)'}`,
            description: `From: ${r.fromEmail ?? 'unknown'}\nReason: ${r.reason}\nAccount: ${account.email}`,
            teamKey: 'NXS',
            priority: r.priority,
          })
          await supabase
            .from('email_triage_results')
            .update({ linear_issue_id: issue.id })
            .eq('founder_id', founderId)
            .eq('account_email', account.email)
            .eq('thread_id', r.threadId)
          return issue
        })
      )
      const tasksCreated = linearResults.filter(r => r.status === 'fulfilled').length

      totalTriaged += allResults.length
      totalAutoArchived += archived
      totalTasksCreated += tasksCreated

      accountSummaries.push(
        `${account.email}: ${allResults.length} triaged, ${archived} archived, ${tasksCreated} tasks`
      )
    } catch (err) {
      console.error(`[Email Triage CRON] Failed for ${account.email}:`, err)
      accountSummaries.push(`${account.email}: ERROR — ${err instanceof Error ? err.message : 'unknown'}`)
    }
  }

  const durationMs = Date.now() - startTime

  notify({
    type: 'email_triage_result',
    title: 'Email Triage Complete',
    body:
      `Processed ${accounts.length} accounts in ${durationMs}ms. ` +
      `Triaged: ${totalTriaged}, Auto-archived: ${totalAutoArchived}, Tasks created: ${totalTasksCreated}.\n` +
      accountSummaries.join('\n'),
    severity: 'info',
    metadata: { totalTriaged, totalAutoArchived, totalTasksCreated, durationMs },
  }).catch(() => {})

  return NextResponse.json({
    success: true,
    accounts: accounts.length,
    totalTriaged,
    totalAutoArchived,
    totalTasksCreated,
    durationMs,
    accountSummaries,
  })
}
