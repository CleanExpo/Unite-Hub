import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchQuery } from "convex/nextjs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const clientId = params.id;
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
