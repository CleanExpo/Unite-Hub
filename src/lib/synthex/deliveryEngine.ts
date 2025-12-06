/**
 * Delivery Engine for Synthex
 * Phase: B6 - Synthex Outbound Delivery Engine
 *
 * Orchestrates delivery across email, SMS, and social channels.
 * Processes scheduled deliveries, handles retries, and updates statistics.
 */

import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendEmail, sendTemplatedEmail, type EmailOptions } from './delivery/emailDriver';
import { sendSms, type SmsOptions } from './delivery/smsDriver';
import { postToSocial, type SocialPostOptions } from './delivery/socialDriver';

// Types
export type DeliveryChannel = 'email' | 'sms' | 'social' | 'push' | 'webhook';

export type DeliveryStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'
  | 'unsubscribed';

export interface DeliveryJob {
  scheduleId: string;
  tenantId: string;
  brandId?: string;
  campaignId?: string;
  channel: DeliveryChannel;
  recipient: string;
  subject?: string;
  content: string;
  htmlContent?: string;
  variables?: Record<string, string>;
  metadata?: Record<string, unknown>;
}

export interface DeliveryResult {
  success: boolean;
  deliveryLogId?: string;
  messageId?: string;
  error?: string;
  channel: DeliveryChannel;
  timestamp: Date;
}

export interface DueSchedule {
  id: string;
  campaign_id: string;
  tenant_id: string;
  brand_id?: string;
  step_index: number;
  send_at: string;
  recipient_count: number;
  status: string;
  retry_count: number;
  max_retries: number;
  campaign?: {
    name: string;
    channel?: DeliveryChannel;
    content?: string;
    subject?: string;
  };
}

/**
 * Process a delivery job
 */
