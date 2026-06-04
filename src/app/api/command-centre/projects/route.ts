// GET /api/command-centre/projects - read-only registry of command-centre projects.
// Auth-gated by the existing Supabase session pattern; unauthenticated -> 401.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getProjects } from '@/lib/command-centre/registry'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  try {
    const projects = await getProjects()
    return NextResponse.json({ projects, count: projects.length })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load registry'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
