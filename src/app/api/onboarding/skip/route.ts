import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
  // Apply rate limiting
  const rateLimitResult = await apiRateLimit(request);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const supabase = await getSupabaseServer();

    // Get authenticated user from session
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update onboarding to skipped
    const { data, error } = await supabase
      .from("user_onboarding")
      .update({
        skipped: true,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error skipping onboarding:", error);
      return NextResponse.json(
        { error: "Failed to skip onboarding" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Onboarding skipped successfully",
      data,
    });
  } catch (error) {
    console.error("Unexpected error skipping onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
