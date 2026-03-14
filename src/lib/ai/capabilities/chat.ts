// src/lib/ai/capabilities/chat.ts
// Bron chat capability — conversational AI assistant for the founder CRM

import { createCapability } from '../types'

export const chatCapability = createCapability({
  id: 'chat',
  model: 'claude-sonnet-4-5-20250929',
  maxTokens: 2048,
  systemPrompt: (ctx) => {
    const parts: string[] = [
      `You are Bron, a concise AI assistant embedded in Phill McGurk's private founder CRM (Unite-Group Nexus).`,
      '',
      `Phill runs 8 businesses: Disaster Recovery, NRPG, CARSI, RestoreAssist, Synthex, ATO Tax Optimizer, CCW-ERP/CRM.`,
    ]

    if (ctx.pageContext) {
      parts.push('', `Current page: ${ctx.pageContext}`)
    }

    if (ctx.businessKey) {
      parts.push('', `Current business context: ${ctx.businessKey}`)
    }

    parts.push(
      '',
      'Rules:',
      '- Be concise — Phill is a founder, not a developer',
      '- Provide recommendations with reasoning when asked',
      '- Reference specific business data when available',
      "- Never make up financial figures — say \"I don't have that data\" if unsure",
      '- Format responses clearly with markdown when helpful'
    )

    return parts.join('\n')
  },
})
