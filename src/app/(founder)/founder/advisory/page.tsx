import { Suspense } from 'react'
import { AdvisoryWorkbench } from '@/components/founder/advisory/AdvisoryWorkbench'

export default function AdvisoryPage() {
  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-4">
        <h1
          className="text-[18px] font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Advisory
        </h1>
        <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
          Multi-agent tax strategy debate engine with ATO compliance
        </p>
      </div>
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
