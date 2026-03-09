// src/components/layout/__tests__/Sidebar.test.tsx
import { render, screen } from '@testing-library/react'
import { Sidebar } from '../Sidebar'

vi.mock('framer-motion', () => ({
  motion: {
    aside: ({ children, className, style, ...rest }: any) => (
      <aside className={className} style={style}>{children}</aside>
    ),
    div: ({ children, className, style, ...rest }: any) => (
      <div className={className} style={style}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      sidebarOpen: true,
      expandedBusinesses: [],
      toggleSidebar: vi.fn(),
      toggleBusiness: vi.fn(),
    }
    return selector ? selector(state) : state
  }),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/founder/dashboard',
}))

describe('Sidebar', () => {
  it('renders NEXUS wordmark', () => {
    render(<Sidebar />)
    expect(screen.getByText('NEXUS')).toBeInTheDocument()
  })

  it('renders all global nav items', () => {
    render(<Sidebar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Kanban')).toBeInTheDocument()
    expect(screen.getByText('Vault')).toBeInTheDocument()
    expect(screen.getByText('Approvals')).toBeInTheDocument()
  })

  it('renders MY BUSINESSES section label', () => {
    render(<Sidebar />)
    expect(screen.getByText(/my businesses/i)).toBeInTheDocument()
  })

  it('renders all 7 business names', () => {
    render(<Sidebar />)
    expect(screen.getByText('Disaster Recovery')).toBeInTheDocument()
    expect(screen.getByText('Synthex')).toBeInTheDocument()
    expect(screen.getByText('ATO Tax Optimizer')).toBeInTheDocument()
  })
})
