/**
 * Navigator Inference Engine
 * Phase 96: Generate insights from collected inputs
 */

import type {
  CollectedInput,
  NavigatorInsight,
  InsightCategory,
  ConfidenceBand,
  InsightDetail,
} from './navigatorTypes';

interface GeneratedInsight {
  category: InsightCategory;
  title: string;
  detail: InsightDetail;
  confidence: number;
  priority: number;
  sourceSignals: string[];
  uncertaintyNotes: string;
}

export function generateInsights(inputs: CollectedInput[]): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // Process each input source
  for (const input of inputs) {
    const sourceInsights = processInput(input);
    insights.push(...sourceInsights);
  }

  // Cross-input analysis
  const crossInsights = analyzeCrossInputPatterns(inputs);
  insights.push(...crossInsights);

  // Sort by priority
  insights.sort((a, b) => b.priority - a.priority);

  return insights;
}

function processInput(input: CollectedInput): GeneratedInsight[] {
  switch (input.source) {
    case 'opportunity_engine':
      return processOpportunityInput(input);
    case 'early_warning':
      return processWarningInput(input);
    case 'performance_reality':
      return processPerformanceInput(input);
    case 'compliance_engine':
      return processComplianceInput(input);
    case 'region_scaling':
      return processScalingInput(input);
    case 'intelligence_mesh':
      return processMeshInput(input);
    default:
      return [];
  }
}

function processOpportunityInput(input: CollectedInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const data = input.data as Record<string, unknown>;

  const totalOpps = (data.totalOpportunities as number) || 0;
  const highConf = (data.highConfidence as number) || 0;

  if (highConf >= 3) {
    insights.push({
      category: 'opportunity',
      title: 'Multiple High-Confidence Opportunities Detected',
      detail: {
        description: `${highConf} opportunities with confidence above 70% are currently active. Consider prioritizing these for action.`,
        dataPoints: [
          { metric: 'High Confidence', value: highConf },
          { metric: 'Total Active', value: totalOpps },
        ],
        suggestedActions: [
          'Review opportunity details in Opportunity Radar',
          'Prioritize by window type (7-day first)',
        ],
      },
      confidence: input.confidence,
      priority: 8,
      sourceSignals: ['opportunity_engine'],
      uncertaintyNotes: 'Opportunities are probabilistic estimates. Actual outcomes may differ.',
    });
  }

  if (totalOpps === 0) {
    insights.push({
      category: 'opportunity',
      title: 'No Active Opportunities',
      detail: {
        description: 'No opportunity windows are currently detected. This may indicate insufficient data or stable conditions.',
        dataPoints: [{ metric: 'Active Opportunities', value: 0 }],
        suggestedActions: ['Generate new opportunities', 'Review signal collection'],
      },
      confidence: 0.6,
      priority: 4,
      sourceSignals: ['opportunity_engine'],
      uncertaintyNotes: 'Absence of opportunities does not indicate poor performance.',
    });
  }

  return insights;
}

function processWarningInput(input: CollectedInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const data = input.data as Record<string, unknown>;

  const activeWarnings = (data.activeWarnings as number) || 0;
  const criticalCount = (data.criticalCount as number) || 0;

  if (criticalCount > 0) {
    insights.push({
      category: 'warning',
      title: 'Critical Warnings Require Attention',
      detail: {
        description: `${criticalCount} critical warning(s) detected. Immediate review recommended.`,
        dataPoints: [
          { metric: 'Critical', value: criticalCount },
          { metric: 'Total Warnings', value: activeWarnings },
        ],
        suggestedActions: [
          'Review Early Warning dashboard immediately',
          'Assess potential impact on operations',
        ],
      },
      confidence: input.confidence,
      priority: 10,
      sourceSignals: ['early_warning'],
      uncertaintyNotes: 'Warning severity is estimated based on pattern detection.',
    });
  } else if (activeWarnings === 0) {
    insights.push({
      category: 'warning',
      title: 'No Active Warnings',
      detail: {
        description: 'No early warnings are currently active. Systems appear stable.',
        dataPoints: [{ metric: 'Active Warnings', value: 0 }],
      },
      confidence: 1.0,
      priority: 2,
      sourceSignals: ['early_warning'],
      uncertaintyNotes: 'Absence of warnings does not guarantee stability.',
    });
  }

  return insights;
}

function processPerformanceInput(input: CollectedInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const data = input.data as Record<string, unknown>;

  const engagementRate = data.engagementRate as number | undefined;
  const growthRate = data.growthRate as number | undefined;

  if (engagementRate !== undefined) {
    const trend = engagementRate > 0.5 ? 'up' : engagementRate < 0.3 ? 'down' : 'stable';
    insights.push({
      category: 'performance',
      title: `Engagement ${trend === 'up' ? 'Trending Up' : trend === 'down' ? 'Below Average' : 'Stable'}`,
      detail: {
        description: `Current engagement rate is ${(engagementRate * 100).toFixed(1)}%.`,
        dataPoints: [
          { metric: 'Engagement Rate', value: `${(engagementRate * 100).toFixed(1)}%`, trend },
        ],
      },
      confidence: input.confidence,
      priority: trend === 'down' ? 7 : 5,
      sourceSignals: ['performance_reality'],
      uncertaintyNotes: 'Performance metrics are snapshots and may not reflect real-time state.',
    });
  }

  return insights;
}

