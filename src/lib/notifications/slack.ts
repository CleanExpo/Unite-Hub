// src/lib/notifications/slack.ts
// Slack message sender using Incoming Webhooks
// Never throws — notifications must not crash the calling service

import { BUSINESSES } from '@/lib/businesses'

export interface SlackMessage {
  text: string
  blocks?: SlackBlock[]
  channel?: string
}

interface SlackBlock {
  type: 'section' | 'header' | 'divider' | 'context'
  text?: { type: 'mrkdwn' | 'plain_text'; text: string }
  fields?: { type: 'mrkdwn'; text: string }[]
  elements?: { type: 'mrkdwn'; text: string }[]
}

/**
 * POST a message to a Slack Incoming Webhook URL.
 * Returns true on success, false on failure. Never throws.
 */
export async function sendSlack(
  webhookUrl: string,
  message: SlackMessage
): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message),
    })

    if (!response.ok) {
      console.error(
        `[Slack] Webhook failed: ${response.status} ${response.statusText}`
      )
      return false
    }

    return true
  } catch (error) {
    console.error(
      '[Slack] Send error:',
      error instanceof Error ? error.message : 'Unknown error'
    )
    return false
  }
}

const SEVERITY_COLOURS: Record<string, string> = {
  info: '#00F5FF',     // Cyan — Scientific Luxury palette
  warning: '#FFB800',  // Amber
  critical: '#ef4444', // Red
}

const SEVERITY_EMOJI: Record<string, string> = {
  info: ':large_blue_circle:',
  warning: ':warning:',
  critical: ':rotating_light:',
}

/**
 * Format a notification payload into a Slack Block Kit message
 * with colour-coded severity and optional business context.
 */
export function formatSlackNotification(payload: {
  title: string
  body: string
  severity: 'info' | 'warning' | 'critical'
  businessKey?: string
}): SlackMessage {
  const { title, body, severity, businessKey } = payload
  const colour = SEVERITY_COLOURS[severity] ?? SEVERITY_COLOURS.info
  const emoji = SEVERITY_EMOJI[severity] ?? SEVERITY_EMOJI.info

  const business = businessKey
    ? BUSINESSES.find((b) => b.key === businessKey)
    : undefined

  const businessLabel = business ? ` — ${business.name}` : ''

  const blocks: SlackBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: `${title}${businessLabel}`,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: body,
      },
    },
    { type: 'divider' },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `${emoji} *Severity:* ${severity.toUpperCase()} | *Colour:* \`${colour}\` | *Sent:* <!date^${Math.floor(Date.now() / 1000)}^{date_short_pretty} at {time}|${new Date().toISOString()}>`,
        },
      ],
    },
  ]

  // Add business fields if applicable
  if (business) {
    blocks.splice(2, 0, {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Business:*\n${business.name}` },
        { type: 'mrkdwn', text: `*Key:*\n\`${business.key}\`` },
      ],
    })
  }

  return {
    text: `${title}${businessLabel}: ${body}`, // Fallback for non-Block Kit clients
    blocks,
  }
}
