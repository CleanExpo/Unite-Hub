// src/app/api/email/threads/route.ts
// GET /api/email/threads?account=<email>&pageToken=&q=&maxResults=
// Returns paginated Gmail threads for a specific account

import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { fetchThreadsPaginated } from '@/lib/integrations/google'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const account = searchParams.get('account')
  const pageToken = searchParams.get('pageToken') ?? undefined
  const q = searchParams.get('q') ?? undefined
  const maxResults = Math.min(parseInt(searchParams.get('maxResults') ?? '25', 10), 50)

  if (!account) return NextResponse.json({ error: 'account param required' }, { status: 400 })

  try {
    const result = await fetchThreadsPaginated(user.id, account, { pageToken, query: q, maxResults })
    return NextResponse.json(result)
  } catch (error) {
    console.error('[Email API] threads list failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch threads' },
      { status: 500 }
    )
  }
}
