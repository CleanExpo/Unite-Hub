import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getProjectDodCoverageStatus } from '@/lib/operator-gateway/project-dod'

export const dynamic = 'force-dynamic'

// GET — founder/session guarded Project Definition of Done coverage status.
// Static local/read-only foundation only: no production DB, no Supabase/psql, no external execution, no deploy.
export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    return NextResponse.json(getProjectDodCoverageStatus())
  } catch {
    return NextResponse.json({ error: 'Failed to load project DoD coverage status' }, { status: 500 })
  }
}
