/**
 * CONVEX Strategy Collaboration Features
 *
 * Implements team collaboration for strategies:
 * - Share strategies with team members
 * - Comments and feedback on strategies
 * - Permission-based access control
 * - Activity logging and notifications
 * - Real-time collaboration signals
 */

import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export type AccessLevel = 'viewer' | 'editor' | 'owner';
export type ActivityType = 'created' | 'updated' | 'commented' | 'shared' | 'restored';

export interface StrategyShare {
  id: string;
  strategy_id: string;
  shared_with_user_id: string;
  shared_by_user_id: string;
  access_level: AccessLevel;
  created_at: string;
  expires_at?: string;
}

export interface StrategyComment {
  id: string;
  strategy_id: string;
  version?: number;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
  replies?: StrategyComment[];
  resolved: boolean;
}

export interface StrategyActivity {
  id: string;
  strategy_id: string;
  activity_type: ActivityType;
  user_id: string;
  user_name: string;
  description: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// ============================================================================
// SHARING FUNCTIONS
// ============================================================================

/**
 * Share strategy with a team member
 */
export async function shareStrategy(
  strategyId: string,
  ownerId: string,
  shareWithUserId: string,
  accessLevel: AccessLevel = 'viewer',
  expiresIn?: number // days
): Promise<StrategyShare | null> {
  try {
    const supabase = await getSupabaseServer();

    const shareRecord = {
      strategy_id: strategyId,
      shared_with_user_id: shareWithUserId,
      shared_by_user_id: ownerId,
      access_level: accessLevel,
      expires_at: expiresIn
        ? new Date(Date.now() + expiresIn * 24 * 60 * 60 * 1000).toISOString()
        : null,
    };

    const { data, error } = await supabase
      .from('convex_strategy_shares')
      .insert([shareRecord])
      .select()
      .single();

    if (error) {
      logger.error('[CONVEX-COLLAB] Failed to share strategy:', error);
      return null;
    }

    // Log activity
    await logActivity(strategyId, ownerId, 'shared', `Shared with user ${shareWithUserId}`, {
      accessLevel,
      expiresIn,
    });

    logger.info(`[CONVEX-COLLAB] Strategy ${strategyId} shared with ${shareWithUserId}`);
    return data as StrategyShare;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Share error:', error);
    return null;
  }
}

/**
 * Get list of users with access to strategy
 */
export async function getStrategyAccess(
  strategyId: string
): Promise<StrategyShare[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_shares')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false });

    if (error) {
      logger.warn(`[CONVEX-COLLAB] Failed to get access list for ${strategyId}`, error);
      return [];
    }

    return (data || []) as StrategyShare[];
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Access list error:', error);
    return [];
  }
}

/**
 * Revoke access to strategy
 */
export async function revokeAccess(
  strategyId: string,
  shareId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('convex_strategy_shares')
      .delete()
      .eq('id', shareId)
      .eq('strategy_id', strategyId);

    if (error) {
      logger.error('[CONVEX-COLLAB] Failed to revoke access:', error);
      return false;
    }

    // Log activity
    await logActivity(strategyId, userId, 'updated', `Revoked user access`, {
      shareId,
    });

    logger.info(`[CONVEX-COLLAB] Access revoked for share ${shareId}`);
    return true;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Revoke error:', error);
    return false;
  }
}

/**
 * Update access level
 */
export async function updateAccessLevel(
  shareId: string,
  newAccessLevel: AccessLevel,
  userId: string
): Promise<StrategyShare | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_shares')
      .update({ access_level: newAccessLevel })
      .eq('id', shareId)
      .select()
      .single();

    if (error) {
      logger.error('[CONVEX-COLLAB] Failed to update access level:', error);
      return null;
    }

    logger.info(`[CONVEX-COLLAB] Access level updated for share ${shareId}`);
    return data as StrategyShare;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Access update error:', error);
    return null;
  }
}

/**
 * Check if user has access to strategy
 */
export async function checkAccess(
  strategyId: string,
  userId: string
): Promise<AccessLevel | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_shares')
      .select('access_level')
      .eq('strategy_id', strategyId)
      .eq('shared_with_user_id', userId)
      .single();

    if (error) {
      return null;
    }

    return data?.access_level as AccessLevel;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Access check error:', error);
    return null;
  }
}

// ============================================================================
// COMMENTING FUNCTIONS
// ============================================================================

/**
 * Add comment to strategy
 */
