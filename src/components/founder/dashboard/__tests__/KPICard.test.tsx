// src/components/founder/dashboard/__tests__/KPICard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import { KPICard } from '../KPICard'
import { BUSINESSES } from '@/lib/businesses'
import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('framer-motion', () => ({
  motion: { div: ({ children, className, style }: any) => <div className={className} style={style}>{children}</div> },
}))

const DR = BUSINESSES.find(b => b.key === 'dr')!
const ATO = BUSINESSES.find(b => b.key === 'ato')!
const business = BUSINESSES.find(b => b.key === 'restore')!

const baseProps = {
  metric: '$24,750',
  metricLabel: 'Revenue MTD',
  trend: { value: '+12%', positive: true as const },
  secondary: '47 Claims · 3 Pending',
}

describe('KPICard', () => {
  beforeEach(() => { vi.resetAllMocks() })

  it('renders business name', () => {
    render(<KPICard business={DR} {...baseProps} />)
    expect(screen.getByText('Disaster Recovery')).toBeInTheDocument()
  })

  it('renders primary metric', () => {
    render(<KPICard business={DR} {...baseProps} />)
    expect(screen.getByText('$24,750')).toBeInTheDocument()
  })

  it('shows secondary prop text when no live keys provided', () => {
    render(<KPICard business={ATO} {...baseProps} secondary="Not yet launched" metric="—" />)
    expect(screen.getByText('Not yet launched')).toBeInTheDocument()
  })

  it('shows linear issue count in secondary when linearBusinessKey provided', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { revenueCents: 9900, growth: 5.2, invoiceCount: 3 }, source: 'mock' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ activeCount: 4 }) })

    render(
      <KPICard
        business={business}
        metric="—"
        metricLabel="Revenue MTD"
        trend={{ value: '—', positive: true }}
        secondary="Loading..."
        xeroBusinessKey="restore"
        linearBusinessKey="restore"
      />
    )

    await waitFor(() => {
      expect(screen.getByText('4 active issues')).toBeInTheDocument()
    })
  })
})
