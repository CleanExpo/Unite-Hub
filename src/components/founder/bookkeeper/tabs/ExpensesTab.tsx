'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BusinessFilter } from '../shared/BusinessFilter'
import { DateRangeFilter } from '../shared/DateRangeFilter'
import { formatAUD, formatDate } from '../shared/formatters'
import { BUSINESSES, type BusinessKey } from '@/lib/businesses'
import type { BookkeeperTransaction, TransactionsResponse } from '@/lib/bookkeeper/types'

const PAGE_SIZE = 25

/** Category pill with muted colour coding */
function CategoryBadge({ category }: { category: string }) {
  // Deterministic colour from category string
  const hue = Array.from(category).reduce((h, c) => h + c.charCodeAt(0), 0) % 360
  const bg = `hsla(${hue}, 40%, 50%, 0.08)`
  const border = `hsla(${hue}, 40%, 50%, 0.2)`
  const color = `hsla(${hue}, 40%, 65%, 1)`

  return (
    <span
      className="text-[10px] font-medium tracking-wide px-2 py-0.5 rounded-sm whitespace-nowrap"
      style={{ color, backgroundColor: bg, border: `1px solid ${border}` }}
    >
      {category}
    </span>
  )
}

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--color-border)]">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3 bg-white/5 rounded-sm animate-pulse" style={{ width: `${40 + i * 14}px` }} />
        </td>
      ))}
    </tr>
  )
}

function SkeletonSummary() {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm p-4 animate-pulse">
      <div className="h-3 w-32 bg-white/5 rounded-sm mb-3" />
      <div className="h-6 w-24 bg-white/5 rounded-sm mb-4" />
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <div className="h-3 w-28 bg-white/5 rounded-sm" />
            <div className="h-3 w-16 bg-white/5 rounded-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}

function getBusinessColour(key: BusinessKey): string {
  return BUSINESSES.find(b => b.key === key)?.color ?? '#888'
}

function getBusinessName(key: BusinessKey): string {
  return BUSINESSES.find(b => b.key === key)?.name ?? key
}

function getDefaultDateRange(): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0]
  const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()).toISOString().split('T')[0]
  return { from, to }
}

export function ExpensesTab() {
  const defaults = getDefaultDateRange()
  const [transactions, setTransactions] = useState<BookkeeperTransaction[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [business, setBusiness] = useState<BusinessKey | 'all'>('all')
  const [from, setFrom] = useState(defaults.from)
  const [to, setTo] = useState(defaults.to)
  const [page, setPage] = useState(1)

  const fetchData = useCallback(async (biz: BusinessKey | 'all', dateFrom: string, dateTo: string, pg: number) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        deductible: 'true',
        from: dateFrom,
        to: dateTo,
        page: String(pg),
        pageSize: String(PAGE_SIZE),
      })
      if (biz !== 'all') params.set('business', biz)
      const res = await fetch(`/api/bookkeeper/transactions?${params}`)
      if (!res.ok) throw new Error(`Failed to fetch expenses: ${res.status}`)
      const json = (await res.json()) as TransactionsResponse
      setTransactions(json.transactions)
      setTotal(json.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData(business, from, to, page)
  }, [business, from, to, page, fetchData])

  // Category breakdown from current page (summary is indicative of visible data)
  const categoryBreakdown = useMemo(() => {
    const map = new Map<string, { count: number; totalCents: number }>()
    for (const tx of transactions) {
      const cat = tx.deductionCategory ?? 'Uncategorised'
      const existing = map.get(cat) ?? { count: 0, totalCents: 0 }
      existing.count += 1
      existing.totalCents += Math.abs(tx.amountCents)
      map.set(cat, existing)
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1].totalCents - a[1].totalCents)
  }, [transactions])

  const totalDeductibleCents = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + Math.abs(tx.amountCents), 0)
  }, [transactions])

  // Sorted by date descending
  const sorted = useMemo(() => {
    return [...transactions].sort((a, b) =>
      new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
    )
  }, [transactions])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const handleDateChange = (newFrom: string, newTo: string) => {
    setFrom(newFrom)
    setTo(newTo)
    setPage(1)
  }

  const handleBusinessChange = (val: BusinessKey | 'all') => {
    setBusiness(val)
    setPage(1)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <BusinessFilter value={business} onChange={handleBusinessChange} />
        <DateRangeFilter from={from} to={to} onChange={handleDateChange} />
      </div>

      {/* Summary card */}
      {loading ? (
        <SkeletonSummary />
      ) : error ? null : (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-disabled)' }}>
              Total Deductible
            </span>
            <span className="text-[20px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
              {formatAUD(totalDeductibleCents)}
            </span>
          </div>
          {categoryBreakdown.length > 0 && (
            <div className="border-t border-[var(--color-border)] pt-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-disabled)' }}>
                Category Breakdown
              </p>
              {categoryBreakdown.map(([cat, data]) => (
                <div key={cat} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={cat} />
                    <span className="text-[11px] tabular-nums" style={{ color: 'var(--color-text-disabled)' }}>
                      {data.count} item{data.count !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-[12px] font-medium tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                    {formatAUD(data.totalCents)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Error */}
      {error && (
        <div className="border border-[var(--color-danger)]/20 rounded-sm p-4 text-[13px]" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="overflow-x-auto border border-[var(--color-border)] rounded-sm">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b border-[var(--color-border)]" style={{ backgroundColor: 'var(--surface-card)' }}>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Date</th>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Business</th>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Description</th>
                <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Amount</th>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Category</th>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Tax Code</th>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                    No deductible expenses found for this period.
                  </td>
                </tr>
              ) : (
                sorted.map((tx) => (
                  <motion.tr
                    key={tx.id}
                    layout
                    className="border-b border-[var(--color-border)] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-3 py-2.5 tabular-nums whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(tx.transactionDate)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: getBusinessColour(tx.businessKey) }}
                        />
                        <span className="text-[11px] whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                          {getBusinessName(tx.businessKey)}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 max-w-[200px] truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {tx.description ?? '--'}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                      {formatAUD(Math.abs(tx.amountCents))}
                    </td>
                    <td className="px-3 py-2.5">
                      {tx.deductionCategory ? (
                        <CategoryBadge category={tx.deductionCategory} />
                      ) : (
                        <span style={{ color: 'var(--color-text-disabled)' }}>--</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {tx.taxCode ?? '--'}
                    </td>
                    <td className="px-3 py-2.5 max-w-[160px] truncate text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
                      {tx.deductionNotes ?? '--'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
            Page {page} of {totalPages} ({total} total)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="text-[11px] px-2.5 py-1 border rounded-sm transition-colors disabled:opacity-30"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="text-[11px] px-2.5 py-1 border rounded-sm transition-colors disabled:opacity-30"
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
