'use client'

import { useState } from 'react'
import { Lock, KeyRound } from 'lucide-react'
import { verifyVaultPassword, resetVaultPassword } from '@/lib/vault-password'

interface VaultLockProps { onUnlock: () => void }

type Mode = 'unlock' | 'reset'

export function VaultLock({ onUnlock }: VaultLockProps) {
  const [mode, setMode]           = useState<Mode>('unlock')
  const [value, setValue]         = useState('')
  const [confirm, setConfirm]     = useState('')
  const [error, setError]         = useState<string | null>(null)
  const [checking, setChecking]   = useState(false)

  // ── Unlock ──────────────────────────────────────────────────────────────
  async function handleUnlock(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    const ok = await verifyVaultPassword(value)
    setChecking(false)
    if (ok) { onUnlock() } else {
      setError('Incorrect password')
      setValue('')
    }
  }

  // ── Reset ────────────────────────────────────────────────────────────────
  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (value.length < 6) { setError('Password must be at least 6 characters'); return }
    if (value !== confirm) { setError('Passwords do not match'); return }
    setChecking(true)
    await resetVaultPassword(value)
    setChecking(false)
    onUnlock()
  }

  function enterResetMode() {
    setValue(''); setConfirm(''); setError(null); setMode('reset')
  }

  function enterUnlockMode() {
    setValue(''); setConfirm(''); setError(null); setMode('unlock')
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-10"
      style={{ background: 'var(--surface-sidebar)' }}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-xs px-4">

        {/* Icon + title */}
        <div className="flex flex-col items-center gap-3">
          {mode === 'unlock'
            ? <Lock size={32} strokeWidth={1.5} style={{ color: '#00F5FF' }} />
            : <KeyRound size={32} strokeWidth={1.5} style={{ color: '#00F5FF' }} />
          }
          <p className="text-[14px] text-[#888] text-center">
            {mode === 'unlock'
              ? 'Enter your master password to access the Vault'
              : 'Set a new master password for the Vault'
            }
          </p>
        </div>

        {/* Unlock form */}
        {mode === 'unlock' && (
          <form onSubmit={handleUnlock} className="w-full flex flex-col gap-3">
            <input
              type="password"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null) }}
              placeholder="Master password"
              autoFocus
              className="w-full px-3 h-9 rounded-sm text-[13px] text-[#f0f0f0] outline-none transition-colors"
              style={{
                background: 'var(--surface-card)',
                border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
              }}
            />
            {error && (
              <p className="text-[12px] text-center" style={{ color: 'var(--color-danger)' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={checking || !value}
              className="h-9 rounded-sm text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#00F5FF', color: '#050505' }}
            >
              {checking ? 'Checking...' : 'Unlock Vault'}
            </button>
            <button
              type="button"
              onClick={enterResetMode}
              className="text-[12px] text-center transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-disabled)' }}
            >
              Forgot password?
            </button>
          </form>
        )}

        {/* Reset form */}
        {mode === 'reset' && (
          <form onSubmit={handleReset} className="w-full flex flex-col gap-3">
            <input
              type="password"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(null) }}
              placeholder="New password (min 6 chars)"
              autoFocus
              className="w-full px-3 h-9 rounded-sm text-[13px] text-[#f0f0f0] outline-none transition-colors"
              style={{
                background: 'var(--surface-card)',
                border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
              }}
            />
            <input
              type="password"
              value={confirm}
              onChange={(e) => { setConfirm(e.target.value); setError(null) }}
              placeholder="Confirm new password"
              className="w-full px-3 h-9 rounded-sm text-[13px] text-[#f0f0f0] outline-none transition-colors"
              style={{
                background: 'var(--surface-card)',
                border: `1px solid ${error ? 'var(--color-danger)' : 'var(--color-border)'}`,
              }}
            />
            {error && (
              <p className="text-[12px] text-center" style={{ color: 'var(--color-danger)' }}>
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={checking || !value || !confirm}
              className="h-9 rounded-sm text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#00F5FF', color: '#050505' }}
            >
              {checking ? 'Saving...' : 'Set Password & Unlock'}
            </button>
            <button
              type="button"
              onClick={enterUnlockMode}
              className="text-[12px] text-center transition-colors hover:opacity-80"
              style={{ color: 'var(--color-text-disabled)' }}
            >
              Back to unlock
            </button>
          </form>
        )}

      </div>
    </div>
  )
}
