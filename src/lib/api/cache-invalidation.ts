/**
 * Cache Invalidation Helpers
 *
 * Centralized invalidation for the CacheManager (src/lib/cache.ts).
 * Call these after successful write operations to keep cached data fresh.
 */

import { getCache, CacheKeys } from '@/lib/cache';
import { log } from '@/lib/logger';

/**
 * Invalidate all contact-related caches for a workspace (and optionally a single contact).
 */
export async function invalidateContactCaches(
  workspaceId: string,
  contactId?: string,
): Promise<void> {
  const cache = getCache();

  try {
    // Always clear the workspace-level lists
    await cache.delPattern(`contacts:workspace:${workspaceId}:*`);
    await cache.delPattern(`contacts:hot:${workspaceId}*`);

    if (contactId) {
      await cache.del(CacheKeys.contact(contactId));
      await cache.del(CacheKeys.contactScore(contactId));
      await cache.del(CacheKeys.aiAnalysis(contactId));
    }

    log.debug(
      `Cache invalidated: contacts for workspace ${workspaceId}` +
        (contactId ? ` (contact ${contactId})` : ''),
    );
  } catch (error) {
    log.error('Contact cache invalidation error:', error);
  }
}

/**
 * Invalidate all campaign-related caches for a workspace (and optionally a single campaign).
 */
export async function invalidateCampaignCaches(
  workspaceId: string,
  campaignId?: string,
): Promise<void> {
  const cache = getCache();

  try {
    await cache.delPattern(`campaigns:workspace:${workspaceId}*`);

    if (campaignId) {
      await cache.del(CacheKeys.campaign(campaignId));
      await cache.del(CacheKeys.campaignStats(campaignId));
    }

    log.debug(
      `Cache invalidated: campaigns for workspace ${workspaceId}` +
        (campaignId ? ` (campaign ${campaignId})` : ''),
    );
  } catch (error) {
    log.error('Campaign cache invalidation error:', error);
  }
}

/**
 * Invalidate all profile-related caches for a user.
 */
export async function invalidateProfileCache(
  userId: string,
): Promise<void> {
  const cache = getCache();

  try {
    await cache.del(CacheKeys.userProfile(userId));
    await cache.del(CacheKeys.userOrganizations(userId));
    await cache.del(CacheKeys.userWorkspaces(userId));

    log.debug(`Cache invalidated: profile for user ${userId}`);
  } catch (error) {
    log.error('Profile cache invalidation error:', error);
  }
}
