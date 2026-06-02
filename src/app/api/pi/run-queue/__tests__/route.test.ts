import { describe, expect, it } from 'vitest'
import { GET, POST } from '../route'

function request(body: unknown): Request {
  return new Request('http://localhost/api/pi/run-queue', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/pi/run-queue', () => {
  it('routes and enqueues a founder message in one call', async () => {
    const response = await POST(
      request({
        message: 'Build the next Pi queue control panel.',
        now: '2026-06-02T00:00:00.000Z',
        idSeed: 'queue-panel',
      }),
    )
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.queueItem.status).toBe('queued')
    expect(body.queueItem.taskPacket.portfolioTarget).toBe('pi_dev_ops')
    expect(body.queueItem.machineAssignment.assignedDeviceId).toBe('windows-desktop')
    expect(body.enforcement.mode).toBe('continue_until_complete')
    expect(body.enforcement.canOpenNextLane).toBe(false)
    expect(body.receipt.status).toBe('queued')
  })

  it('returns queued items through GET', async () => {
    await POST(request({ message: 'Research Kimi model routing.', idSeed: 'kimi-route', now: '2026-06-02T00:00:00.000Z' }))

    const response = await GET()
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.items.length).toBeGreaterThan(0)
    expect(body.summary.total).toBe(body.items.length)
    expect(body.enforcement.openWorkCount).toBeGreaterThan(0)
    expect(body.enforcement.requiredAction).toContain('before opening the next build lane')
  })
})
