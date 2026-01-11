/**
 * Synthex Localization - Translations History API
 * GET - List translations
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listTranslations } from "@/lib/synthex/localizationService";

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
    const tenantId = searchParams.get("tenantId");
    const sourceLang = searchParams.get("sourceLang") || undefined;
    const targetLang = searchParams.get("targetLang") || undefined;
    const status = searchParams.get("status") || undefined;
    const contentType = searchParams.get("contentType") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : undefined;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const translations = await listTranslations(tenantId, {
      sourceLang,
      targetLang,
      status,
      contentType,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      translations,
      count: translations.length,
    });
  } catch (error) {
    console.error("[Translations API] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to list translations",
      },
      { status: 500 }
    );
  }
}
