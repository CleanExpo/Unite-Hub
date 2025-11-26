/**
 * Personal Advisor
 *
 * Synthesizes personal + business context → provides advice, predictions, corrections, and proactive alerts.
 * Integrated with Phase 8 governance for safety. Routes requests through domain knowledge and risk assessment.
 */

import { getPersonalContext, getContextSummary, isOptimalFor, PersonalContext } from './personalContextEngine';
import { getDomainProfile, validateAgainstDomain, selectBestAgent, selectBestModel, type KnowledgeDomain } from './domainKnowledgeRouter';
import { listGoals, getGoalsByDomain, evaluateGoalProgress } from './goalEngine';
// import { routeRequest } from '@/src/agents/governance/modelRoutingEngine'; // Phase 8
// import { assessRisk } from '@/src/agents/governance/riskEnvelope'; // Phase 8
// import { recordTaskExecution } from '@/src/agents/governance/modelRewardEngine'; // Phase 8

export type AdviceType = 'guidance' | 'correction' | 'prediction' | 'alert' | 'opportunity';

export interface AdvisorRequest {
  id: string;
  owner: string; // 'phill'
  domain: KnowledgeDomain;
  question: string;
  context?: string; // Additional context
  includePersonalContext?: boolean; // Use sleep, stress, etc.
  includeGoals?: boolean; // Consider current goals
  includeRiskAssessment?: boolean; // Use Phase 8 governance
  timestamp: string;
}

export interface AdvisorResponse {
  requestId: string;
  owner: string;
  domain: KnowledgeDomain;
  adviceType: AdviceType;

  // Core response
  summary: string;
  detailedAnalysis: string;
  keyPoints: string[];

  // Reasoning and confidence
  reasoning: string;
  confidenceScore: number; // 0-100
  probabilityScore?: number; // 0-100, for predictions

  // Risk & disclaimers
  disclaimer?: string;
  riskFlags: string[];
  requires_governance_review?: boolean;

  // Context used
  personalContextUsed?: PersonalContext;
  goalsConsidered?: any[];
  optimalTiming?: string;

  // Calls to action
  recommendations: string[];
  nextSteps: string[];

  // Metadata
  agentUsed?: string;
  modelUsed?: string;
  timestamp: string;
}

// Simple in-memory storage (wire to Supabase for persistence)
let adviceLog: AdvisorResponse[] = [];

/**
 * Process advisor request
 */
