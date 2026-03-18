// src/app/api/email/threads/[threadId]/route.ts
// GET /api/email/threads/[threadId]?account=<email>
// Returns full thread with all message bodies decoded

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchFullThread } from '@/lib/integrations/google'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { threadId } = await params
  const { searchParams } = new URL(request.url)
  const account = searchParams.get('account')
  if (!account) return NextResponse.json({ error: 'account param required' }, { status: 400 })

  try {
    const thread = await fetchFullThread(user.id, account, threadId)
    return NextResponse.json(thread)
  } catch (error) {
    console.error('[Email API] full thread fetch failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch thread' },
      { status: 500 }
    )
  }
}
