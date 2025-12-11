/**
 * Guardian I02: AI-Based Simulation Trace Summariser
 *
 * Provides AI-powered analysis of pipeline simulation traces.
 * Uses Claude Sonnet 4.5 for chaos engineering insights.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianSimulationTraceSummaryRequest {
  tenantId: string;
  runId: string;
  maxSteps?: number;
}

export interface GuardianSimulationTraceSummaryResult {
  summaryMarkdown: string;
  keyFindings: string[];
  potentialRisks: string[];
  suggestedNextScenarios?: string[];
}

/**
 * Generate AI summary of simulation pipeline traces
 */
export async function generateSimulationTraceSummary(
  req: GuardianSimulationTraceSummaryRequest
): Promise<GuardianSimulationTraceSummaryResult> {
  const { tenantId, runId, maxSteps = 500 } = req;
  const supabase = getSupabaseServer();

  // Load traces
  const { data: traces, error: tracesError } = await supabase
    .from('guardian_simulation_pipeline_traces')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('run_id', runId)
    .order('step_index', { ascending: true })
    .limit(maxSteps);

  if (tracesError) {
    throw new Error(`Failed to fetch traces: ${tracesError.message}`);
  }

  if (!traces || traces.length === 0) {
    return {
      summaryMarkdown: 'No traces available for this simulation run.',
      keyFindings: [],
      potentialRisks: [],
    };
  }

  // Aggregate trace data
  const phaseCounts = new Map<string, number>();
  const severityBreakdown = new Map<string, number>();
  const totalRuleKeys = new Set<string>();

  for (const trace of traces) {
    phaseCounts.set(trace.phase, (phaseCounts.get(trace.phase) || 0) + 1);
    if (trace.severity) {
      severityBreakdown.set(trace.severity, (severityBreakdown.get(trace.severity) || 0) + 1);
    }
    if (trace.related_rule_key) {
      totalRuleKeys.add(trace.related_rule_key);
    }
  }

  // Build context for AI
  const traceContext = {
    total_steps: traces.length,
    phases: Object.fromEntries(phaseCounts),
    severity_breakdown: Object.fromEntries(severityBreakdown),
    unique_rules: Array.from(totalRuleKeys),
    sample_traces: traces.slice(0, 20).map(t => ({
      phase: t.phase,
      message: t.message,
      severity: t.severity,
      actor: t.actor,
    })),
  };

  // Call Claude Sonnet 4.5 for analysis
  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = `You are a chaos engineering expert analyzing a Guardian security simulation.

## Simulation Trace Data
${JSON.stringify(traceContext, null, 2)}

Analyze this simulation trace and provide:
1. A markdown summary (2-3 paragraphs) of what happened in this simulation
2. Key findings (list of 3-5 bullet points) about the simulation behavior
3. Potential risks (list of 3-5 bullet points) identified by the simulation
4. Suggested next scenarios (optional, 2-3 ideas for follow-up simulations)

Respond with ONLY valid JSON matching this structure:
{
  "summaryMarkdown": "...",
  "keyFindings": ["...", "..."],
  "potentialRisks": ["...", "..."],
  "suggestedNextScenarios": ["...", "..."]
}`;

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract JSON from response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Could not extract JSON from Claude response');
    }

    const result: GuardianSimulationTraceSummaryResult = JSON.parse(jsonMatch[0]);
    return result;
  } catch (error: any) {
    console.error('Error generating AI summary:', error);

    // Fallback summary if AI fails
    return {
      summaryMarkdown: `Simulation executed ${traces.length} trace steps across ${phaseCounts.size} phases.`,
      keyFindings: [
        `${traces.length} total trace steps recorded`,
        `${severityBreakdown.size} severity levels detected`,
        `${totalRuleKeys.size} distinct rules triggered`,
      ],
      potentialRisks: ['Unable to generate AI analysis at this time'],
    };
  }
}
