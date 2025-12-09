/**
 * Signature Provider Service - Phase 9 Week 5-6
 *
 * Abstracted interface for e-signature providers (DocuSign, HelloSign).
 */

import { getSupabaseServer } from "@/lib/supabase";

// =============================================================
// Types
// =============================================================

export type SignatureProvider = "docusign" | "hellosign" | "manual";

export type SignatureStatus =
  | "DRAFT"
  | "SENT"
  | "DELIVERED"
  | "VIEWED"
  | "SIGNED"
  | "DECLINED"
  | "VOIDED"
  | "EXPIRED"
  | "FAILED";

export interface SignatureRequest {
  id: string;
  client_id: string;
  organization_id: string;
  trust_request_id: string;
  provider: SignatureProvider;
  provider_envelope_id?: string;
  provider_document_id?: string;
  document_type: string;
  signer_name: string;
  signer_email: string;
  status: SignatureStatus;
  sent_at?: string;
  signed_at?: string;
  signed_document_path?: string;
  created_at: string;
}

export interface CreateSignatureRequestOptions {
  client_id: string;
  organization_id: string;
  trust_request_id: string;
  signer_name: string;
  signer_email: string;
  provider?: SignatureProvider;
  document_type?: string;
  template_id?: string;
  redirect_url?: string;
  created_by: string;
}

export interface SignatureWebhookEvent {
  event_type: string;
  envelope_id: string;
  timestamp: string;
  signer_email?: string;
  signer_ip?: string;
  user_agent?: string;
  data?: Record<string, any>;
}

// =============================================================
// Provider Interface
// =============================================================

interface ISignatureProvider {
  createEnvelope(
    options: CreateSignatureRequestOptions
  ): Promise<{ envelope_id: string; signing_url?: string }>;

  getEnvelopeStatus(envelope_id: string): Promise<SignatureStatus>;

  voidEnvelope(envelope_id: string, reason: string): Promise<void>;

  downloadSignedDocument(envelope_id: string): Promise<Buffer>;
}

// =============================================================
// DocuSign Provider
// =============================================================

class DocuSignProvider implements ISignatureProvider {
  private apiKey: string;
  private accountId: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.DOCUSIGN_API_KEY || "";
    this.accountId = process.env.DOCUSIGN_ACCOUNT_ID || "";
    this.baseUrl = process.env.DOCUSIGN_BASE_URL || "https://demo.docusign.net/restapi";
  }

  async createEnvelope(
    options: CreateSignatureRequestOptions
  ): Promise<{ envelope_id: string; signing_url?: string }> {
    // In production, this would call DocuSign API
    // For now, return a mock envelope

    if (!this.apiKey) {
      throw new Error("DocuSign API key not configured");
    }

    // Mock implementation
    const envelope_id = `DS-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // In production:
    // const response = await fetch(`${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Bearer ${this.apiKey}`,
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     emailSubject: 'Unite-Hub Trusted Mode Agreement',
    //     documents: [...],
    //     recipients: {
    //       signers: [{
    //         email: options.signer_email,
    //         name: options.signer_name,
    //         recipientId: '1',
    //       }]
    //     },
    //     status: 'sent'
    //   })
    // });

    return {
      envelope_id,
      signing_url: `https://demo.docusign.net/Signing/?ti=${envelope_id}`,
    };
  }

  async getEnvelopeStatus(envelope_id: string): Promise<SignatureStatus> {
    // In production, call DocuSign API
    // const response = await fetch(`${this.baseUrl}/v2.1/accounts/${this.accountId}/envelopes/${envelope_id}`);

    // Mock: return SENT status
    return "SENT";
  }

  async voidEnvelope(envelope_id: string, reason: string): Promise<void> {
    // In production, call DocuSign API to void
    console.log(`Voiding DocuSign envelope ${envelope_id}: ${reason}`);
  }

  async downloadSignedDocument(envelope_id: string): Promise<Buffer> {
    // In production, download from DocuSign
    return Buffer.from("Signed document placeholder");
  }
}

// =============================================================
// HelloSign Provider
// =============================================================

class HelloSignProvider implements ISignatureProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.HELLOSIGN_API_KEY || "";
    this.baseUrl = "https://api.hellosign.com/v3";
  }

  async createEnvelope(
    options: CreateSignatureRequestOptions
  ): Promise<{ envelope_id: string; signing_url?: string }> {
    if (!this.apiKey) {
      throw new Error("HelloSign API key not configured");
    }

    // Mock implementation
    const envelope_id = `HS-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // In production:
    // const response = await fetch(`${this.baseUrl}/signature_request/send`, {
    //   method: 'POST',
    //   headers: {
    //     'Authorization': `Basic ${Buffer.from(this.apiKey + ':').toString('base64')}`,
    //   },
    //   body: formData
    // });

    return {
      envelope_id,
      signing_url: `https://app.hellosign.com/sign/${envelope_id}`,
    };
  }

  async getEnvelopeStatus(envelope_id: string): Promise<SignatureStatus> {
    return "SENT";
  }

  async voidEnvelope(envelope_id: string, reason: string): Promise<void> {
    console.log(`Canceling HelloSign request ${envelope_id}: ${reason}`);
  }

  async downloadSignedDocument(envelope_id: string): Promise<Buffer> {
    return Buffer.from("Signed document placeholder");
  }
}

