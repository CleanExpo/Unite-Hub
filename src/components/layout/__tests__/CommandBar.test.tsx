// src/components/layout/__tests__/CommandBar.test.tsx
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CommandBar } from '../CommandBar'
import { useUIStore } from '@/store/ui'

vi.mock('@/components/ui/command', () => ({
  CommandDialog: ({ children, open, onOpenChange }: any) =>
    open ? <div data-testid="command-dialog" role="dialog">{children}</div> : null,
  CommandInput: ({ onValueChange, placeholder, value }: any) => (
    <input
      data-testid="command-input"
      placeholder={placeholder}
      value={value ?? ''}
      onChange={(e) => onValueChange?.(e.target.value)}
    />
  ),
  CommandList: ({ children }: any) => <div data-testid="command-list">{children}</div>,
  CommandEmpty: ({ children }: any) => <div data-testid="command-empty">{children}</div>,
  CommandGroup: ({ heading, children }: any) =>
    <div data-testid={`group-${heading}`} data-heading={heading}><span>{heading}</span>{children}</div>,
  CommandItem: ({ children, onSelect }: any) =>
    <div data-testid="command-item" onClick={() => onSelect?.()} role="option" aria-selected={false}>{children}</div>,
  CommandShortcut: ({ children }: any) => <span>{children}</span>,
}))

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

const mockToggleCommandBar = vi.fn()
const mockToggleCapture = vi.fn()

vi.mock('@/store/ui', () => ({
  useUIStore: vi.fn((selector?: (s: any) => any) => {
    const state = {
      commandBarOpen: true,
      toggleCommandBar: mockToggleCommandBar,
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
      toggleCapture: mockToggleCapture,
    }
    return selector ? selector(state) : state
  })
}

describe('CommandBar', () => {
  beforeEach(() => {
    mockPush.mockClear()
    mockToggleCommandBar.mockClear()
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

  // ─── NEW TESTS (Task 3) ─────────────────────────────────────────────────────

  describe('search mode', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
      vi.restoreAllMocks()
    })

    it('shows "Searching…" state while fetch is in-flight', async () => {
      // Fetch never resolves during this test
      vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}))

      render(<CommandBar />)
      const input = screen.getByTestId('command-input')

      // Type 2+ chars to enter search mode
      fireEvent.change(input, { target: { value: 'ja' } })

      // Advance past the 300ms debounce to trigger the fetch
      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // While fetch is still pending, should show "Searching…"
      expect(screen.getByText('Searching…')).toBeInTheDocument()
    })

    it('renders Contacts/Pages/Approvals groups when API returns data', async () => {
      const mockData = {
        contacts: [{ id: '1', name: 'Jane Doe', email: 'jane@test.com', company: 'Acme' }],
        pages: [{ id: '2', title: 'My Page' }],
        approvals: [{ id: '3', title: 'Budget', status: 'pending' }],
      }

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }))

      render(<CommandBar />)
      const input = screen.getByTestId('command-input')

      fireEvent.change(input, { target: { value: 'ja' } })

      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      // Wait for the async fetch + state update to settle
      await act(async () => {})

      expect(screen.getByTestId('group-Contacts')).toBeInTheDocument()
      expect(screen.getByTestId('group-Pages')).toBeInTheDocument()
      expect(screen.getByTestId('group-Approvals')).toBeInTheDocument()
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()
      expect(screen.getByText('My Page')).toBeInTheDocument()
      expect(screen.getByText('Budget')).toBeInTheDocument()
    })

    it('navigates to correct path and closes CommandBar on result select', async () => {
      const mockData = {
        contacts: [{ id: '1', name: 'Jane Doe', email: 'jane@test.com', company: 'Acme' }],
        pages: [],
        approvals: [],
      }

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }))

      render(<CommandBar />)
      const input = screen.getByTestId('command-input')

      fireEvent.change(input, { target: { value: 'ja' } })

      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      await act(async () => {})

      const janeItem = screen.getByText('Jane Doe').closest('[data-testid="command-item"]')!
      fireEvent.click(janeItem)

      expect(mockPush).toHaveBeenCalledWith('/founder/contacts')
      expect(mockToggleCommandBar).toHaveBeenCalled()
    })

    it('clears results when query drops below 2 chars', async () => {
      const mockData = {
        contacts: [{ id: '1', name: 'Jane Doe', email: 'jane@test.com', company: 'Acme' }],
        pages: [],
        approvals: [],
      }

      vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(mockData), { status: 200 }))

      render(<CommandBar />)
      const input = screen.getByTestId('command-input')

      // First: type 2+ chars to get results
      fireEvent.change(input, { target: { value: 'ja' } })

      await act(async () => {
        vi.advanceTimersByTime(300)
      })

      await act(async () => {})

      // Results should be visible
      expect(screen.getByText('Jane Doe')).toBeInTheDocument()

      // Now clear the input — drop below 2 chars
      fireEvent.change(input, { target: { value: '' } })

      await act(async () => {})

      // Results should be gone
      expect(screen.queryByText('Jane Doe')).not.toBeInTheDocument()
      // Nav/Action groups should be back
      expect(screen.getByTestId('group-Navigate')).toBeInTheDocument()
    })
  })
})
