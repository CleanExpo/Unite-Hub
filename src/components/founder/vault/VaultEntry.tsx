'use client'

import { useState } from 'react'
import { Eye, EyeOff, Copy, Trash2 } from 'lucide-react'

interface VaultEntryProps {
  id: string
  label: string
  username: string
  businessColor: string
  onDelete: (id: string) => void
}

export function VaultEntry({ id, label, username, businessColor, onDelete }: VaultEntryProps) {
  const [revealed, setRevealed] = useState(false)
  const [secret, setSecret] = useState<string | null>(null)
  const [revealing, setRevealing] = useState(false)
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleReveal() {
    if (revealed) {
      setRevealed(false)
      return
    }
    if (secret !== null) {
      setRevealed(true)
      return
    }
    setRevealing(true)
    try {
      const res = await fetch(`/api/vault/entries/${id}`)
      if (res.ok) {
        const data = await res.json() as { secret: string }
        setSecret(data.secret)
        setRevealed(true)
      }
    } catch {
      // fetch failed — stay hidden
    } finally {
      setRevealing(false)
    }
  }

  async function handleCopy() {
    const value = secret ?? ''
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
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
        {revealed && secret !== null ? secret : '··········'}
      </span>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={handleReveal}
          disabled={revealing}
          className="transition-colors hover:opacity-100 disabled:opacity-40"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label={revealed ? 'Hide' : 'Show'}
        >
          {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          onClick={handleCopy}
          disabled={!revealed || secret === null}
          className="transition-colors disabled:opacity-40"
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
