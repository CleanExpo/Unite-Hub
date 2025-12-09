/**
 * KPI Extraction Engine
 *
 * Extracts and calculates key performance indicators from multi-source datasets.
 * Metrics include email engagement, content performance, scheduling efficiency,
 * staff utilization, and financial health.
 */

import type { AnalysisDatasets, KPIResult } from './analysisAgent';

/**
 * Extract and calculate KPIs from all data sources
 */
export function analyseKPIs(datasets: AnalysisDatasets): KPIResult {
  return {
    // Email metrics
    emailEngagement: calculateEmailEngagement(datasets.email),
    emailOpenRate: calculateEmailOpenRate(datasets.email),
    emailClickRate: calculateEmailClickRate(datasets.email),
    emailBouncRate: calculateEmailBounceRate(datasets.email),

    // Research metrics
    researchInsights: datasets.research?.length || 0,
    highThreatInsights: (datasets.research || []).filter((r) => r.threat_level === 'high').length,

    // Content metrics
    contentGenerated: datasets.content?.length || 0,
    autoApprovedContent: calculateAutoApprovedContentPercentage(datasets.content),

    // Scheduling metrics
    schedulingEfficiency: calculateSchedulingEfficiency(datasets.scheduling),
    schedulingConflicts: calculateTotalConflicts(datasets.scheduling),

    // Staff metrics
    staffUtilization: calculateStaffUtilization(datasets.staff),
    staffOverload: calculateStaffOverload(datasets.staff),

    // Financial metrics
    financialHealth: evaluateFinancialHealth(datasets.financials),
    profitMargin: calculateProfitMargin(datasets.financials),
  };
}

/**
 * Email engagement score (0-100) based on opens and clicks
 */
function calculateEmailEngagement(emails?: Array<any>): number {
  if (!emails || emails.length === 0) {
return 0;
}

  const totalEmails = emails.reduce((sum, e) => sum + (e.sent || 0), 0);
  if (totalEmails === 0) {
return 0;
}

  const totalOpens = emails.reduce((sum, e) => sum + (e.opens || 0), 0);
  const totalClicks = emails.reduce((sum, e) => sum + (e.clicks || 0), 0);

  // Engagement = (opens + clicks*2) / (total_sent * 2) * 100
  // Clicks weighted 2x because higher intent
  const engagement = ((totalOpens + totalClicks * 2) / (totalEmails * 2)) * 100;
  return Math.min(Math.round(engagement), 100);
}

/**
 * Email open rate (%)
 */
function calculateEmailOpenRate(emails?: Array<any>): number {
  if (!emails || emails.length === 0) {
return 0;
}

  const totalSent = emails.reduce((sum, e) => sum + (e.sent || 0), 0);
  const totalOpens = emails.reduce((sum, e) => sum + (e.opens || 0), 0);

  if (totalSent === 0) {
return 0;
}
  return (totalOpens / totalSent) * 100;
}

/**
 * Email click rate (%)
 */
function calculateEmailClickRate(emails?: Array<any>): number {
  if (!emails || emails.length === 0) {
return 0;
}

  const totalSent = emails.reduce((sum, e) => sum + (e.sent || 0), 0);
  const totalClicks = emails.reduce((sum, e) => sum + (e.clicks || 0), 0);

  if (totalSent === 0) {
return 0;
}
  return (totalClicks / totalSent) * 100;
}

/**
 * Email bounce rate (%)
 */
function calculateEmailBounceRate(emails?: Array<any>): number {
  if (!emails || emails.length === 0) {
return 0;
}

  const totalSent = emails.reduce((sum, e) => sum + (e.sent || 0), 0);
  const totalBounces = emails.reduce((sum, e) => sum + (e.bounces || 0), 0);

  if (totalSent === 0) {
return 0;
}
  return (totalBounces / totalSent) * 100;
}

/**
 * Content auto-approval rate (%)
 */
