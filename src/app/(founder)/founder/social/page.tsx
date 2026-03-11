// src/app/(founder)/founder/social/page.tsx
export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getChannels } from '@/lib/integrations/social/channels'
import { createServiceClient } from '@/lib/supabase/service'
import { SocialPageClient } from '@/components/founder/social/SocialPageClient'
import type { SocialPost } from '@/lib/integrations/social/types'

export default async function SocialPage() {
  const user = await getUser()
  if (!user) redirect('/auth/login')

  const supabase = createServiceClient()
  const [channels, { data: posts }] = await Promise.all([
    getChannels(user.id),
    supabase
      .from('social_posts')
      .select('*')
      .eq('founder_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  return (
    <SocialPageClient
      channels={channels}
      posts={(posts ?? []) as SocialPost[]}
    />
  )
}
