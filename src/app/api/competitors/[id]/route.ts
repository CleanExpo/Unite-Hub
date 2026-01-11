/**
 * GET /api/competitors/[id]?workspaceId=...
 * DELETE /api/competitors/[id]?workspaceId=...
 *
 * Get competitor data or delete competitor
 */

import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getCompetitorData, getScrapeJobs } from "@/lib/scraping/competitor-scraper-agent";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return errorResponse("workspaceId required", 400);

  await validateUserAndWorkspace(req, workspaceId);

  const { id: competitorId } = await context.params;

  // Get competitor info
  const supabase = getSupabaseServer();
  const { data: competitor, error: compError } = await supabase
    .from("competitors")
    .select("*")
    .eq("id", competitorId)
    .eq("workspace_id", workspaceId)
    .single();

  if (compError || !competitor) {
    return errorResponse("Competitor not found", 404);
  }

  // Get latest scrape data
  const competitorData = await getCompetitorData(workspaceId, competitorId);

  // Get scrape jobs
  const scrapeJobs = await getScrapeJobs(workspaceId, competitorId);

  return successResponse({
    competitor,
    latestData: competitorData,
    scrapeJobs: scrapeJobs || [],
  });
});

export const DELETE = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) return errorResponse("workspaceId required", 400);

  await validateUserAndWorkspace(req, workspaceId);

  const { id: competitorId } = await context.params;

  // Verify ownership
  const { data: competitor, error: checkError } = await supabaseAdmin
    .from("competitors")
    .select("id")
    .eq("id", competitorId)
    .eq("workspace_id", workspaceId)
    .single();

  if (checkError || !competitor) {
    return errorResponse("Competitor not found", 404);
  }

  // Delete (cascades to related records)
  const { error } = await supabaseAdmin
    .from("competitors")
    .delete()
    .eq("id", competitorId);

  if (error) return errorResponse(error.message, 500);

  return successResponse({ deleted: true });
});
