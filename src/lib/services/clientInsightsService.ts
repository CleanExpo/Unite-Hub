/**
 * Client Insights Service
 * Phase 48: Generate and manage client insights and recommendations
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface Insight {
  id: string;
  client_id: string;
  organization_id: string;
  insight_type: string;
  title: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
  status: 'unread' | 'read' | 'dismissed' | 'acted_on';
  read_at: string | null;
  valid_until: string | null;
  created_at: string;
}

export interface InsightData {
  clientId: string;
  organizationId: string;
  type: string;
  title: string;
  message: string;
  priority?: 'low' | 'normal' | 'high';
  validUntil?: string;
}

/**
 * Create a new insight for a client
 */
export async function createInsight(
  data: InsightData
): Promise<{ success: boolean; insight?: Insight; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data: insight, error } = await supabase
      .from('client_insights')
      .insert({
        client_id: data.clientId,
        organization_id: data.organizationId,
        insight_type: data.type,
        title: data.title,
        message: data.message,
        priority: data.priority || 'normal',
        valid_until: data.validUntil,
      })
      .select()
      .single();

    if (error) throw error;

    return { success: true, insight };
  } catch (error) {
    console.error('Error creating insight:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create insight',
    };
  }
}

/**
 * Get all insights for a client
 */
export async function getClientInsights(
  clientId: string,
  options?: { unreadOnly?: boolean; limit?: number }
): Promise<{ success: boolean; insights?: Insight[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('client_insights')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) {
      query = query.eq('status', 'unread');
    }

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter out expired insights
    const validInsights = data?.filter(insight => {
      if (!insight.valid_until) return true;
      return new Date(insight.valid_until) > new Date();
    });

    return { success: true, insights: validInsights };
  } catch (error) {
    console.error('Error fetching insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch insights',
    };
  }
}

/**
 * Mark insight as read
 */
export async function markInsightRead(
  insightId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('client_insights')
      .update({
        status: 'read',
        read_at: new Date().toISOString(),
      })
      .eq('id', insightId)
      .eq('client_id', clientId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error marking insight read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark read',
    };
  }
}

/**
 * Dismiss an insight
 */
export async function dismissInsight(
  insightId: string,
  clientId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('client_insights')
      .update({
        status: 'dismissed',
        dismissed_at: new Date().toISOString(),
      })
      .eq('id', insightId)
      .eq('client_id', clientId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error dismissing insight:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss',
    };
  }
}

/**
 * Generate weekly insights for a client based on their activity
 */
export async function generateWeeklyInsights(
  clientId: string,
  organizationId: string
): Promise<{ success: boolean; insights?: Insight[]; error?: string }> {
  try {
    const supabase = await getSupabaseServer();
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get engagement events from last week
    const { data: events } = await supabase
      .from('client_engagement_events')
      .select('event_type, event_data')
      .eq('client_id', clientId)
      .gte('created_at', oneWeekAgo);

    const insights: InsightData[] = [];

    // Analyze activity patterns
    const eventCounts: Record<string, number> = {};
    events?.forEach(e => {
      eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1;
    });

    // Generate insights based on patterns
    if ((events?.length || 0) === 0) {
      insights.push({
        clientId,
        organizationId,
        type: 'recommendation',
        title: 'Time to check in!',
        message: 'We noticed you haven\'t logged in this week. Your marketing automation is waiting - even 5 minutes can help move your campaigns forward.',
        priority: 'high',
      });
    } else {
      // Content generation insight
      if (eventCounts['content_generated'] > 0) {
        insights.push({
          clientId,
          organizationId,
          type: 'achievement',
          title: 'Content creator!',
          message: `You generated ${eventCounts['content_generated']} piece(s) of content this week. Keep the momentum going!`,
          priority: 'normal',
        });
      }

      // Task completion insight
      if (eventCounts['task_completed'] > 0) {
        insights.push({
          clientId,
          organizationId,
          type: 'milestone',
          title: 'Making progress',
          message: `You completed ${eventCounts['task_completed']} task(s) this week. You're building great habits!`,
          priority: 'normal',
        });
      }

      // Visual creation insight
      if (eventCounts['visual_created'] > 0) {
        insights.push({
          clientId,
          organizationId,
          type: 'achievement',
          title: 'Visual storyteller',
          message: `You created ${eventCounts['visual_created']} visual(s) this week. Great content needs great visuals!`,
          priority: 'normal',
        });
      }

      // General activity insight
      if (!insights.length && events && events.length > 0) {
        insights.push({
          clientId,
          organizationId,
          type: 'weekly_summary',
          title: 'Week in review',
          message: `You had ${events.length} activities this week. Consider setting a goal for next week to increase your engagement.`,
          priority: 'low',
        });
      }
    }

    // Check onboarding status
    const { data: tasks } = await supabase
      .from('client_onboarding_tasks')
      .select('status')
      .eq('client_id', clientId);

    if (tasks) {
      const pending = tasks.filter(t => t.status === 'pending').length;
      if (pending > 0 && pending <= 3) {
        insights.push({
          clientId,
          organizationId,
          type: 'tip',
          title: 'Almost there!',
          message: `You have just ${pending} task(s) left to complete your onboarding. Finishing these will unlock your full potential.`,
          priority: 'normal',
        });
      }
    }

    // Create all insights
    const createdInsights: Insight[] = [];
    for (const insightData of insights) {
      const result = await createInsight(insightData);
      if (result.success && result.insight) {
        createdInsights.push(result.insight);
      }
    }

    return { success: true, insights: createdInsights };
  } catch (error) {
    console.error('Error generating weekly insights:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate insights',
    };
  }
}

/**
 * Get unread insight count for a client
 */
export async function getUnreadInsightCount(
  clientId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { count, error } = await supabase
      .from('client_insights')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId)
      .eq('status', 'unread');

    if (error) throw error;

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch count',
    };
  }
}

export default {
  createInsight,
  getClientInsights,
  markInsightRead,
  dismissInsight,
  generateWeeklyInsights,
  getUnreadInsightCount,
};
