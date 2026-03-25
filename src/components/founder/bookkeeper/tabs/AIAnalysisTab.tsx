'use client'

// src/components/founder/bookkeeper/tabs/AIAnalysisTab.tsx
// AI Analysis tab — surfaces the data-analyst capability and bookkeeper-to-advisory
// pipeline directly within the bookkeeper workbench.

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Loader2 } from 'lucide-react'
import { BusinessFilter } from '../shared/BusinessFilter'
import type { BusinessKey } from '@/lib/businesses'
import { BUSINESSES } from '@/lib/businesses'

type Mode = 'analyze' | 'pipeline'
type Phase = 'idle' | 'fetching-data' | 'analysing' | 'advising'

interface SandboxResult {
  output: string
  returnCode: number
  success: boolean
}

interface Citation {
  type: string
  title: string
  url?: string
}

interface PipelineStep {
  capabilityId: string
  content: string
  citations: Citation[]
  sandboxResult?: SandboxResult | null
}

interface AnalyzeResponse {
  answer: string
  sandboxResult?: SandboxResult | null
  citations: Citation[]
}

interface PipelineResponse {
  steps: PipelineStep[]
  finalOutput: { content: string; citations: Citation[] }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const PHASE_LABELS: Record<Phase, string> = {
  idle: 'Run Analysis',
  'fetching-data': 'Fetching data…',
  analysing: 'Analysing…',
  advising: 'Synthesising advisory brief…',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AIAnalysisTab() {
  const [mode, setMode] = useState<Mode>('analyze')
  const [business, setBusiness] = useState<BusinessKey | 'all'>('all')
  const [question, setQuestion] = useState('')
  const [includeData, setIncludeData] = useState(true)
  const [phase, setPhase] = useState<Phase>('idle')

  // Direct mode
  const [answer, setAnswer] = useState<string | null>(null)
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null)
  const [showSandbox, setShowSandbox] = useState(false)

  // Pipeline mode
  const [steps, setSteps] = useState<PipelineStep[] | null>(null)
  const [pipelineFinal, setPipelineFinal] = useState<{ content: string; citations: Citation[] } | null>(null)

  const [error, setError] = useState<string | null>(null)

  const loading = phase !== 'idle'

  function reset() {
    setAnswer(null)
    setSandboxResult(null)
    setShowSandbox(false)
    setSteps(null)
    setPipelineFinal(null)
    setError(null)
    setPhase('idle')
  }

  async function fetchFinancialSnapshot(): Promise<string | undefined> {
    try {
      const [overviewRes, txRes] = await Promise.all([
        fetch('/api/bookkeeper/overview'),
        fetch('/api/bookkeeper/transactions?pageSize=100'),
      ])
      const overview = overviewRes.ok ? await overviewRes.json() : null
      const transactions = txRes.ok ? await txRes.json() : null

      const payload = JSON.stringify({ overview, transactions }, null, 2)
      return payload.slice(0, 15000)
    } catch {
      return undefined
    }
  }

  async function run() {
    if (!question.trim() || loading) return
    reset()

    const bizName = business !== 'all'
      ? BUSINESSES.find(b => b.key === business)?.name
      : undefined

    let dataSnapshot: string | undefined

    if (includeData) {
      setPhase('fetching-data')
      dataSnapshot = await fetchFinancialSnapshot()
    }

    setPhase(mode === 'pipeline' ? 'analysing' : 'analysing')

    try {
      if (mode === 'analyze') {
        const res = await fetch('/api/data/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            question: question.trim(),
            data: dataSnapshot,
            businessContext: bizName,
          }),
        })

        if (!res.ok) {
          const err = await res.json() as { error?: string }
          setError(err.error ?? 'Analysis failed — please try again.')
          return
        }

        const data = await res.json() as AnalyzeResponse
        setAnswer(data.answer)
        if (data.sandboxResult) setSandboxResult(data.sandboxResult)
      } else {
        setPhase('advising')
        const res = await fetch('/api/pipeline/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pipelineId: 'bookkeeper-to-advisory',
            seed: question.trim(),
            data: dataSnapshot,
            businessContext: bizName,
          }),
        })

        if (!res.ok) {
          const err = await res.json() as { error?: string }
          setError(err.error ?? 'Pipeline failed — please try again.')
          return
        }

        const data = await res.json() as PipelineResponse
        setSteps(data.steps)
        setPipelineFinal(data.finalOutput)
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setPhase('idle')
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Brain size={16} style={{ color: '#00F5FF' }} />
        <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--color-text-disabled)' }}>
          AI Financial Analysis
        </span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-1 p-1 rounded-sm" style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}>
        {(['analyze', 'pipeline'] as Mode[]).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset() }}
            className="flex-1 py-1.5 text-[12px] font-medium rounded-sm transition-colors"
            style={mode === m
              ? { background: '#00F5FF', color: '#050505' }
              : { color: 'var(--color-text-secondary)' }}
          >
            {m === 'analyze' ? 'Direct Analysis' : 'Full Advisory Pipeline'}
          </button>
        ))}
      </div>

      {/* Business filter */}
      <BusinessFilter value={business} onChange={setBusiness} />

      {/* Question */}
      <div className="space-y-2">
        <label className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--color-text-disabled)' }}>
          What would you like to analyse?
        </label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          placeholder="e.g. Where are we losing margin compared to last quarter?"
          rows={5}
          className="w-full resize-none rounded-sm border bg-transparent px-3 py-2 text-[13px] outline-none"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>

      {/* Include data toggle */}
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={includeData}
          onChange={e => setIncludeData(e.target.checked)}
          className="rounded-sm accent-[#00F5FF]"
        />
        <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          Include financial snapshot
        </span>
        <span className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
          Attaches last 12 months of transaction data to the prompt
        </span>
      </label>

      {/* Run button */}
      <div className="space-y-1">
        <button
          onClick={run}
          disabled={!question.trim() || loading}
          className="flex items-center gap-2 px-4 h-9 rounded-sm text-[13px] font-medium transition-colors disabled:opacity-40"
          style={{ background: '#00F5FF', color: '#050505' }}
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
          {loading ? PHASE_LABELS[phase] : 'Run Analysis'}
        </button>
        {mode === 'pipeline' && !loading && (
          <p className="text-[11px]" style={{ color: 'var(--color-text-disabled)' }}>
            Pipeline mode: data analysis + advisory brief. Typically 30–60 seconds.
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-sm text-red-400/80">{error}</p>
      )}

      {/* Direct mode results */}
      {answer && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-sm border p-5 space-y-3"
          style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}
        >
          <p className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--color-text-disabled)' }}>
            Analysis
          </p>
          <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
            {answer}
          </div>

          {sandboxResult && (
            <div className="border-t border-white/5 pt-3">
              <button
                onClick={() => setShowSandbox(!showSandbox)}
                className="text-[11px] uppercase tracking-widest flex items-center gap-2"
                style={{ color: 'var(--color-text-disabled)' }}
              >
                {showSandbox ? '▾' : '▸'} Computed Output
              </button>
              {showSandbox && (
                <pre className="mt-2 text-[12px] font-mono p-3 rounded-sm overflow-x-auto"
                  style={{ background: 'rgba(0,0,0,0.4)', color: sandboxResult.success ? '#86efac' : '#f87171' }}>
                  {sandboxResult.output}
                </pre>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Pipeline mode results */}
      {steps && pipelineFinal && (
        <div className="space-y-4">
          {/* Step 1 — Data Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border p-5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}
          >
            <p className="text-[11px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-disabled)' }}>
              Data Analysis
            </p>
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
              {steps[0]?.content}
            </div>
          </motion.div>

          {/* Step 2 — Strategic Advisory */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-sm border p-5"
            style={{ borderColor: 'rgba(0,245,255,0.2)', background: 'var(--surface-card)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} style={{ color: 'rgba(0,245,255,0.6)' }} />
              <p className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(0,245,255,0.6)' }}>
                Strategic Advisory Brief
              </p>
            </div>
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
              {pipelineFinal.content}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
