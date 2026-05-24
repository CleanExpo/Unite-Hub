'use client'

import { BarChart3 } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import type { ExperimentResult, ExperimentVariant } from '@/lib/experiments/types'

interface Props {
  results: ExperimentResult[]
  variants: ExperimentVariant[]
  metricKey: 'impressions' | 'clicks' | 'likes' | 'conversions'
}

const VARIANT_COLOURS = ['#666666', '#00F5FF', '#a855f7', '#22c55e', '#f59e0b']

export function ExperimentResultsChart({ results, variants, metricKey }: Props) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No results recorded yet"
        description="Results will appear here once data starts flowing in"
      />
    )
  }

  // Collect unique dates sorted chronologically
  const dates = [...new Set(results.map((r) => r.periodDate))].sort()

  // Group results by variant
  const variantMap = new Map<string, Map<string, number>>()
  for (const r of results) {
    if (!variantMap.has(r.variantId)) variantMap.set(r.variantId, new Map())
    const dateMap = variantMap.get(r.variantId)!
    dateMap.set(r.periodDate, (dateMap.get(r.periodDate) ?? 0) + r[metricKey])
  }

  // Find max value for Y-axis scaling
  let maxVal = 0
  for (const dateMap of variantMap.values()) {
    for (const v of dateMap.values()) {
      if (v > maxVal) maxVal = v
    }
  }
  if (maxVal === 0) maxVal = 1

  // SVG dimensions
  const W = 600
  const H = 200
  const padL = 50
  const padR = 20
  const padT = 15
  const padB = 30
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  // Ordered variant list (control first)
  const orderedVariants = [...variants].sort((a, b) =>
    a.isControl === b.isControl ? a.variantKey.localeCompare(b.variantKey) : a.isControl ? -1 : 1,
  )

  // Build polyline paths
  const lines = orderedVariants.map((variant, vi) => {
    const dateMap = variantMap.get(variant.id)
    if (!dateMap) return null

    const points = dates
      .map((d, di) => {
        const val = dateMap.get(d)
        if (val === undefined) return null
        const x = padL + (di / Math.max(dates.length - 1, 1)) * plotW
        const y = padT + plotH - (val / maxVal) * plotH
        return `${x},${y}`
      })
      .filter(Boolean)

    if (points.length === 0) return null

    return (
      <polyline
        key={variant.id}
        points={points.join(' ')}
        fill="none"
        stroke={VARIANT_COLOURS[vi % VARIANT_COLOURS.length]}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    )
  })

  // Y-axis labels (0, mid, max)
  const yLabels = [0, Math.round(maxVal / 2), Math.round(maxVal)]

  // X-axis labels (show first, mid, last)
  const xIndices =
    dates.length <= 3
      ? dates.map((_, i) => i)
      : [0, Math.floor(dates.length / 2), dates.length - 1]

  return (
    <div className="space-y-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ maxHeight: 220 }}
      >
        {/* Grid lines */}
        {yLabels.map((val) => {
          const y = padT + plotH - (val / maxVal) * plotH
          return (
            <g key={val}>
              <line
                x1={padL}
                y1={y}
                x2={W - padR}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={0.5}
              />
              <text
                x={padL - 8}
                y={y + 3}
                textAnchor="end"
                fill="var(--color-text-disabled)"
                fontSize={10}
              >
                {val}
              </text>
            </g>
          )
        })}

        {/* X-axis labels */}
        {xIndices.map((di) => {
          const x = padL + (di / Math.max(dates.length - 1, 1)) * plotW
          const d = new Date(dates[di])
          const label = d.toLocaleDateString('en-AU', { day: '2-digit', month: '2-digit' })
          return (
            <text
              key={di}
              x={x}
              y={H - 5}
              textAnchor="middle"
              fill="var(--color-text-disabled)"
              fontSize={10}
            >
              {label}
            </text>
          )
        })}

        {/* Data lines */}
        {lines}
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {orderedVariants.map((variant, vi) => (
          <div key={variant.id} className="flex items-center gap-1.5">
            <span
              className="rounded-sm"
              style={{
                width: 10,
                height: 3,
                background: VARIANT_COLOURS[vi % VARIANT_COLOURS.length],
              }}
            />
            <span
              className="text-[10px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {variant.variantKey}: {variant.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
