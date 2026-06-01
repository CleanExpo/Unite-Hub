import { describe, expect, it } from 'vitest'
import { POST } from '../route'

function request(body: unknown): Request {
  return new Request('http://localhost/api/pi/route', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/pi/route', () => {
  it('turns a founder message into a task packet, context pack, and machine assignment', async () => {
    const response = await POST(
      request({
        message: 'Build the Unite-Hub command centre panel for run queue visibility.',
        now: '2026-06-02T00:00:00.000Z',
        idSeed: 'command-centre',
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.taskPacket.portfolioTarget).toBe('unite_hub')
    expect(body.taskPacket.taskType).toBe('code_change')
    expect(body.contextPack.id).toBe(body.taskPacket.contextPackId)
    expect(body.machineAssignment.status).toBe('assigned')
    expect(body.machineAssignment.assignedDeviceId).toBe('windows-desktop')
    expect(body.receipt.status).toBe('routed')
  })

  it('routes high-risk social account work to approval rather than execution', async () => {
    const response = await POST(
      request({
        message: 'Connect Synthex LinkedIn and Facebook accounts for publishing.',
        now: '2026-06-02T00:00:00.000Z',
        idSeed: 'synthex-social',
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.taskPacket.riskLevel).toBe('high')
    expect(body.taskPacket.requiresHumanApproval).toBe(true)
    expect(body.machineAssignment.assignedDeviceId).toBe('macbook-pro')
    expect(body.receipt.requiresHumanApproval).toBe(true)
  })

  it('rejects missing founder messages', async () => {
    const response = await POST(request({ message: '   ' }))
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('message is required')
  })
})
