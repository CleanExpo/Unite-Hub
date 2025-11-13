/**
 * Gmail API Integration for Unite-Hub
 *
 * Complete email ingestion system with OAuth, parsing, webhooks, and sending.
 *
 * @example
 * import { gmailClient, parseGmailMessage, sendEmail } from '@/lib/gmail';
 *
 * // Initialize client
 * const gmail = gmailClient.getGmailAPI({ accessToken, refreshToken });
 *
 * // Parse email
 * const parsed = parseGmailMessage(message);
 *
 * // Send email
 * await sendEmail(accessToken, refreshToken, options);
 */

export * from "./client";
export * from "./parser";
export * from "./webhook";
export * from "./sender";
export * from "./storage";
export * from "./processor";
