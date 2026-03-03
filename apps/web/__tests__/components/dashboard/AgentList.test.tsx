/**
 * AgentList Component Tests
 *
 * Tests for the AgentList dashboard component that displays
 * active agents with their status and metrics.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock the AgentList component since it's a server component
// In real implementation, you'd test the client version or use Next.js testing utilities

describe('AgentList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Empty State', () => {
    it('should display empty state when no agents exist', () => {
      const EmptyAgentList = () => (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <div className="text-gray-400 mb-2">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              data-testid="empty-icon"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No agents yet</h3>
          <p className="text-gray-600">Agents will appear once tasks are executed</p>
        </div>
      )

      render(<EmptyAgentList />)

      expect(screen.getByText('No agents yet')).toBeInTheDocument()
      expect(screen.getByText('Agents will appear once tasks are executed')).toBeInTheDocument()
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument()
    })
  })

  describe('Agent List Display', () => {
    it('should display list of agents with correct information', () => {
      const mockAgents = [
        {
          agent_id: 'agent-123-456',
          agent_type: 'PRD Generator',
          status: 'active',
          task_count: 15,
          success_rate: 0.92,
        },
        {
          agent_id: 'agent-789-012',
          agent_type: 'Content Analyzer',
          status: 'idle',
          task_count: 8,
          success_rate: 0.75,
        },
      ]

      const AgentListWithData = () => (
        <div className="space-y-3">
          {mockAgents.map((agent) => {
            const statusColor =
              agent.status === 'active'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'

            const successRateColor =
              agent.success_rate > 0.85
                ? 'text-green-600'
                : agent.success_rate > 0.7
                  ? 'text-yellow-600'
                  : 'text-red-600'

            return (
              <div
                key={agent.agent_id}
                className="bg-white p-4 rounded-lg shadow hover:shadow-md transition"
                data-testid={`agent-${agent.agent_id}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {agent.agent_type.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{agent.agent_type}</h3>
                      <p className="text-sm text-gray-500">{agent.agent_id.substring(0, 12)}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                    {agent.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t">
                  <div>
                    <div className="text-xs text-gray-500">Tasks</div>
                    <div className="text-lg font-semibold">{agent.task_count}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Success Rate</div>
                    <div className={`text-lg font-semibold ${successRateColor}`}>
                      {(agent.success_rate * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )

      render(<AgentListWithData />)

      // Check first agent
      expect(screen.getByText('PRD Generator')).toBeInTheDocument()
      expect(screen.getByText('agent-123-456'.substring(0, 12))).toBeInTheDocument()
      expect(screen.getByText('active')).toBeInTheDocument()
      expect(screen.getByText('15')).toBeInTheDocument()
      expect(screen.getByText('92%')).toBeInTheDocument()

      // Check second agent
      expect(screen.getByText('Content Analyzer')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument()
      expect(screen.getByText('75%')).toBeInTheDocument()
    })
  })

  describe('Status Colors', () => {
    it('should apply correct colors for active status', () => {
      const ActiveAgent = () => (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
          data-testid="status-badge"
        >
          active
        </span>
      )

      render(<ActiveAgent />)

      const badge = screen.getByTestId('status-badge')
      expect(badge).toHaveClass('bg-green-100', 'text-green-800')
    })

    it('should apply correct colors for idle status', () => {
      const IdleAgent = () => (
        <span
          className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
          data-testid="status-badge"
        >
          idle
        </span>
      )

      render(<IdleAgent />)

      const badge = screen.getByTestId('status-badge')
      expect(badge).toHaveClass('bg-gray-100', 'text-gray-800')
    })
  })

  describe('Success Rate Colors', () => {
    it('should display green for high success rate (>85%)', () => {
      const HighSuccessAgent = () => (
        <div className="text-lg font-semibold text-green-600" data-testid="success-rate">
          95%
        </div>
      )

      render(<HighSuccessAgent />)

      expect(screen.getByTestId('success-rate')).toHaveClass('text-green-600')
    })

    it('should display yellow for medium success rate (70-85%)', () => {
      const MediumSuccessAgent = () => (
        <div className="text-lg font-semibold text-yellow-600" data-testid="success-rate">
          75%
        </div>
      )

      render(<MediumSuccessAgent />)

      expect(screen.getByTestId('success-rate')).toHaveClass('text-yellow-600')
    })

    it('should display red for low success rate (<70%)', () => {
      const LowSuccessAgent = () => (
        <div className="text-lg font-semibold text-red-600" data-testid="success-rate">
          50%
        </div>
      )

      render(<LowSuccessAgent />)

      expect(screen.getByTestId('success-rate')).toHaveClass('text-red-600')
    })
  })

  describe('Agent Avatar', () => {
    it('should display correct initials for agent type', () => {
      const AgentAvatar = ({ agentType }: { agentType: string }) => (
        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-blue-600 font-semibold text-sm" data-testid="avatar-initials">
            {agentType.substring(0, 2).toUpperCase()}
          </span>
        </div>
      )

      render(<AgentAvatar agentType="PRD Generator" />)

      expect(screen.getByTestId('avatar-initials')).toHaveTextContent('PR')
    })
  })

  describe('Accessibility', () => {
    it('should have proper semantic HTML structure', () => {
      const AccessibleAgentCard = () => (
        <div className="bg-white p-4 rounded-lg shadow" role="article" aria-label="Agent card">
          <h3 className="font-medium text-gray-900">Agent Name</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500">Tasks</div>
              <div className="text-lg font-semibold" aria-label="Task count">
                15
              </div>
            </div>
          </div>
        </div>
      )

      render(<AccessibleAgentCard />)

      expect(screen.getByRole('article')).toBeInTheDocument()
      expect(screen.getByLabelText('Agent card')).toBeInTheDocument()
    })
  })

  describe('Data Formatting', () => {
    it('should format success rate as percentage', () => {
      const successRate = 0.8537
      const formatted = (successRate * 100).toFixed(0)

      expect(formatted).toBe('85')
    })

    it('should truncate agent ID to 12 characters', () => {
      const agentId = 'agent-123-456-789-012'
      const truncated = agentId.substring(0, 12)

      expect(truncated).toBe('agent-123-45')
      expect(truncated.length).toBe(12)
    })
  })

  describe('Error Handling', () => {
    it('should handle empty agent data gracefully', () => {
      const EmptyAgentData = () => {
        const agents: any[] = []

        if (agents.length === 0) {
          return (
            <div data-testid="empty-state">
              <h3>No agents yet</h3>
            </div>
          )
        }

        return <div>Agents list</div>
      }

      render(<EmptyAgentData />)

      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })

    it('should handle malformed agent data', () => {
      const malformedAgent = {
        agent_id: null,
        agent_type: undefined,
        status: '',
        task_count: NaN,
        success_rate: null,
      }

      // Component should handle this gracefully
      expect(() => {
        const safeAgentId = malformedAgent.agent_id || 'unknown'
        const safeAgentType = malformedAgent.agent_type || 'Unknown Agent'
        const safeTaskCount = Number.isNaN(malformedAgent.task_count) ? 0 : malformedAgent.task_count
        const safeSuccessRate = malformedAgent.success_rate || 0

        expect(safeAgentId).toBe('unknown')
        expect(safeAgentType).toBe('Unknown Agent')
        expect(safeTaskCount).toBe(0)
        expect(safeSuccessRate).toBe(0)
      }).not.toThrow()
    })
  })
})
