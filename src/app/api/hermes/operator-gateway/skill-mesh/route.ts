import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getSpecializedSkillMeshStatus, routeBusinessMission } from '@/lib/operator-gateway/specialized-skill-mesh'

export const dynamic = 'force-dynamic'

// GET — founder/session guarded Specialised Skill Mesh + Business Mission Router status.
// Static local registry only: no DB writes, no live runner, no external execution, no API-key mode.
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const status = getSpecializedSkillMeshStatus()
  return NextResponse.json({
    ...status,
    founderOnly: true,
    externalExecutionEnabled: false,
    sampleRoute: routeBusinessMission('Prepare CARSI course product launch readiness'),
  })
}
