// src/lib/agent-pipeline/idea-processor.ts
// Expands a raw text idea (from WhatsApp) into a structured Linear issue.
// Uses Claude Sonnet to classify business, write acceptance criteria, and set priority.

import { getAIClient } from '@/lib/ai/client'
import { BUSINESSES } from '@/lib/businesses'
import { BUSINESS_TO_TEAM, type CreateIssueInput } from '@/lib/integrations/linear'

const BUSINESS_KEYS = BUSINESSES.map(b => b.key).join(', ')

const SYSTEM_PROMPT = `You are a product manager for Unite-Group, an Australian network of 8 businesses.
Business keys: ${BUSINESS_KEYS}
Convert raw ideas or work packages into Linear issue specifications.
Respond with valid JSON only — no markdown, no explanation.`

interface ProcessedIdea {
  title: string
  description: string        // Markdown with ## Overview, ## Acceptance Criteria, ## Notes
  businessKey: string        // One of the 8 business keys
  priority: 0 | 1 | 2 | 3 | 4  // 0=no priority, 1=urgent, 2=high, 3=medium, 4=low
  labels?: string[]
}

/**
 * Expand a raw idea string into a structured Linear issue input.
 * @param rawText - The raw idea from a WhatsApp message
 * @param sourceBusinessHint - Optional business key hint (e.g. 'synthex') to guide classification
 */
export async function processIdea(
  rawText: string,
  sourceBusinessHint?: string
): Promise<CreateIssueInput> {
  const client = getAIClient()

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          `Raw idea: "${rawText}"`,
          sourceBusinessHint ? `Business context hint: ${sourceBusinessHint}` : '',
          '',
          'Respond with JSON matching this shape exactly:',
          '{',
          '  "title": "Short imperative title (max 80 chars)",',
          `  "description": "## Overview\\n...\\n## Acceptance Criteria\\n- [ ] ...\\n## Notes\\n...",`,
          `  "businessKey": "one of: ${BUSINESS_KEYS}",`,
          '  "priority": 3,',
          '  "labels": ["feature"]',
          '}',
        ]
          .filter(Boolean)
          .join('\n'),
      },
    ],
  })

  const rawContent = response.content[0]
  if (rawContent.type !== 'text') {
    throw new Error('[IdeaProcessor] Unexpected non-text response from Claude')
  }

  let parsed: ProcessedIdea
  try {
    parsed = JSON.parse(rawContent.text) as ProcessedIdea
  } catch {
    throw new Error(
      `[IdeaProcessor] Failed to parse Claude JSON response: ${rawContent.text.slice(0, 200)}`
    )
  }

  // Validate required fields
  if (!parsed.title || !parsed.businessKey) {
    throw new Error(`[IdeaProcessor] Missing required fields in parsed response: ${JSON.stringify(parsed)}`)
  }

  const teamKey = BUSINESS_TO_TEAM[parsed.businessKey] ?? 'UNI'

  return {
    title: parsed.title,
    description: parsed.description,
    teamKey,
    priority: parsed.priority ?? 3,
    labelNames: parsed.labels,
  }
}
