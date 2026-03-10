'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { StatusBadge } from '../shared/StatusBadge'
import { BusinessFilter } from '../shared/BusinessFilter'
import { DateRangeFilter } from '../shared/DateRangeFilter'
import { formatAUD, formatDate } from '../shared/formatters'
import { BUSINESSES } from '@/lib/businesses'
import type { BusinessKey } from '@/lib/businesses'
import type {
  BookkeeperTransaction,
  TransactionsResponse,
} from '@/lib/bookkeeper/types'

type StatusFilter = 'all' | BookkeeperTransaction['reconciliationStatus']

const PAGE_SIZE = 20

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'unmatched', label: 'Unmatched' },
  { value: 'suggested_match', label: 'Suggested' },
  { value: 'manual_review', label: 'Manual Review' },
  { value: 'reconciled', label: 'Reconciled' },
  { value: 'auto_matched', label: 'Auto Matched' },
]

function getBusinessColour(key: string): string {
  const biz = BUSINESSES.find(b => b.key === key)
  return biz?.color ?? '#555'
}

function getBusinessName(key: string): string {
  const biz = BUSINESSES.find(b => b.key === key)
  return biz?.name ?? key
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--color-border)]">
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3 bg-white/5 rounded-sm animate-pulse" style={{ width: `${40 + i * 8}px` }} />
        </td>
      ))}
    </tr>
  )
}

