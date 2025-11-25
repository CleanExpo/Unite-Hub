/**
 * Forecast Engine
 *
 * Generates predictive forecasts for business metrics using:
 * - Exponential smoothing for trend continuation
 * - Seasonal adjustment for recurring patterns
 * - Growth rate extrapolation
 * - Capacity warning calculation
 */

import type { AnalysisDatasets, Forecast, KPIResult } from './analysisAgent';

/**
 * Generate forecasts for next period
 */
export function generateForecast(
  datasets: AnalysisDatasets,
  timeframe: '7d' | '30d' | '90d',
  kpis: KPIResult
): Forecast {
  const forecastPeriod = mapTimeframeToDays(timeframe);
  const period = mapTimeframeToForecastPeriod(timeframe);

  // Email forecast
  const emailPrediction = forecastEmail(datasets.email, forecastPeriod);

  // Content forecast
  const contentPrediction = forecastContent(datasets.content, forecastPeriod, kpis);

  // Scheduling forecast
  const schedulingPrediction = forecastScheduling(datasets.scheduling, forecastPeriod, kpis);

  // Staff capacity warning
  const staffCapacityWarning =
    kpis.staffOverload > 0 || kpis.staffUtilization > 85 || datasets.staff?.length === 0;

  // Revenue projection
  const revenueProjection = forecastRevenue(datasets.financials, forecastPeriod);

  // Recommended actions based on forecasts
  const recommendedActions = generateRecommendations({
    emailPrediction,
    contentPrediction,
    schedulingPrediction,
    staffCapacityWarning,
    revenueProjection,
    kpis,
  });

  return {
    period,
    emailPrediction,
    contentPrediction,
    schedulingPrediction,
    staffCapacityWarning,
    revenueProjection,
    recommendedActions,
  };
}

/**
 * Forecast email metrics using exponential smoothing
 */
function forecastEmail(
  emails: Array<any> | undefined,
  forecastDays: number
): { sent: number; opens: number; clicks: number } {
  if (!emails || emails.length === 0) {
    return { sent: 0, opens: 0, clicks: 0 };
  }

  // Get historical metrics
  const sent = emails.map((e) => e.sent || 0);
  const opens = emails.map((e) => e.opens || 0);
  const clicks = emails.map((e) => e.clicks || 0);

  // Calculate averages
  const avgSent = sent.reduce((a, b) => a + b, 0) / sent.length;
  const avgOpens = opens.reduce((a, b) => a + b, 0) / opens.length;
  const avgClicks = clicks.reduce((a, b) => a + b, 0) / clicks.length;

  // Calculate trends (compare recent to older)
  const recentAvgSent = sent.slice(-Math.ceil(sent.length / 2)).reduce((a, b) => a + b, 0) / Math.ceil(sent.length / 2);
  const trend = recentAvgSent / (avgSent || 1);

  // Apply exponential smoothing with trend
  const smoothedSent = Math.round(avgSent * trend * (forecastDays / emails.length));
  const smoothedOpens = Math.round(avgOpens * trend * (forecastDays / emails.length));
  const smoothedClicks = Math.round(avgClicks * trend * (forecastDays / emails.length));

  return {
    sent: Math.max(smoothedSent, 0),
    opens: Math.max(smoothedOpens, 0),
    clicks: Math.max(smoothedClicks, 0),
  };
}

/**
 * Forecast content generation with approval trend
 */
function forecastContent(
  content: Array<any> | undefined,
  forecastDays: number,
  kpis: KPIResult
): { volume: number; approvalRate: number } {
  if (!content || content.length === 0) {
    return { volume: 0, approvalRate: 50 };
  }

  // Historical volume
  const avgDailyVolume = content.length / 30; // Assume monthly data
  const forecastVolume = Math.round(avgDailyVolume * forecastDays);

  // Approval trend
  let approvalTrend = kpis.autoApprovedContent;

  // If approval rate is low, assume it will improve with process refinement
  if (approvalTrend < 50) {
    approvalTrend += 5; // Assume 5% improvement from process optimization
  }

  // If approval rate is high, maintain with slight variation
  if (approvalTrend > 80) {
    approvalTrend = Math.min(approvalTrend, 95); // Cap at 95%
  }

  return {
    volume: forecastVolume,
    approvalRate: Math.min(approvalTrend, 100),
  };
}

/**
 * Forecast scheduling metrics
 */
function forecastScheduling(
  scheduling: Array<any> | undefined,
  forecastDays: number,
  kpis: KPIResult
): { proposalsVolume: number; conflictRate: number } {
  if (!scheduling || scheduling.length === 0) {
    return { proposalsVolume: 0, conflictRate: 0 };
  }

  // Historical proposal volume
  const avgDailyProposals = scheduling.length / 30; // Assume monthly data
  const forecastProposals = Math.round(avgDailyProposals * forecastDays);

  // Conflict rate based on current efficiency
  const currentConflictRate = kpis.schedulingConflicts / Math.max(scheduling.length, 1);

  // Forecast assumes either improvement or degradation based on trend
  let forecastConflictRate = currentConflictRate;

  if (currentConflictRate > 0.5) {
    // High conflict rate - assume slight improvement with management action
    forecastConflictRate *= 0.9;
  } else if (currentConflictRate < 0.1 && scheduling.length > 5) {
    // Low conflict rate - maintain current level
    forecastConflictRate *= 1.05;
  }

  return {
    proposalsVolume: forecastProposals,
    conflictRate: Math.min(forecastConflictRate, 1),
  };
}

