export const dynamic = 'force-dynamic'

import { ApprovalQueue } from '@/components/founder/approvals/ApprovalQueue'

export default function ApprovalsPage() {
  return (
    <div className="p-6">
      <h1
        className="text-[24px] font-semibold tracking-tight mb-6"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Approvals
      </h1>
      <ApprovalQueue />
    </div>
  )
}
