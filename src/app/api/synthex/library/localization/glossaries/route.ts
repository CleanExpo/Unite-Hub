/**
 * Synthex Localization - Glossaries API
 * GET - List glossaries
 * POST - Create glossary
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listGlossaries,
  createGlossary,
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
    const brandId = searchParams.get("brandId") || undefined;
    const activeOnly = searchParams.get("activeOnly") !== "false";
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const glossaries = await listGlossaries(tenantId, {
      brandId,
      activeOnly,
      limit,
    });

    return NextResponse.json({
      success: true,
      glossaries,
      count: glossaries.length,
    });
  } catch (error) {
    console.error("[Glossaries API] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list glossaries",
      },
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
      name,
      description,
      source_language,
      brand_id,
      priority,
      tags,
      metadata,
    } = body;

    if (!tenantId || !name) {
      return NextResponse.json(
        { error: "tenantId and name are required" },
        { status: 400 }
      );
    }

    const glossary = await createGlossary(
      tenantId,
      {
        name,
        description,
        source_language,
        brand_id,
        priority,
        tags,
        metadata,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      glossary,
    });
  } catch (error) {
    console.error("[Glossaries API] POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create glossary",
      },
      { status: 500 }
    );
  }
}
