import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getSkillEvolutionStatus } from '@/lib/operator-gateway/skill-evolution'

export const dynamic = 'force-dynamic'

// GET — founder/session guarded Self-Evolving Skill Mesh status.
// Static local/read-only foundation only: no production DB, no external eval API, no paid calls, no live auto-promotion.
export async function GET() {
  try {
    const user = await getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const status = getSkillEvolutionStatus()
    return NextResponse.json({
      ...status,
      founderOnly: true,
      productionAutoPromotionAllowed: false,
    })
  } catch {
    return NextResponse.json({ error: 'Failed to load skill evolution status' }, { status: 500 })
  }
}
