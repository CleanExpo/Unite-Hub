/**
 * Performance Insights Service
 * Phase 40: Performance Intelligence Layer
 *
 * Collects and normalizes real data for performance reports
 */

import { getSupabaseServer } from "@/lib/supabase";
import { logEvent } from "./aiEventLogService";
import {
  fetchRankTracking,
  fetchBacklinkSummary,
  fetchTrafficTrends,
  fetchKeywordDistribution,
} from "@/lib/integrations/dataForSEOBridge";
import { orchestrateVisualGeneration } from "@/lib/ai/visual/visualOrchestrator";

export interface InternalMetrics {
  tasksCompleted: number;
  tasksTotal: number;
  approvalsApproved: number;
  approvalsRejected: number;
  approvalsPending: number;
  aiEventsGenerated: number;
  visualAssetsCreated: number;
  knowledgeItemsAdded: number;
}

export interface ExternalMetrics {
  rankTracking: Awaited<ReturnType<typeof fetchRankTracking>>;
  backlinks: Awaited<ReturnType<typeof fetchBacklinkSummary>>;
  traffic: Awaited<ReturnType<typeof fetchTrafficTrends>>;
  keywords: Awaited<ReturnType<typeof fetchKeywordDistribution>>;
}

export interface NormalizedMetrics {
  internal: InternalMetrics;
  external: ExternalMetrics;
  dataSources: string[];
  generatedAt: string;
}

export interface PerformanceReport {
  id: string;
  client_id: string;
  period: "quarterly" | "annual";
  start_date: string;
  end_date: string;
  metrics: NormalizedMetrics;
  visual_asset_ids: string[];
  narrative: string;
  data_sources: string[];
  status: "draft" | "ready_for_review" | "approved";
  created_at: string;
}

/**
 * Collect internal metrics from database
 */
