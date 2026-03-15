import { NextResponse } from 'next/server'
import { getUser } from '@/lib/supabase/server'
import { submitTextPost, submitLinkPost } from '@/lib/integrations/reddit'

export const dynamic = 'force-dynamic'

interface RedditPostBody {
  subreddit: string
  title: string
  body?: string     // for text posts
  url?: string      // for link posts
  businessKey: string
}

export async function POST(request: Request) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let payload: RedditPostBody
  try {
    payload = await request.json() as RedditPostBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { subreddit, title, body, url, businessKey } = payload

  if (!subreddit || !title || !businessKey) {
    return NextResponse.json(
      { error: 'Missing required fields: subreddit, title, businessKey' },
      { status: 400 }
    )
  }

  if (!body && !url) {
    return NextResponse.json(
      { error: 'Either body (text post) or url (link post) is required' },
      { status: 400 }
    )
  }

  try {
    const result = url
      ? await submitLinkPost(subreddit, title, url)
      : await submitTextPost(subreddit, title, body!)

    return NextResponse.json({
      success: true,
      post: result,
      businessKey,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reddit submission failed'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
