// src/app/(founder)/founder/dashboard/page.tsx
export const dynamic = 'force-dynamic'

import { KPIGrid } from '@/components/founder/dashboard/KPIGrid'
import { IntegrationStatus } from '@/components/founder/dashboard/IntegrationStatus'

export default function DashboardPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-[24px] font-semibold text-[#f0f0f0] tracking-tight">
        Dashboard
      </h1>
      <KPIGrid />
      <IntegrationStatus />
    </div>
  )
}
