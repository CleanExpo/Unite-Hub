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
        title="Pi Dev Ops Router"
        subtitle="Founder-safe senior-engineer intake for task packets, context packs, machine routing, and approval gates."
        tip="Route first. Execute only after the scope, evidence path, and machine owner are clear."
      />
      <PiRouterPanel />
    </div>
  )
}
