export const dynamic = 'force-dynamic'

import { StrategyRoomClient } from '@/components/founder/strategy/StrategyRoomClient'

export default function StrategyPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
          Strategy Room
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Deep analysis with Claude Opus — extended thinking enabled.
        </p>
      </div>
      <StrategyRoomClient />
    </div>
  )
}
