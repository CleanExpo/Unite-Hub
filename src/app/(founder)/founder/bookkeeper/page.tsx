import { Suspense } from 'react'
import { BookkeeperWorkbench } from '@/components/founder/bookkeeper/BookkeeperWorkbench'

export const dynamic = 'force-dynamic'

export default function BookkeeperPage() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1
          className="text-[24px] font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Bookkeeper
        </h1>
        <p
          className="text-[13px] mt-1"
          style={{ color: 'var(--color-text-disabled)' }}
        >
          Reconciliation &middot; BAS &middot; P&amp;L &middot; Expenses &middot; Xero sync
        </p>
      </div>
      <Suspense fallback={<div className="h-96" />}>
        <BookkeeperWorkbench />
      </Suspense>
    </div>
  )
}
