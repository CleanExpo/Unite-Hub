import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { gmailClient, parseGmailMessage, parseWebhookNotification } from "@/lib/gmail";
import { publicRateLimit } from "@/lib/rate-limit";
import { EmailProcessingRequestSchema } from "@/lib/validation/schemas";
import { withErrorBoundary } from "@/lib/error-boundary";

/**
 * Lookup workspace by Gmail integration email address
 * Searches integrations table for the mapped workspace
 */
async function getWorkspaceByEmailIntegration(
  supabase: Awaited<ReturnType<typeof getSupabaseServer>>,
  emailAddress: string
): Promise<string | null> {
  try {
    // Try to find integration by email address
    const { data: integration, error } = await supabase
      .from("integrations")
      .select("workspace_id")
      .eq("provider", "gmail")
      .eq("status", "active")
      .or(`provider_account_id.eq.${emailAddress},metadata->>email.eq.${emailAddress}`)
      .single();

    if (!error && integration?.workspace_id) {
      return integration.workspace_id;
    }

    // Fallback: check environment-configured email
    const configuredEmail = process.env.GMAIL_INBOX_EMAIL;
    if (configuredEmail && emailAddress === configuredEmail) {
      // Get default workspace for the configured inbox
      const { data: defaultIntegration } = await supabase
        .from("integrations")
        .select("workspace_id")
        .eq("provider", "gmail")
        .eq("status", "active")
        .limit(1)
        .single();

      if (defaultIntegration?.workspace_id) {
        console.warn("[email/webhook] Using fallback Gmail integration for:", emailAddress);
        return defaultIntegration.workspace_id;
      }
    }

    console.error("[email/webhook] No Gmail integration found for:", emailAddress);
    return null;
  } catch (error) {
    console.error("[email/webhook] Failed to lookup workspace for email:", {
      error: error instanceof Error ? error.message : "Unknown error",
      emailAddress
    });
    return null;
  }
}

/**
 * POST /api/email/webhook
 * Gmail Push Notification Webhook
 * Receives notifications when new emails arrive
 */

export const POST = withErrorBoundary(async (req: NextRequest) => {
    // Apply rate limiting (webhooks are external, use public limit)
    const rateLimitResult = await publicRateLimit(req);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();
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

    // CRITICAL: Lookup workspace by email integration (not first workspace)
    // This ensures proper workspace isolation for multi-tenant processing
    const workspaceId = await getWorkspaceByEmailIntegration(supabase, parsed.emailAddress);

    if (!workspaceId) {
      console.error("[email/webhook] No workspace found for email:", parsed.emailAddress);
      return NextResponse.json({ error: "No workspace configured for this email" }, { status: 400 });
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
        const result = await processIncomingEmail(supabase, parsedEmail, workspaceId);
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
});

/**
 * Process incoming email and store in Supabase
 */
async function processIncomingEmail(supabase: any, parsedEmail: any, workspaceId: string) {
  try {
    // Find contact by email address
    const { data: existingContact } = await supabase
      .from("contacts")
      .select("id, email, name")
      .eq("email", parsedEmail.senderEmail)
      .eq("workspace_id", workspaceId)
      .single();

    let contactId: string | null = null;
    let isNewContact = false;

    if (existingContact) {
      // Existing contact
      contactId = existingContact.id;

      // Update last contacted time
      await supabase
        .from("contacts")
        .update({
          updated_at: new Date().toISOString(),
          last_contacted_at: new Date().toISOString()
        })
        .eq("id", contactId);
    } else {
      // New sender - create placeholder contact
      const { data: newContact, error: contactError } = await supabase
        .from("contacts")
        .insert({
          workspace_id: workspaceId,
          name: parsedEmail.senderName || parsedEmail.senderEmail,
          email: parsedEmail.senderEmail,
          company: null,
          job_title: null,
          phone: null,
          industry: null,
          status: "new",
          ai_score: 0,
          source: "email_webhook",
          tags: ["auto-created"],
          custom_fields: {
            autoCreatedFrom: "email",
            autoCreatedAt: new Date().toISOString()
          },
          last_contacted_at: new Date().toISOString()
        })
        .select()
        .single();

      if (!contactError && newContact) {
        contactId = newContact.id;
        isNewContact = true;
      } else {
        console.error("Failed to create contact:", contactError);
      }
    }

    // Store incoming email
    const { data: emailRecord, error: emailError } = await supabase
      .from("emails")
      .insert({
        workspace_id: workspaceId,
        contact_id: contactId,
        from: parsedEmail.senderEmail,
        to: process.env.GMAIL_INBOX_EMAIL || "contact@unite-group.in",
        subject: parsedEmail.subject,
        body: parsedEmail.bodyHtml || parsedEmail.bodyPlain,
        ai_summary: null,
        is_processed: false, // Will be processed by AI agent later
        metadata: {
          gmailMessageId: parsedEmail.messageId,
          gmailThreadId: parsedEmail.threadId,
          senderName: parsedEmail.senderName,
          receivedAt: parsedEmail.receivedAt,
          attachmentCount: parsedEmail.attachments?.length || 0
        },
        created_at: new Date(parsedEmail.receivedAt).toISOString()
      })
      .select()
      .single();

    if (emailError) {
      console.error("Failed to store email:", emailError);
    }

    // Handle attachments - store in cloud storage
    // This would be done asynchronously in production
    for (const attachment of (parsedEmail.attachments || [])) {
      // TODO: Upload to cloud storage and create attachment records
      console.log(`Attachment to process: ${attachment.filename}`);
    }

    return {
      emailId: emailRecord?.id,
      contactId,
      isNewContact,
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
