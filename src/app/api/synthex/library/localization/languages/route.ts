/**
 * Synthex Localization - Languages API
 * GET - List supported languages
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listLanguages, getLanguage } from "@/lib/synthex/localizationService";

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
    const code = searchParams.get("code");
    const activeOnly = searchParams.get("activeOnly") !== "false";

    // Get specific language
    if (code) {
      const language = await getLanguage(code);
      if (!language) {
        return NextResponse.json(
          { error: "Language not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({
        success: true,
        language,
      });
    }

    // List all languages
    const languages = await listLanguages(activeOnly);

    return NextResponse.json({
      success: true,
      languages,
      count: languages.length,
    });
  } catch (error) {
    console.error("[Languages API] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get languages",
      },
      { status: 500 }
    );
  }
}
