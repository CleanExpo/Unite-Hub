/**
 * Insight Engine
 *
 * Derives actionable business insights from KPI analysis, anomalies, and forecasts.
 * Generates intelligence across operational, strategic, and tactical dimensions.
 */

import type { Anomaly, Forecast, Insight, KPIResult } from './analysisAgent';
import type { BrandId } from '@/lib/brands/brandRegistry';

/**
 * Derive business insights from analysis data
 */
export function deriveInsights(data: {
  kpis: KPIResult;
  anomalies: Anomaly[];
  forecast: Forecast;
  brand: BrandId;
}): Insight[] {
  const { kpis, anomalies, forecast, brand } = data;
  const insights: Insight[] = [];

  // Email insights
  insights.push(...deriveEmailInsights(kpis));

  // Content insights
  insights.push(...deriveContentInsights(kpis));

  // Scheduling insights
  insights.push(...deriveSchedulingInsights(kpis));

  // Staff insights
  insights.push(...deriveStaffInsights(kpis));

  // Financial insights
  insights.push(...deriveFinancialInsights(kpis));

  // Anomaly-based insights
  insights.push(...deriveAnomalyInsights(anomalies));

  // Forecast-based insights
  insights.push(...deriveForecastInsights(forecast));

  // Cross-domain insights
  insights.push(...deriveCrossDomainInsights(kpis, anomalies, forecast));

  // Sort by priority
  return insights.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

/**
 * Derive email channel insights
 */
function deriveEmailInsights(kpis: KPIResult): Insight[] {
  const insights: Insight[] = [];

  // Engagement analysis
  if (kpis.emailEngagement > 70) {
    insights.push({
      title: 'Strong Email Engagement',
      description: 'Email channel is performing well with high engagement rates',
      evidence: [
        `Email engagement score: ${kpis.emailEngagement}/100`,
        `Open rate: ${kpis.emailOpenRate.toFixed(1)}%`,
        `Click rate: ${kpis.emailClickRate.toFixed(1)}%`,
      ],
      priority: 'low',
      category: 'opportunity',
      actionItems: [
        'Maintain current cadence and content strategy',
        'Analyze top performers for scalability',
        'Consider A/B testing more aggressive content variations',
      ],
    });
  } else if (kpis.emailEngagement < 30) {
    insights.push({
      title: 'Low Email Engagement',
      description: 'Email performance is below optimal levels',
      evidence: [
        `Email engagement score: ${kpis.emailEngagement}/100`,
        `Open rate: ${kpis.emailOpenRate.toFixed(1)}% (target: 25%+)`,
        `Click rate: ${kpis.emailClickRate.toFixed(1)}% (target: 5%+)`,
      ],
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Review subject line effectiveness',
        'Analyze audience segmentation',
        'Test improved call-to-action copy',
        'Evaluate send timing and frequency',
      ],
    });
  }

  // Bounce rate analysis
  if (kpis.emailBouncRate > 3) {
    insights.push({
      title: 'Elevated Bounce Rate',
      description: 'Email deliverability issues detected',
      evidence: [`Bounce rate: ${kpis.emailBouncRate.toFixed(2)}% (healthy: <1%)`],
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Audit email list quality',
        'Check sender reputation with ISPs',
        'Review authentication (SPF, DKIM, DMARC)',
        'Remove bounced addresses from future campaigns',
      ],
    });
  }

  return insights;
}

/**
 * Derive content channel insights
 */
function deriveContentInsights(kpis: KPIResult): Insight[] {
  const insights: Insight[] = [];

  const totalContent = kpis.contentGenerated;

  if (totalContent === 0) {
    insights.push({
      title: 'No Content Generated',
      description: 'Content generation pipeline appears inactive',
      evidence: ['Content generated in period: 0'],
      priority: 'medium',
      category: 'risk',
      actionItems: [
        'Verify content agent is operational',
        'Check for system errors or blocks',
        'Review content request backlog',
      ],
    });
  } else if (kpis.autoApprovedContent > 80) {
    insights.push({
      title: 'Strong Content Approval Rate',
      description: 'Generated content consistently meets quality standards',
      evidence: [
        `Auto-approved content: ${kpis.autoApprovedContent.toFixed(1)}%`,
        `Total content pieces: ${totalContent}`,
      ],
      priority: 'low',
      category: 'opportunity',
      actionItems: [
        'Document successful patterns for team training',
        'Consider increasing content generation targets',
        'Evaluate automation opportunities for approved workflows',
      ],
    });
  } else if (kpis.autoApprovedContent < 50) {
    insights.push({
      title: 'High Content Rejection Rate',
      description: 'Many generated pieces require founder review or rejection',
      evidence: [
        `Auto-approved content: ${kpis.autoApprovedContent.toFixed(1)}%`,
        `Rejected/pending review: ${(100 - kpis.autoApprovedContent).toFixed(1)}%`,
      ],
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Review approval criteria - may be too strict',
        'Provide feedback to content agent on rejection patterns',
        'Consider governance policy adjustment',
        'Investigate specific rejection reasons',
      ],
    });
  }

  return insights;
}

