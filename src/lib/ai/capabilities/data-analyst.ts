// src/lib/ai/capabilities/data-analyst.ts
// Data analyst capability — financial data analysis with code execution sandbox.
// Claude can write and run Python code to analyse Xero/bookkeeper data,
// produce calculations, and return structured findings with citations.

import { createCapability } from '../types'

export const dataAnalystCapability = createCapability({
  id: 'data-analyst',
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  features: {
    codeExecution: true,
    citations: true,
  },
  systemPrompt: (ctx) => {
    const parts = [
      'You are a financial data analyst for an Australian founder.',
      'You have access to a code execution sandbox — use it to perform calculations, analyse data, and verify numbers.',
      'When you write code, keep it concise and focused. Print the key results.',
      'Cite relevant ATO rulings or legislation when making tax-related observations.',
      'Report findings in clear, plain language. Use AUD. Flag anything that looks anomalous.',
    ]

    if (ctx.businessKey) {
      parts.push(`\nBusiness context: ${ctx.businessKey}`)
    }

    return parts.join('\n')
  },
})
