/**
 * POST /api/competitors/scrape?workspaceId=...
 *
 * Trigger on-demand competitor scraping
 */

import { NextRequest } from "next/server";
import { validateUserAndWorkspace } from "@/lib/api-helpers";
import { successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { scrapeCompetitor } from "@/lib/scraping/competitor-scraper-agent";

export const POST = withErrorBoundary(async (req: NextRequest) => {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
return errorResponse("workspaceId required", 400);
}

  await validateUserAndWorkspace(req, workspaceId);

  const body = await req.json();
  const { competitorId, domain, jobType = "full_scrape", socialHandles } = body;

  if (!competitorId || !domain) {
    return errorResponse("competitorId and domain required", 400);
  }

  if (!["full_scrape", "pricing", "social", "reddit"].includes(jobType)) {
    return errorResponse("Invalid jobType", 400);
  }

  try {
    const result = await scrapeCompetitor({
      workspaceId,
      competitorId,
      domain,
      jobType,
      socialHandles,
    });

    if (!result.success) {
      return errorResponse(result.error || "Scraping failed", 500);
    }

    return successResponse(result, 202); // 202 Accepted
  } catch (error) {
    return errorResponse((error as Error).message, 500);
  }
});
