/**
 * Synthex Persona Content Mapping API
 * GET - Get content mapped to persona
 * POST - Map content or generate recommendations
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPersona,
  listPersonaContent,
  mapContentToPersona,
  generateContentRecommendations,
} from "@/lib/synthex/personaService";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const journeyStage = searchParams.get("journeyStage") || undefined;

    const content = await listPersonaContent(id, journeyStage);

    return NextResponse.json({
      success: true,
      content,
    });
  } catch (error) {
    console.error("[Persona Content API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get content" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const persona = await getPersona(id);
    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    // Generate AI recommendations
    if (body.generateRecommendations) {
      const recommendations = await generateContentRecommendations(
        persona.tenant_id,
        id
      );
      return NextResponse.json({
        success: true,
        recommendations,
      });
    }

    // Map specific content
    if (!body.content_title || !body.content_type) {
      return NextResponse.json(
        { error: "content_title and content_type are required" },
        { status: 400 }
      );
    }

    const mapped = await mapContentToPersona(persona.tenant_id, id, body);

    return NextResponse.json({
      success: true,
      content: mapped,
    });
  } catch (error) {
    console.error("[Persona Content API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to map content" },
      { status: 500 }
    );
  }
}
