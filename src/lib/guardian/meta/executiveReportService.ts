import { getSupabaseServer } from '@/lib/supabase';
import {
  GuardianReadinessSnapshot,
  GuardianCapabilitySnapshot,
} from '@/lib/guardian/readiness/readinessModel';
import { GuardianEditionFitResult } from '@/lib/guardian/meta/editionFitService';
import { GuardianEditionProfileDefinition } from '@/lib/guardian/meta/editionProfileService';
import { GuardianUpliftPlan, GuardianUpliftTask } from '@/lib/guardian/meta/upliftPlanModel';
import { HealthTimelinePoint } from '@/lib/guardian/meta/healthTimelineService';

/**
 * Executive report data structure with all sections
 */
export interface ExecutiveReport {
  id?: string;
  tenantId: string;
  createdAt: Date;
  periodStart: Date;
  periodEnd: Date;
  title: string;
  reportType: 'monthly' | 'quarterly' | 'custom' | 'snapshot';
  audience: 'executive' | 'ops' | 'board';

  // Summary metrics (high-level overview)
  summary: {
    readinessScore: number;
    readinessDelta: number;
    readinessStatus: string;
    upliftProgressPct: number;
    upliftTasksCompletedCount: number;
    upliftTasksTotalCount: number;
    editionAlignmentScore: number;
    editionAlignmentStatus: string;
    networkHealthStatus: string;
    riskLevel: 'low' | 'medium' | 'high';
  };

  // Report sections with metrics and highlights
  sections: Array<{
    sectionKey: string;
    sectionTitle: string;
    description: string;
    category: string; // 'readiness', 'editions', 'uplift', 'network', 'qa', 'governance'
    metrics: Record<string, any>;
    highlights: string[]; // Key findings
    recommendations: string[];
    trendDirection?: 'improving' | 'stable' | 'declining';
    priority?: number; // 1=critical, 2=high, 3=medium
  }>;

  // Optional edition focus
  editionKey?: string | null;
  editionLabel?: string | null;

  // Optional uplift plan link
  upliftPlanId?: string | null;
  upliftPlanTitle?: string | null;

  // Optional narrative prose
  narrative?: {
    introParagraph?: string;
    keyFindings?: string[];
    recommendationsProse?: string;
    conclusion?: string;
  };

  // Export metadata
  exportMetadata?: Record<string, any>;

  // General metadata
  metadata?: Record<string, any>;
}

/**
 * Assemble an executive report from component data
 * Pulls readiness, editions, uplift, timeline, and generates summary/sections
 */
