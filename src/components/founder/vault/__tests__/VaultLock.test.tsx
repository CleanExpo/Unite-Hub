import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { VaultLock } from '../VaultLock'

describe('VaultLock', () => {
  it('renders password input', () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    expect(screen.getByPlaceholderText(/master password/i)).toBeInTheDocument()
  })

  it('calls onUnlock with correct password', () => {
    const onUnlock = vi.fn()
    render(<VaultLock onUnlock={onUnlock} />)
    const input = screen.getByPlaceholderText(/master password/i)
    fireEvent.change(input, { target: { value: 'nexus2026' } })
    fireEvent.submit(input.closest('form')!)
    expect(onUnlock).toHaveBeenCalled()
  })

  it('shows error with wrong password', () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    const input = screen.getByPlaceholderText(/master password/i)
    fireEvent.change(input, { target: { value: 'wrongpassword' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
  })
})
