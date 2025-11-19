/**
 * Signature Callback API - Phase 9 Week 5-6
 *
 * POST /api/trust/signature/callback
 * Handle webhook callbacks from DocuSign/HelloSign.
 */

import { NextRequest, NextResponse } from "next/server";
import { SignatureService, SignatureWebhookEvent } from "@/lib/trust/signatureProvider";
import crypto from "crypto";

// Verify webhook signature for security
function verifyDocuSignWebhook(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("base64");
  return signature === digest;
}

function verifyHelloSignWebhook(
  payload: string,
  signature: string,
  apiKey: string
): boolean {
  const hmac = crypto.createHmac("sha256", apiKey);
  const digest = hmac.update(payload).digest("hex");
  return signature === digest;
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);

    // Determine provider from request
    const docusignSignature = req.headers.get("x-docusign-signature-1");
    const hellosignSignature = req.headers.get("x-hellosign-signature");

    let provider: "docusign" | "hellosign";
    let event: SignatureWebhookEvent;

    if (docusignSignature) {
      // DocuSign webhook
      provider = "docusign";

      // Verify signature in production
      const webhookSecret = process.env.DOCUSIGN_WEBHOOK_SECRET;
      if (webhookSecret && !verifyDocuSignWebhook(rawBody, docusignSignature, webhookSecret)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      // Parse DocuSign event
      event = {
        event_type: body.event || body.envelopeEventStatusCode,
        envelope_id: body.envelopeId || body.data?.envelopeId,
        timestamp: body.generatedDateTime || new Date().toISOString(),
        signer_email: body.recipientEmail || body.data?.recipientEmail,
        signer_ip: body.clientIPAddress,
        user_agent: body.userAgent,
        data: body,
      };
    } else if (hellosignSignature) {
      // HelloSign webhook
      provider = "hellosign";

      // Verify signature in production
      const apiKey = process.env.HELLOSIGN_API_KEY;
      if (apiKey && !verifyHelloSignWebhook(rawBody, hellosignSignature, apiKey)) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }

      // Parse HelloSign event
      const signatureRequest = body.signature_request || {};
      event = {
        event_type: body.event?.event_type,
        envelope_id: signatureRequest.signature_request_id,
        timestamp: body.event?.event_time
          ? new Date(body.event.event_time * 1000).toISOString()
          : new Date().toISOString(),
        signer_email: signatureRequest.signatures?.[0]?.signer_email_address,
        data: body,
      };
    } else {
      // Manual callback for testing
      provider = body.provider || "manual";
      event = {
        event_type: body.event_type,
        envelope_id: body.envelope_id,
        timestamp: body.timestamp || new Date().toISOString(),
        signer_email: body.signer_email,
        signer_ip: body.signer_ip,
        data: body,
      };
    }

    // Process webhook event
    const signatureService = new SignatureService();
    await signatureService.handleWebhook(provider, event);

    // Return success
    // DocuSign expects 200, HelloSign expects "Hello API Event Received"
    if (provider === "hellosign") {
      return new NextResponse("Hello API Event Received", { status: 200 });
    }

    return NextResponse.json({
      status: "received",
      event_type: event.event_type,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Signature callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/trust/signature/callback
 * HelloSign requires GET for webhook verification
 */
export async function GET(req: NextRequest) {
  // HelloSign webhook verification
  return new NextResponse("Hello API Event Received", { status: 200 });
}
