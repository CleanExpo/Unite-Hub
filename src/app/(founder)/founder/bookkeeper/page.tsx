import { Suspense } from 'react'
import { BookkeeperWorkbench } from '@/components/founder/bookkeeper/BookkeeperWorkbench'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

export default function BookkeeperPage() {
  return (
    <div className="p-6">
      <PageHeader
        title="Bookkeeper"
        subtitle="AI-powered reconciliation across all businesses"
        tip="Run the bookkeeper to auto-categorise transactions from Xero"
        className="mb-6"
      />
      <Suspense fallback={<div className="h-96" />}>
        <BookkeeperWorkbench />
      </Suspense>
    </div>
  )
}
