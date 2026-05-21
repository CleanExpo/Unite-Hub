// src/lib/ai/capabilities/analyze.ts
// Deep strategic analysis capability with extended thinking

import { createCapability } from '../types'

export const analyzeCapability = createCapability({
  id: 'analyze',
  model: 'claude-opus-4-5-20251101',
  // maxTokens includes thinking budget — 20 000 allows up to 16 000 thinking + 4 000 response.
  maxTokens: 20000,
  features: {
    thinking: {
      adaptive: true,
      minBudget: 4000,   // even simple queries get meaningful depth
      maxBudget: 16000,  // cap for cost control on Opus
    },
    citations: true,     // extract ATO rulings + legislation from analysis responses
  },
  systemPrompt: (ctx) => {
    const parts: string[] = [
      'You are a strategic advisor to Phill McGurk, founder of Unite-Group which oversees 8 businesses.',
    ]

    if (ctx.businessKey) {
      parts.push(`\nFocus: ${ctx.businessKey}`)
    }

    parts.push(
      'Provide structured, actionable analysis. Use markdown headers and bullet points.',
      'Be direct — Phill needs decisions, not theory.',
    )

    return parts.join('\n')
  },
})
