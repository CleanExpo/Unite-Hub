export const dynamic = 'force-dynamic'

import { redirect } from 'next/navigation'
import { getUser } from '@/lib/supabase/server'
import { PageHeader } from '@/components/ui/PageHeader'
import { PiRouterPanel } from '@/components/founder/pi/PiRouterPanel'

export default async function FounderPiPage() {
  const user = await getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <PageHeader
        title="Pi Command Cockpit"
        subtitle="Founder-safe senior-engineer control plane for routing, approvals, machine assignment, run state, and evidence receipts."
        tip="Command first. Queue before execution. Complete only with evidence."
      />
      <PiRouterPanel />
    </div>
  )
}
