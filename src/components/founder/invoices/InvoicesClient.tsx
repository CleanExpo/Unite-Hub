'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, ExternalLink, CheckCircle, Loader2, RefreshCw, ChevronDown } from 'lucide-react'

// ── Businesses that have Xero connected ───────────────────────────────────────
const XERO_BUSINESSES = [
  { key: 'dr',   label: 'Disaster Recovery' },
  { key: 'nrpg', label: 'NRPG' },
  { key: 'carsi', label: 'Carsi' },
  { key: 'ccw',  label: 'CCW' },
]

// ── Types ─────────────────────────────────────────────────────────────────────
interface LineItem {
  description: string
  quantity: number
  unitAmount: number
  accountCode: string
}

interface XeroInvoice {
  InvoiceID: string
  InvoiceNumber: string
  Contact: { Name: string }
  Status: 'DRAFT' | 'AUTHORISED' | 'SUBMITTED' | 'PAID' | 'VOIDED'
  DateString?: string
  DueDateString?: string
  Total: number
  CurrencyCode: string
  Url?: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatAUD(cents: number): string {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD' }).format(cents)
}

function parseXeroDate(val?: string): string {
  if (!val) return '—'
  const ts = val.replace(/\/Date\((\d+)([+-]\d+)?\)\//, '$1')
  const d = new Date(Number(ts))
  return isNaN(d.getTime()) ? val : d.toLocaleDateString('en-AU')
}

function StatusBadge({ status }: { status: XeroInvoice['Status'] }) {
  const map: Record<XeroInvoice['Status'], { bg: string; label: string }> = {
    DRAFT:      { bg: 'rgba(255,255,255,0.08)', label: 'Draft' },
    AUTHORISED: { bg: 'rgba(0,245,255,0.15)',   label: 'Authorised' },
    SUBMITTED:  { bg: 'rgba(255,198,0,0.15)',    label: 'Submitted' },
    PAID:       { bg: 'rgba(0,200,100,0.15)',    label: 'Paid' },
    VOIDED:     { bg: 'rgba(255,80,80,0.15)',    label: 'Voided' },
  }
  const { bg, label } = map[status] ?? map.DRAFT
  return (
    <span className="px-2 py-0.5 rounded-sm text-[11px] font-medium" style={{ background: bg }}>
      {label}
    </span>
  )
}

// ── Line item row (inside create panel) ───────────────────────────────────────
function LineItemRow({
  item,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  item: LineItem
  index: number
  onChange: (i: number, field: keyof LineItem, value: string | number) => void
  onRemove: (i: number) => void
  canRemove: boolean
}) {
  return (
    <div className="grid grid-cols-[1fr_60px_90px_80px_32px] gap-2 items-center">
      <input
        className="bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-[12px] text-[#f0f0f0] placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40"
        placeholder="Description"
        value={item.description}
        onChange={(e) => onChange(index, 'description', e.target.value)}
      />
      <input
        type="number"
        min={1}
        className="bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-[12px] text-[#f0f0f0] text-right focus:outline-none focus:border-[#00F5FF]/40"
        placeholder="Qty"
        value={item.quantity}
        onChange={(e) => onChange(index, 'quantity', parseFloat(e.target.value) || 1)}
      />
      <input
        type="number"
        min={0}
        step={0.01}
        className="bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-[12px] text-[#f0f0f0] text-right focus:outline-none focus:border-[#00F5FF]/40"
        placeholder="Unit $"
        value={item.unitAmount}
        onChange={(e) => onChange(index, 'unitAmount', parseFloat(e.target.value) || 0)}
      />
      <input
        className="bg-white/5 border border-white/10 rounded-sm px-2 py-1.5 text-[12px] text-[#f0f0f0] focus:outline-none focus:border-[#00F5FF]/40"
        placeholder="Code"
        value={item.accountCode}
        onChange={(e) => onChange(index, 'accountCode', e.target.value)}
      />
      {canRemove ? (
        <button
          onClick={() => onRemove(index)}
          className="text-white/30 hover:text-red-400 transition-colors"
        >
          <X size={14} />
        </button>
      ) : (
        <span />
      )}
    </div>
  )
}

// ── Create invoice panel ──────────────────────────────────────────────────────
function CreateInvoicePanel({
  business,
  onCreated,
  onClose,
}: {
  business: string
  onCreated: () => void
  onClose: () => void
}) {
  const [contactName, setContactName] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [reference, setReference] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: '', quantity: 1, unitAmount: 0, accountCode: '200' },
  ])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const updateItem = (i: number, field: keyof LineItem, value: string | number) => {
    setLineItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  const addItem = () => {
    setLineItems((prev) => [...prev, { description: '', quantity: 1, unitAmount: 0, accountCode: '200' }])
  }

  const removeItem = (i: number) => {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i))
  }

  const total = lineItems.reduce((sum, item) => sum + item.quantity * item.unitAmount, 0)

  async function handleSubmit() {
    setError('')
    if (!contactName.trim()) { setError('Contact name is required'); return }
    if (!dueDate) { setError('Due date is required'); return }
    if (lineItems.every((l) => !l.description.trim())) { setError('At least one line item is required'); return }

    setSaving(true)
    try {
      const res = await fetch(`/api/xero/invoices?business=${business}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactName, dueDate, reference, lineItems }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create invoice')
      }
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="mb-6 rounded-sm border p-5"
      style={{ background: 'rgba(0,245,255,0.03)', borderColor: 'rgba(0,245,255,0.2)' }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-medium text-[#f0f0f0]">New Invoice (Draft)</h3>
        <button onClick={onClose} className="text-white/30 hover:text-white/60 transition-colors">
          <X size={16} />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="col-span-1">
          <label className="block text-[11px] text-white/50 mb-1">Contact *</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-[12px] text-[#f0f0f0] placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40"
            placeholder="Client name"
            value={contactName}
            onChange={(e) => setContactName(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] text-white/50 mb-1">Due Date *</label>
          <input
            type="date"
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-[12px] text-[#f0f0f0] focus:outline-none focus:border-[#00F5FF]/40"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] text-white/50 mb-1">Reference</label>
          <input
            className="w-full bg-white/5 border border-white/10 rounded-sm px-3 py-1.5 text-[12px] text-[#f0f0f0] placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40"
            placeholder="INV-001"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
          />
        </div>
      </div>

      {/* Line items header */}
      <div className="grid grid-cols-[1fr_60px_90px_80px_32px] gap-2 mb-1.5 px-0">
        {['Description', 'Qty', 'Unit $', 'Code', ''].map((h) => (
          <span key={h} className="text-[10px] text-white/30 font-medium uppercase tracking-wide">{h}</span>
        ))}
      </div>

      <div className="space-y-2 mb-3">
        {lineItems.map((item, i) => (
          <LineItemRow
            key={i}
            item={item}
            index={i}
            onChange={updateItem}
            onRemove={removeItem}
            canRemove={lineItems.length > 1}
          />
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <button
          onClick={addItem}
          className="text-[11px] text-white/40 hover:text-[#00F5FF] transition-colors flex items-center gap-1"
        >
          <Plus size={12} /> Add line
        </button>
        <div className="text-[13px] font-medium" style={{ color: '#00F5FF' }}>
          Total: {formatAUD(total)}
        </div>
      </div>

      {error && (
        <p className="text-red-400/80 text-[12px] mb-3">{error}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-sm text-[12px] font-medium transition-opacity disabled:opacity-50"
        style={{ background: '#00F5FF', color: '#050505' }}
      >
        {saving ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
        {saving ? 'Creating…' : 'Create Draft Invoice'}
      </button>
    </div>
  )
}

// ── Invoice row ───────────────────────────────────────────────────────────────
function InvoiceRow({
  invoice,
  business,
  onApproved,
}: {
  invoice: XeroInvoice
  business: string
  onApproved: (id: string) => void
}) {
  const [approving, setApproving] = useState(false)
  const [error, setError] = useState('')

  async function handleApprove() {
    setApproving(true)
    setError('')
    try {
      const res = await fetch(`/api/xero/invoices/${invoice.InvoiceID}/approve?business=${business}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to approve')
      }
      onApproved(invoice.InvoiceID)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setApproving(false)
    }
  }

  return (
    <tr className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
      <td className="py-3 px-4 text-[12px] text-white/60">{invoice.InvoiceNumber || '—'}</td>
      <td className="py-3 px-4 text-[12px] text-[#f0f0f0]">{invoice.Contact?.Name ?? '—'}</td>
      <td className="py-3 px-4 text-[12px] text-white/60">{parseXeroDate(invoice.DateString)}</td>
      <td className="py-3 px-4 text-[12px] text-white/60">{parseXeroDate(invoice.DueDateString)}</td>
      <td className="py-3 px-4 text-[12px] text-right font-medium text-[#f0f0f0]">
        {formatAUD(invoice.Total ?? 0)}
      </td>
      <td className="py-3 px-4">
        <StatusBadge status={invoice.Status} />
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          {invoice.Status === 'DRAFT' && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="flex items-center gap-1 px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all disabled:opacity-50"
              style={{ background: 'rgba(0,245,255,0.12)', color: '#00F5FF' }}
            >
              {approving ? <Loader2 size={11} className="animate-spin" /> : <CheckCircle size={11} />}
              {approving ? 'Approving…' : 'Approve'}
            </button>
          )}
          {invoice.Url && (
            <a
              href={invoice.Url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/30 hover:text-white/60 transition-colors"
              title="Open in Xero"
            >
              <ExternalLink size={13} />
            </a>
          )}
        </div>
        {error && <p className="text-red-400/70 text-[10px] mt-1">{error}</p>}
      </td>
    </tr>
  )
}

