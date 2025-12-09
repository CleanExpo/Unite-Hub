/**
 * Business Brain
 *
 * Unifies lead, revenue, operations, profit, risk, staff, and market intelligence
 * into a comprehensive daily strategy engine.
 * Aggregates signals from all agent domains and presents unified briefings.
 */

import { listGoals, evaluateGoalProgress } from './goalEngine';
// import { getLeadMetrics } from '@/agents/email/emailProcessor'; // Integration point
// import { getCampaignPerformance } from '@/agents/content/contentAgent'; // Integration point
// import { getRevenueMetrics } from '@/lib/business/metrics'; // Integration point

export type BusinessDimension = 'leads' | 'revenue' | 'operations' | 'profit' | 'risk' | 'people' | 'market';

export interface DimensionMetrics {
  dimension: BusinessDimension;
  status: 'excellent' | 'good' | 'adequate' | 'at-risk' | 'critical';
  primaryMetric: string;
  primaryValue: number;
  unit: string;
  trend: 'up' | 'flat' | 'down';
  weekOverWeekChange: number; // Percentage
  goals: any[];
  alerts: string[];
  recommendations: string[];
}

export interface BusinessBrainSummary {
  id: string;
  date: string; // ISO date
  generatedAt: string;
  owner: string; // 'phill'

  // Overall health
  overallStatus: 'excellent' | 'good' | 'adequate' | 'at-risk' | 'critical';
  healthScore: number; // 0-100

  // Dimensional breakdowns
  dimensions: DimensionMetrics[];

  // Strategic insights
  topOpportunities: string[];
  topRisks: string[];
  criticalDecisions: string[];

  // Action items
  immediateActions: string[];
  weeklyPriorities: string[];
  strategicThemes: string[];

  // Metadata
  dataQuality: 'complete' | 'partial' | 'minimal';
  lastUpdated: string;
}

/**
 * Generate comprehensive business brain summary
 */
export function generateBusinessBrainSummary(owner: string): BusinessBrainSummary {
  const now = new Date();
  const today = now.toISOString().split('T')[0];

  // Gather dimensions
  const dimensions: DimensionMetrics[] = [];

  // 1. LEADS DIMENSION
  dimensions.push(generateLeadsDimension());

  // 2. REVENUE DIMENSION
  dimensions.push(generateRevenueDimension());

  // 3. OPERATIONS DIMENSION
  dimensions.push(generateOperationsDimension());

  // 4. PROFIT DIMENSION
  dimensions.push(generateProfitDimension());

  // 5. RISK DIMENSION
  dimensions.push(generateRiskDimension());

  // 6. PEOPLE DIMENSION
  dimensions.push(generatePeopleDimension());

  // 7. MARKET DIMENSION
  dimensions.push(generateMarketDimension());

  // Calculate overall health
  const statusScores = {
    excellent: 100,
    good: 75,
    adequate: 50,
    'at-risk': 25,
    critical: 0
  };

  const healthScore = Math.round(
    dimensions.reduce((sum, d) => sum + statusScores[d.status as keyof typeof statusScores], 0) / dimensions.length
  );

  let overallStatus: 'excellent' | 'good' | 'adequate' | 'at-risk' | 'critical';
  if (healthScore >= 85) {
overallStatus = 'excellent';
} else if (healthScore >= 70) {
overallStatus = 'good';
} else if (healthScore >= 50) {
overallStatus = 'adequate';
} else if (healthScore >= 25) {
overallStatus = 'at-risk';
} else {
overallStatus = 'critical';
}

  // Extract top opportunities, risks, decisions
  const topOpportunities = dimensions
    .filter(d => d.status === 'good' || d.status === 'excellent')
    .flatMap(d => d.recommendations)
    .slice(0, 3);

  const topRisks = dimensions.filter(d => d.status === 'at-risk' || d.status === 'critical').flatMap(d => d.alerts);

  const criticalDecisions = dimensions
    .filter(d => d.status === 'critical' || d.status === 'at-risk')
    .map(d => `Decision required for ${d.dimension}: ${d.alerts[0] || 'Review needed'}`);

  return {
    id: crypto.randomUUID(),
    date: today,
    generatedAt: now.toISOString(),
    owner,

    overallStatus,
    healthScore,

    dimensions,

    topOpportunities,
    topRisks,
    criticalDecisions,

    immediateActions: [
      'Review critical dimension alerts above',
      'Check market intelligence for today',
      'Prioritize weekly goals'
    ],
    weeklyPriorities: [
      'Focus on at-risk goals',
      'Capitalize on emerging opportunities',
      'Monitor risk indicators'
    ],
    strategicThemes: ['Sustainable growth', 'Risk management', 'Team enablement'],

    dataQuality: 'partial', // Stub - would be complete when all integrations are live
    lastUpdated: now.toISOString()
  };
}

/**
 * Leads dimension
 */
function generateLeadsDimension(): DimensionMetrics {
  // Integration point: getLeadMetrics() from email agent
  const goals = listGoals({ domain: 'leads' });

  return {
    dimension: 'leads',
    status: 'good',
    primaryMetric: 'New qualified leads',
    primaryValue: 24,
    unit: 'this week',
    trend: 'up',
    weekOverWeekChange: 12,
    goals: goals.map(g => ({
      title: g.title,
      progress: evaluateGoalProgress(g).progressPercent
    })),
    alerts: [],
    recommendations: ['Continue current lead gen strategy', 'A/B test email subject lines for better CTR']
  };
}

/**
 * Revenue dimension
 */
