/**
 * Analysis Agent
 *
 * Autonomous agent for business intelligence, KPI extraction, anomaly detection,
 * forecasting, and trend analysis across all platform data.
 *
 * Workflow:
 * 1. Collect multi-source datasets (email, research, content, scheduling, staff, financials)
 * 2. Extract and analyze KPIs with trend detection
 * 3. Detect anomalies and outliers
 * 4. Generate forecasts for next period
 * 5. Derive business insights and recommendations
 * 6. Score risks based on insights
 * 7. Route for founder approval if needed
 * 8. Log all analysis events
 */

import type { BrandId } from '@/lib/brands/brandRegistry';
import { scoreRisk } from '@/lib/founder/founderRiskEngine';
import { evaluateApproval } from '@/lib/founder/founderApprovalEngine';
import { logFounderEvent } from '@/lib/founder/founderEventLog';
import { analyseKPIs } from './kpiEngine';
import { detectAnomalies } from './anomalyEngine';
import { generateForecast } from './forecastEngine';
import { deriveInsights } from './insightEngine';

export interface AnalysisDatasets {
  email?: Array<{ opens: number; clicks: number; bounces: number; sent: number }>;
  research?: Array<{ source: string; insight: string; threat_level?: string }>;
  content?: Array<{ intent: string; risk_level: string; ready_to_use: boolean }>;
  scheduling?: Array<{ conflicts: any[]; slots_available: number }>;
  staff?: Array<{ name: string; tasks: number; utilization: number }>;
  financials?: Array<{ date: string; revenue: number; expenses: number }>;
}

export interface KPIResult {
  emailEngagement: number; // 0-100
  emailOpenRate: number; // %
  emailClickRate: number; // %
  emailBouncRate: number; // %
  researchInsights: number; // count
  highThreatInsights: number; // count
  contentGenerated: number; // count
  autoApprovedContent: number; // %
  schedulingEfficiency: number; // 0-100
  schedulingConflicts: number; // count
  staffUtilization: number; // 0-100
  staffOverload: number; // count >80% utilized
  financialHealth: 'strong' | 'stable' | 'at_risk' | 'critical'; // based on revenue/expenses ratio
  profitMargin: number; // %
}

export interface Anomaly {
  type: 'spike' | 'drop' | 'pattern_break' | 'threshold_violation' | 'outlier';
  source: string; // email, research, content, scheduling, staff, financials
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  value: number;
  threshold: number;
  impact: string;
}

export interface Forecast {
  period: '7d' | '30d' | '90d';
  emailPrediction: { sent: number; opens: number; clicks: number };
  contentPrediction: { volume: number; approvalRate: number };
  schedulingPrediction: { proposalsVolume: number; conflictRate: number };
  staffCapacityWarning: boolean;
  revenueProjection: number;
  recommendedActions: string[];
}

export interface Insight {
  title: string;
  description: string;
  evidence: string[]; // supporting data points
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'opportunity' | 'risk' | 'trend' | 'recommendation';
  actionItems: string[];
}

export interface AnalysisResult {
  id: string;
  brand: BrandId;
  timeframe: '24h' | '7d' | '30d' | 'quarter' | 'year';
  generatedAt: string;
  kpis: KPIResult;
  anomalies: Anomaly[];
  forecast: Forecast;
  insights: Insight[];
  riskAssessment: {
    score: number; // 0-100
    level: 'low' | 'medium' | 'high' | 'critical';
    reasons: string[];
  };
  approvalStatus: 'auto_approved' | 'pending_review' | 'pending_approval' | 'rejected';
  requiresFounderReview: boolean;
  metadata: {
    datasetSize: number;
    anomaliesFound: number;
    insightsGenerated: number;
    forecastConfidence: number; // 0-100
  };
}

/**
 * Analyze platform metrics and derive business insights
 */
