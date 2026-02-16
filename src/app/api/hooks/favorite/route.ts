import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth, validateUserAndWorkspace } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// POST /api/hooks/favorite - Toggle hook favorite status
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const body = await request.json();
    const { hook_id, is_favorite } = body;

    if (!hook_id) {
      return NextResponse.json(
        { error: "Missing hook_id" },
        { status: 400 }
      );
    }

    // In production, update hook favorite status in database
    const updatedHook = {
      id: hook_id,
      is_favorite: is_favorite !== undefined ? is_favorite : true,
      updated_at: new Date(),
    };

    return NextResponse.json({
      hook: updatedHook,
      message: is_favorite ? "Added to favorites" : "Removed from favorites",
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error toggling favorite:", error);
    return NextResponse.json(
      { error: "Failed to toggle favorite" },
      { status: 500 }
    );
  }
}

// GET /api/hooks/favorite - Get all favorite hooks
export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    // Validate user authentication
    const user = await validateUserAuth(request);

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("client_id");

    // In production, fetch favorite hooks from database
    const favoriteHooks = [
      {
        id: crypto.randomUUID(),
        hook_text: "Favorite hook example",
        category: "attention_grabber",
        platform: "facebook",
        is_favorite: true,
        created_at: new Date(),
      },
    ];

    return NextResponse.json({
      hooks: favoriteHooks,
      total: favoriteHooks.length,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching favorite hooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch favorite hooks" },
      { status: 500 }
    );
  }
}
