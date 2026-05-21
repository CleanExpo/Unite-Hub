// src/app/api/advisory/cases/[id]/evidence/route.ts
// GET: Evidence ledger for a case (paginated)

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'

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

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, Number(searchParams.get('pageSize') ?? '50')))
  const offset = (page - 1) * pageSize

  const { data, count, error } = await supabase
    .from('advisory_evidence')
    .select('*', { count: 'exact' })
    .eq('case_id', id)
    .eq('founder_id', user.id)
    .order('created_at', { ascending: true })
    .range(offset, offset + pageSize - 1)

  if (error) {
    console.error('[advisory/evidence] GET failed:', error.message)
    return NextResponse.json({ error: 'Failed to fetch evidence' }, { status: 500 })
  }

  return NextResponse.json({
    evidence: data ?? [],
    total: count ?? 0,
  })
}
