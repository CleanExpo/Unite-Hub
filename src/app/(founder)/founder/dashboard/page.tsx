// src/app/(founder)/founder/dashboard/page.tsx
export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { KPIGrid } from '@/components/founder/dashboard/KPIGrid'
import { IntegrationStatus } from '@/components/founder/dashboard/IntegrationStatus'
import { FounderStats } from '@/components/founder/dashboard/FounderStats'
import { CoachBriefs } from '@/components/founder/dashboard/CoachBriefs'
import { PageHeader } from '@/components/ui/PageHeader'
import { SetupChecklist } from '@/components/founder/dashboard/SetupChecklist'
import { CapabilityMap } from '@/components/founder/dashboard/CapabilityMap'
import { ExperimentsDashboardWidget } from '@/components/founder/dashboard/ExperimentsDashboardWidget'
import { HubStatusWidget } from '@/components/founder/dashboard/HubStatusWidget'

export default async function DashboardPage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Dashboard"
        subtitle="Your founder command centre"
        tip="Try ⌘K to jump anywhere, or ⌘I to capture an idea"
      />
      <SetupChecklist founderId={user.id} />
      <CapabilityMap />
      <FounderStats />
      <HubStatusWidget />
      <CoachBriefs />
      <ExperimentsDashboardWidget />
      <KPIGrid />
      <IntegrationStatus />
    </div>
  )
}
