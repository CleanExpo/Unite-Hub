import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const body = await req.json();
    const { action, templateIds } = body;

    if (!action || !templateIds || !Array.isArray(templateIds)) {
      return NextResponse.json(
        { error: "Missing action or templateIds" },
        { status: 400 }
      );
    }

    const supabase = await getSupabaseServer();

    let result;

    switch (action) {
      case "delete":
        const { error: deleteError, count: deleteCount } = await supabase
          .from("social_templates")
          .delete()
          .in("id", templateIds);

        if (deleteError) {
          throw deleteError;
        }
        result = { deleted: deleteCount || templateIds.length };
        break;

      case "favorite":
        const { error: favError } = await supabase
          .from("social_templates")
          .update({ is_favorite: true, updated_at: new Date().toISOString() })
          .in("id", templateIds);

        if (favError) {
          throw favError;
        }
        result = { updated: templateIds.length, favorite: true };
        break;

      case "unfavorite":
        const { error: unfavError } = await supabase
          .from("social_templates")
          .update({ is_favorite: false, updated_at: new Date().toISOString() })
          .in("id", templateIds);

        if (unfavError) {
          throw unfavError;
        }
        result = { updated: templateIds.length, favorite: false };
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
