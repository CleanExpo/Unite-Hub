'use client'

import { useState, useEffect } from 'react'
import { Plus, CheckCircle2, Circle, XCircle } from 'lucide-react'
import { BUSINESSES } from '@/lib/businesses'

interface Decision {
  id: string
  title: string
  type: string
  rationale: string | null
  amount_aud: number | null
  deadline: string | null
  status: 'open' | 'decided' | 'completed' | 'cancelled'
  business_key: string | null
  created_at: string
}

const TYPE_COLORS: Record<string, string> = {
  strategic: '#00F5FF',
  budget: '#22c55e',
  timeline: '#f97316',
  shipping: '#a855f7',
  hiring: '#eab308',
}

const STATUS_ICONS = {
  open: <Circle size={12} style={{ color: '#f97316' }} />,
  decided: <Circle size={12} style={{ color: '#00F5FF' }} />,
  completed: <CheckCircle2 size={12} style={{ color: '#22c55e' }} />,
  cancelled: <XCircle size={12} style={{ color: '#6b7280' }} />,
}

const NEXT_STATUS: Record<string, string> = {
  open: 'decided',
  decided: 'completed',
}

export function DecisionLog() {
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)

  // Form state
  const [form, setForm] = useState({ title: '', type: 'strategic', rationale: '', amount_aud: '', deadline: '', business_key: '' })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    void load()
  }, [filterStatus])

  async function load() {
    setLoading(true)
    try {
      const params = filterStatus ? `?status=${filterStatus}` : ''
      const res = await fetch(`/api/boardroom/decisions${params}`)
      const d = await res.json() as { decisions: Decision[] }
      setDecisions(d.decisions ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function createDecision() {
    if (!form.title.trim() || submitting) return
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/boardroom/decisions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          rationale: form.rationale || undefined,
          amount_aud: form.amount_aud ? parseFloat(form.amount_aud) : undefined,
          deadline: form.deadline || undefined,
          business_key: form.business_key || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json() as { error?: string }
        setFormError(d.error ?? `Save failed (${res.status})`)
        return
      }
      setForm({ title: '', type: 'strategic', rationale: '', amount_aud: '', deadline: '', business_key: '' })
      setShowForm(false)
      await load()
    } finally {
      setSubmitting(false)
    }
  }

  async function advance(id: string, current: string) {
    const next = NEXT_STATUS[current]
    if (!next) return
    await fetch(`/api/boardroom/decisions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    await load()
  }

  const visible = decisions.filter((d) => !filterStatus || d.status === filterStatus)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {([null, 'open', 'decided', 'completed'] as const).map((s) => (
          <button
            key={String(s)}
            onClick={() => setFilterStatus(s)}
            className="text-[11px] px-3 py-1 rounded-sm border transition-colors"
            style={{
              borderColor: filterStatus === s ? '#00F5FF' : 'var(--color-border)',
              color: filterStatus === s ? '#e2e8f0' : 'var(--color-text-muted)',
              background: 'var(--surface-card)',
            }}
          >
            {s === null ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
        <button
          onClick={() => setShowForm((v) => !v)}
          className="ml-auto flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-sm transition-colors"
          style={{ background: '#00F5FF', color: '#050505' }}
        >
          <Plus size={11} />
          New Decision
        </button>
      </div>

      {/* Add form */}
      {showForm && (
        <div className="rounded-sm border p-4 space-y-3" style={{ borderColor: 'rgba(0,245,255,0.2)', background: 'var(--surface-card)' }}>
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Decision title *"
            className="w-full h-8 px-3 rounded-sm border text-[12px] outline-none"
            style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="h-8 px-3 rounded-sm border text-[12px] outline-none bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {['strategic', 'budget', 'timeline', 'shipping', 'hiring'].map((t) => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
            <select
              value={form.business_key}
              onChange={(e) => setForm((f) => ({ ...f, business_key: e.target.value }))}
              className="h-8 px-3 rounded-sm border text-[12px] outline-none bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              <option value="">All businesses</option>
              {BUSINESSES.map((b) => <option key={b.key} value={b.key}>{b.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.amount_aud}
              onChange={(e) => setForm((f) => ({ ...f, amount_aud: e.target.value }))}
              placeholder="AUD amount (optional)"
              type="number"
              className="h-8 px-3 rounded-sm border text-[12px] outline-none"
              style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
            />
            <input
              value={form.deadline}
              onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
              type="date"
              className="h-8 px-3 rounded-sm border text-[12px] outline-none bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <textarea
            value={form.rationale}
            onChange={(e) => setForm((f) => ({ ...f, rationale: e.target.value }))}
            placeholder="Rationale (optional)"
            rows={2}
            className="w-full resize-none rounded-sm border px-3 py-2 text-[12px] outline-none"
            style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
          />
          {formError && (
            <p className="text-[11px] px-2 py-1 rounded-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>{formError}</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => void createDecision()}
              disabled={!form.title.trim() || submitting}
              className="px-4 h-8 rounded-sm text-[12px] font-medium disabled:opacity-40"
              style={{ background: '#00F5FF', color: '#050505' }}
            >
              Save Decision
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 h-8 rounded-sm text-[12px] border" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Decision list */}
      {loading && <p className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>Loading…</p>}
      {!loading && visible.length === 0 && (
        <p className="text-[12px] py-6 text-center" style={{ color: 'var(--color-text-disabled)' }}>No decisions yet. Record your first strategic decision.</p>
      )}
      <div className="space-y-2">
        {visible.map((d) => {
          const typeColor = TYPE_COLORS[d.type] ?? '#6b7280'
          const biz = BUSINESSES.find((b) => b.key === d.business_key)
          return (
            <div
              key={d.id}
              className="rounded-sm border px-4 py-3 flex items-start gap-3"
              style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)', borderLeft: `3px solid ${typeColor}` }}
            >
              <div className="pt-0.5">{STATUS_ICONS[d.status]}</div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{d.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm border" style={{ color: typeColor, borderColor: `${typeColor}40` }}>{d.type}</span>
                  {biz && <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>{biz.name}</span>}
                  {d.amount_aud && <span className="text-[10px]" style={{ color: '#22c55e' }}>AUD ${d.amount_aud.toLocaleString('en-AU')}</span>}
                  {d.deadline && <span className="text-[10px]" style={{ color: d.deadline < new Date().toISOString().split('T')[0] ? '#ef4444' : 'var(--color-text-disabled)' }}>Due {new Date(d.deadline + 'T00:00:00').toLocaleDateString('en-AU')}</span>}
                </div>
                {d.rationale && <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>{d.rationale}</p>}
              </div>
              {NEXT_STATUS[d.status] && (
                <button onClick={() => void advance(d.id, d.status)} className="text-[10px] px-2 py-1 rounded-sm border flex-shrink-0" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-disabled)' }}>
                  → {NEXT_STATUS[d.status]}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
