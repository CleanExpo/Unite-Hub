// src/lib/content/generator.ts
// AI content generator — produces social posts, blog intros, video scripts, etc.
// Routes through the centralised AI router with structured output (tool_use).

import { execute, registerCapability } from '@/lib/ai'
import { contentGenerateCapability } from '@/lib/ai/capabilities/content-generate'
import { buildSocialPostSystemPrompt, buildSocialPostUserMessage } from './prompts/social-post'
import { ContentGenerateOutputSchema } from './schemas'
import type {
  BrandIdentity,
  ContentGenerationRequest,
  ContentGenerationResult,
} from './types'
import type { z } from 'zod'

// Ensure capability is registered before first execute call (idempotent)
registerCapability(contentGenerateCapability)

type ContentGenerateOutput = z.infer<typeof ContentGenerateOutputSchema>

// ── Main generator function ──────────────────────────────────────────────────

/**
 * Generate content variants using Claude AI via the router.
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

  // System prompt is built from call-time data — passed as override to the router
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

  const response = await execute('content-generate', {
    systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    context: { userId: '', businessKey: request.businessKey },
  })

  const { items } = response.structuredData as ContentGenerateOutput

  return items.map((item) => ({
    title: item.title,
    body: item.body,
    hashtags: item.hashtags,
    cta: item.cta,
    mediaPrompt: item.mediaPrompt,
    characterUsed:
      characterPref === 'none' ? null : characterPref === 'male' ? 'male' : 'female',
    platform: request.platform ?? null,
  }))
}
