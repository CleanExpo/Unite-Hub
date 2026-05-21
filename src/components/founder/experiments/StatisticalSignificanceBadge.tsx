'use client'

import type { SignificanceData } from '@/lib/experiments/types'

interface Props {
  data: SignificanceData | null
}

export function StatisticalSignificanceBadge({ data }: Props) {
  if (!data) {
    return (
      <span
        className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider inline-block"
        style={{
          background: 'rgba(153,153,153,0.15)',
          color: '#999999',
        }}
      >
        Insufficient data
      </span>
    )
  }

  if (data.isSignificant && data.lift > 0) {
    return (
      <span
        className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider inline-block"
        style={{
          background: 'rgba(34,197,94,0.15)',
          color: '#22c55e',
        }}
      >
        Significant (+{data.lift.toFixed(1)}%)
      </span>
    )
  }

  if (data.isSignificant && data.lift < 0) {
    return (
      <span
        className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider inline-block"
        style={{
          background: 'rgba(239,68,68,0.15)',
          color: '#ef4444',
        }}
      >
        Significant ({data.lift.toFixed(1)}%)
      </span>
    )
  }

  return (
    <span
      className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider inline-block"
      style={{
        background: 'rgba(245,158,11,0.15)',
        color: '#f59e0b',
      }}
    >
      Not yet significant (p={data.pValue.toFixed(3)})
    </span>
  )
}
