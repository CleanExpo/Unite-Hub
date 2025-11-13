import { NextRequest, NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { fetchMutation } from "convex/nextjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, templateIds } = body;

    if (!action || !templateIds || !Array.isArray(templateIds)) {
      return NextResponse.json(
        { error: "Missing action or templateIds" },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case "delete":
        result = await fetchMutation(api.socialTemplates.bulkDelete, {
          templateIds: templateIds as any,
        });
        break;

      case "favorite":
        result = await fetchMutation(api.socialTemplates.bulkFavorite, {
          templateIds: templateIds as any,
          favorite: true,
        });
        break;

      case "unfavorite":
        result = await fetchMutation(api.socialTemplates.bulkFavorite, {
          templateIds: templateIds as any,
          favorite: false,
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
