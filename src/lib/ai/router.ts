// src/lib/ai/router.ts
// Capability registry and execute dispatcher for the centralised AI service layer.
// Register capabilities, then call execute(id, input) to dispatch AI requests.

import type Anthropic from '@anthropic-ai/sdk'
import { getAIClient } from './client'
import type { AICapability, AIResponse, RequestContext } from './types'
import { zodToToolSchema, parseStructuredResponse } from './features/structured'

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
