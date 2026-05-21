// src/components/founder/vault/__tests__/VaultLock.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { VaultLock } from '../VaultLock'

// Mock vault-password module
vi.mock('@/lib/vault-password', () => ({
  verifyVaultPassword: vi.fn(),
  resetVaultPassword: vi.fn(),
}))

import { verifyVaultPassword, resetVaultPassword } from '@/lib/vault-password'

const mockVerify = vi.mocked(verifyVaultPassword)
const mockReset = vi.mocked(resetVaultPassword)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('VaultLock — unlock mode', () => {
  it('renders password input with placeholder', () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    expect(screen.getByPlaceholderText(/master password/i)).toBeInTheDocument()
  })

  it('calls onUnlock when password is correct', async () => {
    mockVerify.mockResolvedValue(true)
    const onUnlock = vi.fn()
    render(<VaultLock onUnlock={onUnlock} />)

    const input = screen.getByPlaceholderText(/master password/i)
    fireEvent.change(input, { target: { value: 'correct-pw' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() => expect(onUnlock).toHaveBeenCalled())
  })

  it('shows error with wrong password', async () => {
    mockVerify.mockResolvedValue(false)
    render(<VaultLock onUnlock={vi.fn()} />)

    const input = screen.getByPlaceholderText(/master password/i)
    fireEvent.change(input, { target: { value: 'wrongpassword' } })
    fireEvent.submit(input.closest('form')!)

    await waitFor(() =>
      expect(screen.getByText(/incorrect password/i)).toBeInTheDocument()
    )
  })

  it('shows Forgot password? link', () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument()
  })
})

describe('VaultLock — reset mode', () => {
  it('switches to reset mode when Forgot password clicked', () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    fireEvent.click(screen.getByText(/forgot password/i))
    expect(screen.getByPlaceholderText('New password (min 6 chars)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument()
  })

  it('shows error when password is too short', async () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    fireEvent.click(screen.getByText(/forgot password/i))

    const newPw = screen.getByPlaceholderText('New password (min 6 chars)')
    const confirmPw = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(newPw, { target: { value: 'abc' } })
    fireEvent.change(confirmPw, { target: { value: 'abc' } })
    fireEvent.submit(newPw.closest('form')!)

    await waitFor(() =>
      expect(screen.getByText(/at least 6 characters/i)).toBeInTheDocument()
    )
  })

  it('shows error when passwords do not match', async () => {
    render(<VaultLock onUnlock={vi.fn()} />)
    fireEvent.click(screen.getByText(/forgot password/i))

    const newPw = screen.getByPlaceholderText('New password (min 6 chars)')
    const confirmPw = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(newPw, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmPw, { target: { value: 'differentpw123' } })
    fireEvent.submit(newPw.closest('form')!)

    await waitFor(() =>
      expect(screen.getByText(/do not match/i)).toBeInTheDocument()
    )
  })

  it('calls resetVaultPassword and onUnlock on valid reset', async () => {
    mockReset.mockResolvedValue(undefined)
    const onUnlock = vi.fn()
    render(<VaultLock onUnlock={onUnlock} />)
    fireEvent.click(screen.getByText(/forgot password/i))

    const newPw = screen.getByPlaceholderText('New password (min 6 chars)')
    const confirmPw = screen.getByPlaceholderText('Confirm new password')
    fireEvent.change(newPw, { target: { value: 'newpassword123' } })
    fireEvent.change(confirmPw, { target: { value: 'newpassword123' } })
    fireEvent.submit(newPw.closest('form')!)

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith('newpassword123')
      expect(onUnlock).toHaveBeenCalled()
    })
  })
})
