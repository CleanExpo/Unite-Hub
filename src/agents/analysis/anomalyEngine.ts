/**
 * Anomaly Detection Engine
 *
 * Identifies statistical anomalies, outliers, and pattern breaks across datasets.
 * Uses z-score analysis, threshold violations, and pattern detection.
 */

import type { AnalysisDatasets, Anomaly, KPIResult } from './analysisAgent';

/**
 * Detect anomalies across all data sources
 */
export function detectAnomalies(datasets: AnalysisDatasets, kpis: KPIResult): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Check email anomalies
  anomalies.push(...detectEmailAnomalies(datasets.email));

  // Check research anomalies
  anomalies.push(...detectResearchAnomalies(datasets.research));

  // Check content anomalies
  anomalies.push(...detectContentAnomalies(kpis, datasets.content));

  // Check scheduling anomalies
  anomalies.push(...detectSchedulingAnomalies(kpis, datasets.scheduling));

  // Check staff anomalies
  anomalies.push(...detectStaffAnomalies(kpis, datasets.staff));

  // Check financial anomalies
  anomalies.push(...detectFinancialAnomalies(datasets.financials));

  return anomalies.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return severityOrder[a.severity] - severityOrder[b.severity];
  });
}

/**
 * Detect email engagement anomalies
 */
function detectEmailAnomalies(emails?: Array<any>): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (!emails || emails.length === 0) {
return anomalies;
}

  // Calculate average metrics
  const openRates = emails.map((e) => (e.opens || 0) / (e.sent || 1));
  const avgOpenRate = openRates.reduce((a, b) => a + b, 0) / openRates.length;
  const stdDevOpenRate = Math.sqrt(
    openRates.reduce((sum, rate) => sum + Math.pow(rate - avgOpenRate, 2), 0) / openRates.length
  );

  // Detect open rate spikes (z-score > 2)
  for (let i = 0; i < emails.length; i++) {
    const openRate = openRates[i];
    const zScore = Math.abs((openRate - avgOpenRate) / (stdDevOpenRate || 0.01));

    if (zScore > 2) {
      const severity = zScore > 3 ? 'critical' : 'high';
      const isSpike = openRate > avgOpenRate;

      anomalies.push({
        type: isSpike ? 'spike' : 'drop',
        source: 'email',
        description: `Email ${i + 1}: ${isSpike ? 'unusual high' : 'unusual low'} open rate detected`,
        severity,
        value: openRate,
        threshold: avgOpenRate,
        impact: isSpike
          ? 'Excellent engagement - investigate what worked well'
          : 'Low engagement - check deliverability and content',
      });
    }
  }

  // Detect bounce rate threshold violations
  const bounceRates = emails.map((e) => (e.bounces || 0) / (e.sent || 1));
  const avgBounceRate = bounceRates.reduce((a, b) => a + b, 0) / bounceRates.length;

  for (let i = 0; i < emails.length; i++) {
    if (bounceRates[i] > avgBounceRate * 1.5) {
      anomalies.push({
        type: 'threshold_violation',
        source: 'email',
        description: `Email ${i + 1}: Bounce rate ${(bounceRates[i] * 100).toFixed(1)}% exceeds threshold`,
        severity: 'high',
        value: bounceRates[i],
        threshold: avgBounceRate * 1.5,
        impact: 'Check list quality and sender reputation',
      });
    }
  }

  return anomalies;
}

/**
 * Detect research insight anomalies
 */
function detectResearchAnomalies(research?: Array<any>): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (!research || research.length === 0) {
return anomalies;
}

  // Count high-threat insights
  const highThreatInsights = research.filter((r) => r.threat_level === 'high');

  if (highThreatInsights.length > research.length * 0.3) {
    anomalies.push({
      type: 'pattern_break',
      source: 'research',
      description: `High concentration of high-threat insights (${highThreatInsights.length}/${research.length})`,
      severity: 'high',
      value: highThreatInsights.length,
      threshold: research.length * 0.3,
      impact: 'Market conditions may be deteriorating - escalate findings',
    });
  }

  // Detect duplicate or similar insights
  const insights = research.map((r) => r.insight?.toLowerCase() || '');
  const uniqueInsights = new Set(insights);

  if (uniqueInsights.size < insights.length * 0.7) {
    anomalies.push({
      type: 'outlier',
      source: 'research',
      description: `Low diversity in research insights - ${uniqueInsights.size}/${insights.length} unique`,
      severity: 'medium',
      value: uniqueInsights.size,
      threshold: insights.length * 0.7,
      impact: 'Expand research sources to improve insight diversity',
    });
  }

  return anomalies;
}

/**
 * Detect content generation anomalies
 */
function detectContentAnomalies(kpis: KPIResult, content?: Array<any>): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (!content || content.length === 0) {
return anomalies;
}

  // Detect high-risk content clustering
  const highRiskContent = content.filter((c) => c.risk_level === 'high' || c.risk_level === 'critical');

  if (highRiskContent.length > content.length * 0.2) {
    anomalies.push({
      type: 'spike',
      source: 'content',
      description: `High concentration of risky content (${highRiskContent.length}/${content.length})`,
      severity: 'high',
      value: highRiskContent.length,
      threshold: content.length * 0.2,
      impact: 'Founder review required - escalate for decision',
    });
  }

  // Detect approval rate drop
  if (kpis.autoApprovedContent < 60) {
    anomalies.push({
      type: 'drop',
      source: 'content',
      description: `Auto-approval rate critically low at ${kpis.autoApprovedContent.toFixed(1)}%`,
      severity: 'high',
      value: kpis.autoApprovedContent,
      threshold: 70,
      impact: 'Review governance policies - content may be over-filtered',
    });
  }

  return anomalies;
}

