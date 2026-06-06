import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getOperatorJobsView, getSandboxOperatorJobsClient } from '@/lib/operator-gateway/jobs'

export const dynamic = 'force-dynamic'

// GET — Model Operator Gateway jobs (read-only, founder-guarded).
// Uses a founder-scoped sandbox SELECT only when the approved sandbox client is
// explicitly configured. No DB write, no external execution, no production DB.
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const client = getSandboxOperatorJobsClient()
  return NextResponse.json(await getOperatorJobsView({ founderId: user.id, client }))
}
