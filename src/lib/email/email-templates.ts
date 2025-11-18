/**
 * Unite-Hub Email Templates
 *
 * Pre-built, production-ready email templates with variable substitution
 *
 * @module email-templates
 */

import type { EmailTemplate } from './email-service';

// ============================================================================
// Brand Colors & Styles
// ============================================================================

const brandColors = {
  primary: '#2563eb',
  secondary: '#10b981',
  text: '#111827',
  textLight: '#6b7280',
  background: '#f9fafb',
  border: '#e5e7eb',
};

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: ${brandColors.text};
`;

// ============================================================================
// Template Wrapper
// ============================================================================

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unite-Hub</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${brandColors.background};">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; background-color: white; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 30px 20px 30px; text-align: center; border-bottom: 2px solid ${brandColors.primary};">
              <h1 style="margin: 0; color: ${brandColors.primary}; font-size: 28px; font-weight: bold;">
                Unite-Hub
              </h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px; ${baseStyles}">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; text-align: center; border-top: 1px solid ${brandColors.border}; background-color: ${brandColors.background};">
              <p style="margin: 0 0 10px 0; font-size: 14px; color: ${brandColors.textLight};">
                © ${new Date().getFullYear()} Unite-Hub. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: ${brandColors.textLight};">
                <a href="{{unsubscribeUrl}}" style="color: ${brandColors.textLight}; text-decoration: underline;">Unsubscribe</a> |
                <a href="{{preferencesUrl}}" style="color: ${brandColors.textLight}; text-decoration: underline;">Preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

// ============================================================================
// Button Component
// ============================================================================

function createButton(text: string, url: string): string {
  return `
    <table role="presentation" style="margin: 30px 0;">
      <tr>
        <td align="center">
          <a href="${url}" style="display: inline-block; padding: 14px 28px; background-color: ${brandColors.primary}; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">
            ${text}
          </a>
        </td>
      </tr>
    </table>
  `;
}

// ============================================================================
// Templates
// ============================================================================

export const emailTemplates = {
  /**
   * Welcome email for new users
   * Variables: userName, loginUrl
   */
  welcome: {
    name: 'welcome',
    subject: 'Welcome to Unite-Hub! 🎉',
    html: wrapTemplate(`
      <h2 style="color: ${brandColors.text}; margin-top: 0;">Welcome, {{userName}}!</h2>
      <p>We're thrilled to have you join Unite-Hub, your AI-powered marketing CRM platform.</p>

      <div style="background-color: ${brandColors.background}; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: ${brandColors.primary}; margin-top: 0; font-size: 18px;">Get Started in 3 Steps:</h3>
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li style="margin-bottom: 8px;"><strong>Complete your profile</strong> - Add your business details</li>
          <li style="margin-bottom: 8px;"><strong>Import contacts</strong> - Bring in your existing contacts</li>
          <li style="margin-bottom: 8px;"><strong>Create your first campaign</strong> - Start engaging your audience</li>
        </ol>
      </div>

      ${createButton('Go to Dashboard', '{{loginUrl}}')}

      <p style="color: ${brandColors.textLight}; font-size: 14px; margin-top: 30px;">
        Need help getting started? Check out our <a href="{{docsUrl}}" style="color: ${brandColors.primary};">documentation</a>
        or reply to this email.
      </p>
    `),
    text: `Welcome, {{userName}}!

We're thrilled to have you join Unite-Hub, your AI-powered marketing CRM platform.

Get Started in 3 Steps:

1. Complete your profile - Add your business details
2. Import contacts - Bring in your existing contacts
3. Create your first campaign - Start engaging your audience

Go to Dashboard: {{loginUrl}}

Need help getting started? Check out our documentation or reply to this email.`,
  } as EmailTemplate,

  /**
   * Password reset email
   * Variables: resetUrl, expiryTime
   */
  passwordReset: {
    name: 'passwordReset',
    subject: 'Reset Your Unite-Hub Password',
    html: wrapTemplate(`
      <h2 style="color: ${brandColors.text}; margin-top: 0;">Password Reset Request</h2>
      <p>We received a request to reset the password for your Unite-Hub account.</p>

      <p>Click the button below to create a new password:</p>

      ${createButton('Reset Password', '{{resetUrl}}')}

      <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; font-size: 14px; color: #92400e;">
          ⚠️ This link will expire in {{expiryTime}} minutes.
        </p>
      </div>

      <p style="color: ${brandColors.textLight}; font-size: 14px;">
        If you didn't request this password reset, please ignore this email and ensure your account is secure.
      </p>
    `),
    text: `Password Reset Request

