'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { BUSINESSES } from '@/lib/businesses'

interface VaultAddEntryProps {
  onClose: () => void
  onAdded: () => void
}

export function VaultAddEntry({ onClose, onAdded }: VaultAddEntryProps) {
  const [businessKey, setBusinessKey] = useState<string>(BUSINESSES[0].key)
  const [label, setLabel] = useState('')
  const [service, setService] = useState('')
  const [username, setUsername] = useState('')
  const [secret, setSecret] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!label.trim() || !service.trim() || !secret.trim()) {
      setError('Label, service and secret value are required')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/vault/entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessKey, label: label.trim(), service: service.trim(), username: username.trim(), secret, notes: notes.trim() }),
      })
      if (!res.ok) {
        const body = await res.json() as { error?: string }
        setError(body.error ?? 'Failed to save entry')
        return
      }
      onAdded()
      onClose()
    } catch {
      setError('Network error — please try again')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = 'w-full px-3 h-9 rounded-sm text-[13px] text-[#f0f0f0] outline-none'
  const inputStyle = { background: 'var(--surface-elevated)', border: '1px solid var(--color-border)' }
  const labelClass = 'text-[11px] font-medium uppercase tracking-wider block mb-1'
  const labelStyle = { color: 'var(--color-text-muted)' }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-20"
      style={{ background: 'rgba(5,5,5,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-sm p-6 flex flex-col gap-5"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plus size={16} strokeWidth={1.5} style={{ color: '#00F5FF' }} />
            <span className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
              New Vault Entry
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-disabled)' }}>
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Business */}
          <div>
            <label className={labelClass} style={labelStyle}>Business</label>
            <select
              value={businessKey}
              onChange={(e) => setBusinessKey(e.target.value)}
              className={inputClass}
              style={inputStyle}
            >
              {BUSINESSES.map(b => (
                <option key={b.key} value={b.key}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Label */}
          <div>
            <label className={labelClass} style={labelStyle}>Label</label>
            <input
              type="text"
              value={label}
              onChange={(e) => { setLabel(e.target.value); setError(null) }}
              placeholder="e.g. Stripe Secret Key"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Service */}
          <div>
            <label className={labelClass} style={labelStyle}>Service</label>
            <input
              type="text"
              value={service}
              onChange={(e) => { setService(e.target.value); setError(null) }}
              placeholder="e.g. stripe"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Username */}
          <div>
            <label className={labelClass} style={labelStyle}>Username / Email (optional)</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. admin@example.com"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Secret */}
          <div>
            <label className={labelClass} style={labelStyle}>Secret Value</label>
            <input
              type="password"
              value={secret}
              onChange={(e) => { setSecret(e.target.value); setError(null) }}
              placeholder="API key, password, token…"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass} style={labelStyle}>Notes (optional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional context"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          {error && (
            <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="h-9 rounded-sm text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
            style={{ background: '#00F5FF18', color: '#00F5FF', border: '1px solid #00F5FF30' }}
          >
            {saving ? 'Saving…' : 'Add Entry'}
          </button>
        </form>
      </div>
    </div>
  )
}
