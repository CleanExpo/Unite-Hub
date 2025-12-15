/**
 * Unified Metrics Webhook Endpoint
 * POST /api/webhooks/metrics?provider=<sendgrid|resend|facebook|instagram|linkedin>
 *
 * Handles webhook events from all metrics providers:
 * - Verifies signatures
 * - Normalizes events
 * - Persists and attributes
 * - Applies to rollups
 */

import { NextRequest } from 'next/server';
import { errorResponse, successResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import {
  type MetricsProvider,
  DEFAULT_METRICS_GUARDRAILS,
} from '@/lib/decision-circuits/metrics/metrics-types';
import { verifyWebhookSignature, getProviderSecret } from '@/lib/decision-circuits/metrics/metrics-signatures';
import { ingestWebhookEvent } from '@/lib/decision-circuits/metrics/metrics-ingestion';

/**
 * Supported providers
 */
const SUPPORTED_PROVIDERS: MetricsProvider[] = [
  'sendgrid',
  'resend',
  'facebook',
  'instagram',
  'linkedin',
];

/**
 * POST /api/webhooks/metrics
 * Receive and process webhook events from metrics providers
 */
export const POST = withErrorBoundary(async (req: NextRequest) => {
  const provider = req.nextUrl.searchParams.get('provider');

  // Validate provider parameter
  if (!provider || !SUPPORTED_PROVIDERS.includes(provider as MetricsProvider)) {
    return errorResponse(
      `Invalid provider. Supported: ${SUPPORTED_PROVIDERS.join(', ')}`,
      400
    );
  }

  const metricsProvider = provider as MetricsProvider;

  // Check request size
  const contentLength = req.headers.get('content-length');
  if (contentLength) {
    const sizeInMB = parseInt(contentLength, 10) / (1024 * 1024);
    if (sizeInMB > DEFAULT_METRICS_GUARDRAILS.max_webhook_payload_size_mb) {
      return errorResponse(
        `Payload too large (max ${DEFAULT_METRICS_GUARDRAILS.max_webhook_payload_size_mb}MB)`,
        413
      );
    }
  }

  // Get raw body for signature verification
  const rawBody = await req.text();

  if (!rawBody) {
    return errorResponse('Empty request body', 400);
  }

  // Parse JSON
  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return errorResponse('Invalid JSON', 400);
  }

  if (typeof payload !== 'object' || payload === null) {
    return errorResponse('Payload must be an object', 400);
  }

  // Get provider secret
  const secret = getProviderSecret(metricsProvider);
  if (!secret) {
    console.error(`Missing webhook secret for provider: ${metricsProvider}`);
    return errorResponse('Webhook secret not configured', 500);
  }

  // Verify signature (hard-fail on invalid)
  const verification = verifyWebhookSignature(
    metricsProvider,
    Object.fromEntries(req.headers.entries()),
    rawBody,
    secret
  );

  if (!verification.valid) {
    console.warn(`Invalid signature for ${metricsProvider}: ${verification.reason}`);
    return errorResponse(
      `Signature verification failed: ${verification.reason}`,
      401
    );
  }

  // Ingest webhook event
  // Note: workspace_id should be extracted from webhook context or inferred
  // For MVP, using a placeholder that would be resolved by actual implementation
  const workspaceId = req.headers.get('x-workspace-id') || 'unknown';

  if (workspaceId === 'unknown') {
    return errorResponse(
      'Missing x-workspace-id header',
      400
    );
  }

  const result = await ingestWebhookEvent(
    workspaceId,
    metricsProvider,
    payload as Record<string, unknown>,
    verification.valid
  );

  if (!result.success) {
    console.error(`Webhook ingestion failed: ${result.reason}`);
    return errorResponse(
      {
        error: 'Ingestion failed',
        reason: result.reason,
        provider: metricsProvider,
      },
      400
    );
  }

  // Success response
  return successResponse(
    {
      success: true,
      event_id: result.event_id,
      provider: metricsProvider,
      message: 'Webhook received and queued for processing',
      timestamp: new Date().toISOString(),
    },
    202 // Accepted
  );
});

/**
 * GET /api/webhooks/metrics
 * Health check endpoint
 */
export const GET = withErrorBoundary(async (req: NextRequest) => {
  const provider = req.nextUrl.searchParams.get('provider');

  if (!provider) {
    return successResponse(
      {
        status: 'ok',
        supported_providers: SUPPORTED_PROVIDERS,
        message: 'Metrics webhook endpoint ready',
      },
      200
    );
  }

  if (!SUPPORTED_PROVIDERS.includes(provider as MetricsProvider)) {
    return errorResponse(`Unknown provider: ${provider}`, 404);
  }

  return successResponse(
    {
      status: 'ready',
      provider,
      message: `Webhook endpoint ready for ${provider}`,
      setup_instructions: `POST to /api/webhooks/metrics?provider=${provider} with signed payload`,
    },
    200
  );
});
