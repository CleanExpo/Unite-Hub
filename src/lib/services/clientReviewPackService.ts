/**
 * Client Review Pack Service
 * Phase 43: Agency Review Pack Generator
 *
 * Create and manage client review packs with real data only
 */

import { getSupabaseServer } from "@/lib/supabase";
import { logEvent } from "./aiEventLogService";

// Types
export interface ReviewPack {
  id: string;
  clientId: string;
  periodType: "quarterly" | "annual";
  startDate: string;
  endDate: string;
  performanceReportId?: string;
  visualAssetIds: string[];
  narrative?: string;
  dataSources: string[];
  status: "draft" | "ready_for_review" | "approved" | "sent";
  deliveryChannel?: string;
  sentAt?: string;
  createdAt: string;
}

/**
 * Create a new review pack
 */
export async function createReviewPack(
  clientId: string,
  periodType: "quarterly" | "annual",
  startDate: Date,
  endDate: Date
): Promise<ReviewPack | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_review_packs")
    .insert({
      client_id: clientId,
      period_type: periodType,
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
      status: "draft",
      data_sources: ["Unite-Hub Internal"],
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating review pack:", error);
    return null;
  }

  await logEvent(
    clientId,
    "system",
    "concept_generated",
    `${periodType} review pack created`,
    { reviewPackId: data.id }
  );

  return mapPack(data);
}

/**
 * Attach a performance report to the pack
 */
export async function attachPerformanceReport(
  reviewPackId: string,
  performanceReportId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("client_review_packs")
    .update({
      performance_report_id: performanceReportId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewPackId);

  if (error) {
    console.error("Error attaching report:", error);
    return false;
  }

  // Update data sources
  await supabase.rpc("array_append_unique", {
    table_name: "client_review_packs",
    column_name: "data_sources",
    id: reviewPackId,
    value: "Performance Reports",
  }).catch(() => {
    // Fallback if RPC doesn't exist
  });

  return true;
}

/**
 * Attach visual assets to the pack
 */
export async function attachVisualAssets(
  reviewPackId: string,
  visualAssetIds: string[]
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from("client_review_packs")
    .update({
      visual_asset_ids: visualAssetIds,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewPackId);

  if (error) {
    console.error("Error attaching visuals:", error);
    return false;
  }

  return true;
}

/**
 * Generate narrative from real metrics
 */
export async function generateNarrativeFromMetrics(
  reviewPackId: string
): Promise<string | null> {
  const supabase = await getSupabaseServer();

  // Get the pack with its performance report
  const { data: pack } = await supabase
    .from("client_review_packs")
    .select("*, performance_reports(*)")
    .eq("id", reviewPackId)
    .single();

  if (!pack) {
return null;
}

  const report = pack.performance_reports;
  const metrics = report?.metrics?.internal;

  if (!metrics) {
    return "No performance data available for this period.";
  }

  // Generate factual narrative from real data
  const lines: string[] = [];

  // Period header
  const periodLabel = pack.period_type === "quarterly" ? "Quarterly" : "Annual";
  lines.push(`${periodLabel} Agency Review: ${pack.start_date} to ${pack.end_date}`);
  lines.push("");

  // Tasks
  if (metrics.tasksTotal > 0) {
    const rate = Math.round((metrics.tasksCompleted / metrics.tasksTotal) * 100);
    lines.push(`Task Completion: ${metrics.tasksCompleted} of ${metrics.tasksTotal} tasks completed (${rate}% completion rate).`);
  }

  // Approvals
  const totalApprovals = metrics.approvalsApproved + metrics.approvalsRejected + metrics.approvalsPending;
  if (totalApprovals > 0) {
    lines.push(`Content Approvals: ${metrics.approvalsApproved} approved, ${metrics.approvalsRejected} revised, ${metrics.approvalsPending} pending review.`);
  }

  // AI Activity
  if (metrics.aiEventsGenerated > 0) {
    lines.push(`AI Activity: ${metrics.aiEventsGenerated} AI-generated items including content, analyses, and recommendations.`);
  }

  // Visuals
  if (metrics.visualAssetsCreated > 0) {
    lines.push(`Visual Assets: ${metrics.visualAssetsCreated} images, videos, and graphics created.`);
  }

  // Disclaimer
  lines.push("");
  lines.push("All metrics are based on real data from the reporting period. No estimates or projections included.");

  const narrative = lines.join(" ");

  // Save narrative
  await supabase
    .from("client_review_packs")
    .update({
      narrative,
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewPackId);

  return narrative;
}

/**
 * Mark pack as ready for review
 */
export async function markReadyForReview(reviewPackId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_review_packs")
    .update({
      status: "ready_for_review",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewPackId)
    .select("client_id")
    .single();

  if (error) {
    console.error("Error marking ready:", error);
    return false;
  }

  await logEvent(
    data.client_id,
    "system",
    "approval_requested",
    "Review pack ready for client review",
    { reviewPackId }
  );

  return true;
}

/**
 * Approve the review pack
 */
export async function approveReviewPack(reviewPackId: string): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_review_packs")
    .update({
      status: "approved",
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewPackId)
    .select("client_id")
    .single();

  if (error) {
    console.error("Error approving:", error);
    return false;
  }

  await logEvent(
    data.client_id,
    "system",
    "approval_completed",
    "Review pack approved",
    { reviewPackId }
  );

  return true;
}

/**
 * Mark pack as sent
 */
export async function markSent(
  reviewPackId: string,
  channel: "dashboard" | "pdf_export" | "email"
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_review_packs")
    .update({
      status: "sent",
      delivery_channel: channel,
      sent_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", reviewPackId)
    .select("client_id")
    .single();

  if (error) {
    console.error("Error marking sent:", error);
    return false;
  }

  await logEvent(
    data.client_id,
    "system",
    "content_delivered",
    `Review pack sent via ${channel}`,
    { reviewPackId, channel }
  );

  return true;
}

/**
 * List review packs for a client
 */
export async function listReviewPacksForClient(
  clientId: string
): Promise<ReviewPack[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_review_packs")
    .select("*")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error listing packs:", error);
    return [];
  }

  return (data || []).map(mapPack);
}

/**
 * Get a single review pack
 */
export async function getReviewPack(
  reviewPackId: string
): Promise<ReviewPack | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from("client_review_packs")
    .select("*")
    .eq("id", reviewPackId)
    .single();

  if (error) {
    console.error("Error getting pack:", error);
    return null;
  }

  return mapPack(data);
}

/**
 * Map database record to ReviewPack
 */
function mapPack(data: Record<string, unknown>): ReviewPack {
  return {
    id: data.id as string,
    clientId: data.client_id as string,
    periodType: data.period_type as "quarterly" | "annual",
    startDate: data.start_date as string,
    endDate: data.end_date as string,
    performanceReportId: data.performance_report_id as string | undefined,
    visualAssetIds: (data.visual_asset_ids as string[]) || [],
    narrative: data.narrative as string | undefined,
    dataSources: (data.data_sources as string[]) || [],
    status: data.status as ReviewPack["status"],
    deliveryChannel: data.delivery_channel as string | undefined,
    sentAt: data.sent_at as string | undefined,
    createdAt: data.created_at as string,
  };
}

export default {
  createReviewPack,
  attachPerformanceReport,
  attachVisualAssets,
  generateNarrativeFromMetrics,
  markReadyForReview,
  approveReviewPack,
  markSent,
  listReviewPacksForClient,
  getReviewPack,
};
