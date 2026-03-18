// src/app/api/email/bulk/route.ts
// POST /api/email/bulk
// Body: { account, threadIds: string[], action: 'archive'|'delete'|'read'|'unread' }

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { batchModify, deleteThread } from '@/lib/integrations/google'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { account, threadIds, action } = await request.json() as {
    account: string
    threadIds: string[]
    action: string
  }

  if (!account || !threadIds?.length) {
    return NextResponse.json({ error: 'account and threadIds required' }, { status: 400 })
  }

  try {
    switch (action) {
      case 'archive':
        await batchModify(user.id, account, threadIds, { removeLabels: ['INBOX'] })
        break

      case 'delete':
        await Promise.allSettled(threadIds.map(id => deleteThread(user.id, account, id)))
        break

      case 'read':
        await batchModify(user.id, account, threadIds, { removeLabels: ['UNREAD'] })
        break

      case 'unread':
        await batchModify(user.id, account, threadIds, { addLabels: ['UNREAD'] })
        break

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    return NextResponse.json({ success: true, count: threadIds.length })
  } catch (error) {
    console.error('[Email API] bulk action failed:', action, error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Bulk action failed' },
      { status: 500 }
    )
  }
}
