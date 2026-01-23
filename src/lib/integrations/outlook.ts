import { Client } from "@microsoft/microsoft-graph-client";
import { db } from "@/lib/db";
import { CredentialVault } from "@/server/credentialVault";

/**
 * Token encryption helpers for secure OAuth token storage
 * Uses CredentialVault with AES-256-GCM encryption
 */
async function encryptAndStoreTokens(
  orgId: string,
  integrationId: string,
  tokens: { accessToken: string; refreshToken?: string | null; expiryDate?: Date | null }
): Promise<void> {
  const tokenData = {
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate?.getTime(),
  };

  const result = await CredentialVault.set(
    orgId,
    "custom", // Using custom type for Outlook OAuth tokens
    `outlook_integration_${integrationId}`,
    tokenData,
    tokens.expiryDate || undefined
  );

  if (!result.success) {
    console.error("[outlook] Failed to encrypt tokens:", result.error);
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
    (c) => c.label === `outlook_integration_${integrationId}`
  );

  if (!credential) {
    return null;
  }

  const result = await CredentialVault.get(orgId, credential.id);
  if (!result.success || !result.credential) {
    console.error("[outlook] Failed to decrypt tokens:", result.error);
    return null;
  }

  return result.credential.data;
}

// Microsoft OAuth configuration
const MICROSOFT_AUTH_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize";
const MICROSOFT_TOKEN_ENDPOINT = "https://login.microsoftonline.com/common/oauth2/v2.0/token";

const SCOPES = [
  "openid",
  "profile",
  "email",
  "offline_access",
  "https://graph.microsoft.com/Mail.Read",
  "https://graph.microsoft.com/Mail.ReadWrite",
  "https://graph.microsoft.com/Mail.Send",
  "https://graph.microsoft.com/Calendars.Read",
  "https://graph.microsoft.com/Calendars.ReadWrite",
];

/**
 * Generate Microsoft OAuth authorization URL
 */
export async function getOutlookAuthUrl(state: string) {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    response_type: "code",
    redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/integrations/outlook/callback`,
    response_mode: "query",
    scope: SCOPES.join(" "),
    state,
    prompt: "consent",
  });

  return `${MICROSOFT_AUTH_ENDPOINT}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 */
async function exchangeCodeForToken(code: string) {
  const params = new URLSearchParams({
    client_id: process.env.MICROSOFT_CLIENT_ID!,
    client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
    code,
    redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/integrations/outlook/callback`,
    grant_type: "authorization_code",
  });

  const response = await fetch(MICROSOFT_TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  return response.json();
}

/**
 * Handle OAuth callback and store integration
 */
export async function handleOutlookCallback(code: string, orgId: string) {
  try {
    // Exchange code for tokens
    const tokenData = await exchangeCodeForToken(code);

    if (!tokenData.access_token) {
      throw new Error("No access token received");
    }

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Get user email from Microsoft Graph
    const client = Client.init({
      authProvider: (done) => {
        done(null, tokenData.access_token);
      },
    });

    const userProfile = await client.api("/me").get();
    const accountEmail = userProfile.mail || userProfile.userPrincipalName;

    // Store integration (without plaintext tokens)
    const integration = await db.emailIntegrations.create({
      org_id: orgId,
      provider: "outlook",
      account_email: accountEmail,
      access_token: "[ENCRYPTED]", // Placeholder - tokens stored in vault
      refresh_token: "[ENCRYPTED]", // Placeholder - tokens stored in vault
      token_expires_at: expiresAt,
      is_active: true,
    });

    // CRITICAL: Encrypt and store tokens in credential vault
    await encryptAndStoreTokens(orgId, integration.id, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiryDate: expiresAt,
    });

    return integration;
  } catch (error) {
    console.error("Outlook callback error:", error);
    throw error;
  }
}

/**
 * Refresh Microsoft access token
 */
export async function refreshOutlookToken(integrationId: string) {
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

    const params = new URLSearchParams({
      client_id: process.env.MICROSOFT_CLIENT_ID!,
      client_secret: process.env.MICROSOFT_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token,
      grant_type: "refresh_token",
    });

    const response = await fetch(MICROSOFT_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Token refresh failed: ${error}`);
    }

    const tokenData = await response.json();
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000);

    // Update encrypted tokens in vault
    await encryptAndStoreTokens(integration.org_id, integrationId, {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token || tokens.refresh_token,
      expiryDate: expiresAt,
    });

    // Update expiry in integration record (tokens are encrypted in vault)
    await db.emailIntegrations.update(integrationId, {
      token_expires_at: expiresAt,
    });

    return {
      access_token: tokenData.access_token,
      expires_at: expiresAt,
    };
  } catch (error) {
    console.error("Token refresh error:", error);
    throw error;
  }
}

