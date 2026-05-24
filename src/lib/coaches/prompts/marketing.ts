// src/lib/coaches/prompts/marketing.ts
// Marketing Coach prompt — digital marketing strategist for Australian SME portfolio

export const MARKETING_COACH_SYSTEM_PROMPT = `You are a digital marketing strategist coaching an Australian founder who manages social media presence across 8 businesses.

Your role is to review social channel health, content opportunities, and audience engagement across the portfolio.

Output format (Markdown):
## Channel Health
- Connected channels summary (platform, business, follower count)
- Disconnected or expired channels needing reconnection

## Content Suggestions
- Content themes based on each business's industry and audience
- Posting frequency recommendations
- Cross-promotion opportunities between businesses

## Growth Opportunities
- Channels with highest growth potential
- Platforms not yet utilised
- Engagement tactics for each business type

## Quick Wins
- 2-3 actionable items for today
- Any trending topics relevant to the portfolio's industries

Keep it practical and actionable. Use Australian English. Focus on organic growth strategies suitable for SMEs.`

export function buildMarketingUserMessage(data: {
  channels: Array<{
    platform: string
    businessKey: string
    businessName: string
    channelName: string | null
    handle: string | null
    followerCount: number
    isConnected: boolean
    lastSyncedAt: string | null
  }>
  todayDate: string
}): string {
  const lines: string[] = [`Report Date: ${data.todayDate}`]

  const connected = data.channels.filter((c) => c.isConnected)
  const disconnected = data.channels.filter((c) => !c.isConnected)

  lines.push(`\n### Connected Channels (${connected.length})`)
  if (connected.length === 0) {
    lines.push('No social channels currently connected.')
  } else {
    for (const c of connected) {
      lines.push(
        `- ${c.platform} — ${c.businessName} (${c.businessKey}): ` +
        `${c.handle ?? c.channelName ?? 'unnamed'}, ` +
        `${c.followerCount.toLocaleString('en-AU')} followers` +
        (c.lastSyncedAt ? `, last synced ${c.lastSyncedAt}` : '')
      )
    }
  }

  if (disconnected.length > 0) {
    lines.push(`\n### Disconnected Channels (${disconnected.length})`)
    for (const c of disconnected) {
      lines.push(`- ${c.platform} — ${c.businessName} (${c.businessKey}): needs reconnection`)
    }
  }

  lines.push(`\n### Portfolio Summary`)
  lines.push(`- Total channels: ${data.channels.length}`)
  lines.push(`- Connected: ${connected.length}`)
  lines.push(`- Disconnected: ${disconnected.length}`)
  lines.push(`- Total followers: ${data.channels.reduce((sum, c) => sum + c.followerCount, 0).toLocaleString('en-AU')}`)

  return lines.join('\n')
}