export async function assembleExecutiveReportForTenant(
  tenantId: string,
  readinessSnapshot: GuardianReadinessSnapshot,
  previousReadinessSnapshot: GuardianReadinessSnapshot | null,
  editionFits: GuardianEditionFitResult[],
  previousEditionFits: GuardianEditionFitResult[] | null,
  upliftPlan: GuardianUpliftPlan | null,
  upliftTasks: GuardianUpliftTask[],
  recentTimeline: HealthTimelinePoint[],
  options?: {
    reportType?: 'monthly' | 'quarterly' | 'custom' | 'snapshot';
    audience?: 'executive' | 'ops' | 'board';
    editionKey?: string;
    title?: string;
  }
): Promise<ExecutiveReport> {
  const now = new Date();
  const reportType = options?.reportType || 'snapshot';
  const audience = options?.audience || 'executive';

  // Calculate date range for report
  let periodStart: Date;
  let periodEnd = new Date();

  switch (reportType) {
    case 'monthly':
      periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - 1);
      break;
    case 'quarterly':
      periodStart = new Date();
      periodStart.setMonth(periodStart.getMonth() - 3);
      break;
    case 'custom':
      periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 30);
      break;
    default: // snapshot
      periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - 1);
  }

  // Build summary metrics
  const completedTasks = upliftTasks.filter((t) => t.status === 'completed').length;
  const upliftProgressPct =
    upliftTasks.length > 0 ? Math.round((completedTasks / upliftTasks.length) * 100) : 0;

  const readinessDelta = previousReadinessSnapshot
    ? readinessSnapshot.overallScore - previousReadinessSnapshot.overallScore
    : 0;

  // Calculate edition alignment (average fit score across editions)
  const editionAlignmentScore =
    editionFits.length > 0
      ? Math.round(
          editionFits.reduce((sum, f) => sum + f.overallFitScore, 0) / editionFits.length
        )
      : 0;

  const summary: ExecutiveReport['summary'] = {
    readinessScore: readinessSnapshot.overallScore,
    readinessDelta,
    readinessStatus: readinessSnapshot.overallStatus,
    upliftProgressPct,
    upliftTasksCompletedCount: completedTasks,
    upliftTasksTotalCount: upliftTasks.length,
    editionAlignmentScore,
    editionAlignmentStatus: mapScoreToBucket(editionAlignmentScore),
    networkHealthStatus: determineNetworkHealthStatus(recentTimeline),
    riskLevel: determineRiskLevel(readinessSnapshot, editionFits),
  };

  // Build sections
  const sections: ExecutiveReport['sections'] = [];

  // Section 1: Readiness Overview
  sections.push(buildReadinessSection(readinessSnapshot, previousReadinessSnapshot, recentTimeline));

  // Section 2: Edition Alignment (if editions exist)
  if (editionFits.length > 0) {
    sections.push(buildEditionAlignmentSection(editionFits, previousEditionFits));
  }

  // Section 3: Uplift Progress (if plan exists)
  if (upliftPlan) {
    sections.push(buildUpliftProgressSection(upliftPlan, upliftTasks, recentTimeline));
  }

  // Section 4: Capability Gaps & Recommendations
  sections.push(buildGapsAndRecommendationsSection(readinessSnapshot, editionFits));

  // Section 5: Network Intelligence (if available in timeline)
  const networkEvents = recentTimeline.filter(
    (t) => t.category === 'network_intelligence' || t.category === 'ai_intelligence'
  );
  if (networkEvents.length > 0) {
    sections.push(buildNetworkIntelligenceSection(networkEvents));
  }

  const report: ExecutiveReport = {
    tenantId,
    createdAt: now,
    periodStart,
    periodEnd,
    title: options?.title || `Guardian Executive Report - ${now.toLocaleDateString()}`,
    reportType,
    audience,
    summary,
    sections,
    editionKey: options?.editionKey || null,
    upliftPlanId: upliftPlan?.id || null,
    upliftPlanTitle: upliftPlan?.title || null,
  };

  return report;
}

/**
 * Build readiness overview section
 */
function buildReadinessSection(
  snapshot: GuardianReadinessSnapshot,
  previous: GuardianReadinessSnapshot | null,
  timeline: HealthTimelinePoint[]
): ExecutiveReport['sections'][0] {
  const delta = previous ? snapshot.overallScore - previous.overallScore : 0;
  const trend = delta > 0 ? 'improving' : delta < 0 ? 'declining' : 'stable';

  const readyCount = snapshot.capabilities.filter((c) => c.status === 'ready').length;
  const matureCount = snapshot.capabilities.filter((c) => c.status === 'mature').length;
  const partialCount = snapshot.capabilities.filter((c) => c.status === 'partial').length;

  const highlights: string[] = [];
  if (delta > 10) highlights.push(`Readiness improved by ${delta} points`);
  if (matureCount > 0) highlights.push(`${matureCount} capabilities at mature level`);
  if (readyCount > 0) highlights.push(`${readyCount} capabilities ready`);
  if (trend === 'declining') highlights.push('⚠️ Readiness trend declining - review recent changes');

  const recommendations: string[] = [];
  if (partialCount > 5) {
    recommendations.push('Prioritize upgrading partial capabilities to ready/mature');
  }
  if (snapshot.overallScore < 40) {
    recommendations.push('Focus on foundational Guardian Core capabilities');
  }

  return {
    sectionKey: 'readiness_overview',
    sectionTitle: 'Readiness & Capability Status',
    description: 'Current Guardian capability deployment and maturity',
    category: 'readiness',
    metrics: {
      overall_score: snapshot.overallScore,
      score_delta: delta,
      status: snapshot.overallStatus,
      ready_count: readyCount,
      mature_count: matureCount,
      partial_count: partialCount,
      not_configured_count: snapshot.capabilities.filter((c) => c.status === 'not_configured')
        .length,
    },
    highlights,
    recommendations,
    trendDirection: trend,
    priority: delta < -10 ? 1 : delta > 10 ? 3 : 2,
  };
}

