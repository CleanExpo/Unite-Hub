/**
 * Email Execution Agent (AGENT_EMAIL_EXECUTOR)
 * Autonomous execution-only agent for sending pre-approved emails
 * v1.4.0: Second autonomous agent with circuit binding, CRM context, and metrics collection
 */

import { getSupabaseServer } from '@/lib/supabase';
import { sendEmail, type EmailOptions } from '@/lib/email/email-service';
import { executeCircuit, CircuitExecutionContext } from '../executor';
import { executeAutoCorrection } from '../autonomy';
import crypto from 'crypto';

/**
 * Input to email sending execution
 */
export interface EmailExecutorInput {
  circuit_execution_id: string; // MANDATORY - validates against circuit_execution_logs
  workspace_id: string; // Multi-tenant isolation
  client_id: string; // Links to contacts
  recipient: string; // Email address (from CRM or override)
  final_asset: {
    subject: string; // Email subject line
    preheader?: string; // Email preview text
    html_body: string; // HTML email content
    text_body?: string; // Plain text fallback
    cta_url?: string; // Call-to-action URL
    tags?: string[]; // Email categorization tags
  };
  scheduled_for?: string; // ISO timestamp for scheduling (future use with Bull queue)
}

/**
 * Output from email sending execution
 */
export interface EmailExecutorOutput {
  sent: boolean;
  provider_message_id?: string;
  provider: string; // 'sendgrid' | 'resend' | 'smtp'
  sent_at?: string;
  delivered_at?: string;
  engagement_metrics?: {
    delivered: boolean;
    bounced: boolean;
    opened: boolean;
    clicked: boolean;
    unsubscribed: boolean;
    complained: boolean;
  };
  error?: string;
}

/**
 * CRM context for email personalization
 */
export interface CRMContext {
  lead_stage?: string;
  last_contacted_at?: string;
  service_category?: string;
  location?: string;
  brand_rules?: Record<string, unknown>;
  historical_engagement?: Record<string, number>;
}

/**
 * Email options to pass to email-service
 */
export interface EmailSendOptions extends EmailOptions {
  provider?: 'sendgrid' | 'resend' | 'smtp' | 'auto';
}

/**
 * Required circuits that must pass before agent execution
 */
const REQUIRED_CIRCUITS = [
  'CX01_INTENT_DETECTION',
  'CX02_AUDIENCE_CLASSIFICATION',
  'CX03_STATE_MEMORY_RETRIEVAL',
  'CX04_CONTENT_STRATEGY_SELECTION',
  'CX05_BRAND_GUARD',
  'CX06_GENERATION_EXECUTION',
];

/**
 * Email platform specifications (character limits)
 */
const EMAIL_SPECS = {
  sendgrid: { max_length: 100000 },
  resend: { max_length: 100000 },
  smtp: { max_length: 100000 },
};

/**
 * Retry configuration
 */
const RETRY_CONFIG = {
  maxRetries: 2,
  initialDelayMs: 2000,
  backoffMultiplier: 2,
  retryOn: [429, 500, 502, 503, 504], // Rate limits and server errors
};

/**
 * Rate limiting configuration
 */
const RATE_LIMIT_CONFIG = {
  maxEmailsPerHour: 300, // Per workspace
};

/**
 * Validate that circuit_execution_id has passed all required circuits
 */
