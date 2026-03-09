// src/app/(founder)/founder/xero/page.tsx
export const dynamic = 'force-dynamic'

import { isXeroConfigured } from '@/lib/integrations/xero'
import { ConnectCard } from '@/components/founder/integrations/ConnectCard'

export default function XeroPage() {
  const configured = isXeroConfigured()

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-light text-white/90">Xero</h1>
        <p className="text-sm text-white/40 mt-1">Financial data · BAS · GST</p>
      </div>

      {!configured ? (
        <ConnectCard
          service="Xero"
          description="Connect Xero to view P&L, BAS lodgement dates, and GST position across all businesses."
          connectUrl="/api/xero/connect"
          icon="📊"
        />
      ) : (
        <p className="text-white/60 text-sm">Xero connected — data loading…</p>
      )}
    </div>
  )
}
