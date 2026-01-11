/**
 * Synthex Personas API
 * GET - List personas
 * POST - Create persona
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listPersonas,
  createPersona,
  getPersonaStats,
} from "@/lib/synthex/personaService";

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
    const includeStats = searchParams.get("includeStats") === "true";

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    const filters = {
      status: searchParams.get("status") || undefined,
      is_primary: searchParams.get("is_primary") === "true" ? true : undefined,
      decision_role: searchParams.get("decision_role") || undefined,
      industries: searchParams.get("industries")?.split(",") || undefined,
      tags: searchParams.get("tags")?.split(",") || undefined,
      search: searchParams.get("search") || undefined,
    };

    const personas = await listPersonas(tenantId, filters);

    const response: {
      success: boolean;
      personas: typeof personas;
      stats?: Awaited<ReturnType<typeof getPersonaStats>>;
    } = {
      success: true,
      personas,
    };

    if (includeStats) {
      response.stats = await getPersonaStats(tenantId);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Personas API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to list personas" },
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
    const { tenantId, ...personaData } = body;

    if (!tenantId) {
      return NextResponse.json(
        { error: "tenantId is required" },
        { status: 400 }
      );
    }

    if (!personaData.name) {
      return NextResponse.json(
        { error: "name is required" },
        { status: 400 }
      );
    }

    const persona = await createPersona(tenantId, personaData, user.id);

    return NextResponse.json({
      success: true,
      persona,
    });
  } catch (error) {
    console.error("[Personas API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create persona" },
      { status: 500 }
    );
  }
}
