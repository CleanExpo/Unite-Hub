// src/lib/campaigns/prompts/campaign-copy.ts
// System + user prompts for generating platform-specific campaign copy from Brand DNA.

import type { BrandDNA, CampaignObjective } from '@/lib/campaigns/types'
import type { SocialPlatform } from '@/lib/integrations/social/types'

const PLATFORM_COPY_LIMITS: Record<SocialPlatform, number> = {
  instagram: 2200,
  facebook:  2200,
  linkedin:  3000,
  tiktok:    150,
  youtube:   5000,
}

const PLATFORM_HASHTAG_LIMITS: Record<SocialPlatform, number> = {
  instagram: 30,
  facebook:  5,
  linkedin:  5,
  tiktok:    5,
  youtube:   15,
}

const OBJECTIVE_GUIDANCE: Record<CampaignObjective, string> = {
  awareness:   'Focus on brand storytelling, educating the audience, and showcasing what makes this brand unique. No hard sell — build familiarity and trust.',
  engagement:  'Create posts that invite conversation, ask questions, or share relatable stories. Use hooks that stop the scroll. Encourage comments and shares.',
  conversion:  'Drive action with a clear, compelling offer. Highlight specific benefits, social proof, or urgency. Every post needs a strong CTA.',
  retention:   'Reward existing customers. Share behind-the-scenes content, exclusive tips, loyalty rewards, or appreciation. Reinforce why they made a great choice.',
}

export function buildCampaignCopySystemPrompt(brand: BrandDNA): string {
  return `You are a world-class social media copywriter and brand strategist creating a marketing campaign for ${brand.clientName}.

## Brand Identity

**Industry:** ${brand.industry}
**Tone of Voice:** ${brand.toneOfVoice}
**Brand Values:** ${brand.brandValues.join(', ')}
**Target Audience:** ${brand.targetAudience}
${brand.tagline ? `**Tagline:** "${brand.tagline}"` : ''}

## Visual Brand
**Primary Colour:** ${brand.colours.primary}
**Secondary Colour:** ${brand.colours.secondary}
**Accent Colour:** ${brand.colours.accent}
**Imagery Style:** ${brand.imageryStyle}

## Rules
- Match the brand's tone of voice exactly — not a generic voice
- Australian English spelling (colour, behaviour, optimise, etc.) for AU/NZ brands
- Every post MUST have a clear purpose — awareness, engagement, or conversion
- Hashtags must be researched and relevant — no generic filler tags
- The imagePrompt must be detailed enough for an AI image generator to produce a professional marketing image
- Include specific colour references (hex codes) and visual style in imagePrompts
- Never mention competitor brands

Respond ONLY with a valid JSON array — no markdown, no explanation.`
}

export function buildCampaignCopyUserMessage(
  theme: string,
  objective: CampaignObjective,
  platforms: SocialPlatform[],
  postCount: number,
  brand: BrandDNA
): string {
  const platformSpecs = platforms.map(p =>
    `- **${p}**: max ${PLATFORM_COPY_LIMITS[p]} chars, max ${PLATFORM_HASHTAG_LIMITS[p]} hashtags`
  ).join('\n')

  return `Generate ${postCount} marketing post(s) for the campaign theme: "${theme}"

## Campaign Objective
${OBJECTIVE_GUIDANCE[objective]}

## Platforms & Constraints
${platformSpecs}

## Instructions
Create ${postCount} post variant(s). For each variant, generate one version per platform in the array: ${platforms.join(', ')}.

Each item in the JSON array must have this exact structure:
{
  "platform": "${platforms[0]}" (one of: ${platforms.join(', ')}),
  "copy": "the full post text including emojis if appropriate",
  "headline": "short attention-grabbing headline (optional, null if not needed for this platform)",
  "cta": "call-to-action text (e.g. 'Book a free consult', 'Shop now', 'Learn more') or null",
  "hashtags": ["tag1", "tag2"] (within platform limit, no # prefix),
  "imagePrompt": "detailed image generation prompt describing a professional marketing visual. Include: subject/scene description, brand colours (${brand.colours.primary}, ${brand.colours.secondary}), photography style (${brand.imageryStyle}), mood, and any text overlay if needed. Be specific about composition, lighting, and visual elements.",
  "variant": 1
}

Total array length: ${postCount * platforms.length} items (${postCount} variant(s) × ${platforms.length} platform(s)).
Each variant number (1 to ${postCount}) should appear once per platform.`
}
