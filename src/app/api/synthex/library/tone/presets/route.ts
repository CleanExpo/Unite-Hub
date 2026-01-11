/**
 * Synthex Tone Presets API
 * GET - List available tone presets
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listPresets } from "@/lib/synthex/toneService";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const presets = await listPresets(category || undefined);

    return NextResponse.json({
      success: true,
      presets,
    });
  } catch (error) {
    console.error("[Tone Presets API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list presets" },
      { status: 500 }
    );
  }
}