/**
 * Build edition alignment section
 */
function buildEditionAlignmentSection(
  currentFits: GuardianEditionFitResult[],
  previousFits: GuardianEditionFitResult[] | null
): ExecutiveReport['sections'][0] {
  const avgScore = Math.round(
    currentFits.reduce((sum, f) => sum + f.overallFitScore, 0) / currentFits.length
  );

  const alignedCount = currentFits.filter(
    (f) => f.status === 'aligned' || f.status === 'exceeds'
  ).length;
  const emergingCount = currentFits.filter((f) => f.status === 'emerging').length;
  const notStartedCount = currentFits.filter((f) => f.status === 'not_started').length;

  const highlights: string[] = [];
  highlights.push(`${alignedCount}/${currentFits.length} editions aligned or exceeding targets`);
  if (emergingCount > 0) highlights.push(`${emergingCount} edition(s) with emerging fit`);
  if (notStartedCount > 0) highlights.push(`${notStartedCount} edition(s) not yet started`);

  const recommendations: string[] = [];
  if (notStartedCount > 0) {
    recommendations.push(
      'Begin planning adoption for editions that are not yet started (Core recommended first)'
    );
  }
  if (emergingCount > 2) {
    recommendations.push('Consolidate efforts to move emerging editions to aligned status');
  }

  return {
    sectionKey: 'edition_alignment',
    sectionTitle: 'Guardian Edition Alignment',
    description: 'Progress toward defined Guardian edition targets',
    category: 'editions',
    metrics: {
      average_fit_score: avgScore,
      editions_total: currentFits.length,
      aligned_count: alignedCount,
      emerging_count: emergingCount,
      not_started_count: notStartedCount,
      edition_details: currentFits.map((f) => ({
        edition: f.editionKey,
        fit_score: f.overallFitScore,
        status: f.status,
        gaps_count: f.gaps.length,
      })),
    },
    highlights,
    recommendations,
    trendDirection: 'stable',
    priority: notStartedCount > 0 ? 2 : 3,
  };
}

/**
 * Build uplift progress section
 */
function buildUpliftProgressSection(
  plan: GuardianUpliftPlan,
  tasks: GuardianUpliftTask[],
  timeline: HealthTimelinePoint[]
): ExecutiveReport['sections'][0] {
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const blockCount = tasks.filter((t) => t.status === 'blocked').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  // Extract velocity from timeline
  const upliftEvents = timeline.filter((t) => t.source === 'uplift');
  const recentCompletions = upliftEvents.filter(
    (t) => t.metricKey === 'uplift_tasks_completed'
  ).length;

  const highlights: string[] = [];
  highlights.push(`${progressPct}% plan completion (${completedCount}/${tasks.length} tasks)`);
  if (inProgressCount > 0) highlights.push(`${inProgressCount} task(s) in progress`);
  if (blockCount > 0) highlights.push(`⚠️ ${blockCount} task(s) blocked - requires attention`);
  if (recentCompletions > 0) highlights.push(`${recentCompletions} recent completion(s) this period`);

  const recommendations: string[] = [];
  if (blockCount > 0) {
    recommendations.push('Address blocked tasks: identify blockers and unblock');
  }
  if (progressPct < 30) {
    recommendations.push('Accelerate task completion velocity');
  }
  if (progressPct >= 80) {
    recommendations.push('Plan next phase: consider next edition or advanced capabilities');
  }

  return {
    sectionKey: 'uplift_progress',
    sectionTitle: 'Adoption & Uplift Plan Progress',
    description: 'Current uplift plan execution and task completion',
    category: 'uplift',
    metrics: {
      plan_title: plan.title,
      plan_status: plan.status,
      progress_percentage: progressPct,
      completed_count: completedCount,
      in_progress_count: inProgressCount,
      blocked_count: blockCount,
      total_tasks: tasks.length,
      target_date: plan.targetDate?.toISOString() || null,
    },
    highlights,
    recommendations,
    trendDirection: progressPct > 50 ? 'improving' : 'stable',
    priority: blockCount > 0 ? 1 : progressPct < 20 ? 2 : 3,
  };
}

