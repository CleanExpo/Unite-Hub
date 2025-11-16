import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";
import { apiRateLimit } from "@/lib/rate-limit";
import { authenticateRequest } from "@/lib/auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    // Authenticate req
    const authResult = await authenticateRequest(req);
    if (!authResult) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { userId } = authResult;

    const { id: clientId } = await params;
    const searchParams = req.nextUrl.searchParams;
    const platform = searchParams.get("platform") || undefined;
    const category = searchParams.get("category") || undefined;
    const favoriteOnly = searchParams.get("favoriteOnly") === "true";

    const templates = await fetchQuery(api.socialTemplates.getTemplates, {
      clientId: clientId as any,
      platform: platform as any,
      category: category as any,
      favoriteOnly,
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { error: "Failed to fetch templates" },
      { status: 500 }
    );
  }
}
