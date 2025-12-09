/**
 * Synthex Template AI Service
 * Phase D05: Template Intelligence
 *
 * AI-powered template analysis, scoring, predictions,
 * and improvement suggestions.
 */

import { supabaseAdmin } from '@/lib/supabase';
import { getAnthropicClient } from '@/lib/anthropic/client';

// =====================================================
// Types
// =====================================================

export type InsightType =
  | 'clarity'
  | 'engagement'
  | 'conversion'
  | 'brevity'
  | 'tone'
  | 'structure'
  | 'personalization'
  | 'cta'
  | 'grammar'
  | 'readability'
  | 'brand_alignment';

export type InsightSeverity = 'critical' | 'warning' | 'info' | 'success';

export type InsightStatus = 'pending' | 'applied' | 'dismissed' | 'deferred';

export interface TemplateInsight {
  id: string;
  tenant_id: string;
  template_id: string;
  insight_type: InsightType;
  title: string;
  description: string;
  severity: InsightSeverity;
  score: number | null;
  suggestion: string | null;
  suggested_content: string | null;
  before_snippet: string | null;
  after_snippet: string | null;
  status: InsightStatus;
  confidence: number | null;
  created_at: string;
}

export interface TemplateScore {
  id: string;
  template_id: string;
  clarity_score: number | null;
  engagement_score: number | null;
  conversion_score: number | null;
  readability_score: number | null;
  brand_alignment_score: number | null;
  overall_score: number | null;
  grade: string | null;
  percentile: number | null;
  word_count: number | null;
  sentence_count: number | null;
  flesch_kincaid_grade: number | null;
  variable_count: number | null;
  cta_count: number | null;
  analyzed_at: string;
}

export interface TemplatePrediction {
  id: string;
  template_id: string;
  predicted_open_rate: number | null;
  predicted_click_rate: number | null;
  predicted_conversion_rate: number | null;
  predicted_engagement_score: number | null;
  confidence: number | null;
  predicted_at: string;
}

// =====================================================
// Template Analysis
// =====================================================

/**
 * Analyze a template and generate insights
 */
