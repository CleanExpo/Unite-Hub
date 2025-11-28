/**
 * AI Consultation Messages API Route
 *
 * Get and add messages to a consultation.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { getAIConsultationService } from "@/lib/ai/consultationService";
import type { ExplanationMode } from "@/lib/strategy/strategyGenerator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/ai-consultations/[id] - Get consultation messages
 */
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const params = await context.params;
    const consultationId = params.id;

    const consultationService = getAIConsultationService();

    // Verify consultation exists
    const consultation = await consultationService.getById(consultationId);
    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    const messages = await consultationService.getMessages(consultationId);

    return NextResponse.json({ messages, consultation });
  } catch (error) {
    console.error("[API] GET /api/ai-consultations/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/ai-consultations/[id] - Send a message and get AI response
 */
export async function POST(req: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const params = await context.params;
    const consultationId = params.id;
    const body = await req.json();

    const content = body.content?.trim();
    if (!content) {
      return NextResponse.json(
        { error: "Message content is required" },
        { status: 400 }
      );
    }

    const explanation_mode = (body.explanation_mode || "founder") as ExplanationMode;

    const consultationService = getAIConsultationService();

    // Verify consultation exists and is active
    const consultation = await consultationService.getById(consultationId);
    if (!consultation) {
      return NextResponse.json(
        { error: "Consultation not found" },
        { status: 404 }
      );
    }

    if (consultation.status !== "active") {
      return NextResponse.json(
        { error: "Consultation is closed" },
        { status: 400 }
      );
    }

    // Process message and get AI response
    await consultationService.processMessage(
      consultationId,
      content,
      explanation_mode
    );

    // Return updated messages
    const messages = await consultationService.getMessages(consultationId);

    return NextResponse.json({ messages });
  } catch (error) {
    console.error("[API] POST /api/ai-consultations/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ai-consultations/[id] - Close consultation
 */
export async function PATCH(req: NextRequest, context: RouteContext) {
  try {
    // Authenticate
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const params = await context.params;
    const consultationId = params.id;
    const body = await req.json();

    const consultationService = getAIConsultationService();

    if (body.action === "close") {
      const consultation = await consultationService.close(consultationId);
      return NextResponse.json(consultation);
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[API] PATCH /api/ai-consultations/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