export async function collectInternalMetrics(
  clientId: string,
  startDate: Date,
  endDate: Date
): Promise<InternalMetrics> {
  const supabase = await getSupabaseServer();

  // Tasks
  const { data: tasks } = await supabase
    .from("client_project_tasks")
    .select("status")
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  const tasksCompleted = tasks?.filter((t) => t.status === "complete").length || 0;
  const tasksTotal = tasks?.length || 0;

  // Approvals
  const { data: approvals } = await supabase
    .from("client_approvals")
    .select("status")
    .eq("client_id", clientId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  const approvalsApproved = approvals?.filter((a) => a.status === "approved").length || 0;
  const approvalsRejected = approvals?.filter((a) => a.status === "rejected").length || 0;
  const approvalsPending = approvals?.filter((a) => a.status === "pending").length || 0;

  // AI Events
  const { count: aiEventsGenerated } = await supabase
    .from("ai_event_log")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  // Visual Assets
  const { count: visualAssetsCreated } = await supabase
    .from("visual_assets")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  // Knowledge Items
  const { count: knowledgeItemsAdded } = await supabase
    .from("client_knowledge_items")
    .select("*", { count: "exact", head: true })
    .eq("client_id", clientId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  return {
    tasksCompleted,
    tasksTotal,
    approvalsApproved,
    approvalsRejected,
    approvalsPending,
    aiEventsGenerated: aiEventsGenerated || 0,
    visualAssetsCreated: visualAssetsCreated || 0,
    knowledgeItemsAdded: knowledgeItemsAdded || 0,
  };
}

/**
 * Collect external metrics from DataForSEO
 */
export async function collectDataForSEOMetrics(
  clientId: string,
  domain: string
): Promise<ExternalMetrics> {
  const [rankTracking, backlinks, traffic, keywords] = await Promise.all([
    fetchRankTracking(domain),
    fetchBacklinkSummary(domain),
    fetchTrafficTrends(domain),
    fetchKeywordDistribution(domain),
  ]);

  return {
    rankTracking,
    backlinks,
    traffic,
    keywords,
  };
}

/**
 * Normalize all metrics
 */
export function normalizeMetrics(
  internal: InternalMetrics,
  external: ExternalMetrics
): NormalizedMetrics {
  const dataSources: string[] = ["Unite-Hub Internal Database"];

  if (external.rankTracking) {
dataSources.push("DataForSEO Rank Tracking");
}
  if (external.backlinks) {
dataSources.push("DataForSEO Backlinks");
}
  if (external.traffic) {
dataSources.push("DataForSEO Traffic");
}
  if (external.keywords) {
dataSources.push("DataForSEO Keywords");
}

  return {
    internal,
    external,
    dataSources,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate narrative from metrics (real data only)
 */
export function generateNarrative(
  metrics: NormalizedMetrics,
  period: "quarterly" | "annual"
): string {
  const { internal } = metrics;

  const lines: string[] = [];

  // Activity summary
  if (internal.tasksTotal > 0) {
    const completionRate = Math.round((internal.tasksCompleted / internal.tasksTotal) * 100);
    lines.push(
      `${internal.tasksCompleted} of ${internal.tasksTotal} tasks completed (${completionRate}% completion rate).`
    );
  } else {
    lines.push("No tasks were tracked during this period.");
  }

  // Approvals
  const totalApprovals = internal.approvalsApproved + internal.approvalsRejected + internal.approvalsPending;
  if (totalApprovals > 0) {
    lines.push(
      `${totalApprovals} items reviewed: ${internal.approvalsApproved} approved, ${internal.approvalsRejected} rejected, ${internal.approvalsPending} pending.`
    );
  }

  // AI Activity
  if (internal.aiEventsGenerated > 0) {
    lines.push(`${internal.aiEventsGenerated} AI-generated events logged.`);
  }

  // Visual Assets
  if (internal.visualAssetsCreated > 0) {
    lines.push(`${internal.visualAssetsCreated} visual assets created.`);
  }

  // Data sources disclaimer
  lines.push("");
  lines.push(`Data sources: ${metrics.dataSources.join(", ")}.`);
  lines.push("All metrics are based on real data. No estimates or projections included.");

  return lines.join(" ");
}

/**
 * Generate visuals for the report
 */
export async function generateVisuals(
  clientId: string,
  metrics: NormalizedMetrics,
  period: "quarterly" | "annual"
): Promise<string[]> {
  const visualIds: string[] = [];

  // Generate KPI summary visual
  const kpiResult = await orchestrateVisualGeneration({
    clientId,
    context: "performance",
    type: "graph",
    prompt: `${period} performance KPI summary. Clean data visualization, no fake numbers.`,
    mode: "auto_baseline",
    metadata: { reportType: period },
  });

  if (kpiResult.success && kpiResult.assetId) {
    visualIds.push(kpiResult.assetId);
  }

  return visualIds;
}

/**
 * Save performance report
 */
export async function saveReport(
  clientId: string,
  period: "quarterly" | "annual",
  startDate: Date,
  endDate: Date,
  metrics: NormalizedMetrics,
  visualIds: string[],
  narrative: string
): Promise<PerformanceReport | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("performance_reports")
    .insert({
      client_id: clientId,
      period,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      metrics,
      visual_asset_ids: visualIds,
      narrative,
      data_sources: metrics.dataSources,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    console.error("Error saving report:", error);
    return null;
  }

  // Log the event
  await logEvent(
    clientId,
    "system",
    "concept_generated",
    `${period} performance report generated`,
    { reportId: data.id, period }
  );

  return data as PerformanceReport;
}

/**
 * Get reports for a client
 */
export async function getReportsForClient(
  clientId: string,
  period?: "quarterly" | "annual"
): Promise<PerformanceReport[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from("performance_reports")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (period) {
    query = query.eq("period", period);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching reports:", error);
    return [];
  }

  return data as PerformanceReport[];
}

/**
 * Update report status
 */
export async function updateReportStatus(
  reportId: string,
  clientId: string,
  status: "draft" | "ready_for_review" | "approved"
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("performance_reports")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("client_id", clientId);

  if (error) {
    console.error("Error updating status:", error);
    return false;
  }

  return true;
}

export default {
  collectInternalMetrics,
  collectDataForSEOMetrics,
  normalizeMetrics,
  generateNarrative,
  generateVisuals,
  saveReport,
  getReportsForClient,
  updateReportStatus,
};