/**
 * Build gaps and recommendations section
 */
function buildGapsAndRecommendationsSection(
  readiness: GuardianReadinessSnapshot,
  editions: GuardianEditionFitResult[]
): ExecutiveReport['sections'][0] {
  // Collect all gaps from edition fits
  const allGaps = editions.flatMap((f) =>
    f.gaps.map((g) => ({
      capability: g.capabilityKey,
      gapType: g.gapType,
      edition: f.editionKey,
      score: g.currentScore,
    }))
  );

  // Group by capability
  const gapsByCapability = new Map<string, (typeof allGaps)[0][]>();
  allGaps.forEach((gap) => {
    const key = gap.capability;
    if (!gapsByCapability.has(key)) gapsByCapability.set(key, []);
    gapsByCapability.get(key)!.push(gap);
  });

  const topGaps = Array.from(gapsByCapability.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 5)
    .map(([cap, gaps]) => `${cap} (blocks ${gaps.length} edition(s))`);

  const highlights: string[] = [];
  if (allGaps.length === 0) {
    highlights.push('✅ No critical gaps identified across target editions');
  } else {
    highlights.push(`${allGaps.length} total gaps across editions`);
    highlights.push(`${topGaps.length} high-impact capabilities to prioritize`);
  }

  const recommendations: string[] = [];
  topGaps.forEach((gap, idx) => {
    if (idx < 3) recommendations.push(`Priority ${idx + 1}: Address ${gap}`);
  });

  return {
    sectionKey: 'gaps_and_recommendations',
    sectionTitle: 'Critical Gaps & Recommendations',
    description: 'Capability gaps blocking edition alignment and remediation priorities',
    category: 'readiness',
    metrics: {
      total_gaps: allGaps.length,
      missing_gaps: allGaps.filter((g) => g.gapType === 'missing').length,
      low_score_gaps: allGaps.filter((g) => g.gapType === 'low_score').length,
      top_gaps: topGaps,
      affected_editions: Array.from(new Set(allGaps.map((g) => g.edition))).length,
    },
    highlights,
    recommendations,
    priority: allGaps.length > 10 ? 1 : allGaps.length > 5 ? 2 : 3,
  };
}

/**
 * Build network intelligence section (if events exist)
 */
function buildNetworkIntelligenceSection(
  networkEvents: HealthTimelinePoint[]
): ExecutiveReport['sections'][0] {
  const anomalyCount = networkEvents.filter((e) => e.label?.toLowerCase().includes('anomaly'))
    .length;
  const alertCount = networkEvents.filter((e) => e.label?.toLowerCase().includes('alert')).length;

  const highlights: string[] = [];
  if (anomalyCount === 0 && alertCount === 0) {
    highlights.push('✅ Network operating normally');
  } else {
    if (anomalyCount > 0) highlights.push(`${anomalyCount} anomalies detected this period`);
    if (alertCount > 0) highlights.push(`${alertCount} alerts triggered`);
  }

  return {
    sectionKey: 'network_intelligence',
    sectionTitle: 'Network Intelligence & Health',
    description: 'X-series network telemetry and anomaly detection',
    category: 'network_intelligence',
    metrics: {
      recent_events_count: networkEvents.length,
      anomaly_count: anomalyCount,
      alert_count: alertCount,
    },
    highlights,
    recommendations:
      anomalyCount > 2 ? ['Investigate anomaly patterns; may indicate systemic issues'] : [],
    priority: anomalyCount > 5 ? 1 : anomalyCount > 0 ? 2 : 3,
  };
}

/**
 * Map fit score to status bucket
 */
