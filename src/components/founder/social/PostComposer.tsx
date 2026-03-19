'use client'

import { useState } from 'react'
import type { SocialChannel, SocialPlatform, CreatePostInput } from '@/lib/integrations/social/types'
import { BUSINESSES } from '@/lib/businesses'

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
  youtube: 'YouTube',
}

const CHARACTER_OPTIONS = [
  { key: 'none' as const, label: 'Brand Voice', description: 'Standard tone' },
  { key: 'female' as const, label: 'Ada', description: 'Female character' },
  { key: 'male' as const, label: 'Jax', description: 'Male character' },
]

interface Props {
  channels: SocialChannel[]
  onClose: () => void
  onCreated: () => void
}

export function PostComposer({ channels, onClose, onCreated }: Props) {
  const connectedPlatforms = [...new Set(channels.filter(c => c.isConnected).map(c => c.platform))] as SocialPlatform[]
  const allPlatforms = [...new Set(channels.map(c => c.platform))] as SocialPlatform[]
  const displayPlatforms = allPlatforms.length > 0 ? allPlatforms : (Object.keys(PLATFORM_LABELS) as SocialPlatform[])

  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(connectedPlatforms)
  const [businessKey, setBusinessKey] = useState<string>(BUSINESSES[0].key)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // AI Generate state
  const [showAI, setShowAI] = useState(false)
  const [aiTopic, setAiTopic] = useState('')
  const [aiCharacter, setAiCharacter] = useState<'male' | 'female' | 'none'>('none')
  const [aiPlatform, setAiPlatform] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [variants, setVariants] = useState<Array<{ title: string; body: string; hashtags: string[]; cta: string | null; platform?: string | null }>>([])

  function togglePlatform(p: SocialPlatform) {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function handleGenerate() {
    setGenerating(true)
    setError('')
    try {
      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessKey,
          contentType: 'social_post',
          platform: aiPlatform || undefined,
          topic: aiTopic || undefined,
          characterPreference: aiCharacter,
          count: 3,
        }),
      })
      if (!res.ok) {
        const j = await res.json() as { error?: string }
        setError(j.error ?? 'Generation failed')
        return
      }
      const data = await res.json() as { results: Array<{ title: string; body: string; hashtags: string[]; cta: string | null; platform: string | null }> }
      setVariants(data.results)
    } catch {
      setError('Failed to generate content')
    } finally {
      setGenerating(false)
    }
  }

  function selectVariant(v: typeof variants[number]) {
    let newContent = v.body
    if (v.hashtags.length > 0) {
      newContent += '\n\n' + v.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')
    }
    setContent(newContent)
    // Auto-select platform if the variant specifies one
    if (v.platform && connectedPlatforms.includes(v.platform as SocialPlatform)) {
      setSelectedPlatforms([v.platform as SocialPlatform])
    }
    setVariants([])
    setShowAI(false)
  }

  async function handleSubmit(action: 'draft' | 'schedule' | 'publish') {
    if (!content.trim()) { setError('Content is required'); return }
    if (action !== 'draft' && !selectedPlatforms.length) { setError('Select at least one platform'); return }
    if (action === 'schedule' && !scheduledAt) { setError('Schedule date/time required'); return }

    setSaving(true)
    setError('')

    const body: CreatePostInput = {
      businessKey,
      content: content.trim(),
      platforms: selectedPlatforms,
      scheduledAt: action === 'schedule' ? new Date(scheduledAt).toISOString() : null,
    }

    const res = await fetch('/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const j = await res.json() as { error?: string }
      setError(j.error ?? 'Failed to save post')
      setSaving(false)
      return
    }

    if (action === 'publish') {
      const { post } = await res.json() as { post: { id: string } }
      await fetch(`/api/social/publish/${post.id}`, { method: 'POST' })
    }

    onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#0A0A0A] rounded-sm w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        style={{ border: '1px solid var(--color-border-strong)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-light" style={{ color: 'var(--color-text-primary)' }}>New Post</h2>
          <button onClick={onClose} className="hover:text-[#999999] text-lg" style={{ color: 'var(--color-text-muted)' }}>{'\u00D7'}</button>
        </div>

        {/* Business selector */}
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Business</label>
          <select
            value={businessKey}
            onChange={e => setBusinessKey(e.target.value)}
            className="w-full rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#00F5FF]/30"
            style={{ background: 'var(--surface-elevated)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {BUSINESSES.map(b => <option key={b.key} value={b.key}>{b.name}</option>)}
          </select>
        </div>

        {/* AI Generate section */}
        <div
          className="rounded-sm overflow-hidden"
          style={{ border: '1px solid', borderColor: showAI ? 'rgba(0, 245, 255, 0.25)' : 'var(--color-border)' }}
        >
          <button
            onClick={() => setShowAI(!showAI)}
            className="w-full flex items-center justify-between px-3 py-2 text-[10px] uppercase tracking-wider transition-colors"
            style={{
              background: showAI ? 'rgba(0, 245, 255, 0.05)' : 'var(--surface-card)',
              color: showAI ? '#00F5FF' : 'var(--color-text-secondary)',
            }}
          >
            <span className="flex items-center gap-2">
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M8 1L10 5.5L15 6.5L11.5 10L12.5 15L8 12.5L3.5 15L4.5 10L1 6.5L6 5.5L8 1Z" fill="currentColor" opacity="0.7" />
              </svg>
              Generate with AI
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 10 10"
              fill="currentColor"
              className="transition-transform"
              style={{ transform: showAI ? 'rotate(180deg)' : 'rotate(0deg)' }}
            >
              <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
            </svg>
          </button>

          {showAI && (
            <div className="px-3 py-3 space-y-3" style={{ background: 'var(--surface-card)' }}>
              {/* Topic input */}
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Topic (optional)</label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={e => setAiTopic(e.target.value)}
                  placeholder="e.g. Summer road safety tips"
                  className="w-full rounded-sm px-3 py-1.5 text-xs placeholder:text-[#888888] focus:outline-none focus:border-[#00F5FF]/30"
                  style={{ background: 'var(--surface-elevated)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>

              {/* Character selector */}
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Character</label>
                <div className="flex gap-2">
                  {CHARACTER_OPTIONS.map(c => (
                    <button
                      key={c.key}
                      onClick={() => setAiCharacter(c.key)}
                      className={`flex-1 px-2 py-1.5 text-[10px] rounded-sm border transition-colors ${
                        aiCharacter === c.key
                          ? 'border-[#00F5FF]/40 text-[#00F5FF] bg-[#00F5FF]/5'
                          : 'hover:border-[rgba(255,255,255,0.18)]'
                      }`}
                      style={aiCharacter === c.key ? undefined : { background: 'var(--surface-elevated)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                      <span className="block font-medium">{c.label}</span>
                      <span className="block opacity-70 text-[10px]">{c.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Platform focus */}
              <div>
                <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Platform Focus</label>
                <select
                  value={aiPlatform}
                  onChange={e => setAiPlatform(e.target.value)}
                  className="w-full rounded-sm px-3 py-1.5 text-xs focus:outline-none focus:border-[#00F5FF]/30"
                  style={{ background: 'var(--surface-elevated)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                >
                  <option value="">Multi-platform</option>
                  {connectedPlatforms.map(p => (
                    <option key={p} value={p}>{PLATFORM_LABELS[p]}</option>
                  ))}
                </select>
              </div>

              {/* Generate button */}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="w-full py-2 text-[10px] uppercase tracking-wider rounded-sm transition-all disabled:opacity-50"
                style={{
                  background: generating ? 'rgba(0, 245, 255, 0.1)' : 'linear-gradient(135deg, #00F5FF, #00C4CC)',
                  color: generating ? '#00F5FF' : '#050505',
                  boxShadow: generating ? 'none' : '0 0 20px rgba(0, 245, 255, 0.15)',
                  fontWeight: 600,
                }}
              >
                {generating ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-3 h-3 rounded-sm border-2 border-[#00F5FF]/30 border-t-[#00F5FF] animate-spin" />
                    Generating...
                  </span>
                ) : (
                  'Generate'
                )}
              </button>

              {/* Variant cards */}
              {variants.length > 0 && (
                <div className="space-y-2 pt-1">
                  <label className="text-[10px] uppercase tracking-wider block" style={{ color: 'var(--color-text-secondary)' }}>Select a variant</label>
                  {variants.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => selectVariant(v)}
                      className="w-full text-left rounded-sm px-3 py-2.5 transition-all hover:border-[#00F5FF]/40 group"
                      style={{
                        background: 'var(--surface-elevated)',
                        borderWidth: '1px',
                        borderStyle: 'solid',
                        borderColor: 'var(--color-border)',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(0, 245, 255, 0.4)'
                        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 0 12px rgba(0, 245, 255, 0.08)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--color-border)'
                        ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {v.title}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                          {v.platform ? PLATFORM_LABELS[v.platform as SocialPlatform] ?? v.platform : 'Multi'}
                        </span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
                        {v.body.length > 100 ? v.body.slice(0, 100) + '...' : v.body}
                      </p>
                      {v.hashtags.length > 0 && (
                        <p className="text-[10px] mt-1 opacity-80" style={{ color: '#00F5FF' }}>
                          {v.hashtags.slice(0, 4).map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="What do you want to share?"
            className="w-full rounded-sm px-3 py-2 text-sm placeholder:text-[#888888] focus:outline-none focus:border-[#00F5FF]/30 resize-none"
            style={{ background: 'var(--surface-elevated)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <p className="text-[10px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>{content.length} chars</p>
        </div>

        {/* Platform selector */}
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-2" style={{ color: 'var(--color-text-secondary)' }}>Platforms</label>
          <div className="flex flex-wrap gap-2">
            {displayPlatforms.map(p => {
              const isConnected = connectedPlatforms.includes(p)
              const isSelected = selectedPlatforms.includes(p)
              return (
                <button
                  key={p}
                  onClick={() => togglePlatform(p)}
                  className={`px-3 py-1 text-[10px] rounded-sm border transition-colors ${
                    isSelected
                      ? 'border-[#00F5FF]/40 text-[#00F5FF] bg-[#00F5FF]/5'
                      : 'hover:border-[rgba(255,255,255,0.18)]'
                  }`}
                  style={isSelected ? undefined : { background: 'var(--surface-card)', borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                  title={isConnected ? undefined : 'Not connected — post will be saved as draft only'}
                >
                  {PLATFORM_LABELS[p]}{!isConnected && <span className="ml-1 opacity-70">·</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="text-[10px] uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Schedule (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="w-full rounded-sm px-3 py-2 text-sm focus:outline-none focus:border-[#00F5FF]/30"
            style={{ background: 'var(--surface-elevated)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="px-4 py-2 text-[10px] uppercase tracking-wider rounded-sm hover:border-[rgba(255,255,255,0.12)] transition-colors disabled:opacity-50"
            style={{ color: 'var(--color-text-secondary)', borderWidth: '1px', borderStyle: 'solid', borderColor: 'var(--color-border)' }}
          >
            Save Draft
          </button>
          {scheduledAt ? (
            <button
              onClick={() => handleSubmit('schedule')}
              disabled={saving}
              className="px-4 py-2 text-[10px] uppercase tracking-wider text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm hover:bg-[#00F5FF]/5 transition-colors disabled:opacity-50"
            >
              {saving ? 'Scheduling...' : 'Schedule'}
            </button>
          ) : (
            <button
              onClick={() => handleSubmit('publish')}
              disabled={saving || connectedPlatforms.length === 0}
              className="px-4 py-2 text-[10px] uppercase tracking-wider text-[#050505] bg-[#00F5FF] rounded-sm hover:bg-[#00F5FF]/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Publishing...' : 'Post Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
