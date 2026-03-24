// src/lib/ai/router.ts
// Capability registry and execute dispatcher for the centralised AI service layer.
// Register capabilities, then call execute(id, input) to dispatch AI requests.

import type Anthropic from '@anthropic-ai/sdk'
import { getAIClient } from './client'
import type { AICapability, AIResponse, RequestContext } from './types'
import { zodToToolSchema, parseStructuredResponse } from './features/structured'
import { createBatch, pollBatchUntilDone, buildBatchRequest, type BatchItemResult } from './features/batch'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ExecuteInput {
  messages: Anthropic.MessageParam[]
  context?: RequestContext
  /**
   * Override the capability's system prompt for this call.
   * Use when the system prompt must be built from call-time data (e.g. brand identity,
   * platform, or user context) rather than static capability config.
   */
  systemPrompt?: string
}

// ── Registry ────────────────────────────────────────────────────────────────

const _registry = new Map<string, AICapability>()

/** Register a capability in the router. Overwrites if id already exists. */
export function registerCapability(cap: AICapability): void {
  _registry.set(cap.id, cap)
}

/** Retrieve a registered capability by id. */
export function getCapability(id: string): AICapability | undefined {
  return _registry.get(id)
}

/** List all registered capability ids. */
export function listCapabilities(): string[] {
  return Array.from(_registry.keys())
}

/** Reset the registry — used in tests to ensure isolation. */
export function resetRegistry(): void {
  _registry.clear()
}

// ── Execute ─────────────────────────────────────────────────────────────────

/** Dispatch an AI request through a registered capability. */
export async function execute(
  capabilityId: string,
  input: ExecuteInput
): Promise<AIResponse> {
  const cap = _registry.get(capabilityId)
  if (!cap) {
    throw new Error(
      `Capability '${capabilityId}' is not registered. Call registerCapability() first.`
    )
  }

  // Resolve system prompt — caller override takes precedence over capability config.
  // This allows call-time data (brand identity, platform context) to shape the prompt
  // without baking dynamic data into the capability definition.
  const systemPrompt =
    input.systemPrompt ??
    (typeof cap.systemPrompt === 'function'
      ? cap.systemPrompt(input.context ?? { userId: '' })
      : cap.systemPrompt)

  // Build Anthropic API params
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model: cap.model,
    max_tokens: cap.maxTokens,
    system: systemPrompt,
    messages: input.messages,
  }

  // Temperature — omit if not set (Anthropic default is 1.0)
  if (cap.temperature !== undefined) {
    params.temperature = cap.temperature
  }

  // Thinking feature
  if (cap.features.thinking) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(params as any).thinking = {
      type: 'enabled',
      budget_tokens: cap.features.thinking.budgetTokens,
    }
  }

  // Structured output — force tool_use so Claude returns schema-conformant JSON.
  // The tool name is derived from the capability id (hyphens → underscores + _output).
  let structuredToolName: string | undefined
  if (cap.features.structuredOutput) {
    structuredToolName = `${cap.id.replace(/-/g, '_')}_output`
    const tool = zodToToolSchema(
      structuredToolName,
      cap.features.structuredOutput,
      `Structured output for ${cap.id}`
    ) as unknown as Anthropic.Tool
    params.tools = [tool]
    params.tool_choice = { type: 'tool', name: structuredToolName }
  }

  // Web search tool (server-side tool — not a standard Tool type).
  // Note: incompatible with structuredOutput; webSearch takes precedence if both set.
  if (cap.features.webSearch && !cap.features.structuredOutput) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(params as any).tools = [
      { type: 'web_search_20250305', name: 'web_search' },
    ]
  }

  const client = getAIClient()
  const response = await client.messages.create(params)

  // Extract content from response blocks
  let textContent = ''
  let thinkingContent: string | undefined
  let structuredData: unknown | undefined

  for (const block of response.content) {
    if (block.type === 'text') {
      textContent += (textContent ? '\n\n' : '') + block.text
    } else if (block.type === 'thinking' && 'thinking' in block) {
      thinkingContent = (block as { type: 'thinking'; thinking: string }).thinking
    }
  }

  // Parse structured output from tool_use block
  if (cap.features.structuredOutput && structuredToolName) {
    structuredData = parseStructuredResponse(
      response.content,
      structuredToolName,
      cap.features.structuredOutput
    )
  }

  return {
    content: textContent,
    thinking: thinkingContent,
    structuredData,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: response.model,
  }
}

