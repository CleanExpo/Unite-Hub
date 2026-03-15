// src/app/api/webhooks/paperclip/route.ts
// Paperclip inbound webhook — receives structured work packages from the Paperclip
// orchestration system running on the spare laptop.
// Auth: x-api-key header with PAPERCLIP_API_KEY value

import { NextRequest, NextResponse } from 'next/server'
import { verifyPaperclipApiKey } from '@/lib/webhooks/verify'
import { isDuplicate, insertEvent, markEvent } from '@/lib/webhooks/dedup'
import { processIdea } from '@/lib/agent-pipeline/idea-processor'
import { createIssue, BUSINESS_TO_TEAM } from '@/lib/integrations/linear'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

interface PaperclipWorkPackage {
  id: string                                              // Paperclip task ID (dedup key)
  businessKey: string                                     // dr | dr_qld | nrpg | carsi | restore | synthex | ato | ccw
  type: 'feature' | 'bug' | 'research' | 'improvement'  // Task type
  title?: string                                          // Optional — if present, skip AI title generation
  description: string                                     // Task description (required)
  priority?: 0 | 1 | 2 | 3 | 4                          // Linear priority
  createPR?: boolean                                      // Future: trigger GitHub PR creation
}

export async function POST(request: NextRequest) {
  // ─── Authentication ──────────────────────────────────────────────────────────
  const apiKey = request.headers.get('x-api-key')
  if (!verifyPaperclipApiKey(apiKey)) {
    console.warn('[Paperclip Webhook] Invalid API key — rejected')
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  // ─── Parse payload ───────────────────────────────────────────────────────────
  let pkg: PaperclipWorkPackage
  try {
    pkg = (await request.json()) as PaperclipWorkPackage
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // ─── Validate required fields ────────────────────────────────────────────────
  if (!pkg.id || !pkg.businessKey || !pkg.description?.trim()) {
    return NextResponse.json(
      { error: 'Missing required fields: id, businessKey, description' },
      { status: 422 }
    )
  }

  // ─── Dedup + process (single try so any Supabase/Linear error surfaces) ──────
  let eventRowId: string | null = null
  try {
    // Idempotency check
    if (await isDuplicate('paperclip', pkg.id)) {
      return NextResponse.json({ status: 'duplicate' })
    }

    eventRowId = await insertEvent(
      'paperclip',
      pkg.id,
      pkg.type ?? 'feature',
      pkg as unknown as Record<string, unknown>
    )

    // ─── Process work package → Linear issue ─────────────────────────────────
    let issueInput
    if (pkg.title?.trim()) {
      // Structured input — use directly, skip AI expansion
      issueInput = {
        title: pkg.title.trim(),
        description: pkg.description,
        teamKey: BUSINESS_TO_TEAM[pkg.businessKey] ?? 'UNI',
        priority: pkg.priority ?? 3,
      }
    } else {
      // Unstructured input — let AI expand it
      issueInput = await processIdea(pkg.description, pkg.businessKey)
    }

    const issue = await createIssue(issueInput)

    await markEvent(eventRowId, 'processed')

    notify({
      type: 'paperclip_task_received',
      title: '📦 Paperclip Task → Linear',
      body: `"${issueInput.title}" [${pkg.businessKey}] — ${issue.url ?? issue.id}`,
      severity: 'info',
      businessKey: pkg.businessKey,
      metadata: {
        paperclipId: pkg.id,
        linearIssueId: issue.id,
        linearIssueUrl: issue.url,
      },
    }).catch(() => {})

    return NextResponse.json({
      status: 'processed',
      linearIssueId: issue.id,
      linearIssueUrl: issue.url,
      ...(pkg.createPR && { prCreated: false, prNote: 'GitHub PR creation not yet implemented — Linear issue created only' }),
    })
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : (typeof error === 'object' && error !== null && 'message' in error)
        ? String((error as { message: unknown }).message)
        : JSON.stringify(error)
    console.error('[Paperclip Webhook] Processing failed:', error)
    // Best-effort mark as failed — eventRowId may be null if insertEvent itself threw
    if (eventRowId) {
      await markEvent(eventRowId, 'failed', message).catch(() => {})
    }
    return NextResponse.json({ status: 'error', error: message }, { status: 500 })
  }
}
