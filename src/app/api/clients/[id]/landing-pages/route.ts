import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { Id } from "@/convex/_generated/dataModel";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

/**
 * GET /api/clients/[id]/landing-pages
 * Get all landing page checklists for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Authenticate request
    const authResult = await authenticateRequest(request);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const { id } = await params;
    const clientId = id as Id<"clients">;
    const { searchParams } = new URL(request.url);
    const pageType = searchParams.get("pageType");

    const checklists = await fetchQuery(api.landingPages.listByClient, {
      clientId,
      pageType: pageType as any,
    });

    return NextResponse.json({
      checklists,
      total: checklists.length,
    });
  } catch (error: any) {
    console.error("Error fetching checklists:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch checklists" },
      { status: 500 }
    );
  }
}
