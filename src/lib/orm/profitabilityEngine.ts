/**
 * Profitability Engine
 * Phase 67: Weekly profitability calculation with loss-leading alerts
 */

import { ClientCostRecord } from './costModelEngine';

export type ProfitabilityStatus = 'profitable' | 'marginal' | 'loss_leading';

export interface ClientProfitability {
  client_id: string;
  client_name: string;
  workspace_id: string;
  period: string;
  revenue: number;
  cost: number;
  margin: number;
  margin_percent: number;
  status: ProfitabilityStatus;
  trend: 'improving' | 'stable' | 'declining';
  weeks_unprofitable: number;
  alert_level: 'none' | 'warning' | 'critical';
  recommendations: string[];
  confidence: number;
}

export interface ProfitabilitySummary {
  workspace_id: string;
  period: string;
  total_revenue: number;
  total_cost: number;
  total_margin: number;
  avg_margin_percent: number;
  clients: {
    total: number;
    profitable: number;
    marginal: number;
    loss_leading: number;
  };
  alerts: ProfitabilityAlert[];
  health_score: number;
}

export interface ProfitabilityAlert {
  client_id: string;
  client_name: string;
  level: 'warning' | 'critical';
  message: string;
  margin: number;
  recommendation: string;
}

// Thresholds for profitability status
const THRESHOLDS = {
  profitable_margin_percent: 20, // > 20% margin = profitable
  marginal_margin_percent: 0,    // 0-20% margin = marginal
  // < 0% margin = loss_leading

  warning_weeks_unprofitable: 2,
  critical_weeks_unprofitable: 4,
};

export class ProfitabilityEngine {
  /**
   * Calculate client profitability
   */
  calculateClientProfitability(
    costRecord: ClientCostRecord,
    clientName: string,
    historicalMargins: number[] = []
  ): ClientProfitability {
    const { client_id, workspace_id, period, revenue, costs, margin, margin_percent } = costRecord;

    // Determine status
    let status: ProfitabilityStatus;
    if (margin_percent >= THRESHOLDS.profitable_margin_percent) {
      status = 'profitable';
    } else if (margin_percent >= THRESHOLDS.marginal_margin_percent) {
      status = 'marginal';
    } else {
      status = 'loss_leading';
    }

    // Calculate trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (historicalMargins.length >= 2) {
      const recent = margin_percent;
      const previous = historicalMargins[historicalMargins.length - 1];
      if (recent > previous + 5) trend = 'improving';
      else if (recent < previous - 5) trend = 'declining';
    }

    // Count unprofitable weeks
    const weeksUnprofitable = historicalMargins.filter(m => m < 0).length + (margin_percent < 0 ? 1 : 0);

    // Determine alert level
    let alertLevel: 'none' | 'warning' | 'critical' = 'none';
    if (weeksUnprofitable >= THRESHOLDS.critical_weeks_unprofitable) {
      alertLevel = 'critical';
    } else if (weeksUnprofitable >= THRESHOLDS.warning_weeks_unprofitable || status === 'loss_leading') {
      alertLevel = 'warning';
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (status === 'loss_leading') {
      recommendations.push('Review pricing structure for this client');
      recommendations.push('Audit high-cost activities (AI usage, image generation)');
      if (weeksUnprofitable >= 3) {
        recommendations.push('Consider service scope reduction or fee increase');
      }
    } else if (status === 'marginal') {
      recommendations.push('Optimize workflow efficiency');
      recommendations.push('Review deliverable frequency');
    }

    if (trend === 'declining') {
      recommendations.push('Investigate cause of margin decline');
    }

    // Calculate confidence based on data completeness
    const confidence = Math.min(100, 60 + (historicalMargins.length * 5));

    return {
      client_id,
      client_name: clientName,
      workspace_id,
      period,
      revenue,
      cost: costs.total,
      margin,
      margin_percent,
      status,
      trend,
      weeks_unprofitable: weeksUnprofitable,
      alert_level: alertLevel,
      recommendations,
      confidence,
    };
  }

