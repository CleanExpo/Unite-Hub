// src/app/api/command-centre/ideas/route.ts
//
// CC-07 — Idea intake.
//
// POST { idea: string, projectKey?: string }
//   → creates a `proposed` cc_task (origin 'idea'), never auto-executed
//   → writes an evidence brief to the wiki + an addEvidenceRecord row
//   → appends a 'created' task event
//   → returns the task (+ the evidence path)
//
// Auth-gated (Supabase getUser; unauth → 401). Founder-scoped (founder_id =
// user.id). Honours the friction model: a new idea is a PROPOSAL, gated by the
// board before any promotion.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createTask, appendTaskEvent, addEvidenceRecord } from '@/lib/command-centre/tasks'
import { getProjects } from '@/lib/command-centre/registry'
import { writeEvidence } from '@/lib/obsidian/evidence'

export const dynamic = 'force-dynamic'

/** Derive a concise task title from a free-text idea (first line, capped). */
function deriveTitle(idea: string): string {
  const firstLine = idea.trim().split(/\r?\n/)[0]?.trim() ?? ''
  const clean = firstLine.replace(/\s+/g, ' ')
  if (clean.length <= 80) return clean || 'Untitled idea'
  return `${clean.slice(0, 77)}...`
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: { idea?: unknown; projectKey?: unknown }
  try {
    body = (await request.json()) as { idea?: unknown; projectKey?: unknown }
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const idea = typeof body.idea === 'string' ? body.idea.trim() : ''
  if (!idea) {
    return NextResponse.json({ error: 'Field "idea" is required' }, { status: 400 })
  }

  const projectKey =
    typeof body.projectKey === 'string' && body.projectKey.trim().length > 0
      ? body.projectKey.trim()
      : null

  // Resolve/validate the project against the registry (best-effort; an unknown
  // key is allowed but recorded so the brief stays honest).
  let projectName = 'platform'
  if (projectKey) {
    try {
      const projects = await getProjects()
      const match = projects.find(
        (p) => p.name.toLowerCase() === projectKey.toLowerCase() ||
          p.linear_prefix.toLowerCase() === projectKey.toLowerCase(),
      )
      if (match) projectName = match.name
      else projectName = projectKey
    } catch {
      projectName = projectKey
    }
  }

  const title = deriveTitle(idea)

  // 1. Create the PROPOSED idea task (never auto-executed).
  let task
  try {
    task = await createTask({
      founderId: user.id,
      title,
      objective: idea,
      status: 'proposed',
      origin: 'idea',
      riskLevel: 'low',
      humanApprovalRequired: true,
      projectKey,
    })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create idea task' },
      { status: 500 },
    )
  }

  // 2. Write an evidence brief to the wiki (best-effort — must not block intake).
  let evidencePath: string | null = null
  try {
    const result = await writeEvidence({
      project: projectName,
      taskId: task.id,
      kind: 'brief',
      frontmatter: {
        title: `Idea brief — ${title}`,
        type: 'brief',
        tags: ['command-center', 'idea', 'cc-07'],
        confidence: 'medium',
      },
      body: [
        `## Idea`, '', idea, '',
        `## Status`, '', '`proposed` — awaiting Senior Board review (no execution).',
      ].join('\n'),
      sources: projectKey ? [`project:${projectKey}`] : [],
    })
    evidencePath = result.relativePath
    await addEvidenceRecord({
      founderId: user.id,
      taskId: task.id,
      kind: 'brief',
      wikiPath: result.relativePath,
      confidence: 'medium',
    })
  } catch {
    // Evidence is best-effort; the proposed task is still the source of truth.
    evidencePath = null
  }

  // 3. Append the immutable 'created' audit event.
  try {
    await appendTaskEvent({
      founderId: user.id,
      taskId: task.id,
      type: 'created',
      actor: 'founder',
      payload: { origin: 'idea', evidence_path: evidencePath },
    })
  } catch {
    // Audit append is best-effort relative to returning the created task.
  }

  return NextResponse.json({ task, evidencePath }, { status: 201 })
}
