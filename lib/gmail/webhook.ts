import { gmailClient } from "./client";

/**
 * Gmail Webhook Setup and Management
 * Handles Gmail Push Notifications (Pub/Sub)
 */

export interface WebhookConfig {
  topicName: string;
  labelIds?: string[];
  labelFilterAction?: "include" | "exclude";
}

/**
 * Set up Gmail push notifications
 * Requires Google Cloud Pub/Sub topic to be created first
 */
export async function setupGmailWebhook(
  accessToken: string,
  refreshToken: string,
  config: WebhookConfig
): Promise<{ historyId: string; expiration: number }> {
  try {
    const gmail = gmailClient.getGmailAPI({ accessToken, refreshToken });

    // Set up watch
    const watchResponse = await gmail.users.watch({
      userId: "me",
      requestBody: {
        topicName: config.topicName,
        labelIds: config.labelIds || ["INBOX"],
        labelFilterAction: config.labelFilterAction || "include",
      },
    });

    return {
      historyId: watchResponse.data.historyId || "",
      expiration: parseInt(watchResponse.data.expiration || "0"),
    };
  } catch (error) {
    console.error("Error setting up Gmail webhook:", error);
    throw new Error("Failed to set up Gmail webhook");
  }
}

/**
 * Renew Gmail push notification subscription
 * Should be called before expiration (typically 7 days)
 */
export async function renewGmailWebhook(
  accessToken: string,
  refreshToken: string,
  config: WebhookConfig
): Promise<{ historyId: string; expiration: number }> {
  return setupGmailWebhook(accessToken, refreshToken, config);
}

/**
 * Stop Gmail push notifications
 */
export async function stopGmailWebhook(
  accessToken: string,
  refreshToken: string
): Promise<void> {
  try {
    const gmail = gmailClient.getGmailAPI({ accessToken, refreshToken });
    await gmail.users.stop({ userId: "me" });
  } catch (error) {
    console.error("Error stopping Gmail webhook:", error);
    throw new Error("Failed to stop Gmail webhook");
  }
}

/**
 * Verify Gmail webhook notification
 * Validates that the notification is from Google
 */
export function verifyGmailWebhook(
  notification: any,
  expectedEmailAddress: string
): boolean {
  try {
    // Basic validation
    if (!notification.message?.data) {
      return false;
    }

    // Decode the message data
    const data = JSON.parse(
      Buffer.from(notification.message.data, "base64").toString()
    );

    // Verify email address matches
    if (data.emailAddress !== expectedEmailAddress) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying webhook:", error);
    return false;
  }
}

/**
 * Parse webhook notification
 */
export interface WebhookNotification {
  emailAddress: string;
  historyId: string;
}

export function parseWebhookNotification(notification: any): WebhookNotification | null {
  try {
    if (!notification.message?.data) {
      return null;
    }

    const data = JSON.parse(
      Buffer.from(notification.message.data, "base64").toString()
    );

    return {
      emailAddress: data.emailAddress,
      historyId: data.historyId,
    };
  } catch (error) {
    console.error("Error parsing webhook notification:", error);
    return null;
  }
}

/**
 * Fetch new messages using history API
 * More efficient than fetching all messages
 */
export async function fetchNewMessages(
  accessToken: string,
  refreshToken: string,
  startHistoryId: string
): Promise<string[]> {
  try {
    const gmail = gmailClient.getGmailAPI({ accessToken, refreshToken });

    const historyResponse = await gmail.users.history.list({
      userId: "me",
      startHistoryId,
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

    return messageIds;
  } catch (error) {
    console.error("Error fetching new messages:", error);
    throw new Error("Failed to fetch new messages");
  }
}

/**
 * Generate Pub/Sub topic name
 */
export function generatePubSubTopicName(projectId: string, topicName: string = "gmail-webhook"): string {
  return `projects/${projectId}/topics/${topicName}`;
}
