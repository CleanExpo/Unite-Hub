'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain } from 'lucide-react'
import { BUSINESSES } from '@/lib/businesses'

export function StrategyRoomClient() {
  const [prompt, setPrompt] = useState('')
  const [business, setBusiness] = useState<string>('')
  const [output, setOutput] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function analyze() {
    if (!prompt.trim() || loading) return

    if (prompt.trim().length > 4000) {
      setOutput('Prompt too long. Please keep it under 4,000 characters.')
      return
    }

    setLoading(true)
    setOutput(null)

    try {
      const bizContext = business
        ? `Business: ${BUSINESSES.find(b => b.key === business)?.name}`
        : undefined

      const res = await fetch('/api/strategy/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, businessContext: bizContext }),
      })

      if (!res.ok) {
        const errData = await res.json() as { error?: string }
        setOutput(`Analysis failed: ${errData.error ?? 'Please try again.'}`)
        return
      }

      const data = await res.json() as { output: string }
      setOutput(data.output)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Business selector */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest"
          style={{ color: 'var(--color-text-disabled)' }}>
          Business context (optional)
        </label>
        <select
          value={business}
          onChange={e => setBusiness(e.target.value)}
          className="w-full h-9 px-3 rounded-sm border bg-transparent text-[13px] outline-none"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        >
          <option value="">All businesses</option>
          {BUSINESSES.map(b => (
            <option key={b.key} value={b.key}>{b.name}</option>
          ))}
        </select>
      </div>

      {/* Prompt */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest"
          style={{ color: 'var(--color-text-disabled)' }}>
          Your question or challenge
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="What strategic decision are you thinking through?"
          rows={6}
          className="w-full resize-none rounded-sm border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      <button
        onClick={analyze}
        disabled={!prompt.trim() || loading}
        className="flex items-center gap-2 px-4 h-9 rounded-sm text-[13px] font-medium transition-colors disabled:opacity-40"
        style={{ background: '#00F5FF', color: '#050505' }}
      >
        <Brain size={14} />
        {loading ? 'Analysing\u2026' : 'Analyse with Opus'}
      </button>

      {loading && (
        <p className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
          Opus is thinking. Extended analysis takes 15–30 seconds.
        </p>
      )}

      {output && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-sm border p-6"
          style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}
        >
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap"
            style={{ color: 'var(--color-text-primary)' }}>
            {output}
          </div>
        </motion.div>
      )}
    </div>
  )
}