export function ReconciliationTab() {
  const [transactions, setTransactions] = useState<BookkeeperTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [business, setBusiness] = useState<BusinessKey | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const fetchTransactions = useCallback(async (p: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      params.set('page', String(p))
      params.set('pageSize', String(PAGE_SIZE))
      if (business !== 'all') params.set('business', business)
      if (status !== 'all') params.set('status', status)
      if (dateFrom) params.set('from', dateFrom)
      if (dateTo) params.set('to', dateTo)

      const res = await fetch(`/api/bookkeeper/transactions?${params.toString()}`)
      if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`)
      const json = await res.json() as TransactionsResponse
      setTransactions(json.transactions)
      setTotal(json.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [business, status, dateFrom, dateTo])

  useEffect(() => {
    setPage(1)
    setSelected(new Set())
  }, [business, status, dateFrom, dateTo])

  useEffect(() => {
    void fetchTransactions(page)
  }, [page, fetchTransactions])

  const totalPages = Math.ceil(total / PAGE_SIZE)

  // Reconcile a single transaction
  const handleReconcile = useCallback(async (txn: BookkeeperTransaction) => {
    const prev = txn.reconciliationStatus
    // Optimistic update
    setTransactions(ts => ts.map(t => t.id === txn.id ? { ...t, reconciliationStatus: 'reconciled' as const } : t))
    try {
      const res = await fetch(`/api/bookkeeper/transactions/${txn.id}/reconcile`, { method: 'POST' })
      if (!res.ok) throw new Error('Reconcile failed')
    } catch {
      // Rollback
      setTransactions(ts => ts.map(t => t.id === txn.id ? { ...t, reconciliationStatus: prev } : t))
    }
  }, [])

  // Approve a single transaction
  const handleApprove = useCallback(async (txn: BookkeeperTransaction) => {
    const prev = txn.reconciliationStatus
    const prevApproved = txn.approvedAt
    // Optimistic update
    setTransactions(ts => ts.map(t =>
      t.id === txn.id ? { ...t, reconciliationStatus: 'reconciled' as const, approvedAt: new Date().toISOString() } : t
    ))
    try {
      const res = await fetch(`/api/bookkeeper/transactions/${txn.id}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Approve failed')
    } catch {
      // Rollback
      setTransactions(ts => ts.map(t =>
        t.id === txn.id ? { ...t, reconciliationStatus: prev, approvedAt: prevApproved } : t
      ))
    }
  }, [])

  // Bulk approve selected
  const handleBulkApprove = useCallback(async () => {
    if (selected.size === 0) return
    setBulkLoading(true)
    const ids = Array.from(selected)
    const snapshots = new Map<string, { status: BookkeeperTransaction['reconciliationStatus']; approvedAt: string | null }>()

    // Save snapshots + optimistic update
    setTransactions(ts => ts.map(t => {
      if (ids.includes(t.id)) {
        snapshots.set(t.id, { status: t.reconciliationStatus, approvedAt: t.approvedAt })
        return { ...t, reconciliationStatus: 'reconciled' as const, approvedAt: new Date().toISOString() }
      }
      return t
    }))

    const failed: string[] = []
    for (const id of ids) {
      try {
        const res = await fetch(`/api/bookkeeper/transactions/${id}/approve`, { method: 'POST' })
        if (!res.ok) failed.push(id)
      } catch {
        failed.push(id)
      }
    }

    // Rollback failed
    if (failed.length > 0) {
      setTransactions(ts => ts.map(t => {
        if (failed.includes(t.id)) {
          const snap = snapshots.get(t.id)
          if (snap) return { ...t, reconciliationStatus: snap.status, approvedAt: snap.approvedAt }
        }
        return t
      }))
    }

    setSelected(new Set())
    setBulkLoading(false)
  }, [selected])

  // Selection helpers
  const approvableIds = transactions
    .filter(t => t.reconciliationStatus === 'manual_review' || t.reconciliationStatus === 'suggested_match')
    .map(t => t.id)

  const allSelected = approvableIds.length > 0 && approvableIds.every(id => selected.has(id))

  function toggleSelectAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(approvableIds))
    }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-3">
      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-3">
        <BusinessFilter value={business} onChange={setBusiness} />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as StatusFilter)}
          className="text-[12px] bg-transparent border rounded-sm px-2 py-1.5 appearance-none cursor-pointer focus:outline-none focus:border-[#00F5FF]/40"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={(f, t) => { setDateFrom(f); setDateTo(t) }} />

        <AnimatePresence>
          {selected.size > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={handleBulkApprove}
              disabled={bulkLoading}
              className="ml-auto text-[11px] px-3 py-1.5 rounded-sm border font-medium transition-colors disabled:opacity-50"
              style={{
                borderColor: 'rgba(0,245,255,0.3)',
                color: '#00F5FF',
                backgroundColor: 'rgba(0,245,255,0.06)',
              }}
            >
              {bulkLoading ? 'Approving...' : `Approve Selected (${selected.size})`}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {error && (
        <div className="border border-[var(--color-danger)]/20 rounded-sm p-3 text-[12px]" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto border border-[var(--color-border)] rounded-sm">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--surface-card)' }}>
              <th className="px-3 py-2.5 w-8">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded-sm accent-[#00F5FF]"
                  disabled={approvableIds.length === 0}
                />
              </th>
              <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Date</th>
              <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Business</th>
              <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Description</th>
              <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Amount</th>
              <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Status</th>
              <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Confidence</th>
              <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-8 text-center text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                  No transactions matching filters.
                </td>
              </tr>
            ) : (
              transactions.map((txn) => (
                <TransactionRow
                  key={txn.id}
                  txn={txn}
                  isSelected={selected.has(txn.id)}
                  onToggleSelect={() => toggleSelect(txn.id)}
                  onReconcile={() => handleReconcile(txn)}
                  onApprove={() => handleApprove(txn)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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

function TransactionRow({
  txn,
  isSelected,
  onToggleSelect,
  onReconcile,
  onApprove,
}: {
  txn: BookkeeperTransaction
  isSelected: boolean
  onToggleSelect: () => void
  onReconcile: () => void
  onApprove: () => void
}) {
  const isApprovable = txn.reconciliationStatus === 'manual_review' || txn.reconciliationStatus === 'suggested_match'
  const isReconcilable = txn.reconciliationStatus === 'unmatched' || txn.reconciliationStatus === 'suggested_match'
  const confidence = Math.round(txn.confidenceScore * 100)

  return (
    <motion.tr
      layout
      className="border-b border-[var(--color-border)] hover:bg-white/[0.02] transition-colors"
    >
      <td className="px-3 py-2.5 w-8">
        {isApprovable ? (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="rounded-sm accent-[#00F5FF]"
          />
        ) : (
          <span className="block w-3.5" />
        )}
      </td>
      <td className="px-3 py-2.5 tabular-nums whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
        {formatDate(txn.transactionDate)}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: getBusinessColour(txn.businessKey) }}
          />
          <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
            {getBusinessName(txn.businessKey)}
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 max-w-[200px] truncate" style={{ color: 'var(--color-text-primary)' }}>
        {txn.description ?? '--'}
      </td>
      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
        {formatAUD(txn.amountCents)}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={txn.reconciliationStatus} />
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 rounded-sm bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-sm"
              style={{ width: `${confidence}%`, backgroundColor: '#00F5FF' }}
            />
          </div>
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--color-text-disabled)' }}>
            {confidence}%
          </span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          {isReconcilable && (
            <button
              onClick={onReconcile}
              className="text-[11px] px-2 py-0.5 rounded-sm border hover:border-[#00F5FF]/40 transition-colors"
              style={{ borderColor: 'var(--color-border)', color: '#00F5FF' }}
            >
              Reconcile
            </button>
          )}
          {txn.reconciliationStatus === 'manual_review' && (
            <button
              onClick={onApprove}
              className="text-[11px] px-2 py-0.5 rounded-sm border hover:border-[#00F5FF]/40 transition-colors"
              style={{ borderColor: 'var(--color-border)', color: '#00F5FF' }}
            >
              Approve
            </button>
          )}
        </div>
      </td>
    </motion.tr>
  )
}
