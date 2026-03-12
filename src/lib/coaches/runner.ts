// src/lib/coaches/runner.ts
// Generic coach runner — creates a DB record, fetches context data,
// calls Claude via the centralised Anthropic client, and persists the result.
// Reuses patterns from src/lib/advisory/agents.ts (API calls) and
// src/lib/bookkeeper/orchestrator.ts (service client, error isolation).

import type Anthropic from '@anthropic-ai/sdk'
import { getAIClient } from '@/lib/ai/client'
import { createServiceClient } from '@/lib/supabase/service'
import type { CoachType, CoachContext, CoachResult, CoachDataFetcher } from './types'
import { COACH_CONFIGS } from './types'

// ── Runner Parameters ────────────────────────────────────────────────────────

interface RunCoachParams {
  coachType: CoachType
  founderId: string
  systemPrompt: string
  buildUserMessage: (context: CoachContext) => string
  fetchData: CoachDataFetcher
}

// ── Main Runner ──────────────────────────────────────────────────────────────

/**
 * Runs a single coach cycle end-to-end:
 *
 * 1. Inserts a coach_reports row with status 'running'
 * 2. Calls the provided data fetcher to gather context
 * 3. Calls Claude via the Anthropic SDK
 * 4. Updates the row with the completed brief, token counts, and metrics
 * 5. On any error: updates the row with status 'failed' and error_message
 *
 * Uses the Supabase service client (bypasses RLS) because cron endpoints
 * run without an authenticated user session.
 */
export async function runCoach({
  coachType,
  founderId,
  systemPrompt,
  buildUserMessage,
  fetchData,
}: RunCoachParams): Promise<CoachResult> {
  const startTime = Date.now()
  const supabase = createServiceClient()
  const config = COACH_CONFIGS[coachType]

  // 1. Create the report row — status 'running'
  const { data: report, error: insertError } = await supabase
    .from('coach_reports')
    .insert({
      founder_id: founderId,
      coach_type: coachType,
      status: 'running',
      model: config.model,
    })
    .select('id')
    .single()

  if (insertError || !report) {
    throw new Error(
      `[Coach:${coachType}] Failed to create report row: ${insertError?.message ?? 'Unknown error'}`
    )
  }

  const reportId: string = report.id

  try {
    // 2. Fetch context data
    const context = await fetchData(founderId)

    // 3. Build the user message
    const userMessage = buildUserMessage(context)

    // 4. Call Claude via the Anthropic SDK (mirrors advisory/agents.ts pattern)
    const client = getAIClient()
    const response = await client.messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    })

    // Extract text content
    const briefMarkdown = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')

    const inputTokens = response.usage.input_tokens
    const outputTokens = response.usage.output_tokens
    const durationMs = Date.now() - startTime

    // 5. Extract any numeric metrics from the context data for quick access
    const metrics = extractMetrics(context)

    // 6. Update the report row — status 'completed'
    const { error: updateError } = await supabase
      .from('coach_reports')
      .update({
        status: 'completed',
        brief_markdown: briefMarkdown,
        raw_data: context.data,
        metrics,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        duration_ms: durationMs,
        business_key: context.businessKey ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (updateError) {
      console.error(`[Coach:${coachType}] Failed to update report ${reportId}:`, updateError)
    }

    return {
      reportId,
      status: 'completed',
      briefMarkdown,
      metrics,
      inputTokens,
      outputTokens,
      durationMs,
    }
  } catch (err: unknown) {
    // 7. On error: update the row with status 'failed'
    const durationMs = Date.now() - startTime
    const errorMessage = err instanceof Error ? err.message : String(err)

    const { error: failError } = await supabase
      .from('coach_reports')
      .update({
        status: 'failed',
        error_message: errorMessage,
        duration_ms: durationMs,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reportId)

    if (failError) {
      console.error(`[Coach:${coachType}] Failed to record error for report ${reportId}:`, failError)
    }

    return {
      reportId,
      status: 'failed',
      briefMarkdown: null,
      metrics: {},
      inputTokens: 0,
      outputTokens: 0,
      durationMs,
      error: errorMessage,
    }
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Extracts numeric values from the context data for the metrics JSONB column.
 * Provides a quick-access summary without needing to parse raw_data.
 */
function extractMetrics(context: CoachContext): Record<string, number> {
  const metrics: Record<string, number> = {}

  if (typeof context.data === 'object' && context.data !== null) {
    for (const [key, value] of Object.entries(context.data)) {
      if (typeof value === 'number' && Number.isFinite(value)) {
        metrics[key] = value
      }
    }
  }

  return metrics
}
