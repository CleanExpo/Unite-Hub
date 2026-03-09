// src/components/founder/dashboard/KPIGrid.tsx
import { KPICard } from './KPICard'
import { BUSINESSES } from '@/lib/businesses'

const DASHBOARD_DATA = [
  { key: 'dr',      metric: '$24,750', metricLabel: 'Revenue MTD', trend: { value: '+12%', positive: true  }, secondary: '47 Claims · 3 Pending'       },
  { key: 'nrpg',   metric: '$8,400',  metricLabel: 'Revenue MTD', trend: { value: '+5%',  positive: true  }, secondary: '210 Members · 12 New'         },
  { key: 'carsi',  metric: '$12,200', metricLabel: 'Revenue MTD', trend: { value: '-3%',  positive: false }, secondary: '8 Courses · 3 Active'          },
  { key: 'restore', metric: '$6,930', metricLabel: 'MRR',         trend: { value: '+18%', positive: true  }, secondary: '140 Subscribers'               },
  { key: 'synthex', metric: '$19,600',metricLabel: 'MRR',         trend: { value: '+22%', positive: true  }, secondary: '32 Clients · 4 Enterprise'     },
  { key: 'ato',    metric: '—',       metricLabel: 'Revenue MTD', trend: { value: '—',    positive: true  }, secondary: 'Not yet launched'              },
  { key: 'ccw',    metric: '$31,500', metricLabel: 'Revenue MTD', trend: { value: '+8%',  positive: true  }, secondary: '15 Orders · 3 Pending'         },
] as const

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
          />
        )
      })}
    </div>
  )
}
