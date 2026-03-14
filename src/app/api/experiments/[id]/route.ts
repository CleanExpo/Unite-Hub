// src/app/api/experiments/[id]/route.ts
// GET:    Experiment detail with variants and aggregated results
// PATCH:  Update experiment fields (with status transition validation)
// DELETE: Delete draft experiment

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { ExperimentStatus } from '@/lib/experiments/types'

export const dynamic = 'force-dynamic'

// Valid status transitions: from → [allowed destinations]
const STATUS_TRANSITIONS: Record<string, ExperimentStatus[]> = {
  draft: ['active', 'cancelled'],
  active: ['paused', 'completed'],
  paused: ['active', 'cancelled'],
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  // Fetch experiment
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (expError || !experiment) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  // Fetch variants and results in parallel
  const [variantsResult, resultsResult] = await Promise.all([
    supabase
      .from('experiment_variants')
      .select('*')
      .eq('experiment_id', id)
      .eq('founder_id', user.id)
      .order('is_control', { ascending: false })
      .order('variant_key', { ascending: true }),
    supabase
      .from('experiment_results')
      .select('*')
      .eq('experiment_id', id)
      .eq('founder_id', user.id),
  ])

  const variants = variantsResult.data ?? []
  const rawResults = resultsResult.data ?? []

  // Aggregate results per variant
  const resultsByVariant: Record<string, {
    totalImpressions: number
    totalClicks: number
    totalLikes: number
    totalComments: number
    totalShares: number
    totalSaves: number
    totalConversions: number
  }> = {}

  for (const r of rawResults) {
    if (!resultsByVariant[r.variant_id]) {
      resultsByVariant[r.variant_id] = {
        totalImpressions: 0,
        totalClicks: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalSaves: 0,
        totalConversions: 0,
      }
    }
    const agg = resultsByVariant[r.variant_id]
    agg.totalImpressions += r.impressions ?? 0
    agg.totalClicks += r.clicks ?? 0
    agg.totalLikes += r.likes ?? 0
    agg.totalComments += r.comments ?? 0
    agg.totalShares += r.shares ?? 0
    agg.totalSaves += r.saves ?? 0
    agg.totalConversions += r.conversions ?? 0
  }

  return NextResponse.json({ experiment, variants, results: resultsByVariant })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: {
    title?: string
    hypothesis?: string
    status?: ExperimentStatus
    conclusion?: string
    winnerVariantId?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Fetch current experiment to validate status transition
  const { data: existing, error: fetchError } = await supabase
    .from('experiments')
    .select('status')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  // Validate status transition if status is being changed
  if (body.status && body.status !== existing.status) {
    const allowed = STATUS_TRANSITIONS[existing.status] ?? []
    if (!allowed.includes(body.status)) {
      return NextResponse.json(
        { error: `Cannot transition from '${existing.status}' to '${body.status}'` },
        { status: 400 }
      )
    }
  }

  // Build update payload (only include provided fields)
  const update: Record<string, unknown> = {}
  if (body.title !== undefined) update.title = body.title.trim()
  if (body.hypothesis !== undefined) update.hypothesis = body.hypothesis.trim()
  if (body.status !== undefined) update.status = body.status
  if (body.conclusion !== undefined) update.conclusion = body.conclusion
  if (body.winnerVariantId !== undefined) update.winner_variant_id = body.winnerVariantId

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('experiments')
    .update(update)
    .eq('id', id)
    .eq('founder_id', user.id)
    .select()
    .single()

  if (error) {
    console.error('[experiments] PATCH failed:', error.message)
    return NextResponse.json({ error: 'Failed to update experiment' }, { status: 500 })
  }

  return NextResponse.json({ experiment: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  // Verify experiment exists and is in draft status
  const { data: existing, error: fetchError } = await supabase
    .from('experiments')
    .select('status')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (fetchError || !existing) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  if (existing.status !== 'draft') {
    return NextResponse.json(
      { error: 'Only draft experiments can be deleted' },
      { status: 400 }
    )
  }

  const { error } = await supabase
    .from('experiments')
    .delete()
    .eq('id', id)
    .eq('founder_id', user.id)

  if (error) {
    console.error('[experiments] DELETE failed:', error.message)
    return NextResponse.json({ error: 'Failed to delete experiment' }, { status: 500 })
  }

  return new NextResponse(null, { status: 204 })
}
