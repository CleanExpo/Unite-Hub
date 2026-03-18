// src/lib/ai/capabilities/email-triage.ts
// AI email triage — categorises Gmail threads and suggests actions

import { createCapability } from '../types'

export type TriageCategory = 'IMPORTANT' | 'INVOICE' | 'TASK' | 'NEWSLETTER' | 'PROMOTIONAL' | 'SOCIAL' | 'SPAM'
export type TriageAction = 'KEEP' | 'ARCHIVE' | 'CREATE_TASK' | 'FLAG_REVIEW'

export interface TriageResult {
  threadId: string
  category: TriageCategory
  action: TriageAction
  priority: 1 | 2 | 3 | 4
  reason: string
  subject?: string
  fromEmail?: string
}

export const emailTriageCapability = createCapability({
  id: 'email-triage',
  model: 'claude-sonnet-4-6',
  maxTokens: 1024,
  systemPrompt: () => `You are an email triage assistant for an Australian founder managing 7 businesses.
Categorise each email and suggest an action. Be decisive — most newsletters and promotions should be archived.
Respond with JSON only. No prose, no markdown fences.

Categories: IMPORTANT | INVOICE | TASK | NEWSLETTER | PROMOTIONAL | SOCIAL | SPAM
Actions: KEEP | ARCHIVE | CREATE_TASK | FLAG_REVIEW
Priority: 1=urgent, 2=high, 3=medium, 4=low

Response format: { "category": "...", "action": "...", "priority": 1, "reason": "..." }`,
})

/**
 * Run triage for a batch of thread summaries.
 * Each item is triaged independently — partial failures are skipped, not thrown.
 */
export async function triageThreadBatch(
  threads: Array<{ threadId: string; subject: string; from: string; snippet: string }>
): Promise<TriageResult[]> {
  const { execute } = await import('../router')
  const { registerAllCapabilities } = await import('./index')
  registerAllCapabilities()

  const results = await Promise.allSettled(
    threads.map(async (t): Promise<TriageResult> => {
      const response = await execute('email-triage', {
        messages: [{
          role: 'user',
          content: `Subject: ${t.subject}\nFrom: ${t.from}\nSnippet: ${t.snippet}`,
        }],
      })

      const parsed = JSON.parse(response.content) as {
        category: TriageCategory
        action: TriageAction
        priority: 1 | 2 | 3 | 4
        reason: string
      }

      return {
        threadId: t.threadId,
        category: parsed.category,
        action: parsed.action,
        priority: parsed.priority,
        reason: parsed.reason,
        subject: t.subject,
        fromEmail: t.from,
      }
    })
  )

  return results
    .filter((r): r is PromiseFulfilledResult<TriageResult> => r.status === 'fulfilled')
    .map(r => r.value)
}
