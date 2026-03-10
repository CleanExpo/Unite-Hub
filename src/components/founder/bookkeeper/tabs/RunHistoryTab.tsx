'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusBadge } from '../shared/StatusBadge'
import { formatAUD, formatDate } from '../shared/formatters'
import type { BookkeeperRun, RunsResponse } from '@/lib/bookkeeper/types'

const PAGE_SIZE = 20

const RUN_STATUS_CONFIG: Record<string, { color: string; bg: string; border: string; pulse?: boolean }> = {
  completed: { color: '#00F5FF', bg: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.2)' },
  partial:   { color: '#eab308', bg: 'rgba(234,179,8,0.08)', border: 'rgba(234,179,8,0.2)' },
  failed:    { color: '#ef4444', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.2)' },
  running:   { color: '#00F5FF', bg: 'rgba(0,245,255,0.08)', border: 'rgba(0,245,255,0.2)', pulse: true },
}

function RunStatusBadge({ status }: { status: string }) {
  const config = RUN_STATUS_CONFIG[status] ?? { color: '#555', bg: 'rgba(85,85,85,0.08)', border: 'rgba(85,85,85,0.2)' }
  return (
    <span
      className={`text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm ${config.pulse ? 'animate-pulse' : ''}`}
      style={{ color: config.color, backgroundColor: config.bg, border: `1px solid ${config.border}` }}
    >
      {status}
    </span>
  )
}

function formatDuration(startedAt: string, completedAt: string | null): string {
  if (!completedAt) return '--'
  const diffMs = new Date(completedAt).getTime() - new Date(startedAt).getTime()
  const totalSeconds = Math.floor(diffMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--color-border)]">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3 bg-white/5 rounded-sm animate-pulse" style={{ width: `${50 + i * 10}px` }} />
        </td>
      ))}
    </tr>
  )
}

export function RunHistoryTab() {
  const [runs, setRuns] = useState<BookkeeperRun[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const fetchRuns = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/bookkeeper/runs?page=${p}&pageSize=${PAGE_SIZE}`)
      if (!res.ok) throw new Error(`Failed to fetch runs: ${res.status}`)
      const json = await res.json() as RunsResponse
      setRuns(json.runs)
      setTotal(json.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchRuns(page)
  }, [page, fetchRuns])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  if (error && runs.length === 0) {
    return (
      <div className="border border-[var(--color-danger)]/20 rounded-sm p-4 text-[13px]" style={{ color: 'var(--color-danger)' }}>
        {error}
      </div>
    )
  }

  if (!loading && runs.length === 0) {
    return (
      <div className="border border-[var(--color-border)] rounded-sm p-8 text-center">
        <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          No runs recorded yet.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto border border-[var(--color-border)] rounded-sm">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--surface-card)' }}>
              <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Started</th>
              <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Duration</th>
              <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Status</th>
              <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Transactions</th>
              <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Auto</th>
              <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Flagged</th>
              <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>GST Net</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
            ) : (
              runs.map((run) => (
                <RunRow
                  key={run.id}
                  run={run}
                  expanded={expandedId === run.id}
                  onToggle={() => setExpandedId(expandedId === run.id ? null : run.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="text-[11px] px-3 py-1 border rounded-sm disabled:opacity-30 hover:border-[#00F5FF]/40 transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="text-[11px] px-3 py-1 border rounded-sm disabled:opacity-30 hover:border-[#00F5FF]/40 transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function RunRow({ run, expanded, onToggle }: { run: BookkeeperRun; expanded: boolean; onToggle: () => void }) {
  const netGst = run.netGstCents
  const isRefund = netGst < 0

  return (
    <>
      <tr
        onClick={onToggle}
        className="border-b border-[var(--color-border)] cursor-pointer hover:bg-white/[0.02] transition-colors"
      >
        <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
          {formatDate(run.startedAt)}
        </td>
        <td className="px-3 py-2.5 tabular-nums" style={{ color: 'var(--color-text-disabled)' }}>
          {formatDuration(run.startedAt, run.completedAt)}
        </td>
        <td className="px-3 py-2.5">
          <RunStatusBadge status={run.status} />
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
          {run.totalTransactions}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: '#00F5FF' }}>
          {run.autoReconciled}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: run.flaggedForReview > 0 ? '#eab308' : 'var(--color-text-disabled)' }}>
          {run.flaggedForReview}
        </td>
        <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: isRefund ? 'var(--color-success)' : 'var(--color-danger)' }}>
          {formatAUD(Math.abs(netGst))}
        </td>
      </tr>
      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={7} className="p-0">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 py-3 space-y-2" style={{ backgroundColor: 'rgba(0,245,255,0.02)' }}>
                  <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: 'var(--color-text-disabled)' }}>
                    Businesses processed
                  </p>
                  {run.businessesProcessed.map((bp) => (
                    <div
                      key={bp.businessKey}
                      className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[12px]" style={{ color: 'var(--color-text-primary)' }}>
                          {bp.businessName}
                        </span>
                        <StatusBadge status={bp.status === 'success' ? 'reconciled' : bp.status === 'error' ? 'unmatched' : 'manual_review'} />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[11px] tabular-nums" style={{ color: 'var(--color-text-disabled)' }}>
                          {bp.transactionCount} txns
                        </span>
                        {bp.error && (
                          <span className="text-[11px]" style={{ color: 'var(--color-danger)' }}>
                            {bp.error}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}
