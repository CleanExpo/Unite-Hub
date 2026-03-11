'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { VaultLock } from './VaultLock'
import { VaultGrid } from './VaultGrid'
import { VaultChangePassword } from './VaultChangePassword'

export function VaultPageClient() {
  const [unlocked, setUnlocked] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  return (
    <div className="relative p-6">
      <div className="flex items-center justify-between mb-6">
        <h1
          className="text-[24px] font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Vault
        </h1>
        {unlocked && (
          <button
            onClick={() => setChangingPw(true)}
            className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-sm transition-colors"
            style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
          >
            <KeyRound size={13} strokeWidth={1.5} />
            Change Password
          </button>
        )}
      </div>

      <VaultGrid />

      {!unlocked && <VaultLock onUnlock={() => setUnlocked(true)} />}
      {changingPw && <VaultChangePassword onClose={() => setChangingPw(false)} />}
    </div>
  )
}
