// src/lib/content/generator.ts
// AI content generator — produces social posts, blog intros, video scripts, etc.
// Pattern: same as experiments/generator.ts (getAIClient + Zod validation, no retry on parse failure).

import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getAIClient } from '@/lib/ai/client'
import { buildSocialPostSystemPrompt, buildSocialPostUserMessage } from './prompts/social-post'
import type {
  BrandIdentity,
  ContentGenerationRequest,
  ContentGenerationResult,
} from './types'

// ── Constants ────────────────────────────────────────────────────────────────

const MODEL = 'claude-sonnet-4-5-20250929'
const MAX_OUTPUT_TOKENS = 4096

// ── Zod schema for validating AI response ────────────────────────────────────

const ContentResultSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  cta: z.string().nullable().default(null),
  mediaPrompt: z.string().nullable().default(null),
})

// ── Extract JSON from response text ──────────────────────────────────────────

function extractJson(text: string): string {
  // Try markdown code fence first
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) return fenceMatch[1].trim()

  // Try raw JSON array
  const arrayStart = text.indexOf('[')
  const arrayEnd = text.lastIndexOf(']')
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return text.slice(arrayStart, arrayEnd + 1)
  }

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
 * Generate content variants using Claude AI.
 * Returns an array of validated content results.
 *
 * @param request - What to generate (businessKey, contentType, platform, topic, character, count)
 * @param brandIdentity - The brand identity for the target business
 * @throws Error if AI response cannot be parsed or validated
 */
export async function generateContent(
  request: ContentGenerationRequest,
  brandIdentity: BrandIdentity
): Promise<ContentGenerationResult[]> {
  const count = request.count ?? 3
  const characterPref = request.characterPreference ?? 'none'

  // Build prompts based on content type
  const systemPrompt = buildSocialPostSystemPrompt(
    brandIdentity,
    request.platform,
    characterPref
  )
  const userMessage = buildSocialPostUserMessage(
    request.topic,
    count,
    request.platform
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
      `[ContentGenerator] Failed to parse AI response as JSON: ${err instanceof Error ? err.message : String(err)}\nRaw: ${rawContent.slice(0, 500)}`
    )
  }

  // Handle both single object and array responses
  const items: unknown[] = Array.isArray(parsed) ? parsed : [parsed]

  // Validate each item with Zod
  const results: ContentGenerationResult[] = items.map((item) => {
    const validated = ContentResultSchema.parse(item)
    return {
      title: validated.title,
      body: validated.body,
      hashtags: validated.hashtags,
      cta: validated.cta,
      mediaPrompt: validated.mediaPrompt,
      characterUsed:
        characterPref === 'none' ? null : characterPref === 'male' ? 'male' : 'female',
      platform: request.platform ?? null,
    }
  })

  return results
}
