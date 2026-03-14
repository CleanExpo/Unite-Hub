'use client'

import { useState } from 'react'
import { BarChart3 } from 'lucide-react'
import { ConnectionStrip } from './ConnectionStrip'
import { PostsList } from './PostsList'
import { CalendarView } from './CalendarView'
import { PostComposer } from './PostComposer'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
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
      <PageHeader
        title="Social"
        subtitle="Content calendar across all platforms"
        actions={
          <button
            onClick={() => setComposerOpen(true)}
            className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors"
          >
            + New Post
          </button>
        }
      />

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
        <EmptyState
          icon={BarChart3}
          title="Analytics coming soon"
          description="Connect social accounts and publish posts to see engagement analytics across all platforms."
        />
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
