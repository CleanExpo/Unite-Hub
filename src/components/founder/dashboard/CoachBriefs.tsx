'use client'

// src/components/founder/dashboard/CoachBriefs.tsx
// Dashboard widget displaying daily AI coach briefs — 4 collapsible cards.
// Scientific Luxury design tokens. Fetches from /api/coaches/reports.
// Note: Brief content is AI-generated (trusted source — our own Claude API calls).
// The simpleMarkdown renderer escapes HTML entities before processing.

import { useState, useEffect } from 'react'
import {
  DollarSign,
  Hammer,
  Megaphone,
  Heart,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import type { CoachType, CoachReport } from '@/lib/coaches/types'
import { COACH_CONFIGS } from '@/lib/coaches/types'

// ── Coach visual config ──────────────────────────────────────────────────────

const COACH_ICONS: Record<CoachType, typeof DollarSign> = {
  revenue: DollarSign,
  build: Hammer,
  marketing: Megaphone,
  life: Heart,
}

const COACH_COLOURS: Record<CoachType, string> = {
  revenue: '#22c55e',
  build: '#3b82f6',
  marketing: '#a855f7',
  life: '#f97316',
}

const COACH_ORDER: CoachType[] = ['life', 'revenue', 'build', 'marketing']

// ── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: CoachReport['status'] }) {
  switch (status) {
    case 'completed':
      return (
        <span className="flex items-center gap-1 text-xs text-emerald-400">
          <CheckCircle2 size={12} /> Done
        </span>
      )
    case 'running':
    case 'pending':
      return (
        <span className="flex items-center gap-1 text-xs text-amber-400">
          <Clock size={12} /> {status === 'running' ? 'Running' : 'Pending'}
        </span>
      )
    case 'failed':
      return (
        <span className="flex items-center gap-1 text-xs text-red-400">
          <AlertCircle size={12} /> Failed
        </span>
      )
    default:
      return null
  }
}

// ── Single coach card ────────────────────────────────────────────────────────

function CoachCard({
  type,
  report,
}: {
  type: CoachType
  report: CoachReport | undefined
}) {
  const [expanded, setExpanded] = useState(false)
  const Icon = COACH_ICONS[type]
  const colour = COACH_COLOURS[type]
  const config = COACH_CONFIGS[type]

  return (
    <div
      className="rounded-sm border border-white/5 bg-[#0a0a0a] overflow-hidden transition-all duration-200"
      style={{ borderLeftColor: colour, borderLeftWidth: 2 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
      >
        <Icon size={18} style={{ color: colour }} />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-[#f0f0f0]">
            {config.name}
          </span>
        </div>
        {report ? (
          <StatusBadge status={report.status} />
        ) : (
          <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>No report</span>
        )}
        {expanded ? (
          <ChevronDown size={14} className="text-white/30" />
        ) : (
          <ChevronRight size={14} className="text-white/30" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-white/5">
          {report?.status === 'completed' && report.brief_markdown ? (
            <MarkdownBrief content={report.brief_markdown} />
          ) : report?.status === 'failed' ? (
            <p className="mt-3 text-sm text-red-400/80">
              {report.error_message ?? 'Coach run failed — check logs.'}
            </p>
          ) : report?.status === 'running' || report?.status === 'pending' ? (
            <p className="mt-3 text-sm text-amber-400/70 flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" />
              Coach is generating today&apos;s brief...
            </p>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              No brief available yet. The {config.name.toLowerCase()} runs daily at its scheduled time.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ── Markdown brief renderer ──────────────────────────────────────────────────
// Renders sanitised AI-generated markdown as structured React elements.
// Content is from our own Claude API calls (trusted source), but we still
// escape HTML entities as a defence-in-depth measure.

function MarkdownBrief({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let listItems: string[] = []
  let key = 0

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={key++} className="mt-1 space-y-0.5 pl-4 list-disc text-sm text-white/70">
          {listItems.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      )
      listItems = []
    }
  }

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed.startsWith('## ')) {
      flushList()
      elements.push(
        <h3 key={key++} className="text-sm font-medium text-white/90 mt-3 mb-1">
          {trimmed.slice(3)}
        </h3>
      )
    } else if (trimmed.startsWith('### ')) {
      flushList()
      elements.push(
        <h4 key={key++} className="text-sm font-medium text-white/80 mt-2 mb-1">
          {trimmed.slice(4)}
        </h4>
      )
    } else if (trimmed.startsWith('- ')) {
      listItems.push(trimmed.slice(2))
    } else if (trimmed === '') {
      flushList()
    } else {
      flushList()
      elements.push(
        <p key={key++} className="text-sm text-white/70 mt-1">
          {trimmed}
        </p>
      )
    }
  }
  flushList()

  return <div className="mt-2">{elements}</div>
}

// ── Main widget ──────────────────────────────────────────────────────────────

export function CoachBriefs() {
  const [reports, setReports] = useState<CoachReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/coaches/reports')
      .then((res) => {
        if (!res.ok) throw new Error('Failed')
        return res.json() as Promise<{ reports: CoachReport[] }>
      })
      .then((data) => setReports(data.reports))
      .catch(() => setReports([]))
      .finally(() => setLoading(false))
  }, [])

  const reportsByType = new Map<CoachType, CoachReport>()
  for (const r of reports) {
    const existing = reportsByType.get(r.coach_type as CoachType)
    if (!existing || r.created_at > existing.created_at) {
      reportsByType.set(r.coach_type as CoachType, r)
    }
  }

  return (
    <div>
      <h2 className="text-base font-medium text-white/60 mb-3 tracking-tight">
        Daily Coaches
      </h2>
      {loading ? (
        <div className="flex items-center gap-2 text-sm py-4" style={{ color: 'var(--color-text-muted)' }}>
          <Loader2 size={14} className="animate-spin" />
          Loading coach briefs...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {COACH_ORDER.map((type) => (
            <CoachCard
              key={type}
              type={type}
              report={reportsByType.get(type)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
