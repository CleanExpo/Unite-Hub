// src/components/layout/__tests__/Topbar.test.tsx
import { render, screen } from '@testing-library/react'
import { Topbar } from '../Topbar'

vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn((selector?: (s: any) => any) => {
    const state = { toggleSidebar: vi.fn() }
    return selector ? selector(state) : state
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/founder/dashboard',
}))

describe('Topbar', () => {
  it('renders header element', () => {
    render(<Topbar />)
    expect(document.querySelector('header')).toBeInTheDocument()
  })

  it('shows Dashboard breadcrumb for /founder/dashboard', () => {
    render(<Topbar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
  })
})
