/**
 * Insight Service
 *
 * AI-powered insights engine for analyzing SEO, content, and campaign performance.
 * Generates actionable recommendations, identifies patterns, and surfaces opportunities.
 *
 * Phase: B5 - Synthex Analytics + Insights Engine
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getTenantAnalyticsSummary } from './scheduleService';

const anthropic = new Anthropic();

export interface Insight {
  id: string;
  tenant_id: string;
  brand_id: string | null;
  user_id: string;
  insight_type: 'opportunity' | 'warning' | 'pattern' | 'recommendation' | 'trend';
  category: 'seo' | 'content' | 'campaign' | 'engagement' | 'conversion' | 'general';
  title: string;
  description: string;
  priority: number;
  status: 'new' | 'viewed' | 'actioned' | 'dismissed';
  related_campaign_id: string | null;
  related_content_id: string | null;
  confidence_score: number;
  source_data: Record<string, unknown>;
  generated_at: string;
  created_at: string;
}

export interface GenerateInsightsParams {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  categories?: Array<'seo' | 'content' | 'campaign' | 'engagement' | 'conversion' | 'general'>;
}

export interface InsightResult {
  insights: Array<{
    type: Insight['insight_type'];
    category: Insight['category'];
    title: string;
    description: string;
    priority: number;
    confidence: number;
    actionItems?: string[];
  }>;
}

/**
 * Generate AI-powered insights based on tenant data
 */
