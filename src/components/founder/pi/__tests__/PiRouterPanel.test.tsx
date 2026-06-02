import { render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PiRouterPanel } from '../PiRouterPanel'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('PiRouterPanel workflow visibility', () => {
  it('surfaces Pi-Dev-Ops Dynamic Workflow evidence in the control rail', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [],
          summary: { total: 0, queued: 0, waitingForApproval: 0, waitingForDevice: 0, inProgress: 0, blocked: 0, completed: 0 },
        }),
      } as unknown as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          workflow: {
            workflowId: 'pi-dev-ops-dynamic-workflow-template',
            evidenceId: 'pi-dev-ops-dynamic-workflows-pathway-2026-06-02',
            status: 'complete',
            currentGate: 'finalise',
            changedFileCount: 4,
            verificationSummary: 'pnpm build: PASS',
            nextAction: 'Surface this workflow in Founder OS, then open the next gated build lane.',
            modelRoute: {
              planner: 'gpt-5.5-class',
              implementer: 'gpt-5.5-class',
              challenger: 'kimi-2.5-class',
              opusUltrathink: 'explicit Claude Code OAuth/subscription only',
            },
            requiresMargotReview: true,
            threeLoopRequired: true,
          },
        }),
      } as unknown as Response)

    render(<PiRouterPanel />)

    await waitFor(() => expect(screen.getByText('Senior engineer gate')).toBeInTheDocument())
    expect(screen.getByText('pi-dev-ops-dynamic-workflow-template')).toBeInTheDocument()
    expect(screen.getByText('finalise')).toBeInTheDocument()
    expect(screen.getByText('gpt-5.5-class')).toBeInTheDocument()
    expect(screen.getByText('kimi-2.5-class')).toBeInTheDocument()
    expect(screen.getByText('pnpm build: PASS')).toBeInTheDocument()
  })
})
