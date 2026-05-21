'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Globe, Layers, Shield, Zap } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { BUSINESSES } from '@/lib/businesses'
import { InsightsBoard } from './InsightsBoard'

type Tab = 'insights' | 'analysis'

const PIPELINE_OPTIONS = [
  { id: 'research-to-brief',   label: 'Research + Brief',      hint: 'Web search → strategic brief. 25–45s.', icon: <Globe size={12} /> },
  { id: 'strategy-to-decision',label: 'Decision Support',       hint: 'Debate + structured CEO decision brief. 30–60s.', icon: <Brain size={12} /> },
  { id: 'competitor-intel',    label: 'Competitor Intel',       hint: 'Research competitor → threat assessment. 25–45s.', icon: <Shield size={12} /> },
  { id: 'synthex-content',     label: 'Synthex Content Batch',  hint: 'Research → LinkedIn, email hooks, blog outline. 20–40s.', icon: <Zap size={12} /> },
]

interface Citation {
  type: string
  title: string
  url?: string
  content?: string
}

interface PipelineStep {
  capabilityId: string
  content: string
  citations: Citation[]
}

export function StrategyRoomClient() {
  const [activeTab, setActiveTab] = useState<Tab>('insights')
  const [prompt, setPrompt] = useState('')
  const [business, setBusiness] = useState<string>('')
  const [researchMode, setResearchMode] = useState(false)
  const [pipelineId, setPipelineId] = useState('research-to-brief')
  const [phase, setPhase] = useState<'idle' | 'researching' | 'analysing'>('idle')

  // Direct mode output
  const [output, setOutput] = useState<string | null>(null)

  // Pipeline mode output
  const [steps, setSteps] = useState<PipelineStep[] | null>(null)
  const [finalOutput, setFinalOutput] = useState<{ content: string; citations: Citation[] } | null>(null)

  const [loading, setLoading] = useState(false)

  function resetOutputs() {
    setOutput(null)
    setSteps(null)
    setFinalOutput(null)
    setPhase('idle')
  }

  async function analyze() {
    if (!prompt.trim() || loading) return

    if (prompt.trim().length > 4000) {
      setOutput('Prompt too long. Please keep it under 4,000 characters.')
      return
    }

    setLoading(true)
    resetOutputs()

    const bizContext = business
      ? `Business: ${BUSINESSES.find(b => b.key === business)?.name}`
      : undefined

    try {
      if (!researchMode) {
        // Direct Opus analysis
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
      } else {
        // Research-first pipeline
        setPhase('researching')
        // After ~8 s (average web-search time), optimistically flip phase label
        const timer = setTimeout(() => setPhase('analysing'), 8000)

        try {
          const res = await fetch('/api/pipeline/run', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              pipelineId,
              seed: prompt,
              businessContext: bizContext,
            }),
          })

          clearTimeout(timer)

          if (!res.ok) {
            const errData = await res.json() as { error?: string }
            setOutput(`Pipeline failed: ${errData.error ?? 'Please try again.'}`)
            return
          }

          const data = await res.json() as {
            steps: PipelineStep[]
            finalOutput: { content: string; citations: Citation[]; model: string; usage: unknown }
          }
          setSteps(data.steps)
          setFinalOutput(data.finalOutput)
        } finally {
          clearTimeout(timer)
        }
      }
    } finally {
      setLoading(false)
      setPhase('idle')
    }
  }

  const activePipeline = PIPELINE_OPTIONS.find(p => p.id === pipelineId) ?? PIPELINE_OPTIONS[0]!
  const buttonLabel = loading
    ? researchMode
      ? phase === 'researching' ? 'Researching…' : 'Analysing…'
      : 'Analysing…'
    : researchMode
      ? `Run: ${activePipeline.label}`
      : 'Analyse with Opus'

  const hintText = researchMode
    ? activePipeline.hint
    : 'Opus is thinking. Extended analysis takes 15–30 seconds.'

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-1 p-0.5 rounded-sm border w-fit" style={{ borderColor: 'var(--color-border)', background: 'var(--surface-canvas)' }}>
        {([
          { id: 'insights', label: 'AI Insights Board', icon: <Layers size={13} /> },
          { id: 'analysis', label: 'Deep Analysis', icon: <Brain size={13} /> },
        ] as const).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[12px] transition-colors"
            style={{
              background: activeTab === tab.id ? 'var(--surface-card)' : 'transparent',
              color: activeTab === tab.id ? 'var(--color-text-primary)' : 'var(--color-text-disabled)',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'insights' && <InsightsBoard />}

      {activeTab === 'analysis' && (
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

      {/* Pipeline mode toggle + selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Switch
            checked={researchMode}
            onCheckedChange={(v) => { setResearchMode(v); resetOutputs() }}
            className="data-[state=checked]:bg-[#00F5FF]"
          />
          <span className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            Pipeline mode
          </span>
        </div>
        {researchMode && (
          <div className="flex flex-wrap gap-1.5">
            {PIPELINE_OPTIONS.map(p => (
              <button
                key={p.id}
                onClick={() => { setPipelineId(p.id); resetOutputs() }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border text-[11px] transition-colors"
                style={{
                  borderColor: pipelineId === p.id ? '#00F5FF' : 'var(--color-border)',
                  background: pipelineId === p.id ? 'rgba(0,245,255,0.06)' : 'var(--surface-card)',
                  color: pipelineId === p.id ? '#00F5FF' : 'var(--color-text-muted)',
                }}
                title={p.hint}
              >
                {p.icon}
                {p.label}
              </button>
            ))}
          </div>
        )}
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
        {researchMode ? <Globe size={14} /> : <Brain size={14} />}
        {buttonLabel}
      </button>

      {loading && (
        <p className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
          {hintText}
        </p>
      )}

      {/* Direct mode output */}
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

      {/* Pipeline mode output */}
      {steps && finalOutput && (
        <div className="space-y-4">
          {/* Step 1 — Research */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-sm border p-5"
            style={{ borderColor: 'var(--color-border)', background: 'var(--surface-card)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Globe size={13} style={{ color: 'var(--color-text-muted)' }} />
              <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--color-text-muted)' }}>
                Web Research
              </span>
            </div>
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--color-text-primary)' }}>
              {steps[0]?.content}
            </div>
            {steps[0]?.citations?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-white/5">
                <p className="text-[11px] uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-disabled)' }}>Sources</p>
                <ul className="space-y-0.5">
                  {steps[0].citations.map((c, i) => (
                    <li key={i}>
                      {c.url ? (
                        <a href={c.url} target="_blank" rel="noopener noreferrer"
                          className="text-[11px] underline" style={{ color: 'var(--color-text-muted)' }}>
                          {c.title}
                        </a>
                      ) : (
                        <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>{c.title}</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>

          {/* Step 2 — Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-sm border p-5"
            style={{ borderColor: 'rgba(0,245,255,0.2)', background: 'var(--surface-card)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Brain size={13} style={{ color: 'rgba(0,245,255,0.6)' }} />
              <span className="text-[11px] uppercase tracking-widest" style={{ color: 'rgba(0,245,255,0.6)' }}>
                Strategic Analysis
              </span>
            </div>
            <div className="text-[13px] leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--color-text-primary)' }}>
              {finalOutput.content}
            </div>
          </motion.div>
        </div>
      )}
    </div>
      )}
    </div>
  )
}
