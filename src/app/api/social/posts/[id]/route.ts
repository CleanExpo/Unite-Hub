// PATCH /api/social/posts/[id] — update post
// DELETE /api/social/posts/[id] — delete draft
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const allowed = ['title', 'content', 'media_urls', 'platforms', 'scheduled_at', 'status']
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('social_posts')
    .update(update)
    .eq('id', id)
    .eq('founder_id', user.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to update post' }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  return NextResponse.json({ post: data })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const supabase = createServiceClient()

  const { data: post } = await supabase
    .from('social_posts')
    .select('status')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.status !== 'draft') {
    return NextResponse.json({ error: 'Only draft posts can be deleted' }, { status: 400 })
  }

  const { error } = await supabase
    .from('social_posts')
    .delete()
    .eq('id', id)
    .eq('founder_id', user.id)

  if (error) return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
