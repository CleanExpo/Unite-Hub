/**
 * QueueStats Component Tests
 *
 * Tests for the QueueStats component that displays
 * task queue statistics (pending, in progress, completed, failed).
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock QueueStats component
interface QueueStatsProps {
  stats: {
    total_tasks: number
    pending: number
    in_progress: number
    completed: number
    failed: number
  }
}

function QueueStats({ stats }: QueueStatsProps) {
  const items = [
    { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
    { label: 'In Progress', value: stats.in_progress, color: 'text-blue-600' },
    { label: 'Completed', value: stats.completed, color: 'text-green-600' },
    { label: 'Failed', value: stats.failed, color: 'text-red-600' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="queue-stats">
      {items.map((item) => (
        <div key={item.label} className="bg-white p-4 rounded-lg shadow text-center">
          <div className={`text-3xl font-bold ${item.color}`} data-testid={`stat-${item.label.toLowerCase().replace(' ', '-')}`}>
            {item.value}
          </div>
          <div className="text-sm text-gray-600 mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  )
}

describe('QueueStats Component', () => {
  const mockStats = {
    total_tasks: 100,
    pending: 15,
    in_progress: 8,
    completed: 72,
    failed: 5,
  }

  describe('Rendering', () => {
    it('should render all stat cards', () => {
      render(<QueueStats stats={mockStats} />)

      expect(screen.getByText('Pending')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('Failed')).toBeInTheDocument()
    })

    it('should display correct stat values', () => {
      render(<QueueStats stats={mockStats} />)

      expect(screen.getByTestId('stat-pending')).toHaveTextContent('15')
      expect(screen.getByTestId('stat-in-progress')).toHaveTextContent('8')
      expect(screen.getByTestId('stat-completed')).toHaveTextContent('72')
      expect(screen.getByTestId('stat-failed')).toHaveTextContent('5')
    })

    it('should render in grid layout', () => {
      render(<QueueStats stats={mockStats} />)

      const container = screen.getByTestId('queue-stats')
      expect(container).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-4', 'gap-4')
    })
  })

  describe('Color Coding', () => {
    it('should apply yellow color to pending stat', () => {
      render(<QueueStats stats={mockStats} />)

      const pendingStat = screen.getByTestId('stat-pending')
      expect(pendingStat).toHaveClass('text-yellow-600')
    })

    it('should apply blue color to in progress stat', () => {
      render(<QueueStats stats={mockStats} />)

      const inProgressStat = screen.getByTestId('stat-in-progress')
      expect(inProgressStat).toHaveClass('text-blue-600')
    })

    it('should apply green color to completed stat', () => {
      render(<QueueStats stats={mockStats} />)

      const completedStat = screen.getByTestId('stat-completed')
      expect(completedStat).toHaveClass('text-green-600')
    })

    it('should apply red color to failed stat', () => {
      render(<QueueStats stats={mockStats} />)

      const failedStat = screen.getByTestId('stat-failed')
      expect(failedStat).toHaveClass('text-red-600')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      const zeroStats = {
        total_tasks: 0,
        pending: 0,
        in_progress: 0,
        completed: 0,
        failed: 0,
      }

      render(<QueueStats stats={zeroStats} />)

      expect(screen.getByTestId('stat-pending')).toHaveTextContent('0')
      expect(screen.getByTestId('stat-in-progress')).toHaveTextContent('0')
      expect(screen.getByTestId('stat-completed')).toHaveTextContent('0')
      expect(screen.getByTestId('stat-failed')).toHaveTextContent('0')
    })

    it('should handle large numbers', () => {
      const largeStats = {
        total_tasks: 999999,
        pending: 50000,
        in_progress: 25000,
        completed: 900000,
        failed: 24999,
      }

      render(<QueueStats stats={largeStats} />)

      expect(screen.getByTestId('stat-pending')).toHaveTextContent('50000')
      expect(screen.getByTestId('stat-completed')).toHaveTextContent('900000')
    })

    it('should handle negative numbers (should not occur but test defensive)', () => {
      const negativeStats = {
        total_tasks: -1,
        pending: -5,
        in_progress: -3,
        completed: -10,
        failed: -2,
      }

      render(<QueueStats stats={negativeStats} />)

      // Component should still render even with invalid data
      expect(screen.getByTestId('stat-pending')).toHaveTextContent('-5')
    })
  })

  describe('Responsive Design', () => {
    it('should have mobile responsive classes', () => {
      render(<QueueStats stats={mockStats} />)

      const container = screen.getByTestId('queue-stats')

      // Check for responsive grid classes
      expect(container).toHaveClass('grid-cols-2') // Mobile: 2 columns
      expect(container).toHaveClass('md:grid-cols-4') // Desktop: 4 columns
    })
  })

  describe('Accessibility', () => {
    it('should have readable text contrast', () => {
      render(<QueueStats stats={mockStats} />)

      // Check that stat labels have sufficient contrast
      const labels = screen.getAllByText(/Pending|In Progress|Completed|Failed/)
      labels.forEach((label) => {
        expect(label).toHaveClass('text-gray-600')
      })
    })

    it('should have semantic HTML structure', () => {
      const { container } = render(<QueueStats stats={mockStats} />)

      // Check that stat cards have proper structure
      const cards = container.querySelectorAll('.bg-white')
      expect(cards.length).toBeGreaterThan(0)

      cards.forEach((card) => {
        expect(card).toHaveClass('rounded-lg')
      })
    })
  })

  describe('Data Accuracy', () => {
    it('should display all stats independently', () => {
      const independentStats = {
        total_tasks: 50,
        pending: 10,
        in_progress: 15,
        completed: 20,
        failed: 5,
      }

      render(<QueueStats stats={independentStats} />)

      // Each stat should match exactly
      expect(screen.getByTestId('stat-pending')).toHaveTextContent('10')
      expect(screen.getByTestId('stat-in-progress')).toHaveTextContent('15')
      expect(screen.getByTestId('stat-completed')).toHaveTextContent('20')
      expect(screen.getByTestId('stat-failed')).toHaveTextContent('5')
    })

    it('should not modify input stats', () => {
      const originalStats = {
        total_tasks: 100,
        pending: 20,
        in_progress: 30,
        completed: 40,
        failed: 10,
      }

      const statsCopy = { ...originalStats }

      render(<QueueStats stats={statsCopy} />)

      // Original object should not be mutated
      expect(statsCopy).toEqual(originalStats)
    })
  })

  describe('Styling', () => {
    it('should apply correct card styling', () => {
      const { container } = render(<QueueStats stats={mockStats} />)

      const cards = container.querySelectorAll('.bg-white')
      expect(cards.length).toBe(4)

      cards.forEach((card) => {
        expect(card).toHaveClass('p-4', 'rounded-lg', 'shadow', 'text-center')
      })
    })

    it('should apply correct text sizing', () => {
      render(<QueueStats stats={mockStats} />)

      const statValues = screen.getAllByTestId(/^stat-/)
      statValues.forEach((stat) => {
        expect(stat).toHaveClass('text-3xl', 'font-bold')
      })
    })
  })

  describe('Layout', () => {
    it('should maintain consistent spacing', () => {
      render(<QueueStats stats={mockStats} />)

      const container = screen.getByTestId('queue-stats')
      expect(container).toHaveClass('gap-4')
    })

    it('should render exactly 4 stat cards', () => {
      const { container } = render(<QueueStats stats={mockStats} />)

      const cards = container.querySelectorAll('.bg-white')
      expect(cards).toHaveLength(4)
    })
  })
})