export async function addComment(
  strategyId: string,
  version: number,
  userId: string,
  userName: string,
  content: string
): Promise<StrategyComment | null> {
  try {
    const supabase = await getSupabaseServer();

    const commentRecord = {
      strategy_id: strategyId,
      version,
      author_id: userId,
      author_name: userName,
      content,
      resolved: false,
    };

    const { data, error } = await supabase
      .from('convex_strategy_comments')
      .insert([commentRecord])
      .select()
      .single();

    if (error) {
      logger.error('[CONVEX-COLLAB] Failed to add comment:', error);
      return null;
    }

    // Log activity
    await logActivity(strategyId, userId, 'commented', `Added comment: ${content.slice(0, 50)}...`);

    logger.info(`[CONVEX-COLLAB] Comment added to strategy ${strategyId}`);
    return data as StrategyComment;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Comment error:', error);
    return null;
  }
}

/**
 * Get comments for strategy
 */
export async function getStrategyComments(
  strategyId: string,
  version?: number
): Promise<StrategyComment[]> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('convex_strategy_comments')
      .select('*')
      .eq('strategy_id', strategyId);

    if (version !== undefined) {
      query = query.eq('version', version);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      logger.warn(`[CONVEX-COLLAB] Failed to get comments for ${strategyId}`, error);
      return [];
    }

    return (data || []) as StrategyComment[];
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Comments retrieval error:', error);
    return [];
  }
}

/**
 * Resolve comment
 */
export async function resolveComment(
  commentId: string,
  strategyId: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('convex_strategy_comments')
      .update({ resolved: true })
      .eq('id', commentId)
      .eq('strategy_id', strategyId);

    if (error) {
      logger.error('[CONVEX-COLLAB] Failed to resolve comment:', error);
      return false;
    }

    logger.info(`[CONVEX-COLLAB] Comment ${commentId} resolved`);
    return true;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Comment resolve error:', error);
    return false;
  }
}

/**
 * Delete comment
 */
export async function deleteComment(
  commentId: string,
  strategyId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('convex_strategy_comments')
      .delete()
      .eq('id', commentId)
      .eq('strategy_id', strategyId)
      .eq('author_id', userId);

    if (error) {
      logger.error('[CONVEX-COLLAB] Failed to delete comment:', error);
      return false;
    }

    logger.info(`[CONVEX-COLLAB] Comment ${commentId} deleted`);
    return true;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Comment delete error:', error);
    return false;
  }
}

// ============================================================================
// ACTIVITY LOGGING
// ============================================================================

/**
 * Log activity on strategy
 */
export async function logActivity(
  strategyId: string,
  userId: string,
  activityType: ActivityType,
  description: string,
  metadata?: Record<string, any>
): Promise<StrategyActivity | null> {
  try {
    const supabase = await getSupabaseServer();

    const activityRecord = {
      strategy_id: strategyId,
      activity_type: activityType,
      user_id: userId,
      user_name: 'User', // In production, fetch from user profile
      description,
      metadata: metadata || {},
    };

    const { data, error } = await supabase
      .from('convex_strategy_activity')
      .insert([activityRecord])
      .select()
      .single();

    if (error) {
      logger.error('[CONVEX-COLLAB] Failed to log activity:', error);
      return null;
    }

    return data as StrategyActivity;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Activity logging error:', error);
    return null;
  }
}

/**
 * Get activity history for strategy
 */
export async function getActivityHistory(
  strategyId: string,
  limit: number = 50
): Promise<StrategyActivity[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_activity')
      .select('*')
      .eq('strategy_id', strategyId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn(`[CONVEX-COLLAB] Failed to get activity for ${strategyId}`, error);
      return [];
    }

    return (data || []) as StrategyActivity[];
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Activity history error:', error);
    return [];
  }
}

/**
 * Get recent activity for workspace
 */
export async function getWorkspaceActivity(
  workspaceId: string,
  limit: number = 100
): Promise<StrategyActivity[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_activity')
      .select('*, convex_strategy_scores(metadata)')
      .eq('convex_strategy_scores.workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn(`[CONVEX-COLLAB] Failed to get workspace activity`, error);
      return [];
    }

    return (data || []) as StrategyActivity[];
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Workspace activity error:', error);
    return [];
  }
}

/**
 * Get activity summary for dashboard
 */
export interface ActivitySummary {
  totalActivities: number;
  activitiesByType: Record<ActivityType, number>;
  activeUsers: number;
  lastActivityTime: string;
}

export async function getActivitySummary(
  strategyId: string
): Promise<ActivitySummary | null> {
  try {
    const activities = await getActivityHistory(strategyId, 1000);

    const summary: ActivitySummary = {
      totalActivities: activities.length,
      activitiesByType: {
        created: 0,
        updated: 0,
        commented: 0,
        shared: 0,
        restored: 0,
      },
      activeUsers: new Set(activities.map((a) => a.user_id)).size,
      lastActivityTime: activities[0]?.created_at || new Date().toISOString(),
    };

    activities.forEach((activity) => {
      summary.activitiesByType[activity.activity_type]++;
    });

    return summary;
  } catch (error) {
    logger.error('[CONVEX-COLLAB] Activity summary error:', error);
    return null;
  }
}
