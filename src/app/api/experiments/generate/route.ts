// POST /api/experiments/generate — Generate an A/B experiment using Synthex AI.
// Returns the AI suggestion for founder review (NOT saved to DB until approved).

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { BUSINESSES } from '@/lib/businesses'
import { generateExperiment } from '@/lib/experiments/generator'
import type { ExperimentContext } from '@/lib/experiments/generator'
import type { GenerateExperimentRequest } from '@/lib/experiments/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: { businessKey?: string; experimentType?: string; focusArea?: string }
  try {
    body = await request.json() as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.businessKey) {
    return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })
  }

  // Validate businessKey against known businesses
  const business = BUSINESSES.find(b => b.key === body.businessKey)
  if (!business) {
    return NextResponse.json({ error: `Unknown businessKey: ${body.businessKey}` }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Fetch recent posts for context (last 20 for this business)
  const { data: postsData } = await supabase
    .from('social_posts')
    .select('title, content, platforms, status, published_at')
    .eq('founder_id', user.id)
    .eq('business_key', body.businessKey)
    .order('created_at', { ascending: false })
    .limit(20)

  // Fetch connected channels for this business
  const { data: channelsData } = await supabase
    .from('social_channels')
    .select('platform, handle, follower_count')
    .eq('founder_id', user.id)
    .eq('business_key', body.businessKey)

  // Build context for the AI generator
  const context: ExperimentContext = {
    businessName: business.name,
    recentPosts: (postsData ?? []).map(p => ({
      title: p.title ?? undefined,
      content: p.content ?? '',
      platforms: p.platforms ?? [],
      status: p.status ?? 'draft',
      publishedAt: p.published_at ?? undefined,
    })),
    connectedChannels: (channelsData ?? []).map(c => ({
      platform: c.platform ?? '',
      handle: c.handle ?? undefined,
      followerCount: c.follower_count ?? undefined,
    })),
  }

  const generateRequest: GenerateExperimentRequest = {
    businessKey: business.key,
    experimentType: body.experimentType as GenerateExperimentRequest['experimentType'],
    focusArea: body.focusArea,
  }

  try {
    const result = await generateExperiment(generateRequest, context)

    return NextResponse.json({
      experiment: {
        title: result.title,
        hypothesis: result.hypothesis,
        experimentType: result.experimentType,
        metricPrimary: result.metricPrimary,
        metricSecondary: result.metricSecondary,
        sampleSizeTarget: result.sampleSizeTarget,
        confidenceLevel: result.confidenceLevel,
        aiRationale: result.aiRationale,
      },
      variants: result.variants,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Experiment generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
