// src/components/founder/dashboard/KPIGrid.tsx
import { KPICard } from './KPICard'
import { BUSINESSES } from '@/lib/businesses'

// stripeBusinessKey — SaaS businesses billed via Stripe subscriptions (synthex, restore)
// xeroBusinessKey   — Service/product businesses billed via Xero invoices (dr, nrpg, carsi, ccw)
const DASHBOARD_DATA = [
  { key: 'dr',      metric: '$24,750', metricLabel: 'Revenue MTD', trend: { value: '+12%', positive: true  }, secondary: '47 Invoices MTD', stripeBusinessKey: undefined, xeroBusinessKey: 'dr'    },
  { key: 'nrpg',   metric: '$8,400',  metricLabel: 'Revenue MTD', trend: { value: '+5%',  positive: true  }, secondary: '12 Invoices MTD', stripeBusinessKey: undefined, xeroBusinessKey: 'nrpg'  },
  { key: 'carsi',  metric: '$12,200', metricLabel: 'Revenue MTD', trend: { value: '-3%',  positive: false }, secondary: '8 Invoices MTD',  stripeBusinessKey: undefined, xeroBusinessKey: 'carsi' },
  { key: 'restore', metric: '$6,930', metricLabel: 'MRR',         trend: { value: '+18%', positive: true  }, secondary: '140 Subscribers', stripeBusinessKey: 'restore', xeroBusinessKey: undefined },
  { key: 'synthex', metric: '$19,600',metricLabel: 'MRR',         trend: { value: '+22%', positive: true  }, secondary: '32 Clients',      stripeBusinessKey: 'synthex', xeroBusinessKey: undefined },
  { key: 'ato',    metric: '—',       metricLabel: 'Revenue MTD', trend: { value: '—',    positive: true  }, secondary: 'Not yet launched', stripeBusinessKey: undefined, xeroBusinessKey: undefined },
  { key: 'ccw',    metric: '$31,500', metricLabel: 'Revenue MTD', trend: { value: '+8%',  positive: true  }, secondary: '15 Invoices MTD', stripeBusinessKey: undefined, xeroBusinessKey: 'ccw'   },
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
