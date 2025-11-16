import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const { id } = await params;
    const isFavorite = await fetchMutation(api.socialTemplates.toggleFavorite, {
      templateId: id as any,
    });

    return NextResponse.json({ success: true, isFavorite });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}