// =============================================================
// Manual Provider (for testing/demo)
// =============================================================

class ManualProvider implements ISignatureProvider {
  async createEnvelope(
    options: CreateSignatureRequestOptions
  ): Promise<{ envelope_id: string; signing_url?: string }> {
    const envelope_id = `MANUAL-${Date.now()}`;
    return {
      envelope_id,
      signing_url: undefined, // Manual signatures don't have signing URLs
    };
  }

  async getEnvelopeStatus(envelope_id: string): Promise<SignatureStatus> {
    return "SENT";
  }

  async voidEnvelope(envelope_id: string, reason: string): Promise<void> {
    console.log(`Voiding manual request ${envelope_id}: ${reason}`);
  }

  async downloadSignedDocument(envelope_id: string): Promise<Buffer> {
    return Buffer.from("Manual signature document");
  }
}

// =============================================================
// Signature Service
// =============================================================

export class SignatureService {
  private providers: Map<SignatureProvider, ISignatureProvider>;

  constructor() {
    this.providers = new Map([
      ["docusign", new DocuSignProvider()],
      ["hellosign", new HelloSignProvider()],
      ["manual", new ManualProvider()],
    ]);
  }

  /**
   * Create a new signature request
   */
  async createSignatureRequest(
    options: CreateSignatureRequestOptions
  ): Promise<SignatureRequest> {
    const provider = options.provider || this.getDefaultProvider();
    const providerService = this.providers.get(provider);

    if (!providerService) {
      throw new Error(`Unknown signature provider: ${provider}`);
    }

    // Create envelope with provider
    const { envelope_id, signing_url } = await providerService.createEnvelope(options);

    // Store in database
    const supabase = await getSupabaseServer();
    const { data, error } = await supabase
      .from("signature_requests")
      .insert({
        client_id: options.client_id,
        organization_id: options.organization_id,
        trust_request_id: options.trust_request_id,
        provider,
        provider_envelope_id: envelope_id,
        document_type: options.document_type || "trusted_mode_agreement",
        template_id: options.template_id,
        signer_name: options.signer_name,
        signer_email: options.signer_email,
        status: "SENT",
        sent_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        created_by: options.created_by,
      })
      .select()
      .single();

    if (error) {
throw error;
}

    // Log audit event
    await this.logAuditEvent(options.client_id, options.organization_id, {
      action_type: "SIGNATURE_REQUESTED",
      actor_type: "HUMAN",
      actor_id: options.created_by,
      details: {
        provider,
        envelope_id,
        signer_email: options.signer_email,
        signing_url,
      },
    });

    return data;
  }

  /**
   * Handle webhook callback from signature provider
   */
  async handleWebhook(
    provider: SignatureProvider,
    event: SignatureWebhookEvent
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Find the signature request
    const { data: request, error: fetchError } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("provider", provider)
      .eq("provider_envelope_id", event.envelope_id)
      .single();

    if (fetchError || !request) {
      console.error(`Signature request not found for envelope ${event.envelope_id}`);
      return;
    }

    // Map event type to status
    const statusMap: Record<string, SignatureStatus> = {
      // DocuSign events
      "envelope-sent": "SENT",
      "envelope-delivered": "DELIVERED",
      "envelope-completed": "SIGNED",
      "envelope-declined": "DECLINED",
      "envelope-voided": "VOIDED",
      "recipient-viewed": "VIEWED",
      "recipient-signed": "SIGNED",
      // HelloSign events
      signature_request_sent: "SENT",
      signature_request_viewed: "VIEWED",
      signature_request_signed: "SIGNED",
      signature_request_declined: "DECLINED",
      signature_request_expired: "EXPIRED",
    };

    const newStatus = statusMap[event.event_type];
    if (!newStatus) {
      console.log(`Unknown webhook event: ${event.event_type}`);
      return;
    }

    // Update signature request
    const updateData: Record<string, any> = {
      status: newStatus,
      webhook_events: [...(request.webhook_events || []), event],
    };

    if (newStatus === "SIGNED") {
      updateData.signed_at = event.timestamp || new Date().toISOString();
      updateData.signature_ip = event.signer_ip;
      updateData.signature_user_agent = event.user_agent;

      // Update trusted mode request to ACTIVE
      await supabase
        .from("trusted_mode_requests")
        .update({
          status: "ACTIVE",
          signed_at: updateData.signed_at,
          signer_ip: event.signer_ip,
        })
        .eq("id", request.trust_request_id);
    }

    if (newStatus === "DELIVERED") {
      updateData.delivered_at = event.timestamp || new Date().toISOString();
    }

    if (newStatus === "VIEWED") {
      updateData.viewed_at = event.timestamp || new Date().toISOString();
    }

    if (newStatus === "DECLINED") {
      updateData.declined_at = event.timestamp || new Date().toISOString();

      // Update trusted mode request to REJECTED
      await supabase
        .from("trusted_mode_requests")
        .update({
          status: "REJECTED",
          rejected_reason: "Signature declined by signer",
        })
        .eq("id", request.trust_request_id);
    }

    await supabase
      .from("signature_requests")
      .update(updateData)
      .eq("id", request.id);

    // Log audit event
    await this.logAuditEvent(request.client_id, request.organization_id, {
      action_type: `SIGNATURE_${newStatus}`,
      actor_type: "SYSTEM",
      details: {
        provider,
        envelope_id: event.envelope_id,
        event_type: event.event_type,
        signer_email: event.signer_email,
      },
    });
  }

