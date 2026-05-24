// POST /api/campaigns/[id]/assets/[assetId]/approve
// Approves a 'review' asset, setting status to 'ready'.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id, assetId } = await params
  const supabase = createServiceClient()

  // Verify asset belongs to this campaign and this founder
  const { data: asset, error: fetchError } = await supabase
    .from('campaign_assets')
    .select('id, status')
    .eq('id', assetId)
    .eq('campaign_id', id)
    .eq('founder_id', user.id)
    .single()

  if (fetchError || !asset) {
    return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  if (asset.status !== 'review') {
    return NextResponse.json(
      { error: `Cannot approve asset with status '${asset.status}' — must be 'review'` },
      { status: 400 }
    )
  }

  const { error: updateError } = await supabase
    .from('campaign_assets')
    .update({ status: 'ready', quality_status: 'approved' })
    .eq('id', assetId)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to approve asset' }, { status: 500 })
  }

  return NextResponse.json({ success: true, status: 'ready' })
}
