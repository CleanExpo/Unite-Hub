'use client'

import { useState } from 'react'

interface Props {
  threadId: string
  account: string
  defaultTo: string
  defaultSubject: string
  inReplyToMessageId?: string
  onSent: () => void
  onCancel: () => void
}

export function ReplyComposer({ threadId, account, defaultTo, defaultSubject, inReplyToMessageId, onSent, onCancel }: Props) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!body.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch(`/api/email/threads/${threadId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account,
          action: 'reply',
          to: defaultTo,
          subject: defaultSubject.startsWith('Re:') ? defaultSubject : `Re: ${defaultSubject}`,
          body,
          inReplyToMessageId,
        }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Send failed')
        return
      }
      onSent()
    } catch {
      setError('Network error — check connection')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-t border-white/[0.06] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-white/40">
          Reply to <span className="text-white/60">{defaultTo}</span>
        </p>
        <button onClick={onCancel} className="text-xs text-white/30 hover:text-white/60 transition-colors">
          Cancel
        </button>
      </div>
      <textarea
        value={body}
        onChange={e => setBody(e.target.value)}
        placeholder="Write your reply…"
        rows={5}
        autoFocus
        className="w-full bg-zinc-900 border border-zinc-700 rounded-sm px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-[#00F5FF] focus:outline-none resize-none"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex justify-end">
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="text-xs bg-[#00F5FF] text-black px-4 py-1.5 rounded-sm font-medium hover:opacity-80 disabled:opacity-40 transition-opacity"
        >
          {sending ? 'Sending…' : 'Send Reply'}
        </button>
      </div>
    </div>
  )
}
