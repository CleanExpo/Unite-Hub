'use client'

import { useState } from 'react'
import { Lock } from 'lucide-react'
import { verifyVaultPassword } from '@/lib/vault-password'

interface VaultLockProps { onUnlock: () => void }

export function VaultLock({ onUnlock }: VaultLockProps) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setChecking(true)
    const ok = await verifyVaultPassword(value)
    setChecking(false)
    if (ok) {
      setError(false)
      onUnlock()
    } else {
      setError(true)
      setValue('')
    }
  }

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center z-10"
      style={{ background: 'var(--surface-sidebar)' }}
    >
      <div className="flex flex-col items-center gap-6 w-full max-w-xs px-4">
        <div className="flex flex-col items-center gap-3">
          <Lock size={32} strokeWidth={1.5} style={{ color: '#00F5FF' }} />
          <p className="text-[14px] text-[#888] text-center">
            Enter your master password to access the Vault
          </p>
        </div>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          <input
            type="password"
            value={value}
            onChange={(e) => { setValue(e.target.value); setError(false) }}
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
              Incorrect password
            </p>
          )}
          <button
            type="submit"
            disabled={checking}
            className="h-9 rounded-sm text-[13px] font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#00F5FF', color: '#050505' }}
          >
            {checking ? 'Checking...' : 'Unlock Vault'}
          </button>
        </form>
      </div>
    </div>
  )
}
