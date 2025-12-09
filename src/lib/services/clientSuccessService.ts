/**
 * Client Success Service
 * Phase 48: Core service for tracking and calculating client success
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface EngagementEvent {
  clientId: string;
  organizationId: string;
  eventType: string;
  eventData?: Record<string, any>;
  sessionId?: string;
  pagePath?: string;
  durationSeconds?: number;
}

export interface SuccessScore {
  id: string;
  client_id: string;
  organization_id: string;
  engagement_score: number;
  activation_score: number;
  progress_score: number;
  satisfaction_score: number;
  momentum_score: number;
  overall_score: number;
  previous_score: number | null;
  score_change: number;
  trend: 'rising' | 'stable' | 'declining';
  factors_used: string[];
  calculated_at: string;
}

// Score weights for overall calculation
const SCORE_WEIGHTS = {
  engagement: 0.25,
  activation: 0.20,
  progress: 0.25,
  satisfaction: 0.15,
  momentum: 0.15,
};

/**
 * Track an engagement event
 */
export async function trackEngagementEvent(
  event: EngagementEvent
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase.from('client_engagement_events').insert({
      client_id: event.clientId,
      organization_id: event.organizationId,
      event_type: event.eventType,
      event_data: event.eventData || {},
      session_id: event.sessionId,
      page_path: event.pagePath,
      duration_seconds: event.durationSeconds,
    });

    if (error) {
throw error;
}

    return { success: true };
  } catch (error) {
    console.error('Error tracking engagement event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to track event',
    };
  }
}

/**
 * Calculate engagement score based on activity
 */
async function calculateEngagementScore(
  clientId: string,
  daysBack: number = 7
): Promise<number> {
  const supabase = await getSupabaseServer();
  const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from('client_engagement_events')
    .select('event_type, created_at')
    .eq('client_id', clientId)
    .gte('created_at', since);

  if (!events || events.length === 0) {
return 0;
}

  // Count unique days with activity
  const uniqueDays = new Set(
    events.map(e => new Date(e.created_at).toDateString())
  ).size;

  // Count high-value events
  const highValueEvents = events.filter(e =>
    ['content_generated', 'visual_created', 'task_completed'].includes(e.event_type)
  ).length;

  // Calculate score: days active (50%) + event frequency (50%)
  const daysScore = (uniqueDays / daysBack) * 50;
  const eventScore = Math.min((events.length / 20) * 50, 50);

  return Math.round(daysScore + eventScore + (highValueEvents > 0 ? 10 : 0));
}

/**
 * Calculate activation score based on onboarding completion
 */
async function calculateActivationScore(clientId: string): Promise<number> {
  const supabase = await getSupabaseServer();

  // Check onboarding tasks completion
  const { data: tasks } = await supabase
    .from('client_onboarding_tasks')
    .select('status')
    .eq('client_id', clientId);

  if (!tasks || tasks.length === 0) {
return 0;
}

  const completed = tasks.filter(
    t => t.status === 'completed' || t.status === 'skipped'
  ).length;

  // Check launch kit status
  const { data: kit } = await supabase
    .from('client_launch_kits')
    .select('status')
    .eq('client_id', clientId)
    .single();

  const kitViewed = kit?.status === 'viewed' || kit?.status === 'completed';

  // Calculate: tasks (70%) + kit viewed (30%)
  const taskScore = (completed / tasks.length) * 70;
  const kitScore = kitViewed ? 30 : 0;

  return Math.round(taskScore + kitScore);
}

/**
 * Calculate progress score based on platform usage
 */
async function calculateProgressScore(clientId: string): Promise<number> {
  const supabase = await getSupabaseServer();

  // Count content generated
  const { count: contentCount } = await supabase
    .from('generatedContent')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', clientId);

  // Count visuals created (if table exists)
  let visualCount = 0;
  try {
    const { count } = await supabase
      .from('image_approvals')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', clientId);
    visualCount = count || 0;
  } catch {
    // Table may not exist
  }

  // Score based on milestones
  let score = 0;
  if ((contentCount || 0) >= 1) {
score += 20;
}
  if ((contentCount || 0) >= 5) {
score += 20;
}
  if ((contentCount || 0) >= 10) {
score += 10;
}
  if (visualCount >= 1) {
score += 20;
}
  if (visualCount >= 5) {
score += 15;
}
  if (visualCount >= 10) {
score += 15;
}

  return Math.min(score, 100);
}

/**
 * Calculate momentum score (recent activity trend)
 */