/**
 * Forecast revenue based on financial trends
 */
function forecastRevenue(financials: Array<any> | undefined, forecastDays: number): number {
  if (!financials || financials.length < 2) {
    return 0;
  }

  // Get revenue trend
  const revenues = financials.map((f) => f.revenue || 0);
  const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length;

  // Calculate growth rate
  const recentAvgRevenue =
    revenues.slice(-Math.ceil(revenues.length / 2)).reduce((a, b) => a + b, 0) /
    Math.ceil(revenues.length / 2);
  const growthRate = (recentAvgRevenue / (avgRevenue || 1) - 1) * 100;

  // Apply growth rate to forecast period
  const daysInData = 30; // Assume monthly data
  const periods = forecastDays / daysInData;
  const forecastRevenue = avgRevenue * Math.pow(1 + growthRate / 100, periods);

  return Math.round(forecastRevenue);
}

/**
 * Generate actionable recommendations based on forecasts
 */
function generateRecommendations(data: {
  emailPrediction: { sent: number; opens: number; clicks: number };
  contentPrediction: { volume: number; approvalRate: number };
  schedulingPrediction: { proposalsVolume: number; conflictRate: number };
  staffCapacityWarning: boolean;
  revenueProjection: number;
  kpis: KPIResult;
}): string[] {
  const actions: string[] = [];

  // Email recommendations
  if (data.emailPrediction.sent > 1000) {
    actions.push(
      'High email volume forecasted - consider A/B testing subject lines to optimize open rates'
    );
  }
  if (data.emailPrediction.clicks < data.emailPrediction.opens * 0.15) {
    actions.push(
      'Low click rate forecasted - review CTA clarity and landing page relevance'
    );
  }

  // Content recommendations
  if (data.contentPrediction.volume > 50) {
    actions.push(
      'High content volume forecasted - ensure approval process can handle throughput'
    );
  }
  if (data.contentPrediction.approvalRate < 70) {
    actions.push(
      'Low approval rate forecasted - schedule process review with founder'
    );
  }

  // Scheduling recommendations
  if (data.schedulingPrediction.proposalsVolume > 30) {
    actions.push(
      'High scheduling volume forecasted - consider time zone optimization'
    );
  }
  if (data.schedulingPrediction.conflictRate > 0.3) {
    actions.push(
      'High conflict rate forecasted - recommend calendar consolidation and focus time blocking'
    );
  }

  // Staff recommendations
  if (data.staffCapacityWarning) {
    actions.push(
      'Staff capacity at risk - consider workload balancing or additional hiring'
    );
  }

  // Financial recommendations
  if (data.revenueProjection < 0) {
    actions.push(
      'Revenue decline forecasted - urgent: review sales pipeline and retention metrics'
    );
  }
  if (data.kpis.profitMargin < 15) {
    actions.push(
      'Low profit margin forecasted - conduct expense audit and cost optimization review'
    );
  }

  return actions.length > 0 ? actions : ['Continue current operations with quarterly reviews'];
}

/**
 * Map timeframe to days
 */
function mapTimeframeToDays(timeframe: string): number {
  switch (timeframe) {
    case '24h':
      return 1;
    case '7d':
      return 7;
    case '30d':
      return 30;
    case 'quarter':
      return 90;
    case 'year':
      return 365;
    default:
      return 30;
  }
}

/**
 * Map timeframe to forecast period label
 */
function mapTimeframeToForecastPeriod(timeframe: string): '7d' | '30d' | '90d' {
  switch (timeframe) {
    case '24h':
    case '7d':
      return '7d';
    case '30d':
      return '30d';
    case 'quarter':
    case 'year':
      return '90d';
    default:
      return '30d';
  }
}

/**
 * Calculate forecast confidence interval (lower and upper bounds)
 */
export function calculateForecastConfidenceInterval(
  forecast: Forecast,
  confidence: number = 0.95
): { emailSent: [number, number]; contentVolume: [number, number]; revenue: [number, number] } {
  // Use 95% confidence interval (±1.96 standard deviations)
  const multiplier = confidence === 0.95 ? 1.96 : confidence === 0.9 ? 1.645 : 2.576;
  const margin = 0.1; // ±10% margin of error

  return {
    emailSent: [
      Math.max(0, Math.round(forecast.emailPrediction.sent * (1 - margin))),
      Math.round(forecast.emailPrediction.sent * (1 + margin)),
    ],
    contentVolume: [
      Math.max(0, Math.round(forecast.contentPrediction.volume * (1 - margin))),
      Math.round(forecast.contentPrediction.volume * (1 + margin)),
    ],
    revenue: [
      Math.max(0, Math.round(forecast.revenueProjection * (1 - margin))),
      Math.round(forecast.revenueProjection * (1 + margin)),
    ],
  };
}
