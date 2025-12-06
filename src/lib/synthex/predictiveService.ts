/**
 * Predictive Service for Synthex
 * Phase: B9 - Predictive Intelligence + Send-Time Optimization
 *
 * Uses AI to predict optimal send times, engagement rates, and churn risk.
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Lazy-load Anthropic client
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

// Types
export type ModelType = 'send_time' | 'engagement' | 'churn' | 'conversion' | 'audience';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface SendTimePrediction {
  bestHour: number;
  bestDay: DayOfWeek;
  bestTimezone: string;
  confidence: number;
  reasoning: string;
  hourlyScores: Record<DayOfWeek, number[]>;
  alternatives: Array<{
    hour: number;
    day: DayOfWeek;
    confidence: number;
  }>;
  dataPointsAnalyzed: number;
}

export interface EngagementPrediction {
  email: string;
  predictedOpenRate: number;
  predictedClickRate: number;
  predictedConversionRate: number;
  churnRiskScore: number;
  confidence: number;
  factors: string[];
}

export interface EngagementEvent {
  event_type: string;
  channel: string;
  occurred_at: string;
  count: number;
}

/**
 * Get engagement history for a tenant
 */
export async function getEngagementHistory(
  tenantId: string,
  options: { days?: number; limit?: number } = {}
): Promise<{ data: EngagementEvent[] | null; error: Error | null }> {
  try {
    const days = options.days || 90;
    const limit = options.limit || 5000;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabaseAdmin
      .from('synthex_channel_events')
      .select('event_type, channel, occurred_at, count')
      .eq('tenant_id', tenantId)
      .gte('occurred_at', startDate.toISOString())
      .order('occurred_at', { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);
    return { data: data as EngagementEvent[], error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get engagement by hour and day via SQL function
 */
export async function getEngagementByHourDay(
  tenantId: string,
  days: number = 90
): Promise<{
  data: Array<{
    day_of_week: string;
    hour_of_day: number;
    total_events: number;
    total_opens: number;
    total_clicks: number;
    avg_engagement_score: number;
  }> | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabaseAdmin.rpc('synthex_engagement_by_hour_day', {
      p_tenant_id: tenantId,
      p_days: days,
    });

    if (error) throw new Error(error.message);
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Generate send-time prediction using AI
 */
export async function generateSendTimePrediction(
  tenantId: string,
  options: {
    audienceId?: string;
    days?: number;
  } = {}
): Promise<{ data: SendTimePrediction | null; error: Error | null }> {
  try {
    const days = options.days || 90;

    // Get engagement history
    const historyResult = await getEngagementHistory(tenantId, { days });
    if (historyResult.error || !historyResult.data) {
      throw historyResult.error || new Error('No engagement data available');
    }

    // Get aggregated data by hour/day
    const aggregatedResult = await getEngagementByHourDay(tenantId, days);

    const prompt = `Analyze the following email/marketing engagement data and predict the optimal send time.

ENGAGEMENT EVENTS (last ${days} days):
${JSON.stringify(historyResult.data.slice(0, 500), null, 2)}

AGGREGATED BY HOUR/DAY:
${aggregatedResult.data ? JSON.stringify(aggregatedResult.data, null, 2) : 'No aggregated data'}

Based on this data, provide your analysis as a valid JSON object with these fields:
{
  "bestHour": <0-23>,
  "bestDay": "<monday|tuesday|wednesday|thursday|friday|saturday|sunday>",
  "confidence": <0.0-1.0>,
  "reasoning": "<brief explanation>",
  "hourlyScores": {
    "monday": [<24 scores from 0.0-1.0 for each hour>],
    "tuesday": [...],
    "wednesday": [...],
    "thursday": [...],
    "friday": [...],
    "saturday": [...],
    "sunday": [...]
  },
  "alternatives": [
    {"hour": <0-23>, "day": "<day>", "confidence": <0.0-1.0>}
  ]
}

Consider:
1. When are open rates highest?
2. When are click rates highest?
3. Time zone patterns (assume Australia/Sydney)
4. Business vs consumer patterns
5. Day-of-week variations

Return ONLY the JSON object, no other text.`;

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';

    // Parse the JSON response
    const prediction = JSON.parse(responseText) as {
      bestHour: number;
      bestDay: DayOfWeek;
      confidence: number;
      reasoning: string;
      hourlyScores: Record<DayOfWeek, number[]>;
      alternatives: Array<{ hour: number; day: DayOfWeek; confidence: number }>;
    };

    const result: SendTimePrediction = {
      ...prediction,
      bestTimezone: 'Australia/Sydney',
      dataPointsAnalyzed: historyResult.data.length,
    };

    // Save to database
    await supabaseAdmin.from('synthex_predicted_send_times').insert({
      tenant_id: tenantId,
      audience_id: options.audienceId || null,
      best_hour: result.bestHour,
      best_day: result.bestDay,
      best_timezone: result.bestTimezone,
      confidence: result.confidence,
      reasoning: result.reasoning,
      hourly_scores: result.hourlyScores,
      alternatives: result.alternatives,
      data_points_analyzed: result.dataPointsAnalyzed,
      date_range_analyzed: `Last ${days} days`,
    });

    return { data: result, error: null };
  } catch (err) {
    console.error('[PredictiveService] Error generating send-time prediction:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get the latest send-time prediction for a tenant
 */
export async function getLatestSendTimePrediction(
  tenantId: string,
  audienceId?: string
): Promise<{ data: SendTimePrediction | null; error: Error | null }> {
  try {
    let query = supabaseAdmin
      .from('synthex_predicted_send_times')
      .select('*')
      .eq('tenant_id', tenantId)
      .gt('expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(1);

    if (audienceId) {
      query = query.eq('audience_id', audienceId);
    }

    const { data, error } = await query.single();

    if (error) {
      // Not found is ok, return null
      if (error.code === 'PGRST116') {
        return { data: null, error: null };
      }
      throw new Error(error.message);
    }

    const result: SendTimePrediction = {
      bestHour: data.best_hour,
      bestDay: data.best_day as DayOfWeek,
      bestTimezone: data.best_timezone,
      confidence: data.confidence,
      reasoning: data.reasoning,
      hourlyScores: data.hourly_scores,
      alternatives: data.alternatives,
      dataPointsAnalyzed: data.data_points_analyzed,
    };

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Get all send-time predictions history
 */
export async function getSendTimePredictionHistory(
  tenantId: string,
  options: { limit?: number } = {}
): Promise<{
  data: Array<{
    id: string;
    bestHour: number;
    bestDay: DayOfWeek;
    confidence: number;
    generatedAt: string;
  }> | null;
  error: Error | null;
}> {
  try {
    const limit = options.limit || 10;

    const { data, error } = await supabaseAdmin
      .from('synthex_predicted_send_times')
      .select('id, best_hour, best_day, confidence, generated_at')
      .eq('tenant_id', tenantId)
      .order('generated_at', { ascending: false })
      .limit(limit);

    if (error) throw new Error(error.message);

    const result = (data || []).map((p) => ({
      id: p.id,
      bestHour: p.best_hour,
      bestDay: p.best_day as DayOfWeek,
      confidence: p.confidence,
      generatedAt: p.generated_at,
    }));

    return { data: result, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Generate engagement prediction for a contact
 */
export async function generateEngagementPrediction(
  tenantId: string,
  email: string
): Promise<{ data: EngagementPrediction | null; error: Error | null }> {
  try {
    // Get engagement score for this contact
    const { data: engagementData } = await supabaseAdmin
      .from('synthex_engagement_scores')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .single();

    // Get recent events for this contact
    const { data: events } = await supabaseAdmin
      .from('synthex_attribution')
      .select('event_type, occurred_at')
      .eq('tenant_id', tenantId)
      .eq('email', email)
      .order('occurred_at', { ascending: false })
      .limit(100);

    const prompt = `Analyze this contact's engagement data and predict future behavior.

ENGAGEMENT SCORE:
${engagementData ? JSON.stringify(engagementData, null, 2) : 'No score data'}

RECENT EVENTS:
${events ? JSON.stringify(events, null, 2) : 'No event data'}

Provide predictions as JSON:
{
  "predictedOpenRate": <0.0-1.0>,
  "predictedClickRate": <0.0-1.0>,
  "predictedConversionRate": <0.0-1.0>,
  "churnRiskScore": <0.0-1.0 where 1.0 = very likely to churn>,
  "confidence": <0.0-1.0>,
  "factors": ["factor 1", "factor 2", ...]
}

Return ONLY the JSON object.`;

    const response = await getAnthropicClient().messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const prediction = JSON.parse(responseText);

    const result: EngagementPrediction = {
      email,
      predictedOpenRate: prediction.predictedOpenRate,
      predictedClickRate: prediction.predictedClickRate,
      predictedConversionRate: prediction.predictedConversionRate,
      churnRiskScore: prediction.churnRiskScore,
      confidence: prediction.confidence,
      factors: prediction.factors,
    };

    // Save to database
    await supabaseAdmin.from('synthex_engagement_predictions').insert({
      tenant_id: tenantId,
      email,
      predicted_open_rate: result.predictedOpenRate,
      predicted_click_rate: result.predictedClickRate,
      predicted_conversion_rate: result.predictedConversionRate,
      churn_risk_score: result.churnRiskScore,
      confidence: result.confidence,
      factors: result.factors,
    });

    return { data: result, error: null };
  } catch (err) {
    console.error('[PredictiveService] Error generating engagement prediction:', err);
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') };
  }
}

/**
 * Build hourly scores matrix for heatmap display
 */
export function buildHeatmapData(
  hourlyScores: Record<DayOfWeek, number[]>
): number[][] {
  const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  return days.map((day) => hourlyScores[day] || Array(24).fill(0));
}

/**
 * Format hour for display
 */
export function formatHour(hour: number): string {
  if (hour === 0) return '12:00 AM';
  if (hour === 12) return '12:00 PM';
  if (hour < 12) return `${hour}:00 AM`;
  return `${hour - 12}:00 PM`;
}

/**
 * Format day for display
 */
export function formatDay(day: DayOfWeek): string {
  return day.charAt(0).toUpperCase() + day.slice(1);
}
