'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy, Trash2 } from 'lucide-react'

interface VaultEntryProps {
  id: string
  label: string
  username: string
  secret: string
  businessColor: string
  onDelete: (id: string) => void
}

export function VaultEntry({ id, label, username, secret, businessColor, onDelete }: VaultEntryProps) {
  const [revealed, setRevealed] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 800)
    } catch {
      // clipboard unavailable — no feedback
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/vault/entries/${id}`, { method: 'DELETE' })
      if (res.ok || res.status === 204) {
        onDelete(id)
      }
    } catch {
      // silently fail — entry stays in UI
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div
      className="group flex items-center gap-3 h-8 px-3 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span className="shrink-0 rounded-full" style={{ width: 6, height: 6, background: businessColor }} />
      <span className="text-[13px] w-40 truncate" style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
      <span className="text-[12px] w-32 truncate" style={{ color: 'var(--color-text-muted)' }}>{username}</span>
      <span className="flex-1 font-mono text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
        {revealed ? secret : '··········'}
      </span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setRevealed(!revealed)}
          className="transition-colors hover:opacity-100"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label={revealed ? 'Hide' : 'Show'}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={handleCopy}
          className="transition-colors"
          style={{ color: copied ? '#00F5FF' : 'var(--color-text-muted)' }}
          aria-label="Copy"
        >
          <Copy size={14} />
        </button>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="transition-colors hover:text-red-400 disabled:opacity-40"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}
