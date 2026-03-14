// src/app/api/experiments/[id]/results/route.ts
// GET:  Aggregated results per variant with statistical significance
// POST: Upsert daily result data for a variant

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { analyseExperimentResults } from '@/lib/experiments/statistics'
import type { VariantAggregated } from '@/lib/experiments/statistics'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  // Fetch experiment with its confidence level and start date
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .select('id, confidence_level, started_at, metric_primary')
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
      .select('id, variant_key, label, is_control')
      .eq('experiment_id', id)
      .eq('founder_id', user.id),
    supabase
      .from('experiment_results')
      .select('*')
      .eq('experiment_id', id)
      .eq('founder_id', user.id),
  ])

  const variants = variantsResult.data ?? []
  const rawResults = resultsResult.data ?? []

  // Aggregate per variant
  const resultSummaries = variants.map(variant => {
    const variantResults = rawResults.filter(r => r.variant_id === variant.id)

    const totalImpressions = variantResults.reduce((sum, r) => sum + (r.impressions ?? 0), 0)
    const totalClicks = variantResults.reduce((sum, r) => sum + (r.clicks ?? 0), 0)
    const totalLikes = variantResults.reduce((sum, r) => sum + (r.likes ?? 0), 0)
    const totalComments = variantResults.reduce((sum, r) => sum + (r.comments ?? 0), 0)
    const totalShares = variantResults.reduce((sum, r) => sum + (r.shares ?? 0), 0)
    const totalSaves = variantResults.reduce((sum, r) => sum + (r.saves ?? 0), 0)
    const totalConversions = variantResults.reduce((sum, r) => sum + (r.conversions ?? 0), 0)
    const totalConversionValueCents = variantResults.reduce((sum, r) => sum + (r.conversion_value_cents ?? 0), 0)

    const totalEngagements = totalLikes + totalComments + totalShares + totalSaves
    const engagementRate = totalImpressions > 0
      ? Math.round((totalEngagements / totalImpressions) * 10000) / 10000
      : 0
    const ctr = totalImpressions > 0
      ? Math.round((totalClicks / totalImpressions) * 10000) / 10000
      : 0

    return {
      variantId: variant.id,
      variantKey: variant.variant_key,
      label: variant.label,
      isControl: variant.is_control,
      totalImpressions,
      totalClicks,
      totalLikes,
      totalComments,
      totalShares,
      totalSaves,
      totalConversions,
      totalConversionValueCents,
      engagementRate,
      ctr,
    }
  })

  // Compute statistical significance via the statistics module
  const variantAggregated: VariantAggregated[] = resultSummaries.map(s => ({
    variantId: s.variantId,
    isControl: s.isControl,
    totalImpressions: s.totalImpressions,
    // Use the primary metric to determine engagements
    totalEngagements: experiment.metric_primary === 'clicks'
      ? s.totalClicks
      : experiment.metric_primary === 'conversions'
        ? s.totalConversions
        : (s.totalLikes + s.totalComments + s.totalShares + s.totalSaves),
  }))

  const significance = analyseExperimentResults(
    variantAggregated,
    experiment.confidence_level ?? 0.95
  )

  // Calculate days running
  const daysRunning = experiment.started_at
    ? Math.max(1, Math.ceil((Date.now() - new Date(experiment.started_at).getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return NextResponse.json({ results: resultSummaries, significance, daysRunning })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: {
    variantId: string
    periodDate: string
    impressions: number
    reach?: number
    clicks?: number
    likes?: number
    comments?: number
    shares?: number
    saves?: number
    conversions?: number
    conversionValueCents?: number
    platformData?: Record<string, unknown>
    source?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.variantId) return NextResponse.json({ error: 'variantId is required' }, { status: 400 })
  if (!body.periodDate) return NextResponse.json({ error: 'periodDate is required' }, { status: 400 })
  if (body.impressions === undefined) return NextResponse.json({ error: 'impressions is required' }, { status: 400 })

  const supabase = createServiceClient()

  // Verify experiment belongs to user
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .select('id')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (expError || !experiment) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  // Verify variant belongs to this experiment
  const { data: variant, error: varError } = await supabase
    .from('experiment_variants')
    .select('id')
    .eq('id', body.variantId)
    .eq('experiment_id', id)
    .single()

  if (varError || !variant) {
    return NextResponse.json({ error: 'Variant not found for this experiment' }, { status: 404 })
  }

  // Upsert result row — conflict on (variant_id, period_date)
  const { data, error } = await supabase
    .from('experiment_results')
    .upsert(
      {
        variant_id: body.variantId,
        experiment_id: id,
        founder_id: user.id,
        period_date: body.periodDate,
        impressions: body.impressions,
        reach: body.reach ?? 0,
        clicks: body.clicks ?? 0,
        likes: body.likes ?? 0,
        comments: body.comments ?? 0,
        shares: body.shares ?? 0,
        saves: body.saves ?? 0,
        conversions: body.conversions ?? 0,
        conversion_value_cents: body.conversionValueCents ?? 0,
        platform_data: body.platformData ?? {},
        source: body.source ?? 'manual',
      },
      { onConflict: 'variant_id,period_date' }
    )
    .select()
    .single()

  if (error) {
    console.error('[experiments/results] POST upsert failed:', error.message)
    return NextResponse.json({ error: 'Failed to upsert result' }, { status: 500 })
  }

  return NextResponse.json({ result: data })
}
