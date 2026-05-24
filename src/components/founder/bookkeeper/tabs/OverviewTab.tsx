'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { StatusBadge } from '../shared/StatusBadge'
import { formatAUD } from '../shared/formatters'
import type { BookkeeperOverview } from '@/lib/bookkeeper/types'

function SkeletonCard() {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm p-4 animate-pulse">
      <div className="h-3 w-20 bg-white/5 rounded-sm mb-3" />
      <div className="h-6 w-28 bg-white/5 rounded-sm" />
    </div>
  )
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function OverviewTab() {
  const [data, setData] = useState<BookkeeperOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch('/api/bookkeeper/overview')
        if (!res.ok) throw new Error(`Failed to fetch overview: ${res.status}`)
        const json = await res.json() as BookkeeperOverview
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-[var(--color-danger)]/20 rounded-sm p-4 text-[13px]" style={{ color: 'var(--color-danger)' }}>
        {error}
      </div>
    )
  }

  if (!data || !data.lastRun) {
    return (
      <div className="border border-[var(--color-border)] rounded-sm p-8 text-center">
        <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          No bookkeeper runs yet. The nightly CRON will process your first batch.
        </p>
      </div>
    )
  }

  const { lastRun, totals, alertCount } = data
  const netGstCents = lastRun.netGstCents
  const isRefund = netGstCents < 0

  const cards = [
    {
      label: 'Last Run Status',
      value: (
        <div className="flex items-center gap-2 mt-1">
          <StatusBadge status={lastRun.status} />
          <span className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
            {timeAgo(lastRun.startedAt)}
          </span>
        </div>
      ),
    },
    {
      label: 'Total Transactions (12m)',
      value: (
        <span className="text-[22px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
          {totals.totalTransactions12m.toLocaleString('en-AU')}
        </span>
      ),
    },
    {
      label: 'Pending Reconciliation',
      value: (
        <span
          className="text-[22px] font-semibold tabular-nums"
          style={{ color: totals.pendingReconciliation > 0 ? '#eab308' : 'var(--color-text-primary)' }}
        >
          {totals.pendingReconciliation}
        </span>
      ),
    },
    {
      label: 'Pending Approval',
      value: (
        <span
          className="text-[22px] font-semibold tabular-nums"
          style={{ color: totals.pendingApproval > 0 ? '#eab308' : 'var(--color-text-primary)' }}
        >
          {totals.pendingApproval}
        </span>
      ),
    },
    {
      label: 'Total Deductible',
      value: (
        <span className="text-[22px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
          {formatAUD(totals.totalDeductibleCents)}
        </span>
      ),
    },
    {
      label: 'GST Position',
      value: (
        <span
          className="text-[22px] font-semibold tabular-nums"
          style={{ color: isRefund ? 'var(--color-success)' : 'var(--color-danger)' }}
        >
          {formatAUD(Math.abs(netGstCents))}
          <span className="text-[10px] ml-1 font-normal" style={{ color: 'var(--color-text-disabled)' }}>
            {isRefund ? 'refund' : 'owing'}
          </span>
        </span>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {alertCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-sm px-4 py-2.5 text-[12px] flex items-center gap-2"
          style={{ borderColor: 'rgba(234,179,8,0.3)', backgroundColor: 'rgba(234,179,8,0.06)', color: '#eab308' }}
        >
          <span className="font-medium">{alertCount} alert{alertCount !== 1 ? 's' : ''}</span>
          <span style={{ color: 'var(--color-text-disabled)' }}>require attention</span>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.label}
            whileHover={{ y: -1 }}
            transition={{ type: 'spring', stiffness: 300 }}
            className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm p-4"
          >
            <p className="text-[11px] tracking-wide uppercase mb-2" style={{ color: 'var(--color-text-disabled)' }}>
              {card.label}
            </p>
            {card.value}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