export async function generateInsights(params: GenerateInsightsParams): Promise<{
  data: InsightResult | null;
  error: Error | null;
}> {
  const { tenantId, brandId, userId, categories } = params;

  try {
    // Gather data for analysis
    const [seoData, contentData, campaignData, analyticsData] = await Promise.all([
      getSeoData(tenantId),
      getContentData(tenantId, userId),
      getCampaignData(tenantId, userId),
      getTenantAnalyticsSummary(tenantId, 30),
    ]);

    const systemPrompt = `You are Synthex Insights Engine, an AI analyst specializing in marketing performance optimization.

Your role is to analyze data and generate actionable insights across these categories:
- SEO: Search visibility, keyword rankings, technical issues
- Content: Content performance, engagement, optimization opportunities
- Campaign: Email campaign effectiveness, scheduling optimization
- Engagement: Audience interaction patterns, best times to post
- Conversion: Lead generation, conversion rates, revenue opportunities
- General: Overall business health, cross-channel patterns

Generate insights that are:
1. Specific and actionable (not generic advice)
2. Based on the actual data provided
3. Prioritized by potential impact (1=highest, 5=lowest)
4. Confident (express uncertainty when data is limited)

Output as JSON with this structure:
{
  "insights": [
    {
      "type": "opportunity|warning|pattern|recommendation|trend",
      "category": "seo|content|campaign|engagement|conversion|general",
      "title": "Brief, descriptive title",
      "description": "Detailed explanation with specific data points",
      "priority": 1-5,
      "confidence": 0.0-1.0,
      "actionItems": ["Step 1", "Step 2"]
    }
  ]
}

Generate 3-7 insights based on the data quality and patterns found.`;

    const dataContext = `
## SEO Data
${JSON.stringify(seoData, null, 2)}

## Content Library
${JSON.stringify(contentData, null, 2)}

## Campaign Performance
${JSON.stringify(campaignData, null, 2)}

## Analytics Summary (Last 30 Days)
${JSON.stringify(analyticsData.data, null, 2)}

${categories ? `Focus on these categories: ${categories.join(', ')}` : 'Analyze all categories.'}

Analyze this data and generate actionable insights.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: dataContext,
        },
      ],
      system: systemPrompt,
    });

    // Parse AI response
    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response format');
    }

    // Extract JSON from response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse insights JSON');
    }

    const result: InsightResult = JSON.parse(jsonMatch[0]);

    // Store insights in database
    if (result.insights && result.insights.length > 0) {
      await storeInsights(tenantId, brandId, userId, result.insights);
    }

    return { data: result, error: null };
  } catch (err) {
    console.error('[insightService.generateInsights] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to generate insights') };
  }
}

/**
 * Store generated insights in database
 */
async function storeInsights(
  tenantId: string,
  brandId: string | null | undefined,
  userId: string,
  insights: InsightResult['insights']
): Promise<void> {
  try {
    const records = insights.map((insight) => ({
      tenant_id: tenantId,
      brand_id: brandId || null,
      user_id: userId,
      insight_type: insight.type,
      category: insight.category,
      title: insight.title,
      description: insight.description,
      priority: insight.priority,
      confidence_score: insight.confidence,
      source_data: { actionItems: insight.actionItems },
      ai_model: 'claude-sonnet-4-5-20250929',
      status: 'new',
    }));

    await supabaseAdmin.from('synthex_insights').insert(records);
  } catch (err) {
    console.error('[insightService.storeInsights] Error:', err);
  }
}

/**
 * Get recent insights for a tenant
 */
export async function getInsights(
  tenantId: string,
  userId: string,
  options: {
    status?: Insight['status'];
    category?: Insight['category'];
    limit?: number;
  } = {}
): Promise<{ data: Insight[] | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_insights')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId);

    if (options.status) {
      query = query.eq('status', options.status);
    }
    if (options.category) {
      query = query.eq('category', options.category);
    }

    query = query.order('priority', { ascending: true }).order('generated_at', { ascending: false });

    if (options.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return { data, error: null };
  } catch (err) {
    console.error('[insightService.getInsights] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to get insights') };
  }
}

/**
 * Update insight status
 */
export async function updateInsightStatus(
  insightId: string,
  status: Insight['status']
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const updateData: Record<string, unknown> = { status };

    if (status === 'viewed') {
      updateData.viewed_at = new Date().toISOString();
    } else if (status === 'actioned') {
      updateData.actioned_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('synthex_insights')
      .update(updateData)
      .eq('id', insightId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err) {
    console.error('[insightService.updateInsightStatus] Error:', err);
    return { success: false, error: err instanceof Error ? err : new Error('Failed to update insight') };
  }
}

/**
 * Dismiss an insight
 */
export async function dismissInsight(insightId: string): Promise<{ success: boolean; error: Error | null }> {
  return updateInsightStatus(insightId, 'dismissed');
}

/**
 * Get insight counts by status
 */
export async function getInsightCounts(
  tenantId: string,
  userId: string
): Promise<{
  data: { new: number; viewed: number; actioned: number; total: number } | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_insights')
      .select('status')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .neq('status', 'dismissed');

    if (error) throw error;

    const counts = {
      new: 0,
      viewed: 0,
      actioned: 0,
      total: data?.length || 0,
    };

    data?.forEach((item) => {
      if (item.status === 'new') counts.new++;
      else if (item.status === 'viewed') counts.viewed++;
      else if (item.status === 'actioned') counts.actioned++;
    });

    return { data: counts, error: null };
  } catch (err) {
    console.error('[insightService.getInsightCounts] Error:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Failed to get insight counts') };
  }
}

// Helper functions to gather data for analysis

async function getSeoData(tenantId: string): Promise<Record<string, unknown>> {
  try {
    const { data } = await supabaseAdmin
      .from('synthex_seo_reports')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    return {
      recentReports: data?.length || 0,
      reports: data?.map((r) => ({
        score: r.overall_score,
        issues: r.issues_count,
        date: r.created_at,
      })) || [],
    };
  } catch {
    return { recentReports: 0, reports: [] };
  }
}

async function getContentData(tenantId: string, userId: string): Promise<Record<string, unknown>> {
  try {
    const { data } = await supabaseAdmin
      .from('synthex_content')
      .select('content_type, status, created_at')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};

    data?.forEach((item) => {
      byType[item.content_type] = (byType[item.content_type] || 0) + 1;
      byStatus[item.status] = (byStatus[item.status] || 0) + 1;
    });

    return {
      totalContent: data?.length || 0,
      byType,
      byStatus,
    };
  } catch {
    return { totalContent: 0, byType: {}, byStatus: {} };
  }
}

async function getCampaignData(tenantId: string, userId: string): Promise<Record<string, unknown>> {
  try {
    const { data } = await supabaseAdmin
      .from('synthex_campaigns')
      .select('type, status, emails_sent, emails_opened, emails_clicked, created_at')
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    const byStatus: Record<string, number> = {};
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;

    data?.forEach((c) => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      totalSent += c.emails_sent || 0;
      totalOpened += c.emails_opened || 0;
      totalClicked += c.emails_clicked || 0;
    });

    return {
      totalCampaigns: data?.length || 0,
      byStatus,
      metrics: {
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? ((totalOpened / totalSent) * 100).toFixed(1) : 0,
        clickRate: totalSent > 0 ? ((totalClicked / totalSent) * 100).toFixed(1) : 0,
      },
    };
  } catch {
    return { totalCampaigns: 0, byStatus: {}, metrics: {} };
  }
}
