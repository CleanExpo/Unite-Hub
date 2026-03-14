// src/app/(founder)/founder/dashboard/page.tsx
export const dynamic = 'force-dynamic'

import { KPIGrid } from '@/components/founder/dashboard/KPIGrid'
import { IntegrationStatus } from '@/components/founder/dashboard/IntegrationStatus'
import { FounderStats } from '@/components/founder/dashboard/FounderStats'
import { CoachBriefs } from '@/components/founder/dashboard/CoachBriefs'
import { PageHeader } from '@/components/ui/PageHeader'

export default function DashboardPage() {
  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your founder command centre"
        tip="Try ⌘K to jump anywhere, or ask Bron (⌘⇧B) for help"
      />
      <FounderStats />
      <CoachBriefs />
      <KPIGrid />
      <IntegrationStatus />
    </div>
  )
}
