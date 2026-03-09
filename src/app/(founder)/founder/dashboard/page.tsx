// src/app/(founder)/founder/dashboard/page.tsx
export const dynamic = 'force-dynamic'

import { KPIGrid } from '@/components/founder/dashboard/KPIGrid'

export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-[24px] font-semibold text-[#f0f0f0] tracking-tight mb-6">
        Dashboard
      </h1>
      <KPIGrid />
    </div>
  )
}