function mapScoreToBucket(score: number): string {
  if (score < 25) return 'not_started';
  if (score < 60) return 'emerging';
  if (score < 90) return 'aligned';
  return 'exceeds';
}

/**
 * Determine network health status from timeline events
 */
function determineNetworkHealthStatus(timeline: HealthTimelinePoint[]): string {
  const recentEvents = timeline.slice(0, 20); // Last 20 events
  const issues = recentEvents.filter((e) => e.metadata?.severity === 'high').length;

  if (issues > 5) return 'critical';
  if (issues > 2) return 'degraded';
  if (issues > 0) return 'warnings';
  return 'healthy';
}

/**
 * Determine risk level from readiness and edition alignment
 */
function determineRiskLevel(
  readiness: GuardianReadinessSnapshot,
  editions: GuardianEditionFitResult[]
): 'low' | 'medium' | 'high' {
  // Multiple factors contribute to risk
  let riskScore = 0;

  // Low readiness is high risk
  if (readiness.overallScore < 30) riskScore += 3;
  else if (readiness.overallScore < 50) riskScore += 2;

  // Poor edition alignment
  const avgEditionFit =
    editions.length > 0 ? editions.reduce((sum, f) => sum + f.overallFitScore, 0) / editions.length : 0;

  if (avgEditionFit < 30) riskScore += 3;
  else if (avgEditionFit < 50) riskScore += 2;

  // Many not_configured capabilities
  const notConfiguredCount = readiness.capabilities.filter(
    (c) => c.status === 'not_configured'
  ).length;
  if (notConfiguredCount > readiness.capabilities.length * 0.5) riskScore += 2;

  if (riskScore >= 5) return 'high';
  if (riskScore >= 3) return 'medium';
  return 'low';
}

/**
 * Persist executive report to database
 */
export async function persistExecutiveReport(
  report: ExecutiveReport
): Promise<ExecutiveReport & { id: string }> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_executive_reports')
    .insert([
      {
        tenant_id: report.tenantId,
        created_at: report.createdAt.toISOString(),
        period_start: report.periodStart.toISOString().split('T')[0],
        period_end: report.periodEnd.toISOString().split('T')[0],
        title: report.title,
        report_type: report.reportType,
        audience: report.audience,
        summary: report.summary,
        sections: report.sections,
        edition_key: report.editionKey || null,
        uplift_plan_id: report.upliftPlanId || null,
        narrative: report.narrative || {},
        export_metadata: report.exportMetadata || {},
        metadata: report.metadata || {},
      },
    ])
    .select('*')
    .single();

  if (error) throw error;

  return {
    ...report,
    id: data.id,
  };
}

/**
 * Load executive reports for a tenant
 */
export async function loadExecutiveReportsForTenant(
  tenantId: string,
  limit: number = 10
): Promise<ExecutiveReport[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_executive_reports')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return (data || []).map((row: any) => ({
    id: row.id,
    tenantId: row.tenant_id,
    createdAt: new Date(row.created_at),
    periodStart: new Date(row.period_start),
    periodEnd: new Date(row.period_end),
    title: row.title,
    reportType: row.report_type,
    audience: row.audience,
    summary: row.summary,
    sections: row.sections,
    editionKey: row.edition_key,
    upliftPlanId: row.uplift_plan_id,
    narrative: row.narrative,
    exportMetadata: row.export_metadata,
    metadata: row.metadata,
  }));
}

/**
 * Load single report by ID
 */
export async function loadExecutiveReportById(
  tenantId: string,
  reportId: string
): Promise<ExecutiveReport | null> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_executive_reports')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', reportId)
    .single();

  if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  if (!data) return null;

  return {
    id: data.id,
    tenantId: data.tenant_id,
    createdAt: new Date(data.created_at),
    periodStart: new Date(data.period_start),
    periodEnd: new Date(data.period_end),
    title: data.title,
    reportType: data.report_type,
    audience: data.audience,
    summary: data.summary,
    sections: data.sections,
    editionKey: data.edition_key,
    upliftPlanId: data.uplift_plan_id,
    narrative: data.narrative,
    exportMetadata: data.export_metadata,
    metadata: data.metadata,
  };
}
