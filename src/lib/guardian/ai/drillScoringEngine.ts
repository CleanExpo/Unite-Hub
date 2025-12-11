/**
 * Guardian I07: Drill Scoring Engine
 *
 * Uses AI to score and summarize drill performance.
 * Purely advisory, stored in training tables only.
 */

import { getSupabaseServer } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';

export interface GuardianDrillScore {
  overallScore: number;
  responseTimeScore?: number;
  prioritizationScore?: number;
  communicationScore?: number;
  missedCriticalEvents?: string[];
  strengths: string[];
  improvements: string[];
  summaryMarkdown: string;
}

interface DrillNarrative {
  events: Array<{
    sequenceIndex: number;
    offsetSeconds: number;
    eventType: string;
    severity?: string;
    message: string;
  }>;
  responses: Array<{
    eventSequence: number;
    responseType: string;
    responseLength: number;
    latencyMs?: number;
  }>;
  totalEvents: number;
  respondedEvents: number;
  responseRate: number;
}

/**
 * Generate drill score using AI
 */
export async function generateDrillScore(
  tenantId: string,
  runId: string,
  _options?: Record<string, unknown>
): Promise<GuardianDrillScore> {
  const supabase = getSupabaseServer();

  // Load run and related data
  const { data: run, error: runError } = await supabase
    .from('guardian_incident_drill_runs')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', runId)
    .single();

  if (runError || !run) {
    throw new Error(`Drill run not found: ${runError?.message || 'Unknown error'}`);
  }

  // Load drill events
  const { data: drillEvents, error: eventsError } = await supabase
    .from('guardian_incident_drill_events')
    .select('*')
    .eq('drill_id', run.drill_id)
    .eq('tenant_id', tenantId)
    .order('sequence_index', { ascending: true });

  if (eventsError) {
    throw new Error(`Failed to load drill events: ${eventsError.message}`);
  }

  // Load responses
  const { data: responses, error: responsesError } = await supabase
    .from('guardian_incident_drill_responses')
    .select('*')
    .eq('drill_run_id', runId)
    .eq('tenant_id', tenantId)
    .order('responded_at', { ascending: true });

  if (responsesError) {
    throw new Error(`Failed to load responses: ${responsesError.message}`);
  }

  // Build narrative for AI
  const narrative: DrillNarrative = {
    events: (drillEvents || []).map((evt) => ({
      sequenceIndex: evt.sequence_index,
      offsetSeconds: evt.occurred_offset_seconds,
      eventType: evt.event_type,
      severity: evt.severity,
      message: evt.message,
    })),
    responses: (responses || []).map((resp) => ({
      eventSequence: drillEvents?.findIndex((e) => e.id === resp.event_id) || -1,
      responseType: resp.response_type,
      responseLength: resp.response_text.length,
      latencyMs: resp.latency_ms,
    })),
    totalEvents: run.total_events,
    respondedEvents: run.responded_events,
    responseRate: run.total_events > 0 ? run.responded_events / run.total_events : 0,
  };

  // Call AI for scoring
  const client = new Anthropic();

  const systemPrompt = `You are an expert SRE incident commander and training coach. Your job is to evaluate operator performance during an incident response drill and provide constructive feedback.

Analyze the drill narrative and score the operator based on:
1. Overall incident response quality (0-100)
2. Response time to critical events (0-100)
3. Priority handling (did they focus on critical items first?)
4. Communication clarity (was their decision rationale clear?)

Be fair but critical. Identify missed opportunities and areas for improvement.

You MUST respond with ONLY valid JSON matching this structure:
{
  "overallScore": <number 0-100>,
  "responseTimeScore": <number 0-100>,
  "prioritizationScore": <number 0-100>,
  "communicationScore": <number 0-100>,
  "missedCriticalEvents": [<event descriptions>],
  "strengths": [<specific things they did well>],
  "improvements": [<specific areas for improvement>],
  "summaryMarkdown": "<multi-line markdown feedback>"
}`;

  const userPrompt = `Evaluate this incident drill performance:

Drill Difficulty: ${run.difficulty || 'normal'}
Mode: ${run.mode}
Total Events: ${narrative.totalEvents}
Events Responded To: ${narrative.respondedEvents}
Response Rate: ${(narrative.responseRate * 100).toFixed(1)}%

Event Timeline:
${narrative.events
  .map(
    (evt) =>
      `- [+${evt.offsetSeconds}s] ${evt.eventType.toUpperCase()} (${evt.severity || 'info'}): ${evt.message}`
  )
  .join('\n')}

Operator Responses:
${narrative.responses
  .map((resp, idx) => {
    
    const latency = resp.latencyMs ? ` [${resp.latencyMs}ms]` : '';
    return `${idx + 1}. Response to event ${resp.eventSequence + 1} (${resp.responseType})${latency}: ${resp.responseLength} chars`;
  })
  .join('\n')}

Provide objective, constructive feedback. Focus on decision quality and response prioritization.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      system: systemPrompt,
    });

    // Extract text from response
    const responseText = message.content
      .filter((block) => block.type === 'text')
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('\n');

    // Parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const score = JSON.parse(jsonMatch[0]) as GuardianDrillScore;

    // Validate score structure
    if (typeof score.overallScore !== 'number' || score.overallScore < 0 || score.overallScore > 100) {
      throw new Error('Invalid overall score from AI');
    }

    return score;
  } catch {
    // Fallback to basic scoring if AI fails
    const responseRate = narrative.responseRate;
    const baseScore = Math.round(responseRate * 100);

    return {
      overallScore: baseScore,
      responseTimeScore: baseScore,
      prioritizationScore: baseScore,
      communicationScore: baseScore,
      strengths: ['Completed drill successfully'],
      improvements: ['Consider enabling AI scoring for detailed feedback'],
      summaryMarkdown: `## Drill Performance Summary\n\nResponse Rate: ${(responseRate * 100).toFixed(1)}%\n\nNote: AI scoring unavailable. Manual review recommended.`,
    };
  }
}

/**
 * Persist drill score to database
 */
export async function persistDrillScore(
  tenantId: string,
  runId: string,
  score: GuardianDrillScore
): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('guardian_incident_drill_runs')
    .update({
      score,
      summary: score.summaryMarkdown,
    })
    .eq('tenant_id', tenantId)
    .eq('id', runId);

  if (error) {
    throw new Error(`Failed to persist drill score: ${error.message}`);
  }
}
