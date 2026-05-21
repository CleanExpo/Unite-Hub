// src/app/api/experiments/[id]/variants/route.ts
// GET:  List variants for an experiment
// POST: Add a variant to a draft experiment

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
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

  const { data, error } = await supabase
    .from('experiment_variants')
    .select('*')
    .eq('experiment_id', id)
    .eq('founder_id', user.id)
    .order('is_control', { ascending: false })
    .order('variant_key', { ascending: true })

  if (error) {
    console.error('[experiments/variants] GET failed:', error.message)
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
  }

  return NextResponse.json({ variants: data ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  let body: {
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
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.variantKey?.trim()) return NextResponse.json({ error: 'variantKey is required' }, { status: 400 })
  if (!body.label?.trim()) return NextResponse.json({ error: 'label is required' }, { status: 400 })
  if (body.isControl === undefined) return NextResponse.json({ error: 'isControl is required' }, { status: 400 })
  if (body.weight === undefined) return NextResponse.json({ error: 'weight is required' }, { status: 400 })

  const supabase = createServiceClient()

  // Verify experiment belongs to user and is in draft status
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .select('id, status')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (expError || !experiment) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  if (experiment.status !== 'draft') {
    return NextResponse.json(
      { error: 'Variants can only be added to draft experiments' },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from('experiment_variants')
    .insert({
      experiment_id: id,
      founder_id: user.id,
      variant_key: body.variantKey.trim(),
      label: body.label.trim(),
      description: body.description ?? null,
      content: body.content ?? null,
      media_urls: body.mediaUrls ?? [],
      cta_text: body.ctaText ?? null,
      scheduled_time: body.scheduledTime ?? null,
      platforms: body.platforms ?? [],
      is_control: body.isControl,
      weight: body.weight,
    })
    .select()
    .single()

  if (error) {
    console.error('[experiments/variants] POST failed:', error.message)
    return NextResponse.json({ error: 'Failed to create variant' }, { status: 500 })
  }

  return NextResponse.json({ variant: data }, { status: 201 })
}
