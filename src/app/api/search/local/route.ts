/**
 * Local Search API Endpoint
 *
 * Provides local POI (Point of Interest) search using Brave Search API.
 * Useful for finding local businesses, restaurants, services, etc.
 *
 * @route GET /api/search/local
 * @query workspaceId - Required workspace ID for multi-tenant isolation
 * @query q - Search query (required)
 * @query lat - Latitude for location-based search (optional)
 * @query lng - Longitude for location-based search (optional)
 * @query count - Number of results (default: 10, max: 20)
 *
 * @see spec: .claude/plans/SPEC-2026-01-23.md
 */

import { NextRequest } from "next/server";
import { validateUserAndWorkspace, successResponse, errorResponse } from "@/lib/api-helpers";
import { withErrorBoundary } from "@/lib/error-boundary";
import { localSearch, type LocalSearchOptions } from "@/lib/integrations/brave-search";

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

  // Location parameters (optional)
  const latParam = req.nextUrl.searchParams.get("lat");
  const lngParam = req.nextUrl.searchParams.get("lng");

  const options: LocalSearchOptions = {
    count,
  };

  if (latParam && lngParam) {
    const lat = parseFloat(latParam);
    const lng = parseFloat(lngParam);

    if (!isNaN(lat) && !isNaN(lng)) {
      options.lat = lat;
      options.lng = lng;
    }
  }

  // Execute search
  const results = await localSearch(query, options);

  return successResponse({
    query: results.query,
    results: results.results,
    source: "brave_local",
  });
});

export const runtime = "nodejs";
