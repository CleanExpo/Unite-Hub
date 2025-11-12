import { gmailClient } from "./client";

/**
 * Gmail Email Sender
 * Send emails via Gmail API
 */

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  bodyHtml?: string;
  bodyPlain?: string;
  replyTo?: string;
  inReplyTo?: string;
  references?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: string; // Base64 encoded
  mimeType: string;
}

export interface SentEmailResult {
  messageId: string;
  threadId: string;
}

/**
 * Send email via Gmail API
 */
export async function sendEmail(
  accessToken: string,
  refreshToken: string,
  options: EmailOptions
): Promise<SentEmailResult> {
  try {
    const gmail = gmailClient.getGmailAPI({ accessToken, refreshToken });

    // Build email message
    const message = buildEmailMessage(options);

    // Encode message
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    // Send email
    const response = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        threadId: options.inReplyTo ? undefined : undefined, // Will auto-thread if inReplyTo is set
      },
    });

    return {
      messageId: response.data.id!,
      threadId: response.data.threadId!,
    };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email via Gmail");
  }
}

/**
 * Build RFC 2822 formatted email message
 */
function buildEmailMessage(options: EmailOptions): string {
  const boundary = "boundary_" + Date.now() + "_" + Math.random().toString(36);
  const lines: string[] = [];

  // Headers
  lines.push(`From: me`);
  lines.push(`To: ${formatAddresses(options.to)}`);

  if (options.cc) {
    lines.push(`Cc: ${formatAddresses(options.cc)}`);
  }

  if (options.bcc) {
    lines.push(`Bcc: ${formatAddresses(options.bcc)}`);
  }

  lines.push(`Subject: ${options.subject}`);

  if (options.replyTo) {
    lines.push(`Reply-To: ${options.replyTo}`);
  }

  if (options.inReplyTo) {
    lines.push(`In-Reply-To: ${options.inReplyTo}`);
  }

  if (options.references) {
    lines.push(`References: ${options.references}`);
  }

  // MIME headers
  lines.push(`MIME-Version: 1.0`);
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push(``);

  // Body parts
  if (options.bodyPlain) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: text/plain; charset="UTF-8"`);
    lines.push(`Content-Transfer-Encoding: 7bit`);
    lines.push(``);
    lines.push(options.bodyPlain);
    lines.push(``);
  }

  if (options.bodyHtml) {
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: text/html; charset="UTF-8"`);
    lines.push(`Content-Transfer-Encoding: 7bit`);
    lines.push(``);
    lines.push(options.bodyHtml);
    lines.push(``);
  }

  // Attachments
  if (options.attachments) {
    for (const attachment of options.attachments) {
      lines.push(`--${boundary}`);
      lines.push(`Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`);
      lines.push(`Content-Disposition: attachment; filename="${attachment.filename}"`);
      lines.push(`Content-Transfer-Encoding: base64`);
      lines.push(``);
      lines.push(attachment.content);
      lines.push(``);
    }
  }

  lines.push(`--${boundary}--`);

  return lines.join("\r\n");
}

/**
 * Format email addresses
 */
function formatAddresses(addresses: string | string[]): string {
  if (Array.isArray(addresses)) {
    return addresses.join(", ");
  }
  return addresses;
}

/**
 * Send auto-reply email
 */
export async function sendAutoReply(
  accessToken: string,
  refreshToken: string,
  originalMessageId: string,
  originalThreadId: string,
  recipientEmail: string,
  subject: string,
  body: string
): Promise<SentEmailResult> {
  return sendEmail(accessToken, refreshToken, {
    to: recipientEmail,
    subject: `Re: ${subject}`,
    bodyHtml: body,
    bodyPlain: body.replace(/<[^>]*>/g, ""),
    inReplyTo: originalMessageId,
    references: originalMessageId,
  });
}

/**
 * Send bulk emails
 */
export async function sendBulkEmails(
  accessToken: string,
  refreshToken: string,
  emails: EmailOptions[]
): Promise<SentEmailResult[]> {
  const results: SentEmailResult[] = [];

  for (const email of emails) {
    try {
      const result = await sendEmail(accessToken, refreshToken, email);
      results.push(result);

      // Rate limiting: wait 100ms between emails
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Error sending bulk email to ${email.to}:`, error);
      // Continue with other emails
    }
  }

  return results;
}

/**
 * Add tracking pixel to email body
 */
export function addTrackingPixel(bodyHtml: string, trackingUrl: string): string {
  const pixel = `<img src="${trackingUrl}" width="1" height="1" alt="" style="display:none;" />`;
  return bodyHtml + pixel;
}
