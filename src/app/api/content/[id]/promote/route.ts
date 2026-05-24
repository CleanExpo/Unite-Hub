// POST /api/content/{id}/promote — Promote generated content to a social post
import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const dynamic = 'force-dynamic'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = (await request.json()) as {
    platforms?: string[]
    scheduledAt?: string | null
  }

  const supabase = createServiceClient()

  // Fetch the generated content
  const { data: content, error: fetchError } = await supabase
    .from('generated_content')
    .select('*')
    .eq('id', id)
    .eq('founder_id', user.id)
    .single()

  if (fetchError || !content) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  if (content.status === 'published') {
    return NextResponse.json({ error: 'Content already published' }, { status: 409 })
  }

  // Determine platforms — from request body, or from content platform, or default to facebook
  const platforms = body.platforms ?? (content.platform ? [content.platform] : ['facebook'])

  // Build the full post body with hashtags
  let fullContent = content.body as string
  const hashtags = content.hashtags as string[] | null
  if (hashtags && hashtags.length > 0) {
    fullContent += '\n\n' + hashtags.map((h: string) => (h.startsWith('#') ? h : `#${h}`)).join(' ')
  }

  // Create social post
  const { data: post, error: postError } = await supabase
    .from('social_posts')
    .insert({
      founder_id: user.id,
      business_key: content.business_key,
      title: content.title,
      content: fullContent,
      media_urls: content.media_urls ?? [],
      platforms,
      status: body.scheduledAt ? 'scheduled' : 'draft',
      scheduled_at: body.scheduledAt ?? null,
    })
    .select('id, status')
    .single()

  if (postError || !post) {
    return NextResponse.json({ error: postError?.message ?? 'Failed to create post' }, { status: 500 })
  }

  // Link generated content to the social post and update status
  await supabase
    .from('generated_content')
    .update({ social_post_id: post.id, status: 'approved' })
    .eq('id', id)

  return NextResponse.json({
    status: 'promoted',
    socialPostId: post.id,
    postStatus: post.status,
  })
}
