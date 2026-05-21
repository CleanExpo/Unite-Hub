// src/lib/content/prompts/video-script.ts
// Platform-specific system prompts for AI video script generation.

import type { BrandIdentity } from '../types'
import type { SocialPlatform } from '@/lib/integrations/social/types'
import { PLATFORM_CONSTRAINTS } from '../types'

/** Platform-specific video production guidelines. */
const VIDEO_PLATFORM_GUIDELINES: Partial<Record<SocialPlatform, string>> = {
  tiktok: [
    '- Duration: 15–60 seconds',
    '- Hook the viewer in the FIRST 3 SECONDS — this is critical',
    '- Vertical format (9:16)',
    '- Trend-aware — reference current sounds, formats, or challenges where relevant',
    '- Conversational and high-energy tone',
    '- Quick cuts, dynamic pacing, no dead air',
    '- End with a soft CTA or loop back to the hook',
  ].join('\n'),

  youtube: [
    '- Duration: 3–10 minutes (long form)',
    '- Structured: intro (hook + promise) → body (value delivery) → conclusion (CTA + summary)',
    '- Horizontal format (16:9)',
    '- Search-optimised title — include primary keyword naturally',
    '- Suggest chapter timestamps in visualNotes',
    '- Authoritative but approachable delivery',
    '- End with a clear subscribe/engage CTA',
  ].join('\n'),

  instagram: [
    '- Duration: 15–60 seconds (Reels format)',
    '- Visual storytelling — every second should be visually interesting',
    '- Vertical format (9:16)',
    '- Engaging captions that add context beyond the narration',
    '- Trend-aware music/format suggestions in visualNotes',
    '- Strong opening hook — stop the scroll',
  ].join('\n'),

  facebook: [
    '- Duration: 30–120 seconds',
    '- Horizontal format (16:9)',
    '- Informative or emotional — optimise for shares',
    '- Assume many viewers watch with sound OFF — include text overlay notes in visualNotes',
    '- Clear value proposition within the first 5 seconds',
    '- End with a shareable moment or direct CTA',
  ].join('\n'),
}

/**
 * Build the system prompt for video script generation.
 * Injects brand identity, character voice, and platform-specific video guidelines.
 */
export function buildVideoScriptSystemPrompt(
  brand: BrandIdentity,
  platform: SocialPlatform | undefined,
  characterPreference: 'male' | 'female' | 'none' = 'none'
): string {
  const parts: string[] = []

  // Identity
  parts.push(`You are an expert video content creator for ${brand.businessKey.toUpperCase()}, an Australian business.`)
  parts.push('You write narration scripts with precise timing markers and visual cues for video production.')
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
    parts.push(`**Industry Keywords (weave naturally into narration):** ${brand.industryKeywords.slice(0, 10).join(', ')}`)
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

  // Platform-specific video guidelines
  if (platform) {
    const constraint = PLATFORM_CONSTRAINTS[platform]
    const videoGuidelines = VIDEO_PLATFORM_GUIDELINES[platform]

    parts.push(`## Platform: ${platform.charAt(0).toUpperCase() + platform.slice(1)}`)
    parts.push(`- Caption character limit: ${constraint.charLimit}`)
    parts.push(`- Max hashtags: ${constraint.hashtagLimit}`)
    parts.push(`- Aspect ratio: ${constraint.aspectRatio}`)

    if (videoGuidelines) {
      parts.push('')
      parts.push('### Video Production Guidelines')
      parts.push(videoGuidelines)
    }
    parts.push('')
  } else {
    parts.push('## Platform: Multi-platform (generate a versatile script adaptable to any platform)')
    parts.push('- Default duration: 30–60 seconds')
    parts.push('- Default aspect ratio: 9:16 (vertical)')
    parts.push('')
  }

  // YouTube Shorts detection (platform is 'youtube' but we handle both forms)
  if (platform === 'youtube') {
    parts.push('NOTE: If the topic or context suggests a short-form video (Shorts), adapt accordingly:')
    parts.push('- Duration: 15–60 seconds, vertical 9:16, hook in first 2 seconds')
    parts.push('- Educational or entertaining angle, end with a CTA')
    parts.push('- Otherwise, default to long-form guidelines above.')
    parts.push('')
  }

  // Script markers guide
  parts.push('## Script Markers')
  parts.push('Use these markers throughout the script field:')
  parts.push('- `[PAUSE]` — natural pause for emphasis or breath (0.5–1s)')
  parts.push('- `[EMPHASIS]` — stress the following word or phrase in delivery')
  parts.push('- `[VISUAL CUE: description]` — describe what should appear on screen at this point')
  parts.push('These markers help the video editor and narrator produce polished content.')
  parts.push('')

  // Sample content
  if (brand.sampleContent && Object.keys(brand.sampleContent).length > 0) {
    parts.push('## Example Content (match this quality and style):')
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
  parts.push('  "title": "Video title for internal use",')
  parts.push('  "script": "Full narration script with [PAUSE], [EMPHASIS], [VISUAL CUE] markers. Use \\n for line breaks.",')
  parts.push('  "hookLine": "First 3-second attention hook — the opening line that stops the scroll",')
  parts.push('  "durationEstimate": 45,')
  parts.push('  "captionText": "Platform caption/description to accompany the video post",')
  parts.push('  "hashtags": ["relevant", "hashtags"],')
  parts.push('  "visualNotes": "Scene descriptions, transitions, text overlay suggestions, and visual direction for the editor"')
  parts.push('}')
  parts.push('```')
  parts.push('')
  parts.push('The `durationEstimate` is in seconds and MUST respect the platform duration limits.')

  // Locale
  parts.push('')
  parts.push('CRITICAL: Always use Australian English (colour, behaviour, organisation, tyre). All references must be Australian (AUD, AEST, Australian locations, Australian culture).')

  return parts.join('\n')
}

/**
 * Build the user message for video script generation.
 */
export function buildVideoScriptUserMessage(
  topic: string | undefined,
  count: number,
  platform: SocialPlatform | undefined
): string {
  const parts: string[] = []

  if (topic) {
    parts.push(`Topic/angle: "${topic}"`)
  } else {
    parts.push('Generate a fresh, compelling video script based on the brand identity above. Choose an angle that will resonate with the target audience and perform well on video.')
  }

  parts.push('')

  if (count > 1) {
    parts.push(`Generate ${count} different video script variants. Each should take a different angle, hook, or visual approach.`)
    parts.push('')
    parts.push('Respond with a JSON array of objects:')
    parts.push('```')
    parts.push('[{ "title": "...", "script": "...", "hookLine": "...", "durationEstimate": 45, "captionText": "...", "hashtags": [...], "visualNotes": "..." }, ...]')
    parts.push('```')
  } else {
    parts.push('Generate 1 video script. Respond with a single JSON object.')
  }

  if (platform) {
    parts.push('')
    parts.push(`Optimise specifically for ${platform}. Respect the platform's duration limits, aspect ratio, and audience expectations.`)
  }

  return parts.join('\n')
}
