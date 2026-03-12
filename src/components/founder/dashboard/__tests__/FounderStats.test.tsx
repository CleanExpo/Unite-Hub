// src/components/founder/dashboard/__tests__/FounderStats.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'

// Mock framer-motion (same pattern as KPICard tests)
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, className, style, ...rest }: Record<string, unknown>) => (
      <div className={className as string} style={style as Record<string, string>} {...rest}>
        {children as React.ReactNode}
      </div>
    ),
  },
}))

import { FounderStats } from '../FounderStats'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('FounderStats', () => {
  it('renders loading state initially', () => {
    global.fetch = vi.fn().mockImplementation(() => new Promise(() => {})) // never resolves
    render(<FounderStats />)
    expect(screen.getByText('Founder Overview')).toBeDefined()
    // All stat values show dash while loading
    const dashes = screen.getAllByText('\u2014')
    expect(dashes.length).toBeGreaterThanOrEqual(4)
  })

  it('renders stats after fetch', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        contacts: 25,
        vaultEntries: 12,
        pendingApprovals: 3,
        activeCases: 2,
        lastBookkeeperRun: { status: 'completed', createdAt: '2026-03-12T00:00:00Z' },
      }),
    })

    render(<FounderStats />)

    await waitFor(() => {
      expect(screen.getByText('25')).toBeDefined()
    })
    expect(screen.getByText('12')).toBeDefined()
    expect(screen.getByText('3')).toBeDefined()
    expect(screen.getByText('2')).toBeDefined()
    expect(screen.getByText('Contacts')).toBeDefined()
    expect(screen.getByText('Vault')).toBeDefined()
    expect(screen.getByText('Pending')).toBeDefined()
    expect(screen.getByText('Cases')).toBeDefined()
  })

  it('renders zero values on fetch error', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false })

    render(<FounderStats />)

    await waitFor(() => {
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(4)
    })
  })
})
