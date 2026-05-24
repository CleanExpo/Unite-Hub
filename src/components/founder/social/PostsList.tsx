'use client'

import type { SocialPost, SocialPlatform } from '@/lib/integrations/social/types'

const STATUS_COLOURS: Record<string, string> = {
  draft: 'text-[#999999] border-[#999999]/30',
  scheduled: 'text-[#00F5FF] border-[#00F5FF]/30',
  publishing: 'text-[#f59e0b] border-[#f59e0b]/30',
  published: 'text-[#22c55e] border-[#22c55e]/30',
  failed: 'text-[#ef4444] border-[#ef4444]/30',
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
      <div className="text-[13px] py-12 text-center" style={{ color: 'var(--color-text-secondary)' }}>
        No posts yet — click <span className="text-[#00F5FF]">+ New Post</span> to get started
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {posts.map(post => (
        <div
          key={post.id}
          className="border border-[rgba(255,255,255,0.06)] p-4 rounded-sm hover:border-[rgba(255,255,255,0.12)] transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{post.content}</p>
              {post.scheduledAt && (
                <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Scheduled: {new Date(post.scheduledAt).toLocaleString('en-AU')}
                </p>
              )}
              {post.errorMessage && (
                <p className="text-[11px] mt-1" style={{ color: '#ef4444' }}>{post.errorMessage}</p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex gap-1">
                {(post.platforms as SocialPlatform[]).map(p => (
                  <span
                    key={p}
                    className="w-5 h-5 rounded-sm text-[10px] flex items-center justify-center"
                    style={{ backgroundColor: `${PLATFORM_COLOURS[p]}20`, color: PLATFORM_COLOURS[p] }}
                  >
                    {p[0].toUpperCase()}
                  </span>
                ))}
              </div>
              <span className={`text-[10px] uppercase tracking-wider border px-1.5 py-0.5 rounded-sm ${STATUS_COLOURS[post.status] ?? ''}`}>
                {post.status}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
