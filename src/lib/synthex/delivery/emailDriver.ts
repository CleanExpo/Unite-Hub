/**
 * Email Driver for Synthex Delivery Engine
 * Phase: B6 - Synthex Outbound Delivery Engine
 *
 * Uses Resend as the primary email provider.
 * Supports HTML emails with template variable substitution.
 */

import { Resend } from 'resend';

// Lazy-load Resend client to avoid build-time initialization errors
let resendClient: Resend | null = null;

function getResendClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

// Types
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
  tags?: { name: string; value: string }[];
  headers?: Record<string, string>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
  provider: 'resend';
  timestamp: Date;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | undefined;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const timestamp = new Date();

  try {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const fromAddress = options.from || process.env.MAIL_FROM || 'noreply@synthex.io';

    const { data, error } = await getResendClient().emails.send({
      from: fromAddress,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      html: options.html,
      text: options.text,
      reply_to: options.replyTo,
      cc: options.cc,
      bcc: options.bcc,
      tags: options.tags,
      headers: options.headers,
    });

    if (error) {
      return {
        success: false,
        error: error.message,
        provider: 'resend',
        timestamp,
      };
    }

    return {
      success: true,
      messageId: data?.id,
      provider: 'resend',
      timestamp,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending email',
      provider: 'resend',
      timestamp,
    };
  }
}

/**
 * Replace template variables in content
 * Uses Handlebars-style {{variable}} syntax
 */
export function replaceTemplateVariables(
  content: string,
  variables: TemplateVariables
): string {
  let result = content;

  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(regex, String(value ?? ''));
  }

  return result;
}

/**
 * Send a templated email with variable substitution
 */
export async function sendTemplatedEmail(
  options: Omit<EmailOptions, 'html' | 'text'> & {
    htmlTemplate: string;
    textTemplate?: string;
    variables: TemplateVariables;
  }
): Promise<EmailResult> {
  const html = replaceTemplateVariables(options.htmlTemplate, options.variables);
  const text = options.textTemplate
    ? replaceTemplateVariables(options.textTemplate, options.variables)
    : undefined;

  return sendEmail({
    ...options,
    html,
    text,
  });
}

/**
 * Batch send emails (with rate limiting)
 */
export async function sendBatchEmails(
  emails: EmailOptions[],
  options: {
    delayMs?: number; // Delay between emails (default: 100ms)
    onProgress?: (sent: number, total: number) => void;
  } = {}
): Promise<{ results: EmailResult[]; successful: number; failed: number }> {
  const { delayMs = 100, onProgress } = options;
  const results: EmailResult[] = [];
  let successful = 0;
  let failed = 0;

  for (let i = 0; i < emails.length; i++) {
    const result = await sendEmail(emails[i]);
    results.push(result);

    if (result.success) {
      successful++;
    } else {
      failed++;
    }

    onProgress?.(i + 1, emails.length);

    // Rate limiting delay (except for last email)
    if (i < emails.length - 1 && delayMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return { results, successful, failed };
}

/**
 * Validate email address format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if Resend is configured
 */
export function isEmailConfigured(): boolean {
  return !!process.env.RESEND_API_KEY;
}
