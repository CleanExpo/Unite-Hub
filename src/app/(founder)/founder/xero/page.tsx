// src/app/(founder)/founder/xero/page.tsx
export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isXeroConfigured } from '@/lib/integrations/xero'
import { ConnectCard } from '@/components/founder/integrations/ConnectCard'
import { XeroConnectButton } from '@/components/founder/xero/XeroConnectButton'
import { PageHeader } from '@/components/ui/PageHeader'

// ── Xero account groupings ────────────────────────────────────────────────
// Each business connects to one of two Xero organisations.
// CRON jobs use the stored token for that org's tenant_id.

const XERO_ACCOUNTS = [
  {
    label: 'DR Xero Account',
    description: 'Disaster Recovery entities',
    businesses: [
      { key: 'dr',   name: 'Disaster Recovery',     color: '#ef4444' },
      { key: 'nrpg', name: 'NRPG',                  color: '#f97316' },
    ],
  },
  {
    label: 'CARSI Xero Account',
    description: 'CARSI group entities',
    businesses: [
      { key: 'carsi',   name: 'CARSI',              color: '#eab308' },
      { key: 'restore', name: 'RestoreAssist',       color: '#22c55e' },
      { key: 'ato',     name: 'ATO App',             color: '#3b82f6' },
      { key: 'synthex', name: 'SYNTHEX',             color: '#a855f7' },
      { key: 'ccw',     name: 'CCW-ERP/CRM',         color: '#06b6d4' },
    ],
  },
]

async function getConnectedBusinesses(founderId: string): Promise<Set<string>> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('credentials_vault')
    .select('label')
    .eq('founder_id', founderId)
    .eq('service', 'xero')

  return new Set((data ?? []).map((r: { label: string }) => r.label))
}

export default async function XeroPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; business?: string; error?: string }>
}) {
  const params = await searchParams
  const configured = isXeroConfigured()
  const user = await getUser()
  const connected = user ? await getConnectedBusinesses(user.id) : new Set<string>()

  // Flat lookup for the success banner
  const allBusinesses = XERO_ACCOUNTS.flatMap(a => a.businesses)
  const connectedName =
    allBusinesses.find(b => b.key === params.business)?.name ?? params.business

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Xero"
        subtitle="Manage Xero connections for each business"
      />

      {params.connected && (
        <div className="text-xs text-[#00F5FF]/80 border border-[#00F5FF]/20 bg-[#00F5FF]/5 px-4 py-2.5 rounded-sm">
          ✓ {connectedName} connected to Xero
        </div>
      )}

      {params.error && (
        <div className="text-xs text-red-400/80 border border-red-400/20 bg-red-400/5 px-4 py-2.5 rounded-sm">
          Connection error: {params.error}
        </div>
      )}

      {!configured ? (
        <ConnectCard
          service="Xero"
          description="Xero credentials are not configured. Add XERO_CLIENT_ID and XERO_CLIENT_SECRET to your environment."
          connectUrl="#"
          icon="📊"
          comingSoon
        />
      ) : (
        <div className="space-y-6 max-w-2xl">
          {XERO_ACCOUNTS.map(account => (
            <div key={account.label}>
              {/* Account group header */}
              <div className="flex items-center gap-3 mb-2">
                <p
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {account.label}
                </p>
                <div
                  className="flex-1 h-px"
                  style={{ background: 'var(--color-border)' }}
                />
              </div>

              {/* Business rows */}
              <div className="grid grid-cols-1 gap-2">
                {account.businesses.map(biz => {
                  const isConnected = connected.has(biz.key)
                  return (
                    <div
                      key={biz.key}
                      className="flex items-center justify-between border border-white/[0.08] px-5 py-4 rounded-sm"
                      style={{ background: 'var(--surface-card)' }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: biz.color }}
                        />
                        <div>
                          <p
                            className="text-sm font-light"
                            style={{ color: 'var(--color-text-primary)' }}
                          >
                            {biz.name}
                          </p>
                          <p
                            className="text-xs mt-0.5"
                            style={{
                              color: isConnected ? '#00F5FF' : 'var(--color-text-muted)',
                            }}
                          >
                            {isConnected ? 'Connected · bank feeds active' : 'Not connected'}
                          </p>
                        </div>
                      </div>

                      {isConnected ? (
                        <span className="text-[10px] uppercase tracking-widest text-[#00F5FF]/80 border border-[#00F5FF]/30 px-2.5 py-1 rounded-sm">
                          Live
                        </span>
                      ) : (
                        <XeroConnectButton
                          businessKey={biz.key}
                          businessName={biz.name}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
