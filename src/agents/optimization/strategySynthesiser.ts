/**
 * Strategy Synthesiser
 *
 * Synthesizes strategic playbooks from global insights.
 * Recommends high-level coordinated workflows for risks and opportunities.
 */

import { listGlobalInsights } from '@/lib/intelligence/globalInsightHub';

export interface StrategyPlay {
  id: string;
  name: string;
  theme: string;
  description: string;
  rationale: string;
  recommendedWorkflows: string[];
  priority: 'low' | 'medium' | 'high';
  estimatedImpact?: string;
  agentsInvolved: string[];
}

/**
 * Synthesize strategy plays from global insights
 */
export function synthesiseStrategies(): StrategyPlay[] {
  const insights = listGlobalInsights({ limit: 50 });
  const plays: StrategyPlay[] = [];

  // Group insights by theme
  const byTheme = new Map<string, typeof insights>();
  for (const insight of insights) {
    if (!byTheme.has(insight.theme)) {
      byTheme.set(insight.theme, []);
    }
    byTheme.get(insight.theme)!.push(insight);
  }

  // ========== RISK ALERT PLAYBOOK ==========
  const riskAlerts = byTheme.get('risk_alert') ?? [];
  if (riskAlerts.length > 0) {
    plays.push({
      id: crypto.randomUUID(),
      name: 'Emergency Risk Response Campaign',
      theme: 'risk_alert',
      description:
        'Rapidly coordinate across research, content, email, and scheduling agents to respond to identified risks.',
      rationale: `${riskAlerts.length} critical risk alert(s) detected. Coordinated response required to mitigate exposure.`,
      recommendedWorkflows: ['rapid_risk_assessment', 'crisis_communication', 'stakeholder_briefing'],
      priority: 'high',
      estimatedImpact: 'Reduce risk surface by 40-60% within 24h',
      agentsInvolved: ['research', 'content', 'email', 'coordination'],
    });
  }

  // ========== OPPORTUNITY CAPTURE PLAYBOOK ==========
  const opportunities = byTheme.get('opportunity') ?? [];
  if (opportunities.length > 0) {
    plays.push({
      id: crypto.randomUUID(),
      name: 'Opportunity Acceleration Campaign',
      theme: 'opportunity',
      description: 'Launch coordinated multi-channel campaigns to rapidly capture identified market opportunities.',
      rationale: `${opportunities.length} high-confidence opportunity/ies identified. Time-sensitive action required.`,
      recommendedWorkflows: ['content_blitz', 'multi_channel_launch', 'performance_monitoring'],
      priority: 'high',
      estimatedImpact: 'Capture 30-50% of opportunity value',
      agentsInvolved: ['research', 'content', 'email', 'scheduling'],
    });
  }

  // ========== EMAIL ENGAGEMENT OPTIMIZATION ==========
  const emailEngagement = byTheme.get('email_engagement') ?? [];
  if (emailEngagement.length > 0) {
    const trend = emailEngagement[0].summary.includes('improved') ? 'improving' : 'declining';
    plays.push({
      id: crypto.randomUUID(),
      name: trend === 'improving' ? 'Email Excellence Campaign' : 'Email Recovery Campaign',
      theme: 'email_engagement',
      description: trend === 'improving'
        ? 'Capitalize on strong email performance with expanded campaigns.'
        : 'Diagnose and fix email engagement decline through A/B testing and optimization.',
      rationale: emailEngagement[0].summary,
      recommendedWorkflows:
        trend === 'improving'
          ? ['expand_volume', 'increase_cadence', 'segment_testing']
          : ['diagnostic_analysis', 'ab_testing', 'recovery_campaign'],
      priority: trend === 'improving' ? 'medium' : 'high',
      estimatedImpact: trend === 'improving' ? '+15-25% volume' : 'Restore to baseline +20%',
      agentsInvolved: ['email', 'analysis', 'research'],
    });
  }

  // ========== CONTENT QUALITY ASSURANCE ==========
  const contentQuality = byTheme.get('content_quality') ?? [];
  if (contentQuality.length > 0) {
    const isBottleneck = contentQuality[0].summary.includes('bottleneck');
    plays.push({
      id: crypto.randomUUID(),
      name: isBottleneck ? 'Content Throughput Acceleration' : 'Content Quality Enhancement',
      theme: 'content_quality',
      description: isBottleneck
        ? 'Reduce content approval bottleneck through process optimization and parallel review.'
        : 'Improve content quality and consistency across all channels.',
      rationale: contentQuality[0].summary,
      recommendedWorkflows: isBottleneck
        ? ['parallel_review', 'approval_optimization', 'template_standardization']
        : ['quality_framework', 'brand_alignment_audit', 'continuous_improvement'],
      priority: isBottleneck ? 'high' : 'medium',
      estimatedImpact: isBottleneck ? '+200% throughput' : '+20% quality score',
      agentsInvolved: ['content', 'coordination', 'analysis'],
    });
  }

  // ========== SCHEDULING EFFICIENCY ==========
  const schedulingEff = byTheme.get('scheduling_efficiency') ?? [];
  if (schedulingEff.length > 0) {
    plays.push({
      id: crypto.randomUUID(),
      name: 'Meeting Optimization Campaign',
      theme: 'scheduling_efficiency',
      description: 'Improve scheduling agent performance and meeting booking conversion.',
      rationale: schedulingEff[0].summary,
      recommendedWorkflows: ['availability_optimization', 'reminder_campaigns', 'follow_up_sequences'],
      priority: 'medium',
      estimatedImpact: '+25% booking conversion',
      agentsInvolved: ['scheduling', 'email', 'analysis'],
    });
  }

  // ========== STAFF UTILIZATION PLAYBOOK ==========
  const staffUtil = byTheme.get('staff_utilization') ?? [];
  if (staffUtil.length > 0) {
    const approaching = staffUtil[0].summary.includes('approaching');
    plays.push({
      id: crypto.randomUUID(),
      name: approaching ? 'Capacity Expansion Initiative' : 'Efficiency Drive Campaign',
      theme: 'staff_utilization',
      description: approaching
        ? 'Prepare capacity expansion: hire contractors, implement automation.'
        : 'Reduce workload through automation and workflow optimization.',
      rationale: staffUtil[0].summary,
      recommendedWorkflows: approaching
        ? ['contractor_onboarding', 'workload_analysis', 'automation_roadmap']
        : ['workflow_optimization', 'automation_sprint', 'efficiency_training'],
      priority: approaching ? 'high' : 'medium',
      estimatedImpact: approaching ? 'Increase capacity 30-50%' : 'Reduce load by 20-30%',
      agentsInvolved: ['coordination', 'analysis'],
    });
  }

  // ========== FINANCIAL HEALTH PLAYBOOK ==========
  const financialHealth = byTheme.get('financial_health') ?? [];
  if (financialHealth.length > 0) {
    const isPositive = financialHealth[0].summary.includes('strong') || financialHealth[0].summary.includes('improved');
    plays.push({
      id: crypto.randomUUID(),
      name: isPositive ? 'Revenue Acceleration' : 'Profitability Recovery',
      theme: 'financial_health',
      description: isPositive
        ? 'Accelerate revenue growth with expanded campaigns and market expansion.'
        : 'Improve margins through cost optimization and process efficiency.',
      rationale: financialHealth[0].summary,
      recommendedWorkflows: isPositive
        ? ['market_expansion', 'upsell_campaign', 'pricing_optimization']
        : ['cost_analysis', 'efficiency_drive', 'margin_improvement'],
      priority: 'high',
      estimatedImpact: isPositive ? '+30% revenue' : '+25% margin',
      agentsInvolved: ['analysis', 'coordination', 'research'],
    });
  }

  return plays.sort((a, b) => {
    const priorityOrder = { high: 2, medium: 1, low: 0 };
    return (priorityOrder[b.priority] ?? 0) - (priorityOrder[a.priority] ?? 0);
  });
}

/**
 * Score a strategy play for feasibility
 */
export function scorePlayFeasibility(play: StrategyPlay): number {
  let score = 0.5; // Base score

  // Adjust by priority
  if (play.priority === 'high') {
score += 0.2;
}
  if (play.priority === 'medium') {
score += 0.1;
}

  // Adjust by number of agents (more = complex = lower feasibility)
  score -= (play.agentsInvolved.length - 1) * 0.05;

  // Clamp to 0–1
  return Math.max(0, Math.min(1, score));
}

/**
 * Get strategic plays ranked by priority and feasibility
 */
export function getRankedStrategies(): Array<StrategyPlay & { feasibilityScore: number }> {
  const plays = synthesiseStrategies();

  return plays
    .map(play => ({
      ...play,
      feasibilityScore: scorePlayFeasibility(play),
    }))
    .sort((a, b) => {
      const priorityOrder = { high: 2, medium: 1, low: 0 };
      const aPriority = priorityOrder[a.priority] ?? 0;
      const bPriority = priorityOrder[b.priority] ?? 0;

      if (bPriority !== aPriority) {
return bPriority - aPriority;
}
      return b.feasibilityScore - a.feasibilityScore;
    });
}
