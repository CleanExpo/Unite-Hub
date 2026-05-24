// src/app/api/email/threads/[threadId]/action/route.ts
// POST /api/email/threads/[threadId]/action
// Body: { account, action: 'archive'|'delete'|'read'|'unread'|'reply', ...payload }

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import {
  archiveThread,
  deleteThread,
  markAsRead,
  markAsUnread,
  sendReply,
} from '@/lib/integrations/google'

export const dynamic = 'force-dynamic'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { threadId } = await params
  const body = await request.json() as {
    account: string
    action: string
    messageId?: string
    to?: string
    subject?: string
    body?: string
    inReplyToMessageId?: string
  }

  const { account, action } = body
  if (!account) return NextResponse.json({ error: 'account required' }, { status: 400 })

  try {
    switch (action) {
      case 'archive':
        await archiveThread(user.id, account, threadId)
        return NextResponse.json({ success: true })

      case 'delete':
        await deleteThread(user.id, account, threadId)
        return NextResponse.json({ success: true })

      case 'read':
        await markAsRead(user.id, account, body.messageId ?? threadId)
        return NextResponse.json({ success: true })

      case 'unread':
        await markAsUnread(user.id, account, body.messageId ?? threadId)
        return NextResponse.json({ success: true })

      case 'reply': {
        if (!body.to || !body.subject || !body.body) {
          return NextResponse.json({ error: 'to, subject, body required for reply' }, { status: 400 })
        }
        const result = await sendReply(user.id, account, threadId, {
          to: body.to,
          subject: body.subject,
          body: body.body,
          inReplyToMessageId: body.inReplyToMessageId,
        })
        return NextResponse.json({ success: true, messageId: result.messageId })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[Email API] thread action failed:', action, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Action failed' },
      { status: 500 }
    )
  }
}
