import { google } from "googleapis";
import { db } from "@/lib/db";
import { CredentialVault } from "@/server/credentialVault";

/**
 * Token encryption helpers for secure OAuth token storage
 * Uses CredentialVault with AES-256-GCM encryption
 */
async function encryptAndStoreTokens(
  orgId: string,
  integrationId: string,
  tokens: { accessToken: string; refreshToken?: string | null; expiryDate?: number | null }
): Promise<void> {
  const tokenData = {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  };

  const result = await CredentialVault.set(
    orgId,
    "gsc_oauth", // Using gsc_oauth type for Google OAuth tokens
    `gmail_integration_${integrationId}`,
    tokenData,
    tokens.expiryDate ? new Date(tokens.expiryDate) : undefined
  );

  if (!result.success) {
    console.error("[gmail] Failed to encrypt tokens:", result.error);
    throw new Error(`Failed to secure token storage: ${result.error}`);
  }
}

async function getDecryptedTokens(
  orgId: string,
  integrationId: string
): Promise<{ access_token: string; refresh_token?: string; expiry_date?: number } | null> {
  // Find credential by label
  const listResult = await CredentialVault.list(orgId);
  if (!listResult.success || !listResult.credentials) {
    return null;
  }

  const credential = listResult.credentials.find(
    (c) => c.label === `gmail_integration_${integrationId}`
  );

  if (!credential) {
    return null;
  }

  const result = await CredentialVault.get(orgId, credential.id);
  if (!result.success || !result.credential) {
    console.error("[gmail] Failed to decrypt tokens:", result.error);
    return null;
  }

  return result.credential.data;
}

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`
);

export async function getGmailAuthUrl(state: string) {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/calendar",
    "https://www.googleapis.com/auth/calendar.events",
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "consent",
  });

  return url;
}

export async function handleGmailCallback(
  code: string,
  orgId: string
) {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    // Store integration (without plaintext tokens)
    const integration = await db.emailIntegrations.create({
      org_id: orgId,
      provider: "gmail",
      account_email: "", // Will be populated after first sync
      access_token: "[ENCRYPTED]", // Placeholder - tokens stored in vault
      refresh_token: "[ENCRYPTED]", // Placeholder - tokens stored in vault
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      is_active: true,
    });

    // CRITICAL: Encrypt and store tokens in credential vault
    await encryptAndStoreTokens(orgId, integration.id, {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });

    // Set credentials for profile lookup
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    // Get user info to store email
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });

    await db.emailIntegrations.update(integration.id, {
      account_email: profile.data.emailAddress,
    });

    return integration;
  } catch (error) {
    console.error("Gmail callback error:", error);
    throw error;
  }
}

export async function syncGmailEmails(integrationId: string) {
  try {
    const integration = await db.emailIntegrations.getById(integrationId);

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get decrypted tokens from vault
    const tokens = await getDecryptedTokens(integration.org_id, integrationId);
    if (!tokens) {
      throw new Error("Failed to retrieve encrypted tokens");
    }

    // Refresh token if needed
    if (integration.token_expires_at && new Date() > integration.token_expires_at) {
      await refreshGmailToken(integrationId);
      // Re-fetch tokens after refresh
      const refreshedTokens = await getDecryptedTokens(integration.org_id, integrationId);
      if (refreshedTokens) {
        Object.assign(tokens, refreshedTokens);
      }
    }

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get unread emails
    const messageList = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 20,
    });

    const messages = messageList.data.messages || [];
    let imported = 0;

    for (const message of messages) {
      if (!message.id) {
continue;
}

      try {
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });

        const headers = fullMessage.data.payload?.headers || [];
        const from = headers.find((h) => h.name === "From")?.value || "";
        const to = headers.find((h) => h.name === "To")?.value || "";
        const subject = headers.find((h) => h.name === "Subject")?.value || "";
        const date = headers.find((h) => h.name === "Date")?.value || "";

        // Get email body
        let body = "";
        if (fullMessage.data.payload?.parts) {
          const textPart = fullMessage.data.payload.parts.find(
            (part) => part.mimeType === "text/plain"
          );
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, "base64").toString();
          }
        } else if (fullMessage.data.payload?.body?.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, "base64").toString();
        }

        // Extract email address from "Name <email>" format
        const emailMatch = from.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+)/);
        const senderEmail = emailMatch ? emailMatch[0] : from;
        const senderName = from.split("<")[0].trim();

        // Check if contact exists, create if not
        let contact = await db.contacts.getByEmail(senderEmail, integration.workspace_id);

        if (!contact) {
          contact = await db.contacts.create({
            workspace_id: integration.workspace_id,
            email: senderEmail,
            name: senderName,
            status: "contact",
            ai_score: 0,
          });
        }

        // Create email record in client_emails table
        await db.clientEmails.create({
          workspace_id: integration.workspace_id,
          org_id: integration.org_id,
          contact_id: contact.id,
          integration_id: integrationId,
          provider_message_id: message.id,
          from_email: senderEmail,
          to_emails: [to],
          subject,
          body_text: body,
          snippet: body.substring(0, 200),
          direction: "inbound",
          is_read: false,
          intelligence_analyzed: false, // Mark for AI analysis
          received_at: new Date(date),
        });

        // Mark as read in Gmail
        await gmail.users.messages.modify({
          userId: "me",
          id: message.id,
          requestBody: { removeLabelIds: ["UNREAD"] },
        });

        imported++;
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    // Update last sync time
    await db.emailIntegrations.update(integrationId, {
      last_sync_at: new Date(),
    });

    return { imported, total: messages.length };
  } catch (error) {
    console.error("Gmail sync error:", error);
    throw error;
  }
}

export async function sendEmailViaGmail(
  integrationId: string,
  to: string,
  subject: string,
  body: string,
  trackingPixelId?: string
) {
  try {
    const integration = await db.emailIntegrations.getById(integrationId);

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get decrypted tokens from vault
    const tokens = await getDecryptedTokens(integration.org_id, integrationId);
    if (!tokens) {
      throw new Error("Failed to retrieve encrypted tokens");
    }

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Add tracking pixel if provided
    let emailBody = body;
    if (trackingPixelId) {
      emailBody += `\n\n<img src="${process.env.NEXT_PUBLIC_URL}/api/tracking/pixel/${trackingPixelId}" width="1" height="1" alt="" />`;
    }

    const message = [
      `From: me`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      emailBody,
    ].join("\n");

    const encodedMessage = Buffer.from(message).toString("base64");

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    return {
      messageId: result.data.id,
      threadId: result.data.threadId,
    };
  } catch (error) {
    console.error("Send email error:", error);
    throw error;
  }
}

export async function refreshGmailToken(integrationId: string) {
  try {
    const integration = await db.emailIntegrations.getById(integrationId);

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get decrypted tokens from vault
    const tokens = await getDecryptedTokens(integration.org_id, integrationId);
    if (!tokens?.refresh_token) {
      throw new Error("No refresh token available");
    }

    oauth2Client.setCredentials({
      refresh_token: tokens.refresh_token,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    // Update encrypted tokens in vault
    await encryptAndStoreTokens(integration.org_id, integrationId, {
      accessToken: credentials.access_token!,
      refreshToken: tokens.refresh_token, // Keep existing refresh token
      expiryDate: credentials.expiry_date,
    });

    // Update expiry in integration record (tokens are encrypted in vault)
    await db.emailIntegrations.update(integrationId, {
      token_expires_at: credentials.expiry_date
        ? new Date(credentials.expiry_date)
        : null,
    });

    return credentials;
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
}

/**
 * Sync Gmail emails and create client_email records for multi-email support
 * This allows contacts to have multiple email addresses tracked in client_emails table
 */
export async function syncGmailEmailsWithMultiple(integrationId: string) {
  try {
    const integration = await db.emailIntegrations.getById(integrationId);

    if (!integration) {
      throw new Error("Integration not found");
    }

    // Get decrypted tokens from vault
    const tokens = await getDecryptedTokens(integration.org_id, integrationId);
    if (!tokens) {
      throw new Error("Failed to retrieve encrypted tokens");
    }

    // Refresh token if needed
    if (integration.token_expires_at && new Date() > integration.token_expires_at) {
      await refreshGmailToken(integrationId);
      // Re-fetch tokens after refresh
      const refreshedTokens = await getDecryptedTokens(integration.org_id, integrationId);
      if (refreshedTokens) {
        Object.assign(tokens, refreshedTokens);
      }
    }

    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Get unread emails
    const messageList = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread",
      maxResults: 20,
    });

    const messages = messageList.data.messages || [];
    let imported = 0;

    for (const message of messages) {
      if (!message.id) {
continue;
}

      try {
        const fullMessage = await gmail.users.messages.get({
          userId: "me",
          id: message.id,
          format: "full",
        });

        const headers = fullMessage.data.payload?.headers || [];
        const from = headers.find((h) => h.name === "From")?.value || "";
        const to = headers.find((h) => h.name === "To")?.value || "";
        const subject = headers.find((h) => h.name === "Subject")?.value || "";
        const date = headers.find((h) => h.name === "Date")?.value || "";

        // Get email body
        let body = "";
        if (fullMessage.data.payload?.parts) {
          const textPart = fullMessage.data.payload.parts.find(
            (part) => part.mimeType === "text/plain"
          );
          if (textPart?.body?.data) {
            body = Buffer.from(textPart.body.data, "base64").toString();
          }
        } else if (fullMessage.data.payload?.body?.data) {
          body = Buffer.from(fullMessage.data.payload.body.data, "base64").toString();
        }

        // Extract email address from "Name <email>" format
        const emailMatch = from.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+)/);
        const senderEmail = emailMatch ? emailMatch[0] : from;
        const senderName = from.split("<")[0].trim();

        // Check if contact exists via client_emails table
        let clientEmail = await db.clientEmails.getByEmail(senderEmail, integration.workspace_id);
        let contact;

        if (!clientEmail) {
          // Create new contact with primary email
          contact = await db.contacts.create({
            workspace_id: integration.workspace_id,
            email: senderEmail,
            name: senderName,
            status: "contact",
            ai_score: 0,
            email_count: 1,
          });

          // Create client_email record
          const newClientEmail = await db.clientEmails.create({
            contact_id: contact.id,
            email: senderEmail,
            email_type: "work", // Default to work email
            is_primary: true,
            is_verified: true,
            is_active: true,
            bounce_count: 0,
            last_contacted: new Date(),
          });

          clientEmail = newClientEmail;
        } else {
          // Update last contacted on existing client_email
          await db.clientEmails.recordContact(clientEmail.id);
          contact = await db.contacts.getById(clientEmail.contact_id);
        }

        // Create email record linked to client_email
        await db.emails.create({
          workspace_id: integration.workspace_id,
          contact_id: contact.id,
          client_email_id: clientEmail.id, // Link to specific client_email
          from_email: senderEmail,
          to_email: to,
          subject,
          body,
          is_processed: false,
          received_at: new Date(date),
        });

        // Mark as read in Gmail
        await gmail.users.messages.modify({
          userId: "me",
          id: message.id,
          requestBody: { removeLabelIds: ["UNREAD"] },
        });

        imported++;
      } catch (error) {
        console.error(`Error processing message ${message.id}:`, error);
      }
    }

    // Update last sync time
    await db.emailIntegrations.update(integrationId, {
      last_sync_at: new Date(),
    });

    return { imported, total: messages.length };
  } catch (error) {
    console.error("Gmail sync with multiple emails error:", error);
    throw error;
  }
}