/**
 * Detect scheduling anomalies
 */
function detectSchedulingAnomalies(kpis: KPIResult, scheduling?: Array<any>): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (!scheduling || scheduling.length === 0) {
return anomalies;
}

  // Detect conflict spike
  if (kpis.schedulingConflicts > 5) {
    anomalies.push({
      type: 'spike',
      source: 'scheduling',
      description: `High volume of scheduling conflicts detected (${kpis.schedulingConflicts} total)`,
      severity: kpis.schedulingConflicts > 10 ? 'critical' : 'high',
      value: kpis.schedulingConflicts,
      threshold: 5,
      impact: 'Calendar management needs review - consider meeting consolidation',
    });
  }

  // Detect low availability
  const totalSlots = scheduling.reduce((sum, s) => sum + (s.slots_available || 0), 0);
  const avgSlots = totalSlots / scheduling.length;

  if (avgSlots < 2) {
    anomalies.push({
      type: 'drop',
      source: 'scheduling',
      description: `Low meeting slot availability (${avgSlots.toFixed(1)} slots/request average)`,
      severity: 'medium',
      value: avgSlots,
      threshold: 3,
      impact: 'Calendar is saturated - recommend blocking focus time',
    });
  }

  return anomalies;
}

/**
 * Detect staff utilization anomalies
 */
function detectStaffAnomalies(kpis: KPIResult, staff?: Array<any>): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (!staff || staff.length === 0) {
return anomalies;
}

  // Detect overload conditions
  if (kpis.staffOverload > 0) {
    const overloadedStaff = staff.filter((s) => (s.utilization || 0) > 80);

    anomalies.push({
      type: 'threshold_violation',
      source: 'staff',
      description: `${kpis.staffOverload} team member(s) at >80% utilization (overload)`,
      severity: kpis.staffOverload > 2 ? 'critical' : 'high',
      value: kpis.staffOverload,
      threshold: 1,
      impact: `Consider load balancing or hiring: ${overloadedStaff.map((s) => s.name).join(', ')}`,
    });
  }

  // Detect underutilization (if average > 30% but someone < 20%)
  const avgUtilization = kpis.staffUtilization;
  const underutilized = staff.filter((s) => (s.utilization || 0) < 20);

  if (underutilized.length > 0 && avgUtilization > 50) {
    anomalies.push({
      type: 'outlier',
      source: 'staff',
      description: `${underutilized.length} team member(s) significantly underutilized (<20%)`,
      severity: 'medium',
      value: underutilized.length,
      threshold: 0,
      impact: `Review task allocation: ${underutilized.map((s) => s.name).join(', ')}`,
    });
  }

  return anomalies;
}

/**
 * Detect financial anomalies
 */
function detectFinancialAnomalies(financials?: Array<any>): Anomaly[] {
  const anomalies: Anomaly[] = [];
  if (!financials || financials.length < 2) {
return anomalies;
}

  // Calculate revenue trend
  const revenues = financials.map((f) => f.revenue || 0);
  const revenueChanges = [];

  for (let i = 1; i < revenues.length; i++) {
    const change = ((revenues[i] - revenues[i - 1]) / revenues[i - 1]) * 100;
    revenueChanges.push(change);
  }

  const avgRevenuChange = revenueChanges.reduce((a, b) => a + b, 0) / revenueChanges.length;
  const stdDev = Math.sqrt(
    revenueChanges.reduce((sum, change) => sum + Math.pow(change - avgRevenuChange, 2), 0) /
      revenueChanges.length
  );

  // Detect revenue drops
  for (let i = 0; i < revenueChanges.length; i++) {
    if (revenueChanges[i] < avgRevenuChange - 2 * stdDev) {
      anomalies.push({
        type: 'drop',
        source: 'financials',
        description: `Significant revenue decline in period ${i + 2} (${revenueChanges[i].toFixed(1)}%)`,
        severity: revenueChanges[i] < -20 ? 'critical' : 'high',
        value: revenueChanges[i],
        threshold: avgRevenuChange - 2 * stdDev,
        impact: 'Investigate revenue drivers - sales pipeline health check needed',
      });
    }
  }

  // Detect expense spikes
  const expenses = financials.map((f) => f.expenses || 0);
  const expenseChanges = [];

  for (let i = 1; i < expenses.length; i++) {
    const change = ((expenses[i] - expenses[i - 1]) / expenses[i - 1]) * 100;
    expenseChanges.push(change);
  }

  const avgExpenseChange = expenseChanges.reduce((a, b) => a + b, 0) / expenseChanges.length;

  for (let i = 0; i < expenseChanges.length; i++) {
    if (expenseChanges[i] > avgExpenseChange + 20) {
      anomalies.push({
        type: 'spike',
        source: 'financials',
        description: `Unusual expense increase in period ${i + 2} (${expenseChanges[i].toFixed(1)}%)`,
        severity: expenseChanges[i] > 40 ? 'high' : 'medium',
        value: expenseChanges[i],
        threshold: avgExpenseChange + 20,
        impact: 'Review expense categories - budget control action recommended',
      });
    }
  }

  return anomalies;
}

/**
 * Calculate anomaly severity based on z-score
 */
export function calculateAnomalySeverity(zScore: number): 'low' | 'medium' | 'high' | 'critical' {
  if (zScore > 3) {
return 'critical';
}
  if (zScore > 2) {
return 'high';
}
  if (zScore > 1.5) {
return 'medium';
}
  return 'low';
}
