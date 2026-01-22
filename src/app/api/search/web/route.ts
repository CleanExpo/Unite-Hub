/**
 * Web Search API Endpoint
 *
 * Provides real-time web search using Brave Search API.
 *
 * @route GET /api/search/web
 * @query workspaceId - Required workspace ID for multi-tenant isolation
 * @query q - Search query (required)
 * @query count - Number of results (default: 10, max: 20)
 * @query freshness - Time filter: pd (day), pw (week), pm (month), py (year)
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { NextRequest } from "next/server";
import { validateUserAndWorkspace, successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { webSearch, type WebSearchOptions } from "@/lib/integrations/brave-search";

export const GET = withErrorBoundary(async (req: NextRequest) => {
  // Multi-tenant validation
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");
  if (!workspaceId) {
    return errorResponse("workspaceId required", 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // Get search parameters
  const query = req.nextUrl.searchParams.get("q");
  if (!query) {
    return errorResponse("Search query (q) required", 400);
  }

  const count = Math.min(
    parseInt(req.nextUrl.searchParams.get("count") || "10", 10),
    20
  );

  const freshness = req.nextUrl.searchParams.get("freshness") as
    | "pd"
    | "pw"
    | "pm"
    | "py"
    | null;

  const options: WebSearchOptions = {
    count,
    ...(freshness && { freshness }),
  };

  // Execute search
  const results = await webSearch(query, options);

  return successResponse({
    query: results.query,
    results: results.results,
    total_count: results.total_count,
    source: "brave",
  });
});

export const runtime = "nodejs";
