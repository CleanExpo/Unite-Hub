'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { BUSINESSES } from '@/lib/businesses'
import { EXPERIMENT_TYPES } from '@/lib/experiments/types'
import type { BusinessKey } from '@/lib/businesses'
import type { ExperimentType, GenerateExperimentResponse } from '@/lib/experiments/types'

function formatType(type: string): string {
  return type
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

interface Props {
  onClose: () => void
}

type Phase = 'input' | 'loading' | 'result'

export function SynthexGeneratorPanel({ onClose }: Props) {
  const [phase, setPhase] = useState<Phase>('input')
  const [businessKey, setBusinessKey] = useState<BusinessKey>(BUSINESSES[0].key)
  const [experimentType, setExperimentType] = useState<ExperimentType | ''>('')
  const [focusArea, setFocusArea] = useState('')
  const [result, setResult] = useState<GenerateExperimentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function handleGenerate() {
    setPhase('loading')
    setError(null)

    try {
      const res = await fetch('/api/experiments/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessKey,
          experimentType: experimentType || undefined,
          focusArea: focusArea.trim() || undefined,
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || 'Generation failed')
      }

      const data = (await res.json()) as GenerateExperimentResponse
      setResult(data)
      setPhase('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setPhase('input')
    }
  }

  async function handleAccept() {
    if (!result) return
    setCreating(true)
    setError(null)

    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessKey,
          ...result,
          generatedBy: 'synthex_ai',
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || 'Failed to create experiment')
      }

      // Reload to show the new experiment
      window.location.reload()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      setCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.7)' }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-sm border p-6 space-y-5"
        style={{
          background: 'var(--surface-card)',
          borderColor: 'var(--color-border)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <X size={16} />
        </button>

        <h2
          className="text-base font-medium"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Generate Experiment
        </h2>

        {error && (
          <div
            className="text-[11px] px-3 py-2 rounded-sm border"
            style={{
              background: 'rgba(239,68,68,0.1)',
              borderColor: 'rgba(239,68,68,0.3)',
              color: '#ef4444',
            }}
          >
            {error}
          </div>
        )}

        {/* Input phase */}
        {phase === 'input' && (
          <div className="space-y-4">
            {/* Business selector */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] uppercase tracking-[0.15em] block"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                Business
              </label>
              <select
                value={businessKey}
                onChange={(e) => setBusinessKey(e.target.value as BusinessKey)}
                className="w-full text-[11px] px-3 py-2 rounded-sm border bg-transparent outline-none"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--surface-card)',
                }}
              >
                {BUSINESSES.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Experiment type */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] uppercase tracking-[0.15em] block"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                Experiment Type (optional)
              </label>
              <select
                value={experimentType}
                onChange={(e) => setExperimentType(e.target.value as ExperimentType | '')}
                className="w-full text-[11px] px-3 py-2 rounded-sm border bg-transparent outline-none"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--surface-card)',
                }}
              >
                <option value="">Auto-detect</option>
                {EXPERIMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {formatType(t)}
                  </option>
                ))}
              </select>
            </div>

            {/* Focus area */}
            <div className="space-y-1.5">
              <label
                className="text-[10px] uppercase tracking-[0.15em] block"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                Focus Area (optional)
              </label>
              <input
                type="text"
                value={focusArea}
                onChange={(e) => setFocusArea(e.target.value)}
                placeholder="e.g. increase insurance leads"
                className="w-full text-[11px] px-3 py-2 rounded-sm border bg-transparent outline-none"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-primary)',
                  background: 'var(--surface-card)',
                }}
              />
            </div>

            <button
              onClick={handleGenerate}
              className="w-full px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors"
            >
              Generate
            </button>
          </div>
        )}

        {/* Loading phase */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Loader2
              size={24}
              className="animate-spin"
              style={{ color: '#00F5FF' }}
            />
            <span
              className="text-[11px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Synthex is designing your experiment...
            </span>
          </div>
        )}

        {/* Result phase */}
        {phase === 'result' && result && (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3
                className="text-[13px] font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {result.title}
              </h3>

              <div className="space-y-1.5">
                <span
                  className="text-[10px] uppercase tracking-[0.15em] block"
                  style={{ color: 'var(--color-text-disabled)' }}
                >
                  Hypothesis
                </span>
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {result.hypothesis}
                </p>
              </div>

              <div className="space-y-1.5">
                <span
                  className="text-[10px] uppercase tracking-[0.15em] block"
                  style={{ color: 'var(--color-text-disabled)' }}
                >
                  Rationale
                </span>
                <p
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {result.aiRationale}
                </p>
              </div>
            </div>

            {/* Variant previews */}
            <div className="space-y-2">
              <span
                className="text-[10px] uppercase tracking-[0.15em] block"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                Variants ({result.variants.length})
              </span>
              {result.variants.map((v) => (
                <div
                  key={v.variantKey}
                  className="border rounded-sm p-3 space-y-1"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'rgba(255,255,255,0.02)',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider"
                      style={{
                        background: 'rgba(0,245,255,0.15)',
                        color: '#00F5FF',
                      }}
                    >
                      {v.variantKey}
                    </span>
                    <span
                      className="text-[11px] font-medium"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {v.label}
                    </span>
                    {v.isControl && (
                      <span
                        className="text-[10px] px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider"
                        style={{
                          background: 'rgba(153,153,153,0.15)',
                          color: '#999999',
                        }}
                      >
                        Control
                      </span>
                    )}
                  </div>
                  <p
                    className="text-[11px] line-clamp-2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {v.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleAccept}
                disabled={creating}
                className="flex-1 px-4 py-2 text-[10px] uppercase tracking-[0.15em] rounded-sm transition-colors disabled:opacity-50"
                style={{
                  background: '#00F5FF',
                  color: '#050505',
                  fontWeight: 600,
                }}
              >
                {creating ? 'Creating...' : 'Accept & Create'}
              </button>
              <button
                onClick={handleGenerate}
                disabled={creating}
                className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors disabled:opacity-50"
              >
                Regenerate
              </button>
              <button
                onClick={onClose}
                disabled={creating}
                className="px-4 py-2 text-[10px] uppercase tracking-[0.15em] rounded-sm transition-colors disabled:opacity-50"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