  /**
   * Complete signature manually (for manual provider or admin override)
   */
  async completeSignatureManually(
    requestId: string,
    signedBy: string,
    signatureIp?: string
  ): Promise<SignatureRequest> {
    const supabase = await getSupabaseServer();

    const { data: request, error: fetchError } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      throw new Error("Signature request not found");
    }

    const now = new Date().toISOString();

    // Update signature request
    const { data, error } = await supabase
      .from("signature_requests")
      .update({
        status: "SIGNED",
        signed_at: now,
        signature_ip: signatureIp,
      })
      .eq("id", requestId)
      .select()
      .single();

    if (error) {
throw error;
}

    // Update trusted mode request
    await supabase
      .from("trusted_mode_requests")
      .update({
        status: "ACTIVE",
        signed_at: now,
        signer_ip: signatureIp,
      })
      .eq("id", request.trust_request_id);

    // Log audit event
    await this.logAuditEvent(request.client_id, request.organization_id, {
      action_type: "SIGNATURE_COMPLETED_MANUAL",
      actor_type: "HUMAN",
      actor_id: signedBy,
      details: {
        request_id: requestId,
        signature_ip: signatureIp,
      },
    });

    return data;
  }

  /**
   * Void/cancel a signature request
   */
  async voidSignatureRequest(
    requestId: string,
    voidedBy: string,
    reason: string
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    const { data: request, error: fetchError } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      throw new Error("Signature request not found");
    }

    // Void with provider
    const providerService = this.providers.get(request.provider as SignatureProvider);
    if (providerService && request.provider_envelope_id) {
      await providerService.voidEnvelope(request.provider_envelope_id, reason);
    }

    // Update database
    await supabase
      .from("signature_requests")
      .update({
        status: "VOIDED",
        error_message: reason,
      })
      .eq("id", requestId);

    // Log audit event
    await this.logAuditEvent(request.client_id, request.organization_id, {
      action_type: "SIGNATURE_VOIDED",
      actor_type: "HUMAN",
      actor_id: voidedBy,
      details: {
        request_id: requestId,
        reason,
      },
    });
  }

  /**
   * Get signature request status
   */
  async getSignatureRequest(requestId: string): Promise<SignatureRequest | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (error) {
return null;
}
    return data;
  }

  /**
   * Get signature requests for a client
   */
  async getClientSignatureRequests(clientId: string): Promise<SignatureRequest[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });

    if (error) {
return [];
}
    return data;
  }

  /**
   * Resend signature request
   */
  async resendSignatureRequest(requestId: string, resentBy: string): Promise<void> {
    const supabase = await getSupabaseServer();

    const { data: request, error: fetchError } = await supabase
      .from("signature_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchError || !request) {
      throw new Error("Signature request not found");
    }

    // Increment retry count
    await supabase
      .from("signature_requests")
      .update({
        retry_count: (request.retry_count || 0) + 1,
        sent_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    // In production, trigger resend with provider API

    // Log audit event
    await this.logAuditEvent(request.client_id, request.organization_id, {
      action_type: "SIGNATURE_RESENT",
      actor_type: "HUMAN",
      actor_id: resentBy,
      details: {
        request_id: requestId,
        retry_count: (request.retry_count || 0) + 1,
      },
    });
  }

  /**
   * Get default signature provider
   */
  private getDefaultProvider(): SignatureProvider {
    if (process.env.DOCUSIGN_API_KEY) {
return "docusign";
}
    if (process.env.HELLOSIGN_API_KEY) {
return "hellosign";
}
    return "manual";
  }

  /**
   * Log audit event
   */
  private async logAuditEvent(
    clientId: string,
    organizationId: string,
    event: {
      action_type: string;
      actor_type: "SYSTEM" | "HUMAN";
      actor_id?: string;
      details?: Record<string, any>;
    }
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    await supabase.from("autonomy_audit_log").insert({
      client_id: clientId,
      organization_id: organizationId,
      action_type: event.action_type,
      source: "SignatureService",
      actor_type: event.actor_type,
      actor_id: event.actor_id,
      details: event.details || {},
      timestamp_utc: new Date().toISOString(),
    });
  }
}

export const signatureService = new SignatureService();
