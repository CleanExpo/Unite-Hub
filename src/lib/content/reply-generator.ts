// src/lib/content/reply-generator.ts
// AI reply generator — produces on-brand replies to social media comments.
// Pattern: same as generator.ts (getAIClient + Zod validation, no retry on parse failure).

import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getAIClient } from '@/lib/ai/client'
import { buildReplySystemPrompt, buildReplyUserMessage } from './prompts/reply'
import type { BrandIdentity } from './types'

// ── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-5-20250929'
const MAX_OUTPUT_TOKENS = 1024

// ── Types ────────────────────────────────────────────────────────────────────

interface ReplyRequest {
  comment: string
  platform: string
  postContent?: string
  authorName?: string
}

interface ReplyResult {
  reply: string
  sentiment: 'positive' | 'neutral' | 'negative'
  shouldAutoReply: boolean
}

// ── Zod schema for validating AI response ────────────────────────────────────

const ReplyResultSchema = z.object({
  reply: z.string().min(1),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  shouldAutoReply: z.boolean(),
})

// ── Extract JSON from response text ──────────────────────────────────────────

function extractJson(text: string): string {
  // Try markdown code fence first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Try raw JSON object
  const objStart = text.indexOf('{')
  const objEnd = text.lastIndexOf('}')
  if (objStart !== -1 && objEnd > objStart) {
    return text.slice(objStart, objEnd + 1)
  }

  return text
}

// ── Main generator function ──────────────────────────────────────────────────

/**
 * Generate an on-brand AI reply to a social media comment.
 *
 * @param request - The comment to reply to, with platform and context
 * @param brand - The brand identity for tone/voice
 * @param characterPreference - Which character voice to use (default: female/Ada for customer-facing)
 * @throws Error if AI response cannot be parsed or validated
 */
export async function generateReply(
  request: ReplyRequest,
  brand: BrandIdentity,
  characterPreference: 'male' | 'female' = 'female'
): Promise<ReplyResult> {
  const systemPrompt = buildReplySystemPrompt(brand, characterPreference)
  const userMessage = buildReplyUserMessage(
    request.comment,
    request.platform,
    request.postContent,
    request.authorName
  )

  // Call Claude
  const client = getAIClient()
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  })

  // Extract text content
  const rawContent = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')

  // Extract and parse JSON — do NOT retry on Zod/JSON errors (model won't improve)
  const jsonStr = extractJson(rawContent)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (err) {
    throw new Error(
      `[ReplyGenerator] Failed to parse AI response as JSON: ${err instanceof Error ? err.message : String(err)}\nRaw: ${rawContent.slice(0, 500)}`
    )
  }

  // Validate with Zod
  const validated = ReplyResultSchema.parse(parsed)

  return {
    reply: validated.reply,
    sentiment: validated.sentiment,
    shouldAutoReply: validated.shouldAutoReply,
  }
}
