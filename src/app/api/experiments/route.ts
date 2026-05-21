// src/app/api/experiments/route.ts
// GET:  List experiments (optional filters: business, status)
// POST: Create experiment with optional variants

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { BUSINESSES } from '@/lib/businesses'
import { EXPERIMENT_STATUSES, EXPERIMENT_TYPES } from '@/lib/experiments/types'
import type { ExperimentStatus, ExperimentType } from '@/lib/experiments/types'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = request.nextUrl
  const businessKey = searchParams.get('business')
  const status = searchParams.get('status') as ExperimentStatus | null

  const supabase = createServiceClient()
  let query = supabase
    .from('experiments')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })

  if (businessKey) query = query.eq('business_key', businessKey)
  if (status && EXPERIMENT_STATUSES.includes(status)) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    console.error('[experiments] GET failed:', error.message)
    return NextResponse.json({ error: 'Failed to fetch experiments' }, { status: 500 })
  }

  return NextResponse.json({ experiments: data ?? [] })
}

export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: {
    businessKey: string
    title: string
    hypothesis: string
    experimentType: string
    metricPrimary: string
    metricSecondary?: string
    sampleSizeTarget?: number
    confidenceLevel?: number
    generatedBy?: string
    aiRationale?: string
    variants?: Array<{
      variantKey: string
      label: string
      description?: string
      content?: string
      mediaUrls?: string[]
      ctaText?: string
      scheduledTime?: string
      platforms?: string[]
      isControl: boolean
      weight: number
    }>
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  // Validate required fields
  if (!body.title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 })
  if (!body.hypothesis?.trim()) return NextResponse.json({ error: 'hypothesis is required' }, { status: 400 })
  if (!body.businessKey) return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })
  if (!body.experimentType) return NextResponse.json({ error: 'experimentType is required' }, { status: 400 })
  if (!body.metricPrimary) return NextResponse.json({ error: 'metricPrimary is required' }, { status: 400 })

  const business = BUSINESSES.find(b => b.key === body.businessKey)
  if (!business) return NextResponse.json({ error: `Unknown business: ${body.businessKey}` }, { status: 400 })

  if (!EXPERIMENT_TYPES.includes(body.experimentType as ExperimentType)) {
    return NextResponse.json({ error: `Invalid experimentType: ${body.experimentType}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Insert experiment
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .insert({
      founder_id: user.id,
      business_key: body.businessKey,
      title: body.title.trim(),
      hypothesis: body.hypothesis.trim(),
      experiment_type: body.experimentType,
      status: 'draft',
      metric_primary: body.metricPrimary,
      metric_secondary: body.metricSecondary ?? null,
      sample_size_target: body.sampleSizeTarget ?? null,
      confidence_level: body.confidenceLevel ?? 0.95,
      generated_by: body.generatedBy ?? null,
      ai_rationale: body.aiRationale ?? null,
    })
    .select()
    .single()

  if (expError) {
    console.error('[experiments] POST insert failed:', expError.message)
    return NextResponse.json({ error: 'Failed to create experiment' }, { status: 500 })
  }

  // Insert variants if supplied
  let variants: unknown[] = []
  if (body.variants?.length) {
    const variantRows = body.variants.map(v => ({
      experiment_id: experiment.id,
      founder_id: user.id,
      variant_key: v.variantKey,
      label: v.label,
      description: v.description ?? null,
      content: v.content ?? null,
      media_urls: v.mediaUrls ?? [],
      cta_text: v.ctaText ?? null,
      scheduled_time: v.scheduledTime ?? null,
      platforms: v.platforms ?? [],
      is_control: v.isControl,
      weight: v.weight,
    }))

    const { data: variantData, error: varError } = await supabase
      .from('experiment_variants')
      .insert(variantRows)
      .select()

    if (varError) {
      console.error('[experiments] POST variants insert failed:', varError.message)
      // Experiment was created but variants failed — report partial success
      return NextResponse.json(
        { experiment, variants: [], warning: 'Experiment created but variant insertion failed' },
        { status: 201 }
      )
    }
    variants = variantData ?? []
  }

  return NextResponse.json({ experiment, variants }, { status: 201 })
}