  /**
   * Generate profitability summary
   */
  generateSummary(
    workspaceId: string,
    period: string,
    profitabilities: ClientProfitability[]
  ): ProfitabilitySummary {
    const totalRevenue = profitabilities.reduce((sum, p) => sum + p.revenue, 0);
    const totalCost = profitabilities.reduce((sum, p) => sum + p.cost, 0);
    const totalMargin = totalRevenue - totalCost;
    const avgMarginPercent = profitabilities.length > 0
      ? profitabilities.reduce((sum, p) => sum + p.margin_percent, 0) / profitabilities.length
      : 0;

    const clients = {
      total: profitabilities.length,
      profitable: profitabilities.filter(p => p.status === 'profitable').length,
      marginal: profitabilities.filter(p => p.status === 'marginal').length,
      loss_leading: profitabilities.filter(p => p.status === 'loss_leading').length,
    };

    // Generate alerts
    const alerts: ProfitabilityAlert[] = profitabilities
      .filter(p => p.alert_level !== 'none')
      .map(p => ({
        client_id: p.client_id,
        client_name: p.client_name,
        level: p.alert_level as 'warning' | 'critical',
        message: p.status === 'loss_leading'
          ? `${p.client_name} is loss-leading with ${p.margin_percent.toFixed(1)}% margin`
          : `${p.client_name} has been unprofitable for ${p.weeks_unprofitable} weeks`,
        margin: p.margin,
        recommendation: p.recommendations[0] || 'Review client account',
      }));

    // Calculate health score (0-100)
    let healthScore = 100;
    healthScore -= clients.loss_leading * 15;
    healthScore -= clients.marginal * 5;
    healthScore -= alerts.filter(a => a.level === 'critical').length * 10;
    healthScore = Math.max(0, Math.min(100, healthScore));

    return {
      workspace_id: workspaceId,
      period,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      total_cost: Math.round(totalCost * 100) / 100,
      total_margin: Math.round(totalMargin * 100) / 100,
      avg_margin_percent: Math.round(avgMarginPercent * 10) / 10,
      clients,
      alerts,
      health_score: Math.round(healthScore),
    };
  }

  /**
   * Identify at-risk clients
   */
  identifyAtRiskClients(profitabilities: ClientProfitability[]): ClientProfitability[] {
    return profitabilities.filter(p =>
      p.status === 'loss_leading' ||
      p.weeks_unprofitable >= 2 ||
      (p.status === 'marginal' && p.trend === 'declining')
    ).sort((a, b) => a.margin - b.margin);
  }

  /**
   * Calculate profitability trend
   */
  calculateTrend(
    historicalSummaries: ProfitabilitySummary[]
  ): {
    margin_trend: 'improving' | 'stable' | 'declining';
    revenue_trend: 'growing' | 'stable' | 'shrinking';
    cost_trend: 'increasing' | 'stable' | 'decreasing';
    forecast_next_week: number;
  } {
    if (historicalSummaries.length < 2) {
      return {
        margin_trend: 'stable',
        revenue_trend: 'stable',
        cost_trend: 'stable',
        forecast_next_week: historicalSummaries[0]?.total_margin || 0,
      };
    }

    const sorted = historicalSummaries.sort((a, b) =>
      new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    const recent = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    // Margin trend
    let marginTrend: 'improving' | 'stable' | 'declining' = 'stable';
    const marginChange = recent.avg_margin_percent - previous.avg_margin_percent;
    if (marginChange > 3) marginTrend = 'improving';
    else if (marginChange < -3) marginTrend = 'declining';

    // Revenue trend
    let revenueTrend: 'growing' | 'stable' | 'shrinking' = 'stable';
    const revenueChange = ((recent.total_revenue - previous.total_revenue) / previous.total_revenue) * 100;
    if (revenueChange > 5) revenueTrend = 'growing';
    else if (revenueChange < -5) revenueTrend = 'shrinking';

    // Cost trend
    let costTrend: 'increasing' | 'stable' | 'decreasing' = 'stable';
    const costChange = ((recent.total_cost - previous.total_cost) / previous.total_cost) * 100;
    if (costChange > 5) costTrend = 'increasing';
    else if (costChange < -5) costTrend = 'decreasing';

    // Simple forecast
    const avgMarginGrowth = marginTrend === 'improving' ? 0.05 : marginTrend === 'declining' ? -0.05 : 0;
    const forecastNextWeek = recent.total_margin * (1 + avgMarginGrowth);

    return {
      margin_trend: marginTrend,
      revenue_trend: revenueTrend,
      cost_trend: costTrend,
      forecast_next_week: Math.round(forecastNextWeek * 100) / 100,
    };
  }

  /**
   * Get profitability thresholds
   */
  getThresholds() {
    return { ...THRESHOLDS };
  }
}

export default ProfitabilityEngine;
