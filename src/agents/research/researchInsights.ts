/**
 * Research Insights
 *
 * Analysis layer for research results.
 * Summarizes, threat-detects, and generates recommendations.
 *
 * Used by: Research agent for analysis
 */

import type { ResearchInsight } from './researchAgent';

/**
 * Summarize insights into actionable text
 */
export function summariseInsights(insights: ResearchInsight[]): string {
  if (insights.length === 0) {
return 'No insights gathered.';
}

  const summary = insights.map((i) => `${i.insight} (confidence: ${i.confidence || 0.75})`).join(' | ');

  return summary;
}

/**
 * Detect threat level based on insights
 * Returns: 'low' | 'medium' | 'high'
 */
export function detectThreatLevel(insights: ResearchInsight[]): 'low' | 'medium' | 'high' {
  if (insights.length === 0) {
return 'low';
}

  const text = JSON.stringify(insights).toLowerCase();
  const avgConfidence =
    insights.reduce((sum, i) => sum + (i.confidence || 0.75), 0) / insights.length;

  // High threat signals
  const highThreatKeywords = [
    'volatility',
    'decline',
    'risk',
    'threat',
    'outage',
    'critical',
    'emergency',
    'breach',
    'failure',
    'shutdown',
  ];

  // Medium threat signals
  const mediumThreatKeywords = [
    'shift',
    'movement',
    'change',
    'increase',
    'decrease',
    'disruption',
    'competitive',
    'loss',
    'competitor launching',
  ];

  let threatCount = 0;

  // Check for high threat keywords
  highThreatKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
threatCount += 2;
}
  });

  // Check for medium threat keywords
  mediumThreatKeywords.forEach((keyword) => {
    if (text.includes(keyword)) {
threatCount += 1;
}
  });

  // Adjust by confidence
  if (avgConfidence < 0.7) {
threatCount = Math.max(0, threatCount - 1);
}
  if (avgConfidence > 0.85) {
threatCount += 1;
}

  if (threatCount >= 4) {
return 'high';
}
  if (threatCount >= 2) {
return 'medium';
}
  return 'low';
}

/**
 * Generate actionable recommendations based on threat level
 */
export function generateRecommendations(insights: ResearchInsight[]): string[] {
  const threatLevel = detectThreatLevel(insights);
  const text = JSON.stringify(insights).toLowerCase();

  const recommendations: string[] = [];

  // Threat-specific recommendations
  if (threatLevel === 'high') {
    recommendations.push('🚨 URGENT: Founder review required immediately.');
    recommendations.push('Potential strategic pivot or messaging update needed.');
    recommendations.push('Increase monitoring frequency to daily.');
    recommendations.push('Prepare contingency plans and response strategies.');

    // Specific threat analysis
    if (text.includes('volatility') || text.includes('algorithm')) {
      recommendations.push('Algorithm volatility detected - diversify traffic sources.');
    }
    if (text.includes('competitor')) {
      recommendations.push('Competitive threat detected - differentiation strategy review needed.');
    }
    if (text.includes('decline') || text.includes('loss')) {
      recommendations.push('Market position declining - immediate action required.');
    }
  } else if (threatLevel === 'medium') {
    recommendations.push('Monitor closely - reassess strategy this quarter.');
    recommendations.push('Prepare content and campaigns to reinforce market positioning.');
    recommendations.push('Update competitive intelligence weekly.');
    recommendations.push('Plan messaging adjustments in next campaign cycle.');

    if (text.includes('shift') || text.includes('movement')) {
      recommendations.push('Market shift detected - update positioning to address new dynamics.');
    }
    if (text.includes('increase') && text.includes('competitor')) {
      recommendations.push('Competitor marketing intensity increasing - maintain visibility.');
    }
  } else {
    recommendations.push('✓ Market conditions stable - maintain current strategy.');
    recommendations.push('Review quarterly for alignment with market trends.');
    recommendations.push('Continue monitoring for emerging changes.');

    if (text.includes('growing') || text.includes('trend')) {
      recommendations.push('Market opportunity detected - explore expansion potential.');
    }
  }

  return recommendations;
}

/**
 * Score insight quality based on confidence
 */
export function scoreInsightQuality(insight: ResearchInsight): number {
  const confidence = insight.confidence || 0.75;
  const sourceReliability = calculateSourceReliability(insight.source);
  const recencyBoost = insight.timestamp ? 1.0 : 0.9;

  return Math.round(confidence * sourceReliability * recencyBoost * 100);
}

/**
 * Calculate source reliability score (0-1)
 */
function calculateSourceReliability(source: string): number {
  const reliabilityScores: Record<string, number> = {
    // Competitor tracking
    competitor_monitor: 0.9,
    marketing_intelligence: 0.85,
    feature_tracking: 0.88,
    customer_sentiment: 0.8,

    // Industry
    industry_report: 0.92,
    demand_intelligence: 0.87,
    regulation_monitor: 0.89,
    market_shift: 0.83,

    // Technology
    tech_radar: 0.84,
    github_trending: 0.91,
    adoption_tracker: 0.82,
    integration_ecosystem: 0.86,

    // Algorithm
    seo_monitor: 0.89,
    ranking_volatility: 0.88,
    algorithm_signal: 0.85,
    feature_changes: 0.82,

    // AI Models
    ai_release_watch: 0.93,
    benchmark_tracker: 0.91,
    capability_analysis: 0.87,
    adoption_rate: 0.85,
  };

  return reliabilityScores[source] || 0.75;
}

/**
 * Identify key themes across insights
 */
export function identifyThemes(insights: ResearchInsight[]): string[] {
  const text = JSON.stringify(insights).toLowerCase();
  const themes: string[] = [];

  const themeKeywords = {
    'AI/ML adoption': ['ai', 'ml', 'machine learning', 'model', 'automation'],
    'Market shift': ['shift', 'change', 'movement', 'trend', 'demand'],
    'Competitive pressure': ['competitor', 'competition', 'market share', 'positioning'],
    'Regulation': ['regulation', 'compliance', 'policy', 'requirement'],
    'Technology evolution': ['technology', 'tool', 'platform', 'feature', 'integration'],
    'Performance changes': ['volatility', 'decline', 'increase', 'growth', 'improve'],
  };

  Object.entries(themeKeywords).forEach(([theme, keywords]) => {
    if (keywords.some((keyword) => text.includes(keyword))) {
      themes.push(theme);
    }
  });

  return themes.length > 0 ? themes : ['General market intelligence'];
}
