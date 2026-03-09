'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { VaultLock } from '@/components/founder/vault/VaultLock'
import { VaultGrid } from '@/components/founder/vault/VaultGrid'

export default function VaultPage() {
  const [unlocked, setUnlocked] = useState(false)

  return (
    <div className="relative p-6">
      <h1
        className="text-[24px] font-semibold tracking-tight mb-6"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Vault
      </h1>
      <VaultGrid />
      {!unlocked && <VaultLock onUnlock={() => setUnlocked(true)} />}
    </div>
  )
}
