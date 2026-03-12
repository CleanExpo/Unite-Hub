// src/lib/ai/features/batch.ts
// Batch API — queue multiple message requests and check their status.

import { getAIClient } from '@/lib/ai/client'

/** A single request within a batch. */
export interface BatchRequest {
  custom_id: string
  params: {
    model: string
    max_tokens: number
    system?: string
    messages: { role: 'user' | 'assistant'; content: string }[]
  }
}

/** Result returned from batch creation or status check. */
export interface BatchResult {
  id: string
  status: string
  resultsUrl?: string
}

/**
 * Builds a BatchRequest from a friendlier config shape.
 */
export function buildBatchRequest(
  customId: string,
  config: {
    model: string
    maxTokens: number
    system?: string
    messages: { role: 'user' | 'assistant'; content: string }[]
  }
): BatchRequest {
  return {
    custom_id: customId,
    params: {
      model: config.model,
      max_tokens: config.maxTokens,
      ...(config.system ? { system: config.system } : {}),
      messages: config.messages,
    },
  }
}

/**
 * Submits a batch of message requests to the Anthropic Batch API.
 * Returns the batch ID and current processing status.
 */
export async function createBatch(requests: BatchRequest[]): Promise<BatchResult> {
  const client = getAIClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Batch API types not yet in SDK
  const batch = await (client.messages.batches as any).create({ requests })
  return {
    id: batch.id,
    status: batch.processing_status,
  }
}

/**
 * Checks the processing status of an existing batch.
 * Returns the batch ID, current status, and results URL when available.
 */
export async function checkBatchStatus(batchId: string): Promise<BatchResult> {
  const client = getAIClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Batch API types not yet in SDK
  const batch = await (client.messages.batches as any).retrieve(batchId)
  return {
    id: batch.id,
    status: batch.processing_status,
    ...(batch.results_url ? { resultsUrl: batch.results_url } : {}),
  }
}
