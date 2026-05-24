'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { BusinessFilter } from '../shared/BusinessFilter'
import { formatAUD, formatDate } from '../shared/formatters'
import type { BusinessKey } from '@/lib/businesses'
import type { XeroInvoice } from '@/lib/integrations/xero/types'

function SkeletonRow() {
  return (
    <tr className="border-b border-[var(--color-border)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <td key={i} className="px-3 py-3">
          <div className="h-3 bg-white/5 rounded-sm animate-pulse" style={{ width: `${50 + i * 12}px` }} />
        </td>
      ))}
    </tr>
  )
}

function isOverdue(dueDate: string): boolean {
  return new Date(dueDate).getTime() < Date.now()
}

function BillStatusBadge({ status, dueDate }: { status: string; dueDate: string }) {
  const overdue = status !== 'PAID' && isOverdue(dueDate)
  if (status === 'PAID') {
    return (
      <span
        className="text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm"
        style={{ color: '#00F5FF', backgroundColor: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)' }}
      >
        Paid
      </span>
    )
  }
  if (overdue) {
    return (
      <span
        className="text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm"
        style={{ color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
      >
        Overdue
      </span>
    )
  }
  return (
    <span
      className="text-[10px] font-medium tracking-widest uppercase px-2 py-0.5 rounded-sm"
      style={{ color: '#eab308', backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)' }}
    >
      Awaiting Payment
    </span>
  )
}

/** Xero returns dates as "/Date(...)/" or ISO strings */
function parseXeroDate(raw: string): string {
  const match = raw.match(/\/Date\((\d+)\)\//)
  if (match) return new Date(Number(match[1])).toISOString()
  return raw
}

export function PayablesTab() {
  const [invoices, setInvoices] = useState<XeroInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [business, setBusiness] = useState<BusinessKey | 'all'>('dr')

  const fetchData = useCallback(async (biz: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/xero/invoices?business=${biz}&type=ACCPAY`)
      if (res.status === 503) {
        setError('Xero integration not configured for this business.')
        setInvoices([])
        return
      }
      if (!res.ok) throw new Error(`Failed to fetch payables: ${res.status}`)
      const json = await res.json() as { items: XeroInvoice[] }
      setInvoices(json.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const biz = business === 'all' ? 'dr' : business
    void fetchData(biz)
  }, [business, fetchData])

  // Sort by due date ascending (most urgent first)
  const sorted = useMemo(() => {
    return [...invoices].sort((a, b) => {
      const da = new Date(parseXeroDate(a.DueDate)).getTime()
      const db = new Date(parseXeroDate(b.DueDate)).getTime()
      return da - db
    })
  }, [invoices])

  // Total payable = sum of AmountDue (Xero returns dollars, convert to cents)
  const totalPayableCents = useMemo(() => {
    return sorted.reduce((sum, inv) => sum + Math.round(inv.AmountDue * 100), 0)
  }, [sorted])

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3">
        <BusinessFilter value={business} onChange={setBusiness} />
      </div>

      {/* Summary card */}
      {!loading && !error && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--surface-card)] border border-[var(--color-border)] rounded-sm p-4 flex items-center justify-between"
        >
          <span className="text-[11px] uppercase tracking-wide" style={{ color: 'var(--color-text-disabled)' }}>
            Total Payable
          </span>
          <span className="text-[20px] font-semibold tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
            {formatAUD(totalPayableCents)}
          </span>
        </motion.div>
      )}

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
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Supplier</th>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Bill #</th>
                <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Amount</th>
                <th className="text-right px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Amount Due</th>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Due Date</th>
                <th className="text-left px-3 py-2.5 font-medium" style={{ color: 'var(--color-text-disabled)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : sorted.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
                    No outstanding payables.
                  </td>
                </tr>
              ) : (
                sorted.map((inv) => {
                  const dueDate = parseXeroDate(inv.DueDate)
                  const overdue = inv.Status !== 'PAID' && isOverdue(dueDate)
                  return (
                    <motion.tr
                      key={inv.InvoiceID}
                      layout
                      className="border-b border-[var(--color-border)] hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-3 py-2.5" style={{ color: 'var(--color-text-primary)' }}>
                        {inv.Contact?.Name ?? '--'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                        {inv.InvoiceNumber ?? '--'}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                        {formatAUD(Math.round(inv.Total * 100))}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums" style={{ color: 'var(--color-text-primary)' }}>
                        {formatAUD(Math.round(inv.AmountDue * 100))}
                      </td>
                      <td
                        className="px-3 py-2.5 tabular-nums"
                        style={{ color: overdue ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}
                      >
                        {formatDate(dueDate)}
                      </td>
                      <td className="px-3 py-2.5">
                        <BillStatusBadge status={inv.Status} dueDate={dueDate} />
                      </td>
                    </motion.tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
