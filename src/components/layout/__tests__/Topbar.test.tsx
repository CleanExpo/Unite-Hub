// src/components/layout/__tests__/Topbar.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

  it('renders Sun icon button when theme is dark', () => {
    render(<Topbar />)
    expect(screen.getByLabelText('Switch to light mode')).toBeInTheDocument()
  })

  it('renders Moon icon button when theme is light', () => {
    useUIStore.setState({ sidebarOpen: true, expandedBusinesses: [], theme: 'light' })
    render(<Topbar />)
    expect(screen.getByLabelText('Switch to dark mode')).toBeInTheDocument()
  })

  it('calls toggleTheme when toggle button is clicked', async () => {
    const user = userEvent.setup()
    render(<Topbar />)
    await user.click(screen.getByLabelText('Switch to light mode'))
    expect(useUIStore.getState().theme).toBe('light')
  })
})
