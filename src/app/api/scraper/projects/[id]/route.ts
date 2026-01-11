/**
 * GET /api/scraper/projects/[id]?workspaceId=...
 * DELETE /api/scraper/projects/[id]?workspaceId=...
 *
 * Get project status/results or delete project
 */

import { NextRequest } from "next/server";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getProjectStatus, getProjectResults } from "@/lib/scraping/universal-scraper-agent";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
return errorResponse("workspaceId required", 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id: projectId } = await context.params;

  // Get project status
  const project = await getProjectStatus(workspaceId, projectId);
  if (!project) {
    return errorResponse("Project not found", 404);
  }

  // Get results if completed
  const results = project.status === "completed" 
    ? await getProjectResults(workspaceId, projectId)
    : null;

  return successResponse({
    project,
    results,
  });
});

export const DELETE = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
return errorResponse("workspaceId required", 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const { id: projectId } = await context.params;

  // Verify ownership
  const { data: project, error: checkError } = await supabaseAdmin
    .from("scraper_projects")
    .select("id")
    .eq("id", projectId)
    .eq("workspace_id", workspaceId)
    .single();

  if (checkError || !project) {
    return errorResponse("Project not found", 404);
  }

  // Delete (cascades to related records)
  const { error } = await supabaseAdmin
    .from("scraper_projects")
    .delete()
    .eq("id", projectId);

  if (error) {
return errorResponse(error.message, 500);
}

  return successResponse({ deleted: true });
});
