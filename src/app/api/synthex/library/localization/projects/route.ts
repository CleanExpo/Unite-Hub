/**
 * Synthex Localization - Projects API
 * GET - List projects
 * POST - Create project
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { listProjects, createProject } from "@/lib/synthex/localizationService";

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
    const status = searchParams.get("status") || undefined;
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const projects = await listProjects(tenantId, { status, limit });

    return NextResponse.json({
      success: true,
      projects,
      count: projects.length,
    });
  } catch (error) {
    console.error("[Projects API] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to list projects",
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
      target_languages,
      content_type,
      content_ids,
      glossary_id,
      default_formality,
      cultural_adaptation,
      due_date,
      tags,
      metadata,
    } = body;

    if (!tenantId || !name || !target_languages?.length) {
      return NextResponse.json(
        { error: "tenantId, name, and target_languages are required" },
        { status: 400 }
      );
    }

    const project = await createProject(
      tenantId,
      {
        name,
        description,
        source_language,
        target_languages,
        content_type,
        content_ids,
        glossary_id,
        default_formality,
        cultural_adaptation,
        due_date,
        tags,
        metadata,
      },
      user.id
    );

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error) {
    console.error("[Projects API] POST error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create project",
      },
      { status: 500 }
    );
  }
}
