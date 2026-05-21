// src/app/api/advisory/cases/route.ts
// GET: List advisory cases (paginated, filtered by status)
// POST: Create a new advisory case

import { NextRequest, NextResponse } from 'next/server'
import { getUser, createClient } from '@/lib/supabase/server'
import { collectFinancialContext } from '@/lib/advisory/financial-context'
import { captureApiError } from '@/lib/error-reporting'
import type { CreateCaseRequest, CaseStatus } from '@/lib/advisory/types'
import { CASE_STATUSES } from '@/lib/advisory/types'
import { BUSINESSES, type BusinessKey } from '@/lib/businesses'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()
  const { searchParams } = request.nextUrl

  const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? '20')))
  const status = searchParams.get('status') as CaseStatus | null
  const offset = (page - 1) * pageSize

  let query = supabase
    .from('advisory_cases')
    .select('*', { count: 'exact' })
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1)

  if (status && CASE_STATUSES.includes(status)) {
    query = query.eq('status', status)
  }

  const { data, count, error } = await query

  if (error) {
    captureApiError(error, { route: '/api/advisory/cases', method: 'GET', founderId: user.id })
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 })
  }

  return NextResponse.json({
    cases: data ?? [],
    total: count ?? 0,
    page,
    pageSize,
  })
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const supabase = await createClient()

  let body: CreateCaseRequest
  try {
    body = await request.json() as CreateCaseRequest
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.title?.trim() || !body.scenario?.trim() || !body.businessKey) {
    return NextResponse.json(
      { error: 'title, scenario, and businessKey are required' },
      { status: 400 }
    )
  }

  const business = BUSINESSES.find(b => b.key === body.businessKey)
  if (!business) {
    return NextResponse.json({ error: `Unknown business: ${body.businessKey}` }, { status: 400 })
  }

  // Collect financial context snapshot
  const financialContext = await collectFinancialContext(user.id, body.businessKey as BusinessKey)

  const { data, error } = await supabase
    .from('advisory_cases')
    .insert({
      founder_id: user.id,
      title: body.title.trim(),
      scenario: body.scenario.trim(),
      financial_context: financialContext,
      status: 'draft',
      current_round: 0,
      total_rounds: 5,
    })
    .select('*')
    .single()

  if (error) {
    captureApiError(error, { route: '/api/advisory/cases', method: 'POST', founderId: user.id })
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}
