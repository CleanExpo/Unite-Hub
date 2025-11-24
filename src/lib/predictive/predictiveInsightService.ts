/**
 * Predictive Insight Service
 * Phase 95: Create founder-facing opportunity insights
 */

import { getSupabaseServer } from '@/lib/supabase';
import type {
  OpportunityWindow,
  OpportunityCategory,
  FounderOpportunityReport,
} from './predictiveTypes';

/**
 * Detect momentum opportunities across tenants
 */
export async function detectMomentumOpportunities(): Promise<string[]> {
  const supabase = await getSupabaseServer();
  const insights: string[] = [];

  // Get recent high-confidence windows
  const { data: recentWindows } = await supabase
    .from('opportunity_windows')
    .select('opportunity_category, confidence, window_type')
    .eq('status', 'active')
    .gte('confidence', 0.6)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .limit(100);

  if (!recentWindows || recentWindows.length === 0) {
    return ['Insufficient data to detect momentum patterns.'];
  }

  // Analyze category clusters
  const categoryCount: Record<string, number> = {};
  for (const w of recentWindows) {
    categoryCount[w.opportunity_category] = (categoryCount[w.opportunity_category] || 0) + 1;
  }

  // Find dominant categories
  const sortedCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a);

  if (sortedCategories.length > 0) {
    const [topCategory, count] = sortedCategories[0];
    if (count >= 3) {
      insights.push(
        `${topCategory.charAt(0).toUpperCase() + topCategory.slice(1)} opportunities showing momentum - ${count} high-confidence windows detected this week.`
      );
    }
  }

  // Check for window type patterns
  const windowTypeCount: Record<string, number> = {};
  for (const w of recentWindows) {
    windowTypeCount[w.window_type] = (windowTypeCount[w.window_type] || 0) + 1;
  }

  if (windowTypeCount['7_day'] > windowTypeCount['30_day'] * 2) {
    insights.push(
      'Short-term (7-day) opportunities dominating - consider quick-action strategies.'
    );
  } else if (windowTypeCount['30_day'] > windowTypeCount['7_day'] * 2) {
    insights.push(
      'Long-term (30-day) opportunities prevalent - suitable for strategic planning.'
    );
  }

  if (insights.length === 0) {
    insights.push('Opportunity distribution is balanced - no dominant momentum patterns.');
  }

  return insights;
}

/**
 * Detect audience growth windows
 */
export async function detectAudienceWindows(): Promise<string[]> {
  const supabase = await getSupabaseServer();
  const insights: string[] = [];

  const { data: audienceWindows } = await supabase
    .from('opportunity_windows')
    .select('confidence, window_type, uncertainty_notes')
    .eq('opportunity_category', 'audience')
    .eq('status', 'active')
    .gte('confidence', 0.5)
    .order('confidence', { ascending: false })
    .limit(10);

  if (!audienceWindows || audienceWindows.length === 0) {
    return ['No significant audience growth windows detected currently.'];
  }

  const highConfidence = audienceWindows.filter(w => w.confidence >= 0.7);
  if (highConfidence.length > 0) {
    insights.push(
      `${highConfidence.length} high-confidence audience growth ${highConfidence.length === 1 ? 'window' : 'windows'} detected. Review supporting signals before action.`
    );
  }

  const shortTerm = audienceWindows.filter(w => w.window_type === '7_day');
  if (shortTerm.length >= 2) {
    insights.push(
      'Multiple short-term audience windows suggest immediate growth potential.'
    );
  }

  return insights;
}

/**
 * Generate comprehensive founder opportunity report
 */
export async function generateFounderOpportunityReport(
  tenantId?: string
): Promise<FounderOpportunityReport> {
  const supabase = await getSupabaseServer();

  // Build query
  let query = supabase
    .from('opportunity_windows')
    .select('*')
    .eq('status', 'active');

  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }

  const { data: windows } = await query.order('confidence', { ascending: false });

  const allWindows = windows || [];

  // Calculate counts by window type
  const byWindow = {
    '7_day': allWindows.filter(w => w.window_type === '7_day').length,
    '14_day': allWindows.filter(w => w.window_type === '14_day').length,
    '30_day': allWindows.filter(w => w.window_type === '30_day').length,
  };

  // Calculate counts by category
  const categories: OpportunityCategory[] = [
    'creative', 'posting', 'campaign', 'brand', 'engagement', 'audience', 'timing'
  ];
  const byCategory: Record<OpportunityCategory, number> = {} as Record<OpportunityCategory, number>;
  for (const cat of categories) {
    byCategory[cat] = allWindows.filter(w => w.opportunity_category === cat).length;
  }

  // Get top opportunities
  const topOpportunities = allWindows
    .slice(0, 5)
    .map(w => ({
      id: w.id,
      tenantId: w.tenant_id,
      regionId: w.region_id,
      clientId: w.client_id,
      windowType: w.window_type,
      opportunityCategory: w.opportunity_category,
      title: w.title,
      description: w.description,
      confidence: w.confidence,
      supportingNodes: w.supporting_nodes,
      uncertaintyNotes: w.uncertainty_notes,
      expiresAt: w.expires_at,
      status: w.status,
      createdAt: w.created_at,
      updatedAt: w.updated_at,
    })) as OpportunityWindow[];

  // Generate momentum insights
  const momentumInsights = await detectMomentumOpportunities();

  return {
    generatedAt: new Date().toISOString(),
    totalOpportunities: allWindows.length,
    byWindow,
    byCategory,
    topOpportunities,
    momentumInsights,
    uncertaintyDisclaimer:
      'All opportunities are probabilistic estimates based on available signals. ' +
      'Actual outcomes may differ significantly. These predictions should inform, ' +
      'not dictate, decision-making. Always verify with domain expertise before acting.',
  };
}

/**
 * Get category trend analysis
 */
export async function getCategoryTrends(
  tenantId: string,
  daysBack: number = 30
): Promise<Record<OpportunityCategory, { count: number; avgConfidence: number; trend: string }>> {
  const supabase = await getSupabaseServer();

  const cutoff = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString();

  const { data: windows } = await supabase
    .from('opportunity_windows')
    .select('opportunity_category, confidence, created_at')
    .eq('tenant_id', tenantId)
    .gte('created_at', cutoff);

  const categories: OpportunityCategory[] = [
    'creative', 'posting', 'campaign', 'brand', 'engagement', 'audience', 'timing'
  ];

  const trends: Record<OpportunityCategory, { count: number; avgConfidence: number; trend: string }> =
    {} as Record<OpportunityCategory, { count: number; avgConfidence: number; trend: string }>;

  for (const cat of categories) {
    const catWindows = (windows || []).filter(w => w.opportunity_category === cat);
    const count = catWindows.length;
    const avgConfidence = count > 0
      ? catWindows.reduce((sum, w) => sum + w.confidence, 0) / count
      : 0;

    // Simple trend: compare first half vs second half
    const midpoint = Date.now() - (daysBack * 24 * 60 * 60 * 1000) / 2;
    const firstHalf = catWindows.filter(w => new Date(w.created_at).getTime() < midpoint).length;
    const secondHalf = catWindows.filter(w => new Date(w.created_at).getTime() >= midpoint).length;

    let trend = 'stable';
    if (secondHalf > firstHalf * 1.5) trend = 'rising';
    else if (firstHalf > secondHalf * 1.5) trend = 'declining';

    trends[cat] = { count, avgConfidence, trend };
  }

  return trends;
}
