'use client'

import { useState } from 'react'
import { KeyRound, X } from 'lucide-react'
import { changeVaultPassword } from '@/lib/vault-password'

interface VaultChangePasswordProps {
  onClose: () => void
}

export function VaultChangePassword({ onClose }: VaultChangePasswordProps) {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (next.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (next !== confirm) {
      setError('New passwords do not match')
      return
    }

    setSaving(true)
    const ok = await changeVaultPassword(current, next)
    setSaving(false)

    if (!ok) {
      setError('Current password is incorrect')
      setCurrent('')
      return
    }

    setSuccess(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-20"
      style={{ background: 'rgba(5,5,5,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-sm p-6 flex flex-col gap-5"
        style={{ background: 'var(--surface-card)', border: '1px solid var(--color-border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound size={16} strokeWidth={1.5} style={{ color: '#00F5FF' }} />
            <span className="text-[14px] font-medium" style={{ color: 'var(--color-text-primary)' }}>
              Change Vault Password
            </span>
          </div>
          <button onClick={onClose} style={{ color: 'var(--color-text-disabled)' }}>
            <X size={16} />
          </button>
        </div>

        {success ? (
          <p className="text-[13px] text-center py-2" style={{ color: '#22c55e' }}>
            Password updated successfully
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Current Password
              </label>
              <input
                type="password"
                value={current}
                onChange={(e) => { setCurrent(e.target.value); setError(null) }}
                placeholder="Current master password"
                autoFocus
                className="w-full px-3 h-9 rounded-sm text-[13px] text-[#f0f0f0] outline-none"
                style={{ background: 'var(--surface-elevated)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                New Password
              </label>
              <input
                type="password"
                value={next}
                onChange={(e) => { setNext(e.target.value); setError(null) }}
                placeholder="Min. 8 characters"
                className="w-full px-3 h-9 rounded-sm text-[13px] text-[#f0f0f0] outline-none"
                style={{ background: 'var(--surface-elevated)', border: '1px solid var(--color-border)' }}
              />
            </div>

            <div>
              <label className="text-[11px] font-medium uppercase tracking-wider block mb-1" style={{ color: 'var(--color-text-muted)' }}>
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => { setConfirm(e.target.value); setError(null) }}
                placeholder="Repeat new password"
                className="w-full px-3 h-9 rounded-sm text-[13px] text-[#f0f0f0] outline-none"
                style={{ background: 'var(--surface-elevated)', border: '1px solid var(--color-border)' }}
              />
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>{error}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="h-9 rounded-sm text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
              style={{ background: '#00F5FF18', color: '#00F5FF', border: '1px solid #00F5FF30' }}
            >
              {saving ? 'Saving...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
