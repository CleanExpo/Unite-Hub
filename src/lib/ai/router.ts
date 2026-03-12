// src/lib/ai/router.ts
// Capability registry and execute dispatcher for the centralised AI service layer.
// Register capabilities, then call execute(id, input) to dispatch AI requests.

import type Anthropic from '@anthropic-ai/sdk'
import { getAIClient } from './client'
import type { AICapability, AIResponse, RequestContext } from './types'

// ── Types ───────────────────────────────────────────────────────────────────

export interface ExecuteInput {
  messages: Anthropic.MessageParam[]
  context?: RequestContext
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

  // Resolve system prompt (static string or dynamic function)
  const systemPrompt =
    typeof cap.systemPrompt === 'function'
      ? cap.systemPrompt(input.context ?? { userId: '' })
      : cap.systemPrompt

  // Build Anthropic API params
  const params: Anthropic.MessageCreateParamsNonStreaming = {
    model: cap.model,
    max_tokens: cap.maxTokens,
    system: systemPrompt,
    messages: input.messages,
  }

  // Thinking feature
  if (cap.features.thinking) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(params as any).thinking = {
      type: 'enabled',
      budget_tokens: cap.features.thinking.budgetTokens,
    }
  }

  // Web search tool (server-side tool — not a standard Tool type)
  if (cap.features.webSearch) {
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

  for (const block of response.content) {
    if (block.type === 'text') {
      textContent += (textContent ? '\n\n' : '') + block.text
    } else if (block.type === 'thinking' && 'thinking' in block) {
      thinkingContent = (block as { type: 'thinking'; thinking: string }).thinking
    }
  }

  return {
    content: textContent,
    thinking: thinkingContent,
    usage: {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    },
    model: response.model,
  }
}
