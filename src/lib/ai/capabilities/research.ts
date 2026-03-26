// src/lib/ai/capabilities/research.ts
// Research capability — live web search with citation extraction.
// Uses Anthropic's server-side web_search tool so Claude decides when and what to search.
// Returns citations from both web search results and any ATO/legislation references in the text.

import { createCapability } from '../types'

export const researchCapability = createCapability({
  id: 'research',
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 4096,
  features: {
    webSearch: { maxResults: 5 },
    citations: true,
  },
  systemPrompt: (ctx) => {
    const parts = [
      'You are a research assistant for an Australian business founder.',
      'Search the web to find current, accurate information about the topic requested.',
      'Prioritise authoritative Australian sources: ATO (ato.gov.au), ASIC (asic.gov.au), legislation.gov.au, ABS, RBA, and reputable news.',
      'Cite the specific sources you reference. Be concise and factual.',
    ]

    if (ctx.businessKey) {
      parts.push(`\nBusiness context: ${ctx.businessKey}`)
    }

    return parts.join('\n')
  },
})