export async function analyzeTemplate(
  tenantId: string,
  templateId: string,
  content: string,
  templateType: string
): Promise<{
  insights: TemplateInsight[];
  score: TemplateScore;
}> {
  const client = getAnthropicClient();

  const systemPrompt = `You are an expert copywriting analyst. Analyze the provided ${templateType} template and provide:

1. Quality scores (0.0-1.0) for:
   - clarity: How clear and understandable is the message?
   - engagement: How engaging and compelling is the content?
   - conversion: How effective is it at driving action?
   - readability: How easy is it to read?
   - brand_alignment: How professional and consistent is the tone?

2. Content metrics:
   - word_count
   - sentence_count
   - flesch_kincaid_grade (reading level)
   - variable_count ({{placeholders}})
   - cta_count (calls to action)

3. Specific insights with improvements:
   For each issue found, provide:
   - insight_type: clarity|engagement|conversion|brevity|tone|structure|personalization|cta|grammar|readability
   - severity: critical|warning|info|success
   - title: Brief issue title
   - description: Detailed explanation
   - suggestion: How to fix it
   - before_snippet: Original problematic text
   - after_snippet: Improved version
   - confidence: 0.0-1.0

Respond in JSON format:
{
  "scores": {
    "clarity_score": 0.85,
    "engagement_score": 0.72,
    "conversion_score": 0.68,
    "readability_score": 0.90,
    "brand_alignment_score": 0.80,
    "overall_score": 0.79
  },
  "metrics": {
    "word_count": 150,
    "sentence_count": 10,
    "flesch_kincaid_grade": 8.5,
    "variable_count": 3,
    "cta_count": 1
  },
  "insights": [
    {
      "insight_type": "cta",
      "severity": "warning",
      "title": "Weak call-to-action",
      "description": "The CTA 'Click here' is generic and doesn't create urgency.",
      "suggestion": "Use action-oriented, specific language with urgency.",
      "before_snippet": "Click here to learn more",
      "after_snippet": "Get your free consultation today",
      "confidence": 0.92
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Analyze this ${templateType} template:\n\n${content}`,
      },
    ],
    system: systemPrompt,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  let analysis;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      analysis = JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Return default analysis if parsing fails
    analysis = {
      scores: { overall_score: 0.5 },
      metrics: {},
      insights: [],
    };
  }

  // Calculate grade
  const grade = calculateGrade(analysis.scores?.overall_score || 0);

  // Store scores
  const { data: scoreData } = await supabaseAdmin
    .from('synthex_library_scores')
    .upsert({
      tenant_id: tenantId,
      template_id: templateId,
      ...analysis.scores,
      grade,
      ...analysis.metrics,
      ai_model: 'claude-sonnet-4-5-20250514',
      analyzed_at: new Date().toISOString(),
    }, { onConflict: 'template_id' })
    .select()
    .single();

  // Store insights
  const insightsToInsert = (analysis.insights || []).map((insight: Record<string, unknown>) => ({
    tenant_id: tenantId,
    template_id: templateId,
    insight_type: insight.insight_type,
    title: insight.title,
    description: insight.description,
    severity: insight.severity,
    suggestion: insight.suggestion,
    before_snippet: insight.before_snippet,
    after_snippet: insight.after_snippet,
    suggested_content: insight.after_snippet,
    confidence: insight.confidence,
    ai_model: 'claude-sonnet-4-5-20250514',
  }));

  let insertedInsights: TemplateInsight[] = [];
  if (insightsToInsert.length > 0) {
    const { data } = await supabaseAdmin
      .from('synthex_library_insights')
      .insert(insightsToInsert)
      .select();
    insertedInsights = data || [];
  }

  return {
    insights: insertedInsights,
    score: scoreData,
  };
}

/**
 * Get insights for a template
 */
export async function getInsights(
  templateId: string,
  filters?: {
    status?: InsightStatus;
    severity?: InsightSeverity;
    insight_type?: InsightType;
  }
): Promise<TemplateInsight[]> {
  let query = supabaseAdmin
    .from('synthex_library_insights')
    .select('*')
    .eq('template_id', templateId);

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.severity) {
    query = query.eq('severity', filters.severity);
  }
  if (filters?.insight_type) {
    query = query.eq('insight_type', filters.insight_type);
  }

  query = query.order('severity', { ascending: true });

  const { data, error } = await query;
  if (error) {
throw new Error(`Failed to get insights: ${error.message}`);
}
  return data || [];
}

/**
 * Update insight status
 */
