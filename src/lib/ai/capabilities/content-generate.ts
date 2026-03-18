// src/lib/ai/capabilities/content-generate.ts
// Content generation capability — AI-powered social post, blog intro, and video script generation.

import { createCapability } from '../types'

export const contentGenerateCapability = createCapability({
  id: 'content-generate',
  model: 'claude-sonnet-4-6',
  maxTokens: 4096,
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