/**
 * Derive scheduling insights
 */
function deriveSchedulingInsights(kpis: KPIResult): Insight[] {
  const insights: Insight[] = [];

  if (kpis.schedulingConflicts > 5) {
    insights.push({
      title: 'Calendar Conflict Pattern',
      description: 'Multiple scheduling conflicts indicate calendar congestion',
      evidence: [
        `Total conflicts detected: ${kpis.schedulingConflicts}`,
        `Scheduling efficiency: ${kpis.schedulingEfficiency.toFixed(1)}/100`,
      ],
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Implement "focus time" blocks (2-3 hours daily)',
        'Consolidate meetings to specific days',
        'Delegate calendar management responsibilities',
        'Review meeting necessity - cancel redundant sessions',
      ],
    });
  } else if (kpis.schedulingEfficiency < 50) {
    insights.push({
      title: 'Low Scheduling Availability',
      description: 'Limited availability for new meetings',
      evidence: [`Scheduling efficiency: ${kpis.schedulingEfficiency.toFixed(1)}/100`],
      priority: 'medium',
      category: 'trend',
      actionItems: [
        'Protect availability for high-value meetings',
        'Use scheduling agent to find optimal times',
        'Consider extending meeting request look-ahead period',
      ],
    });
  }

  return insights;
}

/**
 * Derive staff insights
 */
function deriveStaffInsights(kpis: KPIResult): Insight[] {
  const insights: Insight[] = [];

  if (kpis.staffOverload > 0) {
    insights.push({
      title: 'Team Member Overload Risk',
      description: `${kpis.staffOverload} team member(s) at critical utilization levels`,
      evidence: [
        `Staff at >80% utilization: ${kpis.staffOverload}`,
        `Average team utilization: ${kpis.staffUtilization}%`,
      ],
      priority: 'critical',
      category: 'risk',
      actionItems: [
        'Immediate: Redistribute high-priority tasks',
        'Schedule workload rebalancing meeting',
        'Evaluate hiring or contractor support',
        'Implement time-off rotation to prevent burnout',
      ],
    });
  } else if (kpis.staffUtilization > 80) {
    insights.push({
      title: 'High Team Utilization',
      description: 'Team is operating near capacity',
      evidence: [`Average team utilization: ${kpis.staffUtilization}%`],
      priority: 'high',
      category: 'trend',
      actionItems: [
        'Plan for capacity headroom',
        'Identify automation opportunities',
        'Prepare hiring requisition for discussion',
      ],
    });
  } else if (kpis.staffUtilization < 50) {
    insights.push({
      title: 'Low Team Utilization',
      description: 'Team has significant capacity headroom',
      evidence: [`Average team utilization: ${kpis.staffUtilization}%`],
      priority: 'medium',
      category: 'opportunity',
      actionItems: [
        'Identify underutilized capabilities',
        'Redirect capacity to high-impact projects',
        'Increase process improvement initiatives',
      ],
    });
  }

  return insights;
}

/**
 * Derive financial insights
 */
function deriveFinancialInsights(kpis: KPIResult): Insight[] {
  const insights: Insight[] = [];

  const healthOrder = { critical: 0, at_risk: 1, stable: 2, strong: 3 };
  const currentHealth = healthOrder[kpis.financialHealth];

  if (kpis.financialHealth === 'critical') {
    insights.push({
      title: 'Critical Financial Status',
      description: 'Significant losses or near-zero profitability',
      evidence: [
        `Profit margin: ${kpis.profitMargin.toFixed(1)}%`,
        `Financial health: ${kpis.financialHealth}`,
      ],
      priority: 'critical',
      category: 'risk',
      actionItems: [
        'URGENT: Schedule financial review with leadership',
        'Conduct expense audit across all categories',
        'Develop 90-day recovery plan',
        'Consider revenue acceleration initiatives',
      ],
    });
  } else if (kpis.financialHealth === 'at_risk') {
    insights.push({
      title: 'Declining Financial Health',
      description: 'Profitability below target levels',
      evidence: [
        `Profit margin: ${kpis.profitMargin.toFixed(1)}% (target: 20%+)`,
        `Financial health: ${kpis.financialHealth}`,
      ],
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Review major cost categories for reduction opportunities',
        'Accelerate revenue growth initiatives',
        'Reduce discretionary spending',
        'Evaluate pricing strategy adjustments',
      ],
    });
  } else if (kpis.financialHealth === 'strong') {
    insights.push({
      title: 'Strong Financial Position',
      description: 'Healthy profit margins and growing revenue',
      evidence: [
        `Profit margin: ${kpis.profitMargin.toFixed(1)}%`,
        `Financial health: ${kpis.financialHealth}`,
      ],
      priority: 'low',
      category: 'opportunity',
      actionItems: [
        'Consider strategic investments in growth',
        'Increase marketing budget to capitalize on efficiency',
        'Plan for team expansion and capability building',
      ],
    });
  }

  return insights;
}

