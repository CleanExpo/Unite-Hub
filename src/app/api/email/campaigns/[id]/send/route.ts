// src/app/api/email/campaigns/[id]/send/route.ts
// POST: Trigger sending an email campaign via SendGrid.

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { sendCampaignEmail, type EmailRecipient } from '@/lib/integrations/sendgrid'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  // 2. Load campaign and verify ownership
  const { data: campaign, error: loadError } = await supabase
    .from('email_campaigns')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (loadError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
  }

  // 3. Validate status
  if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
    return NextResponse.json(
      { error: `Campaign cannot be sent — current status is '${campaign.status}'` },
      { status: 400 }
    )
  }

  // 4. Update status to 'sending'
  const { error: updateError } = await supabase
    .from('email_campaigns')
    .update({ status: 'sending' })
    .eq('id', id)

  if (updateError) {
    console.error('[email/campaigns/send] Status update failed:', updateError.message)
    return NextResponse.json({ error: 'Failed to update campaign status' }, { status: 500 })
  }

  // 5. Parse recipient list
  const recipients: EmailRecipient[] = Array.isArray(campaign.recipient_list)
    ? (campaign.recipient_list as Array<{ email: string; name?: string }>)
    : []

  if (recipients.length === 0) {
    // Revert status
    await supabase.from('email_campaigns').update({ status: 'draft' }).eq('id', id)
    return NextResponse.json({ error: 'Campaign has no recipients' }, { status: 400 })
  }

  // 6. Build from address using business brand identity
  const { data: brand } = await supabase
    .from('brand_identities')
    .select('business_key')
    .eq('business_key', campaign.business_key)
    .eq('founder_id', user.id)
    .single()

  const fromAddress: EmailRecipient = {
    email: process.env.SENDGRID_FROM_EMAIL?.trim() || `noreply@${campaign.business_key}.com.au`,
    name: brand?.business_key?.toUpperCase() ?? campaign.business_key,
  }

  // 7. Send campaign
  try {
    const result = await sendCampaignEmail(
      recipients,
      fromAddress,
      campaign.subject,
      campaign.body_html,
      campaign.body_text ?? undefined,
      campaign.categories ?? undefined
    )

    // 8. Update campaign status
    const finalStatus = result.failed === 0 ? 'sent' : 'partial'
    await supabase
      .from('email_campaigns')
      .update({
        status: finalStatus,
        sent_at: new Date().toISOString(),
        sent_count: result.sent,
        failed_count: result.failed,
      })
      .eq('id', id)

    return NextResponse.json({
      status: finalStatus,
      sent: result.sent,
      failed: result.failed,
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[email/campaigns/send] SendGrid error:', message)

    // Revert status to draft so it can be retried
    await supabase.from('email_campaigns').update({ status: 'draft' }).eq('id', id)

    return NextResponse.json({ error: 'Failed to send campaign', detail: message }, { status: 500 })
  }
}
