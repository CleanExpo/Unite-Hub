'use client'

import { StatisticalSignificanceBadge } from './StatisticalSignificanceBadge'
import type { VariantWithTotals, SignificanceData } from '@/lib/experiments/types'

interface Props {
  variants: VariantWithTotals[]
  significance: Record<string, SignificanceData | null>
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-AU').format(n)
}

function formatPercent(n: number): string {
  return n.toFixed(2) + '%'
}

export function VariantComparisonGrid({ variants, significance }: Props) {
  // Find max engagement rate for relative bar widths
  const maxEngagement = Math.max(
    ...variants.map((v) => v.totals.engagementRate),
    0.01,
  )

  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(variants.length, 3)}, 1fr)` }}>
      {variants.map((variant) => {
        const barWidth =
          maxEngagement > 0
            ? (variant.totals.engagementRate / maxEngagement) * 100
            : 0

        return (
          <div
            key={variant.id}
            className="border rounded-sm p-4 space-y-3"
            style={{
              background: 'var(--surface-card)',
              borderColor: 'var(--color-border)',
            }}
          >
            {/* Header: variant key + label */}
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider"
                style={{
                  background: 'rgba(0,245,255,0.15)',
                  color: '#00F5FF',
                }}
              >
                {variant.variantKey}
              </span>
              <span
                className="text-[13px] font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {variant.label}
              </span>
              {variant.isControl && (
                <span
                  className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider"
                  style={{
                    background: 'rgba(153,153,153,0.15)',
                    color: '#999999',
                  }}
                >
                  Control
                </span>
              )}
            </div>

            {/* Content preview */}
            {variant.content && (
              <p
                className="text-[11px] line-clamp-3"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {variant.content.length > 120
                  ? variant.content.slice(0, 120) + '...'
                  : variant.content}
              </p>
            )}

            {/* CTA */}
            {variant.ctaText && (
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--color-text-disabled)' }}
                >
                  CTA
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {variant.ctaText}
                </span>
              </div>
            )}

            {/* Metrics */}
            <div
              className="border-t pt-3 space-y-1.5"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
            >
              <div className="flex justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--color-text-disabled)' }}
                >
                  Impressions
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {formatNumber(variant.totals.totalImpressions)}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--color-text-disabled)' }}
                >
                  Clicks
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {formatNumber(variant.totals.totalClicks)}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--color-text-disabled)' }}
                >
                  Engagement
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {formatPercent(variant.totals.engagementRate)}
                </span>
              </div>
              <div className="flex justify-between">
                <span
                  className="text-[10px] uppercase tracking-[0.15em]"
                  style={{ color: 'var(--color-text-disabled)' }}
                >
                  CTR
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {formatPercent(variant.totals.clickThroughRate)}
                </span>
              </div>
            </div>

            {/* Performance bar */}
            <div>
              <div
                className="h-1 rounded-sm"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div
                  className="h-1 rounded-sm transition-all duration-500"
                  style={{
                    width: `${barWidth}%`,
                    background: variant.isControl ? '#666' : '#00F5FF',
                  }}
                />
              </div>
            </div>

            {/* Statistical significance (treatment variants only) */}
            {!variant.isControl && (
              <StatisticalSignificanceBadge data={significance[variant.id] ?? null} />
            )}
          </div>
        )
      })}
    </div>
  )
}
