// DELETE /api/social/channels/:id
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { deleteChannel } from '@/lib/integrations/social/channels'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  try {
    await deleteChannel(user.id, id)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    // Row not found surfaces as a PostgREST error with code PGRST116
    if (message.includes('PGRST116') || message.includes('0 rows')) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }
    console.error('[social/channels/[id]] DELETE error:', err)
    return NextResponse.json({ error: 'Failed to disconnect channel' }, { status: 500 })
  }
}