export async function processDelivery(job: DeliveryJob): Promise<DeliveryResult> {
  const timestamp = new Date();

  // Create delivery log entry
  const { data: logEntry, error: logError } = await supabaseAdmin
    .from('synthex_delivery_log')
    .insert({
      schedule_id: job.scheduleId,
      tenant_id: job.tenantId,
      brand_id: job.brandId || null,
      campaign_id: job.campaignId || null,
      channel: job.channel,
      recipient: job.recipient,
      subject: job.subject,
      status: 'sending',
      attempted_at: timestamp.toISOString(),
    })
    .select('id')
    .single();

  if (logError) {
    console.error('[DeliveryEngine] Failed to create log entry:', logError);
    return {
      success: false,
      error: 'Failed to create delivery log',
      channel: job.channel,
      timestamp,
    };
  }

  const deliveryLogId = logEntry.id;

  try {
    let result: { success: boolean; messageId?: string; error?: string };

    switch (job.channel) {
      case 'email':
        result = await processEmailDelivery(job);
        break;
      case 'sms':
        result = await processSmsDelivery(job);
        break;
      case 'social':
        result = await processSocialDelivery(job);
        break;
      default:
        result = { success: false, error: `Unsupported channel: ${job.channel}` };
    }

    // Update delivery log
    await supabaseAdmin
      .from('synthex_delivery_log')
      .update({
        status: result.success ? 'sent' : 'failed',
        provider_message_id: result.messageId,
        error_message: result.error,
        delivered_at: result.success ? new Date().toISOString() : null,
        response: result,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryLogId);

    // Update statistics if successful
    if (result.success && job.tenantId) {
      await updateDeliveryStats(job.tenantId, job.campaignId, job.channel, 'sent');
    }

    return {
      success: result.success,
      deliveryLogId,
      messageId: result.messageId,
      error: result.error,
      channel: job.channel,
      timestamp,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // Update delivery log with error
    await supabaseAdmin
      .from('synthex_delivery_log')
      .update({
        status: 'failed',
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', deliveryLogId);

    return {
      success: false,
      deliveryLogId,
      error: errorMessage,
      channel: job.channel,
      timestamp,
    };
  }
}

/**
 * Process email delivery
 */
async function processEmailDelivery(
  job: DeliveryJob
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const emailOptions: EmailOptions = {
    to: job.recipient,
    subject: job.subject || 'No Subject',
    html: job.htmlContent || job.content,
    text: job.content,
  };

  if (job.variables && Object.keys(job.variables).length > 0) {
    const result = await sendTemplatedEmail({
      to: job.recipient,
      subject: job.subject || 'No Subject',
      htmlTemplate: job.htmlContent || job.content,
      textTemplate: job.content,
      variables: job.variables,
    });
    return { success: result.success, messageId: result.messageId, error: result.error };
  }

  const result = await sendEmail(emailOptions);
  return { success: result.success, messageId: result.messageId, error: result.error };
}

/**
 * Process SMS delivery
 */
async function processSmsDelivery(
  job: DeliveryJob
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const smsOptions: SmsOptions = {
    to: job.recipient,
    message: job.content,
  };

  const result = await sendSms(smsOptions);
  return { success: result.success, messageId: result.messageId, error: result.error };
}

/**
 * Process social media delivery
 */
async function processSocialDelivery(
  job: DeliveryJob
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const platform = (job.metadata?.platform as 'facebook' | 'linkedin' | 'twitter' | 'instagram') || 'twitter';

  const socialOptions: SocialPostOptions = {
    platform,
    content: job.content,
  };

  const result = await postToSocial(socialOptions);
  return { success: result.success, messageId: result.postId, error: result.error };
}

/**
 * Get due schedules ready for processing
 */
export async function getDueSchedules(limit: number = 50): Promise<{
  data: DueSchedule[] | null;
  error: Error | null;
}> {
  const now = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from('synthex_campaign_schedule')
    .select(`
      id,
      campaign_id,
      tenant_id,
      brand_id,
      step_index,
      send_at,
      recipient_count,
      status,
      retry_count,
      max_retries,
      campaign:synthex_campaigns(name)
    `)
    .eq('status', 'pending')
    .lte('send_at', now)
    .order('send_at', { ascending: true })
    .limit(limit);

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data: data as DueSchedule[], error: null };
}

/**
 * Process all due schedules
 */
export async function processDueSchedules(options: {
  limit?: number;
  dryRun?: boolean;
  onProgress?: (processed: number, total: number) => void;
}): Promise<{
  processed: number;
  successful: number;
  failed: number;
  errors: string[];
}> {
  const { limit = 50, dryRun = false, onProgress } = options;
  const errors: string[] = [];
  let successful = 0;
  let failed = 0;

  // Get due schedules
  const { data: schedules, error } = await getDueSchedules(limit);

  if (error || !schedules) {
    return {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [error?.message || 'Failed to fetch due schedules'],
    };
  }

  // Process each schedule
  for (let i = 0; i < schedules.length; i++) {
    const schedule = schedules[i];

    if (dryRun) {
      console.log(`[DeliveryEngine] Dry run - would process schedule ${schedule.id}`);
      successful++;
      onProgress?.(i + 1, schedules.length);
      continue;
    }

    try {
      // Mark schedule as sending
      await supabaseAdmin
        .from('synthex_campaign_schedule')
        .update({ status: 'sending', updated_at: new Date().toISOString() })
        .eq('id', schedule.id);

      // Process the delivery
      const result = await processDelivery({
        scheduleId: schedule.id,
        tenantId: schedule.tenant_id,
        brandId: schedule.brand_id,
        campaignId: schedule.campaign_id,
        channel: 'email', // Default to email for now
        recipient: 'placeholder@example.com', // Would come from campaign data
        subject: schedule.campaign?.name || 'Campaign Email',
        content: schedule.campaign?.content || 'Email content placeholder',
      });

      if (result.success) {
        // Mark schedule as sent
        await supabaseAdmin
          .from('synthex_campaign_schedule')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', schedule.id);
        successful++;
      } else {
        // Handle failure with retry logic
        const newRetryCount = schedule.retry_count + 1;
        const shouldRetry = newRetryCount < schedule.max_retries;

        await supabaseAdmin
          .from('synthex_campaign_schedule')
          .update({
            status: shouldRetry ? 'pending' : 'failed',
            retry_count: newRetryCount,
            next_retry_at: shouldRetry
              ? new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 min delay
              : null,
            error_message: result.error,
            updated_at: new Date().toISOString(),
          })
          .eq('id', schedule.id);

        failed++;
        errors.push(`Schedule ${schedule.id}: ${result.error}`);
      }
    } catch (err) {
      failed++;
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      errors.push(`Schedule ${schedule.id}: ${errorMessage}`);
    }

    onProgress?.(i + 1, schedules.length);
  }

  return {
    processed: schedules.length,
    successful,
    failed,
    errors,
  };
}

/**
 * Update delivery statistics
 */
async function updateDeliveryStats(
  tenantId: string,
  campaignId: string | undefined,
  channel: DeliveryChannel,
  metric: 'sent' | 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed' | 'unsubscribed'
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  // Try to update existing record, otherwise insert
  const { data: existing } = await supabaseAdmin
    .from('synthex_delivery_stats')
    .select('id, total_sent, total_delivered, total_opened, total_clicked, total_bounced, total_failed, total_unsubscribed')
    .eq('tenant_id', tenantId)
    .eq('stats_date', today)
    .eq('channel', channel)
    .is('campaign_id', campaignId || null)
    .single();

  const metricToColumn: Record<string, string> = {
    sent: 'total_sent',
    delivered: 'total_delivered',
    opened: 'total_opened',
    clicked: 'total_clicked',
    bounced: 'total_bounced',
    failed: 'total_failed',
    unsubscribed: 'total_unsubscribed',
  };

  const column = metricToColumn[metric];

  if (existing) {
    // Update existing record
    const currentValue = (existing as Record<string, number>)[column] || 0;
    await supabaseAdmin
      .from('synthex_delivery_stats')
      .update({
        [column]: currentValue + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    // Insert new record
    await supabaseAdmin.from('synthex_delivery_stats').insert({
      tenant_id: tenantId,
      campaign_id: campaignId || null,
      stats_date: today,
      channel,
      [column]: 1,
    });
  }
}

/**
 * Get delivery log for a schedule
 */
export async function getDeliveryLog(
  scheduleId: string
): Promise<{ data: unknown[] | null; error: Error | null }> {
  const { data, error } = await supabaseAdmin
    .from('synthex_delivery_log')
    .select('*')
    .eq('schedule_id', scheduleId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  return { data, error: null };
}

/**
 * Retry failed deliveries
 */
export async function retryFailedDeliveries(
  tenantId: string,
  options: { maxRetries?: number; limit?: number } = {}
): Promise<{ retried: number; errors: string[] }> {
  const { maxRetries = 3, limit = 100 } = options;
  const errors: string[] = [];
  let retried = 0;

  const { data: failedLogs, error } = await supabaseAdmin
    .from('synthex_delivery_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('status', 'failed')
    .lt('retry_count', maxRetries)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !failedLogs) {
    return { retried: 0, errors: [error?.message || 'Failed to fetch failed deliveries'] };
  }

  for (const log of failedLogs) {
    try {
      // Re-queue the delivery
      await supabaseAdmin
        .from('synthex_delivery_log')
        .update({
          status: 'pending',
          retry_count: log.retry_count + 1,
          next_retry_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', log.id);

      retried++;
    } catch (err) {
      errors.push(`Log ${log.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  return { retried, errors };
}

/**
 * Get delivery statistics summary
 */
export async function getDeliveryStatsSummary(
  tenantId: string,
  options: { days?: number; campaignId?: string } = {}
): Promise<{
  data: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    totalFailed: number;
    deliveryRate: number;
    openRate: number;
    clickRate: number;
  } | null;
  error: Error | null;
}> {
  const { days = 30, campaignId } = options;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  let query = supabaseAdmin
    .from('synthex_delivery_stats')
    .select('total_sent, total_delivered, total_opened, total_clicked, total_bounced, total_failed')
    .eq('tenant_id', tenantId)
    .gte('stats_date', startDate.toISOString().split('T')[0]);

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;

  if (error) {
    return { data: null, error: new Error(error.message) };
  }

  // Aggregate stats
  const stats = (data || []).reduce(
    (acc, row) => ({
      totalSent: acc.totalSent + (row.total_sent || 0),
      totalDelivered: acc.totalDelivered + (row.total_delivered || 0),
      totalOpened: acc.totalOpened + (row.total_opened || 0),
      totalClicked: acc.totalClicked + (row.total_clicked || 0),
      totalBounced: acc.totalBounced + (row.total_bounced || 0),
      totalFailed: acc.totalFailed + (row.total_failed || 0),
    }),
    {
      totalSent: 0,
      totalDelivered: 0,
      totalOpened: 0,
      totalClicked: 0,
      totalBounced: 0,
      totalFailed: 0,
    }
  );

  return {
    data: {
      ...stats,
      deliveryRate: stats.totalSent > 0 ? (stats.totalDelivered / stats.totalSent) * 100 : 0,
      openRate: stats.totalDelivered > 0 ? (stats.totalOpened / stats.totalDelivered) * 100 : 0,
      clickRate: stats.totalOpened > 0 ? (stats.totalClicked / stats.totalOpened) * 100 : 0,
    },
    error: null,
  };
}
