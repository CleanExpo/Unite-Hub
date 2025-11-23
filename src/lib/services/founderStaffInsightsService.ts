/**
 * Founder Staff Insights Service
 * Phase 51: AI-generated staff activity analysis
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface StaffInsight {
  id: string;
  founder_id: string;
  staff_id: string;
  period_start: string;
  period_end: string;
  tasks_completed: number;
  tasks_in_progress: number;
  hours_logged: number;
  client_interactions: number;
  content_generated: number;
  productivity_score: number;
  engagement_score: number;
  ai_insights: any[];
}

// Generate staff insights for a period
export async function generateStaffInsights(
  founderId: string,
  organizationId: string,
  staffId: string,
  periodStart: string,
  periodEnd: string
): Promise<StaffInsight | null> {
  const supabase = await getSupabaseServer();

  // Get task completions
  const { data: tasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('assigned_to', staffId)
    .gte('updated_at', periodStart)
    .lte('updated_at', periodEnd);

  const tasksCompleted = (tasks || []).filter((t) => t.status === 'completed').length;
  const tasksInProgress = (tasks || []).filter((t) => t.status === 'in_progress').length;

  // Get time logged (simplified - would connect to time tracking)
  const hoursLogged = tasksCompleted * 2; // Placeholder: 2 hours per task

  // Get client interactions (emails sent)
  const { data: interactions } = await supabase
    .from('emails')
    .select('id')
    .eq('user_id', staffId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  const clientInteractions = interactions?.length || 0;

  // Get content generated
  const { data: content } = await supabase
    .from('generatedContent')
    .select('id')
    .eq('user_id', staffId)
    .gte('created_at', periodStart)
    .lte('created_at', periodEnd);

  const contentGenerated = content?.length || 0;

  // Calculate scores
  const productivityScore = calculateProductivityScore(
    tasksCompleted,
    hoursLogged,
    contentGenerated
  );

  const engagementScore = calculateEngagementScore(
    clientInteractions,
    contentGenerated,
    tasksInProgress
  );

  // Generate insights
  const aiInsights = generateInsights({
    tasksCompleted,
    tasksInProgress,
    hoursLogged,
    clientInteractions,
    contentGenerated,
    productivityScore,
    engagementScore,
  });

  // Save insights
  const { data, error } = await supabase
    .from('founder_staff_insights')
    .insert({
      founder_id: founderId,
      organization_id: organizationId,
      staff_id: staffId,
      period_start: periodStart,
      period_end: periodEnd,
      tasks_completed: tasksCompleted,
      tasks_in_progress: tasksInProgress,
      hours_logged: hoursLogged,
      client_interactions: clientInteractions,
      content_generated: contentGenerated,
      productivity_score: productivityScore,
      engagement_score: engagementScore,
      ai_insights: aiInsights,
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving staff insights:', error);
    return null;
  }

  return data as StaffInsight;
}

// Get staff insights
export async function getStaffInsights(
  founderId: string,
  options: {
    staffId?: string;
    periodStart?: string;
    periodEnd?: string;
    limit?: number;
  } = {}
): Promise<StaffInsight[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_staff_insights')
    .select('*')
    .eq('founder_id', founderId)
    .order('period_end', { ascending: false });

  if (options.staffId) {
    query = query.eq('staff_id', options.staffId);
  }

  if (options.periodStart) {
    query = query.gte('period_start', options.periodStart);
  }

  if (options.periodEnd) {
    query = query.lte('period_end', options.periodEnd);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching staff insights:', error);
    return [];
  }

  return data as StaffInsight[];
}

// Get team overview
export async function getTeamOverview(
  founderId: string,
  periodStart: string,
  periodEnd: string
): Promise<{
  totalStaff: number;
  avgProductivity: number;
  avgEngagement: number;
  totalTasks: number;
  totalHours: number;
  topPerformers: { staffId: string; score: number }[];
}> {
  const insights = await getStaffInsights(founderId, { periodStart, periodEnd });

  if (insights.length === 0) {
    return {
      totalStaff: 0,
      avgProductivity: 0,
      avgEngagement: 0,
      totalTasks: 0,
      totalHours: 0,
      topPerformers: [],
    };
  }

  // Aggregate by staff member
  const staffMap = new Map<string, StaffInsight>();
  insights.forEach((insight) => {
    const existing = staffMap.get(insight.staff_id);
    if (!existing || new Date(insight.period_end) > new Date(existing.period_end)) {
      staffMap.set(insight.staff_id, insight);
    }
  });

  const uniqueInsights = Array.from(staffMap.values());

  const totalProductivity = uniqueInsights.reduce((sum, i) => sum + i.productivity_score, 0);
  const totalEngagement = uniqueInsights.reduce((sum, i) => sum + i.engagement_score, 0);
  const totalTasks = uniqueInsights.reduce((sum, i) => sum + i.tasks_completed, 0);
  const totalHours = uniqueInsights.reduce((sum, i) => sum + i.hours_logged, 0);

  // Top performers
  const topPerformers = uniqueInsights
    .map((i) => ({
      staffId: i.staff_id,
      score: Math.round((i.productivity_score + i.engagement_score) / 2),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    totalStaff: uniqueInsights.length,
    avgProductivity: Math.round(totalProductivity / uniqueInsights.length),
    avgEngagement: Math.round(totalEngagement / uniqueInsights.length),
    totalTasks,
    totalHours,
    topPerformers,
  };
}

// Get staff activity timeline
export async function getStaffActivityTimeline(
  founderId: string,
  staffId: string,
  weeks: number = 4
): Promise<{ week: string; productivity: number; engagement: number }[]> {
  const insights = await getStaffInsights(founderId, { staffId, limit: weeks });

  return insights.map((i) => ({
    week: i.period_end,
    productivity: i.productivity_score,
    engagement: i.engagement_score,
  }));
}

// Helper functions
function calculateProductivityScore(
  tasks: number,
  hours: number,
  content: number
): number {
  // Weighted scoring: tasks (50%), efficiency (30%), content (20%)
  const taskScore = Math.min(tasks * 10, 50);
  const efficiencyScore = hours > 0 ? Math.min((tasks / hours) * 30, 30) : 0;
  const contentScore = Math.min(content * 5, 20);

  return Math.min(Math.round(taskScore + efficiencyScore + contentScore), 100);
}

function calculateEngagementScore(
  interactions: number,
  content: number,
  inProgress: number
): number {
  // Weighted scoring: interactions (40%), content (30%), active work (30%)
  const interactionScore = Math.min(interactions * 4, 40);
  const contentScore = Math.min(content * 6, 30);
  const activeScore = Math.min(inProgress * 10, 30);

  return Math.min(Math.round(interactionScore + contentScore + activeScore), 100);
}

function generateInsights(metrics: {
  tasksCompleted: number;
  tasksInProgress: number;
  hoursLogged: number;
  clientInteractions: number;
  contentGenerated: number;
  productivityScore: number;
  engagementScore: number;
}): { insight: string; type: string }[] {
  const insights: { insight: string; type: string }[] = [];

  if (metrics.productivityScore >= 80) {
    insights.push({
      insight: 'High productivity - consistently delivering results',
      type: 'positive',
    });
  } else if (metrics.productivityScore < 50) {
    insights.push({
      insight: 'Productivity below average - may need support or workload review',
      type: 'attention',
    });
  }

  if (metrics.clientInteractions > 10) {
    insights.push({
      insight: 'Strong client engagement - maintaining regular communications',
      type: 'positive',
    });
  }

  if (metrics.contentGenerated > 5) {
    insights.push({
      insight: 'Active content creator - generating marketing materials',
      type: 'positive',
    });
  }

  if (metrics.tasksInProgress > metrics.tasksCompleted * 2) {
    insights.push({
      insight: 'Many tasks in progress - potential bottleneck or overload',
      type: 'attention',
    });
  }

  return insights;
}

export default {
  generateStaffInsights,
  getStaffInsights,
  getTeamOverview,
  getStaffActivityTimeline,
};