// ── Main client component ─────────────────────────────────────────────────────
export function InvoicesClient() {
  const [business, setBusiness] = useState('dr')
  const [invoices, setInvoices] = useState<XeroInvoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'ALL' | XeroInvoice['Status']>('ALL')

  const loadInvoices = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/xero/invoices?business=${business}&type=ACCREC`)
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to load invoices')
      }
      const data = await res.json()
      // Xero returns { invoices: [...] } or { Invoices: [...] }
      const list = data.invoices ?? data.Invoices ?? []
      setInvoices(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [business])

  useEffect(() => { loadInvoices() }, [loadInvoices])

  function handleApproved(id: string) {
    setInvoices((prev) =>
      prev.map((inv) => inv.InvoiceID === id ? { ...inv, Status: 'AUTHORISED' } : inv)
    )
  }

  const filtered = filterStatus === 'ALL'
    ? invoices
    : invoices.filter((inv) => inv.Status === filterStatus)

  const STATUS_OPTIONS: Array<'ALL' | XeroInvoice['Status']> = ['ALL', 'DRAFT', 'AUTHORISED', 'PAID', 'VOIDED']

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 mb-6">
        {/* Business selector */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={business}
              onChange={(e) => setBusiness(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-sm pl-3 pr-8 py-1.5 text-[12px] text-[#f0f0f0] focus:outline-none focus:border-[#00F5FF]/40 cursor-pointer"
            >
              {XERO_BUSINESSES.map((b) => (
                <option key={b.key} value={b.key} style={{ background: '#111' }}>
                  {b.label}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none" />
          </div>

          {/* Status filter */}
          <div className="flex items-center gap-1">
            {STATUS_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className="px-2.5 py-1 rounded-sm text-[11px] font-medium transition-all"
                style={{
                  background: filterStatus === s ? 'rgba(0,245,255,0.15)' : 'rgba(255,255,255,0.05)',
                  color: filterStatus === s ? '#00F5FF' : 'rgba(255,255,255,0.4)',
                }}
              >
                {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={loadInvoices}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] transition-colors border border-white/10 text-white/50 hover:text-white/80 hover:border-white/20 disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] font-medium transition-all"
            style={{ background: '#00F5FF', color: '#050505' }}
          >
            <Plus size={13} />
            New Invoice
          </button>
        </div>
      </div>

      {/* Create panel */}
      {showCreate && (
        <CreateInvoicePanel
          business={business}
          onCreated={loadInvoices}
          onClose={() => setShowCreate(false)}
        />
      )}

      {/* Error state */}
      {error && (
        <div
          className="mb-4 px-4 py-3 rounded-sm text-[12px] text-red-400/80 border"
          style={{ background: 'rgba(255,80,80,0.05)', borderColor: 'rgba(255,80,80,0.2)' }}
        >
          {error}
        </div>
      )}

      {/* Invoice table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-white/30">
          <Loader2 size={20} className="animate-spin mr-2" />
          <span className="text-[13px]">Loading invoices…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-white/30">
          <p className="text-[13px]">No invoices found</p>
          {filterStatus !== 'ALL' && (
            <button
              onClick={() => setFilterStatus('ALL')}
              className="mt-2 text-[11px] text-[#00F5FF]/60 hover:text-[#00F5FF] transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-sm border border-white/8 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/8" style={{ background: 'rgba(255,255,255,0.02)' }}>
                {['Number', 'Contact', 'Date', 'Due', 'Total', 'Status', 'Actions'].map((h) => (
                  <th
                    key={h}
                    className="py-2.5 px-4 text-left text-[10px] font-medium uppercase tracking-wide text-white/30"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <InvoiceRow
                  key={inv.InvoiceID}
                  invoice={inv}
                  business={business}
                  onApproved={handleApproved}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filtered.length > 0 && (
        <p className="mt-3 text-[11px] text-white/25 text-right">
          {filtered.length} invoice{filtered.length !== 1 ? 's' : ''}
          {filterStatus !== 'ALL' ? ` (${filterStatus.toLowerCase()})` : ''}
        </p>
      )}
    </div>
  )
}
