/**
 * WhatsApp Business Webhook Endpoint
 * Receives incoming messages, status updates, and other events from WhatsApp
 *
 * Security: Webhook signature validation, workspace isolation via integrations lookup
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { WhatsAppService } from '@/lib/services/whatsapp';
import { processIncomingWhatsAppMessage } from '@/lib/agents/whatsapp-intelligence';
import { publicRateLimit } from "@/lib/rate-limit";
import { createApiLogger } from "@/lib/logger";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'your-verify-token';
const logger = createApiLogger({ route: '/api/webhooks/whatsapp' });

/**
 * Lookup workspace by WhatsApp Business Account ID or Phone Number ID
 * Searches integrations table for the mapped workspace
 */
async function getWorkspaceByWhatsAppAccount(
  businessAccountId: string,
  phoneNumberId: string
): Promise<string | null> {
  try {
    // Try to find integration by WhatsApp business account
    const { data: integration, error } = await db.supabase
      .from('integrations')
      .select('workspace_id')
      .eq('provider', 'whatsapp')
      .eq('status', 'active')
      .or(`provider_account_id.eq.${businessAccountId},metadata->>phone_number_id.eq.${phoneNumberId}`)
      .single();

    if (error || !integration) {
      // Fallback: check if there's a default WhatsApp integration
      const { data: defaultIntegration } = await db.supabase
        .from('integrations')
        .select('workspace_id')
        .eq('provider', 'whatsapp')
        .eq('status', 'active')
        .limit(1)
        .single();

      if (defaultIntegration?.workspace_id) {
        logger.warn('Using fallback WhatsApp integration', {
          businessAccountId,
          phoneNumberId,
          fallbackWorkspaceId: defaultIntegration.workspace_id
        });
        return defaultIntegration.workspace_id;
      }

      logger.error('No WhatsApp integration found', { businessAccountId, phoneNumberId });
      return null;
    }

    return integration.workspace_id;
  } catch (error) {
    logger.error('Failed to lookup workspace for WhatsApp', {
      error: error instanceof Error ? error.message : 'Unknown error',
      businessAccountId,
      phoneNumberId
    });
    return null;
  }
}

/**
 * GET - WhatsApp webhook verification
 * This is called by WhatsApp to verify your webhook endpoint
 */
