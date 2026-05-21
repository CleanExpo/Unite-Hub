'use client'

import { useState, useEffect } from 'react'
import DOMPurify from 'dompurify'
import type { FullThread } from '@/lib/integrations/google'
import { ReplyComposer } from './ReplyComposer'

interface Props {
  threadId: string
  account: string
  onArchive: () => void
  onDelete: () => void
  onClose: () => void
}

export function ThreadViewer({ threadId, account, onArchive, onDelete, onClose }: Props) {
  const [thread, setThread] = useState<FullThread | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showReply, setShowReply] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setShowReply(false)
    fetch(`/api/email/threads/${threadId}?account=${encodeURIComponent(account)}`)
      .then(r => r.json())
      .then((data: FullThread & { error?: string }) => {
        if (data.error) throw new Error(data.error)
        setThread(data)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [threadId, account])

  async function doAction(action: string, extraPayload?: Record<string, string>) {
    setActionLoading(true)
    try {
      await fetch(`/api/email/threads/${threadId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account, action, ...extraPayload }),
      })
      if (action === 'archive') onArchive()
      if (action === 'delete') onDelete()
    } finally {
      setActionLoading(false)
    }
  }

  const lastMessage = thread?.messages[thread.messages.length - 1]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0">
        {thread && (
          <h2 className="text-sm font-medium text-white/90 truncate flex-1 mr-4">{thread.subject}</h2>
        )}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowReply(v => !v)}
            className="text-xs border border-white/20 px-3 py-1 rounded-sm text-white/60 hover:text-white hover:border-white/40 transition-colors"
          >
            Reply
          </button>
          <button
            onClick={() => doAction('archive')}
            disabled={actionLoading}
            title="Archive"
            className="text-xs border border-white/20 px-3 py-1 rounded-sm text-white/60 hover:text-white hover:border-white/40 transition-colors disabled:opacity-40"
          >
            Archive
          </button>
          <button
            onClick={() => doAction('delete')}
            disabled={actionLoading}
            title="Move to Trash"
            className="text-xs border border-red-500/30 px-3 py-1 rounded-sm text-red-400 hover:text-red-300 hover:border-red-500/60 transition-colors disabled:opacity-40"
          >
            Delete
          </button>
          <button
            onClick={onClose}
            className="text-white/30 hover:text-white/60 transition-colors text-lg leading-none ml-1"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="flex items-center justify-center h-full">
            <span className="text-sm text-white/30">Loading…</span>
          </div>
        )}

        {error && (
          <div className="p-4 text-red-400 text-sm">{error}</div>
        )}

        {thread && (
          <div className="divide-y divide-white/[0.04]">
            {thread.messages.map((msg, i) => (
              <div key={msg.id} className="p-4">
                {/* Message meta */}
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="text-xs text-white/70 font-medium">{msg.from}</p>
                    <p className="text-[10px] text-white/30 mt-0.5">To: {msg.to}</p>
                  </div>
                  <span className="text-[10px] text-white/30 flex-shrink-0">{msg.date}</span>
                </div>
                {/* Message body — DOMPurify sanitises before iframe injection; sandbox="" blocks scripts */}
                {msg.bodyHtml ? (
                  <iframe
                    srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;font-size:14px;color:#ccc;background:#0a0a0a;margin:0;padding:12px}a{color:#00F5FF}</style></head><body>${DOMPurify.sanitize(msg.bodyHtml, { FORCE_BODY: true })}</body></html>`}
                    sandbox=""
                    className="w-full min-h-[200px] border-0 rounded-sm bg-zinc-900"
                    style={{ height: i === thread.messages.length - 1 ? '400px' : '200px' }}
                    title={`Message ${msg.id}`}
                  />
                ) : (
                  <pre className="text-xs text-white/50 whitespace-pre-wrap break-words">
                    {msg.bodyText ?? '(no content)'}
                  </pre>
                )}
                {/* Attachments */}
                {msg.attachments.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {msg.attachments.map((att, j) => (
                      <span key={j} className="text-[10px] bg-zinc-800 text-white/50 px-2 py-1 rounded-sm">
                        📎 {att.filename} ({(att.size / 1024).toFixed(0)} KB)
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply composer */}
      {showReply && lastMessage && thread && (
        <div className="flex-shrink-0">
          <ReplyComposer
            threadId={threadId}
            account={account}
            defaultTo={lastMessage.from}
            defaultSubject={thread.subject}
            inReplyToMessageId={lastMessage.id}
            onSent={() => setShowReply(false)}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}
    </div>
  )
}
