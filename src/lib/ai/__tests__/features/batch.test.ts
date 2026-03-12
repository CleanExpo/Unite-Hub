// src/lib/ai/__tests__/features/batch.test.ts
// Unit tests for the Batch API queue and status management.

import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/ai/client', () => ({
  getAIClient: vi.fn(() => ({
    messages: {
      batches: {
        create: vi.fn().mockResolvedValue({
          id: 'batch_abc123',
          processing_status: 'in_progress',
        }),
        retrieve: vi.fn().mockResolvedValue({
          id: 'batch_abc123',
          processing_status: 'ended',
          results_url: 'https://api.anthropic.com/results/batch_abc123',
        }),
      },
    },
  })),
}))

import { createBatch, checkBatchStatus, buildBatchRequest } from '../../features/batch'

describe('Batch API', () => {
  it('createBatch returns id and status', async () => {
    const requests = [
      buildBatchRequest('req-1', {
        model: 'claude-sonnet-4-20250514',
        maxTokens: 1024,
        messages: [{ role: 'user', content: 'Hello' }],
      }),
    ]
    const result = await createBatch(requests)
    expect(result.id).toBe('batch_abc123')
    expect(result.status).toBe('in_progress')
  })

  it('checkBatchStatus returns status and resultsUrl', async () => {
    const result = await checkBatchStatus('batch_abc123')
    expect(result.id).toBe('batch_abc123')
    expect(result.status).toBe('ended')
    expect(result.resultsUrl).toBe('https://api.anthropic.com/results/batch_abc123')
  })

  it('buildBatchRequest produces correct structure', () => {
    const req = buildBatchRequest('custom-1', {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 2048,
      system: 'You are helpful.',
      messages: [{ role: 'user', content: 'Summarise this.' }],
    })
    expect(req.custom_id).toBe('custom-1')
    expect(req.params.model).toBe('claude-sonnet-4-20250514')
    expect(req.params.max_tokens).toBe(2048)
    expect(req.params.system).toBe('You are helpful.')
    expect(req.params.messages).toHaveLength(1)
  })
})
