// src/components/founder/dashboard/IntegrationStatus.tsx
// Server Component — reads env vars directly, never exposes keys to client
// Renders a compact status strip showing which integrations are configured

import { isXeroConfigured } from '@/lib/integrations/xero/client'
import { isGoogleConfigured } from '@/lib/integrations/google'

interface IntegrationDot {
  label: string
  connected: boolean
  detail: string
}

function StatusDot({ connected, label, detail }: IntegrationDot) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: connected ? '#00F5FF' : '#334155' }}
      />
      <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <span className="text-[11px]" style={{ color: connected ? '#00F5FF' : '#475569' }}>
        {detail}
      </span>
    </div>
  )
}

export function IntegrationStatus() {
  // Xero — single OAuth app, one config covers all businesses
  const xeroConnected = isXeroConfigured()

  // Google / Gmail — one OAuth app covers all connected accounts
  const googleConnected = isGoogleConfigured()

  // Linear — personal API key
  const linearConnected = Boolean(process.env.LINEAR_API_KEY)

  return (
    <div
      className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 rounded-sm"
      style={{
        background: 'var(--surface-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <span
        className="text-[11px] font-medium tracking-widest uppercase mr-1"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Integrations
      </span>
      <StatusDot
        label="Xero"
        connected={xeroConnected}
        detail={xeroConnected ? 'Connected' : 'Not configured'}
      />
      <StatusDot
        label="Gmail"
        connected={googleConnected}
        detail={googleConnected ? 'Connected' : 'Not configured'}
      />
      <StatusDot
        label="Linear"
        connected={linearConnected}
        detail={linearConnected ? 'Connected' : 'Not configured'}
      />
    </div>
  )
}
