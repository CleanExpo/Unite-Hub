import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ContactsTable } from '../ContactsTable'
import type { Contact } from '@/types/database'

const mockContact: Contact = {
  id: 'c1',
  founder_id: 'f1',
  business_id: null,
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

const mockContactMinimal: Contact = {
  id: 'c2',
  founder_id: 'f1',
  business_id: null,
  first_name: null,
  last_name: null,
  email: null,
  phone: null,
  company: null,
  role: null,
  status: 'lead',
  tags: [],
  metadata: {},
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}

describe('ContactsTable', () => {
  const defaultProps = {
    contacts: [] as Contact[],
    loading: false,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
  }

  it('renders loading state', () => {
    render(<ContactsTable {...defaultProps} loading={true} />)
    expect(screen.getByText('Loading contacts...')).toBeInTheDocument()
  })

  it('renders empty state when no contacts', () => {
    render(<ContactsTable {...defaultProps} />)
    expect(screen.getByText('No contacts yet')).toBeInTheDocument()
  })

  it('renders contact rows with full name', () => {
    render(<ContactsTable {...defaultProps} contacts={[mockContact]} />)
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Acme Pty Ltd')).toBeInTheDocument()
  })

  it('renders dash for contacts with no name', () => {
    render(<ContactsTable {...defaultProps} contacts={[mockContactMinimal]} />)
    const dashes = screen.getAllByText('—')
    // Name, email, company all render as dash for minimal contact
    expect(dashes.length).toBeGreaterThanOrEqual(1)
  })

  it('renders status badges with correct text', () => {
    const contacts: Contact[] = [
      { ...mockContact, id: 'a', status: 'lead' },
      { ...mockContact, id: 'b', status: 'prospect' },
      { ...mockContact, id: 'c', status: 'client' },
      { ...mockContact, id: 'd', status: 'churned' },
      { ...mockContact, id: 'e', status: 'archived' },
    ]
    render(<ContactsTable {...defaultProps} contacts={contacts} />)
    expect(screen.getByText('lead')).toBeInTheDocument()
    expect(screen.getByText('prospect')).toBeInTheDocument()
    expect(screen.getByText('client')).toBeInTheDocument()
    expect(screen.getByText('churned')).toBeInTheDocument()
    expect(screen.getByText('archived')).toBeInTheDocument()
  })

  it('renders tag pills', () => {
    render(<ContactsTable {...defaultProps} contacts={[mockContact]} />)
    expect(screen.getByText('vip')).toBeInTheDocument()
    expect(screen.getByText('priority')).toBeInTheDocument()
  })
})
