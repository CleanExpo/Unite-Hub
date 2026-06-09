// src/app/api/cron/overnight-digest/route.ts
//
// CC-19 — Overnight digest cron. Runs after the overnight jobs, builds the
// morning digest from the founder's tasks + sessions, and writes a wiki daily
// note. Auth: Bearer CRON_SECRET (matches the other cron routes). Uses the
// service-role client + FOUNDER_USER_ID since there is no user session in cron.
// Read-only against the DB; the wiki write is best-effort.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { gatherOvernightDigest, digestToMarkdown } from '@/lib/command-centre/overnight-summary'
import type { SupabaseLike } from '@/lib/command-centre/tasks'
import { writeEvidence } from '@/lib/obsidian/evidence'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const founderId = process.env.FOUNDER_USER_ID?.trim()
  if (!founderId) {
    return NextResponse.json({ error: 'FOUNDER_USER_ID not configured' }, { status: 500 })
  }

  let digest
  try {
    const supabase = createServiceClient() as unknown as SupabaseLike
    digest = await gatherOvernightDigest({ founderId, generatedAt: new Date().toISOString() }, supabase)
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to build digest' },
      { status: 500 },
    )
  }

  // Persist the digest as a wiki daily note (best-effort — must not fail the cron).
  let evidencePath: string | null = null
  try {
    const day = digest.generatedAt.slice(0, 10)
    const result = await writeEvidence({
      project: '_platform',
      taskId: `overnight-${day}`,
      kind: 'daily',
      frontmatter: {
        title: `Morning digest — ${day}`,
        type: 'daily',
        tags: ['command-center', 'overnight', 'cc-19'],
        confidence: 'high',
      },
      body: digestToMarkdown(digest),
      sources: [],
    })
    evidencePath = result.relativePath
  } catch {
    evidencePath = null
  }

  return NextResponse.json({ ok: true, digest, evidencePath })
}
