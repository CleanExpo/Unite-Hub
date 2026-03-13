'use client'

import { useState } from 'react'
import { ConnectionStrip } from './ConnectionStrip'
import { PostsList } from './PostsList'
import { CalendarView } from './CalendarView'
import { PostComposer } from './PostComposer'
import type { SocialChannel, SocialPost } from '@/lib/integrations/social/types'

const TABS = ['Calendar', 'Posts', 'Analytics'] as const
type Tab = typeof TABS[number]

interface Props {
  channels: SocialChannel[]
  posts: SocialPost[]
}

export function SocialPageClient({ channels, posts }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Posts')
  const [composerOpen, setComposerOpen] = useState(false)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-light" style={{ color: 'var(--color-text-primary)' }}>Social</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Content calendar across all platforms</p>
        </div>
        <button
          onClick={() => setComposerOpen(true)}
          className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors"
        >
          + New Post
        </button>
      </div>

      <ConnectionStrip channels={channels} />

      {/* Tab bar */}
      <div className="flex gap-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-[11px] uppercase tracking-[0.12em] transition-colors ${
              activeTab === tab
                ? 'text-[#00F5FF] border-b border-[#00F5FF] -mb-px'
                : 'text-[#999999] hover:text-[#f0f0f0]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Calendar' && <CalendarView posts={posts} />}
      {activeTab === 'Posts' && <PostsList posts={posts} />}
      {activeTab === 'Analytics' && (
        <div className="text-sm py-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
          Analytics coming soon — connect accounts to see engagement data
        </div>
      )}

      {composerOpen && (
        <PostComposer
          channels={channels}
          onClose={() => setComposerOpen(false)}
          onCreated={() => { setComposerOpen(false); window.location.reload() }}
        />
      )}
    </div>
  )
}
