'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { BusinessFilter } from '../shared/BusinessFilter'
import { formatAUD } from '../shared/formatters'
import type { BusinessKey } from '@/lib/businesses'
import type { BookkeeperTransaction, TransactionsResponse } from '@/lib/bookkeeper/types'

/** Revenue tax codes — income-side */
const REVENUE_TAX_CODES = new Set(['OUTPUT', 'EXEMPTOUTPUT', 'EXEMPTEXPORT'])
/** Expense tax codes — cost-side */
const EXPENSE_TAX_CODES = new Set(['INPUT', 'EXEMPTINPUT', 'INPUTTAXED', 'GSTONIMPORTS'])

interface MonthData {
  month: string
  revenue: number
  expenses: number
}

/** Format month label as "MMM YY" */
function monthLabel(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`
}

/** Build last-12-months buckets */
function buildMonthBuckets(): Map<string, MonthData> {
  const buckets = new Map<string, MonthData>()
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    buckets.set(key, { month: monthLabel(d), revenue: 0, expenses: 0 })
  }
  return buckets
}

function bucketKey(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

/** YAxis tick: cents -> $Xk */
function formatAxisTick(cents: number): string {
  const abs = Math.abs(cents)
  if (abs >= 100_000_00) return `$${(cents / 100_000_00).toFixed(0)}M`
  if (abs >= 1_000_00) return `$${(cents / 1_000_00).toFixed(0)}k`
  return `$${(cents / 100).toFixed(0)}`
}

/** Custom tooltip matching Scientific Luxury theme */
function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-sm border p-3" style={{ backgroundColor: '#0a0a0a', borderColor: 'var(--color-border)' }}>
      <p className="text-[11px] text-white/60 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-[12px]" style={{ color: p.color }}>
          {p.dataKey === 'revenue' ? 'Revenue' : 'Expenses'}: {formatAUD(p.value)}
        </p>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm p-4 animate-pulse">
      <div className="h-[320px] flex items-end gap-3 px-8 pb-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex gap-1 items-end">
            <div className="w-1/2 bg-white/5 rounded-sm" style={{ height: `${40 + Math.random() * 200}px` }} />
            <div className="w-1/2 bg-white/5 rounded-sm" style={{ height: `${30 + Math.random() * 150}px` }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function PLTab() {
  const [transactions, setTransactions] = useState<BookkeeperTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [business, setBusiness] = useState<BusinessKey | 'all'>('all')
  const [mounted, setMounted] = useState(false)

  // SSR guard — recharts cannot render server-side
  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchData = useCallback(async (biz: BusinessKey | 'all') => {
    setLoading(true)
    setError(null)
    try {
      // Fetch last 12 months of transactions
      const now = new Date()
      const from = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString().split('T')[0]
      const to = now.toISOString().split('T')[0]
      const params = new URLSearchParams({ from, to, pageSize: '5000' })
      if (biz !== 'all') params.set('business', biz)
      const res = await fetch(`/api/bookkeeper/transactions?${params}`)
      if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.status}`)
      const json = (await res.json()) as TransactionsResponse
      setTransactions(json.transactions)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchData(business)
  }, [business, fetchData])

  // Aggregate by month
  const chartData = useMemo(() => {
    const buckets = buildMonthBuckets()
    for (const tx of transactions) {
      const key = bucketKey(tx.transactionDate)
      const bucket = buckets.get(key)
      if (!bucket) continue
      const code = (tx.taxCode ?? '').toUpperCase()
      if (tx.amountCents > 0 && REVENUE_TAX_CODES.has(code)) {
        bucket.revenue += tx.amountCents
      } else if (tx.amountCents < 0 && EXPENSE_TAX_CODES.has(code)) {
        bucket.expenses += Math.abs(tx.amountCents)
      } else if (tx.amountCents > 0) {
        // Default positive amounts to revenue
        bucket.revenue += tx.amountCents
      } else if (tx.amountCents < 0) {
        // Default negative amounts to expenses
        bucket.expenses += Math.abs(tx.amountCents)
      }
    }
    return Array.from(buckets.values())
  }, [transactions])

  // Summary totals
  const totals = useMemo(() => {
    const revenue = chartData.reduce((sum, d) => sum + d.revenue, 0)
    const expenses = chartData.reduce((sum, d) => sum + d.expenses, 0)
    return { revenue, expenses, net: revenue - expenses }
  }, [chartData])

  const handleBusinessChange = (val: BusinessKey | 'all') => {
    setBusiness(val)
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <BusinessFilter value={business} onChange={handleBusinessChange} />
      </div>

      {/* Error */}
      {error && (
        <div className="border border-[var(--color-danger)]/20 rounded-sm p-4 text-[13px]" style={{ color: 'var(--color-danger)' }}>
          {error}
        </div>
      )}

      {/* Chart */}
      {!error && (
        <>
          {loading || !mounted ? (
            <ChartSkeleton />
          ) : transactions.length === 0 ? (
            <div className="border border-[var(--color-border)] rounded-sm p-8 text-center">
              <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                No transaction data for P&amp;L chart.
              </p>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm p-4"
            >
              <p className="text-[11px] uppercase tracking-wide mb-4" style={{ color: 'var(--color-text-disabled)' }}>
                Revenue vs Expenses (12 months)
              </p>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData} barGap={2}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="month"
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={formatAxisTick}
                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                    width={50}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="revenue" fill="#00F5FF" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expenses" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {/* Summary row */}
          {!loading && mounted && transactions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex gap-6 flex-wrap"
            >
              <div className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm px-4 py-3 flex-1 min-w-[140px]">
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-disabled)' }}>
                  Total Revenue
                </p>
                <p className="text-[18px] font-semibold tabular-nums" style={{ color: '#00F5FF' }}>
                  {formatAUD(totals.revenue)}
                </p>
              </div>
              <div className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm px-4 py-3 flex-1 min-w-[140px]">
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-disabled)' }}>
                  Total Expenses
                </p>
                <p className="text-[18px] font-semibold tabular-nums" style={{ color: '#ef4444' }}>
                  {formatAUD(totals.expenses)}
                </p>
              </div>
              <div className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm px-4 py-3 flex-1 min-w-[140px]">
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-disabled)' }}>
                  Net Profit
                </p>
                <p
                  className="text-[18px] font-semibold tabular-nums"
                  style={{ color: totals.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  {totals.net < 0 ? '-' : ''}{formatAUD(Math.abs(totals.net))}
                </p>
              </div>
              <div className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm px-4 py-3 flex-1 min-w-[140px]">
                <p className="text-[10px] uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-disabled)' }}>
                  GST Position
                </p>
                <p className="text-[13px] tabular-nums" style={{ color: 'var(--color-text-secondary)' }}>
                  See BAS tab
                </p>
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  )
}
