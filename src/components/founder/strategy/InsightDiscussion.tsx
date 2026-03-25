'use client'

import { useState, useEffect, useRef } from 'react'
import { Send } from 'lucide-react'

interface Comment {
  id: string
  insight_id: string
  author: 'founder' | 'ai'
  content: string
  created_at: string
}

interface InsightDiscussionProps {
  insightId: string
}

export function InsightDiscussion({ insightId }: InsightDiscussionProps) {
  const [comments, setComments] = useState<Comment[]>([])
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/strategy/insights/${insightId}/comments`)
      .then((r) => r.json())
      .then((d: { comments: Comment[] }) => setComments(d.comments ?? []))
      .catch(() => {})
  }, [insightId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  async function submit() {
    if (!text.trim() || submitting) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/strategy/insights/${insightId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text.trim(), author: 'founder' }),
      })
      const d = await res.json() as { comment: Comment }
      if (d.comment) {
        setComments((prev) => [...prev, d.comment])
        setText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
      <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: 'var(--color-text-disabled)' }}>
        Discussion
      </p>

      {comments.length > 0 && (
        <div className="space-y-2 mb-3 max-h-48 overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin' }}>
          {comments.map((c) => (
            <div
              key={c.id}
              className="rounded-sm px-3 py-2 text-[12px] leading-relaxed"
              style={{
                borderLeft: c.author === 'ai' ? '2px solid #00F5FF' : '2px solid var(--color-border)',
                background: 'var(--surface-canvas)',
                color: 'var(--color-text-primary)',
              }}
            >
              <span className="text-[10px] mr-2" style={{ color: 'var(--color-text-disabled)' }}>
                {c.author === 'ai' ? 'AI' : 'You'} ·{' '}
                {new Date(c.created_at).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {c.content}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {comments.length === 0 && (
        <p className="text-[12px] mb-3" style={{ color: 'var(--color-text-disabled)' }}>
          No notes yet. Add your thoughts below.
        </p>
      )}

      <div className="flex gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          placeholder="Add a note… (⌘↵ to send)"
          rows={2}
          className="flex-1 resize-none rounded-sm border px-3 py-2 text-[12px] outline-none"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--surface-canvas)',
            color: 'var(--color-text-primary)',
          }}
        />
        <button
          onClick={submit}
          disabled={!text.trim() || submitting}
          className="px-3 rounded-sm flex items-center transition-colors disabled:opacity-40"
          style={{ background: '#00F5FF', color: '#050505' }}
          aria-label="Send note"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  )
}