export async function validateCircuitBinding(
  circuitExecutionId: string,
  workspaceId: string
): Promise<{ valid: boolean; circuits_passed: string[]; missing: string[] }> {
  const supabase = getSupabaseServer();

  try {
    // Query circuit_execution_logs for all circuits with this execution_id
    const { data: logs, error } = await supabase
      .from('circuit_execution_logs')
      .select('circuit_id, success')
      .eq('execution_id', circuitExecutionId)
      .eq('workspace_id', workspaceId);

    if (error) {
      throw new Error(`Failed to validate circuit binding: ${error.message}`);
    }

    if (!logs || logs.length === 0) {
      return {
        valid: false,
        circuits_passed: [],
        missing: REQUIRED_CIRCUITS,
      };
    }

    // Check which required circuits passed
    const passedCircuits = logs
      .filter((log) => log.success && REQUIRED_CIRCUITS.includes(log.circuit_id))
      .map((log) => log.circuit_id);

    const missingCircuits = REQUIRED_CIRCUITS.filter(
      (circuit) => !passedCircuits.includes(circuit)
    );

    return {
      valid: missingCircuits.length === 0,
      circuits_passed: passedCircuits,
      missing: missingCircuits,
    };
  } catch (error) {
    throw new Error(
      `Circuit binding validation failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Get read-only CRM context for client
 */
export async function getCRMContext(
  clientId: string,
  workspaceId: string
): Promise<CRMContext> {
  const supabase = getSupabaseServer();

  try {
    // Query contacts for basic business info
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('company, tags, lead_stage, last_contacted_at')
      .eq('id', clientId)
      .eq('workspace_id', workspaceId)
      .single();

    if (contactError && contactError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (acceptable for non-contacts)
      console.warn('Contact lookup failed:', contactError);
    }

    const crmContext: CRMContext = {};

    if (contact) {
      crmContext.lead_stage = contact.lead_stage || undefined;
      crmContext.last_contacted_at = contact.last_contacted_at || undefined;
    }

    // Return read-only context
    return crmContext;
  } catch (error) {
    throw new Error(
      `Failed to read CRM context: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Validate recipient email address against suppression list and rate limits
 */
export async function validateRecipientSafety(
  recipient: string,
  workspaceId: string
): Promise<{ safe: boolean; reason?: string }> {
  const supabase = getSupabaseServer();

  try {
    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      return { safe: false, reason: 'invalid_email_format' };
    }

    // Check suppression list (bounced, complained, unsubscribed)
    const { data: suppressionEntry, error: suppressionError } = await supabase
      .from('email_suppression_list')
      .select('id, reason')
      .eq('workspace_id', workspaceId)
      .eq('email', recipient.toLowerCase())
      .single();

    if (suppressionError && suppressionError.code !== 'PGRST116') {
      console.warn('Suppression list check failed:', suppressionError);
    }

    if (suppressionEntry) {
      return {
        safe: false,
        reason: `${suppressionEntry.reason}_suppressed`,
      };
    }

    // Check hourly rate limit (300 emails/hour per workspace)
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString();
    const { count, error: countError } = await supabase
      .from('email_agent_executions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('sent', true)
      .gte('sent_at', oneHourAgo);

    if (countError) {
      console.warn('Rate limit check failed:', countError);
    }

    if (count && count >= RATE_LIMIT_CONFIG.maxEmailsPerHour) {
      return { safe: false, reason: 'rate_limit_exceeded' };
    }

    return { safe: true };
  } catch (error) {
    throw new Error(
      `Failed to validate recipient safety: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Generate HMAC-signed unsubscribe token
 */
function generateUnsubscribeToken(
  email: string,
  workspaceId: string
): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || 'default-secret';
  const data = `${email}:${workspaceId}`;
  const hash = crypto.createHmac('sha256', secret).update(data).digest('hex');
  return Buffer.from(`${data}:${hash}`).toString('base64');
}

/**
 * Inject unsubscribe link into email body
 */
function injectUnsubscribeLink(
  htmlBody: string,
  email: string,
  workspaceId: string
): string {
  const token = generateUnsubscribeToken(email, workspaceId);
  const unsubscribeUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3008'}/api/email/unsubscribe?token=${encodeURIComponent(token)}`;

  const unsubscribeHtml = `
    <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 30px 0;">
    <p style="font-size: 12px; color: #666; text-align: center; margin: 20px 0;">
      <a href="${unsubscribeUrl}" style="color: #0066cc; text-decoration: none;">Unsubscribe from these emails</a>
    </p>
  `;

  // Append before closing body or at end
  if (htmlBody.includes('</body>')) {
    return htmlBody.replace('</body>', `${unsubscribeHtml}</body>`);
  }
  return htmlBody + unsubscribeHtml;
}

/**
 * Delay function for retry backoff
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if error should be retried
 */
function shouldRetry(error: unknown, statusCode?: number): boolean {
  if (statusCode && RETRY_CONFIG.retryOn.includes(statusCode)) {
    return true;
  }
  if (error instanceof Error && error.message.includes('timeout')) {
    return true;
  }
  return false;
}

/**
 * Send email with retry logic (exponential backoff)
 */
async function sendEmailWithRetry(
  emailOptions: EmailSendOptions,
  maxRetries: number = RETRY_CONFIG.maxRetries
): Promise<{ messageId: string; provider: string; attempt: number; success: boolean }> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await sendEmail(emailOptions);

      if (result.success) {
        return {
          messageId: result.messageId || '',
          provider: result.provider,
          attempt: attempt + 1,
          success: true,
        };
      }

      const error = new Error(
        `Send failed via ${result.provider}: ${JSON.stringify(result.error)}`
      );

      if (attempt < maxRetries && shouldRetry(error)) {
        const delayMs = RETRY_CONFIG.initialDelayMs *
          Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);

        console.log(
          `Email send attempt ${attempt + 1} failed, retrying in ${delayMs}ms`
        );

        await delay(delayMs);
        attempt++;
      } else {
        throw error;
      }
    } catch (error) {
      if (attempt < maxRetries && shouldRetry(error)) {
        const delayMs = RETRY_CONFIG.initialDelayMs *
          Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);

        console.log(
          `Email send attempt ${attempt + 1} failed, retrying in ${delayMs}ms`
        );

        await delay(delayMs);
        attempt++;
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Max retries (${maxRetries}) exceeded`);
}

/**
 * Collect engagement metrics from email provider
 */
export async function collectEngagementMetrics(
  _provider: string,
  _messageId: string
): Promise<EmailExecutorOutput['engagement_metrics']> {
  // Placeholder: In production, fetch from SendGrid/Resend/SMTP APIs via webhooks
  // or via background metrics collection worker (emailMetricsQueue)

  return {
    delivered: false,
    bounced: false,
    opened: false,
    clicked: false,
    unsubscribed: false,
    complained: false,
  };
}

/**
 * Execute email sending with full circuit validation and retry logic
 */
export async function executeEmailSending(
  inputs: EmailExecutorInput,
  context: CircuitExecutionContext
): Promise<EmailExecutorOutput> {
  const supabase = getSupabaseServer();

  try {
    // STEP 1: Validate circuit binding (hard fail if any required circuit missing)
    const circuitValidation = await validateCircuitBinding(
      inputs.circuit_execution_id,
      inputs.workspace_id
    );

    if (!circuitValidation.valid) {
      throw new Error(
        `Circuit validation failed. Missing circuits: ${circuitValidation.missing.join(', ')}`
      );
    }

    // STEP 2: Get CRM context (read-only)
    // TODO: Use crmContext for personalization/brand validation in future versions
    await getCRMContext(inputs.client_id, inputs.workspace_id);

    // STEP 3: Validate recipient safety
    const recipientSafety = await validateRecipientSafety(
      inputs.recipient,
      inputs.workspace_id
    );

    if (!recipientSafety.safe) {
      throw new Error(
        `Recipient validation failed: ${recipientSafety.reason}`
      );
    }

    // STEP 4: Log execution start
    const executionStartLog = {
      workspace_id: inputs.workspace_id,
      circuit_execution_id: inputs.circuit_execution_id,
      client_id: inputs.client_id,
      recipient: inputs.recipient.toLowerCase(),
      subject: inputs.final_asset.subject,
      preheader: inputs.final_asset.preheader || null,
      html_body: inputs.final_asset.html_body,
      text_body: inputs.final_asset.text_body || null,
      cta_url: inputs.final_asset.cta_url || null,
      tags: inputs.final_asset.tags || [],
      sent: false,
      attempt_number: 1,
      retry_count: 0,
      scheduled_for: inputs.scheduled_for || null,
    };

    const { data: executionRecord, error: insertError } = await supabase
      .from('email_agent_executions')
      .insert([executionStartLog])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to log execution start: ${insertError.message}`);
    }

    // STEP 5: Inject unsubscribe link and prepare email content
    const htmlBodyWithUnsubscribe = injectUnsubscribeLink(
      inputs.final_asset.html_body,
      inputs.recipient,
      inputs.workspace_id
    );

    // Validate content length
    const totalLength = (inputs.final_asset.subject + htmlBodyWithUnsubscribe).length;
    const maxLength = EMAIL_SPECS.sendgrid.max_length; // Use SendGrid limit (most generous)

    if (totalLength > maxLength) {
      throw new Error(
        `Content exceeds email limit (${totalLength}/${maxLength})`
      );
    }

    // STEP 6: Send with retry logic
    let sendResult;
    let retryCount = 0;
    let lastError: Error | null = null;
    let provider = 'auto';

    try {
      sendResult = await sendEmailWithRetry({
        to: inputs.recipient,
        subject: inputs.final_asset.subject,
        html: htmlBodyWithUnsubscribe,
        text: inputs.final_asset.text_body,
        provider: 'auto',
      });

      retryCount = sendResult.attempt - 1;
      provider = sendResult.provider;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      retryCount = RETRY_CONFIG.maxRetries;

      // STEP 7: On repeated failure, trigger CX08_SELF_CORRECTION
      if (retryCount >= RETRY_CONFIG.maxRetries) {
        try {
          const correctionInputs = {
            circuit_id: 'AGENT_EMAIL_EXECUTOR',
            failure_reason: `Email sending to ${inputs.recipient} failed after ${retryCount} retries`,
            current_strategy: 'sendgrid',
            performance_metrics: {
              success_rate: 0,
              retry_count: retryCount,
              last_error: lastError.message,
            },
          };

          await executeCircuit(
            'CX08_SELF_CORRECTION',
            correctionInputs,
            context,
            executeAutoCorrection
          );
        } catch (correctionError) {
          console.error('Failed to trigger self-correction:', correctionError);
        }
      }

      // Update execution record with failure
      const updateError = await supabase
        .from('email_agent_executions')
        .update({
          sent: false,
          retry_count: retryCount,
          last_error: lastError.message,
        })
        .eq('id', executionRecord.id);

      if (updateError.error) {
        console.error('Failed to update execution record:', updateError.error);
      }

      return {
        sent: false,
        error: lastError.message,
        provider: 'unknown',
      };
    }

    // STEP 8: Update execution record with success
    const sentAt = inputs.scheduled_for || new Date().toISOString();

    const updateResult = await supabase
      .from('email_agent_executions')
      .update({
        sent: true,
        provider: provider,
        provider_message_id: sendResult.messageId,
        sent_at: sentAt,
        retry_count: retryCount,
      })
      .eq('id', executionRecord.id)
      .select()
      .single();

    if (updateResult.error) {
      throw new Error(`Failed to update execution record: ${updateResult.error.message}`);
    }

    // STEP 9: Collect initial metrics (placeholder)
    const metrics = await collectEngagementMetrics(provider, sendResult.messageId);

    return {
      sent: true,
      provider_message_id: sendResult.messageId,
      provider: provider,
      sent_at: sentAt,
      engagement_metrics: metrics,
    };
  } catch (error) {
    throw new Error(
      `Email sending failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