export async function analyzeMetrics(options: {
  brand: BrandId;
  timeframe: '24h' | '7d' | '30d' | 'quarter' | 'year';
  datasets: AnalysisDatasets;
}): Promise<AnalysisResult> {
  const { brand, timeframe, datasets } = options;
  const id = crypto.randomUUID();

  // Step 1: Extract KPIs
  const kpis = analyseKPIs(datasets);

  // Step 2: Detect anomalies
  const anomalies = detectAnomalies(datasets, kpis);

  // Step 3: Generate forecast
  // Map timeframe to forecast period (only supports 7d, 30d, 90d)
  const forecastPeriod = timeframe === '24h' ? '7d' :
                         timeframe === 'quarter' ? '90d' :
                         timeframe === 'year' ? '90d' :
                         timeframe as '7d' | '30d' | '90d';
  const forecast = generateForecast(datasets, forecastPeriod, kpis);

  // Step 4: Derive insights
  const insights = deriveInsights({
    kpis,
    anomalies,
    forecast,
    brand,
  });

  // Step 5: Risk scoring
  // Build claim based on analysis findings
  const criticalCount = anomalies.filter((a) => a.severity === 'critical').length;
  const claim = criticalCount > 0
    ? `Analysis Report with ${criticalCount} critical anomaly/anomalies`
    : `Analysis Report: ${timeframe}`;

  const riskAssessment = scoreRisk({
    brand,
    claim,
    context: 'internal',
  });

  // Step 6: Approval routing
  const requiresFounderReview =
    riskAssessment.score >= 50 ||
    anomalies.some((a) => a.severity === 'critical') ||
    kpis.financialHealth === 'critical';

  const approvalStatus = requiresFounderReview ? 'pending_review' : 'auto_approved';

  const approval = evaluateApproval({
    id,
    createdAt: new Date().toISOString(),
    riskLevel: riskAssessment.level,
    itemType: 'analysis_report',
    brand,
    summary: `${timeframe} Analysis Report for ${brand}`,
    createdByAgent: 'analysis',
    details: {
      anomaliesFound: anomalies.length,
      criticalAnomalies: anomalies.filter((a) => a.severity === 'critical').length,
      financialHealth: kpis.financialHealth,
      staffOverload: kpis.staffOverload,
    },
  });

  const result: AnalysisResult = {
    id,
    brand,
    timeframe,
    generatedAt: new Date().toISOString(),
    kpis,
    anomalies,
    forecast,
    insights,
    riskAssessment,
    approvalStatus,
    requiresFounderReview,
    metadata: {
      datasetSize: Object.values(datasets).reduce((sum, arr) => sum + (arr?.length || 0), 0),
      anomaliesFound: anomalies.length,
      insightsGenerated: insights.length,
      forecastConfidence: calculateForecastConfidence(datasets),
    },
  };

  // Step 7: Log event
  logFounderEvent({
    timestamp: new Date().toISOString(),
    event: 'agent_action',
    actor: 'analysis_agent',
    data: {
      analysisId: id,
      brand,
      timeframe,
      anomaliesFound: anomalies.length,
      insightsGenerated: insights.length,
      riskScore: riskAssessment.score,
      approvalStatus,
    },
  });

  return result;
}

/**
 * Calculate forecast confidence based on data quality
 */
function calculateForecastConfidence(datasets: AnalysisDatasets): number {
  let confidence = 75; // Base confidence

  // More data = higher confidence
  const totalDataPoints = Object.values(datasets).reduce((sum, arr) => sum + (arr?.length || 0), 0);
  confidence += Math.min(totalDataPoints * 0.5, 20); // +0.5 per data point, max +20

  // Data diversity = higher confidence
  const datasetCount = Object.values(datasets).filter((d) => d && d.length > 0).length;
  confidence += datasetCount * 2; // +2 per dataset source

  return Math.min(confidence, 100);
}

/**
 * Compare analysis results across time periods for trend detection
 */
export function compareTrendAcrossPeriods(
  previous: AnalysisResult,
  current: AnalysisResult
): {
  kpiTrends: Record<string, 'improving' | 'stable' | 'declining'>;
  significantChanges: string[];
  recommendation: string;
} {
  const kpiTrends: Record<string, 'improving' | 'stable' | 'declining'> = {};

  // Email engagement trend
  const emailDelta = current.kpis.emailEngagement - previous.kpis.emailEngagement;
  kpiTrends.emailEngagement =
    emailDelta > 5 ? 'improving' : emailDelta < -5 ? 'declining' : 'stable';

  // Content approval trend
  const contentDelta = current.kpis.autoApprovedContent - previous.kpis.autoApprovedContent;
  kpiTrends.contentApproval =
    contentDelta > 5 ? 'improving' : contentDelta < -5 ? 'declining' : 'stable';

  // Staff utilization trend
  const staffDelta = current.kpis.staffUtilization - previous.kpis.staffUtilization;
  kpiTrends.staffUtilization =
    staffDelta < -5 ? 'improving' : staffDelta > 5 ? 'declining' : 'stable';

  // Identify significant changes
  const significantChanges: string[] = [];
  if (Math.abs(emailDelta) > 15) {
    significantChanges.push(
      `Email engagement ${emailDelta > 0 ? 'increased' : 'decreased'} by ${Math.abs(emailDelta).toFixed(1)}%`
    );
  }
  if (Math.abs(contentDelta) > 10) {
    significantChanges.push(
      `Content approval rate ${contentDelta > 0 ? 'improved' : 'declined'} by ${Math.abs(contentDelta).toFixed(1)}%`
    );
  }
  if (current.anomalies.length > previous.anomalies.length * 2) {
    significantChanges.push('Anomaly detection rate doubled - investigate');
  }

  // Generate recommendation
  let recommendation = 'Continue current operations with regular monitoring.';
  if (significantChanges.length > 0) {
    recommendation = `Address significant changes: ${significantChanges.slice(0, 2).join('; ')}`;
  }
  if (current.riskAssessment.level === 'critical') {
    recommendation = 'CRITICAL: Immediate intervention required. Review founder event log.';
  }

  return { kpiTrends, significantChanges, recommendation };
}