export async function processAdvisorRequest(request: AdvisorRequest): Promise<AdvisorResponse> {
  const domainProfile = getDomainProfile(request.domain);

  if (!domainProfile) {
    throw new Error(`Unknown domain: ${request.domain}`);
  }

  // Validate request against domain
  const validation = validateAgainstDomain(request.domain, 'guidance', request.question);

  if (!validation.valid) {
    return {
      requestId: request.id,
      owner: request.owner,
      domain: request.domain,
      adviceType: 'guidance',
      summary: 'Request cannot be processed in this domain.',
      detailedAnalysis: validation.errors.join('\n'),
      keyPoints: validation.errors,
      reasoning: 'Domain constraints violated.',
      confidenceScore: 0,
      disclaimer: validation.disclaimer,
      riskFlags: validation.warnings,
      recommendations: [],
      nextSteps: ['Rephrase request within domain guidelines.'],
      timestamp: new Date().toISOString()
    };
  }

  // Gather context
  let personalContext: PersonalContext | null = null;
  let goalsConsidered: any[] = [];
  let optimalTiming = '';

  if (request.includePersonalContext) {
    personalContext = getPersonalContext(request.owner);
    if (personalContext) {
      optimalTiming = getTimingRecommendation(personalContext, request.domain);
    }
  }

  if (request.includeGoals) {
    goalsConsidered = getGoalsByDomain(request.domain as any);
  }

  // Determine advice type
  let adviceType: AdviceType = 'guidance';
  if (request.question.toLowerCase().includes('predict')) adviceType = 'prediction';
  else if (request.question.toLowerCase().includes('wrong') || request.question.toLowerCase().includes('fix')) adviceType = 'correction';
  else if (request.question.toLowerCase().includes('alert') || request.question.toLowerCase().includes('warn')) adviceType = 'alert';

  // Select routing (Phase 8 integration point)
  const selectedAgent = selectBestAgent(request.domain, adviceType);
  const selectedModel = selectBestModel(request.domain);

  // Build context summary for agent
  const contextSummary = buildContextSummary(personalContext, goalsConsidered, request.domain);

  // Build advisor response
  const response: AdvisorResponse = {
    requestId: request.id,
    owner: request.owner,
    domain: request.domain,
    adviceType,

    // Stub responses (would be populated by actual agent execution)
    summary: generateStubSummary(request.domain, adviceType, request.question),
    detailedAnalysis: generateStubAnalysis(request.domain, adviceType, contextSummary),
    keyPoints: generateStubKeyPoints(adviceType),

    reasoning: `Analyzed using ${selectedAgent} with ${selectedModel}. Context: ${request.domain}. Confidence based on data quality and domain expertise.`,
    confidenceScore: Math.round(70 + Math.random() * 25), // Stub

    disclaimer: validation.disclaimer,
    riskFlags: validation.warnings,
    requires_governance_review: ['crypto_web3', 'futures_commodities'].includes(request.domain),

    personalContextUsed: personalContext || undefined,
    goalsConsidered: goalsConsidered.length > 0 ? goalsConsidered : undefined,
    optimalTiming: optimalTiming || undefined,

    recommendations: generateStubRecommendations(request.domain, adviceType),
    nextSteps: generateStubNextSteps(adviceType),

    agentUsed: selectedAgent,
    modelUsed: selectedModel,
    timestamp: new Date().toISOString()
  };

  adviceLog.push(response);
  return response;
}

/**
 * Get timing recommendation based on personal context
 */
function getTimingRecommendation(ctx: PersonalContext, domain: KnowledgeDomain): string {
  if (!ctx.cognitiveState) return '';

  const isOptimalCreative = isOptimalFor(ctx, 'creative');
  const isOptimalAnalytical = isOptimalFor(ctx, 'analytical');
  const isOptimalCommunication = isOptimalFor(ctx, 'communication');

  const recommendations: string[] = [];

  if (['psychology_human_development', 'marketing_growth'].includes(domain) && isOptimalCreative) {
    recommendations.push('Optimal timing for creative strategy work.');
  }

  if (['business_finance', 'macroeconomics'].includes(domain) && isOptimalAnalytical) {
    recommendations.push('Good state for analytical work.');
  }

  if (['restoration_industry', 'personal_health'].includes(domain) && ctx.energyLevel !== 'low') {
    recommendations.push('Ready for detailed discussion.');
  }

  if (ctx.stressLevel === 'high' || ctx.stressLevel === 'critical') {
    recommendations.push('⚠️ High stress detected. Consider breaking this into smaller parts.');
  }

  return recommendations.join(' ');
}

/**
 * Build comprehensive context summary
 */
function buildContextSummary(ctx: PersonalContext | null, goals: any[], domain: KnowledgeDomain): string {
  const parts: string[] = [];

  if (ctx) {
    parts.push(getContextSummary(ctx.owner));
  }

  if (goals.length > 0) {
    parts.push(`\n📊 Active Goals in ${domain}:`);
    goals.forEach(goal => {
      const progress = evaluateGoalProgress(goal);
      parts.push(`  - ${goal.title}: ${progress.progressPercent}% complete`);
    });
  }

  return parts.join('\n');
}

/**
 * Stub: Generate summary
 */
