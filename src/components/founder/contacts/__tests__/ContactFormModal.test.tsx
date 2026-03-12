import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ContactFormModal } from '../ContactFormModal'
import type { Contact } from '@/types/database'

const mockContact: Contact = {
  id: 'c1',
  founder_id: 'f1',
  business_id: 'dr',
  first_name: 'Jane',
  last_name: 'Smith',
  email: 'jane@example.com',
  phone: '0400111222',
  company: 'Acme Pty Ltd',
  role: 'Director',
  status: 'client',
  tags: ['vip', 'priority'],
  metadata: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

// Mock fetch globally
vi.stubGlobal('fetch', vi.fn())

describe('ContactFormModal', () => {
  const defaultProps = {
    contact: null,
    onClose: vi.fn(),
    onSave: vi.fn(),
  }

  it('renders create mode with "Add Contact" title', () => {
    render(<ContactFormModal {...defaultProps} />)
    expect(screen.getByText('Add Contact')).toBeInTheDocument()
  })

  it('renders edit mode with pre-filled values', () => {
    render(<ContactFormModal {...defaultProps} contact={mockContact} />)
    expect(screen.getByText('Edit Contact')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jane')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Smith')).toBeInTheDocument()
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('0400111222')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Acme Pty Ltd')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Director')).toBeInTheDocument()
    expect(screen.getByDisplayValue('vip, priority')).toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(<ContactFormModal {...defaultProps} onClose={onClose} />)
    fireEvent.click(screen.getByTestId('modal-backdrop'))
    expect(onClose).toHaveBeenCalledOnce()
  })
})