/**
 * Derive insights from detected anomalies
 */
function deriveAnomalyInsights(anomalies: Anomaly[]): Insight[] {
  const insights: Insight[] = [];

  const criticalAnomalies = anomalies.filter((a) => a.severity === 'critical');
  const highAnomalies = anomalies.filter((a) => a.severity === 'high');

  if (criticalAnomalies.length > 0) {
    insights.push({
      title: `${criticalAnomalies.length} Critical Anomalies Detected`,
      description: 'System anomalies require immediate investigation',
      evidence: criticalAnomalies.map((a) => a.description),
      priority: 'critical',
      category: 'risk',
      actionItems: [
        'Investigate each anomaly immediately',
        'Implement corrective actions',
        'Monitor metrics closely',
        'Document root causes for future prevention',
      ],
    });
  } else if (highAnomalies.length > 2) {
    insights.push({
      title: 'Multiple High-Severity Anomalies',
      description: 'Several metrics showing unusual patterns',
      evidence: highAnomalies.slice(0, 3).map((a) => a.description),
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Prioritize top anomalies for investigation',
        'Identify if anomalies are correlated',
        'Plan remediation for patterns',
      ],
    });
  }

  return insights;
}

/**
 * Derive insights from forecasts
 */
function deriveForecastInsights(forecast: Forecast): Insight[] {
  const insights: Insight[] = [];

  // Email volume forecast
  if (forecast.emailPrediction.sent > 5000) {
    insights.push({
      title: 'High Email Volume Forecast',
      description: 'Large email volume predicted for next period',
      evidence: [
        `Forecasted sends: ${forecast.emailPrediction.sent.toLocaleString()}`,
        `Forecasted opens: ${forecast.emailPrediction.opens.toLocaleString()}`,
      ],
      priority: 'medium',
      category: 'trend',
      actionItems: [
        'Ensure email infrastructure can handle volume',
        'Review list quality before bulk send',
        'Prepare monitoring for deliverability',
      ],
    });
  }

  // Content volume forecast
  if (forecast.contentPrediction.volume > 100) {
    insights.push({
      title: 'High Content Generation Forecast',
      description: 'Large content volume expected',
      evidence: [`Forecasted content pieces: ${forecast.contentPrediction.volume}`],
      priority: 'medium',
      category: 'trend',
      actionItems: [
        'Prepare approval process for throughput',
        'Ensure distribution channels ready',
        'Plan content calendar updates',
      ],
    });
  }

  // Staff capacity warning
  if (forecast.staffCapacityWarning) {
    insights.push({
      title: 'Staff Capacity Constraint Ahead',
      description: 'Team capacity may be insufficient for forecasted workload',
      evidence: ['Staff utilization forecast exceeds 85%'],
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Plan immediate capacity mitigation',
        'Consider temporary contractor support',
        'Identify automation opportunities',
        'Initiate hiring process if needed',
      ],
    });
  }

  return insights;
}

/**
 * Derive cross-domain insights (connections between channels)
 */
function deriveCrossDomainInsights(
  kpis: KPIResult,
  anomalies: Anomaly[],
  forecast: Forecast
): Insight[] {
  const insights: Insight[] = [];

  // Email volume vs staff capacity
  if (forecast.emailPrediction.sent > 1000 && kpis.staffUtilization > 75) {
    insights.push({
      title: 'Email Volume vs Staff Capacity Mismatch',
      description: 'High email volume forecast with limited staff capacity',
      evidence: [
        `Forecasted email sends: ${forecast.emailPrediction.sent}`,
        `Current staff utilization: ${kpis.staffUtilization}%`,
      ],
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Consider email volume reduction or automation',
        'Hire temporary email specialists',
        'Implement email filtering/prioritization',
      ],
    });
  }

  // Content generation vs approval efficiency
  if (forecast.contentPrediction.volume > 50 && kpis.autoApprovedContent < 60) {
    insights.push({
      title: 'Content Supply > Approval Capacity',
      description: 'Content generation rate exceeds approval throughput',
      evidence: [
        `Forecasted content: ${forecast.contentPrediction.volume}`,
        `Approval rate: ${kpis.autoApprovedContent.toFixed(1)}%`,
      ],
      priority: 'high',
      category: 'risk',
      actionItems: [
        'Streamline approval process',
        'Increase automation in content generation',
        'Adjust content targets to match capacity',
      ],
    });
  }

  return insights;
}
