import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isFavorite = await fetchMutation(api.socialTemplates.toggleFavorite, {
      templateId: params.id as any,
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
