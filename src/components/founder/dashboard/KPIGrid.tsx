// src/components/founder/dashboard/KPIGrid.tsx
'use client'

import { useEffect, useState } from 'react'
import { KPICard } from './KPICard'
import { BUSINESSES } from '@/lib/businesses'
import type { BatchKPIResponse, BatchKPIEntry } from '@/app/api/dashboard/kpi/route'

// xeroBusinessKey — businesses connected via Xero invoices
// linearBusinessKey — businesses tracked in Linear
// Fallback values are neutral placeholders — live data replaces them via batch fetch
const DASHBOARD_DATA = [
  { key: 'dr',      metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', xeroBusinessKey: 'dr',      linearBusinessKey: 'dr'      },
  { key: 'dr_qld',  metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', xeroBusinessKey: 'dr_qld',  linearBusinessKey: 'dr_qld'  },
  { key: 'nrpg',    metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', xeroBusinessKey: 'nrpg',    linearBusinessKey: 'nrpg'    },
  { key: 'carsi',   metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', xeroBusinessKey: 'carsi',   linearBusinessKey: 'carsi'   },
  { key: 'restore', metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', xeroBusinessKey: 'restore', linearBusinessKey: 'restore' },
  { key: 'synthex', metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', xeroBusinessKey: 'synthex', linearBusinessKey: 'synthex' },
  { key: 'ato',     metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Not yet launched', xeroBusinessKey: undefined, linearBusinessKey: 'ato'     },
  { key: 'ccw',     metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', xeroBusinessKey: 'ccw',     linearBusinessKey: 'ccw'     },
]

export function KPIGrid() {
  const [batchData, setBatchData] = useState<Record<string, BatchKPIEntry> | null>(null)

  useEffect(() => {
    fetch('/api/dashboard/kpi')
      .then(res => res.json() as Promise<BatchKPIResponse>)
      .then(({ kpis }) => setBatchData(kpis))
      .catch((error) => {
        console.error('[kpi-grid] Batch fetch failed, cards will fetch individually:', error)
      })
  }, [])

  return (
    <div data-testid="kpi-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {DASHBOARD_DATA.map((data) => {
        const business = BUSINESSES.find(b => b.key === data.key)
        if (!business) return null
        return (
          <KPICard
            key={data.key}
            business={business}
            metric={data.metric}
            metricLabel={data.metricLabel}
            trend={data.trend}
            secondary={data.secondary}
            xeroBusinessKey={data.xeroBusinessKey}
            linearBusinessKey={data.linearBusinessKey}
            liveData={batchData?.[data.key]}
          />
        )
      })}
    </div>
  )
}
