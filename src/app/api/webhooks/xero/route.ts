// POST /api/webhooks/xero
// Receives Xero webhook notifications and verifies x-xero-signature.

import { NextResponse } from 'next/server'
import { verifyXeroWebhookSignature } from '@/lib/webhooks/xero'

export const dynamic = 'force-dynamic'

interface XeroWebhookPayload {
  events?: Array<{
    resourceUrl?: string
    resourceId?: string
    eventDateUtc?: string
    eventType?: string
    eventCategory?: string
    tenantId?: string
    tenantType?: string
  }>
  firstEventSequence?: number
  lastEventSequence?: number
  entropy?: string
}

export async function POST(request: Request) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-xero-signature')

  if (!verifyXeroWebhookSignature(rawBody, signature)) {
    console.warn('[Xero Webhook] Invalid signature rejected')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: XeroWebhookPayload
  try {
    payload = JSON.parse(rawBody) as XeroWebhookPayload
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const events = payload.events ?? []
  console.log(
    `[Xero Webhook] accepted ${events.length} event(s), sequence ${payload.firstEventSequence ?? 'n/a'}-${payload.lastEventSequence ?? 'n/a'}`,
  )

  return NextResponse.json({ ok: true, events: events.length })
}
