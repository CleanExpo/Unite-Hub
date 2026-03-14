// src/lib/notifications/index.ts
// Centralised notification router
// All notification delivery is fire-and-forget — never throws, never blocks callers.

import { sendSlack, formatSlackNotification } from './slack'
import { createServiceClient } from '@/lib/supabase/service'

export type NotificationType =
  | 'cron_complete'
  | 'advisory_update'
  | 'approval_alert'
  | 'bookkeeper_summary'
  | 'experiment_update'

export interface NotificationPayload {
  type: NotificationType
  title: string
  body: string
  businessKey?: string
  severity: 'info' | 'warning' | 'critical'
  metadata?: Record<string, unknown>
}

/**
 * Route a notification to all enabled channels for the founder.
 * Never throws — wraps everything in try/catch so callers can fire-and-forget.
 */
export async function notify(payload: NotificationPayload): Promise<void> {
  try {
    const { type, title, body, businessKey, severity, metadata } = payload
    const founderId = process.env.FOUNDER_USER_ID

    // Audit log — always fires regardless of channel preferences
    console.log(
      `[Notify] type=${type} severity=${severity} title="${title}"` +
        (businessKey ? ` business=${businessKey}` : '') +
        (metadata ? ` metadata=${JSON.stringify(metadata)}` : '')
    )

    if (!founderId) {
      console.warn('[Notify] FOUNDER_USER_ID not set — skipping channel delivery')
      return
    }

    // Fetch founder's notification preferences
    const supabase = createServiceClient()
    const { data: settings, error } = await supabase
      .from('user_settings')
      .select(
        'notification_slack, notification_digest, slack_webhook_url, slack_channel'
      )
      .eq('user_id', founderId)
      .single()

    if (error) {
      console.warn('[Notify] Could not fetch user_settings:', error.message)
      // Fall back to env-based Slack if available
      await attemptEnvSlack(payload)
      return
    }

    // ── Slack channel ───────────────────────────────────────────
    if (settings?.notification_slack && settings?.slack_webhook_url) {
      const message = formatSlackNotification({ title, body, severity, businessKey })
      if (settings.slack_channel) {
        message.channel = settings.slack_channel
      }
      const sent = await sendSlack(settings.slack_webhook_url, message)
      if (!sent) {
        console.warn('[Notify] Slack delivery failed — message was logged above')
      }
    } else {
      // Try env-based Slack as fallback
      await attemptEnvSlack(payload)
    }

    // ── Email digest channel (stub) ─────────────────────────────
    if (settings?.notification_digest) {
      // Future: queue for daily digest email
      console.log(`[Notify] Digest queued: ${title}`)
    }
  } catch (error) {
    // Absolute last resort — never let notification errors propagate
    console.error(
      '[Notify] Unhandled error:',
      error instanceof Error ? error.message : 'Unknown error'
    )
  }
}

/**
 * Attempt Slack delivery using environment variables when DB settings
 * are unavailable or Slack is not configured in user_settings.
 */
async function attemptEnvSlack(payload: NotificationPayload): Promise<void> {
  const envWebhook = process.env.SLACK_WEBHOOK_URL
  if (!envWebhook) return

  const message = formatSlackNotification({
    title: payload.title,
    body: payload.body,
    severity: payload.severity,
    businessKey: payload.businessKey,
  })
  message.channel = process.env.SLACK_DEFAULT_CHANNEL ?? '#nexus-alerts'

  await sendSlack(envWebhook, message)
}
