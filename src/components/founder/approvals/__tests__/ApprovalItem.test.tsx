import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ApprovalItem } from '../ApprovalItem'

vi.mock('framer-motion', () => ({
  motion: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    div: ({ children, className, style }: any) => (
      <div className={className} style={style}>{children}</div>
    ),
  },
}))

const mockProps = {
  id: '1',
  businessColor: '#a855f7',
  action: 'Post to LinkedIn',
  detail: 'Monthly performance update',
  requestedBy: 'Bron AI',
  requestedAt: '09/03/2026 09:00',
  onApprove: vi.fn(),
  onReject: vi.fn(),
}

describe('ApprovalItem', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('renders action text', () => {
    render(<ApprovalItem {...mockProps} />)
    expect(screen.getByText('Post to LinkedIn')).toBeInTheDocument()
  })

  it('calls onApprove with id when Approve clicked', () => {
    const onApprove = vi.fn()
    render(<ApprovalItem {...mockProps} onApprove={onApprove} />)
    fireEvent.click(screen.getByText('Approve'))
    vi.advanceTimersByTime(200)
    expect(onApprove).toHaveBeenCalledWith('1')
  })

  it('calls onReject with id when Reject clicked', () => {
    const onReject = vi.fn()
    render(<ApprovalItem {...mockProps} onReject={onReject} />)
    fireEvent.click(screen.getByText('Reject'))
    vi.advanceTimersByTime(200)
    expect(onReject).toHaveBeenCalledWith('1')
  })
})
