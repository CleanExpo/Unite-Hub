// src/lib/ai/capabilities/content-generate.ts
// Content generation capability — AI-powered social post, blog intro, and video script generation.
// Uses structuredOutput so the router forces tool_use and returns validated ContentGenerateOutput.

import { createCapability } from '../types'
import { ContentGenerateOutputSchema } from '@/lib/content/schemas'

export const contentGenerateCapability = createCapability({
  id: 'content-generate',
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  features: {
    structuredOutput: ContentGenerateOutputSchema,
  },
  systemPrompt: (ctx) => {
    const parts: string[] = [
      'You are an expert content creator for Unite-Group, a network of Australian businesses.',
      '',
      'You generate social media posts, blog intros, email campaigns, video scripts, and thread content.',
      'Always use Australian English (colour, behaviour, organisation).',
      'Every piece of content should have a clear call-to-action.',
    ]

    if (ctx.businessKey) {
      parts.push('', `Current business: ${ctx.businessKey}`)
    }

    return parts.join('\n')
  },
})
