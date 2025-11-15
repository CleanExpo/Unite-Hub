import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServer();

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

    // Parse request body
    const body = await request.json();
    const { step, data: stepData } = body;

    if (!step || step < 1 || step > 5) {
      return NextResponse.json(
        { error: "Invalid step number" },
        { status: 400 }
      );
    }

    // Get current onboarding record
    const { data: current, error: fetchError } = await supabase
      .from("user_onboarding")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching onboarding:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch onboarding status" },
        { status: 500 }
      );
    }

    if (!current) {
      return NextResponse.json(
        { error: "Onboarding not started" },
        { status: 404 }
      );
    }

    // Update step completion
    const stepKey = `step_${step}_complete`;
    const nextStep = step < 5 ? step + 1 : 5;

    const updatedData = {
      ...current.onboarding_data,
      ...(stepData || {}),
    };

    const { data, error } = await supabase
      .from("user_onboarding")
      .update({
        [stepKey]: true,
        current_step: nextStep,
        onboarding_data: updatedData,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating onboarding:", error);
      return NextResponse.json(
        { error: "Failed to complete step" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: `Step ${step} completed successfully`,
      data,
    });
  } catch (error) {
    console.error("Unexpected error completing step:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
