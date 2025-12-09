/**
 * Synthex Persona Insights API
 * GET - Get insights for persona
 * POST - Generate new insights
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPersona,
  getPersonaInsights,
  generatePersonaInsights,
  updateInsightStatus,
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
    const status = searchParams.get("status") || undefined;

    const insights = await getPersonaInsights(id, status);

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error("[Persona Insights API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get insights" },
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

    // Check if updating existing insight status
    if (body.insightId && body.status) {
      await updateInsightStatus(body.insightId, body.status, user.id);
      return NextResponse.json({
        success: true,
        updated: true,
      });
    }

    // Generate new insights
    const persona = await getPersona(id);
    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    const insights = await generatePersonaInsights(persona.tenant_id, id);

    return NextResponse.json({
      success: true,
      insights,
    });
  } catch (error) {
    console.error("[Persona Insights API] POST error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate insights" },
      { status: 500 }
    );
  }
}
