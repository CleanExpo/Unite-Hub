'use client'

import { useState, useEffect } from 'react'
import { FlaskConical } from 'lucide-react'
import Link from 'next/link'
import { ConnectionStrip } from './ConnectionStrip'
import { PostsList } from './PostsList'
import { CalendarView } from './CalendarView'
import { PostComposer } from './PostComposer'
import { BrandPersonas } from './BrandPersonas'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import type { SocialChannel, SocialPost } from '@/lib/integrations/social/types'

const TABS = ['Calendar', 'Posts', 'Analytics', 'Experiments', 'Personas'] as const
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
        <SocialAnalyticsPanel channels={channels} />
      )}
      {activeTab === 'Experiments' && (
        <SocialExperimentsPanel channels={channels} />
      )}
      {activeTab === 'Personas' && <BrandPersonas />}

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

/* ── Analytics Panel ── */

interface ExperimentSummary {
  id: string
  title: string
  status: string
  experiment_type: string
  metrics?: { engagement_rate?: number }
}

function SocialAnalyticsPanel({ channels }: { channels: SocialChannel[] }) {
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Derive business key from first connected channel if available
    const businessKey = channels.length > 0 ? (channels[0] as SocialChannel & { businessKey?: string }).businessKey : undefined
    const url = businessKey
      ? `/api/experiments?business=${encodeURIComponent(businessKey)}`
      : '/api/experiments'

    fetch(url)
      .then(res => res.json())
      .then((data: ExperimentSummary[]) => setExperiments(Array.isArray(data) ? data : []))
      .catch(() => setExperiments([]))
      .finally(() => setLoading(false))
  }, [channels])

  const total = experiments.length
  const active = experiments.filter(e => e.status === 'active').length
  const completed = experiments.filter(e => e.status === 'completed').length
  const completedWithRate = experiments.filter(e => e.status === 'completed' && e.metrics?.engagement_rate != null)
  const avgEngagement = completedWithRate.length > 0
    ? (completedWithRate.reduce((sum, e) => sum + (e.metrics?.engagement_rate ?? 0), 0) / completedWithRate.length).toFixed(1)
    : '—'

  if (loading) {
    return (
      <div className="py-12 text-center text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
        Loading analytics...
      </div>
    )
  }

  const stats = [
    { label: 'Total Experiments', value: String(total) },
    { label: 'Active', value: String(active), highlight: true },
    { label: 'Completed', value: String(completed) },
    { label: 'Avg Engagement', value: avgEngagement === '—' ? '—' : `${avgEngagement}%` },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map(stat => (
          <div
            key={stat.label}
            className="rounded-sm p-4"
            style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
          >
            <p className="text-[11px] uppercase tracking-wider mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {stat.label}
            </p>
            <p
              className="text-lg font-semibold"
              style={{ color: stat.highlight ? '#00F5FF' : 'var(--color-text-primary)' }}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      {total === 0 && (
        <p className="text-[13px] py-4" style={{ color: 'var(--color-text-secondary)' }}>
          No experiments yet. Create one from the Experiments tab or use Synthex AI.
        </p>
      )}
    </div>
  )
}

/* ── Experiments Panel ── */

function SocialExperimentsPanel({ channels }: { channels: SocialChannel[] }) {
  const [experiments, setExperiments] = useState<ExperimentSummary[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const businessKey = channels.length > 0 ? (channels[0] as SocialChannel & { businessKey?: string }).businessKey : undefined
    const url = businessKey
      ? `/api/experiments?business=${encodeURIComponent(businessKey)}`
      : '/api/experiments'

    fetch(url)
      .then(res => res.json())
      .then((data: ExperimentSummary[]) => setExperiments(Array.isArray(data) ? data : []))
      .catch(() => setExperiments([]))
      .finally(() => setLoading(false))
  }, [channels])

  if (loading) {
    return (
      <div className="py-12 text-center text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
        Loading experiments...
      </div>
    )
  }

  if (experiments.length === 0) {
    return (
      <EmptyState
        icon={FlaskConical}
        title="No experiments yet"
        description="Create A/B tests from the Experiments page to optimise your social content."
      />
    )
  }

  return (
    <div className="space-y-3">
      <div
        className="rounded-sm divide-y"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
      >
        {experiments.slice(0, 5).map(exp => (
          <Link
            key={exp.id}
            href={`/founder/experiments/${exp.id}`}
            className="flex items-center justify-between px-4 py-3 transition-colors hover:brightness-110"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <div className="flex items-center gap-2">
              <FlaskConical size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-secondary)' }} />
              <span className="text-[13px] truncate">{exp.title}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-sm" style={{ color: 'var(--color-text-secondary)', background: 'rgba(255,255,255,0.06)' }}>
                {exp.experiment_type}
              </span>
            </div>
            <span
              className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider"
              style={{
                background: exp.status === 'active' ? 'rgba(0, 245, 255, 0.08)' : exp.status === 'completed' ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255, 255, 255, 0.05)',
                color: exp.status === 'active' ? '#00F5FF' : exp.status === 'completed' ? '#22c55e' : 'var(--color-text-secondary)',
              }}
            >
              {exp.status}
            </span>
          </Link>
        ))}
      </div>
      <Link
        href="/founder/experiments"
        className="inline-block text-[11px] font-medium"
        style={{ color: '#00F5FF' }}
      >
        View all experiments →
      </Link>
    </div>
  )
}
