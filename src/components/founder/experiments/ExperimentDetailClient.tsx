'use client'

import { useState } from 'react'
import { BUSINESSES } from '@/lib/businesses'
import { VariantComparisonGrid } from './VariantComparisonGrid'
import { ExperimentResultsChart } from './ExperimentResultsChart'
import { ExperimentTimeline } from './ExperimentTimeline'
import { SynthexGeneratorPanel } from './SynthexGeneratorPanel'
import type {
  Experiment,
  ExperimentResult,
  VariantWithTotals,
  SignificanceData,
} from '@/lib/experiments/types'

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  draft: { bg: 'rgba(153,153,153,0.15)', text: '#999999' },
  active: { bg: 'rgba(0,245,255,0.15)', text: '#00F5FF' },
  paused: { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  completed: { bg: 'rgba(34,197,94,0.15)', text: '#22c55e' },
  cancelled: { bg: 'rgba(239,68,68,0.15)', text: '#ef4444' },
}

interface Props {
  experiment: Experiment
  variants: VariantWithTotals[]
  results: ExperimentResult[]
  significance: Record<string, SignificanceData | null>
}

export function ExperimentDetailClient({
  experiment,
  variants,
  results,
  significance,
}: Props) {
  const [showGenerator, setShowGenerator] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const business = BUSINESSES.find((b) => b.key === experiment.businessKey)
  const status = STATUS_STYLES[experiment.status] ?? STATUS_STYLES.draft
  const winnerVariant = variants.find((v) => v.id === experiment.winnerVariantId) ?? null

  async function handleStatusChange(newStatus: 'active' | 'completed') {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/experiments/${experiment.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        window.location.reload()
      }
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
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
          <span
            className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider"
            style={{ background: status.bg, color: status.text }}
          >
            {experiment.status}
          </span>
        </div>

        <h1
          className="text-xl font-light"
          style={{ color: 'var(--color-text-primary)' }}
        >
          {experiment.title}
        </h1>

        <p
          className="text-[11px] mt-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {experiment.hypothesis}
        </p>

        {/* Action buttons */}
        <div className="flex items-center gap-3 mt-4">
          {experiment.status === 'draft' && (
            <button
              onClick={() => handleStatusChange('active')}
              disabled={actionLoading}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors disabled:opacity-50"
            >
              Activate
            </button>
          )}
          {experiment.status === 'active' && (
            <button
              onClick={() => handleStatusChange('completed')}
              disabled={actionLoading}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors disabled:opacity-50"
            >
              Complete
            </button>
          )}
          {variants.length === 0 && (
            <button
              onClick={() => setShowGenerator(true)}
              className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors"
            >
              Generate with Synthex
            </button>
          )}
        </div>
      </div>

      {/* Variant Comparison */}
      {variants.length > 0 && (
        <div className="space-y-3">
          <h2
            className="text-[10px] uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-text-disabled)' }}
          >
            Variant Comparison
          </h2>
          <VariantComparisonGrid variants={variants} significance={significance} />
        </div>
      )}

      {/* Results Chart */}
      <div className="space-y-3">
        <h2
          className="text-[10px] uppercase tracking-[0.15em]"
          style={{ color: 'var(--color-text-disabled)' }}
        >
          Results
        </h2>
        <div
          className="border rounded-sm p-4"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <ExperimentResultsChart
            results={results}
            variants={variants}
            metricKey={
              experiment.metricPrimary === 'engagement'
                ? 'likes'
                : experiment.metricPrimary === 'reach'
                  ? 'impressions'
                  : experiment.metricPrimary === 'clicks'
                    ? 'clicks'
                    : 'conversions'
            }
          />
        </div>
      </div>

      {/* Conclusion */}
      {experiment.conclusion && (
        <div className="space-y-2">
          <h2
            className="text-[10px] uppercase tracking-[0.15em]"
            style={{ color: 'var(--color-text-disabled)' }}
          >
            Conclusion
          </h2>
          <p
            className="text-[11px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {experiment.conclusion}
          </p>
        </div>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        <h2
          className="text-[10px] uppercase tracking-[0.15em]"
          style={{ color: 'var(--color-text-disabled)' }}
        >
          Timeline
        </h2>
        <div
          className="border rounded-sm p-4"
          style={{
            background: 'var(--surface-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          <ExperimentTimeline experiment={experiment} winnerVariant={winnerVariant} />
        </div>
      </div>

      {/* Synthex Generator */}
      {showGenerator && (
        <SynthexGeneratorPanel onClose={() => setShowGenerator(false)} />
      )}
    </div>
  )
}
