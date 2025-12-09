/**
 * Synthex Localization - Glossary Terms API
 * GET - List terms in glossary
 * POST - Add term to glossary
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  listGlossaryTerms,
  createGlossaryTerm,
  addTermTranslation,
  getGlossary,
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

    const { id: glossaryId } = await params;
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const approvedOnly = searchParams.get("approvedOnly") === "true";
    const limit = searchParams.get("limit")
      ? parseInt(searchParams.get("limit")!)
      : undefined;
    const offset = searchParams.get("offset")
      ? parseInt(searchParams.get("offset")!)
      : undefined;

    const terms = await listGlossaryTerms(glossaryId, {
      search,
      approvedOnly,
      limit,
      offset,
    });

    return NextResponse.json({
      success: true,
      terms,
      count: terms.length,
    });
  } catch (error) {
    console.error("[Glossary Terms API] GET error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list terms",
      },
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

    const { id: glossaryId } = await params;
    const body = await request.json();
    const {
      source_term,
      source_language,
      context,
      part_of_speech,
      notes,
      case_sensitive,
      do_not_translate,
      translations,
    } = body;

    if (!source_term) {
      return NextResponse.json(
        { error: "source_term is required" },
        { status: 400 }
      );
    }

    // Get glossary to get tenant_id
    const glossary = await getGlossary(glossaryId);
    if (!glossary) {
      return NextResponse.json(
        { error: "Glossary not found" },
        { status: 404 }
      );
    }

    // Create term
    const term = await createGlossaryTerm(
      glossary.tenant_id,
      glossaryId,
      {
        source_term,
        source_language,
        context,
        part_of_speech,
        notes,
        case_sensitive,
        do_not_translate,
      },
      user.id
    );

    // Add translations if provided
    if (translations && Array.isArray(translations)) {
      for (const trans of translations) {
        if (trans.target_language && trans.translation) {
          await addTermTranslation(glossary.tenant_id, term.id, {
            target_language: trans.target_language,
            translation: trans.translation,
            formal_translation: trans.formal_translation,
            informal_translation: trans.informal_translation,
          });
        }
      }
    }

    // Refetch term with translations
    const terms = await listGlossaryTerms(glossaryId, { limit: 1 });
    const termWithTranslations = terms.find((t) => t.id === term.id) || term;

    return NextResponse.json({
      success: true,
      term: termWithTranslations,
    });
  } catch (error) {
    console.error("[Glossary Terms API] POST error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create term",
      },
      { status: 500 }
    );
  }
}
