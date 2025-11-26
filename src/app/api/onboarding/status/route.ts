import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { apiRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
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

    // Fetch onboarding status
    const { data, error } = await supabase
      .from("user_onboarding")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows returned
      console.error("Error fetching onboarding status:", error);
      return NextResponse.json(
        { error: "Failed to fetch onboarding status" },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({
        message: "Onboarding not started",
        data: null,
      });
    }

    // Calculate completion percentage
    const completedSteps =
      (data.step_1_complete ? 1 : 0) +
      (data.step_2_complete ? 1 : 0) +
      (data.step_3_complete ? 1 : 0) +
      (data.step_5_complete ? 1 : 0); // Step 4 is optional

    const completionPercentage = Math.round((completedSteps / 4) * 100);

    const isComplete = data.completed_at !== null || data.skipped === true;

    return NextResponse.json({
      data,
      completionPercentage,
      isComplete,
    });
  } catch (error) {
    console.error("Unexpected error fetching onboarding status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
