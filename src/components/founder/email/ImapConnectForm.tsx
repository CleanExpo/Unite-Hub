'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  email: string
  label: string
}

export function ImapConnectForm({ email, label }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/auth/imap/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json() as { ok?: boolean; error?: string }
      if (!res.ok || !data.ok) {
        setError(data.error ?? 'Connection failed')
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Network error — check connection')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-[10px] uppercase tracking-wider hover:text-white/70 transition-colors flex-shrink-0"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Connect →
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-1">
      <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--color-text-muted)' }}>
        {label} · SiteGround
      </p>
      <input
        type="password"
        placeholder="Email password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        autoFocus
        className="bg-zinc-900 border border-zinc-700 rounded-sm px-2 py-1 text-xs text-white placeholder-zinc-500 focus:border-[#00F5FF] focus:outline-none"
      />
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="text-xs bg-[#00F5FF] text-black px-3 py-1 rounded-sm font-medium hover:opacity-80 disabled:opacity-40"
        >
          {loading ? 'Connecting…' : 'Connect'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-zinc-500 hover:text-zinc-300"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}
