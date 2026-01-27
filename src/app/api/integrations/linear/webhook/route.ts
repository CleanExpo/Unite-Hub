/**
 * Linear Webhook Handler
 *
 * POST /api/integrations/linear/webhook - Receive webhook events from Linear
 *
 * Handles real-time updates for:
 * - Issue created/updated/deleted
 * - Project created/updated/deleted
 * - Comment added
 * - State changes
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

interface LinearWebhookPayload {
  action: 'create' | 'update' | 'remove';
  type: 'Issue' | 'Project' | 'Comment' | 'IssueLabel' | 'User';
  data: any;
  createdAt: string;
  organizationId: string;
  webhookId: string;
  url: string;
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');

  return signature === expectedSignature;
}

/**
 * Handle Issue events
 */
async function handleIssueEvent(
  action: string,
  issue: any
): Promise<void> {
  console.log(`[Linear Webhook] Issue ${action}:`, {
    id: issue.id,
    identifier: issue.identifier,
    title: issue.title,
    state: issue.state?.name,
  });

  // TODO: Implement your business logic here
  // Examples:
  // - Update local database with issue changes
  // - Send notifications to relevant users
  // - Trigger automations based on state changes
  // - Sync with Unite-Hub tasks

  switch (action) {
    case 'create':
      console.log('New issue created:', issue.identifier);
      // await syncIssueToUniteHub(issue);
      break;

    case 'update':
      console.log('Issue updated:', issue.identifier);
      // await updateUniteHubTask(issue);
      break;

    case 'remove':
      console.log('Issue deleted:', issue.identifier);
      // await deleteUniteHubTask(issue.id);
      break;
  }
}

/**
 * Handle Project events
 */
async function handleProjectEvent(
  action: string,
  project: any
): Promise<void> {
  console.log(`[Linear Webhook] Project ${action}:`, {
    id: project.id,
    name: project.name,
    state: project.state,
    progress: project.progress,
  });

  // TODO: Implement your business logic here
  switch (action) {
    case 'create':
      console.log('New project created:', project.name);
      break;

    case 'update':
      console.log('Project updated:', project.name);
      break;

    case 'remove':
      console.log('Project deleted:', project.name);
      break;
  }
}

/**
 * Handle Comment events
 */
async function handleCommentEvent(
  action: string,
  comment: any
): Promise<void> {
  console.log(`[Linear Webhook] Comment ${action}:`, {
    id: comment.id,
    issueId: comment.issueId,
    body: comment.body?.substring(0, 100),
  });

  // TODO: Implement your business logic here
  // Examples:
  // - Send notifications for @mentions
  // - Update activity feeds
  // - Trigger workflows based on keywords
}

export async function POST(request: NextRequest) {
  try {
    // Get webhook secret
    const webhookSecret = process.env.LINEAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('[Linear Webhook] LINEAR_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        {
          success: false,
          error: 'Webhook secret not configured',
        },
        { status: 500 }
      );
    }

    // Get signature from headers
    const signature = request.headers.get('linear-signature');

    if (!signature) {
      console.error('[Linear Webhook] Missing signature header');
      return NextResponse.json(
        {
          success: false,
          error: 'Missing signature',
        },
        { status: 401 }
      );
    }

    // Get raw body for signature verification
    const rawBody = await request.text();

    // Verify signature
    const isValid = verifyWebhookSignature(rawBody, signature, webhookSecret);

    if (!isValid) {
      console.error('[Linear Webhook] Invalid signature');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid signature',
        },
        { status: 401 }
      );
    }

    // Parse payload
    const payload: LinearWebhookPayload = JSON.parse(rawBody);

    console.log('[Linear Webhook] Event received:', {
      type: payload.type,
      action: payload.action,
      organizationId: payload.organizationId,
    });

    // Handle different event types
    switch (payload.type) {
      case 'Issue':
        await handleIssueEvent(payload.action, payload.data);
        break;

      case 'Project':
        await handleProjectEvent(payload.action, payload.data);
        break;

      case 'Comment':
        await handleCommentEvent(payload.action, payload.data);
        break;

      default:
        console.log('[Linear Webhook] Unhandled event type:', payload.type);
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
    });

  } catch (error) {
    console.error('[Linear Webhook] Error processing webhook:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process webhook',
      },
      { status: 500 }
    );
  }
}
