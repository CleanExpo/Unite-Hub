import { NextResponse } from 'next/server'
import { buildContinuationEnforcement, founderRunQueueStore, type FounderRunQueueAction } from '../../../../../../lib/founder-os'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

interface TransitionRequestBody {
  action?: FounderRunQueueAction
  actor?: string
  note?: string
  evidenceLink?: string
  now?: string
}

const VALID_ACTIONS: FounderRunQueueAction[] = ['approve', 'start', 'block', 'complete']

export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params
  let body: TransitionRequestBody

  try {
    body = (await request.json()) as TransitionRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  if (!body.action || !VALID_ACTIONS.includes(body.action)) {
    return NextResponse.json({ error: 'valid action is required' }, { status: 400 })
  }

  const actor = body.actor?.trim()
  if (!actor) {
    return NextResponse.json({ error: 'actor is required' }, { status: 400 })
  }

  try {
    const queueItem = founderRunQueueStore.transition({
      id,
      action: body.action,
      actor,
      note: body.note,
      evidenceLink: body.evidenceLink,
      now: body.now,
    })

    return NextResponse.json({
      queueItem,
      summary: founderRunQueueStore.summary(),
      enforcement: buildContinuationEnforcement(founderRunQueueStore.list()),
      receipt: queueItem.receipts.at(-1) ?? null,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'transition failed'
    const status = message === 'queue item not found' ? 404 : 400
    return NextResponse.json({ error: message }, { status })
  }
}
