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

interface Props {
  channels: SocialChannel[]
  onClose: () => void
  onCreated: () => void
}

export function PostComposer({ channels, onClose, onCreated }: Props) {
  const connectedPlatforms = [...new Set(channels.filter(c => c.isConnected).map(c => c.platform))] as SocialPlatform[]

  const [content, setContent] = useState('')
  const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(connectedPlatforms)
  const [businessKey, setBusinessKey] = useState<string>(BUSINESSES[0].key)
  const [scheduledAt, setScheduledAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function togglePlatform(p: SocialPlatform) {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function handleSubmit(action: 'draft' | 'schedule' | 'publish') {
    if (!content.trim()) { setError('Content is required'); return }
    if (!selectedPlatforms.length) { setError('Select at least one platform'); return }
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
        className="bg-[#0A0A0A] border border-white/[0.12] rounded-sm w-full max-w-lg p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-light text-white/80">New Post</h2>
          <button onClick={onClose} className="text-white/30 hover:text-white/60 text-lg">{'\u00D7'}</button>
        </div>

        {/* Business selector */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Business</label>
          <select
            value={businessKey}
            onChange={e => setBusinessKey(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#00F5FF]/30"
          >
            {BUSINESSES.map(b => <option key={b.key} value={b.key}>{b.name}</option>)}
          </select>
        </div>

        {/* Content */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Content</label>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={4}
            placeholder="What do you want to share?"
            className="w-full bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-[#00F5FF]/30 resize-none"
          />
          <p className="text-[10px] text-white/20 mt-1">{content.length} chars</p>
        </div>

        {/* Platform selector */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-2">Platforms</label>
          <div className="flex flex-wrap gap-2">
            {connectedPlatforms.length === 0 ? (
              <p className="text-[11px] text-white/30">No platforms connected yet</p>
            ) : connectedPlatforms.map(p => (
              <button
                key={p}
                onClick={() => togglePlatform(p)}
                className={`px-3 py-1 text-[10px] rounded-sm border transition-colors ${
                  selectedPlatforms.includes(p)
                    ? 'border-[#00F5FF]/40 text-[#00F5FF] bg-[#00F5FF]/5'
                    : 'border-white/10 text-white/40'
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <label className="text-[10px] uppercase tracking-wider text-white/40 block mb-1">Schedule (optional)</label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className="bg-[#111] border border-white/10 rounded-sm px-3 py-2 text-sm text-white/80 focus:outline-none focus:border-[#00F5FF]/30"
          />
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleSubmit('draft')}
            disabled={saving}
            className="px-4 py-2 text-[10px] uppercase tracking-wider text-white/50 border border-white/10 rounded-sm hover:border-white/20 transition-colors disabled:opacity-50"
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
