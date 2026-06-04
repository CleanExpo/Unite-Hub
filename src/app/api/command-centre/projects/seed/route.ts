// src/app/api/command-centre/projects/seed/route.ts
//
// Seed registry — promote the read-only json project registry (registry.ts)
// into durable, founder-scoped cc_projects rows.
//
// POST  (no body required)
//   → reads getProjects() (json)
//   → upserts each as a cc_projects row for the founder (idempotent on name)
//   → returns { seeded: n }
//
// Auth-gated (Supabase getUser; unauth → 401). Founder-scoped (founder_id =
// user.id). Idempotent: re-running updates the same rows rather than dupes.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getProjects } from '@/lib/command-centre/registry'
import { upsertProject, projectToUpsertInput } from '@/lib/command-centre/projects-db'

export const dynamic = 'force-dynamic'

export async function POST() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let projects
  try {
    projects = await getProjects()
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to read project registry' },
      { status: 500 },
    )
  }

  let seeded = 0
  try {
    for (const project of projects) {
      await upsertProject(projectToUpsertInput(user.id, project))
      seeded += 1
    }
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to seed projects', seeded },
      { status: 500 },
    )
  }

  return NextResponse.json({ seeded }, { status: 200 })
}
