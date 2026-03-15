// src/lib/integrations/sendgrid.ts
// SendGrid email client wrapper for campaign sending.

import sgMail from '@sendgrid/mail'

function ensureApiKey(): void {
  const key = process.env.SENDGRID_API_KEY?.trim()
  if (!key) throw new Error('[SendGrid] SENDGRID_API_KEY not configured')
  sgMail.setApiKey(key)
}

export interface EmailRecipient {
  email: string
  name?: string
}

export interface SendEmailInput {
  to: EmailRecipient | EmailRecipient[]
  from: EmailRecipient
  subject: string
  html: string
  text?: string
  replyTo?: EmailRecipient
  categories?: string[]
  customArgs?: Record<string, string>
}

/**
 * Send a single email via SendGrid.
 * Returns the SendGrid message ID on success.
 */
export async function sendEmail(input: SendEmailInput): Promise<string> {
  ensureApiKey()

  const msg: sgMail.MailDataRequired = {
    to: input.to,
    from: input.from,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: input.replyTo,
    categories: input.categories,
    customArgs: input.customArgs,
  }

  const [response] = await sgMail.send(msg)
  const messageId = response.headers['x-message-id'] as string | undefined
  return messageId ?? response.statusCode.toString()
}

/** Maximum recipients per SendGrid API call */
const BATCH_SIZE = 1000

/**
 * Send a batch of emails (up to 1000 per call).
 * Uses SendGrid's sendMultiple for efficiency.
 */
export async function sendBatchEmails(
  inputs: SendEmailInput[]
): Promise<{ sent: number; failed: number; errors: string[] }> {
  ensureApiKey()

  let sent = 0
  let failed = 0
  const errors: string[] = []

  // Process in chunks of BATCH_SIZE
  for (let i = 0; i < inputs.length; i += BATCH_SIZE) {
    const chunk = inputs.slice(i, i + BATCH_SIZE)

    const messages: sgMail.MailDataRequired[] = chunk.map((input) => ({
      to: input.to,
      from: input.from,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
      categories: input.categories,
      customArgs: input.customArgs,
    }))

    try {
      await sgMail.send(messages)
      sent += chunk.length
    } catch (err: unknown) {
      failed += chunk.length
      const message = err instanceof Error ? err.message : String(err)
      errors.push(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${message}`)
    }
  }

  return { sent, failed, errors }
}

/**
 * Send a campaign email to a list of recipients.
 * Handles batching if > 1000 recipients.
 */
export async function sendCampaignEmail(
  recipients: EmailRecipient[],
  from: EmailRecipient,
  subject: string,
  html: string,
  text?: string,
  categories?: string[]
): Promise<{ sent: number; failed: number }> {
  if (recipients.length === 0) {
    return { sent: 0, failed: 0 }
  }

  // Build individual emails for each recipient (personalised to/from)
  const inputs: SendEmailInput[] = recipients.map((recipient) => ({
    to: recipient,
    from,
    subject,
    html,
    text,
    categories,
  }))

  const result = await sendBatchEmails(inputs)

  if (result.errors.length > 0) {
    console.error('[SendGrid] Campaign send errors:', result.errors)
  }

  return { sent: result.sent, failed: result.failed }
}
