/**
 * POST /api/scraper/projects?workspaceId=...
 * GET /api/scraper/projects?workspaceId=...
 *
 * Create and list scraping projects
 */

import { NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { universalScrapeProject, listProjects } from "@/lib/scraping/universal-scraper-agent";

export const GET = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
return errorResponse("workspaceId required", 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const projects = await listProjects(workspaceId);
  return successResponse(projects || []);
});

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
return errorResponse("workspaceId required", 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const {
    name,
    description,
    seedUrl,
    keywords = [],
    maxUrlsToScrape = 20,
    searchDepth = 1,
    includeImages = true,
    includePricing = true,
  } = body;

  if (!name || !seedUrl || keywords.length === 0) {
    return errorResponse("name, seedUrl, and keywords required", 400);
  }

  if (!Array.isArray(keywords)) {
    return errorResponse("keywords must be an array", 400);
  }

  if (keywords.length > 5) {
    return errorResponse("Maximum 5 keywords allowed", 400);
  }

  try {
    const result = await universalScrapeProject({
      workspaceId,
      name,
      description,
      seedUrl,
      keywords,
      maxUrlsToScrape: Math.min(maxUrlsToScrape, 50),
      searchDepth,
      includeImages,
      includePricing,
    });

    if (!result.success) {
      return errorResponse(result.error || "Scraping failed", 500);
    }

    return successResponse(result, 202);
  } catch (error) {
    return errorResponse((error as Error).message, 500);
  }
});
