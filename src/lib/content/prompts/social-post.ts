// src/lib/content/prompts/social-post.ts
// Platform-specific system prompts for AI social post generation.

import type { BrandIdentity } from '../types'
import type { SocialPlatform } from '@/lib/integrations/social/types'
import { PLATFORM_CONSTRAINTS } from '../types'

/**
 * Build the system prompt for social post generation.
 * Injects brand identity, character voice, and platform constraints.
 */
export function buildSocialPostSystemPrompt(
  brand: BrandIdentity,
  platform: SocialPlatform | undefined,
  characterPreference: 'male' | 'female' | 'none' = 'none'
): string {
  const parts: string[] = []

  // Identity
  parts.push(`You are an expert social media content creator for ${brand.businessKey.toUpperCase()}, an Australian business.`)
  parts.push('')

  // Character voice
  if (characterPreference === 'male') {
    parts.push(`## Voice: ${brand.characterMale.name}`)
    parts.push(brand.characterMale.persona)
    parts.push(`Voice style: ${brand.characterMale.voiceStyle}`)
  } else if (characterPreference === 'female') {
    parts.push(`## Voice: ${brand.characterFemale.name}`)
    parts.push(brand.characterFemale.persona)
    parts.push(`Voice style: ${brand.characterFemale.voiceStyle}`)
  } else {
    parts.push('## Voice: Brand Voice (no specific character)')
  }
  parts.push('')

  // Brand guidelines
  parts.push('## Brand Identity')
  parts.push(`**Tone:** ${brand.toneOfVoice}`)
  parts.push(`**Target Audience:** ${brand.targetAudience}`)
  parts.push('')

  if (brand.uniqueSellingPoints.length > 0) {
    parts.push('**Key Selling Points:**')
    for (const usp of brand.uniqueSellingPoints) {
      parts.push(`- ${usp}`)
    }
    parts.push('')
  }

  if (brand.industryKeywords.length > 0) {
    parts.push(`**Industry Keywords (weave naturally):** ${brand.industryKeywords.slice(0, 10).join(', ')}`)
    parts.push('')
  }

  // Do / Don't
  if (brand.doList.length > 0) {
    parts.push('## Do:')
    for (const item of brand.doList) {
      parts.push(`- ${item}`)
    }
    parts.push('')
  }

  if (brand.dontList.length > 0) {
    parts.push('## Don\'t:')
    for (const item of brand.dontList) {
      parts.push(`- ${item}`)
    }
    parts.push('')
  }

  // Platform constraints
  if (platform) {
    const constraint = PLATFORM_CONSTRAINTS[platform]
    parts.push(`## Platform: ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
    parts.push(`- Max characters: ${constraint.charLimit}`)
    parts.push(`- Max hashtags: ${constraint.hashtagLimit}`)
    parts.push(`- Style: ${constraint.description}`)
    if (constraint.videoRequired) {
      parts.push('- Video required — generate a script, not a text post')
    }
    parts.push('')
  } else {
    parts.push('## Platform: Multi-platform (generate content adaptable to any platform)')
    parts.push('')
  }

  // Sample content
  if (brand.sampleContent && Object.keys(brand.sampleContent).length > 0) {
    parts.push('## Example Posts (match this quality and style):')
    for (const [plat, example] of Object.entries(brand.sampleContent)) {
      parts.push(`**${plat}:** ${example}`)
    }
    parts.push('')
  }

  // Output format
  parts.push('## Output Format')
  parts.push('Respond with valid JSON only — no markdown, no explanation.')
  parts.push('```')
  parts.push('{')
  parts.push('  "title": "Short attention-grabbing title (for internal use)",')
  parts.push('  "body": "The full post content. Use \\n for line breaks. Include emojis where appropriate.",')
  parts.push('  "hashtags": ["relevant", "hashtags", "max5-30depending on platform"],')
  parts.push('  "cta": "Clear call-to-action text or null",')
  parts.push('  "mediaPrompt": "Description of ideal accompanying image/video, or null"')
  parts.push('}')
  parts.push('```')

  // Locale
  parts.push('')
  parts.push('CRITICAL: Always use Australian English (colour, behaviour, organisation, tyre). All references must be Australian (AUD, AEST, Australian locations, Australian culture).')

  return parts.join('\n')
}

/**
 * Build the user message for content generation.
 */
export function buildSocialPostUserMessage(
  topic: string | undefined,
  count: number,
  platform: SocialPlatform | undefined
): string {
  const parts: string[] = []

  if (topic) {
    parts.push(`Topic/angle: "${topic}"`)
  } else {
    parts.push('Generate a fresh, engaging social media post based on the brand identity above. Choose a compelling topic or angle.')
  }

  parts.push('')

  if (count > 1) {
    parts.push(`Generate ${count} different post variants. Each should take a different angle or approach.`)
    parts.push('')
    parts.push('Respond with a JSON array of objects:')
    parts.push('```')
    parts.push('[{ "title": "...", "body": "...", "hashtags": [...], "cta": "...", "mediaPrompt": "..." }, ...]')
    parts.push('```')
  } else {
    parts.push('Generate 1 post. Respond with a single JSON object.')
  }

  if (platform) {
    parts.push('')
    parts.push(`Optimise specifically for ${platform}.`)
  }

  return parts.join('\n')
}
