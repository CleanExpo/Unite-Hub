// src/lib/campaigns/copy-generator.ts
// Generates platform-specific campaign copy + image prompts from Brand DNA using Claude Sonnet.
// Follows the same Zod validation + no-retry pattern as src/lib/content/generator.ts.

import { z } from 'zod'
import { getAIClient } from '@/lib/ai/client'
import { buildCampaignCopySystemPrompt, buildCampaignCopyUserMessage } from './prompts/campaign-copy'
import type { BrandDNA, CampaignCopyResult, CampaignObjective } from './types'
import type { SocialPlatform } from '@/lib/integrations/social/types'
import { PLATFORMS } from '@/lib/integrations/social/types'

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
  variant: z.number().int().min(1),
})

const CopyResultsSchema = z.array(CopyResultSchema).min(1)

// ─── JSON Extractor ───────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const startIdx = text.indexOf('[')
  const endIdx = text.lastIndexOf(']')
  if (startIdx !== -1 && endIdx > startIdx) return text.slice(startIdx, endIdx + 1)
  return text
}

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
  })

  const rawText = response.content
    .filter(b => b.type === 'text')
    .map(b => (b as { type: 'text'; text: string }).text)
    .join('\n')

  const jsonStr = extractJson(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch (err) {
    throw new Error(`Failed to parse campaign copy response as JSON: ${err instanceof Error ? err.message : String(err)}`)
  }

  const results = CopyResultsSchema.parse(parsed)
  return results as CampaignCopyResult[]
}
