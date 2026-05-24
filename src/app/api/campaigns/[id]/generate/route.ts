// POST /api/campaigns/[id]/generate
// Triggers the full campaign generation pipeline (copy + images).
// Runs synchronously — maxDuration: 120.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { generateCampaign } from '@/lib/campaigns/orchestrator'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  try {
    const result = await generateCampaign(id, user.id)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[Campaign Generate] Failed:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
