/**
 * Client Agent Truth Adapter
 * Phase 83: Ensures Truth Layer compliance for agent actions
 */

import {
  ClientAgentAction,
  ActionProposal,
  DataSource,
} from './clientAgentTypes';

/**
 * Validate action for truth compliance
 */
export function validateTruthCompliance(action: ClientAgentAction): {
  compliant: boolean;
  issues: string[];
  disclaimers: string[];
} {
  const issues: string[] = [];
  const disclaimers: string[] = [];

  // Check confidence level
  if (action.confidence_score < 0.5) {
    issues.push('Confidence below minimum threshold (50%)');
  } else if (action.confidence_score < 0.7) {
    disclaimers.push(`Moderate confidence (${Math.round(action.confidence_score * 100)}%): Results should be reviewed.`);
  }

  // Check data sources
  if (action.data_sources.length === 0) {
    disclaimers.push('No data sources cited. Action based on user request.');
  } else {
    const avgReliability = action.data_sources.reduce((sum, ds) => sum + ds.reliability, 0) / action.data_sources.length;

    if (avgReliability < 0.5) {
      issues.push('Data sources have low average reliability');
    } else if (avgReliability < 0.7) {
      disclaimers.push('Some data sources have moderate reliability.');
    }

    // Check recency
    const staleCount = action.data_sources.filter(ds =>
      ds.recency.includes('day') || ds.recency.includes('week')
    ).length;

    if (staleCount > 0) {
      disclaimers.push(`${staleCount} data source(s) may not reflect latest state.`);
    }
  }

  // Check risk level
  if (action.risk_level === 'high') {
    disclaimers.push('High-risk action. Human review recommended.');
  }

  // Check for fabrication indicators
  if (action.agent_reasoning?.includes('assume') || action.agent_reasoning?.includes('likely')) {
    disclaimers.push('Reasoning includes assumptions. Verify before execution.');
  }

  return {
    compliant: issues.length === 0,
    issues,
    disclaimers,
  };
}

/**
 * Adapt proposal for truth compliance
 */
export function adaptProposalForTruth(proposal: ActionProposal): {
  adapted: ActionProposal;
  disclaimers: string[];
} {
  const disclaimers: string[] = [];
  const adapted = { ...proposal };

  // Ensure confidence is set
  if (!adapted.confidence_score) {
    adapted.confidence_score = 0.7;
    disclaimers.push('Confidence score auto-assigned (70%).');
  }

  // Ensure data sources are documented
  if (!adapted.data_sources || adapted.data_sources.length === 0) {
    adapted.data_sources = [
      {
        source: 'User request',
        recency: 'Current',
        reliability: 0.9,
      },
    ];
  }

  // Sanitize reasoning
  if (adapted.agent_reasoning) {
    // Remove absolute claims
    adapted.agent_reasoning = adapted.agent_reasoning
      .replace(/\bwill definitely\b/gi, 'may')
      .replace(/\bguarantee\b/gi, 'expect')
      .replace(/\balways\b/gi, 'typically')
      .replace(/\bnever\b/gi, 'rarely');
  }

  // Add low-confidence disclaimer
  if (adapted.confidence_score < 0.6) {
    disclaimers.push(`Low confidence (${Math.round(adapted.confidence_score * 100)}%): This recommendation is based on limited data.`);
  }

  return { adapted, disclaimers };
}

/**
 * Generate truth disclaimer based on context
 */
export function generateTruthDisclaimer(
  action: ClientAgentAction
): string {
  const parts: string[] = [];

  // Confidence statement
  if (action.confidence_score >= 0.8) {
    parts.push(`High confidence (${Math.round(action.confidence_score * 100)}%).`);
  } else if (action.confidence_score >= 0.6) {
    parts.push(`Moderate confidence (${Math.round(action.confidence_score * 100)}%).`);
  } else {
    parts.push(`Low confidence (${Math.round(action.confidence_score * 100)}%). Review recommended.`);
  }

  // Data source summary
  if (action.data_sources.length === 0) {
    parts.push('Based on user request.');
  } else if (action.data_sources.length === 1) {
    parts.push(`Based on 1 data source.`);
  } else {
    const avgRel = action.data_sources.reduce((s, d) => s + d.reliability, 0) / action.data_sources.length;
    parts.push(`Based on ${action.data_sources.length} sources (avg reliability: ${Math.round(avgRel * 100)}%).`);
  }

  // Risk statement
  if (action.risk_level === 'high') {
    parts.push('High-risk action.');
  } else if (action.risk_level === 'medium') {
    parts.push('Medium-risk action.');
  }

  return parts.join(' ');
}

/**
 * Check if action meets minimum truth standards
 */
export function meetsMinimumTruthStandards(action: ClientAgentAction): boolean {
  // Must have valid confidence
  if (action.confidence_score < 0.3) {
    return false;
  }

  // Must have reasoning
  if (!action.agent_reasoning || action.agent_reasoning.length < 10) {
    return false;
  }

  // High-risk actions need higher confidence
  if (action.risk_level === 'high' && action.confidence_score < 0.7) {
    return false;
  }

  return true;
}

/**
 * Score truth compliance (0-100)
 */
export function scoreTruthCompliance(action: ClientAgentAction): number {
  let score = 0;

  // Confidence contributes 40%
  score += action.confidence_score * 40;

  // Data sources contribute 30%
  if (action.data_sources.length > 0) {
    const avgReliability = action.data_sources.reduce((s, d) => s + d.reliability, 0) / action.data_sources.length;
    score += avgReliability * 30;
  }

  // Reasoning quality contributes 20%
  if (action.agent_reasoning) {
    const reasoningLength = action.agent_reasoning.length;
    if (reasoningLength >= 100) {
score += 20;
} else if (reasoningLength >= 50) {
score += 15;
} else if (reasoningLength >= 20) {
score += 10;
} else {
score += 5;
}
  }

  // Risk-appropriate confidence contributes 10%
  if (action.risk_level === 'low' || (action.risk_level === 'medium' && action.confidence_score >= 0.6) || (action.risk_level === 'high' && action.confidence_score >= 0.8)) {
    score += 10;
  }

  return Math.round(score);
}

/**
 * Suggest improvements for truth compliance
 */
export function suggestTruthImprovements(action: ClientAgentAction): string[] {
  const suggestions: string[] = [];

  if (action.confidence_score < 0.7) {
    suggestions.push('Increase confidence by gathering more data or narrowing action scope.');
  }

  if (action.data_sources.length === 0) {
    suggestions.push('Add data source citations to support the action.');
  }

  if (action.data_sources.some(ds => ds.reliability < 0.6)) {
    suggestions.push('Use more reliable data sources where available.');
  }

  if (!action.agent_reasoning || action.agent_reasoning.length < 50) {
    suggestions.push('Provide more detailed reasoning for the action.');
  }

  if (action.risk_level === 'high' && action.confidence_score < 0.8) {
    suggestions.push('High-risk actions require confidence >= 80%.');
  }

  return suggestions;
}