export async function updateInsightStatus(
  insightId: string,
  status: InsightStatus,
  userId?: string
): Promise<TemplateInsight> {
  const updates: Record<string, unknown> = { status };

  if (status === 'applied') {
    updates.applied_at = new Date().toISOString();
    updates.applied_by = userId;
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_library_insights')
    .update(updates)
    .eq('id', insightId)
    .select()
    .single();

  if (error) {
throw new Error(`Failed to update insight: ${error.message}`);
}
  return data;
}

/**
 * Get template score
 */
export async function getScore(
  templateId: string
): Promise<TemplateScore | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_scores')
    .select('*')
    .eq('template_id', templateId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get score: ${error.message}`);
  }
  return data;
}

// =====================================================
// Performance Predictions
// =====================================================

/**
 * Generate performance predictions for a template
 */
export async function predictPerformance(
  tenantId: string,
  templateId: string,
  content: string,
  templateType: string
): Promise<TemplatePrediction> {
  const client = getAnthropicClient();

  const systemPrompt = `You are an email/content marketing performance analyst. Based on the content, template type, and industry benchmarks, predict performance metrics.

For this ${templateType} template, predict:
- predicted_open_rate: Email open rate (0.0-1.0, typical: 0.15-0.30)
- predicted_click_rate: Click-through rate (0.0-1.0, typical: 0.02-0.05)
- predicted_conversion_rate: Conversion rate (0.0-1.0, typical: 0.01-0.03)
- predicted_engagement_score: Overall engagement (0.0-1.0)
- confidence: How confident are you in these predictions (0.0-1.0)

Consider:
- Subject line quality (for emails)
- CTA clarity and placement
- Personalization usage
- Content length and readability
- Industry averages

Respond in JSON format:
{
  "predicted_open_rate": 0.25,
  "predicted_click_rate": 0.03,
  "predicted_conversion_rate": 0.015,
  "predicted_engagement_score": 0.72,
  "confidence": 0.75,
  "reasoning": "Brief explanation"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: `Predict performance for this ${templateType}:\n\n${content}`,
      },
    ],
    system: systemPrompt,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  let predictions;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      predictions = JSON.parse(jsonMatch[0]);
    }
  } catch {
    predictions = {
      predicted_open_rate: 0.20,
      predicted_click_rate: 0.025,
      predicted_conversion_rate: 0.01,
      predicted_engagement_score: 0.50,
      confidence: 0.50,
    };
  }

  const { data, error } = await supabaseAdmin
    .from('synthex_library_predictions')
    .insert({
      tenant_id: tenantId,
      template_id: templateId,
      ...predictions,
      ai_model: 'claude-sonnet-4-5-20250514',
    })
    .select()
    .single();

  if (error) {
throw new Error(`Failed to save prediction: ${error.message}`);
}
  return data;
}

/**
 * Get predictions for a template
 */
export async function getPredictions(
  templateId: string
): Promise<TemplatePrediction | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_predictions')
    .select('*')
    .eq('template_id', templateId)
    .order('predicted_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get predictions: ${error.message}`);
  }
  return data;
}

// =====================================================
// Improvement Suggestions
// =====================================================

/**
 * Generate specific improvements for a template
 */
export async function suggestImprovements(
  content: string,
  focusAreas: InsightType[]
): Promise<Array<{
  area: InsightType;
  original: string;
  improved: string;
  explanation: string;
}>> {
  const client = getAnthropicClient();

  const systemPrompt = `You are an expert copywriting coach. Improve the provided template focusing on: ${focusAreas.join(', ')}.

For each improvement, provide:
- area: Which aspect you improved
- original: The original text snippet
- improved: Your improved version
- explanation: Why this is better

Respond in JSON format:
{
  "improvements": [
    {
      "area": "cta",
      "original": "Click here",
      "improved": "Start your free trial now",
      "explanation": "Action-oriented with urgency and value proposition"
    }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Improve this template:\n\n${content}`,
      },
    ],
    system: systemPrompt,
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      return result.improvements || [];
    }
  } catch {
    // Return empty if parsing fails
  }

  return [];
}

/**
 * Rewrite a template with improvements applied
 */
