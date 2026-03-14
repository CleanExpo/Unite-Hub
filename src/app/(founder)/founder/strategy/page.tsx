export const dynamic = 'force-dynamic'

import { StrategyRoomClient } from '@/components/founder/strategy/StrategyRoomClient'
import { PageHeader } from '@/components/ui/PageHeader'

export default function StrategyPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Strategy Room"
        subtitle="Deep analysis with Claude Opus — extended thinking enabled"
        tip="Ask a strategic question about any of your businesses"
      />
      <StrategyRoomClient />
    </div>
  )
}
