// src/components/layout/__tests__/CommandBar.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommandBar } from '../CommandBar'
import { useUIStore } from '@/store/ui'

vi.mock('@/components/ui/command', () => ({
  CommandDialog: ({ open, children }: { open: boolean; onOpenChange: () => void; children: React.ReactNode }) =>
    open ? <div data-testid="command-dialog">{children}</div> : null,
  CommandInput: ({ placeholder }: { placeholder?: string }) =>
    <input data-testid="command-input" placeholder={placeholder} />,
  CommandList: ({ children }: { children: React.ReactNode }) =>
    <div data-testid="command-list">{children}</div>,
  CommandEmpty: ({ children }: { children: React.ReactNode }) =>
    <div>{children}</div>,
  CommandGroup: ({ heading, children }: { heading?: string; children: React.ReactNode }) =>
    <div data-testid={`group-${heading}`}><span>{heading}</span>{children}</div>,
  CommandItem: ({ children, onSelect }: { children: React.ReactNode; value?: string; onSelect?: () => void }) =>
    <div data-testid="command-item" onClick={onSelect} role="option">{children}</div>,
  CommandShortcut: ({ children }: { children: React.ReactNode }) =>
    <span>{children}</span>,
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockToggleCommandBar = vi.fn()
const mockToggleBron = vi.fn()
const mockToggleCapture = vi.fn()

vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      commandBarOpen: true,
      toggleCommandBar: mockToggleCommandBar,
      toggleBron: mockToggleBron,
      toggleCapture: mockToggleCapture,
    }
    return selector ? selector(state) : state
  }),
}))

function mockStoreOpen(open: boolean) {
  vi.mocked(useUIStore).mockImplementation((selector?: (s: any) => any) => {
    const state = {
      commandBarOpen: open,
      toggleCommandBar: mockToggleCommandBar,
      toggleBron: mockToggleBron,
      toggleCapture: mockToggleCapture,
    }
    return selector ? selector(state) : state
  })
}

describe('CommandBar', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockToggleCommandBar.mockClear()
    mockToggleBron.mockClear()
    mockToggleCapture.mockClear()
    mockStoreOpen(true)
  })

  it('renders nothing when commandBarOpen is false', () => {
    mockStoreOpen(false)
    const { container } = render(<CommandBar />)
    expect(container.innerHTML).toBe('')
  })

  it('renders dialog when commandBarOpen is true', () => {
    render(<CommandBar />)
    expect(screen.getByTestId('command-dialog')).toBeInTheDocument()
  })

  it('shows all navigation items', () => {
    render(<CommandBar />)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Contacts')).toBeInTheDocument()
    expect(screen.getByText('Vault')).toBeInTheDocument()
    expect(screen.getByText('Approvals')).toBeInTheDocument()
    expect(screen.getByText('Advisory')).toBeInTheDocument()
    expect(screen.getByText('Social')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows action items', () => {
    render(<CommandBar />)
    expect(screen.getByText('Open Bron Chat')).toBeInTheDocument()
    expect(screen.getByText('Capture Idea')).toBeInTheDocument()
  })

  it('navigates to correct path and closes on nav item select', async () => {
    const user = userEvent.setup()
    render(<CommandBar />)
    const dashboardItem = screen.getByText('Dashboard').closest('[data-testid="command-item"]')!
    await user.click(dashboardItem)
    expect(mockPush).toHaveBeenCalledWith('/founder/dashboard')
    expect(mockToggleCommandBar).toHaveBeenCalled()
  })

  it('executes action command and closes on action item select', async () => {
    const user = userEvent.setup()
    render(<CommandBar />)
    const bronItem = screen.getByText('Open Bron Chat').closest('[data-testid="command-item"]')!
    await user.click(bronItem)
    expect(mockToggleBron).toHaveBeenCalled()
    expect(mockToggleCommandBar).toHaveBeenCalled()
  })
})
