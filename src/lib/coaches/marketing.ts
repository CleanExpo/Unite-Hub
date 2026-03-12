// src/lib/coaches/marketing.ts
// Marketing Coach data fetcher — social channel health across businesses

import type { CoachContext, CoachDataFetcher } from './types'
import { BUSINESSES } from '@/lib/businesses'
import { getChannels } from '@/lib/integrations/social/channels'
import type { SocialChannel } from '@/lib/integrations/social/types'

export const fetchMarketingData: CoachDataFetcher = async (founderId: string): Promise<CoachContext> => {
  const reportDate = new Date().toISOString().split('T')[0]

  let channels: SocialChannel[]
  try {
    channels = await getChannels(founderId)
  } catch (err) {
    console.warn('[Marketing Coach] Failed to fetch channels, using empty data:', err)
    channels = []
  }

  // Map business keys to names
  const businessNameMap = new Map<string, string>(BUSINESSES.map((b) => [b.key, b.name]))

  const channelData = channels.map((c) => ({
    platform: c.platform,
    businessKey: c.businessKey,
    businessName: businessNameMap.get(c.businessKey) ?? c.businessKey,
    channelName: c.channelName,
    handle: c.handle,
    followerCount: c.followerCount,
    isConnected: c.isConnected,
    lastSyncedAt: c.lastSyncedAt,
  }))

  return {
    coachType: 'marketing',
    reportDate,
    data: {
      channels: channelData,
      totalChannels: channelData.length,
      connectedChannels: channelData.filter((c) => c.isConnected).length,
      disconnectedChannels: channelData.filter((c) => !c.isConnected).length,
      totalFollowers: channelData.reduce((sum, c) => sum + c.followerCount, 0),
    },
  }
}
