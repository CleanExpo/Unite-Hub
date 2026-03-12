// GET  /api/social/posts?business={key}&status={status}
// POST /api/social/posts — create draft or scheduled post
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import type { CreatePostInput } from '@/lib/integrations/social/types'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const businessKey = searchParams.get('business')
  const status = searchParams.get('status')

  const supabase = createServiceClient()
  let query = supabase
    .from('social_posts')
    .select('*')
    .eq('founder_id', user.id)
    .order('created_at', { ascending: false })

  if (businessKey) query = query.eq('business_key', businessKey)
  if (status) query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })

  return NextResponse.json({ posts: data ?? [] })
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: CreatePostInput
  try {
    body = await request.json() as CreatePostInput
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.content?.trim()) return NextResponse.json({ error: 'content is required' }, { status: 400 })
  if (!body.businessKey) return NextResponse.json({ error: 'businessKey is required' }, { status: 400 })
  if (!body.platforms?.length) return NextResponse.json({ error: 'at least one platform required' }, { status: 400 })

  const status = body.scheduledAt ? 'scheduled' : 'draft'

  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      founder_id: user.id,
      business_key: body.businessKey,
      title: body.title ?? null,
      content: body.content,
      media_urls: body.mediaUrls ?? [],
      platforms: body.platforms,
      status,
      scheduled_at: body.scheduledAt ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })

  return NextResponse.json({ post: data }, { status: 201 })
}
