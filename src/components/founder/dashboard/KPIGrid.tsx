// src/components/founder/dashboard/KPIGrid.tsx
import { KPICard } from './KPICard'
import { BUSINESSES } from '@/lib/businesses'

// stripeBusinessKey — SaaS businesses billed via Stripe subscriptions (synthex, restore)
// xeroBusinessKey   — Service/product businesses billed via Xero invoices (dr, nrpg, carsi, ccw)
// Fallback values are neutral placeholders — live data replaces them via KPICard fetch
const DASHBOARD_DATA = [
  { key: 'dr',      metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', stripeBusinessKey: undefined, xeroBusinessKey: 'dr'      },
  { key: 'dr_qld',  metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', stripeBusinessKey: undefined, xeroBusinessKey: 'dr_qld'  },
  { key: 'nrpg',    metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', stripeBusinessKey: undefined, xeroBusinessKey: 'nrpg'    },
  { key: 'carsi',   metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', stripeBusinessKey: undefined, xeroBusinessKey: 'carsi'   },
  { key: 'restore', metric: '—', metricLabel: 'MRR',         trend: { value: '—', positive: true  }, secondary: 'Loading...', stripeBusinessKey: 'restore', xeroBusinessKey: undefined  },
  { key: 'synthex', metric: '—', metricLabel: 'MRR',         trend: { value: '—', positive: true  }, secondary: 'Loading...', stripeBusinessKey: 'synthex', xeroBusinessKey: undefined  },
  { key: 'ato',     metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Not yet launched', stripeBusinessKey: undefined, xeroBusinessKey: undefined },
  { key: 'ccw',     metric: '—', metricLabel: 'Revenue MTD', trend: { value: '—', positive: true  }, secondary: 'Loading...', stripeBusinessKey: undefined, xeroBusinessKey: 'ccw'     },
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
            stripeBusinessKey={data.stripeBusinessKey}
            xeroBusinessKey={data.xeroBusinessKey}
          />
        )
      })}
    </div>
  )
}