We received a request to reset the password for your Unite-Hub account.

Click this link to create a new password:
{{resetUrl}}

⚠️ This link will expire in {{expiryTime}} minutes.

If you didn't request this password reset, please ignore this email and ensure your account is secure.`,
  } as EmailTemplate,

  /**
   * Email verification
   * Variables: userName, verifyUrl, expiryTime
   */
  emailVerification: {
    name: 'emailVerification',
    subject: 'Verify Your Email Address',
    html: wrapTemplate(`
      <h2 style="color: ${brandColors.text}; margin-top: 0;">Verify Your Email</h2>
      <p>Hi {{userName}},</p>
      <p>Please verify your email address to complete your Unite-Hub registration.</p>

      ${createButton('Verify Email', '{{verifyUrl}}')}

      <p style="color: ${brandColors.textLight}; font-size: 14px; margin-top: 30px;">
        This verification link will expire in {{expiryTime}} minutes.
      </p>

      <p style="color: ${brandColors.textLight}; font-size: 14px;">
        If you didn't create an account with Unite-Hub, please ignore this email.
      </p>
    `),
    text: `Verify Your Email

Hi {{userName}},

Please verify your email address to complete your Unite-Hub registration.

Verify Email: {{verifyUrl}}

This verification link will expire in {{expiryTime}} minutes.

If you didn't create an account with Unite-Hub, please ignore this email.`,
  } as EmailTemplate,

  /**
   * Campaign summary notification
   * Variables: campaignName, recipientCount, openRate, clickRate, dashboardUrl
   */
  campaignSummary: {
    name: 'campaignSummary',
    subject: 'Campaign "{{campaignName}}" - Performance Summary',
    html: wrapTemplate(`
      <h2 style="color: ${brandColors.text}; margin-top: 0;">Campaign Performance Summary</h2>
      <p>Your campaign "<strong>{{campaignName}}</strong>" has been completed. Here's how it performed:</p>

      <table role="presentation" style="width: 100%; margin: 20px 0; border-collapse: collapse;">
        <tr>
          <td style="padding: 15px; background-color: ${brandColors.background}; border-radius: 6px 6px 0 0; font-weight: 600;">
            Recipients
          </td>
          <td style="padding: 15px; background-color: ${brandColors.background}; border-radius: 6px 6px 0 0; text-align: right; font-size: 24px; color: ${brandColors.primary};">
            {{recipientCount}}
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid ${brandColors.border};">
            Open Rate
          </td>
          <td style="padding: 15px; text-align: right; font-size: 20px; color: ${brandColors.secondary}; border-bottom: 1px solid ${brandColors.border};">
            {{openRate}}%
          </td>
        </tr>
        <tr>
          <td style="padding: 15px; border-bottom: 1px solid ${brandColors.border};">
            Click Rate
          </td>
          <td style="padding: 15px; text-align: right; font-size: 20px; color: ${brandColors.secondary}; border-bottom: 1px solid ${brandColors.border};">
            {{clickRate}}%
          </td>
        </tr>
      </table>

      ${createButton('View Full Report', '{{dashboardUrl}}')}
    `),
    text: `Campaign Performance Summary

Your campaign "{{campaignName}}" has been completed. Here's how it performed:

Recipients: {{recipientCount}}
Open Rate: {{openRate}}%
Click Rate: {{clickRate}}%

View Full Report: {{dashboardUrl}}`,
  } as EmailTemplate,

  /**
   * New contact notification
   * Variables: contactName, contactEmail, contactSource, viewUrl
   */
  newContact: {
    name: 'newContact',
    subject: 'New Contact Added: {{contactName}}',
    html: wrapTemplate(`
      <h2 style="color: ${brandColors.text}; margin-top: 0;">New Contact Added</h2>
      <p>A new contact has been added to your Unite-Hub account:</p>

      <div style="background-color: ${brandColors.background}; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: ${brandColors.textLight};">Name:</td>
            <td style="padding: 8px 0;">{{contactName}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: ${brandColors.textLight};">Email:</td>
            <td style="padding: 8px 0;">{{contactEmail}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: ${brandColors.textLight};">Source:</td>
            <td style="padding: 8px 0;">{{contactSource}}</td>
          </tr>
        </table>
      </div>

      ${createButton('View Contact', '{{viewUrl}}')}
    `),
    text: `New Contact Added

A new contact has been added to your Unite-Hub account:

Name: {{contactName}}
Email: {{contactEmail}}
Source: {{contactSource}}

View Contact: {{viewUrl}}`,
  } as EmailTemplate,

  /**
   * Subscription confirmation
   * Variables: planName, amount, billingPeriod, nextBillingDate, manageUrl
   */
  subscriptionConfirmation: {
    name: 'subscriptionConfirmation',
    subject: 'Subscription Confirmed - {{planName}}',
    html: wrapTemplate(`
      <h2 style="color: ${brandColors.text}; margin-top: 0;">Subscription Confirmed!</h2>
      <p>Thank you for subscribing to Unite-Hub. Your subscription is now active.</p>

      <div style="background-color: ${brandColors.background}; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: ${brandColors.primary}; margin-top: 0; font-size: 18px;">Subscription Details</h3>
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: ${brandColors.textLight};">Plan:</td>
            <td style="padding: 8px 0;">{{planName}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: ${brandColors.textLight};">Amount:</td>
            <td style="padding: 8px 0;">{{amount}} / {{billingPeriod}}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; font-weight: 600; color: ${brandColors.textLight};">Next Billing:</td>
            <td style="padding: 8px 0;">{{nextBillingDate}}</td>
          </tr>
        </table>
      </div>

      ${createButton('Manage Subscription', '{{manageUrl}}')}

      <p style="color: ${brandColors.textLight}; font-size: 14px; margin-top: 30px;">
        You can cancel or change your subscription at any time from your account settings.
      </p>
    `),
    text: `Subscription Confirmed!

Thank you for subscribing to Unite-Hub. Your subscription is now active.

Subscription Details:
Plan: {{planName}}
Amount: {{amount}} / {{billingPeriod}}
Next Billing: {{nextBillingDate}}

Manage Subscription: {{manageUrl}}

You can cancel or change your subscription at any time from your account settings.`,
  } as EmailTemplate,

  /**
   * Weekly digest
   * Variables: userName, weekStart, weekEnd, newContacts, emailsSent, topCampaign, dashboardUrl
   */
  weeklyDigest: {
    name: 'weeklyDigest',
    subject: 'Your Weekly Unite-Hub Summary',
    html: wrapTemplate(`
      <h2 style="color: ${brandColors.text}; margin-top: 0;">Weekly Summary</h2>
      <p>Hi {{userName}}, here's what happened this week ({{weekStart}} - {{weekEnd}}):</p>

      <table role="presentation" style="width: 100%; margin: 20px 0;">
        <tr>
          <td style="width: 50%; padding: 15px; background-color: ${brandColors.background}; border-radius: 6px; margin-right: 10px;">
            <div style="font-size: 32px; font-weight: bold; color: ${brandColors.primary};">{{newContacts}}</div>
            <div style="color: ${brandColors.textLight}; font-size: 14px;">New Contacts</div>
          </td>
          <td style="width: 10px;"></td>
          <td style="width: 50%; padding: 15px; background-color: ${brandColors.background}; border-radius: 6px;">
            <div style="font-size: 32px; font-weight: bold; color: ${brandColors.secondary};">{{emailsSent}}</div>
            <div style="color: ${brandColors.textLight}; font-size: 14px;">Emails Sent</div>
          </td>
        </tr>
      </table>

      <div style="background-color: ${brandColors.background}; padding: 20px; border-radius: 6px; margin: 20px 0;">
        <h3 style="color: ${brandColors.primary}; margin-top: 0; font-size: 16px;">Top Performing Campaign</h3>
        <p style="margin: 5px 0; font-size: 18px; font-weight: 600;">{{topCampaign}}</p>
      </div>

      ${createButton('View Full Analytics', '{{dashboardUrl}}')}
    `),
    text: `Weekly Summary

Hi {{userName}}, here's what happened this week ({{weekStart}} - {{weekEnd}}):

New Contacts: {{newContacts}}
Emails Sent: {{emailsSent}}

Top Performing Campaign: {{topCampaign}}

View Full Analytics: {{dashboardUrl}}`,
  } as EmailTemplate,
};

// ============================================================================
// Helper Function
// ============================================================================

/**
 * Get an email template by name
 */
export function getTemplate(name: keyof typeof emailTemplates): EmailTemplate {
  return emailTemplates[name];
}

/**
 * List all available templates
 */
export function listTemplates(): string[] {
  return Object.keys(emailTemplates);
}
