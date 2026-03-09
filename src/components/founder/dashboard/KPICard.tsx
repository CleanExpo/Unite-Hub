// src/components/founder/dashboard/KPICard.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { type Business } from '@/lib/businesses'
import { type StripeMRR } from '@/lib/integrations/stripe'

interface KPICardProps {
  business: Business
  metric: string
  metricLabel: string
  trend: { value: string; positive: boolean }
  secondary: string
  stripeBusinessKey?: string
}

function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

interface MRRState {
  data: StripeMRR | null
  source: 'stripe' | 'mock' | null
  loading: boolean
}

export function KPICard({
  business,
  metric,
  metricLabel,
  trend,
  secondary,
  stripeBusinessKey,
}: KPICardProps) {
  const isPlanning = business.status === 'planning'

  const [mrr, setMrr] = useState<MRRState>({ data: null, source: null, loading: false })

  useEffect(() => {
    if (!stripeBusinessKey || isPlanning) return

    setMrr(prev => ({ ...prev, loading: true }))

    fetch(`/api/stripe/mrr?business=${encodeURIComponent(stripeBusinessKey)}`)
      .then(res => res.json() as Promise<{ data: StripeMRR; source: 'stripe' | 'mock' }>)
      .then(json => {
        setMrr({ data: json.data, source: json.source, loading: false })
      })
      .catch(() => {
        setMrr({ data: null, source: null, loading: false })
      })
  }, [stripeBusinessKey, isPlanning])

  // Derive display values — use live MRR data when available, fall back to static props
  const displayMetric =
    mrr.data && !mrr.loading
      ? formatAUD(mrr.data.mrr)
      : metric

  const displayTrend =
    mrr.data && !mrr.loading
      ? {
          value: `${mrr.data.growth >= 0 ? '+' : ''}${mrr.data.growth.toFixed(1)}% MoM`,
          positive: mrr.data.growth >= 0,
        }
      : trend

  const displaySecondary =
    mrr.data && !mrr.loading
      ? `${mrr.data.activeSubscriptions} Active · ${mrr.data.churnRate.toFixed(1)}% churn`
      : secondary

  return (
    <motion.div
      whileHover={!isPlanning ? { y: -2 } : undefined}
      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
      className="relative rounded-sm border p-5 flex flex-col gap-3"
      style={{
        background: 'var(--surface-card)',
        borderColor: 'var(--color-border)',
        opacity: isPlanning ? 0.5 : 1,
      }}
    >
      {/* Business header */}
      <div className="flex items-center gap-2">
        <span
          className="rounded-full shrink-0"
          style={{ width: 8, height: 8, background: business.color }}
        />
        <span className="text-[13px] font-medium text-[#ccc]">{business.name}</span>
        {business.status === 'planning' && (
          <span className="ml-auto text-[10px] font-medium tracking-widest uppercase text-[#555]">
            Planning
          </span>
        )}
        {/* Live / Demo badge — only shown when Stripe key is wired up */}
        {stripeBusinessKey && !isPlanning && (
          <span className="ml-auto flex items-center gap-1">
            {mrr.loading ? (
              <span className="text-[10px] text-[#555]">—</span>
            ) : mrr.source === 'stripe' ? (
              <>
                <span
                  className="rounded-full shrink-0"
                  style={{
                    width: 6,
                    height: 6,
                    background: '#00F5FF',
                    boxShadow: '0 0 4px #00F5FF',
                  }}
                />
                <span className="text-[10px] font-medium tracking-widest uppercase text-[#00F5FF]">
                  Live
                </span>
              </>
            ) : (
              <>
                <span
                  className="rounded-full shrink-0"
                  style={{ width: 6, height: 6, background: '#555' }}
                />
                <span className="text-[10px] font-medium tracking-widest uppercase text-[#555]">
                  Demo
                </span>
              </>
            )}
          </span>
        )}
      </div>

      {/* Primary metric */}
      <div>
        <div className="text-[30px] font-semibold text-[#f0f0f0] leading-none tracking-tight">
          {mrr.loading ? (
            <span className="text-[#555]">—</span>
          ) : (
            displayMetric
          )}
        </div>
        <div className="mt-1 text-[11px] text-[#555]">{metricLabel}</div>
      </div>

      {/* Trend */}
      <div
        className="text-[12px] font-medium"
        style={{
          color: displayTrend.positive ? 'var(--color-success)' : 'var(--color-danger)',
        }}
      >
        {displayTrend.positive ? '▲' : '▼'} {displayTrend.value}
      </div>

      {/* Divider + secondary */}
      <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <span className="text-[11px] text-[#555]">{displaySecondary}</span>
      </div>

      {/* Planning overlay */}
      {isPlanning && (
        <div className="absolute inset-0 flex flex-col items-center justify-center rounded-sm">
          <span className="text-[24px] text-[#333]">⬡</span>
          <span className="text-[12px] text-[#555] mt-1">Not yet launched</span>
        </div>
      )}
    </motion.div>
  )
}