function processComplianceInput(input: CollectedInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const data = input.data as Record<string, unknown>;

  const openIncidents = (data.openIncidents as number) || 0;
  const bySeverity = (data.bySeverity as Record<string, number>) || {};

  if (openIncidents > 0) {
    const hasCritical = (bySeverity['critical'] || 0) > 0;
    insights.push({
      category: 'compliance',
      title: hasCritical ? 'Critical Compliance Issues Open' : 'Compliance Incidents Require Review',
      detail: {
        description: `${openIncidents} compliance incident(s) are currently open.`,
        dataPoints: Object.entries(bySeverity).map(([severity, count]) => ({
          metric: severity.charAt(0).toUpperCase() + severity.slice(1),
          value: count,
        })),
        suggestedActions: ['Review compliance dashboard', 'Address critical issues first'],
      },
      confidence: input.confidence,
      priority: hasCritical ? 9 : 6,
      sourceSignals: ['compliance_engine'],
      uncertaintyNotes: 'Compliance detection is pattern-based and may have false positives.',
    });
  }

  return insights;
}

function processScalingInput(input: CollectedInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const data = input.data as Record<string, unknown>;

  const scalingMode = data.scalingMode as string;
  const budgetUtilization = data.budgetUtilization as number;

  if (scalingMode === 'throttled' || scalingMode === 'frozen') {
    insights.push({
      category: 'scaling',
      title: `Region in ${scalingMode.charAt(0).toUpperCase() + scalingMode.slice(1)} Mode`,
      detail: {
        description: `Region scaling is currently ${scalingMode}. Operations may be limited.`,
        dataPoints: [
          { metric: 'Scaling Mode', value: scalingMode },
          { metric: 'Budget Used', value: `${(budgetUtilization * 100).toFixed(0)}%` },
        ],
        suggestedActions: ['Review region health', 'Consider budget adjustment'],
      },
      confidence: 0.9,
      priority: 8,
      sourceSignals: ['region_scaling'],
      uncertaintyNotes: 'Scaling mode is based on current metrics and may change.',
    });
  }

  if (budgetUtilization > 0.9) {
    insights.push({
      category: 'scaling',
      title: 'AI Budget Near Limit',
      detail: {
        description: `Budget utilization is at ${(budgetUtilization * 100).toFixed(0)}%. Operations may be restricted soon.`,
        dataPoints: [{ metric: 'Budget Utilization', value: `${(budgetUtilization * 100).toFixed(0)}%` }],
        suggestedActions: ['Review spending patterns', 'Consider budget increase'],
      },
      confidence: 0.95,
      priority: 7,
      sourceSignals: ['region_scaling'],
      uncertaintyNotes: 'Budget projections assume current spending patterns continue.',
    });
  }

  return insights;
}

function processMeshInput(input: CollectedInput): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];
  const data = input.data as Record<string, unknown>;

  const totalNodes = (data.totalNodes as number) || 0;
  const avgConfidence = (data.avgConfidence as number) || 0;

  if (totalNodes > 0 && avgConfidence < 0.5) {
    insights.push({
      category: 'strategic',
      title: 'Intelligence Mesh Confidence Low',
      detail: {
        description: `Average mesh confidence is ${(avgConfidence * 100).toFixed(0)}%. Data quality may need attention.`,
        dataPoints: [
          { metric: 'Total Nodes', value: totalNodes },
          { metric: 'Avg Confidence', value: `${(avgConfidence * 100).toFixed(0)}%` },
        ],
        suggestedActions: ['Review data sources', 'Improve signal quality'],
      },
      confidence: avgConfidence,
      priority: 5,
      sourceSignals: ['intelligence_mesh'],
      uncertaintyNotes: 'Confidence scores reflect data quality, not system health.',
    });
  }

  return insights;
}

function analyzeCrossInputPatterns(inputs: CollectedInput[]): GeneratedInsight[] {
  const insights: GeneratedInsight[] = [];

  // Find opportunities + warnings combination
  const opportunities = inputs.find(i => i.source === 'opportunity_engine');
  const warnings = inputs.find(i => i.source === 'early_warning');

  if (opportunities && warnings) {
    const oppData = opportunities.data as Record<string, unknown>;
    const warnData = warnings.data as Record<string, unknown>;

    const highOpps = (oppData.highConfidence as number) || 0;
    const activeWarnings = (warnData.activeWarnings as number) || 0;

    if (highOpps > 0 && activeWarnings === 0) {
      insights.push({
        category: 'strategic',
        title: 'Favorable Conditions for Action',
        detail: {
          description: 'Multiple opportunities detected with no active warnings. Conditions appear favorable for execution.',
          dataPoints: [
            { metric: 'High-Conf Opportunities', value: highOpps },
            { metric: 'Active Warnings', value: 0 },
          ],
          suggestedActions: ['Prioritize opportunity execution', 'Maintain monitoring'],
        },
        confidence: Math.min(opportunities.confidence, 0.8),
        priority: 7,
        sourceSignals: ['opportunity_engine', 'early_warning'],
        uncertaintyNotes: 'Favorable conditions do not guarantee positive outcomes.',
      });
    }
  }

  return insights;
}

export function getConfidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.7) {
return 'high';
}
  if (confidence >= 0.5) {
return 'medium';
}
  if (confidence >= 0.3) {
return 'low';
}
  return 'exploratory';
}