export async function GET(req: NextRequest) {
  try {
  // Apply rate limiting
  const rateLimitResult = await publicRateLimit(req);
  if (rateLimitResult) {
    return rateLimitResult;
  }

    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    console.log('📞 WhatsApp webhook verification request:', { mode, token });

    // Check if mode and token are correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ Webhook verified successfully');
      return new Response(challenge, { status: 200 });
    }

    console.log('❌ Webhook verification failed');
    return new Response('Forbidden', { status: 403 });
  } catch (error) {
    console.error('Error verifying webhook:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}

/**
 * POST - Receive WhatsApp webhook events
 * Handles incoming messages, status updates, and other events
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    console.log('📞 WhatsApp webhook received:', JSON.stringify(body, null, 2));

    // Verify webhook signature (optional but recommended)
    const signature = req.headers.get('x-hub-signature-256');
    if (signature && process.env.WHATSAPP_APP_SECRET) {
      const rawBody = JSON.stringify(body);
      const isValid = WhatsAppService.verifyWebhookSignature(
        rawBody,
        signature,
        process.env.WHATSAPP_APP_SECRET
      );

      if (!isValid) {
        console.error('❌ Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // WhatsApp sends events in this format
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        const businessAccountId = entry.id;

        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            await handleMessagesChange(change.value, businessAccountId);
          }
        }
      }
    }

    // Return 200 OK immediately (WhatsApp requires fast response)
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing WhatsApp webhook:', error);
    // Still return 200 to prevent WhatsApp from retrying
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

/**
 * Handle incoming messages and status updates
 */
async function handleMessagesChange(value: any, businessAccountId: string) {
  try {
    const metadata = value.metadata;
    const phoneNumberId = metadata.phone_number_id;

    // Lookup workspace from integrations table
    const workspaceId = await getWorkspaceByWhatsAppAccount(businessAccountId, phoneNumberId);

    if (!workspaceId) {
      logger.error('Cannot process WhatsApp message without valid workspace', {
        businessAccountId,
        phoneNumberId
      });
      // Store for debugging but mark as unprocessable
      await db.supabase.from('webhook_errors').insert({
        provider: 'whatsapp',
        error_type: 'workspace_not_found',
        payload: value,
        created_at: new Date().toISOString()
      });
      return; // Exit early - do not process without valid workspace
    }

    // Store webhook for debugging
    await db.whatsappWebhooks.create({
      workspace_id: workspaceId,
      event_type: 'messages',
      payload: value,
      processed: false
    });

    // Handle messages
    if (value.messages) {
      for (const message of value.messages) {
        await handleIncomingMessage(message, phoneNumberId, workspaceId);
      }
    }

    // Handle statuses (delivery receipts, read receipts)
    if (value.statuses) {
      for (const status of value.statuses) {
        await handleMessageStatus(status, workspaceId);
      }
    }
  } catch (error) {
    console.error('Error handling messages change:', error);
  }
}

/**
 * Handle a single incoming message
 */
async function handleIncomingMessage(
  message: any,
  phoneNumberId: string,
  workspaceId: string
) {
  try {
    const phoneNumber = message.from;
    const messageType = message.type;
    const whatsappMessageId = message.id;

    console.log(`📨 Incoming ${messageType} message from ${phoneNumber}`);

    // Extract message content based on type
    let content = '';
    let mediaUrl = null;
    let mediaType = null;
    let caption = null;

    switch (messageType) {
      case 'text':
        content = message.text.body;
        break;
      case 'image':
        content = message.image.caption || '[Image]';
        caption = message.image.caption;
        mediaUrl = message.image.id; // We'll need to fetch the actual URL later
        mediaType = 'image';
        break;
      case 'video':
        content = message.video.caption || '[Video]';
        caption = message.video.caption;
        mediaUrl = message.video.id;
        mediaType = 'video';
        break;
      case 'document':
        content = message.document.caption || `[Document: ${message.document.filename || 'file'}]`;
        caption = message.document.caption;
        mediaUrl = message.document.id;
        mediaType = 'document';
        break;
      case 'audio':
        content = '[Audio message]';
        mediaUrl = message.audio.id;
        mediaType = 'audio';
        break;
      case 'location':
        content = `[Location: ${message.location.latitude}, ${message.location.longitude}]`;
        break;
      case 'interactive':
        // Button reply or list reply
        if (message.interactive.type === 'button_reply') {
          content = message.interactive.button_reply.title;
        } else if (message.interactive.type === 'list_reply') {
          content = message.interactive.list_reply.title;
        }
        break;
      default:
        content = `[${messageType} message]`;
    }

    // Find or create contact
    let contact = await db.contacts.getByEmail(phoneNumber, workspaceId);
    if (!contact) {
      // Try to find contact by phone number in the contacts table
      // For now, we'll create a new contact
      contact = await db.contacts.create({
        workspace_id: workspaceId,
        email: `${phoneNumber}@whatsapp.contact`, // Temporary email
        name: phoneNumber,
        phone: phoneNumber,
        source: 'whatsapp',
        status: 'contact',
        ai_score: 0.5,
        tags: ['whatsapp']
      });
    }

    // Create message in database
    const dbMessage = await db.whatsappMessages.create({
      workspace_id: workspaceId,
      contact_id: contact.id,
      phone_number: phoneNumber,
      direction: 'inbound',
      message_type: messageType,
      content,
      media_url: mediaUrl,
      media_type: mediaType,
      caption,
      status: 'received',
      whatsapp_message_id: whatsappMessageId,
      created_at: new Date(parseInt(message.timestamp) * 1000)
    });

    // Create or update conversation
    let conversation = await db.whatsappConversations.getByPhone(phoneNumber, workspaceId);
    if (!conversation) {
      conversation = await db.whatsappConversations.create({
        workspace_id: workspaceId,
        contact_id: contact.id,
        phone_number: phoneNumber,
        status: 'open',
        last_message_at: new Date(),
        last_message_direction: 'inbound',
        unread_count: 1
      });
    } else {
      await db.whatsappConversations.updateLastMessage(phoneNumber, workspaceId, 'inbound');
    }

    // Mark message as read (optional - you might want to do this only when user reads it)
    const whatsappService = new WhatsAppService(phoneNumberId);
    await whatsappService.markMessageAsRead(whatsappMessageId);

    // Process message with AI (async, don't wait)
    processIncomingWhatsAppMessage(dbMessage.id, workspaceId).catch(error => {
      console.error('Error processing message with AI:', error);
    });

    console.log(`✅ Saved incoming message: ${dbMessage.id}`);
  } catch (error) {
    console.error('Error handling incoming message:', error);
    throw error;
  }
}

/**
 * Handle message status updates (sent, delivered, read)
 */
async function handleMessageStatus(status: any, workspaceId: string) {
  try {
    const whatsappMessageId = status.id;
    const statusType = status.status; // sent, delivered, read, failed

    console.log(`📊 Status update for ${whatsappMessageId}: ${statusType}`);

    // Find message in database
    const { data: messages } = await db.supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('whatsapp_message_id', whatsappMessageId)
      .eq('workspace_id', workspaceId);

    if (messages && messages.length > 0) {
      const message = messages[0];

      // Update message status
      await db.whatsappMessages.updateStatus(message.id, statusType, {
        error_message: status.errors ? JSON.stringify(status.errors) : null
      });

      console.log(`✅ Updated message status: ${message.id} -> ${statusType}`);
    }
  } catch (error) {
    console.error('Error handling message status:', error);
  }
}
