/**
 * WhatsApp Send Message API
 * Send text, media, or template messages via WhatsApp Business API
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase';
import { db } from '@/lib/db';
import { whatsappService } from '@/lib/services/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      workspaceId,
      contactId,
      phoneNumber,
      messageType = 'text',
      content,
      templateName,
      templateLanguage = 'en',
      templateComponents,
      mediaUrl,
      mediaCaption,
      fileName
    } = body;

    // Validate required fields
    if (!workspaceId) {
      return NextResponse.json({ error: 'Workspace ID required' }, { status: 400 });
    }

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Format phone number (remove + if present, WhatsApp API expects just digits)
    const formattedPhone = phoneNumber.replace(/\+/g, '');

    let response;
    let messageContent = content;

    // Send message based on type
    switch (messageType) {
      case 'text':
        if (!content) {
          return NextResponse.json({ error: 'Content required for text message' }, { status: 400 });
        }
        response = await whatsappService.sendTextMessage(formattedPhone, content);
        break;

      case 'template':
        if (!templateName) {
          return NextResponse.json({ error: 'Template name required' }, { status: 400 });
        }
        response = await whatsappService.sendTemplateMessage(
          formattedPhone,
          templateName,
          templateLanguage,
          templateComponents
        );
        messageContent = `[Template: ${templateName}]`;
        break;

      case 'image':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'Media URL required for image' }, { status: 400 });
        }
        response = await whatsappService.sendImageMessage(formattedPhone, mediaUrl, mediaCaption);
        messageContent = mediaCaption || '[Image]';
        break;

      case 'video':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'Media URL required for video' }, { status: 400 });
        }
        response = await whatsappService.sendVideoMessage(formattedPhone, mediaUrl, mediaCaption);
        messageContent = mediaCaption || '[Video]';
        break;

      case 'document':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'Media URL required for document' }, { status: 400 });
        }
        response = await whatsappService.sendDocumentMessage(
          formattedPhone,
          mediaUrl,
          fileName,
          mediaCaption
        );
        messageContent = mediaCaption || `[Document: ${fileName || 'file'}]`;
        break;

      case 'audio':
        if (!mediaUrl) {
          return NextResponse.json({ error: 'Media URL required for audio' }, { status: 400 });
        }
        response = await whatsappService.sendAudioMessage(formattedPhone, mediaUrl);
        messageContent = '[Audio message]';
        break;

      default:
        return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }

    // Get WhatsApp message ID from response
    const whatsappMessageId = response.messages[0].id;

    // Find or create contact
    let contact;
    if (contactId) {
      contact = await db.contacts.getById(contactId);
    } else {
      contact = await db.contacts.getByEmail(phoneNumber, workspaceId);
      if (!contact) {
        contact = await db.contacts.create({
          workspace_id: workspaceId,
          email: `${phoneNumber}@whatsapp.contact`,
          name: phoneNumber,
          phone: phoneNumber,
          source: 'whatsapp',
          status: 'contact',
          ai_score: 0.5,
          tags: ['whatsapp']
        });
      }
    }

    // Save message to database
    const dbMessage = await db.whatsappMessages.create({
      workspace_id: workspaceId,
      contact_id: contact.id,
      phone_number: formattedPhone,
      direction: 'outbound',
      message_type: messageType,
      content: messageContent,
      media_url: mediaUrl,
      caption: mediaCaption,
      status: 'sent',
      whatsapp_message_id: whatsappMessageId,
      sent_at: new Date()
    });

    // Update or create conversation
    let conversation = await db.whatsappConversations.getByPhone(formattedPhone, workspaceId);
    if (!conversation) {
      conversation = await db.whatsappConversations.create({
        workspace_id: workspaceId,
        contact_id: contact.id,
        phone_number: formattedPhone,
        status: 'open',
        last_message_at: new Date(),
        last_message_direction: 'outbound',
        unread_count: 0
      });
    } else {
      await db.whatsappConversations.updateLastMessage(formattedPhone, workspaceId, 'outbound');
    }

    // Log to audit
    await db.auditLogs.create({
      org_id: contact.org_id || workspaceId,
      action: 'whatsapp_message_sent',
      resource: 'whatsapp',
      details: {
        contact_id: contact.id,
        phone_number: formattedPhone,
        message_type: messageType,
        whatsapp_message_id: whatsappMessageId
      }
    });

    return NextResponse.json({
      success: true,
      message: dbMessage,
      whatsappMessageId
    });
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