async function calculateMomentumScore(clientId: string): Promise<number> {
  const supabase = await getSupabaseServer();

  // Get last 2 weeks of activity
  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: events } = await supabase
    .from('client_engagement_events')
    .select('created_at')
    .eq('client_id', clientId)
    .gte('created_at', twoWeeksAgo);

  if (!events || events.length === 0) {
return 0;
}

  // Split into weeks
  const thisWeek = events.filter(e => new Date(e.created_at) >= new Date(oneWeekAgo)).length;
  const lastWeek = events.length - thisWeek;

  // Calculate trend
  if (lastWeek === 0) {
return thisWeek > 0 ? 80 : 0;
}

  const change = ((thisWeek - lastWeek) / lastWeek) * 100;

  // Map to score
  if (change >= 50) {
return 100;
}
  if (change >= 20) {
return 80;
}
  if (change >= 0) {
return 60;
}
  if (change >= -20) {
return 40;
}
  if (change >= -50) {
return 20;
}
  return 0;
}

/**
 * Calculate and store success score for a client
 */
export async function calculateSuccessScore(
  clientId: string,
  organizationId: string
): Promise<{ success: boolean; score?: SuccessScore; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Calculate all component scores
    const [engagementScore, activationScore, progressScore, momentumScore] = await Promise.all([
      calculateEngagementScore(clientId),
      calculateActivationScore(clientId),
      calculateProgressScore(clientId),
      calculateMomentumScore(clientId),
    ]);

    // For now, satisfaction is neutral (could be based on feedback)
    const satisfactionScore = 50;

    // Calculate overall weighted score
    const overallScore = Math.round(
      engagementScore * SCORE_WEIGHTS.engagement +
      activationScore * SCORE_WEIGHTS.activation +
      progressScore * SCORE_WEIGHTS.progress +
      satisfactionScore * SCORE_WEIGHTS.satisfaction +
      momentumScore * SCORE_WEIGHTS.momentum
    );

    // Get previous score
    const { data: previousScoreData } = await supabase
      .from('client_success_scores')
      .select('overall_score')
      .eq('client_id', clientId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    const previousScore = previousScoreData?.overall_score || null;
    const scoreChange = previousScore !== null ? overallScore - previousScore : 0;

    // Determine trend
    let trend: 'rising' | 'stable' | 'declining' = 'stable';
    if (scoreChange > 5) {
trend = 'rising';
} else if (scoreChange < -5) {
trend = 'declining';
}

    // Store score
    const { data: score, error } = await supabase
      .from('client_success_scores')
      .insert({
        client_id: clientId,
        organization_id: organizationId,
        engagement_score: engagementScore,
        activation_score: activationScore,
        progress_score: progressScore,
        satisfaction_score: satisfactionScore,
        momentum_score: momentumScore,
        overall_score: overallScore,
        previous_score: previousScore,
        score_change: scoreChange,
        trend,
        factors_used: ['engagement', 'activation', 'progress', 'satisfaction', 'momentum'],
        calculated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
throw error;
}

    return { success: true, score };
  } catch (error) {
    console.error('Error calculating success score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to calculate score',
    };
  }
}

/**
 * Get latest success score for a client
 */
export async function getClientSuccessScore(
  clientId: string
): Promise<{ success: boolean; score?: SuccessScore; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('client_success_scores')
      .select('*')
      .eq('client_id', clientId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
throw error;
}

    return { success: true, score: data };
  } catch (error) {
    console.error('Error fetching success score:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch score',
    };
  }
}

/**
 * Get engagement history for heatmap
 */
export async function getEngagementHistory(
  clientId: string,
  daysBack: number = 30
): Promise<{ success: boolean; history?: Array<{ date: string; count: number }>; error?: string }> {
  try {
    const supabase = await getSupabaseServer();
    const since = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    const { data: events, error } = await supabase
      .from('client_engagement_events')
      .select('created_at')
      .eq('client_id', clientId)
      .gte('created_at', since);

    if (error) {
throw error;
}

    // Group by date
    const counts: Record<string, number> = {};
    events?.forEach(event => {
      const date = new Date(event.created_at).toISOString().split('T')[0];
      counts[date] = (counts[date] || 0) + 1;
    });

    const history = Object.entries(counts).map(([date, count]) => ({ date, count }));

    return { success: true, history };
  } catch (error) {
    console.error('Error fetching engagement history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch history',
    };
  }
}

/**
 * Get all clients with their scores for org dashboard
 */
export async function getOrgClientScores(
  organizationId: string
): Promise<{ success: boolean; clients?: Array<any>; error?: string }> {
  try {
    const supabase = await getSupabaseServer();

    // Get latest score per client
    const { data, error } = await supabase
      .from('client_success_scores')
      .select(`
        *,
        user_profiles:client_id (
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('organization_id', organizationId)
      .order('calculated_at', { ascending: false });

    if (error) {
throw error;
}

    // Deduplicate to get latest per client
    const clientMap = new Map();
    data?.forEach(score => {
      if (!clientMap.has(score.client_id)) {
        clientMap.set(score.client_id, score);
      }
    });

    return { success: true, clients: Array.from(clientMap.values()) };
  } catch (error) {
    console.error('Error fetching org client scores:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch scores',
    };
  }
}

export default {
  trackEngagementEvent,
  calculateSuccessScore,
  getClientSuccessScore,
  getEngagementHistory,
  getOrgClientScores,
};
