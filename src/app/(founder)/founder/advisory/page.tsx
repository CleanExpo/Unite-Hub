import { Suspense } from 'react'
import { AdvisoryWorkbench } from '@/components/founder/advisory/AdvisoryWorkbench'
import { PageHeader } from '@/components/ui/PageHeader'

export default function AdvisoryPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Advisory"
        subtitle="4 AI accounting firms debate your tax and finance questions"
        tip="Start a new case to get competing analysis scored by a judge"
        className="mb-4"
      />
      <Suspense fallback={
        <div className="flex items-center justify-center py-16">
          <span className="text-[12px]" style={{ color: 'var(--color-text-disabled)' }}>
            Loading...
          </span>
        </div>
      }>
        <AdvisoryWorkbench />
      </Suspense>
    </div>
  )
}
