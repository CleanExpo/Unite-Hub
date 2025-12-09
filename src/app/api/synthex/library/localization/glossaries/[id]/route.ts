/**
 * Synthex Localization - Single Glossary API
 * GET - Get glossary
 * PUT - Update glossary
 * DELETE - Delete glossary
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getGlossary,
  updateGlossary,
  deleteGlossary,
} from "@/lib/synthex/localizationService";

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
    const glossary = await getGlossary(id);

    if (!glossary) {
      return NextResponse.json(
        { error: "Glossary not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      glossary,
    });
  } catch (error) {
    console.error("[Glossary API] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get glossary",
      },
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

    const glossary = await updateGlossary(id, body);

    return NextResponse.json({
      success: true,
      glossary,
    });
  } catch (error) {
    console.error("[Glossary API] PUT error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update glossary",
      },
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
    await deleteGlossary(id);

    return NextResponse.json({
      success: true,
      deleted: true,
    });
  } catch (error) {
    console.error("[Glossary API] DELETE error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete glossary",
      },
      { status: 500 }
    );
  }
}
