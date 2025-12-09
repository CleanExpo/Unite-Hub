/**
 * Synthex Localization - Single Translation API
 * GET - Get translation
 * PUT - Review/edit translation
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getTranslation,
  reviewTranslation,
  editTranslation,
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
    const translation = await getTranslation(id);

    if (!translation) {
      return NextResponse.json(
        { error: "Translation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      translation,
    });
  } catch (error) {
    console.error("[Translation API] GET error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to get translation",
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
    const { action, status, notes, editedContent } = body;

    let translation;

    if (action === "review" && status) {
      if (status !== "approved" && status !== "rejected") {
        return NextResponse.json(
          { error: "status must be 'approved' or 'rejected'" },
          { status: 400 }
        );
      }
      translation = await reviewTranslation(id, status, user.id, notes);
    } else if (action === "edit" && editedContent) {
      translation = await editTranslation(id, editedContent, user.id);
    } else {
      return NextResponse.json(
        {
          error:
            "Must specify action='review' with status or action='edit' with editedContent",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      translation,
    });
  } catch (error) {
    console.error("[Translation API] PUT error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update translation",
      },
      { status: 500 }
    );
  }
}
