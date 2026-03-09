// src/components/founder/dashboard/KPICard.tsx
'use client'

import { motion } from 'framer-motion'
import { type Business } from '@/lib/businesses'

interface KPICardProps {
  business: Business
  metric: string
  metricLabel: string
  trend: { value: string; positive: boolean }
  secondary: string
}

export function KPICard({ business, metric, metricLabel, trend, secondary }: KPICardProps) {
  const isPlanning = business.status === 'planning'

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
      </div>

      {/* Primary metric */}
      <div>
        <div className="text-[30px] font-semibold text-[#f0f0f0] leading-none tracking-tight">
          {metric}
        </div>
        <div className="mt-1 text-[11px] text-[#555]">{metricLabel}</div>
      </div>

      {/* Trend */}
      <div
        className="text-[12px] font-medium"
        style={{ color: trend.positive ? 'var(--color-success)' : 'var(--color-danger)' }}
      >
        {trend.positive ? '▲' : '▼'} {trend.value}
      </div>

      {/* Divider + secondary */}
      <div className="border-t pt-3" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
        <span className="text-[11px] text-[#555]">{secondary}</span>
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
