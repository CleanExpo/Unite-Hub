/**
 * Guardian H05: Governance Coach AI Helper
 * Optional Claude Sonnet-powered coach narratives with strict Z10 governance gating
 * Respects Z10 ai_usage_policy flag; defaults to disabled (conservative)
 * PII-free, advisory-only, fallback deterministic narratives always available
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';
import { EnablementPlan } from './hSeriesEnablementPlanner';
import { HSeriesRolloutState } from './hSeriesRolloutState';

let anthropicClient: Anthropic | null = null;
let anthropicClientTimestamp = 0;
const ANTHROPIC_CLIENT_TTL = 60000; // 60 second TTL

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicClientTimestamp > ANTHROPIC_CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicClientTimestamp = now;
  }
  return anthropicClient;
}

export interface CoachNarrative {
  summary: string;
  keyPoints: string[];
  recommendedActions: string[];
  riskSummary: string;
  confidenceScore: number; // 0.0-1.0; AI=0.8, deterministic=1.0
  source: 'ai' | 'deterministic';
}

/**
 * Check if AI is allowed for governance coaching (respects Z10 policy)
 */
async function isAiAllowedForGovernanceCoach(tenantId: string): Promise<boolean> {
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('guardian_meta_governance_prefs')
      .select('ai_usage_policy')
      .eq('tenant_id', tenantId)
      .single();

    return data?.ai_usage_policy ?? false;
  } catch {
    // Default: conservative (AI disabled if lookup fails)
    return false;
  }
}

/**
 * Generate AI-assisted narrative for enablement plan (with Z10 gating)
 * Falls back to deterministic if AI disabled or fails
 */
export async function generateCoachNarrative(
  tenantId: string,
  state: HSeriesRolloutState,
  plan: EnablementPlan
): Promise<CoachNarrative> {
  const aiAllowed = await isAiAllowedForGovernanceCoach(tenantId);

  if (!aiAllowed) {
    return generateDeterministicNarrative(state, plan);
  }

  try {
    return await generateAiNarrative(state, plan);
  } catch (error) {
    // Fallback to deterministic if AI fails
    console.warn(`AI narrative generation failed: ${error instanceof Error ? error.message : String(error)}. Using deterministic fallback.`);
    return generateDeterministicNarrative(state, plan);
  }
}

/**
 * Generate AI narrative using Claude Sonnet
 */
async function generateAiNarrative(state: HSeriesRolloutState, plan: EnablementPlan): Promise<CoachNarrative> {
  const client = getAnthropicClient();

  // Build context (PII-free aggregates only)
  const context = {
    currentStage: plan.currentStage,
    targetStage: plan.targetStage,
    activeFeaturesCount: [
      state.hSeriesPresence.h01RuleSuggestion,
      state.hSeriesPresence.h02AnomalyDetection,
      state.hSeriesPresence.h03CorrelationRefinement,
      state.hSeriesPresence.h04IncidentScoring,
    ].filter(Boolean).length,
    aiEnabled: state.z10Governance.aiUsagePolicy,
    backupPolicyEnabled: state.z10Governance.backupPolicy,
    validationGateEnabled: state.z10Governance.validationGatePolicy,
    z13SchedulesCount: state.z13Automation.schedulesCount,
    z13ActiveCount: state.z13Automation.activeSchedulesCount,
    hasZ14StatusPage: state.z14Status.statusPageEnabled,
    z16ValidationPassing: state.z16Validation.validationStatus === 'pass',
    totalPlanDurationMinutes: plan.totalDurationMinutes,
    nextStageCount: plan.stages.filter((s) => parseInt(plan.currentStage.split('_')[1]) <= s.index).length,
  };

  const prompt = `You are an expert Guardian system governance coach. Generate a brief, executive-friendly narrative about this H-series enablement plan.

Current State:
- ${context.activeFeaturesCount}/4 H-series features active
- AI Usage Policy: ${context.aiEnabled ? 'Enabled' : 'Disabled'}
- Backup Policy: ${context.backupPolicyEnabled ? 'Enabled' : 'Disabled'}
- Validation Gate: ${context.validationGateEnabled ? 'Enabled' : 'Disabled'}
- Z13 Schedules: ${context.z13ActiveCount}/${context.z13SchedulesCount} active
- Z16 Validation: ${context.z16ValidationPassing ? 'Passing' : 'Needs attention'}

Plan Overview:
- Current Stage: ${plan.currentStage}
- Target Stage: ${plan.targetStage}
- Estimated Duration: ${context.totalPlanDurationMinutes} minutes
- Remaining Stages: ${context.nextStageCount}

Task: Generate a JSON response with this structure (STRICT format, no extra fields):
{
  "summary": "1-2 sentence executive summary of the rollout plan",
  "keyPoints": ["point1", "point2", "point3"],
  "recommendedActions": ["action1", "action2"],
  "riskSummary": "1-2 sentence risk assessment"
}

CRITICAL CONSTRAINTS:
- NO PII, emails, IPs, or identifiers
- NO raw configuration values or secrets
- NO promises or guarantees (advisory only)
- NO hyperlinks or URLs
- 3-5 key points max
- 2-3 recommended actions max
- Response MUST be valid JSON, nothing else`;

  const message = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  // Extract text response
  const responseText = message.content
    .filter((block) => block.type === 'text')
    .map((block) => (block as any).text)
    .join('');

  // Parse JSON response
  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    // If JSON parsing fails, return deterministic fallback
    console.warn(`Failed to parse AI response as JSON: ${responseText}`);
    return generateDeterministicNarrative(state, plan);
  }

  return {
    summary: parsed.summary || 'AI-assisted enablement plan',
    keyPoints: Array.isArray(parsed.keyPoints) ? parsed.keyPoints.slice(0, 5) : [],
    recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions.slice(0, 3) : [],
    riskSummary: parsed.riskSummary || 'Review plan stages for details',
    confidenceScore: 0.8, // AI responses have 80% confidence
    source: 'ai',
  };
}

