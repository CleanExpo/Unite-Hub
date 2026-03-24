'use client'

import type { AdvisoryCase } from '@/lib/advisory/types'
import { FIRM_META } from '@/lib/advisory/types'

interface CaseCardProps {
  case_: AdvisoryCase
  onClick?: () => void
}

const STATUS_COLOURS: Record<string, string> = {
  draft: '#6b7280',
  debating: '#f59e0b',
  judged: '#3b82f6',
  pending_review: '#a855f7',
  approved: '#22c55e',
  rejected: '#ef4444',
  executed: '#00F5FF',
  closed: '#6b7280',
}

export function CaseCard({ case_, onClick }: CaseCardProps) {
  const statusColour = STATUS_COLOURS[case_.status] ?? '#6b7280'

  return (
    <button
      onClick={onClick}
      className="w-full text-left p-4 rounded-sm transition-colors"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="text-[13px] font-medium truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {case_.title}
          </h3>
          <p
            className="text-[11px] mt-1 line-clamp-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {case_.scenario}
          </p>
        </div>
        <span
          className="shrink-0 text-[10px] font-medium px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
          style={{
            background: `${statusColour}18`,
            color: statusColour,
            border: `1px solid ${statusColour}30`,
          }}
        >
          {case_.status.replace('_', ' ')}
        </span>
      </div>

      {(case_.source ?? 'manual') === 'auto-bookkeeper' && (
        <div
          className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-sm"
          style={{
            background: '#f59e0b14',
            border: '1px solid #f59e0b30',
          }}
        >
          <span style={{ color: '#f59e0b', fontSize: 10 }}>⚠</span>
          <span className="text-[10px]" style={{ color: '#f59e0b' }}>
            Auto-triggered from bookkeeper run — verify input data before acting on verdict
          </span>
        </div>
      )}

      <div className="flex items-center gap-2 mt-3">
        <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>
          Round {case_.current_round}/{case_.total_rounds}
        </span>
        {case_.winning_firm && (
          <>
            <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>•</span>
            <span className="text-[10px]" style={{ color: FIRM_META[case_.winning_firm]?.color }}>
              Winner: {FIRM_META[case_.winning_firm]?.name}
            </span>
          </>
        )}
      </div>
    </button>
  )
}
