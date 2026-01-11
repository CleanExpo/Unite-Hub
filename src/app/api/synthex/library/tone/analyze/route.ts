/**
 * Synthex Tone Analyze API
 * POST - Analyze content for tone characteristics
 * GET - List analysis history
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  analyzeContent,
  listAnalyses,
} from "@/lib/synthex/toneService";

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
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const analyses = await listAnalyses(tenantId, limit);

    return NextResponse.json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error("[Tone Analyze API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list analyses" },
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
    const { tenantId, content, contentType, contentId } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!content) {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const analysis = await analyzeContent(
      tenantId,
      content,
      contentType,
      contentId
    );

    return NextResponse.json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("[Tone Analyze API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to analyze content" },
      { status: 500 }
    );
  }
}
