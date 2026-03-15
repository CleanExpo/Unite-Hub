// GET /api/video/[id]/status — Check the status of a video asset
// If still generating, polls HeyGen and updates the row.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { getVideoStatus } from '@/lib/integrations/heygen'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth check
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params

  const supabase = createServiceClient()

  // 2. Load video_assets row, scoped to founder_id
  const { data: videoAsset, error: fetchError } = await supabase
    .from('video_assets')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (fetchError || !videoAsset) {
    return NextResponse.json({ error: 'Video asset not found' }, { status: 404 })
  }

  // 3. If still generating, poll HeyGen for an update
  if (videoAsset.status === 'generating' && videoAsset.external_job_id) {
    try {
      const heygenStatus = await getVideoStatus(videoAsset.external_job_id)

      if (heygenStatus.status === 'completed') {
        // Update row to ready
        const { data: updated } = await supabase
          .from('video_assets')
          .update({
            status: 'ready',
            video_url: heygenStatus.videoUrl,
            thumbnail_url: heygenStatus.thumbnailUrl,
            duration_seconds: heygenStatus.duration,
          })
          .eq('id', id)
          .select('*')
          .single()

        return NextResponse.json({ videoAsset: updated ?? videoAsset })
      }

      if (heygenStatus.status === 'failed') {
        // Update row to failed
        const { data: updated } = await supabase
          .from('video_assets')
          .update({
            status: 'failed',
            error_message: heygenStatus.error ?? 'Video generation failed on HeyGen',
          })
          .eq('id', id)
          .select('*')
          .single()

        return NextResponse.json({ videoAsset: updated ?? videoAsset })
      }

      // Still pending/processing — return current row unchanged
    } catch (error) {
      console.error('[VideoStatus] HeyGen poll error:', error)
      // Non-fatal: return existing row so client can retry later
    }
  }

  // 4. Return current video_assets row
  return NextResponse.json({ videoAsset })
}
