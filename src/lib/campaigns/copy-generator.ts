// src/lib/campaigns/copy-generator.ts
// Generates platform-specific campaign copy + image prompts from Brand DNA using Claude Sonnet.
// Follows the same Zod validation + no-retry pattern as src/lib/content/generator.ts.

import type Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { getAIClient } from '@/lib/ai/client'
import { zodToToolSchema, parseStructuredResponse } from '@/lib/ai/features/structured'
import { buildCampaignCopySystemPrompt, buildCampaignCopyUserMessage } from './prompts/campaign-copy'
import type { BrandDNA, CampaignCopyResult, CampaignObjective } from './types'
import type { SocialPlatform } from '@/lib/integrations/social/types'
import { PLATFORMS } from '@/lib/integrations/social/types'
import { VISUAL_TYPES } from './types'

const MODEL = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 8192

// ─── Zod Schema ──────────────────────────────────────────────────────────────

const CopyResultSchema = z.object({
  platform: z.enum(PLATFORMS),
  copy: z.string().min(1),
  headline: z.string().nullable(),
  cta: z.string().nullable(),
  hashtags: z.array(z.string()),
  imagePrompt: z.string().min(10),
  visualType: z.enum(VISUAL_TYPES).default('photo'),
  variant: z.number().int().min(1),
})

// tool_use requires a root ZodObject — wrap the array in a container.
const CopyResponseSchema = z.object({
  results: z.array(CopyResultSchema).min(1),
})

const COPY_TOOL = zodToToolSchema(
  'generate_copy',
  CopyResponseSchema,
  'Return all platform copy variants as a structured results array.'
) as unknown as Anthropic.Tool

// ─── Main Generator ───────────────────────────────────────────────────────────

export async function generateCampaignCopy(
  brandDNA: BrandDNA,
  brief: {
    theme: string
    objective: CampaignObjective
    platforms: SocialPlatform[]
    postCount: number
  }
): Promise<CampaignCopyResult[]> {
  const client = getAIClient()

  const systemPrompt = buildCampaignCopySystemPrompt(brandDNA)
  const userMessage = buildCampaignCopyUserMessage(
    brief.theme,
    brief.objective,
    brief.platforms,
    brief.postCount,
    brandDNA
  )

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
    tools: [COPY_TOOL],
    tool_choice: { type: 'tool', name: 'generate_copy' },
  })

  const { results } = parseStructuredResponse(response.content, 'generate_copy', CopyResponseSchema)
  return results as CampaignCopyResult[]
}
