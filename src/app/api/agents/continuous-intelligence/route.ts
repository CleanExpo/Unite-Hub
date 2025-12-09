// Route segment config for Vercel
export const maxDuration = 120; // 2 minutes
export const dynamic = 'force-dynamic';

 
import type { NextRequest } from "next/server";
import { withErrorBoundary, AuthenticationError, DatabaseError, successResponse } from "@/lib/errors/boundaries";
import { getSupabaseServer } from "@/lib/supabase";
import { extractEmailIntelligence } from "@/lib/agents/intelligence-extraction";

/**
 * Continuous Intelligence Update Agent API
 *
 * POST /api/agents/continuous-intelligence
 *
 * Scheduled endpoint (cron job) that runs every 30 minutes to:
 * 1. Query all workspaces for unanalyzed emails (intelligence_analyzed = false)
 * 2. Trigger AI Intelligence Extraction for each workspace
 * 3. Update analytics and metrics
 *
 * This is a system endpoint - should be called by cron job with authorization header
 *
 * Authorization: Bearer <CRON_SECRET>
 */

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.ANTHROPIC_API_KEY; // Fallback for dev

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    throw new AuthenticationError("Invalid or missing cron authorization");
  }

  const body = await req.json();
  const { batchSizePerWorkspace = 10, maxWorkspaces = 50 } = body;

  const supabase = await getSupabaseServer();

  // Get all workspaces with unanalyzed emails
  const { data: workspaces, error: workspaceError } = await supabase
    .from("client_emails")
    .select("workspace_id")
    .eq("intelligence_analyzed", false)
    .limit(maxWorkspaces);

  if (workspaceError) {
    throw new DatabaseError("Failed to fetch workspaces");
  }

  // Get unique workspace IDs
  const uniqueWorkspaceIds = [
    ...new Set(workspaces?.map((w) => w.workspace_id) || []),
  ];

  if (uniqueWorkspaceIds.length === 0) {
    return successResponse({
      success: true,
      message: "No unanalyzed emails found",
      workspaces_processed: 0,
      total_emails_processed: 0,
    }, undefined, undefined, 200);
  }

  // Process each workspace
  const results = [];
  let totalProcessed = 0;
  let totalFailed = 0;

  for (const workspaceId of uniqueWorkspaceIds) {
    try {
      const result = await extractEmailIntelligence(workspaceId, batchSizePerWorkspace);
      results.push({
        workspace_id: workspaceId,
        processed: result.processed,
        failed: result.failed,
        total: result.total,
      });
      totalProcessed += result.processed;
      totalFailed += result.failed;
    } catch (error) {
      console.error(`Error processing workspace ${workspaceId}:`, error);
      results.push({
        workspace_id: workspaceId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Log execution to database
  const { error: logError } = await supabase.from("autonomous_tasks").insert({
    workspace_id: uniqueWorkspaceIds[0], // Use first workspace for logging
    task_type: "continuous_intelligence_update",
    status: totalFailed === 0 ? "completed" : "partial_failure",
    input_data: {
      workspaces_count: uniqueWorkspaceIds.length,
      batch_size: batchSizePerWorkspace,
    },
    output_data: {
      total_processed: totalProcessed,
      total_failed: totalFailed,
      results,
    },
    executed_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });

  if (logError) {
    console.error("Failed to log execution:", logError);
  }

  return successResponse({
    success: true,
    workspaces_processed: uniqueWorkspaceIds.length,
    total_emails_processed: totalProcessed,
    total_emails_failed: totalFailed,
    results,
    timestamp: new Date().toISOString(),
  }, undefined, undefined, 200);
});

/**
 * GET /api/agents/continuous-intelligence
 *
 * Get status and statistics for continuous intelligence updates
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  // Verify cron secret or user auth
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET || process.env.ANTHROPIC_API_KEY;

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    throw new AuthenticationError("Invalid or missing cron authorization");
  }

  const supabase = await getSupabaseServer();

  // Get recent execution logs
  const { data: recentExecutions, error: executionError } = await supabase
    .from("autonomous_tasks")
    .select("*")
    .eq("task_type", "continuous_intelligence_update")
    .order("executed_at", { ascending: false })
    .limit(10);

  if (executionError) {
    throw new DatabaseError("Failed to fetch execution logs");
  }

  // Get total unanalyzed emails across all workspaces
  const { count: unanalyzedCount, error: countError } = await supabase
    .from("client_emails")
    .select("*", { count: "exact", head: true })
    .eq("intelligence_analyzed", false);

  if (countError) {
    throw new DatabaseError("Failed to count unanalyzed emails");
  }

  // Get total intelligence records
  const { count: intelligenceCount, error: intelligenceError } = await supabase
    .from("email_intelligence")
    .select("*", { count: "exact", head: true });

  if (intelligenceError) {
    throw new DatabaseError("Failed to count intelligence records");
  }

  return successResponse({
    success: true,
    stats: {
      unanalyzed_emails: unanalyzedCount || 0,
      total_intelligence_records: intelligenceCount || 0,
      recent_executions: recentExecutions || [],
      last_execution: recentExecutions?.[0] || null,
    },
  }, undefined, undefined, 200);
});
