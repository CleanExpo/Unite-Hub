'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, ArrowRight } from 'lucide-react'
import { InsightDiscussion } from './InsightDiscussion'
import { BUSINESSES } from '@/lib/businesses'

export type InsightStatus = 'new' | 'reviewing' | 'acting' | 'done'

export interface Insight {
  id: string
  business_key: string
  run_date: string
  type: string
  title: string
  body: string
  priority: string
  status: InsightStatus
  metadata: {
    keywords?: string[]
    bidScore?: number
    effortEstimate?: string
    gstackLens?: string
  }
  created_at: string
}

interface InsightCardProps {
  insight: Insight
  onStatusChange: (id: string, status: InsightStatus) => void
}

const TYPE_LABELS: Record<string, string> = {
  'seo-opportunity': 'SEO',
  'content-gap': 'Content Gap',
  'strategy': 'Strategy',
  'technical': 'Technical',
  'quick-win': 'Quick Win',
}

const TYPE_COLORS: Record<string, string> = {
  'seo-opportunity': '#00F5FF',
  'content-gap': '#a855f7',
  'strategy': '#f97316',
  'technical': '#3b82f6',
  'quick-win': '#22c55e',
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
}

const NEXT_STATUS: Record<InsightStatus, InsightStatus | null> = {
  new: 'reviewing',
  reviewing: 'acting',
  acting: 'done',
  done: null,
}

const NEXT_LABEL: Record<InsightStatus, string> = {
  new: '→ Reviewing',
  reviewing: '→ Acting',
  acting: '→ Done',
  done: '',
}

export function InsightCard({ insight, onStatusChange }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [advancing, setAdvancing] = useState(false)

  const biz = BUSINESSES.find((b) => b.key === insight.business_key)
  const bizColor = biz?.color ?? '#6b7280'
  const typeLabel = TYPE_LABELS[insight.type] ?? insight.type
  const typeColor = TYPE_COLORS[insight.type] ?? '#6b7280'
  const nextStatus = NEXT_STATUS[insight.status]

  async function advance() {
    if (!nextStatus || advancing) return
    setAdvancing(true)
    try {
      await fetch(`/api/strategy/insights/${insight.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      onStatusChange(insight.id, nextStatus)
    } finally {
      setAdvancing(false)
    }
  }

  return (
    <div
      className="rounded-sm border overflow-hidden transition-all"
      style={{
        borderColor: expanded ? 'rgba(0,245,255,0.2)' : 'var(--color-border)',
        background: 'var(--surface-card)',
        borderLeft: `3px solid ${bizColor}`,
      }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <span style={{ color: 'var(--color-text-disabled)', flexShrink: 0 }}>
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </span>

        {/* Type badge */}
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-sm flex-shrink-0 font-medium"
          style={{
            color: typeColor,
            background: `${typeColor}18`,
            border: `1px solid ${typeColor}33`,
          }}
        >
          {typeLabel}
        </span>

        {/* Title */}
        <span className="flex-1 text-[12px] leading-snug" style={{ color: 'var(--color-text-primary)' }}>
          {insight.title}
        </span>

        {/* Priority dot */}
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ background: PRIORITY_COLORS[insight.priority] ?? '#6b7280' }}
          title={insight.priority}
        />

        {/* Effort badge */}
        {insight.metadata.effortEstimate && (
          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--color-text-disabled)' }}>
            {insight.metadata.effortEstimate}
          </span>
        )}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="px-4 pb-4">
          {/* Metadata pills */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {insight.metadata.gstackLens && (
              <span className="text-[10px] px-2 py-0.5 rounded-sm border" style={{ color: 'var(--color-text-disabled)', borderColor: 'var(--color-border)' }}>
                {insight.metadata.gstackLens}
              </span>
            )}
            {insight.metadata.bidScore !== undefined && (
              <span className="text-[10px] px-2 py-0.5 rounded-sm border" style={{ color: '#00F5FF', borderColor: 'rgba(0,245,255,0.3)' }}>
                B.I.D. {insight.metadata.bidScore.toFixed(1)}
              </span>
            )}
            {insight.metadata.keywords?.slice(0, 3).map((kw) => (
              <span key={kw} className="text-[10px] px-2 py-0.5 rounded-sm border" style={{ color: 'var(--color-text-muted)', borderColor: 'var(--color-border)' }}>
                {kw}
              </span>
            ))}
          </div>

          {/* Body */}
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap mb-4" style={{ color: 'var(--color-text-secondary)' }}>
            {insight.body}
          </div>

          {/* Advance status */}
          {nextStatus && (
            <button
              onClick={advance}
              disabled={advancing}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-sm border transition-colors disabled:opacity-40"
              style={{
                borderColor: 'rgba(0,245,255,0.3)',
                color: '#00F5FF',
                background: 'rgba(0,245,255,0.06)',
              }}
            >
              <ArrowRight size={11} />
              {NEXT_LABEL[insight.status]}
            </button>
          )}

          {/* Discussion thread */}
          <InsightDiscussion insightId={insight.id} />
        </div>
      )}
    </div>
  )
}
