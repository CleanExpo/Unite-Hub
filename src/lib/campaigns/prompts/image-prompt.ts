// src/lib/campaigns/prompts/image-prompt.ts
// Builds enriched image generation prompts from campaign copy + Brand DNA.

import type { BrandDNA } from '@/lib/campaigns/types'
import type { SocialPlatform } from '@/lib/integrations/social/types'

const PLATFORM_STYLE_NOTES: Record<SocialPlatform, string> = {
  instagram: 'visually striking, high-contrast, suitable for Instagram feed — square or portrait orientation',
  facebook:  'professional and engaging, suitable for Facebook feed — landscape orientation',
  linkedin:  'clean and professional, corporate aesthetic, suitable for LinkedIn — square or landscape',
  tiktok:    'dynamic, bold, youth-oriented, full vertical format for TikTok',
  youtube:   'cinematic, high-quality thumbnail aesthetic, landscape format for YouTube',
}

export function buildImagePrompt(
  rawPrompt: string,
  brand: BrandDNA,
  platform: SocialPlatform,
  headline: string | null,
  cta: string | null
): string {
  const parts: string[] = []

  // Core visual concept
  parts.push(rawPrompt)

  // Brand colour injection
  parts.push(
    `Use this exact colour palette: primary ${brand.colours.primary}, secondary ${brand.colours.secondary}, accent ${brand.colours.accent}.`
  )

  // Font style
  parts.push(
    `Typography should use ${brand.fonts.heading} style for any headline text, ${brand.fonts.body} style for body text.`
  )

  // Platform-specific guidance
  parts.push(PLATFORM_STYLE_NOTES[platform])

  // Imagery style
  parts.push(`Visual style: ${brand.imageryStyle}.`)

  // Text overlays if needed
  if (headline) {
    parts.push(`Include the text overlay: "${headline}" prominently positioned.`)
  }
  if (cta) {
    parts.push(`Include a subtle CTA button or text area for: "${cta}"`)
  }

  // Quality directives
  parts.push(
    'Professional marketing quality. High resolution. No watermarks. No text unless specified. Photorealistic unless the brand style specifies otherwise.'
  )

  return parts.join(' ')
}
