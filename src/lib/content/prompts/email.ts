// src/lib/content/prompts/email.ts
// Email-specific prompts for AI email generation.

import type { BrandIdentity } from '../types'

export type EmailType = 'newsletter' | 'promotion' | 'announcement' | 'follow_up'

const EMAIL_TYPE_GUIDANCE: Record<EmailType, string> = {
  newsletter: 'Informative, value-driven content. Share insights, tips, or updates. Build trust and authority. Keep it scannable with clear sections.',
  promotion: 'Persuasive, benefit-led copy. Highlight the offer, create urgency, and drive action. Include a compelling CTA.',
  announcement: 'Clear, concise communication of news or updates. Lead with the key announcement, then provide supporting details.',
  follow_up: 'Warm, personalised tone. Reference the prior interaction. Provide additional value or a gentle nudge toward next steps.',
}

/**
 * Build the system prompt for email generation.
 * Injects brand identity and character voice.
 */
export function buildEmailSystemPrompt(
  brand: BrandIdentity,
  characterPreference: 'male' | 'female' | 'none' = 'none'
): string {
  const parts: string[] = []

  // Identity
  parts.push(`You are an expert email marketing copywriter for ${brand.businessKey.toUpperCase()}, an Australian business.`)
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

  // Email-specific guidance
  parts.push('## Email Best Practices')
  parts.push('- Subject line: 6-10 words, curiosity-driven, no ALL CAPS or spam triggers')
  parts.push('- Preheader: 40-90 characters, complements subject line')
  parts.push('- Body: scannable with short paragraphs, bullet points where appropriate')
  parts.push('- CTA: one primary call-to-action, clear and action-oriented')
  parts.push('- Mobile-first: most recipients read on mobile')
  parts.push('')

  // Output format
  parts.push('## Output Format')
  parts.push('Respond with valid JSON only — no markdown, no explanation.')
  parts.push('```')
  parts.push('{')
  parts.push('  "subject": "Email subject line",')
  parts.push('  "preheader": "Preview text shown in inbox (40-90 chars)",')
  parts.push('  "bodyHtml": "<h1>Full HTML email body</h1>...",')
  parts.push('  "bodyText": "Plain text version of the email",')
  parts.push('  "cta": { "text": "CTA button text", "url": "https://..." }')
  parts.push('}')
  parts.push('```')

  // Locale
  parts.push('')
  parts.push('CRITICAL: Always use Australian English (colour, behaviour, organisation, tyre). All references must be Australian (AUD, AEST, Australian locations, Australian culture).')

  return parts.join('\n')
}

/**
 * Build the user message for email content generation.
 */
export function buildEmailUserMessage(
  topic: string,
  emailType: EmailType,
  recipientSegment?: string
): string {
  const parts: string[] = []

  parts.push(`Topic/angle: "${topic}"`)
  parts.push('')

  parts.push(`Email type: **${emailType.replace('_', ' ')}**`)
  parts.push(EMAIL_TYPE_GUIDANCE[emailType])
  parts.push('')

  if (recipientSegment) {
    parts.push(`Recipient segment: ${recipientSegment}`)
    parts.push('Tailor the tone and content for this specific audience segment.')
    parts.push('')
  }

  parts.push('Generate 1 email. Respond with a single JSON object.')
  parts.push('')
  parts.push('Ensure the HTML body is well-structured with inline styles for email client compatibility.')

  return parts.join('\n')
}
