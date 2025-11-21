import { gmailClient, parseGmailMessage, downloadAttachment } from "./index";
import { uploadAttachments } from "./storage";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Email Processing Pipeline
 * Complete workflow for ingesting and processing emails
 */

export interface EmailProcessingResult {
  emailThreadId: string;
  clientId: string;
  isNewClient: boolean;
  attachmentsProcessed: number;
}

/**
 * Fetch and process a single email by message ID
 */
export async function processEmailByMessageId(
  messageId: string,
  accessToken: string,
  refreshToken: string,
  orgId: string
): Promise<EmailProcessingResult> {
  try {
    // Get Gmail API client
    const gmail = gmailClient.getGmailAPI({ accessToken, refreshToken });

    // Fetch message
    const message = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    // Parse message
    const parsedEmail = parseGmailMessage(message.data);

    // Download attachments if any
    const attachmentsWithData = [];
    for (const attachment of parsedEmail.attachments) {
      const data = await downloadAttachment(gmail, messageId, attachment.attachmentId);
      attachmentsWithData.push({
        ...attachment,
        data,
      });
    }

    // Process email
    const result = await processEmail(parsedEmail, attachmentsWithData, orgId);

    return result;
  } catch (error) {
    console.error("Error processing email by message ID:", error);
    throw error;
  }
}

/**
 * Process parsed email and store in database
 */
export async function processEmail(
  parsedEmail: any,
  attachments: any[],
  orgId: string
): Promise<EmailProcessingResult> {
  try {
    const supabase = await getSupabaseServer();

    // Find or create client
    const { clientId, isNewClient } = await findOrCreateClient(
      parsedEmail.senderEmail,
      parsedEmail.senderName,
      orgId
    );

    // Upload attachments to cloud storage
    let uploadedAttachments = [];
    if (attachments.length > 0) {
      uploadedAttachments = await uploadAttachments(
        attachments.map((a) => ({
          fileName: a.filename,
          content: a.data,
          mimeType: a.mimeType,
        })),
        clientId
      );
    }

    // Store email thread
    const { data: emailThread, error } = await supabase
      .from("email_threads")
      .insert({
        client_id: clientId,
        sender_email: parsedEmail.senderEmail,
        sender_name: parsedEmail.senderName,
        subject: parsedEmail.subject,
        message_body: parsedEmail.bodyHtml || parsedEmail.bodyPlain,
        message_body_plain: parsedEmail.bodyPlain,
        attachments: uploadedAttachments,
        received_at: parsedEmail.receivedAt,
        auto_reply_sent: false,
        gmail_message_id: parsedEmail.messageId,
        gmail_thread_id: parsedEmail.threadId,
        is_read: false,
      })
      .select("id")
      .single();

    if (error) {
      throw error;
    }

    return {
      emailThreadId: emailThread.id,
      clientId,
      isNewClient,
      attachmentsProcessed: uploadedAttachments.length,
    };
  } catch (error) {
    console.error("Error processing email:", error);
    throw error;
  }
}

/**
 * Find existing client or create new one
 */
async function findOrCreateClient(
  email: string,
  name: string,
  orgId: string
): Promise<{ clientId: string; isNewClient: boolean }> {
  try {
    const supabase = await getSupabaseServer();

    // Check if email exists in client_emails
    const { data: clientEmail } = await supabase
      .from("client_emails")
      .select("client_id")
      .eq("email_address", email)
      .single();

    if (clientEmail) {
      // Update last contact time
      await supabase
        .from("client_emails")
        .update({ last_contact_at: new Date().toISOString() })
        .eq("email_address", email);

      return {
        clientId: clientEmail.client_id,
        isNewClient: false,
      };
    }

    // Create new client
    const { data: newClient, error: clientError } = await supabase
      .from("clients")
      .insert({
        org_id: orgId,
        client_name: name,
        business_name: name,
        business_description: "Auto-created from email",
        package_tier: "starter",
        status: "onboarding",
        primary_email: email,
        phone_numbers: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (clientError) {
      throw clientError;
    }

    // Create client email record
    await supabase
      .from("client_emails")
      .insert({
        client_id: newClient.id,
        email_address: email,
        is_primary: true,
        label: "work",
        verified: false,
        created_at: new Date().toISOString(),
      });

    return {
      clientId: newClient.id,
      isNewClient: true,
    };
  } catch (error) {
    console.error("Error finding or creating client:", error);
    throw error;
  }
}

/**
 * Batch process multiple emails
 */
export async function batchProcessEmails(
  messageIds: string[],
  accessToken: string,
  refreshToken: string,
  orgId: string
): Promise<EmailProcessingResult[]> {
  const results: EmailProcessingResult[] = [];

  for (const messageId of messageIds) {
    try {
      const result = await processEmailByMessageId(
        messageId,
        accessToken,
        refreshToken,
        orgId
      );
      results.push(result);

      // Rate limiting: wait 200ms between processing
      await new Promise((resolve) => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Error processing message ${messageId}:`, error);
      // Continue with other messages
    }
  }

  return results;
}

/**
 * Sync all unread emails from Gmail
 */
export async function syncUnreadEmails(
  accessToken: string,
  refreshToken: string,
  orgId: string
): Promise<{ processed: number; errors: number }> {
  try {
    const gmail = gmailClient.getGmailAPI({ accessToken, refreshToken });

    // Fetch unread messages
    const response = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 50,
    });

    const messages = response.data.messages || [];
    const messageIds = messages.map((m) => m.id!).filter(Boolean);

    // Process all messages
    const results = await batchProcessEmails(messageIds, accessToken, refreshToken, orgId);

    return {
      processed: results.length,
      errors: messageIds.length - results.length,
    };
  } catch (error) {
    console.error("Error syncing unread emails:", error);
    throw error;
  }
}
