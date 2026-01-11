/**
 * Synthex Persona by ID API
 * GET - Get persona
 * PUT - Update persona
 * DELETE - Delete persona
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getPersona,
  updatePersona,
  deletePersona,
  duplicatePersona,
  setPrimaryPersona,
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
    const persona = await getPersona(id);

    if (!persona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      persona,
    });
  } catch (error) {
    console.error("[Persona API] GET error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get persona" },
      { status: 500 }
    );
  }
}

export async function PUT(
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
    const { action, ...updateData } = body;

    // Handle special actions
    if (action === "duplicate") {
      const newName = updateData.newName || `${updateData.name || "Persona"} (Copy)`;
      const duplicated = await duplicatePersona(id, newName, user.id);
      return NextResponse.json({
        success: true,
        persona: duplicated,
      });
    }

    if (action === "set_primary") {
      const persona = await getPersona(id);
      if (!persona) {
        return NextResponse.json({ error: "Persona not found" }, { status: 404 });
      }
      await setPrimaryPersona(persona.tenant_id, id);
      const updated = await getPersona(id);
      return NextResponse.json({
        success: true,
        persona: updated,
      });
    }

    const persona = await updatePersona(id, updateData);

    return NextResponse.json({
      success: true,
      persona,
    });
  } catch (error) {
    console.error("[Persona API] PUT error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update persona" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await deletePersona(id);

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error("[Persona API] DELETE error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete persona" },
      { status: 500 }
    );
  }
}
