// GET /api/social/channels?business={key}
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { getChannels } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business') ?? undefined

  try {
    const channels = await getChannels(user.id, businessKey)
    return NextResponse.json({ channels })
  } catch (err) {
    console.error('[social/channels] GET error:', err)
    return NextResponse.json({ error: 'Failed to load channels' }, { status: 500 })
  }
}
