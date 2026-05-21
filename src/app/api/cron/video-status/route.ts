// GET /api/cron/video-status — Poll HeyGen for pending video jobs
// Runs every 5 minutes via Vercel CRON. Authenticates via CRON_SECRET.

import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getVideoStatus } from '@/lib/integrations/heygen'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: Request) {
  // 1. Verify CRON_SECRET from Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET?.trim()}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const supabase = createServiceClient()

  // 2. Query all video_assets that are still generating
  const { data: pendingVideos, error: queryError } = await supabase
    .from('video_assets')
    .select('id, external_job_id')
    .eq('status', 'generating')
    .not('external_job_id', 'is', null)

  if (queryError) {
    console.error('[CronVideoStatus] Query error:', queryError.message)
    return NextResponse.json({ error: 'Failed to query pending videos' }, { status: 500 })
  }

  if (!pendingVideos || pendingVideos.length === 0) {
    return NextResponse.json({ checked: 0, ready: 0, failed: 0, stillProcessing: 0 })
  }

  // 3. Poll each pending video
  let ready = 0
  let failed = 0
  let stillProcessing = 0

  const results = await Promise.allSettled(
    pendingVideos.map(async (video) => {
      const heygenStatus = await getVideoStatus(video.external_job_id)

      if (heygenStatus.status === 'completed') {
        await supabase
          .from('video_assets')
          .update({
            status: 'ready',
            video_url: heygenStatus.videoUrl,
            thumbnail_url: heygenStatus.thumbnailUrl,
            duration_seconds: heygenStatus.duration,
          })
          .eq('id', video.id)

        return 'ready' as const
      }

      if (heygenStatus.status === 'failed') {
        await supabase
          .from('video_assets')
          .update({
            status: 'failed',
            error_message: heygenStatus.error ?? 'Video generation failed on HeyGen',
          })
          .eq('id', video.id)

        return 'failed' as const
      }

      return 'processing' as const
    })
  )

  for (const result of results) {
    if (result.status === 'fulfilled') {
      if (result.value === 'ready') ready++
      else if (result.value === 'failed') failed++
      else stillProcessing++
    } else {
      // Promise rejected — count as still processing (will retry next cron run)
      console.error('[CronVideoStatus] Poll error:', result.reason)
      stillProcessing++
    }
  }

  return NextResponse.json({
    checked: pendingVideos.length,
    ready,
    failed,
    stillProcessing,
  })
}
