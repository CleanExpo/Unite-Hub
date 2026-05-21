export const dynamic = 'force-dynamic'

import { ApprovalQueue } from '@/components/founder/approvals/ApprovalQueue'
import { PageHeader } from '@/components/ui/PageHeader'

export default function ApprovalsPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Approvals"
        subtitle="AI-requested actions waiting for your decision"
        className="mb-6"
      />
      <ApprovalQueue />
    </div>
  )
}