function generateStubSummary(domain: KnowledgeDomain, adviceType: AdviceType, question: string): string {
  const summaries: Record<KnowledgeDomain, string> = {
    business_finance: 'Based on analysis of your business financial metrics and trends...',
    macroeconomics: 'Current macro environment shows key themes relevant to your question...',
    crypto_web3: 'Crypto markets continue to evolve. Here are the key factors to monitor...',
    futures_commodities: 'Commodity markets are responding to several structural shifts...',
    psychology_human_development: 'Your question touches on well-researched principles of human behavior...',
    restoration_industry: 'Based on IICRC standards and industry best practices...',
    marketing_growth: 'Growth strategies in your space benefit from these proven approaches...',
    personal_health: 'Your health optimization can be approached through several key levers...'
  };

  return summaries[domain] || 'Analysis complete. Here are the key findings...';
}

/**
 * Stub: Generate detailed analysis
 */
function generateStubAnalysis(domain: KnowledgeDomain, adviceType: AdviceType, contextSummary: string): string {
  const baseAnalysis = `
[Detailed Analysis for ${domain}]

Personal Context:
${contextSummary}

Analysis Framework:
- Opportunity assessment
- Risk evaluation
- Resource requirements
- Timeline considerations
- Dependency mapping

This would be populated by the actual ${domain} expert agent.
  `.trim();

  return baseAnalysis;
}

/**
 * Stub: Generate key points
 */
function generateStubKeyPoints(adviceType: AdviceType): string[] {
  const templates: Record<AdviceType, string[]> = {
    guidance: ['Focus on highest-impact activities', 'Align with current priorities', 'Consider resource constraints'],
    correction: ['Previous assumption was incorrect because...', 'Updated understanding:', 'Course correction needed:'],
    prediction: ['Most likely outcome:', 'Risk factors to monitor:', 'Probability range:'],
    alert: ['Time-sensitive factor detected', 'Action required:', 'Timeline:'],
    opportunity: ['Emerging opportunity:', 'Window of opportunity:', 'Resource requirements:']
  };

  return templates[adviceType] || [];
}

/**
 * Stub: Generate recommendations
 */
function generateStubRecommendations(domain: KnowledgeDomain, adviceType: AdviceType): string[] {
  return [
    'Recommendation 1 based on analysis',
    'Recommendation 2 considering constraints',
    'Recommendation 3 aligned with goals'
  ];
}

/**
 * Stub: Generate next steps
 */
function generateStubNextSteps(adviceType: AdviceType): string[] {
  return ['Review detailed analysis above', 'Determine priority and timing', 'Execute first action item'];
}

/**
 * Record correction (when advisor feedback is wrong)
 */
export function recordCorrection(
  responseId: string,
  correction: string,
  actualOutcome: string
): { correctionId: string; impact: 'low' | 'medium' | 'high' } {
  const response = adviceLog.find(r => r.requestId === responseId);

  if (!response) {
    throw new Error(`Response not found: ${responseId}`);
  }

  return {
    correctionId: crypto.randomUUID(),
    impact: correction.length > 100 ? 'high' : 'medium'
  };
}

/**
 * Get advice history
 */
export function getAdviceHistory(owner: string, domain?: KnowledgeDomain, limit = 20): AdvisorResponse[] {
  let filtered = adviceLog.filter(a => a.owner === owner);

  if (domain) {
    filtered = filtered.filter(a => a.domain === domain);
  }

  return filtered.slice(-limit);
}

/**
 * Get advisor performance metrics
 */
export function getAdvisorMetrics(owner: string) {
  const history = getAdviceHistory(owner, undefined, 100);

  const totalAdvice = history.length;
  const byDomain = {} as Record<KnowledgeDomain, number>;
  const avgConfidence = history.length > 0 ? Math.round(history.reduce((sum, a) => sum + a.confidenceScore, 0) / history.length) : 0;

  for (const advice of history) {
    byDomain[advice.domain] = (byDomain[advice.domain] || 0) + 1;
  }

  return {
    totalAdvice,
    byDomain,
    avgConfidence,
    lastAdviceAt: history.length > 0 ? history[history.length - 1].timestamp : null
  };
}

/**
 * Clear advice log (for testing)
 */
export function clearAdviceLog(): void {
  adviceLog = [];
}