export async function rewriteTemplate(
  content: string,
  objective: 'clarity' | 'engagement' | 'conversion' | 'brevity'
): Promise<{
  rewritten: string;
  changes: string[];
}> {
  const client = getAnthropicClient();

  const objectives = {
    clarity: 'Make this template clearer, simpler, and easier to understand. Remove jargon.',
    engagement: 'Make this template more engaging, compelling, and interesting. Add personality.',
    conversion: 'Optimize this template for maximum conversions. Add urgency, social proof hints, and stronger CTAs.',
    brevity: 'Make this template more concise while keeping the key message. Remove redundancy.',
  };

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250514',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `${objectives[objective]}\n\nTemplate:\n${content}\n\nProvide:
1. The rewritten template
2. A list of specific changes made

Format:
{
  "rewritten": "The improved template text here...",
  "changes": [
    "Changed X to Y because...",
    "Removed redundant phrase..."
  ]
}`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch {
    // Return original if parsing fails
  }

  return { rewritten: content, changes: [] };
}

// =====================================================
// Feedback & Learning
// =====================================================

/**
 * Submit feedback for a template
 */
export async function submitFeedback(
  tenantId: string,
  templateId: string,
  userId: string,
  feedback: {
    rating: number;
    feedback_type: 'quality' | 'relevance' | 'effectiveness' | 'ease_of_use';
    comment?: string;
    usage_context?: string;
    output_id?: string;
  }
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_library_feedback')
    .insert({
      tenant_id: tenantId,
      template_id: templateId,
      user_id: userId,
      rating: feedback.rating,
      feedback_type: feedback.feedback_type,
      comment: feedback.comment,
      usage_context: feedback.usage_context,
      output_id: feedback.output_id,
    });

  if (error) {
throw new Error(`Failed to submit feedback: ${error.message}`);
}
}

/**
 * Get feedback summary for a template
 */
export async function getFeedbackSummary(
  templateId: string
): Promise<{
  average_rating: number;
  total_feedback: number;
  by_type: Record<string, { count: number; avg_rating: number }>;
}> {
  const { data, error } = await supabaseAdmin
    .from('synthex_library_feedback')
    .select('rating, feedback_type')
    .eq('template_id', templateId);

  if (error) {
throw new Error(`Failed to get feedback: ${error.message}`);
}

  const feedback = data || [];
  const total_feedback = feedback.length;

  if (total_feedback === 0) {
    return { average_rating: 0, total_feedback: 0, by_type: {} };
  }

  const sum = feedback.reduce((acc, f) => acc + (f.rating || 0), 0);
  const average_rating = sum / total_feedback;

  const by_type = feedback.reduce(
    (acc, f) => {
      if (!f.feedback_type) {
return acc;
}
      if (!acc[f.feedback_type]) {
        acc[f.feedback_type] = { count: 0, sum: 0 };
      }
      acc[f.feedback_type].count++;
      acc[f.feedback_type].sum += f.rating || 0;
      return acc;
    },
    {} as Record<string, { count: number; sum: number }>
  );

  const by_type_final = Object.entries(by_type).reduce(
    (acc, [key, val]) => {
      acc[key] = {
        count: val.count,
        avg_rating: val.sum / val.count,
      };
      return acc;
    },
    {} as Record<string, { count: number; avg_rating: number }>
  );

  return { average_rating, total_feedback, by_type: by_type_final };
}

// =====================================================
// Helpers
// =====================================================

function calculateGrade(score: number): string {
  if (score >= 0.95) {
return 'A+';
}
  if (score >= 0.90) {
return 'A';
}
  if (score >= 0.85) {
return 'B+';
}
  if (score >= 0.80) {
return 'B';
}
  if (score >= 0.75) {
return 'C+';
}
  if (score >= 0.70) {
return 'C';
}
  if (score >= 0.60) {
return 'D';
}
  return 'F';
}

// =====================================================
// Bulk Analysis
// =====================================================

/**
 * Analyze multiple templates (batch)
 */
export async function analyzeTemplatesBatch(
  tenantId: string,
  templateIds: string[]
): Promise<{
  analyzed: number;
  failed: number;
  results: Array<{ template_id: string; success: boolean; error?: string }>;
}> {
  const results: Array<{ template_id: string; success: boolean; error?: string }> = [];
  let analyzed = 0;
  let failed = 0;

  // Get template contents
  const { data: templates } = await supabaseAdmin
    .from('synthex_library_templates')
    .select('id, content, template_type')
    .in('id', templateIds);

  for (const template of templates || []) {
    try {
      await analyzeTemplate(tenantId, template.id, template.content, template.template_type);
      results.push({ template_id: template.id, success: true });
      analyzed++;
    } catch (error) {
      results.push({
        template_id: template.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      failed++;
    }
  }

  return { analyzed, failed, results };
}
