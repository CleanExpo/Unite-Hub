// src/lib/ai/capabilities/email-triage.ts
// AI email triage — categorises Gmail threads and suggests actions.
// Uses structuredOutput + batchExecute for 50% cost saving on the nightly cron.

import { z } from 'zod'
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

// ── Zod schema for structured output ────────────────────────────────────────

const TriageOutputSchema = z.object({
  category: z.enum(['IMPORTANT', 'INVOICE', 'TASK', 'NEWSLETTER', 'PROMOTIONAL', 'SOCIAL', 'SPAM']),
  action: z.enum(['KEEP', 'ARCHIVE', 'CREATE_TASK', 'FLAG_REVIEW']),
  priority: z.number().min(1).max(4),
  reason: z.string(),
})

type TriageOutput = z.infer<typeof TriageOutputSchema>

// ── Capability definition ────────────────────────────────────────────────────

export const emailTriageCapability = createCapability({
  id: 'email-triage',
  model: 'claude-sonnet-4-6',
  maxTokens: 1024,
  features: {
    structuredOutput: TriageOutputSchema,
  },
  systemPrompt: () => `You are an email triage assistant for an Australian founder managing 7 businesses.
Categorise each email and suggest an action. Be decisive — most newsletters and promotions should be archived.

Categories: IMPORTANT | INVOICE | TASK | NEWSLETTER | PROMOTIONAL | SOCIAL | SPAM
Actions: KEEP | ARCHIVE | CREATE_TASK | FLAG_REVIEW
Priority: 1=urgent, 2=high, 3=medium, 4=low`,
})

// ── Batch triage (primary path — 50% cost saving) ────────────────────────────

/**
 * Triage a batch of email threads via the Anthropic Batch API.
 * Submits all threads in one batch call, polls for results, then returns
 * structured triage decisions.
 *
 * Falls back to synchronous per-thread execution if the batch times out
 * (rare — small batches typically complete in under 60 s).
 */
export async function triageThreadBatch(
  threads: Array<{ threadId: string; subject: string; from: string; snippet: string }>
): Promise<TriageResult[]> {
  const { batchExecute, registerCapability } = await import('../router')
  const { registerAllCapabilities } = await import('./index')
  registerAllCapabilities()

  const inputs = threads.map((t) => ({
    customId: t.threadId,
    messages: [
      {
        role: 'user' as const,
        content: `Subject: ${t.subject}\nFrom: ${t.from}\nSnippet: ${t.snippet}`,
      },
    ],
  }))

  const { results, pending } = await batchExecute('email-triage', inputs)

  if (pending || !results) {
    // Batch timed out — fall back to synchronous triage so the cron still completes
    console.warn('[email-triage] Batch timed out — falling back to synchronous execution')
    return triageThreadsSync(threads)
  }

  const triageResults: TriageResult[] = []

  for (const thread of threads) {
    const response = results.get(thread.threadId)
    if (!response?.structuredData) continue

    const parsed = response.structuredData as TriageOutput
    triageResults.push({
      threadId: thread.threadId,
      category: parsed.category,
      action: parsed.action,
      priority: parsed.priority as 1 | 2 | 3 | 4,
      reason: parsed.reason,
      subject: thread.subject,
      fromEmail: thread.from,
    })
  }

  return triageResults
}

// ── Sync fallback ────────────────────────────────────────────────────────────

/**
 * Synchronous per-thread fallback used when the batch times out.
 * Runs threads in parallel via Promise.allSettled — same pattern as before.
 */
async function triageThreadsSync(
  threads: Array<{ threadId: string; subject: string; from: string; snippet: string }>
): Promise<TriageResult[]> {
  const { execute, registerCapability } = await import('../router')
  registerCapability(emailTriageCapability)

  const settled = await Promise.allSettled(
    threads.map(async (t): Promise<TriageResult> => {
      const response = await execute('email-triage', {
        messages: [
          {
            role: 'user',
            content: `Subject: ${t.subject}\nFrom: ${t.from}\nSnippet: ${t.snippet}`,
          },
        ],
      })

      const parsed = response.structuredData as TriageOutput
      return {
        threadId: t.threadId,
        category: parsed.category,
        action: parsed.action,
        priority: parsed.priority as 1 | 2 | 3 | 4,
        reason: parsed.reason,
        subject: t.subject,
        fromEmail: t.from,
      }
    })
  )

  return settled
    .filter((r): r is PromiseFulfilledResult<TriageResult> => r.status === 'fulfilled')
    .map((r) => r.value)
}