function calculateAutoApprovedContentPercentage(content?: Array<any>): number {
  if (!content || content.length === 0) {
return 0;
}

  const autoApproved = content.filter((c) => c.ready_to_use === true).length;
  return (autoApproved / content.length) * 100;
}

/**
 * Scheduling efficiency (0-100) based on available slots vs conflicts
 */
function calculateSchedulingEfficiency(scheduling?: Array<any>): number {
  if (!scheduling || scheduling.length === 0) {
return 50;
} // Neutral if no data

  const totalSlots = scheduling.reduce((sum, s) => sum + (s.slots_available || 0), 0);
  const totalConflicts = scheduling.reduce((sum, s) => sum + (s.conflicts?.length || 0), 0);

  // Higher slots = more efficient
  // More conflicts = less efficient
  const slotScore = Math.min(totalSlots * 5, 100); // Scale: 20 slots = 100%
  const conflictPenalty = Math.min(totalConflicts * 10, 50); // Scale: 5 conflicts = -50%

  return Math.max(slotScore - conflictPenalty, 0);
}

/**
 * Total scheduling conflicts detected
 */
function calculateTotalConflicts(scheduling?: Array<any>): number {
  if (!scheduling || scheduling.length === 0) {
return 0;
}
  return scheduling.reduce((sum, s) => sum + (s.conflicts?.length || 0), 0);
}

/**
 * Average staff utilization (0-100)
 */
function calculateStaffUtilization(staff?: Array<any>): number {
  if (!staff || staff.length === 0) {
return 0;
}

  const avgUtilization = staff.reduce((sum, s) => sum + (s.utilization || 0), 0) / staff.length;
  return Math.round(avgUtilization);
}

/**
 * Count staff members at overload (>80% utilization)
 */
function calculateStaffOverload(staff?: Array<any>): number {
  if (!staff || staff.length === 0) {
return 0;
}
  return staff.filter((s) => (s.utilization || 0) > 80).length;
}

/**
 * Evaluate financial health based on revenue vs expenses ratio
 */
function evaluateFinancialHealth(
  financials?: Array<any>
): 'strong' | 'stable' | 'at_risk' | 'critical' {
  if (!financials || financials.length === 0) {
return 'stable';
}

  // Calculate average profit margin from financials
  const margins = financials.map((f) => {
    const revenue = f.revenue || 0;
    const expenses = f.expenses || 0;
    if (revenue === 0) {
return 0;
}
    return ((revenue - expenses) / revenue) * 100;
  });

  const avgMargin = margins.reduce((sum, m) => sum + m, 0) / margins.length;

  if (avgMargin >= 40) {
return 'strong';
}
  if (avgMargin >= 20) {
return 'stable';
}
  if (avgMargin >= 0) {
return 'at_risk';
}
  return 'critical';
}

/**
 * Calculate profit margin (%)
 */
function calculateProfitMargin(financials?: Array<any>): number {
  if (!financials || financials.length === 0) {
return 0;
}

  const totalRevenue = financials.reduce((sum, f) => sum + (f.revenue || 0), 0);
  const totalExpenses = financials.reduce((sum, f) => sum + (f.expenses || 0), 0);

  if (totalRevenue === 0) {
return 0;
}
  return ((totalRevenue - totalExpenses) / totalRevenue) * 100;
}

/**
 * Calculate growth rate between two KPI snapshots
 */
export function calculateGrowthRate(previous: KPIResult, current: KPIResult): Record<string, number> {
  return {
    emailEngagement: ((current.emailEngagement - previous.emailEngagement) / previous.emailEngagement) * 100 || 0,
    contentGenerated: ((current.contentGenerated - previous.contentGenerated) / previous.contentGenerated) * 100 || 0,
    schedulingEfficiency:
      ((current.schedulingEfficiency - previous.schedulingEfficiency) / previous.schedulingEfficiency) * 100 || 0,
    staffUtilization:
      ((current.staffUtilization - previous.staffUtilization) / (previous.staffUtilization || 1)) * 100 || 0,
    profitMargin: current.profitMargin - previous.profitMargin, // Absolute change
  };
}
