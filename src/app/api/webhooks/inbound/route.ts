/**
 * POST /api/webhooks/inbound
 * Generic webhook receiver for form submissions, booking tools,
 * automation platforms (Zapier, Make), and external services.
 *
 * Supports:
 * - Form submissions (Typeform, Jotform, Webflow, WordPress)
 * - Booking confirmations (Calendly, Acuity)
 * - Automation triggers (Zapier, Make, n8n)
 * - Custom webhooks from client websites
 *
 * Security: HMAC signature verification (optional), workspace-scoped.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import crypto from "crypto";

interface WebhookPayload {
  source: string;
  event_type: string;
  workspace_id?: string;
  data: Record<string, unknown>;
  timestamp?: string;
}

const SUPPORTED_SOURCES = [
  "typeform",
  "jotform",
  "webflow",
  "wordpress",
  "calendly",
  "acuity",
  "zapier",
  "make",
  "n8n",
  "ifttt",
  "custom",
] as const;

export async function POST(req: NextRequest) {
  try {
    // Extract workspace ID from query params or headers
    const workspaceId =
      req.nextUrl.searchParams.get("workspace_id") ||
      req.headers.get("x-workspace-id");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspace_id is required (query param or x-workspace-id header)" },
        { status: 400 }
      );
    }

    // Optional HMAC signature verification
    const signature = req.headers.get("x-webhook-signature");
    const rawBody = await req.text();

    if (signature) {
      const isValid = await verifySignature(workspaceId, rawBody, signature);
      if (!isValid) {
        return NextResponse.json(
          { error: "Invalid webhook signature" },
          { status: 401 }
        );
      }
    }

    // Parse body
    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 }
      );
    }

    // Determine source from header, body, or query param
    const source =
      req.headers.get("x-webhook-source") ||
      req.nextUrl.searchParams.get("source") ||
      detectSource(body, req.headers) ||
      "custom";

    // Determine event type
    const eventType =
      (body.event_type as string) ||
      (body.event as string) ||
      req.headers.get("x-webhook-event") ||
      req.nextUrl.searchParams.get("event") ||
      "webhook.received";

    // Build normalized payload
    const payload: WebhookPayload = {
      source,
      event_type: eventType,
      workspace_id: workspaceId,
      data: body,
      timestamp: new Date().toISOString(),
    };

    // Store webhook event
    const supabase = await getSupabaseServer();
    const { data: webhookEvent, error: insertError } = await supabase
      .from("webhook_events")
      .insert({
        workspace_id: workspaceId,
        source: payload.source,
        event_type: payload.event_type,
        payload: payload.data,
        status: "received",
        received_at: payload.timestamp,
      })
      .select("id")
      .single();

    if (insertError) {
      // If table doesn't exist yet, log and return success (graceful degradation)
      console.warn(
        "webhook_events table may not exist yet:",
        insertError.message
      );

      // Still process the webhook even without persistence
      const result = await processWebhook(
        supabase,
        payload,
        workspaceId,
        null
      );

      return NextResponse.json({
        success: true,
        received: true,
        source: payload.source,
        event_type: payload.event_type,
        processed: result.processed,
        actions: result.actions,
        warning: "Webhook processed but not persisted (table pending migration)",
      });
    }

    // Process the webhook
    const result = await processWebhook(
      supabase,
      payload,
      workspaceId,
      webhookEvent?.id || null
    );

    // Update webhook event status
    if (webhookEvent?.id) {
      await supabase
        .from("webhook_events")
        .update({
          status: result.processed ? "processed" : "failed",
          processed_at: new Date().toISOString(),
          processing_result: result,
        })
        .eq("id", webhookEvent.id);
    }

    return NextResponse.json({
      success: true,
      received: true,
      webhook_id: webhookEvent?.id,
      source: payload.source,
      event_type: payload.event_type,
      processed: result.processed,
      actions: result.actions,
    });
  } catch (error) {
    console.error("Error in POST /api/webhooks/inbound:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Detect webhook source from payload shape and headers
 */
function detectSource(
  body: Record<string, unknown>,
  headers: Headers
): string | null {
  // Typeform
  if (body.form_id && body.event_id) return "typeform";

  // Calendly
  if (body.event === "invitee.created" || body.event === "invitee.canceled")
    return "calendly";

  // Zapier
  const userAgent = headers.get("user-agent") || "";
  if (userAgent.includes("Zapier")) return "zapier";

  // Make (Integromat)
  if (userAgent.includes("Make") || userAgent.includes("Integromat"))
    return "make";

  // Jotform
  if (body.formID && body.submissionID) return "jotform";

  // Webflow
  if (headers.get("x-webflow-signature")) return "webflow";

  return null;
}

