'use client'

import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { BUSINESSES } from '@/lib/businesses'

export function NewCaseTab() {
  const [title, setTitle] = useState('')
  const [scenario, setScenario] = useState('')
  const [businessKey, setBusinessKey] = useState<string>(BUSINESSES[0]?.key ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!title.trim() || !scenario.trim()) {
      setError('Title and scenario are required')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/advisory/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), scenario: scenario.trim(), businessKey }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create case')
      }

      const created = await res.json()
      router.replace(pathname + '?tab=live&case=' + created.id, { scroll: false })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      {/* Business selector */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
          Business
        </label>
        <select
          value={businessKey}
          onChange={(e) => setBusinessKey(e.target.value)}
          className="w-full h-9 px-3 rounded-sm text-[13px]"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          {BUSINESSES.map((b) => (
            <option key={b.key} value={b.key}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Title */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
          Case Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. FY2026 Tax Optimisation Strategy"
          className="w-full h-9 px-3 rounded-sm text-[13px]"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Scenario */}
      <div>
        <label className="text-[11px] font-medium uppercase tracking-wider mb-1 block" style={{ color: 'var(--color-text-muted)' }}>
          Scenario
        </label>
        <textarea
          value={scenario}
          onChange={(e) => setScenario(e.target.value)}
          placeholder="Describe your situation. E.g. 'I run a software consultancy with $450K revenue, 2 employees, currently structured as a sole trader. Looking to minimise tax for FY2026 while maximising cash reserves for growth.'"
          rows={6}
          className="w-full px-3 py-2 rounded-sm text-[13px] resize-none"
          style={{
            background: 'var(--surface-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-disabled)' }}>
          Financial data from Xero and bookkeeper will be automatically attached.
        </p>
      </div>

      {error && (
        <p className="text-[12px]" style={{ color: '#ef4444' }}>{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="text-[12px] font-medium px-4 py-2 rounded-sm transition-colors disabled:opacity-50"
        style={{
          background: '#00F5FF18',
          color: '#00F5FF',
          border: '1px solid #00F5FF30',
        }}
      >
        {submitting ? 'Creating...' : 'Create Case & Start Debate'}
      </button>
    </form>
  )
}
