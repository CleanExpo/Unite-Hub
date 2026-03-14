// src/app/api/webhooks/whatsapp/route.ts
// WhatsApp Cloud API (Meta Business) inbound webhook handler.
// GET: Meta webhook verification handshake (one-time setup)
// POST: Receives inbound messages, verifies signature, processes idea into Linear issue

import { NextRequest, NextResponse } from 'next/server'
import { verifyWhatsAppSignature } from '@/lib/webhooks/verify'
import { isDuplicate, insertEvent, markEvent } from '@/lib/webhooks/dedup'
import { processIdea } from '@/lib/agent-pipeline/idea-processor'
import { createIssue } from '@/lib/integrations/linear'
import { notify } from '@/lib/notifications'

export const dynamic = 'force-dynamic'

// ─── GET — Meta Verification Handshake ────────────────────────────────────────
// Meta calls this once when you configure the webhook in the Business Manager.
// It sends hub.mode=subscribe, hub.verify_token (matches WHATSAPP_VERIFY_TOKEN),
// and hub.challenge. We echo back the challenge to confirm ownership.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN?.trim()) {
    console.log('[WhatsApp Webhook] Verification handshake successful')
    return new NextResponse(challenge, { status: 200 })
  }

  console.warn('[WhatsApp Webhook] Verification failed — token mismatch')
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// ─── POST — Inbound Messages ──────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  // Read raw body before any parsing (needed for HMAC signature verification)
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!verifyWhatsAppSignature(rawBody, signature)) {
    console.warn('[WhatsApp Webhook] Invalid signature — rejected')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = JSON.parse(rawBody) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Navigate WhatsApp Cloud API payload structure
  // body.entry[0].changes[0].value.messages[0]
  const entry = (body.entry as unknown[])?.[0] as Record<string, unknown> | undefined
  const change = (entry?.changes as unknown[])?.[0] as Record<string, unknown> | undefined
  const value = change?.value as Record<string, unknown> | undefined
  const messages = value?.messages as unknown[] | undefined
  const message = messages?.[0] as Record<string, unknown> | undefined

  // Only process text messages — ignore images, audio, reactions etc.
  if (!message || message.type !== 'text') {
    return NextResponse.json({ status: 'ignored', reason: 'not a text message' })
  }

  const messageId = message.id as string
  const messageText = (message.text as Record<string, unknown>)?.body as string ?? ''

  if (!messageId || !messageText.trim()) {
    return NextResponse.json({ status: 'ignored', reason: 'empty message' })
  }

  // ─── Idempotency check ───────────────────────────────────────────────────────
  if (await isDuplicate('whatsapp', messageId)) {
    return NextResponse.json({ status: 'duplicate' })
  }

  const eventRowId = await insertEvent('whatsapp', messageId, 'text_message', body)

  // ─── Process idea → Linear issue ────────────────────────────────────────────
  try {
    const issueInput = await processIdea(messageText)
    const issue = await createIssue(issueInput)

    await markEvent(eventRowId, 'processed')

    notify({
      type: 'whatsapp_idea_received',
      title: '💡 WhatsApp Idea → Linear',
      body: `Idea processed: "${issueInput.title}" — ${issue.url ?? issue.id}`,
      severity: 'info',
      metadata: { messageId, linearIssueId: issue.id, linearUrl: issue.url },
    }).catch(() => {})

    return NextResponse.json({
      status: 'processed',
      linearIssueId: issue.id,
      linearIssueUrl: issue.url,
    })
  } catch (error) {
    await markEvent(eventRowId, 'failed', error instanceof Error ? error.message : 'Unknown error')
    console.error('[WhatsApp Webhook] Processing failed:', error)
    // Return 200 to stop Meta from retrying (our error is in markEvent, not Meta's fault)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
