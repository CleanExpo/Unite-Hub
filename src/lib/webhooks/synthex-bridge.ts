/**
 * Synthex Bridge - Webhook Communication Layer
 *
 * Handles bidirectional communication between Unite-Hub (CRM) and Synthex (AI Agency).
 * Uses HMAC signature verification for security.
 */

import crypto from 'crypto';

// ============================================================================
// Types
// ============================================================================

export type SynthexEventType =
  | 'project.created'
  | 'project.status_update'
  | 'project.completed'
  | 'campaign.launched'
  | 'campaign.completed'
  | 'content.generated'
  | 'video.generated'
  | 'analytics.report';

export type UniteHubEventType =
  | 'contact.created'
  | 'contact.updated'
  | 'contact.deleted'
  | 'workspace.created'
  | 'workspace.updated'
  | 'billing.subscription_changed'
  | 'billing.payment_received';

export interface SynthexWebhookPayload {
  event: SynthexEventType;
  project_id?: string;
  workspace_id: string;
  status?: string;
  data?: Record<string, unknown>;
  metrics?: {
    videos_generated?: number;
    content_pieces?: number;
    campaigns_active?: number;
    [key: string]: unknown;
  };
  timestamp: string;
  signature: string;
}

export interface UniteHubWebhookPayload {
  event: UniteHubEventType;
  workspace_id: string;
  contact_id?: string;
  data?: Record<string, unknown>;
  timestamp: string;
}

export interface WebhookResult {
  success: boolean;
  message: string;
  event_id?: string;
  error?: string;
}

// ============================================================================
// Signature Verification
// ============================================================================

const SYNTHEX_WEBHOOK_SECRET = process.env.SYNTHEX_WEBHOOK_SECRET || '';

/**
 * Generate HMAC signature for payload verification
 */
export function generateSignature(payload: string, secret: string): string {
  return crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
}

/**
 * Verify incoming webhook signature
 */
export function verifySignature(
  payload: string,
  signature: string,
  secret: string = SYNTHEX_WEBHOOK_SECRET
): boolean {
  if (!secret) {
    console.warn('[SynthexBridge] No webhook secret configured');
    return false;
  }

  const expectedSignature = generateSignature(payload, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// ============================================================================
// Event Handlers
// ============================================================================

type EventHandler = (payload: SynthexWebhookPayload) => Promise<WebhookResult>;

const eventHandlers: Partial<Record<SynthexEventType, EventHandler>> = {
  'project.created': async (payload) => {
    console.log(`[SynthexBridge] Project created: ${payload.project_id}`);
    // TODO: Create project reference in Unite-Hub
    return { success: true, message: 'Project registered' };
  },

  'project.status_update': async (payload) => {
    console.log(`[SynthexBridge] Project ${payload.project_id} status: ${payload.status}`);
    // TODO: Update project status in Unite-Hub dashboard
    return { success: true, message: 'Status updated' };
  },

  'project.completed': async (payload) => {
    console.log(`[SynthexBridge] Project ${payload.project_id} completed`);
    // TODO: Mark project complete, trigger notifications
    return { success: true, message: 'Project marked complete' };
  },

  'campaign.launched': async (payload) => {
    console.log(`[SynthexBridge] Campaign launched in workspace ${payload.workspace_id}`);
    // TODO: Log campaign activity
    return { success: true, message: 'Campaign logged' };
  },

  'content.generated': async (payload) => {
    console.log(`[SynthexBridge] Content generated: ${JSON.stringify(payload.metrics)}`);
    // TODO: Update content metrics in Founder OS
    return { success: true, message: 'Content metrics updated' };
  },

  'video.generated': async (payload) => {
    console.log(`[SynthexBridge] Video generated: ${JSON.stringify(payload.metrics)}`);
    // TODO: Update video generation metrics
    return { success: true, message: 'Video metrics updated' };
  },

  'analytics.report': async (payload) => {
    console.log(`[SynthexBridge] Analytics report received`);
    // TODO: Store analytics data for Founder OS
    return { success: true, message: 'Analytics stored' };
  },
};

/**
 * Process incoming Synthex webhook event
 */
export async function processSynthexEvent(
  payload: SynthexWebhookPayload
): Promise<WebhookResult> {
  const handler = eventHandlers[payload.event];

  if (!handler) {
    return {
      success: false,
      message: `Unknown event type: ${payload.event}`,
      error: 'UNKNOWN_EVENT',
    };
  }

  try {
    return await handler(payload);
  } catch (error) {
    console.error(`[SynthexBridge] Error processing ${payload.event}:`, error);
    return {
      success: false,
      message: 'Event processing failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Outbound Webhooks (Unite-Hub → Synthex)
// ============================================================================

const SYNTHEX_API_URL = process.env.SYNTHEX_API_URL || '';
const UNITE_HUB_WEBHOOK_SECRET = process.env.UNITE_HUB_WEBHOOK_SECRET || '';

/**
 * Send webhook to Synthex
 */
export async function sendToSynthex(
  event: UniteHubEventType,
  data: Record<string, unknown>,
  workspaceId: string
): Promise<WebhookResult> {
  if (!SYNTHEX_API_URL) {
    console.warn('[SynthexBridge] SYNTHEX_API_URL not configured');
    return { success: false, message: 'Synthex URL not configured', error: 'NO_URL' };
  }

  const payload: UniteHubWebhookPayload = {
    event,
    workspace_id: workspaceId,
    data,
    timestamp: new Date().toISOString(),
  };

  const payloadString = JSON.stringify(payload);
  const signature = generateSignature(payloadString, UNITE_HUB_WEBHOOK_SECRET);

  try {
    const response = await fetch(`${SYNTHEX_API_URL}/api/webhooks/unite-hub`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Unite-Hub-Signature': signature,
        'X-Unite-Hub-Timestamp': payload.timestamp,
      },
      body: payloadString,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    return { success: true, message: 'Webhook delivered', event_id: result.event_id };
  } catch (error) {
    console.error('[SynthexBridge] Failed to send webhook:', error);
    return {
      success: false,
      message: 'Webhook delivery failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Synthex bridge is configured
 */
export function isBridgeConfigured(): boolean {
  return !!(SYNTHEX_WEBHOOK_SECRET && SYNTHEX_API_URL);
}

/**
 * Get bridge status
 */
export function getBridgeStatus(): {
  configured: boolean;
  inbound: boolean;
  outbound: boolean;
} {
  return {
    configured: isBridgeConfigured(),
    inbound: !!SYNTHEX_WEBHOOK_SECRET,
    outbound: !!(SYNTHEX_API_URL && UNITE_HUB_WEBHOOK_SECRET),
  };
}
