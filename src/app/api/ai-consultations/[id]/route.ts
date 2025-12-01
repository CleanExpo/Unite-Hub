/**
 * AI Consultation Messages API Route
 *
 * Get and add messages to a consultation.
 */

 
import { NextRequest } from "next/server";
import { withErrorBoundary, successResponse } from "@/lib/errors/boundaries";
import { getSupabaseServer, supabaseBrowser } from "@/lib/supabase";
import { getAIConsultationService } from "@/lib/ai/consultationService";
import { AuthenticationError, NotFoundError, ValidationError } from "@/core/errors/app-error";
import type { ExplanationMode } from "@/lib/strategy/strategyGenerator";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Validate authentication from Bearer token or server session
 */
async function validateAuth(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (token) {
    const { data, error } = await supabaseBrowser.auth.getUser(token);
    if (error || !data.user) {
      throw new AuthenticationError();
    }
    return data.user;
  }

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    throw new AuthenticationError();
  }
  return data.user;
}

/**
 * GET /api/ai-consultations/[id] - Get consultation messages
 */
export const GET = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  await validateAuth(req);

  const params = await context.params;
  const consultationId = params.id;

  const consultationService = getAIConsultationService();

  // Verify consultation exists
  const consultation = await consultationService.getById(consultationId);
  if (!consultation) {
    throw new NotFoundError("Consultation", consultationId);
  }

  const messages = await consultationService.getMessages(consultationId);

  return successResponse({ messages, consultation });
});

/**
 * POST /api/ai-consultations/[id] - Send a message and get AI response
 */
export const POST = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  await validateAuth(req);

  const params = await context.params;
  const consultationId = params.id;
  const body = await req.json();

  const content = body.content?.trim();
  if (!content) {
    throw new ValidationError([{ field: "content", message: "Message content is required" }]);
  }

  const explanationMode = (body.explanation_mode || "founder") as ExplanationMode;

  const consultationService = getAIConsultationService();

  // Verify consultation exists and is active
  const consultation = await consultationService.getById(consultationId);
  if (!consultation) {
    throw new NotFoundError("Consultation", consultationId);
  }

  if (consultation.status !== "active") {
    throw new ValidationError([{ field: "status", message: "Consultation is closed" }]);
  }

  // Process message and get AI response
  await consultationService.processMessage(
    consultationId,
    content,
    explanationMode
  );

  // Return updated messages
  const messages = await consultationService.getMessages(consultationId);

  return successResponse({ messages });
});

/**
 * PATCH /api/ai-consultations/[id] - Close consultation
 */
export const PATCH = withErrorBoundary(async (req: NextRequest, context: RouteContext) => {
  await validateAuth(req);

  const params = await context.params;
  const consultationId = params.id;
  const body = await req.json();

  const consultationService = getAIConsultationService();

  if (body.action === "close") {
    const consultation = await consultationService.close(consultationId);
    return successResponse(consultation);
  }

  throw new ValidationError([{ field: "action", message: "Invalid action" }]);
});
