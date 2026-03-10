// src/app/(founder)/founder/xero/page.tsx
export const dynamic = 'force-dynamic'

import { getUser } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { isXeroConfigured } from '@/lib/integrations/xero'
import { ConnectCard } from '@/components/founder/integrations/ConnectCard'

// Businesses that use Xero for accounting
const XERO_BUSINESSES = [
  { key: 'dr',     name: 'Disaster Recovery',     color: '#ef4444' },
  { key: 'dr_qld', name: 'Disaster Recovery Qld', color: '#f87171' },
  { key: 'carsi',  name: 'CARSI',                 color: '#eab308' },
  { key: 'nrpg',   name: 'NRPG',                  color: '#f97316' },
  { key: 'ccw',    name: 'CCW-ERP/CRM',            color: '#06b6d4' },
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-light text-white/90">Xero</h1>
        <p className="text-sm text-white/40 mt-1">
          Financial data · Bank feeds · P&amp;L · BAS · GST
        </p>
      </div>

      {params.connected && (
        <div className="text-xs text-[#00F5FF]/80 border border-[#00F5FF]/20 bg-[#00F5FF]/5 px-4 py-2.5 rounded-sm">
          ✓ {XERO_BUSINESSES.find(b => b.key === params.business)?.name ?? params.business} connected to Xero
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
        <div className="grid grid-cols-1 gap-3 max-w-2xl">
          {XERO_BUSINESSES.map(biz => {
            const isConnected = connected.has(biz.key)
            return (
              <div
                key={biz.key}
                className="flex items-center justify-between border border-white/[0.08] px-5 py-4 rounded-sm"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: biz.color }}
                  />
                  <div>
                    <p className="text-sm text-white/80 font-light">{biz.name}</p>
                    <p className="text-xs text-white/30 mt-0.5">
                      {isConnected ? 'Connected · bank feeds active' : 'Not connected'}
                    </p>
                  </div>
                </div>
                {isConnected ? (
                  <span className="text-[10px] uppercase tracking-widest text-[#00F5FF]/60 border border-[#00F5FF]/20 px-2.5 py-1 rounded-sm">
                    Live
                  </span>
                ) : (
                  <a
                    href={`/api/xero/connect?business=${biz.key}`}
                    className="text-[10px] uppercase tracking-widest text-white/50 border border-white/10 px-2.5 py-1 rounded-sm hover:text-[#00F5FF]/80 hover:border-[#00F5FF]/30 transition-colors"
                  >
                    Connect →
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
