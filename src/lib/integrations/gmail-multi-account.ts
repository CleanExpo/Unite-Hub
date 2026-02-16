import { google } from "googleapis";
import { db } from "@/lib/db";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.NEXT_PUBLIC_URL}/api/integrations/gmail/callback`
);

/**
 * Generate Gmail OAuth URL with account selection prompt
 */
export async function getGmailAuthUrl(state: string) {
  const scopes = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/gmail.modify",
    "https://www.googleapis.com/auth/userinfo.email", // Get email address
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state,
    prompt: "select_account", // Allow user to select which Google account to use
  });

  return url;
}

/**
 * Handle Gmail OAuth callback and create/update integration
 * Supports multiple Gmail accounts per workspace
 */
export async function handleGmailCallback(
  code: string,
  orgId: string,
  workspaceId: string
) {
  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    // Set credentials to get user info
    oauth2Client.setCredentials(tokens);

    // Get Gmail profile to get email address
    const gmail = google.gmail({ version: "v1", auth: oauth2Client });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const emailAddress = profile.data.emailAddress;

    if (!emailAddress) {
      throw new Error("Could not retrieve email address from Gmail");
    }

    // Check if this email is already connected to this workspace
    const existingIntegration = await db.emailIntegrations.getByEmail(
      workspaceId,
      "gmail",
      emailAddress
    );

    if (existingIntegration) {
      // Update existing integration with new tokens
      await db.emailIntegrations.update(existingIntegration.id, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token || existingIntegration.refresh_token,
        token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        is_active: true,
        sync_error: null, // Clear any previous errors
      });

      return existingIntegration;
    }

    // Check if this is the first integration for this workspace
    const existingIntegrations = await db.emailIntegrations.getByWorkspace(workspaceId);
    const isFirstAccount = existingIntegrations.length === 0;

    // Create new integration
    const integration = await db.emailIntegrations.create({
      workspace_id: workspaceId,
      org_id: orgId,
      provider: "gmail",
      email_address: emailAddress,
      account_label: isFirstAccount ? "Primary Gmail" : null, // Default label for first account
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      token_expires_at: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      is_primary: isFirstAccount, // First account is primary by default
      sync_enabled: true,
      is_active: true,
    });

    return integration;
  } catch (error) {
    console.error("Gmail callback error:", error);
    throw error;
  }
}

/**
 * Sync emails from a specific Gmail account
 */
export async function syncGmailEmails(integrationId: string) {
  try {
    const integration = await db.emailIntegrations.getById(integrationId);

    if (!integration) {
      throw new Error("Integration not found");
    }

    if (!integration.sync_enabled) {
      return { imported: 0, total: 0, skipped: true };
    }

    // Refresh token if needed
    if (integration.token_expires_at && new Date() > integration.token_expires_at) {
      await refreshGmailToken(integrationId);
      // Re-fetch integration with new tokens
      const updatedIntegration = await db.emailIntegrations.getById(integrationId);
      if (updatedIntegration) {
        oauth2Client.setCredentials({
          access_token: updatedIntegration.access_token,
          refresh_token: updatedIntegration.refresh_token,
        });
      }
    } else {
      oauth2Client.setCredentials({
        access_token: integration.access_token,
        refresh_token: integration.refresh_token,
      });
    }

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
      if (!message.id) continue;

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

        // Create email record with integration_id to track which account received it
        await db.emails.create({
          workspace_id: integration.workspace_id,
          contact_id: contact.id,
          integration_id: integrationId, // Track which account received this email
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

    // Update last sync time and clear errors
    await db.emailIntegrations.update(integrationId, {
      last_sync_at: new Date(),
      sync_error: null,
    });

    return { imported, total: messages.length };
  } catch (error: unknown) {
    console.error("Gmail sync error:", error);

    // Store error message
    await db.emailIntegrations.update(integrationId, {
      sync_error: error.message || "Unknown sync error",
    });

    throw error;
  }
}

/**
 * Sync emails from ALL enabled Gmail accounts in a workspace
 */
export async function syncAllGmailAccounts(workspaceId: string) {
  const integrations = await db.emailIntegrations.getByWorkspace(workspaceId);
  const gmailIntegrations = integrations.filter(
    (i) => i.provider === "gmail" && i.sync_enabled && i.is_active
  );

  const results = [];

  for (const integration of gmailIntegrations) {
    try {
      const result = await syncGmailEmails(integration.id);
      results.push({
        integrationId: integration.id,
        email: integration.email_address,
        ...result,
      });
    } catch (error: unknown) {
      results.push({
        integrationId: integration.id,
        email: integration.email_address,
        error: error.message,
      });
    }
  }

  return results;
}

/**
 * Send email via specific Gmail account (or primary if not specified)
 */
export async function sendEmailViaGmail(
  workspaceId: string,
  to: string,
  subject: string,
  body: string,
  options?: {
    integrationId?: string; // Specific account to send from
    contactId?: string; // For tracking
    trackingPixelId?: string; // For open tracking
  }
) {
  try {
    let integration;

    if (options?.integrationId) {
      // Use specific integration
      integration = await db.emailIntegrations.getById(options.integrationId);
    } else {
      // Use primary integration
      integration = await db.emailIntegrations.getPrimary(workspaceId);
    }

    if (!integration) {
      throw new Error("No Gmail integration found");
    }

    if (!integration.is_active) {
      throw new Error("Gmail account is disconnected");
    }

    oauth2Client.setCredentials({
      access_token: integration.access_token,
      refresh_token: integration.refresh_token,
    });

    const gmail = google.gmail({ version: "v1", auth: oauth2Client });

    // Add tracking pixel if provided
    let emailBody = body;
    if (options?.trackingPixelId) {
      emailBody += `\n\n<img src="${process.env.NEXT_PUBLIC_URL}/api/tracking/pixel/${options.trackingPixelId}" width="1" height="1" alt="" />`;
    }

    const message = [
      `From: me`,
      `To: ${to}`,
      `Subject: ${subject}`,
      "Content-Type: text/html; charset=UTF-8",
      "",
      emailBody,
    ].join("\n");

    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });

    // Track sent email
    if (options?.contactId) {
      await db.sentEmails.create({
        workspace_id: workspaceId,
        contact_id: options.contactId,
        integration_id: integration.id,
        from_email: integration.email_address,
        to_email: to,
        subject,
        body: emailBody,
        gmail_message_id: result.data.id || null,
        gmail_thread_id: result.data.threadId || null,
      });
    }

    return {
      messageId: result.data.id,
      threadId: result.data.threadId,
      sentFrom: integration.email_address,
    };
  } catch (error) {
    console.error("Send email error:", error);
    throw error;
  }
}

/**
 * Refresh Gmail OAuth token
 */
export async function refreshGmailToken(integrationId: string) {
  try {
    const integration = await db.emailIntegrations.getById(integrationId);

    if (!integration?.refresh_token) {
      throw new Error("No refresh token available");
    }

    oauth2Client.setCredentials({
      refresh_token: integration.refresh_token,
    });

    const { credentials } = await oauth2Client.refreshAccessToken();

    await db.emailIntegrations.update(integrationId, {
      access_token: credentials.access_token || integration.access_token,
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
 * Update integration account label
 */
export async function updateAccountLabel(
  integrationId: string,
  label: string
) {
  await db.emailIntegrations.update(integrationId, {
    account_label: label,
  });
}

/**
 * Set primary account for a workspace
 */
export async function setPrimaryAccount(
  workspaceId: string,
  integrationId: string
) {
  // The database trigger will handle unsetting other primaries
  await db.emailIntegrations.update(integrationId, {
    is_primary: true,
  });
}

/**
 * Toggle sync enabled for an account
 */
export async function toggleSync(
  integrationId: string,
  enabled: boolean
) {
  await db.emailIntegrations.update(integrationId, {
    sync_enabled: enabled,
  });
}

/**
 * Disconnect a Gmail account
 */
export async function disconnectGmailAccount(integrationId: string) {
  await db.emailIntegrations.update(integrationId, {
    is_active: false,
    sync_enabled: false,
  });
}
