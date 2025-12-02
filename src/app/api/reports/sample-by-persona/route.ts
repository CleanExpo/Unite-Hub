import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Session validation
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const persona = searchParams.get("persona");
    const tier = searchParams.get("tier");

    if (!persona || !tier) {
      return NextResponse.json(
        { error: "Missing persona or tier parameter" },
        { status: 400 }
      );
    }

    // Return sample report data
    return NextResponse.json({
      persona,
      tier,
      message: "Sample report endpoint - integration coming soon",
    });
  } catch (error) {
    console.error("[SampleReport] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate sample report" },
      { status: 500 }
    );
  }
}
