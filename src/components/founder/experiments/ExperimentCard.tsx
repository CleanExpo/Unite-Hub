'use client'

import Link from 'next/link'
import { BUSINESSES } from '@/lib/businesses'
import type { Experiment } from '@/lib/experiments/types'

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'rgba(153,153,153,0.15)', text: '#999999' },
  active: { bg: 'rgba(0,245,255,0.15)', text: '#00F5FF' },
  paused: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  completed: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
}

function formatDateAU(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface Props {
  experiment: Experiment
  variantCount: number
}

export function ExperimentCard({ experiment, variantCount }: Props) {
  const business = BUSINESSES.find((b) => b.key === experiment.businessKey)
  const status = STATUS_STYLES[experiment.status] ?? STATUS_STYLES.draft

  return (
    <Link href={`/founder/experiments/${experiment.id}`} className="block group">
      <div
        className="border rounded-sm p-4 transition-colors"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--color-border)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'var(--surface-elevated)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'var(--surface-card)'
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Business + title */}
            <div className="flex items-center gap-2 mb-1">
              {business && (
                <>
                  <span
                    className="rounded-full shrink-0"
                    style={{ width: 8, height: 8, background: business.color }}
                  />
                  <span
                    className="text-[10px] uppercase tracking-[0.15em]"
                    style={{ color: 'var(--color-text-disabled)' }}
                  >
                    {business.name}
                  </span>
                </>
              )}
            </div>

            <h3
              className="text-[13px] font-medium truncate"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {experiment.title}
            </h3>

            {/* Meta row */}
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span
                className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider"
                style={{ background: status.bg, color: status.text }}
              >
                {experiment.status}
              </span>

              <span
                className="text-[10px] uppercase tracking-[0.15em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {formatType(experiment.experimentType)}
              </span>

              <span
                className="text-[10px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {variantCount} variant{variantCount !== 1 ? 's' : ''}
              </span>

              <span
                className="text-[10px] uppercase tracking-[0.15em]"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                {experiment.metricPrimary}
              </span>
            </div>
          </div>

          {/* Date */}
          <span
            className="text-[10px] shrink-0"
            style={{ color: 'var(--color-text-disabled)' }}
          >
            {formatDateAU(experiment.createdAt)}
          </span>
        </div>
      </div>
    </Link>
  )
}