// ── Batch Execute ─────────────────────────────────────────────────────────────

export interface BatchExecuteResult {
  batchId: string
  /**
   * customId → AIResponse map. Populated when the batch completes within the
   * poll timeout. Failed/cancelled/expired items are omitted.
   */
  results?: Map<string, AIResponse>
  /** True when the batch did not complete before the timeout expired. */
  pending: boolean
}

/**
 * Submit multiple capability requests as a single Anthropic batch (50% cost saving).
 * Polls until completion or timeout, then returns results keyed by customId.
 *
 * Best for non-urgent cron workloads: email triage, nightly content generation,
 * engagement reply generation. NOT suitable for interactive user-facing flows.
 *
 * @param capabilityId - Registered capability to use for all requests
 * @param inputs - Array of inputs, each with a unique customId for result lookup
 * @param opts.pollIntervalMs - Polling interval (default 5 s)
 * @param opts.timeoutMs - Give up after this many ms (default 4 min)
 */
export async function batchExecute(
  capabilityId: string,
  inputs: Array<ExecuteInput & { customId: string }>,
  opts?: { pollIntervalMs?: number; timeoutMs?: number }
): Promise<BatchExecuteResult> {
  const cap = _registry.get(capabilityId)
  if (!cap) {
    throw new Error(
      `Capability '${capabilityId}' is not registered. Call registerCapability() first.`
    )
  }

  // Derive structured output tool name (same formula as execute())
  let structuredToolName: string | undefined
  let tools: Anthropic.Tool[] | undefined
  let toolChoice: Anthropic.ToolChoice | undefined

  if (cap.features.structuredOutput) {
    structuredToolName = `${cap.id.replace(/-/g, '_')}_output`
    tools = [
      zodToToolSchema(
        structuredToolName,
        cap.features.structuredOutput,
        `Structured output for ${cap.id}`
      ) as unknown as Anthropic.Tool,
    ]
    toolChoice = { type: 'tool', name: structuredToolName }
  }

  // Build one BatchRequest per input
  const requests = inputs.map((input) => {
    const systemPrompt =
      input.systemPrompt ??
      (typeof cap.systemPrompt === 'function'
        ? cap.systemPrompt(input.context ?? { userId: '' })
        : cap.systemPrompt)

    return buildBatchRequest(input.customId, {
      model: cap.model,
      maxTokens: cap.maxTokens,
      system: systemPrompt,
      messages: input.messages,
      ...(tools ? { tools, tool_choice: toolChoice } : {}),
      ...(cap.temperature !== undefined ? { temperature: cap.temperature } : {}),
    })
  })

  // Submit the batch
  const batch = await createBatch(requests)

  // Poll until done or timeout
  const batchItems = await pollBatchUntilDone(batch.id, opts)

  if (!batchItems) {
    // Batch still processing — caller must handle (e.g. fallback to sync)
    return { batchId: batch.id, pending: true }
  }

  // Map results: customId → AIResponse (skip non-succeeded items)
  const resultsMap = new Map<string, AIResponse>()

  for (const item of batchItems) {
    if (item.status !== 'succeeded' || !item.message) continue

    let textContent = ''
    let thinkingContent: string | undefined
    let structuredData: unknown | undefined

    for (const block of item.message.content) {
      const b = block as Record<string, unknown>
      if (b.type === 'text') {
        textContent += (textContent ? '\n\n' : '') + (b.text as string)
      } else if (b.type === 'thinking' && b.thinking) {
        thinkingContent = b.thinking as string
      }
    }

    if (cap.features.structuredOutput && structuredToolName) {
      structuredData = parseStructuredResponse(
        item.message.content,
        structuredToolName,
        cap.features.structuredOutput
      )
    }

    resultsMap.set(item.customId, {
      content: textContent,
      thinking: thinkingContent,
      structuredData,
      usage: {
        inputTokens: item.message.usage.input_tokens,
        outputTokens: item.message.usage.output_tokens,
      },
      model: item.message.model,
    })
  }

  return { batchId: batch.id, results: resultsMap, pending: false }
}
