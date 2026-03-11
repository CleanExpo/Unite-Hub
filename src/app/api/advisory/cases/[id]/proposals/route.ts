// src/app/api/advisory/cases/[id]/proposals/route.ts
// GET: Proposals filtered by round and/or firm

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import type { FirmKey } from '@/lib/advisory/types'
import { FIRM_KEYS } from '@/lib/advisory/types'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const round = searchParams.get('round')
  const firm = searchParams.get('firm') as FirmKey | null

  let query = supabase
    .from('advisory_proposals')
    .select('*')
    .eq('case_id', id)
    .eq('founder_id', user.id)
    .order('round', { ascending: true })
    .order('firm_key', { ascending: true })

  if (round) {
    const roundNum = Number(round)
    if (roundNum >= 1 && roundNum <= 5) {
      query = query.eq('round', roundNum)
    }
  }

  if (firm && (FIRM_KEYS as readonly string[]).includes(firm)) {
    query = query.eq('firm_key', firm)
  }

  const { data, error } = await query

  if (error) {
    console.error('[advisory/proposals] GET failed:', error.message)
    return NextResponse.json({ error: 'Failed to fetch proposals' }, { status: 500 })
  }

  return NextResponse.json({ proposals: data ?? [] })
}