/**
 * Generate deterministic narrative (always available, no AI call)
 * Confidence score 1.0 (fully deterministic)
 */
function generateDeterministicNarrative(state: HSeriesRolloutState, plan: EnablementPlan): CoachNarrative {
  const activeCount = [
    state.hSeriesPresence.h01RuleSuggestion,
    state.hSeriesPresence.h02AnomalyDetection,
    state.hSeriesPresence.h03CorrelationRefinement,
    state.hSeriesPresence.h04IncidentScoring,
  ].filter(Boolean).length;

  const featureNames = [
    state.hSeriesPresence.h01RuleSuggestion && 'Rules',
    state.hSeriesPresence.h02AnomalyDetection && 'Anomalies',
    state.hSeriesPresence.h03CorrelationRefinement && 'Correlation',
    state.hSeriesPresence.h04IncidentScoring && 'Incident Scoring',
  ]
    .filter(Boolean)
    .join(', ');

  const summary =
    activeCount === 0
      ? `Establish Guardian governance baseline before H-series enablement. This plan will take approximately ${plan.totalDurationMinutes} minutes over 7 stages.`
      : `Extend H-series from ${featureNames} with safe, staged enablement. Progress to next stage after validation confirms stability.`;

  const keyPoints = [
    `Current Stage: ${plan.currentStage}`,
    `Active Features: ${activeCount}/4 H-series components`,
    `Total Duration: ${plan.totalDurationMinutes} minutes across ${plan.stages.length} stages`,
    `Governance Status: ${state.z10Governance.aiUsagePolicy ? 'AI enabled' : 'AI disabled (can enable later)'}`,
    `Validation Health: ${state.z16Validation.validationStatus === 'pass' ? 'Passing' : 'Needs attention'}`,
  ].slice(0, 5);

  const recommendedActions = [];
  if (!state.z10Governance.backupPolicy) {
    recommendedActions.push('Enable Z10 backup policy for rollback safety');
  }
  if (!state.z10Governance.validationGatePolicy) {
    recommendedActions.push('Enable Z10 validation gate for quality assurance');
  }
  if (state.z13Automation.activeSchedulesCount < 3) {
    recommendedActions.push('Create Z13 schedules for ongoing automation');
  }

  // Use first 3 recommended actions
  const finalActions =
    recommendedActions.length > 0 ? recommendedActions.slice(0, 3) : ['Review and approve each stage before proceeding'];

  const riskSummary =
    activeCount === 0
      ? 'Low risk: Starting from governance baseline. All systems protected by Z15 backup and Z16 validation.'
      : `Medium risk: ${activeCount} H-series features active. Each stage has defined rollback pointers. Monitor adoption and system stability.`;

  return {
    summary,
    keyPoints,
    recommendedActions: finalActions,
    riskSummary,
    confidenceScore: 1.0, // Deterministic = fully confident
    source: 'deterministic',
  };
}

/**
 * Validate narrative for PII safety (defense-in-depth)
 * Returns validation result with warnings
 */
export function validateNarrativeSafety(narrative: CoachNarrative): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const allText = [
    narrative.summary,
    ...narrative.keyPoints,
    ...narrative.recommendedActions,
    narrative.riskSummary,
  ].join('\n');

  // Check for email addresses
  if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(allText)) {
    warnings.push('Potential email addresses detected in narrative');
  }

  // Check for IP addresses
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(allText)) {
    warnings.push('Potential IP addresses detected in narrative');
  }

  // Check for API keys or secrets
  if (/(?:api[_-]?key|secret|token|password)[:\s=]/i.test(allText)) {
    warnings.push('Potential secrets or credentials detected in narrative');
  }

  // Check for hostnames or domains (suspicious if present in narrative)
  if (/https?:\/\/[^\s]+/.test(allText)) {
    warnings.push('URLs detected in narrative (should not be present)');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
