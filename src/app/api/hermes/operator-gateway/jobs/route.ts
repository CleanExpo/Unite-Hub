import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getOperatorJobsView } from '@/lib/operator-gateway/jobs'

export const dynamic = 'force-dynamic'

// GET — Model Operator Gateway jobs (read-only, founder-guarded).
// The operator_jobs table is sandbox-first and not yet applied, so this returns
// a source-tagged ('not_connected') empty payload. No DB write, no external call,
// no live execution. Swaps to a founder-scoped SELECT once the sandbox migration
// is Board-approved and applied.
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  return NextResponse.json(getOperatorJobsView())
}
