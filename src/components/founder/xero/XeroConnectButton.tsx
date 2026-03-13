'use client'
// src/components/founder/xero/XeroConnectButton.tsx
// Wraps the "Connect →" anchor in a MFA gate modal.

import { useState } from 'react'
import { MFAGate } from './MFAGate'

interface XeroConnectButtonProps {
  businessKey: string
  businessName: string
}

export function XeroConnectButton({ businessKey, businessName }: XeroConnectButtonProps) {
  const [showGate, setShowGate] = useState(false)

  return (
    <>
      <button
        onClick={() => setShowGate(true)}
        className="text-[10px] uppercase tracking-widest border px-2.5 py-1 rounded-sm transition-colors"
        style={{ color: 'var(--color-text-secondary)', borderColor: 'var(--color-border-strong)' }}
      >
        Connect →
      </button>

      {showGate && (
        <MFAGate
          businessKey={businessKey}
          businessName={businessName}
          onCancel={() => setShowGate(false)}
        />
      )}
    </>
  )
}
