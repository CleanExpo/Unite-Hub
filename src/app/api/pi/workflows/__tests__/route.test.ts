import { describe, expect, it } from 'vitest'
import { GET } from '../route'

describe('GET /api/pi/workflows', () => {
  it('returns the Pi-Dev-Ops dynamic workflow state for Founder OS visibility', async () => {
    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.workflow.workflowId).toBe('pi-dev-ops-dynamic-workflow-template')
    expect(body.workflow.status).toBe('complete')
    expect(body.workflow.currentGate).toBe('finalise')
    expect(body.workflow.modelRoute.planner).toBe('gpt-5.5-class')
    expect(body.workflow.modelRoute.challenger).toBe('kimi-2.5-class')
    expect(body.workflow.changedFileCount).toBeGreaterThan(0)
    expect(body.workflow.verificationSummary).toContain('pnpm build')
  })
})