function generateRevenueDimension(): DimensionMetrics {
  // Integration point: getCampaignPerformance() from content agent
  const goals = listGoals({ domain: 'revenue' });

  return {
    dimension: 'revenue',
    status: 'adequate',
    primaryMetric: 'Monthly recurring revenue',
    primaryValue: 45200,
    unit: 'USD',
    trend: 'up',
    weekOverWeekChange: 3,
    goals: goals.map(g => ({
      title: g.title,
      progress: evaluateGoalProgress(g).progressPercent
    })),
    alerts: ['Q4 revenue growth slower than target'],
    recommendations: [
      'Increase customer lifetime value focus',
      'Launch upsell campaign for existing customers',
      'Analyze churn patterns'
    ]
  };
}

/**
 * Operations dimension
 */
function generateOperationsDimension(): DimensionMetrics {
  const goals = listGoals({ domain: 'operations' });

  return {
    dimension: 'operations',
    status: 'excellent',
    primaryMetric: 'Process efficiency',
    primaryValue: 94,
    unit: '%',
    trend: 'flat',
    weekOverWeekChange: 0,
    goals: goals.map(g => ({
      title: g.title,
      progress: evaluateGoalProgress(g).progressPercent
    })),
    alerts: [],
    recommendations: ['Maintain current operational excellence', 'Document processes for scaling']
  };
}

/**
 * Profit dimension
 */
function generateProfitDimension(): DimensionMetrics {
  const goals = listGoals({ domain: 'profit' });

  return {
    dimension: 'profit',
    status: 'good',
    primaryMetric: 'Gross margin',
    primaryValue: 68,
    unit: '%',
    trend: 'up',
    weekOverWeekChange: 2,
    goals: goals.map(g => ({
      title: g.title,
      progress: evaluateGoalProgress(g).progressPercent
    })),
    alerts: [],
    recommendations: ['Continue cost optimization efforts', 'Increase pricing on top-tier products']
  };
}

/**
 * Risk dimension
 */
function generateRiskDimension(): DimensionMetrics {
  // Integration point: Phase 8 risk assessment
  const goals = listGoals({ domain: 'operations' }); // Proxy for risk-related goals

  return {
    dimension: 'risk',
    status: 'good',
    primaryMetric: 'Risk health score',
    primaryValue: 82,
    unit: '/100',
    trend: 'flat',
    weekOverWeekChange: 0,
    goals: goals.map(g => ({
      title: g.title,
      progress: evaluateGoalProgress(g).progressPercent
    })),
    alerts: ['Monitor: AI token cost exposure', 'Watch: Market volatility impact on customer acquisition'],
    recommendations: ['Review Phase 8 governance policies quarterly', 'Set hard spend limits on high-risk operations']
  };
}

/**
 * People dimension
 */
function generatePeopleDimension(): DimensionMetrics {
  return {
    dimension: 'people',
    status: 'adequate',
    primaryMetric: 'Team satisfaction',
    primaryValue: 6.8,
    unit: '/10',
    trend: 'up',
    weekOverWeekChange: 4,
    goals: [],
    alerts: ['Need to clarify Q1 roadmap for team alignment'],
    recommendations: ['Schedule team planning session', 'Increase transparency on business metrics']
  };
}

/**
 * Market dimension
 */
function generateMarketDimension(): DimensionMetrics {
  // Integration point: Research agent for market intelligence
  return {
    dimension: 'market',
    status: 'good',
    primaryMetric: 'Market opportunity index',
    primaryValue: 7.2,
    unit: '/10',
    trend: 'up',
    weekOverWeekChange: 8,
    goals: [],
    alerts: [],
    recommendations: [
      'Emerging AI tooling market heating up',
      'Customer acquisition cost rising across industry',
      'Window of opportunity in SMB segment'
    ]
  };
}

/**
 * Get dimension details
 */
export function getDimensionDetails(dimension: BusinessDimension): DimensionMetrics | null {
  const generators: Record<BusinessDimension, () => DimensionMetrics> = {
    leads: generateLeadsDimension,
    revenue: generateRevenueDimension,
    operations: generateOperationsDimension,
    profit: generateProfitDimension,
    risk: generateRiskDimension,
    people: generatePeopleDimension,
    market: generateMarketDimension
  };

  return generators[dimension]?.() || null;
}

/**
 * Get at-risk dimensions
 */
export function getAtRiskDimensions(summary: BusinessBrainSummary): DimensionMetrics[] {
  return summary.dimensions.filter(d => d.status === 'at-risk' || d.status === 'critical');
}

/**
 * Get strategic themes
 */
export function getStrategicThemes(summary: BusinessBrainSummary): string[] {
  const themes: string[] = [];

  // Lead theme
  const leadsDim = summary.dimensions.find(d => d.dimension === 'leads');
  if (leadsDim?.status === 'critical' || leadsDim?.status === 'at-risk') {
    themes.push('🎯 Lead generation acceleration needed');
  }

  // Profitability theme
  const profitDim = summary.dimensions.find(d => d.dimension === 'profit');
  if (profitDim?.status === 'excellent' || profitDim?.status === 'good') {
    themes.push('💰 Unit economics are strong – scale opportunity exists');
  }

  // Operational excellence
  const opsDim = summary.dimensions.find(d => d.dimension === 'operations');
  if (opsDim?.status === 'excellent') {
    themes.push('⚙️ Operational excellence – ready for growth');
  }

  // Risk management
  const riskDim = summary.dimensions.find(d => d.dimension === 'risk');
  if (riskDim?.alerts && riskDim.alerts.length > 0) {
    themes.push('🛡️ Proactive risk management in place');
  }

  // People theme
  const peopleDim = summary.dimensions.find(d => d.dimension === 'people');
  if (peopleDim?.status === 'at-risk') {
    themes.push('👥 Team alignment and clarity needed');
  }

  return themes.length > 0 ? themes : ['📊 Business operating at expected levels'];
}
