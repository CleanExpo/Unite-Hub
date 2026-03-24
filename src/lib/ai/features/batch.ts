// src/lib/ai/features/batch.ts
// Batch API — submit multiple requests, poll for completion, retrieve results.
// 50% cost reduction vs synchronous API; best for non-urgent background crons.

import type Anthropic from '@anthropic-ai/sdk'
import { getAIClient } from '@/lib/ai/client'

// ── Request types ────────────────────────────────────────────────────────────

/** A single request within a batch. Mirrors MessageCreateParams. */
export interface BatchRequest {
  custom_id: string
  params: {
    model: string
    max_tokens: number
    system?: string
    messages: Anthropic.MessageParam[]
    tools?: Anthropic.Tool[]
    tool_choice?: Anthropic.ToolChoice
    temperature?: number
  }
}

// ── Result types ─────────────────────────────────────────────────────────────

/** Status snapshot returned from batch create or retrieve. */
export interface BatchResult {
  id: string
  status: string
  resultsUrl?: string
}

/** A single completed result from a finished batch. */
export interface BatchItemResult {
  customId: string
  status: 'succeeded' | 'errored' | 'canceled' | 'expired'
  /** Present when status === 'succeeded'. */
  message?: {
    content: unknown[]
    usage: { input_tokens: number; output_tokens: number }
    model: string
  }
  /** Present when status === 'errored'. */
  error?: { type: string; message: string }
}

// ── Polling config ───────────────────────────────────────────────────────────

const DEFAULT_POLL_INTERVAL_MS = 5_000   // 5 s
const DEFAULT_TIMEOUT_MS       = 240_000 // 4 min (cron max is 5 min)

// ── API helpers ──────────────────────────────────────────────────────────────

/**
 * Builds a BatchRequest from a config object (convenience wrapper).
 */
export function buildBatchRequest(
  customId: string,
  config: {
    model: string
    maxTokens: number
    system?: string
    messages: Anthropic.MessageParam[]
    tools?: Anthropic.Tool[]
    tool_choice?: Anthropic.ToolChoice
    temperature?: number
  }
): BatchRequest {
  return {
    custom_id: customId,
    params: {
      model: config.model,
      max_tokens: config.maxTokens,
      ...(config.system ? { system: config.system } : {}),
      messages: config.messages,
      ...(config.tools ? { tools: config.tools } : {}),
      ...(config.tool_choice ? { tool_choice: config.tool_choice } : {}),
      ...(config.temperature !== undefined ? { temperature: config.temperature } : {}),
    },
  }
}

/**
 * Submits a batch of message requests to the Anthropic Batch API.
 * Returns the batch ID and initial processing status ('in_progress').
 */
export async function createBatch(requests: BatchRequest[]): Promise<BatchResult> {
  const client = getAIClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Batch API types not yet in stable SDK
  const batch = await (client.messages.batches as any).create({ requests })
  return {
    id: batch.id,
    status: batch.processing_status,
  }
}

/**
 * Checks the processing status of an existing batch.
 * status === 'ended' means all requests have finished (check individual results for success/error).
 */
export async function checkBatchStatus(batchId: string): Promise<BatchResult> {
  const client = getAIClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Batch API types not yet in stable SDK
  const batch = await (client.messages.batches as any).retrieve(batchId)
  return {
    id: batch.id,
    status: batch.processing_status,
    ...(batch.results_url ? { resultsUrl: batch.results_url } : {}),
  }
}

/**
 * Fetches all completed results for an ended batch.
 * Only call this after checkBatchStatus returns status === 'ended'.
 */
export async function retrieveBatchResults(batchId: string): Promise<BatchItemResult[]> {
  const client = getAIClient()
  const results: BatchItemResult[] = []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Batch API types not yet in stable SDK
  for await (const item of await (client.messages.batches as any).results(batchId)) {
    results.push({
      customId: item.custom_id,
      status: item.result.type as BatchItemResult['status'],
      ...(item.result.message
        ? {
            message: {
              content: item.result.message.content as unknown[],
              usage: {
                input_tokens: item.result.message.usage.input_tokens as number,
                output_tokens: item.result.message.usage.output_tokens as number,
              },
              model: item.result.message.model as string,
            },
          }
        : {}),
      ...(item.result.error ? { error: item.result.error as { type: string; message: string } } : {}),
    })
  }

  return results
}

/**
 * Polls a batch until it reaches 'ended' status, then returns all results.
 * Returns null if the timeout expires before the batch completes.
 *
 * @param batchId - The batch ID from createBatch()
 * @param opts.pollIntervalMs - How often to check (default 5 s)
 * @param opts.timeoutMs - Give up after this many ms (default 4 min)
 */
export async function pollBatchUntilDone(
  batchId: string,
  opts: { pollIntervalMs?: number; timeoutMs?: number } = {}
): Promise<BatchItemResult[] | null> {
  const pollInterval = opts.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
  const deadline = Date.now() + (opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  while (Date.now() < deadline) {
    const status = await checkBatchStatus(batchId)

    if (status.status === 'ended') {
      return retrieveBatchResults(batchId)
    }

    // Wait before next poll — don't spin-wait
    await new Promise<void>((resolve) => setTimeout(resolve, pollInterval))
  }

  return null // Timed out — caller should handle gracefully
}
