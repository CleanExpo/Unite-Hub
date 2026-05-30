// src/components/founder/dashboard/IntegrationStatus.tsx
// Server Component — reads env vars + the credentials vault, never exposes keys to client
// Renders a compact status strip showing the REAL connection state of each integration.
// "Configured" (OAuth app env vars present) is NOT the same as "Connected" (a stored
// OAuth token exists) — the dot is only lit when a real token is in the vault.

import Link from 'next/link'
import { isXeroConfigured } from '@/lib/integrations/xero/client'
import { isGoogleConfigured } from '@/lib/integrations/google'
import { createServiceClient } from '@/lib/supabase/service'

interface IntegrationDot {
  label: string
  connected: boolean
  detail: string
  href?: string
}

function StatusDot({ connected, label, detail, href }: IntegrationDot) {
  const inner = (
    <div className="flex items-center gap-2">
      <span
        className="w-1.5 h-1.5 rounded-sm flex-shrink-0"
        style={{ background: connected ? '#00F5FF' : '#4a5568' }}
      />
      <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </span>
      <span
        className="text-[11px]"
        style={{ color: connected ? '#00F5FF' : 'var(--color-text-muted)' }}
      >
        {detail}
      </span>
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="hover:opacity-80 transition-opacity">
        {inner}
      </Link>
    )
  }
  return inner
}

// Three honest states: a token in the vault → "Connected"; env vars present but no
// token → "Configured · not connected"; neither → "Not configured".
function detailFor(configured: boolean, connected: boolean): string {
  if (connected) return 'Connected'
  if (configured) return 'Configured · not connected'
  return 'Not configured'
}

export async function IntegrationStatus({ founderId }: { founderId: string }) {
  const supabase = createServiceClient()

  // Real connection = an encrypted OAuth token stored in the vault for that service.
  const [xeroVault, googleVault] = await Promise.all([
    supabase
      .from('credentials_vault')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', founderId)
      .eq('service', 'xero'),
    supabase
      .from('credentials_vault')
      .select('id', { count: 'exact', head: true })
      .eq('founder_id', founderId)
      .eq('service', 'google'),
  ])

  // Xero — single OAuth app, one config covers all businesses
  const xeroConfigured = isXeroConfigured()
  const xeroConnected = (xeroVault.count ?? 0) > 0

  // Google / Gmail — one OAuth app covers all connected accounts
  const googleConfigured = isGoogleConfigured()
  const googleConnected = (googleVault.count ?? 0) > 0

  // Linear — personal API key; config IS the connection (no OAuth token to store)
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
        detail={detailFor(xeroConfigured, xeroConnected)}
        href="/founder/xero"
      />
      <StatusDot
        label="Gmail"
        connected={googleConnected}
        detail={detailFor(googleConfigured, googleConnected)}
        href="/founder/email"
      />
      <StatusDot
        label="Linear"
        connected={linearConnected}
        detail={linearConnected ? 'Connected' : 'Not configured'}
      />
    </div>
  )
}
