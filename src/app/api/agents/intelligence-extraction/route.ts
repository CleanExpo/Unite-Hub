 
import type { NextRequest } from "next/server";
import { withErrorBoundary, ValidationError, AuthenticationError, AuthorizationError, DatabaseError, successResponse } from "@/lib/errors/boundaries";
import { validateUserAuth, validateWorkspaceAccess } from "@/lib/workspace-validation";
import { extractEmailIntelligence } from "@/lib/agents/intelligence-extraction";
import { apiRateLimit } from "@/lib/rate-limit";

/**
 * AI Intelligence Extraction Agent API
 *
 * POST /api/agents/intelligence-extraction
 *
 * Processes unanalyzed emails and media files to extract:
 * - Communication intents (meeting request, question, proposal, etc.)
 * - Sentiment analysis (positive, neutral, negative)
 * - Key topics and entities
 * - Action items and follow-ups
 * - Client pain points and needs
 *
 * Updates intelligence_analyzed = true and analyzed_at timestamp
 * Creates email_intelligence records with extracted data
 */

export const POST = withErrorBoundary(async (req: NextRequest) => {
  // Apply rate limiting (returns early if rate limited)
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  // Validate user authentication
  let user;
  try {
    user = await validateUserAuth(req);
  } catch {
    throw new AuthenticationError("Authentication required");
  }

  const body = await req.json();
  const { workspaceId, batchSize = 10 } = body;

  if (!workspaceId) {
    throw new ValidationError("workspaceId is required", { workspaceId: "Required parameter" });
  }

  // Validate workspace access
  try {
    await validateWorkspaceAccess(workspaceId, user.orgId);
  } catch {
    throw new AuthorizationError("Access denied to this workspace");
  }

  // Extract intelligence from unanalyzed emails
  const result = await extractEmailIntelligence(workspaceId, batchSize);

  return successResponse({
    success: true,
    processed: result.processed,
    failed: result.failed,
    total: result.total,
    intelligence_records: result.intelligenceRecords.length,
    message: `Processed ${result.processed} emails, created ${result.intelligenceRecords.length} intelligence records`,
  }, undefined, undefined, 200);
});

/**
 * GET /api/agents/intelligence-extraction
 *
 * Get intelligence extraction statistics for workspace
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  // Validate user authentication
  let user;
  try {
    user = await validateUserAuth(req);
  } catch {
    throw new AuthenticationError("Authentication required");
  }

  const { searchParams } = new URL(req.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    throw new ValidationError("workspaceId is required", { workspaceId: "Required query parameter" });
  }

  // Validate workspace access
  try {
    await validateWorkspaceAccess(workspaceId, user.orgId);
  } catch {
    throw new AuthorizationError("Access denied to this workspace");
  }

  // Get stats
  const { getSupabaseServer } = await import("@/lib/supabase");
  const supabase = await getSupabaseServer();

  // Count analyzed vs unanalyzed emails
  const { data: emailStats, error: emailError } = await supabase
    .from("client_emails")
    .select("intelligence_analyzed", { count: "exact", head: false })
    .eq("workspace_id", workspaceId);

  if (emailError) {
    throw new DatabaseError("Failed to fetch email statistics");
  }

  const analyzed = emailStats?.filter((e) => e.intelligence_analyzed).length || 0;
  const unanalyzed = emailStats?.filter((e) => !e.intelligence_analyzed).length || 0;

  // Count intelligence records
  const { count: intelligenceCount, error: intelligenceError } = await supabase
    .from("email_intelligence")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);

  if (intelligenceError) {
    throw new DatabaseError("Failed to fetch intelligence record count");
  }

  return successResponse({
    success: true,
    stats: {
      emails: {
        total: analyzed + unanalyzed,
        analyzed,
        unanalyzed,
        percentage_analyzed: ((analyzed / (analyzed + unanalyzed)) * 100).toFixed(2),
      },
      intelligence_records: intelligenceCount || 0,
    },
  }, undefined, undefined, 200);
});
