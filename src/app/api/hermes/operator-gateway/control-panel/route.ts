import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getControlPanelView } from '@/lib/operator-gateway/control-panel'

export const dynamic = 'force-dynamic'

// GET — Hermes v0.16 Surface-Release Control Panel view (read-only, founder-guarded).
// Returns the static capability registry: version + security posture + module states +
// credential boundary STATUS STRINGS (never values). No external calls, no connections,
// no secrets, no DB. Every external surface is reported inert (not connected / none enabled).
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  return NextResponse.json(getControlPanelView())
}
