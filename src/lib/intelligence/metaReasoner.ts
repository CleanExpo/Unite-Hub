/**
 * Meta Reasoner
 *
 * Analyzes global intelligence to make system-level decisions.
 * Uses agent health, global insights, and risk levels to recommend
 * strategic actions and focus areas for the founder.
 */

import { listGlobalInsights, getInsightStats } from './globalInsightHub';
import { listAgentStates, getSystemHealthSummary, getUnhealthyAgents } from './agentStateStore';

export interface MetaDecision {
  id: string;
  createdAt: string;
  systemStatus: 'healthy' | 'degraded' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  focusAreas: string[];
  recommendedActions: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  nextReviewIn: number; // minutes
  confidence: number; // 0–1
}

/**
 * Run the meta reasoner to generate a system-level decision
 */
export function runMetaReasoner(): MetaDecision {
  const insights = listGlobalInsights({ limit: 100 });
  const agentStates = listAgentStates();
  const systemHealth = getSystemHealthSummary();
  const insightStats = getInsightStats();

  const focusAreas: string[] = [];
  const actions: string[] = [];
  let riskLevel: MetaDecision['riskLevel'] = 'low';
  let systemStatus: MetaDecision['systemStatus'] = 'healthy';
  let priority: MetaDecision['priority'] = 'low';
  let nextReviewIn = 60; // Default 1 hour

  // ========== CRITICAL RISK ANALYSIS ==========
  const critical = insights.filter(i => i.severity === 'critical');
  const warnings = insights.filter(i => i.severity === 'warning');

  if (critical.length > 0) {
    focusAreas.push('critical_risks');
    actions.push(`${critical.length} critical insight(s) require immediate founder review.`);
    riskLevel = 'critical';
    systemStatus = 'critical';
    priority = 'critical';
    nextReviewIn = 5; // Review in 5 minutes
  }

  // ========== AGENT HEALTH ANALYSIS ==========
  if (systemHealth && systemHealth.errorAgents > 0) {
    focusAreas.push('agent_failures');
    actions.push(
      `${systemHealth.errorAgents} agent(s) in ERROR state. Restart affected agents and investigate root causes.`
    );
    if (riskLevel !== 'critical') {
      riskLevel = 'critical';
      systemStatus = 'critical';
      priority = 'critical';
      nextReviewIn = 5;
    }
  }

  if (systemHealth && systemHealth.degradedAgents > 0) {
    focusAreas.push('agent_degradation');
    actions.push(`${systemHealth.degradedAgents} agent(s) DEGRADED. Monitor closely and reduce workload.`);
    if (riskLevel === 'low') {
      riskLevel = 'high';
      systemStatus = 'degraded';
      priority = 'high';
      nextReviewIn = 15;
    }
  }

  // ========== WORKLOAD ANALYSIS ==========
  if (systemHealth && systemHealth.totalActiveWorkflows > 100) {
    focusAreas.push('high_workload');
    actions.push(`${systemHealth.totalActiveWorkflows} active workflows. Consider load balancing or queueing.`);
    if (!focusAreas.includes('agent_failures') && riskLevel !== 'critical') {
      riskLevel = 'medium';
      priority = 'medium';
    }
  }

  // ========== WARNING ANALYSIS ==========
  if (warnings.length > 5 && !focusAreas.includes('critical_risks')) {
    focusAreas.push('emerging_risks');
    actions.push(`${warnings.length} warning insight(s) detected. Monitor and prepare mitigation.`);
    if (riskLevel === 'low') {
      riskLevel = 'medium';
      priority = 'medium';
      nextReviewIn = 30;
    }
  }

  // ========== THEME DISTRIBUTION ANALYSIS ==========
  const themeStats = insightStats.byTheme;
  const dominantTheme = Object.entries(themeStats).sort((a, b) => b[1] - a[1])[0];
  if (dominantTheme && dominantTheme[1] > 10) {
    focusAreas.push(`concentrated_${dominantTheme[0]}_focus`);
    actions.push(
      `High concentration of ${dominantTheme[0]} insights (${dominantTheme[1]}). Investigate root cause.`
    );
  }

  // ========== CONFIDENCE ANALYSIS ==========
  if (insightStats.avgConfidence < 0.6) {
    focusAreas.push('low_confidence');
    actions.push('Average insight confidence is low. Collect more data before major decisions.');
  }

  // ========== DEFAULT HEALTHY STATE ==========
  if (focusAreas.length === 0) {
    focusAreas.push('steady_state_optimization');
    actions.push('System operating normally. Continue monitoring and optimize workflows.');
    riskLevel = 'low';
    systemStatus = 'healthy';
    priority = 'low';
    nextReviewIn = 120; // Review in 2 hours
  }

  // ========== CALCULATE CONFIDENCE ==========
  // Confidence is higher when we have more data and consistent insights
  const dataQuality = Math.min(
    1,
    (agentStates.length / 6) * // Expected 6 agents
      (insightStats.totalInsights / 50) * // Expected 50+ insights
      insightStats.avgConfidence
  );

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    systemStatus,
    priority,
    focusAreas,
    recommendedActions: actions,
    riskLevel,
    nextReviewIn,
    confidence: Math.max(0, Math.min(1, dataQuality)),
  };
}

/**
 * Get quick system status without full reasoning
 */
export function getQuickSystemStatus() {
  const systemHealth = getSystemHealthSummary();

  if (!systemHealth) {
    return {
      status: 'unknown' as const,
      message: 'No agent data available',
    };
  }

  if (systemHealth.errorAgents > 0) {
    return {
      status: 'error' as const,
      message: `${systemHealth.errorAgents} agent(s) in error state`,
    };
  }

  if (systemHealth.degradedAgents > 0) {
    return {
      status: 'degraded' as const,
      message: `${systemHealth.degradedAgents} agent(s) degraded`,
    };
  }

  if (systemHealth.systemHealth < 70) {
    return {
      status: 'warning' as const,
      message: `System health at ${systemHealth.systemHealth.toFixed(1)}%`,
    };
  }

  return {
    status: 'healthy' as const,
    message: `All systems operational (${systemHealth.agentCount} agents)`,
  };
}

/**
 * Generate a human-readable briefing
 */
export function generateFounderBriefing(decision: MetaDecision): string {
  const timestamp = new Date(decision.createdAt).toLocaleString();
  const riskEmoji = {
    low: '🟢',
    medium: '🟡',
    high: '🔴',
    critical: '🚨',
  };

  let briefing = `FOUNDER INTELLIGENCE BRIEFING\n`;
  briefing += `Generated: ${timestamp}\n`;
  briefing += `Status: ${decision.systemStatus.toUpperCase()}\n`;
  briefing += `Risk Level: ${riskEmoji[decision.riskLevel]} ${decision.riskLevel.toUpperCase()}\n`;
  briefing += `Priority: ${decision.priority.toUpperCase()}\n\n`;

  briefing += `FOCUS AREAS:\n`;
  for (const area of decision.focusAreas) {
    briefing += `  • ${area.replace(/_/g, ' ')}\n`;
  }

  briefing += `\nRECOMMENDED ACTIONS:\n`;
  for (const action of decision.recommendedActions) {
    briefing += `  ► ${action}\n`;
  }

  briefing += `\nConfidence: ${(decision.confidence * 100).toFixed(0)}%\n`;
  briefing += `Next Review: ${decision.nextReviewIn} minutes\n`;

  return briefing;
}
