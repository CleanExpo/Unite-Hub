'use client'

import { useState } from 'react'
import { KeyRound } from 'lucide-react'
import { VaultLock } from './VaultLock'
import { VaultGrid } from './VaultGrid'
import { VaultChangePassword } from './VaultChangePassword'
import { PageHeader } from '@/components/ui/PageHeader'

export function VaultPageClient() {
  const [unlocked, setUnlocked] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  return (
    <div className="relative p-6">
      <PageHeader
        title="Vault"
        subtitle="Encrypted credential storage"
        className="mb-6"
        actions={
          unlocked ? (
            <button
              onClick={() => setChangingPw(true)}
              className="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-sm transition-colors"
              style={{ color: 'var(--color-text-muted)', border: '1px solid var(--color-border)' }}
            >
              <KeyRound size={13} strokeWidth={1.5} />
              Change Password
            </button>
          ) : undefined
        }
      />

      <VaultGrid unlocked={unlocked} />

      {!unlocked && <VaultLock onUnlock={() => setUnlocked(true)} />}
      {changingPw && <VaultChangePassword onClose={() => setChangingPw(false)} />}
    </div>
  )
}