/**
 * Verify HMAC signature for secure webhooks
 */
async function verifySignature(
  workspaceId: string,
  rawBody: string,
  signature: string
): Promise<boolean> {
  try {
    // Fetch webhook secret from workspace settings
    const supabase = await getSupabaseServer();
    const { data: settings } = await supabase
      .from("workspace_settings")
      .select("webhook_secret")
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (!settings?.webhook_secret) {
      // No secret configured — allow unsigned webhooks
      return true;
    }

    const expectedSignature = crypto
      .createHmac("sha256", settings.webhook_secret)
      .update(rawBody)
      .digest("hex");

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Process webhook based on source and event type
 */
async function processWebhook(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  payload: WebhookPayload,
  workspaceId: string,
  webhookEventId: string | null
): Promise<{ processed: boolean; actions: string[] }> {
  const actions: string[] = [];

  try {
    switch (payload.source) {
      case "typeform":
      case "jotform":
      case "webflow":
      case "wordpress":
      case "custom":
        // Form submission → create or update contact
        const contactResult = await processFormSubmission(
          supabase,
          payload.data,
          workspaceId
        );
        if (contactResult) {
          actions.push(`contact_created:${contactResult.id}`);
        }
        break;

      case "calendly":
      case "acuity":
        // Booking event → create activity + update contact
        const bookingResult = await processBookingEvent(
          supabase,
          payload.data,
          workspaceId
        );
        if (bookingResult) {
          actions.push(`booking_processed:${bookingResult.type}`);
        }
        break;

      case "zapier":
      case "make":
      case "n8n":
      case "ifttt":
        // Automation platform → route based on event_type
        actions.push(`automation_received:${payload.event_type}`);
        break;

      default:
        actions.push("webhook_received");
    }

    return { processed: true, actions };
  } catch (error) {
    console.error("Webhook processing error:", error);
    return { processed: false, actions: [`error:${(error as Error).message}`] };
  }
}

/**
 * Process form submission → create/update contact in CRM
 */
async function processFormSubmission(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  data: Record<string, unknown>,
  workspaceId: string
): Promise<{ id: string } | null> {
  // Extract contact info from various form formats
  const email =
    (data.email as string) ||
    (data.Email as string) ||
    extractFromFields(data, ["email", "e-mail", "email_address"]);

  if (!email) return null;

  const name =
    (data.name as string) ||
    (data.Name as string) ||
    extractFromFields(data, ["name", "full_name", "fullName"]);

  const phone =
    (data.phone as string) ||
    (data.Phone as string) ||
    extractFromFields(data, ["phone", "telephone", "mobile"]);

  const company =
    (data.company as string) ||
    (data.Company as string) ||
    extractFromFields(data, ["company", "organization", "business"]);

  // Upsert contact
  const { data: contact, error } = await supabase
    .from("contacts")
    .upsert(
      {
        workspace_id: workspaceId,
        email,
        name: name || email.split("@")[0],
        phone: phone || null,
        company: company || null,
        source: "webhook_form",
        status: "lead",
        ai_score: 50, // Default score for new form leads
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,email" }
    )
    .select("id")
    .single();

  if (error) {
    console.error("Contact upsert error:", error.message);
    return null;
  }

  return contact;
}

/**
 * Process booking event (Calendly, Acuity)
 */
async function processBookingEvent(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  data: Record<string, unknown>,
  workspaceId: string
): Promise<{ type: string } | null> {
  // Calendly format
  const event = (data.event as string) || "";
  const invitee = data.payload
    ? (data.payload as Record<string, unknown>)
    : data;

  const email =
    (invitee.email as string) ||
    ((invitee.invitee as Record<string, unknown>)?.email as string);

  if (!email) return null;

  // Ensure contact exists
  await processFormSubmission(supabase, { email, ...invitee }, workspaceId);

  return { type: event || "booking_received" };
}

/**
 * Extract value from nested form field structures
 */
function extractFromFields(
  data: Record<string, unknown>,
  fieldNames: string[]
): string | null {
  // Check top-level keys
  for (const field of fieldNames) {
    if (data[field] && typeof data[field] === "string") {
      return data[field] as string;
    }
  }

  // Check nested 'fields' or 'answers' arrays (Typeform, Jotform)
  const fields = (data.fields || data.answers || data.form_response) as
    | Array<Record<string, unknown>>
    | undefined;

  if (Array.isArray(fields)) {
    for (const field of fields) {
      const label = (
        (field.label as string) ||
        (field.title as string) ||
        ""
      ).toLowerCase();
      for (const name of fieldNames) {
        if (label.includes(name)) {
          return (
            (field.value as string) ||
            (field.answer as string) ||
            (field.text as string) ||
            null
          );
        }
      }
    }
  }

  return null;
}
