// src/lib/ideas/conversation.ts
import { BUSINESSES, BusinessKey } from '@/lib/businesses'

// Business key → Linear team key mapping
export const BUSINESS_TO_TEAM_KEY: Record<BusinessKey, string> = {
  dr:       'DR',
  nrpg:     'DR',
  carsi:    'GP',
  restore:  'RA',
  synthex:  'SYN',
  ato:      'UNI',
  ccw:      'UNI',
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface IdeaSpec {
  title: string
  teamKey: string
  priority: number  // 1=urgent 2=high 3=normal 4=low
  labels: string[]
  description: string
  acceptanceCriteria: string[]
}

export type ClaudeResponse =
  | { type: 'question'; question: string }
  | { type: 'spec'; spec: IdeaSpec }

export function buildSystemPrompt(): string {
  const businessList = BUSINESSES.map(b => `- ${b.key}: ${b.name} → team key: ${BUSINESS_TO_TEAM_KEY[b.key]}`).join('\n')

  return `You are a concise AI assistant for Phill McGurk's founder CRM.

Your job: turn raw ideas into structured Linear issues through a short qualifying conversation.

## Rules
- Ask ONE qualifying question at a time — never multiple questions in one message
- Always include your recommendation AND the reason for it in each question
- Max 4 questions total — if you have enough context, produce the spec
- Keep questions short and conversational
- When you have enough to write a good spec, output ONLY the JSON block below — no surrounding text

## Businesses
${businessList}

## When ready to produce the spec, output this exact format (and ONLY this):
\`\`\`json
{
  "type": "spec",
  "title": "<concise action-oriented title>",
  "teamKey": "<Linear team key from list above>",
  "priority": <1=urgent|2=high|3=normal|4=low>,
  "labels": ["<label1>", "<label2>"],
  "description": "<markdown description, 2-3 sentences>",
  "acceptanceCriteria": ["<criterion 1>", "<criterion 2>", "<criterion 3>"]
}
\`\`\`

## Priority guidance (always state your recommendation + reason)
- 1 Urgent: production broken, client blocked right now
- 2 High: important, affects revenue or key workflow
- 3 Normal: useful improvement, no time pressure
- 4 Low: nice to have`
}

export function parseClaudeResponse(raw: string): ClaudeResponse {
  // Look for a JSON code block
  const match = raw.match(/```json\s*([\s\S]*?)\s*```/)
  if (match) {
    try {
      // JSON.parse returns unknown — validate required fields before trusting
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parsed = JSON.parse(match[1]) as Record<string, any>
      if (
        parsed.type === 'spec' &&
        typeof parsed.title === 'string' &&
        typeof parsed.teamKey === 'string' &&
        typeof parsed.priority === 'number' &&
        Array.isArray(parsed.labels) &&
        typeof parsed.description === 'string' &&
        Array.isArray(parsed.acceptanceCriteria)
      ) {
        return { type: 'spec', spec: parsed as unknown as IdeaSpec }
      }
    } catch {
      // Fall through to question
    }
  }
  return { type: 'question', question: raw }
}
