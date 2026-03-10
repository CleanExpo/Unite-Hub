// src/components/founder/dashboard/KPICard.tsx
'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { type Business } from '@/lib/businesses'
import { type StripeMRR } from '@/lib/integrations/stripe'
import { type XeroRevenueMTD } from '@/lib/integrations/xero'

interface KPICardProps {
  business: Business
  metric: string
  metricLabel: string
  trend: { value: string; positive: boolean }
  secondary: string
  stripeBusinessKey?: string
  xeroBusinessKey?: string
}

function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

interface LiveState {
  metric: string | null
  trend: { value: string; positive: boolean } | null
  secondary: string | null
  source: 'stripe' | 'xero' | 'mock' | null
  loading: boolean
}

export function KPICard({
  business,
  metric,
  metricLabel,
  trend,
  secondary,
  stripeBusinessKey,
  xeroBusinessKey,
}: KPICardProps) {
  const isPlanning = business.status === 'planning'

  const [live, setLive] = useState<LiveState>({
    metric: null, trend: null, secondary: null, source: null, loading: false,
  })

  useEffect(() => {
    if (isPlanning) return

    if (stripeBusinessKey) {
      setLive(prev => ({ ...prev, loading: true }))
      fetch(`/api/stripe/mrr?business=${encodeURIComponent(stripeBusinessKey)}`)
        .then(res => res.json() as Promise<{ data: StripeMRR; source: 'stripe' | 'mock' }>)
        .then(({ data, source }) => {
          setLive({
            metric: formatAUD(data.mrr),
            trend: {
              value: `${data.growth >= 0 ? '+' : ''}${data.growth.toFixed(1)}% MoM`,
              positive: data.growth >= 0,
            },
            secondary: `${data.activeSubscriptions} Active · ${data.churnRate.toFixed(1)}% churn`,
            source,
            loading: false,
          })
        })
        .catch((error) => {
          console.error(`[kpi] Stripe fetch failed for ${stripeBusinessKey}:`, error)
          setLive({ metric: null, trend: null, secondary: null, source: null, loading: false })
        })
      return
    }

    if (xeroBusinessKey) {
      setLive(prev => ({ ...prev, loading: true }))
      fetch(`/api/xero/revenue?business=${encodeURIComponent(xeroBusinessKey)}`)
        .then(res => res.json() as Promise<{ data: XeroRevenueMTD; source: 'xero' | 'mock' }>)
        .then(({ data, source }) => {
          setLive({
            metric: formatAUD(data.revenueCents),
            trend: {
              value: `${data.growth >= 0 ? '+' : ''}${data.growth.toFixed(1)}% MoM`,
              positive: data.growth >= 0,
            },
            secondary: `${data.invoiceCount} Invoices MTD`,
            source,
            loading: false,
          })
        })
        .catch((error) => {
          console.error(`[kpi] Xero fetch failed for ${xeroBusinessKey}:`, error)
          setLive({ metric: null, trend: null, secondary: null, source: null, loading: false })
        })
    }
  }, [stripeBusinessKey, xeroBusinessKey, isPlanning])

  const isLive = !!(stripeBusinessKey || xeroBusinessKey) && !isPlanning

  // Fall back to static props when live data hasn't loaded
  const displayMetric = live.metric ?? metric
  const displayTrend = live.trend ?? trend
  const displaySecondary = live.secondary ?? secondary

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
        {/* Live / Demo badge */}
        {isLive && (
          <span className="ml-auto flex items-center gap-1">
            {live.loading ? (
              <span className="text-[10px] text-[#555]">—</span>
            ) : live.source === 'stripe' || live.source === 'xero' ? (
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
          {live.loading ? (
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
