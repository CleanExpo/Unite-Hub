// src/app/(founder)/founder/social/page.tsx
export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChannels } from '@/lib/integrations/social/channels'
import { createServiceClient } from '@/lib/supabase/service'
import { SocialPageClient } from '@/components/founder/social/SocialPageClient'
import type { SocialChannel, SocialPost } from '@/lib/integrations/social/types'

export default async function SocialPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  // Load channels and posts independently — either can fail without
  // crashing the page (table may not exist yet or schema may differ)
  let channels: SocialChannel[] = []
  let posts: SocialPost[] = []

  const supabase = createServiceClient()

  const [channelsResult, postsResult] = await Promise.allSettled([
    getChannels(user.id),
    supabase
      .from('social_posts')
      .select('*')
      .eq('founder_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  if (channelsResult.status === 'fulfilled') {
    channels = channelsResult.value
  } else {
    console.error('[social] Failed to load channels:', channelsResult.reason)
  }

  if (postsResult.status === 'fulfilled') {
    posts = (postsResult.value.data ?? []) as SocialPost[]
  } else {
    console.error('[social] Failed to load posts:', postsResult.reason)
  }

  return (
    <SocialPageClient
      channels={channels}
      posts={posts}
    />
  )
}
