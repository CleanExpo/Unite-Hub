/**
 * Synthex Localization API - Main Translation Endpoint
 * POST - Translate content
 * GET - Get localization stats
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  translateContent,
  translateBatch,
  getLocalizationStats,
} from "@/lib/synthex/localizationService";

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

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const stats = await getLocalizationStats(tenantId);

    return NextResponse.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("[Localization API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get stats" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      tenantId,
      content,
      items,
      sourceLang,
      targetLang,
      formality,
      preserveFormatting,
      culturalAdaptation,
      glossaryId,
      contentType,
      contentId,
    } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!targetLang) {
      return NextResponse.json(
        { error: "targetLang is required" },
        { status: 400 }
      );
    }

    // Batch translation
    if (items && Array.isArray(items)) {
      const translations = await translateBatch(
        tenantId,
        items,
        sourceLang || "en",
        targetLang,
        {
          formality,
          preserveFormatting,
          culturalAdaptation,
          glossaryId,
        },
        user.id
      );

      return NextResponse.json({
        success: true,
        translations,
        count: translations.length,
      });
    }

    // Single translation
    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const translation = await translateContent(
      tenantId,
      content,
      sourceLang || "en",
      targetLang,
      {
        formality,
        preserveFormatting,
        culturalAdaptation,
        glossaryId,
        contentType,
        contentId,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      translation,
    });
  } catch (error) {
    console.error("[Localization API] POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to translate content",
      },
      { status: 500 }
    );
  }
}
