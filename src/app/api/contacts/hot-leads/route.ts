import { NextRequest, NextResponse } from "next/server";
import { getHotLeads } from "@/lib/agents/contact-intelligence";
import { validateUserAndWorkspace } from "@/lib/workspace-validation";
import { apiRateLimit } from "@/lib/rate-limit";
import { getCache, CacheKeys, CacheTTL } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const workspaceId = searchParams.get("workspaceId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID is required" },
        { status: 400 }
      );
    }

    // Validate user authentication and workspace access
    await validateUserAndWorkspace(request, workspaceId);

    // Check cache first
    const cache = getCache();
    const cacheKey = `${CacheKeys.hotLeads(workspaceId)}:limit:${limit}`;
    const cached = await cache.get<{ success: boolean; count: number; leads: any[] }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    // Get hot leads (composite score >= 70)
    const hotLeads = await getHotLeads(workspaceId, limit);

    const responsePayload = {
      success: true,
      count: hotLeads.length,
      leads: hotLeads,
    };

    // Cache the result (MEDIUM TTL — 300s)
    await cache.set(cacheKey, responsePayload, CacheTTL.MEDIUM);

    return NextResponse.json(responsePayload);
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Hot leads retrieval error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve hot leads" },
      { status: 500 }
    );
  }
}
