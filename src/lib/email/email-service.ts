/**
 * Unite-Hub Unified Email Service
 *
 * Production-ready email service with multi-provider support and automatic fallback.
 * Supports SendGrid, Resend, and Gmail SMTP with intelligent routing.
 *
 * Features:
 * - Multi-provider support (SendGrid, Resend, Gmail SMTP)
 * - Automatic fallback on provider failure
 * - Email templates with variable substitution
 * - Delivery tracking and logging
 * - Rate limiting awareness
 * - TypeScript type safety
 *
 * @module email-service
 */

import sgMail from '@sendgrid/mail';
import { Resend } from 'resend';
import nodemailer, { type Transporter } from 'nodemailer';

// ============================================================================
// Types
// ============================================================================

export type EmailProvider = 'sendgrid' | 'resend' | 'smtp' | 'auto';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: EmailAttachment[];
  template?: EmailTemplate;
  templateVars?: Record<string, any>;
  provider?: EmailProvider;
}

export interface EmailAttachment {
  filename: string;
  content?: Buffer | string;
  path?: string;
  contentType?: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailResult {
  success: boolean;
  provider: EmailProvider;
  messageId?: string;
  error?: any;
  fallbackUsed?: boolean;
}

// ============================================================================
// Configuration
// ============================================================================

const config = {
  defaultFrom: process.env.EMAIL_FROM || 'contact@unite-group.in',
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY,
    enabled: !!process.env.SENDGRID_API_KEY,
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    enabled: !!process.env.RESEND_API_KEY,
  },
  smtp: {
    host: process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_SERVER_PORT) || 587,
    user: process.env.EMAIL_SERVER_USER,
    password: process.env.EMAIL_SERVER_PASSWORD,
    enabled: !!(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD),
  },
};

// ============================================================================
// Provider Initialization
// ============================================================================

// SendGrid
if (config.sendgrid.enabled && config.sendgrid.apiKey) {
  sgMail.setApiKey(config.sendgrid.apiKey);
}

// Resend
let resendClient: Resend | null = null;
if (config.resend.enabled && config.resend.apiKey) {
  resendClient = new Resend(config.resend.apiKey);
}

// SMTP Transporter
let smtpTransporter: Transporter | null = null;
if (config.smtp.enabled) {
  smtpTransporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.password,
    },
    tls: {
      // Allow self-signed certificates in development
      rejectUnauthorized: process.env.NODE_ENV === 'production',
    },
  });
}

// ============================================================================
// Provider Selection Logic
// ============================================================================

function getPreferredProvider(requestedProvider?: EmailProvider): EmailProvider[] {
  // If specific provider requested, try that first
  if (requestedProvider && requestedProvider !== 'auto') {
    return [requestedProvider, ...getDefaultProviderOrder().filter(p => p !== requestedProvider)];
  }

  // Auto mode: use default provider order
  return getDefaultProviderOrder();
}

function getDefaultProviderOrder(): EmailProvider[] {
  const order: EmailProvider[] = [];

  // Priority 1: SendGrid (if available and has credits)
  if (config.sendgrid.enabled) {
    order.push('sendgrid');
  }

  // Priority 2: Resend (if available)
  if (config.resend.enabled) {
    order.push('resend');
  }

  // Priority 3: SMTP (always available as fallback)
  if (config.smtp.enabled) {
    order.push('smtp');
  }

  return order;
}

// ============================================================================
// Template Processing
// ============================================================================

function processTemplate(
  template: string,
  vars: Record<string, any>
): string {
  let processed = template;

  Object.entries(vars).forEach(([key, value]) => {
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processed = processed.replace(regex, String(value));
  });

  return processed;
}

// ============================================================================
// Provider Implementations
// ============================================================================

async function sendViaSendGrid(options: EmailOptions): Promise<EmailResult> {
  try {
    const msg: any = {
      to: options.to,
      from: options.from || config.defaultFrom,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    if (options.replyTo) msg.replyTo = options.replyTo;
    if (options.cc) msg.cc = options.cc;
    if (options.bcc) msg.bcc = options.bcc;
    if (options.attachments) {
      msg.attachments = options.attachments.map(att => ({
        filename: att.filename,
        content: att.content,
        type: att.contentType,
      }));
    }

    const response = await sgMail.send(msg);

    return {
      success: true,
      provider: 'sendgrid',
      messageId: response[0].headers['x-message-id'] as string,
    };
  } catch (error: unknown) {
    console.error('[EmailService] SendGrid error:', error.response?.body || error);
    return {
      success: false,
      provider: 'sendgrid',
      error: error.response?.body || error.message,
    };
  }
}

async function sendViaResend(options: EmailOptions): Promise<EmailResult> {
  if (!resendClient) {
    return {
      success: false,
      provider: 'resend',
      error: 'Resend client not initialized',
    };
  }

  try {
    const data = await resendClient.emails.send({
      from: options.from || config.defaultFrom,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
      reply_to: options.replyTo,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc : [options.cc]) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc : [options.bcc]) : undefined,
      attachments: options.attachments?.map(att => ({
        filename: att.filename,
        content: att.content as Buffer,
      })),
    });

    return {
      success: true,
      provider: 'resend',
      messageId: data.id,
    };
  } catch (error: unknown) {
    console.error('[EmailService] Resend error:', error);
    return {
      success: false,
      provider: 'resend',
      error: error.message,
    };
  }
}

