import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getGatewayStatus } from '@/lib/operator-gateway/lanes'

export const dynamic = 'force-dynamic'

// GET — Model Operator Gateway status summary (read-only, founder-guarded).
// Surfaces active/blocked lane counts and the no-API-key mode flag for the
// command-centre dashboard. No external calls, no secrets, no DB writes.
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(getGatewayStatus())
}
