import { NextRequest, NextResponse } from 'next/server';
import * as crypto from 'crypto';
import { WebClient } from '@slack/web-api';
import { conductStrategicDialogue } from '@/lib/agents/aiPhillAgent';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * POST /api/integrations/slack/aiphill
 *
 * Slack Slash Command handler for AI Phill
 * Usage: /aiphill What are the key trends across my businesses?
 *
 * Required env vars:
 * - SLACK_SIGNING_SECRET: Verify requests from Slack
 * - SLACK_BOT_TOKEN: Send responses back to Slack
 */

// Verify Slack request signature
async function verifySlackSignature(req: NextRequest, body: string): Promise<boolean> {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    console.error('[Slack AI Phill] SLACK_SIGNING_SECRET not configured');
    return false;
  }

  const timestamp = req.headers.get('x-slack-request-timestamp');
  const signature = req.headers.get('x-slack-signature');

  if (!timestamp || !signature) {
    console.error('[Slack AI Phill] Missing Slack signature headers');
    return false;
  }

  // Prevent replay attacks (reject if older than 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    console.error('[Slack AI Phill] Request timestamp too old');
    return false;
  }

  // Compute expected signature
  const sigBasestring = `v0:${timestamp}:${body}`;
  const expectedSignature = 'v0=' + crypto
    .createHmac('sha256', signingSecret)
    .update(sigBasestring)
    .digest('hex');

  // Timing-safe comparison (must check lengths first to avoid throwing)
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (sigBuffer.length !== expectedBuffer.length) {
    console.error('[Slack AI Phill] Signature length mismatch');
    return false;
  }

  return crypto.timingSafeEqual(sigBuffer, expectedBuffer);
}

// Look up user by Slack ID or email
async function findUserBySlack(slackUserId: string, slackTeamId: string): Promise<string | null> {
  // First check if we have a direct Slack mapping
  const { data: slackMapping } = await supabaseAdmin
    .from('user_slack_mappings')
    .select('user_id')
    .eq('slack_user_id', slackUserId)
    .eq('slack_team_id', slackTeamId)
    .maybeSingle();

  if (slackMapping?.user_id) {
    return slackMapping.user_id;
  }

  // Table might not exist yet - return null to use fallback
  return null;
}

export async function POST(req: NextRequest) {
  try {
    // Read raw body for signature verification
    const body = await req.text();

    // Verify request is from Slack
    const isValid = await verifySlackSignature(req, body);
    if (!isValid) {
      console.error('[Slack AI Phill] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse form data (Slack sends as application/x-www-form-urlencoded)
    const params = new URLSearchParams(body);
    const command = params.get('command');
    const text = params.get('text') || '';
    const userId = params.get('user_id') || '';
    const userName = params.get('user_name') || '';
    const teamId = params.get('team_id') || '';
    const channelId = params.get('channel_id') || '';
    const responseUrl = params.get('response_url') || '';

    console.log('[Slack AI Phill] Received command:', {
      command,
      text: text.slice(0, 50),
      userName,
      teamId,
      channelId,
    });

    // Validate command
    if (command !== '/aiphill') {
      return NextResponse.json({ error: 'Unknown command' }, { status: 400 });
    }

    // Empty text = help message
    if (!text.trim()) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: '*AI Phill - Your Strategic Business Advisor*\n\nUsage: `/aiphill [your question]`\n\nExamples:\n• `/aiphill What are the key trends across my businesses this week?`\n• `/aiphill Which business needs the most attention right now?`\n• `/aiphill Generate a performance summary for my portfolio`\n• `/aiphill What opportunities should I focus on?`',
      });
    }

    // Acknowledge immediately (Slack requires response within 3 seconds)
    // We'll send the actual response via response_url
    const immediateResponse = NextResponse.json({
      response_type: 'in_channel',
      text: `_AI Phill is thinking about: "${text.slice(0, 100)}${text.length > 100 ? '...' : ''}"_`,
    });

    // Process in background and send response via response_url
    processAndRespond(text, userId, teamId, responseUrl, userName).catch(err => {
      console.error('[Slack AI Phill] Background processing failed:', err);
    });

    return immediateResponse;
  } catch (error) {
    console.error('[Slack AI Phill] Error:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: 'Sorry, something went wrong. Please try again.',
    }, { status: 500 });
  }
}

// Process the request and send response via response_url
async function processAndRespond(
  question: string,
  slackUserId: string,
  slackTeamId: string,
  responseUrl: string,
  userName: string
) {
  try {
    // Find internal user ID
    let internalUserId = await findUserBySlack(slackUserId, slackTeamId);

    // Fallback: use a default founder user ID from env
    if (!internalUserId) {
      internalUserId = process.env.SLACK_DEFAULT_USER_ID || '';
      if (!internalUserId) {
        console.warn('[Slack AI Phill] No user mapping found and no default user configured');
        await sendSlackResponse(responseUrl, {
          response_type: 'ephemeral',
          text: 'Your Slack account is not linked to Unite-Hub. Please contact your administrator to set up the integration.',
        });
        return;
      }
    }

    console.log('[Slack AI Phill] Processing for user:', internalUserId);

    // Call AI Phill
    const result = await conductStrategicDialogue(internalUserId, question);

    if (!result.success) {
      await sendSlackResponse(responseUrl, {
        response_type: 'ephemeral',
        text: `Sorry, I encountered an error: ${result.error}`,
      });
      return;
    }

    // Format response for Slack
    const response = result.data?.response || 'I processed your request but have no specific insights to share.';
    const followUps = result.data?.followUpQuestions || [];

    // Build Slack blocks for rich formatting
    const blocks: any[] = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: response,
        },
      },
    ];

    // Add follow-up questions if available
    if (followUps.length > 0) {
      blocks.push({
        type: 'divider',
      });
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Follow-up questions to consider:*\n' + followUps.map((q: string) => `• ${q}`).join('\n'),
        },
      });
    }

    // Add suggested actions if available
    const actions = result.data?.suggestedActions || [];
    if (actions.length > 0) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*Suggested actions:*\n' + actions.map((a: string) => `• ${a}`).join('\n'),
        },
      });
    }

    await sendSlackResponse(responseUrl, {
      response_type: 'in_channel',
      text: response, // Fallback for notifications
      blocks,
    });

    console.log('[Slack AI Phill] Response sent successfully');
  } catch (error) {
    console.error('[Slack AI Phill] Processing error:', error);
    await sendSlackResponse(responseUrl, {
      response_type: 'ephemeral',
      text: 'Sorry, I encountered an error processing your request. Please try again.',
    });
  }
}

// Send response to Slack via response_url
async function sendSlackResponse(responseUrl: string, payload: any) {
  const res = await fetch(responseUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => 'Unknown error');
    console.error('[Slack AI Phill] Failed to send response:', {
      status: res.status,
      error: errorText,
    });
  }
}
