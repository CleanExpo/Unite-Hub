// src/components/founder/dashboard/__tests__/KPICard.test.tsx
import { render, screen } from '@testing-library/react'
import { KPICard } from '../KPICard'
import { BUSINESSES } from '@/lib/businesses'

const DR = BUSINESSES.find(b => b.key === 'dr')!
const ATO = BUSINESSES.find(b => b.key === 'ato')!

const baseProps = {
  metric: '$24,750',
  metricLabel: 'Revenue MTD',
  trend: { value: '+12%', positive: true as const },
  secondary: '47 Claims · 3 Pending',
}

describe('KPICard', () => {
  it('renders business name', () => {
    render(<KPICard business={DR} {...baseProps} />)
    expect(screen.getByText('Disaster Recovery')).toBeInTheDocument()
  })

  it('renders primary metric', () => {
    render(<KPICard business={DR} {...baseProps} />)
    expect(screen.getByText('$24,750')).toBeInTheDocument()
  })

  it('shows not-yet-launched overlay for planning status', () => {
    render(<KPICard business={ATO} {...baseProps} metric="—" />)
    expect(screen.getByText(/not yet launched/i)).toBeInTheDocument()
  })
})
