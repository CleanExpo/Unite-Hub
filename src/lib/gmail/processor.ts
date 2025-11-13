import { gmailClient, parseGmailMessage, downloadAttachment } from "./index";
import { uploadAttachments } from "./storage";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

/**
 * Email Processing Pipeline
 * Complete workflow for ingesting and processing emails
 */

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

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
    const emailThreadId = await convex.mutation(api.emailThreads.create, {
      clientId,
      senderEmail: parsedEmail.senderEmail,
      senderName: parsedEmail.senderName,
      subject: parsedEmail.subject,
      messageBody: parsedEmail.bodyHtml || parsedEmail.bodyPlain,
      messageBodyPlain: parsedEmail.bodyPlain,
      attachments: uploadedAttachments,
      receivedAt: parsedEmail.receivedAt,
      autoReplySent: false,
      gmailMessageId: parsedEmail.messageId,
      gmailThreadId: parsedEmail.threadId,
      isRead: false,
    });

    return {
      emailThreadId,
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
    // Check if email exists in clientEmails
    const clientEmail = await convex.query(api.clientEmails.getByEmail, {
      emailAddress: email,
    });

    if (clientEmail) {
      // Update last contact time
      await convex.mutation(api.clientEmails.updateLastContact, {
        id: clientEmail._id,
      });

      return {
        clientId: clientEmail.clientId,
        isNewClient: false,
      };
    }

    // Create new client
    const clientId = await convex.mutation(api.clients.create, {
      orgId,
      clientName: name,
      businessName: name,
      businessDescription: "Auto-created from email",
      packageTier: "starter",
      status: "onboarding",
      primaryEmail: email,
      phoneNumbers: [],
    });

    // Create client email record
    await convex.mutation(api.clientEmails.create, {
      clientId,
      emailAddress: email,
      isPrimary: true,
      label: "work",
      verified: false,
    });

    return {
      clientId,
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
