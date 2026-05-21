'use client'

import { useState, useEffect } from 'react'
import { Send, ExternalLink, Plus } from 'lucide-react'
import { BUSINESSES, type BusinessKey } from '@/lib/businesses'

interface Dispatch {
  id: string
  business_key: string
  title: string
  description: string | null
  priority: number
  type: string
  deadline: string | null
  linear_issue_id: string | null
  linear_issue_url: string | null
  status: string
  created_at: string
}

const PRIORITY_OPTIONS = [
  { value: 1, label: 'Urgent' },
  { value: 2, label: 'High' },
  { value: 3, label: 'Normal' },
  { value: 4, label: 'Low' },
]

const TYPE_OPTIONS = ['task', 'feature', 'bug', 'research', 'content', 'strategy']

const PRIORITY_COLOURS: Record<number, string> = {
  1: '#ef4444',
  2: '#f97316',
  3: '#00F5FF',
  4: '#808080',
}

const STATUS_COLOURS: Record<string, string> = {
  dispatched:    '#00F5FF',
  in_progress:   '#f97316',
  completed:     '#22c55e',
  cancelled:     '#808080',
  linear_failed: '#ef4444',
}

const ownedBusinesses = BUSINESSES.filter(b => b.type === 'owned')

export function DispatchPanel() {
  const [dispatches, setDispatches] = useState<Dispatch[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterBiz, setFilterBiz] = useState<string | null>(null)

  const [form, setForm] = useState<{
    businessKey: BusinessKey | ''
    title: string
    description: string
    priority: number
    type: string
    deadline: string
  }>({
    businessKey: ownedBusinesses[0]?.key ?? '',
    title: '',
    description: '',
    priority: 3,
    type: 'task',
    deadline: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [lastDispatched, setLastDispatched] = useState<{ title: string; url?: string } | null>(null)

  useEffect(() => {
    void load()
  }, [filterBiz])

  async function load() {
    setLoading(true)
    try {
      const params = filterBiz ? `?businessKey=${filterBiz}` : ''
      const res = await fetch(`/api/satellites/dispatch${params}`)
      const d = await res.json() as { dispatches?: Dispatch[]; error?: string }
      if (!res.ok) { console.error('[DispatchPanel]', d.error); return }
      setDispatches(d.dispatches ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function handleDispatch() {
    if (!form.title.trim() || submitting) return
    setSubmitting(true)
    setFormError(null)
    try {
      const res = await fetch('/api/satellites/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessKey:  form.businessKey,
          title:        form.title.trim(),
          description:  form.description.trim() || undefined,
          priority:     form.priority,
          type:         form.type,
          deadline:     form.deadline || undefined,
        }),
      })
      const body = await res.json() as { dispatch?: Dispatch; linearIssueUrl?: string; warning?: string; error?: string }
      if (!res.ok) {
        setFormError(body.error ?? `Dispatch failed (${res.status})`)
        return
      }
      if (body.dispatch) {
        setDispatches(prev => [body.dispatch!, ...prev])
      }
      setLastDispatched({ title: form.title, url: body.linearIssueUrl })
      setForm(f => ({ ...f, title: '', description: '', deadline: '' }))
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const biz = (key: string) => BUSINESSES.find(b => b.key === key)

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterBiz(null)}
          className="text-[11px] px-3 py-1 rounded-sm border transition-colors"
          style={{
            borderColor: filterBiz === null ? '#00F5FF' : 'var(--color-border)',
            color: filterBiz === null ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
            background: 'var(--surface-card)',
          }}
        >
          All
        </button>
        {ownedBusinesses.map(b => (
          <button
            key={b.key}
            onClick={() => setFilterBiz(b.key)}
            className="text-[11px] px-3 py-1 rounded-sm border transition-colors flex items-center gap-1.5"
            style={{
              borderColor: filterBiz === b.key ? b.color : 'var(--color-border)',
              color: filterBiz === b.key ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
              background: 'var(--surface-card)',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-sm flex-shrink-0" style={{ background: b.color }} />
            {b.name}
          </button>
        ))}
        <button
          onClick={() => setShowForm(v => !v)}
          className="ml-auto flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-sm"
          style={{ background: '#00F5FF', color: '#050505' }}
        >
          <Plus size={11} />
          Dispatch Work
        </button>
      </div>

      {/* Success banner */}
      {lastDispatched && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-sm border text-[12px]" style={{ borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)', color: '#22c55e' }}>
          <span>Dispatched: <strong>{lastDispatched.title}</strong></span>
          {lastDispatched.url && (
            <a href={lastDispatched.url} target="_blank" rel="noopener noreferrer" className="ml-auto flex items-center gap-1 hover:underline">
              Open in Linear <ExternalLink size={10} />
            </a>
          )}
          <button onClick={() => setLastDispatched(null)} className="ml-2 opacity-60 hover:opacity-100">×</button>
        </div>
      )}

      {/* Dispatch form */}
      {showForm && (
        <div className="rounded-sm border p-4 space-y-3" style={{ borderColor: 'rgba(0,245,255,0.2)', background: 'var(--surface-card)' }}>
          <p className="text-[11px] font-medium tracking-widest uppercase" style={{ color: 'var(--color-text-muted)' }}>New Work Package</p>

          <input
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Task title *"
            className="w-full h-8 px-3 rounded-sm border text-[12px] outline-none"
            style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
          />

          <div className="grid grid-cols-3 gap-2">
            <select
              value={form.businessKey}
              onChange={e => setForm(f => ({ ...f, businessKey: e.target.value as BusinessKey }))}
              className="h-8 px-3 rounded-sm border text-[12px] outline-none bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {ownedBusinesses.map(b => <option key={b.key} value={b.key}>{b.name}</option>)}
            </select>
            <select
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
              className="h-8 px-3 rounded-sm border text-[12px] outline-none bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select
              value={form.priority}
              onChange={e => setForm(f => ({ ...f, priority: parseInt(e.target.value) }))}
              className="h-8 px-3 rounded-sm border text-[12px] outline-none bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {PRIORITY_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              value={form.deadline}
              onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
              type="date"
              className="h-8 px-3 rounded-sm border text-[12px] outline-none bg-transparent"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <span className="text-[11px] flex items-center" style={{ color: 'var(--color-text-muted)' }}>
              Deadline (optional)
            </span>
          </div>

          <textarea
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="Context, acceptance criteria, links… (optional)"
            rows={3}
            className="w-full resize-none rounded-sm border px-3 py-2 text-[12px] outline-none"
            style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)', color: 'var(--color-text-primary)' }}
          />

          {formError && (
            <p className="text-[11px] px-2 py-1 rounded-sm" style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)' }}>{formError}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => void handleDispatch()}
              disabled={!form.title.trim() || submitting}
              className="flex items-center gap-1.5 px-4 h-8 rounded-sm text-[12px] font-medium disabled:opacity-40"
              style={{ background: '#00F5FF', color: '#050505' }}
            >
              <Send size={11} />
              {submitting ? 'Dispatching…' : 'Dispatch to Linear'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 h-8 rounded-sm text-[12px] border"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Dispatch list */}
      {loading && (
        <div className="space-y-2 animate-pulse" aria-label="Loading dispatches">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-sm border px-4 py-3 flex items-start gap-3" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)', borderLeft: '3px solid var(--surface-elevated)' }}>
              <div className="flex-1 space-y-2">
                <div className="h-3 rounded-sm w-56" style={{ background: 'var(--surface-elevated)' }} />
                <div className="flex gap-2">
                  <div className="h-2.5 rounded-sm w-16" style={{ background: 'var(--surface-elevated)' }} />
                  <div className="h-2.5 rounded-sm w-24" style={{ background: 'var(--surface-elevated)' }} />
                </div>
              </div>
              <div className="h-6 w-20 rounded-sm flex-shrink-0" style={{ background: 'var(--surface-elevated)' }} />
            </div>
          ))}
        </div>
      )}

      {!loading && dispatches.length === 0 && (
        <p className="text-[12px] py-8 text-center" style={{ color: 'var(--color-text-disabled)' }}>
          No work packages dispatched yet. Use "Dispatch Work" to push a task to a satellite business via Linear.
        </p>
      )}

      <div className="space-y-2">
        {dispatches.map(d => {
          const b = biz(d.business_key)
          const bizColor = b?.color ?? 'var(--color-text-disabled)'
          const priColor = PRIORITY_COLOURS[d.priority] ?? 'var(--color-text-muted)'
          const statusColor = STATUS_COLOURS[d.status] ?? 'var(--color-text-disabled)'
          return (
            <div
              key={d.id}
              className="rounded-sm border px-4 py-3 flex items-start gap-3"
              style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)', borderLeft: `3px solid ${bizColor}` }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-medium" style={{ color: 'var(--color-text-primary)' }}>{d.title}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {b && <span className="text-[10px]" style={{ color: bizColor }}>{b.name}</span>}
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm border" style={{ color: priColor, borderColor: `${priColor}40` }}>
                    {PRIORITY_OPTIONS.find(p => p.value === d.priority)?.label ?? 'Normal'}
                  </span>
                  <span className="text-[10px]" style={{ color: 'var(--color-text-disabled)' }}>{d.type}</span>
                  {d.deadline && <span className="text-[10px]" style={{ color: d.deadline < new Date().toISOString().split('T')[0] ? '#ef4444' : 'var(--color-text-disabled)' }}>Due {new Date(d.deadline + 'T00:00:00').toLocaleDateString('en-AU')}</span>}
                </div>
                {d.description && <p className="text-[11px] mt-1 line-clamp-1" style={{ color: 'var(--color-text-muted)' }}>{d.description}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-[10px] px-1.5 py-0.5 rounded-sm border" style={{ color: statusColor, borderColor: `${statusColor}40` }}>{d.status.replace('_', ' ')}</span>
                {d.linear_issue_url && (
                  <a
                    href={d.linear_issue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded-sm border transition-colors"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-disabled)' }}
                    aria-label="Open in Linear"
                  >
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
