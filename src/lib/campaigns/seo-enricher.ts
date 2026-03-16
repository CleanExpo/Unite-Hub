// src/lib/campaigns/seo-enricher.ts
// Post-processes campaign copy to improve SEO/GEO quality using Claude Sonnet.
// Runs as a non-critical enrichment step — on parse failure, returns originals unchanged.

import { z } from 'zod'
import { getAIClient } from '@/lib/ai/client'

const MODEL = 'claude-sonnet-4-5-20250929'
const MAX_TOKENS = 4096

// ─── Public Types ─────────────────────────────────────────────────────────────

export interface EnrichedAsset {
  assetId: string
  enrichedCopy: string
  altText: string               // accessibility + SEO alt text — max 125 chars
  suggestedKeywords: string[]   // 3-5 B.I.D.-ready keywords for the platform
}

// ─── Zod Schema ───────────────────────────────────────────────────────────────

const EnrichedAssetSchema = z.object({
  assetId: z.string(),
  enrichedCopy: z.string().min(1),
  altText: z.string().max(125),
  suggestedKeywords: z.array(z.string()).min(1).max(10),
})

const EnrichedAssetsSchema = z.array(EnrichedAssetSchema)

// ─── JSON Extractor ───────────────────────────────────────────────────────────

function extractJson(text: string): string {
  const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/)
  if (fenceMatch) return fenceMatch[1].trim()
  const startIdx = text.indexOf('[')
  const endIdx = text.lastIndexOf(']')
  if (startIdx !== -1 && endIdx > startIdx) return text.slice(startIdx, endIdx + 1)
  return text
}

// ─── System Prompt ────────────────────────────────────────────────────────────

function buildSystemPrompt(brandDNA: {
  industry: string
  targetAudience: string
  brandValues: string[]
}): string {
  return `You are an SEO and GEO copywriter specialist for Australian businesses. Your task is to enrich campaign copy for improved search and generative engine visibility.

Brand context:
- Industry: ${brandDNA.industry}
- Target audience: ${brandDNA.targetAudience}
- Brand values: ${brandDNA.brandValues.join(', ')}

Enrichment rules:
1. PLATFORM-SPECIFIC keyword optimisation:
   - Instagram: weave in 3-5 niche hashtag-ready terms naturally within the copy body; do NOT append hashtags as a block
   - LinkedIn: incorporate B2B intent phrases (e.g. "enterprise", "ROI", "decision-maker", "industry-leading") where they fit naturally
   - Facebook: favour local search terms and community language (suburb names, "near me" equivalents, local landmarks) where relevant
   - TikTok / YouTube: prioritise conversational, trend-adjacent phrasing with clear value hooks

2. AUSTRALIAN ENGLISH throughout — spelling (colour, behaviour, optimisation, organise), currency (AUD), dates (DD/MM/YYYY), and colloquialisms must be au-natural.

3. BRAND TONE — preserve the brand's unique voice. Do not homogenise or genericise the copy. Enhancement only, never replacement of personality.

4. ALT TEXT — for each asset, write descriptive, keyword-rich alt text for the associated image. Must be under 125 characters. Include the primary subject, context, and one SEO keyword.

5. KEYWORDS — suggest 3-5 industry keywords (B.I.D.-verified intent: branded, informational, or decision-stage) that should appear naturally in the copy for this platform. Return them as plain strings without hashtag prefixes.

6. JSON only — respond with a JSON array and nothing else. No markdown prose outside the array.`
}

// ─── User Message ─────────────────────────────────────────────────────────────

function buildUserMessage(
  assets: Array<{
    id: string
    copy: string
    platform: string
    headline: string | null
    imagePrompt: string
  }>
): string {
  const assetList = assets
    .map(
      a =>
        `Asset ID: ${a.id}
Platform: ${a.platform}
Headline: ${a.headline ?? '(none)'}
Current copy: ${a.copy}
Image prompt: ${a.imagePrompt}`
    )
    .join('\n\n---\n\n')

  return `Enrich the following campaign assets. Return a JSON array where each element matches this schema:

{
  "assetId": "<same id as input>",
  "enrichedCopy": "<improved copy>",
  "altText": "<descriptive alt text under 125 chars>",
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"]
}

Assets to enrich:

${assetList}

Respond with ONLY the JSON array. No additional text.`
}

// ─── Main Enricher ────────────────────────────────────────────────────────────

export async function enrichCampaignAssets(
  assets: Array<{
    id: string
    copy: string
    platform: string
    headline: string | null
    imagePrompt: string
  }>,
  brandDNA: {
    industry: string
    targetAudience: string
    brandValues: string[]
  }
): Promise<EnrichedAsset[]> {
  // Return originals as-is if no assets provided
  if (assets.length === 0) return []

  const client = getAIClient()
  const systemPrompt = buildSystemPrompt(brandDNA)
  const userMessage = buildUserMessage(assets)

  let rawText: string
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    rawText = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('\n')
  } catch {
    // API failure — graceful degradation, return originals unchanged
    return assets.map(a => ({
      assetId: a.id,
      enrichedCopy: a.copy,
      altText: '',
      suggestedKeywords: [],
    }))
  }

  const jsonStr = extractJson(rawText)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    // JSON parse failure — enrichment is non-critical, return originals unchanged
    return assets.map(a => ({
      assetId: a.id,
      enrichedCopy: a.copy,
      altText: '',
      suggestedKeywords: [],
    }))
  }

  const result = EnrichedAssetsSchema.safeParse(parsed)
  if (!result.success) {
    // Zod validation failure — return originals unchanged (no retry)
    return assets.map(a => ({
      assetId: a.id,
      enrichedCopy: a.copy,
      altText: '',
      suggestedKeywords: [],
    }))
  }

  return result.data
}
