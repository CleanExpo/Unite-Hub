'use client'

import type { SocialPost, SocialPlatform } from '@/lib/integrations/social/types'

const STATUS_COLOURS: Record<string, string> = {
  draft: 'text-white/40 border-white/20',
  scheduled: 'text-[#00F5FF] border-[#00F5FF]/30',
  publishing: 'text-yellow-400 border-yellow-400/30',
  published: 'text-green-400 border-green-400/30',
  failed: 'text-red-400 border-red-400/30',
}

const PLATFORM_COLOURS: Record<SocialPlatform, string> = {
  facebook: '#1877F2',
  instagram: '#E1306C',
  linkedin: '#0A66C2',
  tiktok: '#FE2C55',
  youtube: '#FF0000',
}

interface Props {
  posts: SocialPost[]
}

export function PostsList({ posts }: Props) {
  if (posts.length === 0) {
    return (
      <div className="text-sm text-white/40 py-12 text-center">
        No posts yet — click <span className="text-[#00F5FF]">+ New Post</span> to get started
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map(post => (
        <div
          key={post.id}
          className="border border-white/[0.08] p-4 rounded-sm hover:border-white/[0.14] transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/80 line-clamp-2">{post.content}</p>
              {post.scheduledAt && (
                <p className="text-[11px] text-white/40 mt-1">
                  Scheduled: {new Date(post.scheduledAt).toLocaleString('en-AU')}
                </p>
              )}
              {post.errorMessage && (
                <p className="text-[11px] text-red-400/70 mt-1">{post.errorMessage}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1">
                {(post.platforms as SocialPlatform[]).map(p => (
                  <span
                    key={p}
                    className="w-4 h-4 rounded-sm text-[8px] flex items-center justify-center"
                    style={{ backgroundColor: `${PLATFORM_COLOURS[p]}20`, color: PLATFORM_COLOURS[p] }}
                  >
                    {p[0].toUpperCase()}
                  </span>
                ))}
              </div>
              <span className={`text-[9px] uppercase tracking-wider border px-1.5 py-0.5 rounded-sm ${STATUS_COLOURS[post.status] ?? ''}`}>
                {post.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
