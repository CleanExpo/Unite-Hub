/**
 * AI Consultations API Route
 *
 * Create and list AI consultation sessions.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { getAIConsultationService } from "@/lib/ai/consultationService";
import type { ConsultationCreateInput } from "@/lib/ai/consultationTypes";

/**
 * GET /api/ai-consultations - List consultations
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const { searchParams } = new URL(req.url);
    const business_id = searchParams.get("business_id");
    const status = searchParams.get("status");

    const consultationService = getAIConsultationService();

    const consultations = await consultationService.list({
      business_id: business_id || undefined,
      created_by: userId || undefined,
      status: status as any || undefined,
    });

    return NextResponse.json(consultations);
  } catch (error) {
    console.error("[API] GET /api/ai-consultations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-consultations - Create a new consultation
 */
export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string | null = null;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      userId = data.user.id;
    }

    const body = await req.json();

    if (!body.business_id) {
      return NextResponse.json(
        { error: "Missing required field: business_id" },
        { status: 400 }
      );
    }

    const consultationService = getAIConsultationService();

    const input: ConsultationCreateInput = {
      business_id: body.business_id,
      client_id: body.client_id || null,
      created_by: userId,
      context: body.context || null,
      explanation_mode: body.explanation_mode || "founder",
      title: body.title || null,
    };

    const consultation = await consultationService.create(input);

    return NextResponse.json(consultation, { status: 201 });
  } catch (error) {
    console.error("[API] POST /api/ai-consultations error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