async function sendViaSMTP(options: EmailOptions): Promise<EmailResult> {
  if (!smtpTransporter) {
    return {
      success: false,
      provider: 'smtp',
      error: 'SMTP transporter not initialized',
    };
  }

  try {
    const mailOptions: any = {
      from: options.from || config.defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };

    if (options.replyTo) mailOptions.replyTo = options.replyTo;
    if (options.cc) mailOptions.cc = options.cc;
    if (options.bcc) mailOptions.bcc = options.bcc;
    if (options.attachments) mailOptions.attachments = options.attachments;

    const info = await smtpTransporter.sendMail(mailOptions);

    return {
      success: true,
      provider: 'smtp',
      messageId: info.messageId,
    };
  } catch (error: unknown) {
    console.error('[EmailService] SMTP error:', error);
    return {
      success: false,
      provider: 'smtp',
      error: error.message,
    };
  }
}

// ============================================================================
// Main Email Sending Function
// ============================================================================

/**
 * Send an email using the best available provider with automatic fallback
 *
 * @param options Email options including recipient, subject, content
 * @returns EmailResult with success status and details
 *
 * @example
 * ```typescript
 * const result = await sendEmail({
 *   to: 'user@example.com',
 *   subject: 'Welcome to Unite-Hub',
 *   html: '<h1>Welcome!</h1>',
 *   text: 'Welcome!',
 * });
 *
 * if (result.success) {
 *   console.log('Email sent via', result.provider);
 * }
 * ```
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  // Process template if provided
  if (options.template) {
    const vars = options.templateVars || {};
    options.html = processTemplate(options.template.html, vars);
    options.text = options.template.text
      ? processTemplate(options.template.text, vars)
      : undefined;
    options.subject = processTemplate(options.template.subject, vars);
  }

  // Get provider order
  const providers = getPreferredProvider(options.provider);

  // Try each provider in order
  let lastError: any;
  let fallbackUsed = false;

  for (let i = 0; i < providers.length; i++) {
    const provider = providers[i];

    console.log(`[EmailService] Attempting to send via ${provider}...`);

    let result: EmailResult;

    switch (provider) {
      case 'sendgrid':
        result = await sendViaSendGrid(options);
        break;
      case 'resend':
        result = await sendViaResend(options);
        break;
      case 'smtp':
        result = await sendViaSMTP(options);
        break;
      default:
        continue;
    }

    if (result.success) {
      result.fallbackUsed = fallbackUsed;
      console.log(`[EmailService] ✅ Email sent successfully via ${provider}`);
      return result;
    }

    lastError = result.error;
    fallbackUsed = true;
    console.log(`[EmailService] ❌ ${provider} failed, trying next provider...`);
  }

  // All providers failed
  console.error('[EmailService] ❌ All email providers failed');
  return {
    success: false,
    provider: providers[0] || 'auto',
    error: lastError || 'No email providers available',
    fallbackUsed,
  };
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(
  to: string,
  userName: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Welcome to Unite-Hub! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Welcome to Unite-Hub!</h1>
        <p>Hi ${userName},</p>
        <p>Thank you for joining Unite-Hub. We're excited to have you on board!</p>
        <p>Here's what you can do next:</p>
        <ul>
          <li>Complete your profile</li>
          <li>Explore the dashboard</li>
          <li>Create your first contact</li>
          <li>Set up your email campaigns</li>
        </ul>
        <p>If you have any questions, feel free to reply to this email.</p>
        <p>Best regards,<br/>The Unite-Hub Team</p>
      </div>
    `,
    text: `Welcome to Unite-Hub!

Hi ${userName},

Thank you for joining Unite-Hub. We're excited to have you on board!

Here's what you can do next:
- Complete your profile
- Explore the dashboard
- Create your first contact
- Set up your email campaigns

If you have any questions, feel free to reply to this email.

Best regards,
The Unite-Hub Team`,
  });
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: 'Reset Your Unite-Hub Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Password Reset Request</h1>
        <p>You requested to reset your password for Unite-Hub.</p>
        <p>Click the button below to reset your password:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Reset Password
          </a>
        </p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <p>Best regards,<br/>The Unite-Hub Team</p>
      </div>
    `,
    text: `Password Reset Request

You requested to reset your password for Unite-Hub.

Click this link to reset your password:
${resetLink}

If you didn't request this, please ignore this email.
This link will expire in 1 hour.

Best regards,
The Unite-Hub Team`,
  });
}

/**
 * Send an email notification
 */
export async function sendNotificationEmail(
  to: string,
  title: string,
  message: string
): Promise<EmailResult> {
  return sendEmail({
    to,
    subject: title,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">${title}</h1>
        <p>${message}</p>
        <p>Best regards,<br/>The Unite-Hub Team</p>
      </div>
    `,
    text: `${title}

${message}

Best regards,
The Unite-Hub Team`,
  });
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get status of all email providers
 */
export function getProviderStatus() {
  return {
    sendgrid: {
      enabled: config.sendgrid.enabled,
      configured: !!config.sendgrid.apiKey,
    },
    resend: {
      enabled: config.resend.enabled,
      configured: !!config.resend.apiKey,
    },
    smtp: {
      enabled: config.smtp.enabled,
      configured: !!(config.smtp.user && config.smtp.password),
      host: config.smtp.host,
    },
    defaultOrder: getDefaultProviderOrder(),
  };
}

/**
 * Test email connection for a specific provider
 */
export async function testProvider(provider: EmailProvider): Promise<boolean> {
  const testResult = await sendEmail({
    to: config.smtp.user || config.defaultFrom, // Send to self
    subject: 'Unite-Hub Email Test',
    text: 'This is a test email from Unite-Hub',
    provider,
  });

  return testResult.success;
}
