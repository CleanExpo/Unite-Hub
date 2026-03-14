// src/lib/ai/capabilities/analyze.ts
// Deep strategic analysis capability with extended thinking

import { createCapability } from '../types'

export const analyzeCapability = createCapability({
  id: 'analyze',
  model: 'claude-opus-4-5-20250514',
  maxTokens: 16000,
  features: {
    thinking: { budgetTokens: 10000 },
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
      "Be direct — Phill needs decisions, not theory."
    )

    return parts.join('\n')
  },
})
