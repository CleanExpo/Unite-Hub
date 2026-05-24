// src/components/layout/__tests__/Topbar.test.tsx
import { render, screen } from '@testing-library/react'
import { Topbar } from '../Topbar'
import { useUIStore } from '@/store/ui'

vi.mock('next/navigation', () => ({
  usePathname: () => '/founder/dashboard',
}))

beforeEach(() => {
  useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'dark' })
})

describe('Topbar', () => {
  it('renders header element', () => {
    render(<Topbar />)
    expect(document.querySelector('header')).toBeInTheDocument()
  })

  it('shows Dashboard breadcrumb for /founder/dashboard', () => {
    render(<Topbar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })

  it('renders search command palette button', () => {
    render(<Topbar />)
    expect(screen.getByLabelText('Command palette')).toBeInTheDocument()
  })

  it('renders help button', () => {
    render(<Topbar />)
    expect(screen.getByLabelText('Help')).toBeInTheDocument()
  })

  it('renders toggle sidebar button on mobile', () => {
    render(<Topbar />)
    expect(screen.getByLabelText('Toggle sidebar')).toBeInTheDocument()
  })
})