/**
 * Create Microsoft Graph client with auto token refresh
 */
async function createGraphClient(integrationId: string) {
  const integration = await db.emailIntegrations.getById(integrationId);

  if (!integration) {
    throw new Error("Integration not found");
  }

  // Get decrypted tokens from vault
  const tokens = await getDecryptedTokens(integration.org_id, integrationId);
  if (!tokens) {
    throw new Error("Failed to retrieve encrypted tokens");
  }

  // Refresh token if expired or expiring soon (within 5 minutes)
  const now = new Date();
  const expiresAt = integration.token_expires_at ? new Date(integration.token_expires_at) : null;
  const shouldRefresh = !expiresAt || expiresAt.getTime() - now.getTime() < 5 * 60 * 1000;

  let accessToken = tokens.access_token;

  if (shouldRefresh && tokens.refresh_token) {
    const refreshed = await refreshOutlookToken(integrationId);
    accessToken = refreshed.access_token;
  }

  return Client.init({
    authProvider: (done) => {
      done(null, accessToken);
    },
  });
}

/**
 * Sync Outlook emails and create contact records
 */
export async function syncOutlookEmails(integrationId: string) {
  try {
    const integration = await db.emailIntegrations.getById(integrationId);

    if (!integration) {
      throw new Error("Integration not found");
    }

    const client = await createGraphClient(integrationId);

    // Get unread emails from inbox
    const messages = await client
      .api("/me/mailFolders/inbox/messages")
      .select([
        "id",
        "subject",
        "from",
        "toRecipients",
        "receivedDateTime",
        "body",
        "isRead",
      ])
      .filter("isRead eq false")
      .top(20)
      .get();

    let imported = 0;

    for (const message of messages.value || []) {
      try {
        const from = message.from?.emailAddress?.address || "";
        const fromName = message.from?.emailAddress?.name || "";
        const toAddresses = message.toRecipients?.map((r: any) => r.emailAddress?.address).join(", ") || "";
        const subject = message.subject || "";
        const body = message.body?.content || "";
        const receivedAt = new Date(message.receivedDateTime);

        if (!from) {
continue;
}

        // Check if contact exists, create if not
        let contact = await db.contacts.getByEmail(from, integration.workspace_id);

        if (!contact) {
          contact = await db.contacts.create({
            workspace_id: integration.workspace_id,
            email: from,
            name: fromName,
            status: "contact",
            ai_score: 0,
          });
        }

        // Create email record
        await db.emails.create({
          workspace_id: integration.workspace_id,
          contact_id: contact.id,
          from_email: from,
          to_email: toAddresses,
          subject,
          body,
          is_processed: false,
          received_at: receivedAt,
        });

        // Mark as read in Outlook
        await client.api(`/me/messages/${message.id}`).patch({
          isRead: true,
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

    return { imported, total: messages.value?.length || 0 };
  } catch (error) {
    console.error("Outlook sync error:", error);
    throw error;
  }
}

/**
 * Sync Outlook emails with multi-email support (client_emails table)
 */
export async function syncOutlookEmailsWithMultiple(integrationId: string) {
  try {
    const integration = await db.emailIntegrations.getById(integrationId);

    if (!integration) {
      throw new Error("Integration not found");
    }

    const client = await createGraphClient(integrationId);

    // Get unread emails from inbox
    const messages = await client
      .api("/me/mailFolders/inbox/messages")
      .select([
        "id",
        "subject",
        "from",
        "toRecipients",
        "receivedDateTime",
        "body",
        "isRead",
      ])
      .filter("isRead eq false")
      .top(20)
      .get();

    let imported = 0;

    for (const message of messages.value || []) {
      try {
        const from = message.from?.emailAddress?.address || "";
        const fromName = message.from?.emailAddress?.name || "";
        const toAddresses = message.toRecipients?.map((r: any) => r.emailAddress?.address).join(", ") || "";
        const subject = message.subject || "";
        const body = message.body?.content || "";
        const receivedAt = new Date(message.receivedDateTime);

        if (!from) {
continue;
}

        // Check if contact exists via client_emails table
        let clientEmail = await db.clientEmails.getByEmail(from, integration.workspace_id);
        let contact;

        if (!clientEmail) {
          // Create new contact with primary email
          contact = await db.contacts.create({
            workspace_id: integration.workspace_id,
            email: from,
            name: fromName,
            status: "contact",
            ai_score: 0,
            email_count: 1,
          });

          // Create client_email record
          const newClientEmail = await db.clientEmails.create({
            contact_id: contact.id,
            email: from,
            email_type: "work",
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
          client_email_id: clientEmail.id,
          from_email: from,
          to_email: toAddresses,
          subject,
          body,
          is_processed: false,
          received_at: receivedAt,
        });

        // Mark as read in Outlook
        await client.api(`/me/messages/${message.id}`).patch({
          isRead: true,
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

    return { imported, total: messages.value?.length || 0 };
  } catch (error) {
    console.error("Outlook sync with multiple emails error:", error);
    throw error;
  }
}

/**
 * Send email via Outlook
 */
export async function sendEmailViaOutlook(
  integrationId: string,
  to: string,
  subject: string,
  body: string,
  trackingPixelId?: string
) {
  try {
    const client = await createGraphClient(integrationId);

    // Add tracking pixel if provided
    let emailBody = body;
    if (trackingPixelId) {
      emailBody += `\n\n<img src="${process.env.NEXT_PUBLIC_URL}/api/tracking/pixel/${trackingPixelId}" width="1" height="1" alt="" />`;
    }

    const message = {
      subject,
      body: {
        contentType: "HTML",
        content: emailBody,
      },
      toRecipients: [
        {
          emailAddress: {
            address: to,
          },
        },
      ],
    };

    const result = await client.api("/me/sendMail").post({
      message,
      saveToSentItems: true,
    });

    return {
      success: true,
      messageId: result?.id || "sent",
    };
  } catch (error) {
    console.error("Send email via Outlook error:", error);
    throw error;
  }
}

/**
 * Get calendar events from Outlook
 */
export async function getOutlookCalendarEvents(
  integrationId: string,
  startDate?: Date,
  endDate?: Date
) {
  try {
    const client = await createGraphClient(integrationId);

    const start = startDate || new Date();
    const end = endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    const events = await client
      .api("/me/calendar/calendarView")
      .query({
        startDateTime: start.toISOString(),
        endDateTime: end.toISOString(),
      })
      .select(["subject", "start", "end", "location", "attendees", "organizer"])
      .top(50)
      .get();

    return events.value || [];
  } catch (error) {
    console.error("Get calendar events error:", error);
    throw error;
  }
}

/**
 * Create calendar event in Outlook
 */
export async function createOutlookCalendarEvent(
  integrationId: string,
  event: {
    subject: string;
    start: Date;
    end: Date;
    location?: string;
    body?: string;
    attendees?: string[];
  }
) {
  try {
    const client = await createGraphClient(integrationId);

    const calendarEvent = {
      subject: event.subject,
      start: {
        dateTime: event.start.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: event.end.toISOString(),
        timeZone: "UTC",
      },
      location: event.location ? { displayName: event.location } : undefined,
      body: event.body
        ? {
            contentType: "HTML",
            content: event.body,
          }
        : undefined,
      attendees: event.attendees?.map((email) => ({
        emailAddress: {
          address: email,
        },
        type: "required",
      })),
    };

    const result = await client.api("/me/calendar/events").post(calendarEvent);

    return {
      id: result.id,
      webLink: result.webLink,
    };
  } catch (error) {
    console.error("Create calendar event error:", error);
    throw error;
  }
}
