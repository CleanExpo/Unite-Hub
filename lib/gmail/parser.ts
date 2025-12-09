import { gmail_v1 } from "googleapis";

/**
 * Email Parser for Gmail API
 * Extracts sender, subject, body, and attachments from Gmail messages
 */

export interface ParsedEmail {
  messageId: string;
  threadId: string;
  senderEmail: string;
  senderName: string;
  subject: string;
  bodyHtml: string;
  bodyPlain: string;
  receivedAt: number;
  attachments: EmailAttachment[];
  headers: EmailHeaders;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: string; // Base64 encoded data
}

export interface EmailHeaders {
  from: string;
  to: string;
  cc?: string;
  bcc?: string;
  replyTo?: string;
  date: string;
  messageId: string;
  inReplyTo?: string;
  references?: string;
}

/**
 * Parse Gmail message into structured format
 */
export function parseGmailMessage(
  message: gmail_v1.Schema$Message
): ParsedEmail {
  const headers = extractHeaders(message);
  const { senderEmail, senderName } = parseSenderInfo(headers.from);
  const { bodyHtml, bodyPlain } = extractBody(message);
  const attachments = extractAttachments(message);

  return {
    messageId: message.id!,
    threadId: message.threadId!,
    senderEmail,
    senderName,
    subject: headers.messageId || "(No Subject)",
    bodyHtml,
    bodyPlain,
    receivedAt: message.internalDate ? parseInt(message.internalDate) : Date.now(),
    attachments,
    headers,
  };
}

/**
 * Extract headers from Gmail message
 */
function extractHeaders(message: gmail_v1.Schema$Message): EmailHeaders {
  const headers = message.payload?.headers || [];

  const getHeader = (name: string): string => {
    const header = headers.find((h) => h.name?.toLowerCase() === name.toLowerCase());
    return header?.value || "";
  };

  return {
    from: getHeader("From"),
    to: getHeader("To"),
    cc: getHeader("Cc") || undefined,
    bcc: getHeader("Bcc") || undefined,
    replyTo: getHeader("Reply-To") || undefined,
    date: getHeader("Date"),
    messageId: getHeader("Subject"),
    inReplyTo: getHeader("In-Reply-To") || undefined,
    references: getHeader("References") || undefined,
  };
}

/**
 * Parse sender information from "From" header
 */
function parseSenderInfo(from: string): { senderEmail: string; senderName: string } {
  // Handle formats: "Name <email@example.com>" or "email@example.com"
  const emailMatch = from.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/);
  const senderEmail = emailMatch ? emailMatch[1] : from;

  let senderName = "";
  if (from.includes("<")) {
    senderName = from.split("<")[0].trim().replace(/"/g, "");
  } else {
    senderName = senderEmail.split("@")[0];
  }

  return { senderEmail, senderName };
}

/**
 * Extract email body (HTML and plain text)
 */
function extractBody(message: gmail_v1.Schema$Message): { bodyHtml: string; bodyPlain: string } {
  let bodyHtml = "";
  let bodyPlain = "";

  const payload = message.payload;
  if (!payload) {
return { bodyHtml, bodyPlain };
}

  // Single part message
  if (payload.body?.data && !payload.parts) {
    const decoded = decodeBase64(payload.body.data);
    if (payload.mimeType === "text/html") {
      bodyHtml = decoded;
    } else {
      bodyPlain = decoded;
    }
    return { bodyHtml, bodyPlain };
  }

  // Multipart message
  if (payload.parts) {
    extractBodyFromParts(payload.parts, (mimeType, content) => {
      if (mimeType === "text/html") {
        bodyHtml = content;
      } else if (mimeType === "text/plain") {
        bodyPlain = content;
      }
    });
  }

  // If no plain text, convert HTML to plain text (simple conversion)
  if (!bodyPlain && bodyHtml) {
    bodyPlain = htmlToPlainText(bodyHtml);
  }

  return { bodyHtml, bodyPlain };
}

/**
 * Recursively extract body from message parts
 */
function extractBodyFromParts(
  parts: gmail_v1.Schema$MessagePart[],
  callback: (mimeType: string, content: string) => void
) {
  for (const part of parts) {
    if (part.mimeType === "text/html" || part.mimeType === "text/plain") {
      if (part.body?.data) {
        callback(part.mimeType, decodeBase64(part.body.data));
      }
    }

    // Recursively process nested parts
    if (part.parts) {
      extractBodyFromParts(part.parts, callback);
    }
  }
}

/**
 * Extract attachments from Gmail message
 */
function extractAttachments(message: gmail_v1.Schema$Message): EmailAttachment[] {
  const attachments: EmailAttachment[] = [];
  const payload = message.payload;

  if (!payload?.parts) {
return attachments;
}

  const extractFromParts = (parts: gmail_v1.Schema$MessagePart[]) => {
    for (const part of parts) {
      // Check if part is an attachment
      if (part.filename && part.body?.attachmentId) {
        attachments.push({
          filename: part.filename,
          mimeType: part.mimeType || "application/octet-stream",
          size: part.body.size || 0,
          attachmentId: part.body.attachmentId,
        });
      }

      // Recursively check nested parts
      if (part.parts) {
        extractFromParts(part.parts);
      }
    }
  };

  extractFromParts(payload.parts);
  return attachments;
}

/**
 * Decode base64-encoded data
 */
function decodeBase64(data: string): string {
  try {
    // Gmail uses URL-safe base64 encoding
    const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
    return Buffer.from(base64, "base64").toString("utf-8");
  } catch (error) {
    console.error("Error decoding base64:", error);
    return "";
  }
}

/**
 * Simple HTML to plain text conversion
 */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<style[^>]*>.*?<\/style>/gi, "")
    .replace(/<script[^>]*>.*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/\n\s*\n\s*\n/g, "\n\n")
    .trim();
}

/**
 * Download attachment data
 */
export async function downloadAttachment(
  gmail: gmail_v1.Gmail,
  messageId: string,
  attachmentId: string
): Promise<string> {
  try {
    const response = await gmail.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });

    return response.data.data || "";
  } catch (error) {
    console.error("Error downloading attachment:", error);
    throw new Error("Failed to download attachment");
  }
}
