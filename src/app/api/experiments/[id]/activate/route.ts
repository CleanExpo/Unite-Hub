// src/app/api/experiments/[id]/activate/route.ts
// POST: Activate a draft experiment — validates variants, creates social posts, queues approval

import { NextRequest, NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  // 1. Verify experiment exists, belongs to user, and is in draft status
  const { data: experiment, error: expError } = await supabase
    .from('experiments')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (expError || !experiment) {
    return NextResponse.json({ error: 'Experiment not found' }, { status: 404 })
  }

  if (experiment.status !== 'draft') {
    return NextResponse.json(
      { error: `Cannot activate experiment with status '${experiment.status}' — must be draft` },
      { status: 400 }
    )
  }

  // 2. Verify at least 2 variants exist with one control
  const { data: variants, error: varError } = await supabase
    .from('experiment_variants')
    .select('*')
    .eq('experiment_id', id)
    .eq('founder_id', user.id)

  if (varError) {
    console.error('[experiments/activate] Failed to fetch variants:', varError.message)
    return NextResponse.json({ error: 'Failed to fetch variants' }, { status: 500 })
  }

  if (!variants || variants.length < 2) {
    return NextResponse.json(
      { error: 'At least 2 variants are required to activate an experiment' },
      { status: 400 }
    )
  }

  const hasControl = variants.some(v => v.is_control === true)
  if (!hasControl) {
    return NextResponse.json(
      { error: 'At least one variant must be marked as the control (is_control = true)' },
      { status: 400 }
    )
  }

  // 3. Verify variant weights sum to approximately 1.0 (within 0.05 tolerance)
  const weightSum = variants.reduce((sum, v) => sum + (v.weight ?? 0), 0)
  if (Math.abs(weightSum - 1.0) > 0.05) {
    return NextResponse.json(
      { error: `Variant weights must sum to ~1.0 (current sum: ${weightSum.toFixed(3)})` },
      { status: 400 }
    )
  }

  // 4. Create social_posts for each variant with content
  let postsCreated = 0
  for (const variant of variants) {
    if (variant.content) {
      const { error: postError } = await supabase
        .from('social_posts')
        .insert({
          founder_id: user.id,
          business_key: experiment.business_key,
          content: variant.content,
          platforms: variant.platforms ?? [],
          status: 'draft',
          experiment_variant_id: variant.id,
          media_urls: variant.media_urls ?? [],
        })

      if (postError) {
        console.error(`[experiments/activate] Failed to create post for variant ${variant.id}:`, postError.message)
        // Continue — partial post creation is acceptable
      } else {
        postsCreated++
      }
    }
  }

  // 5. Create approval_queue entry
  const { data: approval, error: approvalError } = await supabase
    .from('approval_queue')
    .insert({
      founder_id: user.id,
      type: 'experiment_activation',
      title: `Activate experiment: ${experiment.title}`,
      description: experiment.hypothesis,
      payload: {
        experimentId: id,
        variantCount: variants.length,
        businessKey: experiment.business_key,
      },
    })
    .select('id')
    .single()

  if (approvalError) {
    console.error('[experiments/activate] Failed to create approval entry:', approvalError.message)
  }

  // 6. Update experiment status to active and set started_at
  const { error: updateError } = await supabase
    .from('experiments')
    .update({
      status: 'active',
      started_at: new Date().toISOString(),
      approval_queue_id: approval?.id ?? null,
    })
    .eq('id', id)
    .eq('founder_id', user.id)

  if (updateError) {
    console.error('[experiments/activate] Failed to update experiment status:', updateError.message)
    return NextResponse.json({ error: 'Failed to activate experiment' }, { status: 500 })
  }

  return NextResponse.json({
    message: 'Experiment activated',
    postsCreated,
    approvalId: approval?.id ?? null,
  })
}
