import { NextRequest, NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { gmailClient, parseGmailMessage, parseWebhookNotification } from "@/lib/gmail";

/**
 * POST /api/email/webhook
 * Gmail Push Notification Webhook
 * Receives notifications when new emails arrive
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(req: NextRequest) {
  try {
    const notification = await req.json();

    // Parse webhook notification
    const parsed = parseWebhookNotification(notification);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid notification format" }, { status: 400 });
    }

    // Verify notification is for our email address
    const expectedEmail = process.env.GMAIL_INBOX_EMAIL || "contact@unite-group.in";
    if (parsed.emailAddress !== expectedEmail) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get OAuth credentials from environment or database
    const credentials = {
      accessToken: process.env.GMAIL_ACCESS_TOKEN!,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN!,
    };

    // Check if token needs refresh
    const gmail = gmailClient.getGmailAPI(credentials);

    // Fetch new messages since last history ID
    // For production, you'd fetch the last known historyId from database
    const historyResponse = await gmail.users.history.list({
      userId: "me",
      startHistoryId: parsed.historyId,
      historyTypes: ["messageAdded"],
    });

    const messageIds: string[] = [];
    const history = historyResponse.data.history || [];

    for (const record of history) {
      if (record.messagesAdded) {
        for (const added of record.messagesAdded) {
          if (added.message?.id) {
            messageIds.push(added.message.id);
          }
        }
      }
    }

    // Process each new message
    const processedEmails = [];
    for (const messageId of messageIds) {
      try {
        // Fetch full message
        const message = await gmail.users.messages.get({
          userId: "me",
          id: messageId,
          format: "full",
        });

        // Parse message
        const parsedEmail = parseGmailMessage(message.data);

        // Process and store email
        const result = await processIncomingEmail(parsedEmail);
        processedEmails.push(result);
      } catch (error) {
        console.error(`Error processing message ${messageId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedEmails.length,
      messages: processedEmails,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Webhook processing failed" },
      { status: 500 }
    );
  }
}

/**
 * Process incoming email and store in Convex
 */
async function processIncomingEmail(parsedEmail: any) {
  try {
    // Find client by email address
    const clientEmail = await convex.query(api.clientEmails.getByEmail, {
      emailAddress: parsedEmail.senderEmail,
    });

    let clientId: any;

    if (clientEmail) {
      // Existing client
      clientId = clientEmail.clientId;

      // Update last contact time
      await convex.mutation(api.clientEmails.updateLastContact, {
        id: clientEmail._id,
      });
    } else {
      // New sender - create placeholder client and client email
      // This requires manual verification and linking later
      const newClient = await convex.mutation(api.clients.create, {
        orgId: process.env.DEFAULT_ORG_ID!, // Set a default org or handle differently
        clientName: parsedEmail.senderName,
        businessName: parsedEmail.senderName,
        businessDescription: "Auto-created from email",
        packageTier: "starter",
        status: "onboarding",
        primaryEmail: parsedEmail.senderEmail,
        phoneNumbers: [],
        websiteUrl: undefined,
      });

      clientId = newClient;

      // Create client email record
      await convex.mutation(api.clientEmails.create, {
        clientId,
        emailAddress: parsedEmail.senderEmail,
        isPrimary: true,
        label: "work",
        verified: false,
      });
    }

    // Store email thread
    const emailThread = await convex.mutation(api.emailThreads.create, {
      clientId,
      senderEmail: parsedEmail.senderEmail,
      senderName: parsedEmail.senderName,
      subject: parsedEmail.subject,
      messageBody: parsedEmail.bodyHtml || parsedEmail.bodyPlain,
      messageBodyPlain: parsedEmail.bodyPlain,
      attachments: parsedEmail.attachments.map((att: any) => ({
        fileName: att.filename,
        fileUrl: "", // Will be populated after upload
        mimeType: att.mimeType,
        fileSize: att.size,
      })),
      receivedAt: parsedEmail.receivedAt,
      autoReplySent: false,
      gmailMessageId: parsedEmail.messageId,
      gmailThreadId: parsedEmail.threadId,
      isRead: false,
    });

    // Handle attachments - store in cloud storage
    // This would be done asynchronously in production
    for (const attachment of parsedEmail.attachments) {
      // TODO: Upload to cloud storage and update attachment URLs
      console.log(`Attachment to process: ${attachment.filename}`);
    }

    return {
      emailThreadId: emailThread,
      clientId,
      isNewClient: !clientEmail,
    };
  } catch (error) {
    console.error("Error processing email:", error);
    throw error;
  }
}

/**
 * GET /api/email/webhook
 * Webhook verification endpoint (for initial setup)
 */
export async function GET(req: NextRequest) {
  const challenge = req.nextUrl.searchParams.get("challenge");

  if (challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ status: "Webhook endpoint active" });
}
