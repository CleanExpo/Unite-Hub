import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getOperatorLanes } from '@/lib/operator-gateway/lanes'

export const dynamic = 'force-dynamic'

// GET — list Model Operator Gateway lanes (static, read-only, founder-guarded).
// No API keys, no external calls: returns the in-repo operator lane registry.
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  return NextResponse.json({
    source: 'static_registry',
    noApiKeyMode: true,
    lanes: getOperatorLanes(),
  })
}
