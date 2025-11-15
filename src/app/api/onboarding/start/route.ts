import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
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

    // Check if onboarding record already exists
    const { data: existing, error: checkError } = await supabase
      .from("user_onboarding")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking onboarding:", checkError);
      return NextResponse.json(
        { error: "Failed to check onboarding status" },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json({
        message: "Onboarding already exists",
        data: existing,
      });
    }

    // Create new onboarding record
    const { data, error } = await supabase
      .from("user_onboarding")
      .insert({
        user_id: user.id,
        current_step: 1,
        onboarding_data: {},
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating onboarding:", error);
      return NextResponse.json(
        { error: "Failed to start onboarding" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Onboarding started successfully",
      data,
    });
  } catch (error) {
    console.error("Unexpected error starting onboarding:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
