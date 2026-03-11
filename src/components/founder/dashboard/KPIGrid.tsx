// src/components/founder/dashboard/KPIGrid.tsx
import { KPICard } from './KPICard'
import { BUSINESSES } from '@/lib/businesses'

// xeroBusinessKey — businesses connected via Xero invoices
// linearBusinessKey — businesses tracked in Linear
// Fallback values are neutral placeholders — live data replaces them via KPICard fetch
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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
      {DASHBOARD_DATA.map((data) => {
        const business = BUSINESSES.find(b => b.key === data.key)!
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
          />
        )
      })}
    </div>
  )
}
