/**
 * Synthex Reputation & Reviews Service
 *
 * Handles review ingestion, reputation monitoring,
 * and AI-powered review analysis and response generation.
 *
 * Phase: B21 - Reputation & Reviews Engine
 */

import Anthropic from '@anthropic-ai/sdk';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { getBrandVoicePrompt } from './brandEngineService';

// =============================================================================
// Types
// =============================================================================

export type ReviewSource = 'google' | 'facebook' | 'yelp' | 'trustpilot' | 'custom';
export type ReviewSentiment = 'positive' | 'neutral' | 'negative' | 'mixed';
export type ReviewPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Review {
  id: string;
  tenantId: string;
  source: ReviewSource;
  sourceId: string | null;
  profileName: string | null;
  authorName: string;
  authorEmail: string | null;
  authorAvatarUrl: string | null;
  rating: number;
  title: string | null;
  body: string;
  response: string | null;
  responseAuthor: string | null;
  respondedAt: string | null;
  externalUrl: string | null;
  isVerified: boolean;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: string;
  ingestedAt: string;
  updatedAt: string;
  metadata: Record<string, unknown>;
}

export interface ReviewInsight {
  id: string;
  tenantId: string;
  reviewId: string;
  summary: string | null;
  sentiment: ReviewSentiment | null;
  sentimentScore: number | null;
  topics: string[];
  keywords: string[];
  entities: Record<string, unknown>;
  priority: ReviewPriority;
  urgencyScore: number;
  requiresResponse: boolean;
  actionItems: Array<{
    description: string;
    type: string;
    priority: string;
  }>;
  suggestedResponse: string | null;
  riskFlags: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
  isEscalated: boolean;
  escalationReason: string | null;
  modelVersion: string;
  confidenceScore: number | null;
  createdAt: string;
}

export interface ReputationSummary {
  tenantId: string;
  avgRating: number;
  totalReviews: number;
  reviewCount30d: number;
  reviewCount90d: number;
  reviewCount365d: number;
  ratingDistribution: {
    '5': number;
    '4': number;
    '3': number;
    '2': number;
    '1': number;
  };
  responseRate: number;
  avgResponseTimeHours: number | null;
  trendScore: number | null;
  trendDirection: 'improving' | 'declining' | 'stable' | null;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  sourceCounts: {
    google: number;
    facebook: number;
    yelp: number;
    trustpilot: number;
    custom: number;
  };
  lastSyncAt: string | null;
  nextSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewFilters {
  source?: ReviewSource;
  minRating?: number;
  maxRating?: number;
  hasResponse?: boolean;
  sentiment?: ReviewSentiment;
  priority?: ReviewPriority;
  requiresResponse?: boolean;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface IngestReviewPayload {
  tenantId: string;
  source: ReviewSource;
  sourceId?: string;
  profileName?: string;
  authorName: string;
  authorEmail?: string;
  authorAvatarUrl?: string;
  rating: number;
  title?: string;
  body: string;
  createdAt?: string;
  externalUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// =============================================================================
// Lazy Anthropic Client
// =============================================================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

// =============================================================================
// Review Management Functions
// =============================================================================

/**
 * Ingest a new review from an external platform
 */
export async function ingestReview(
  payload: IngestReviewPayload
): Promise<ServiceResult<Review>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_reviews')
      .insert({
        tenant_id: payload.tenantId,
        source: payload.source,
        source_id: payload.sourceId,
        profile_name: payload.profileName,
        author_name: payload.authorName,
        author_email: payload.authorEmail,
        author_avatar_url: payload.authorAvatarUrl,
        rating: payload.rating,
        title: payload.title,
        body: payload.body,
        created_at: payload.createdAt || new Date().toISOString(),
        external_url: payload.externalUrl,
        metadata: payload.metadata || {},
      })
      .select()
      .single();

    if (error) {
      console.error('[ReputationService] ingestReview error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbToReview(data) };
  } catch (error) {
    console.error('[ReputationService] ingestReview exception:', error);
    return { success: false, error: 'Failed to ingest review' };
  }
}

/**
 * Ingest multiple reviews in bulk
 */
export async function ingestReviews(
  reviews: IngestReviewPayload[]
): Promise<ServiceResult<Review[]>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_reviews')
      .insert(
        reviews.map((review) => ({
          tenant_id: review.tenantId,
          source: review.source,
          source_id: review.sourceId,
          profile_name: review.profileName,
          author_name: review.authorName,
          author_email: review.authorEmail,
          author_avatar_url: review.authorAvatarUrl,
          rating: review.rating,
          title: review.title,
          body: review.body,
          created_at: review.createdAt || new Date().toISOString(),
          external_url: review.externalUrl,
          metadata: review.metadata || {},
        }))
      )
      .select();

    if (error) {
      console.error('[ReputationService] ingestReviews error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []).map(mapDbToReview) };
  } catch (error) {
    console.error('[ReputationService] ingestReviews exception:', error);
    return { success: false, error: 'Failed to ingest reviews' };
  }
}

/**
 * Get reviews with optional filters and pagination
 */
export async function getReviews(
  tenantId: string,
  filters?: ReviewFilters
): Promise<ServiceResult<Review[]>> {
  try {
    let query = supabaseAdmin
      .from('synthex_reviews')
      .select('*')
      .eq('tenant_id', tenantId);

    if (filters?.source) {
      query = query.eq('source', filters.source);
    }

    if (filters?.minRating !== undefined) {
      query = query.gte('rating', filters.minRating);
    }

    if (filters?.maxRating !== undefined) {
      query = query.lte('rating', filters.maxRating);
    }

    if (filters?.hasResponse !== undefined) {
      if (filters.hasResponse) {
        query = query.not('response', 'is', null);
      } else {
        query = query.is('response', null);
      }
    }

    if (filters?.from) {
      query = query.gte('created_at', filters.from);
    }

    if (filters?.to) {
      query = query.lte('created_at', filters.to);
    }

    query = query.order('created_at', { ascending: false });

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(
        filters.offset,
        filters.offset + (filters.limit || 50) - 1
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error('[ReputationService] getReviews error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: (data || []).map(mapDbToReview) };
  } catch (error) {
    console.error('[ReputationService] getReviews exception:', error);
    return { success: false, error: 'Failed to fetch reviews' };
  }
}

/**
 * Get a single review by ID
 */
export async function getReview(
  reviewId: string
): Promise<ServiceResult<Review>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error) {
      console.error('[ReputationService] getReview error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbToReview(data) };
  } catch (error) {
    console.error('[ReputationService] getReview exception:', error);
    return { success: false, error: 'Failed to fetch review' };
  }
}

/**
 * Get reputation summary for a tenant
 */
export async function getReputationSummary(
  tenantId: string
): Promise<ServiceResult<ReputationSummary>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_reputation_summary')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      console.error('[ReputationService] getReputationSummary error:', error);
      return { success: false, error: error.message };
    }

    if (!data) {
      // No summary yet, create an empty one
      const { data: newSummary, error: insertError } = await supabaseAdmin
        .from('synthex_reputation_summary')
        .insert({ tenant_id: tenantId })
        .select()
        .single();

      if (insertError) {
        console.error(
          '[ReputationService] createReputationSummary error:',
          insertError
        );
        return { success: false, error: insertError.message };
      }

      return { success: true, data: mapDbToReputationSummary(newSummary) };
    }

    return { success: true, data: mapDbToReputationSummary(data) };
  } catch (error) {
    console.error('[ReputationService] getReputationSummary exception:', error);
    return { success: false, error: 'Failed to fetch reputation summary' };
  }
}

/**
 * Update review response
 */
export async function updateReviewResponse(
  reviewId: string,
  response: string,
  responseAuthor?: string
): Promise<ServiceResult<Review>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_reviews')
      .update({
        response,
        response_author: responseAuthor,
        responded_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) {
      console.error('[ReputationService] updateReviewResponse error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbToReview(data) };
  } catch (error) {
    console.error(
      '[ReputationService] updateReviewResponse exception:',
      error
    );
    return { success: false, error: 'Failed to update review response' };
  }
}

// =============================================================================
// AI-Powered Analysis Functions
// =============================================================================

/**
 * Analyze a review with AI to extract insights
 */
export async function analyzeReviewWithAI(
  reviewId: string,
  tenantId: string
): Promise<ServiceResult<ReviewInsight>> {
  try {
    // Get the review
    const reviewResult = await getReview(reviewId);
    if (!reviewResult.success || !reviewResult.data) {
      return { success: false, error: 'Review not found' };
    }

    const review = reviewResult.data;
    const anthropic = getAnthropicClient();

    const prompt = `Analyze this customer review and provide detailed insights.

Review Details:
- Source: ${review.source}
- Rating: ${review.rating}/5
- Author: ${review.authorName}
- Title: ${review.title || 'N/A'}
- Body: ${review.body}
- Date: ${review.createdAt}

Please provide a comprehensive analysis in JSON format with the following structure:
{
  "summary": "Brief 2-3 sentence summary of the review",
  "sentiment": "positive|neutral|negative|mixed",
  "sentimentScore": -1.0 to 1.0,
  "topics": ["topic1", "topic2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "entities": {
    "products": ["product names mentioned"],
    "people": ["staff names mentioned"],
    "locations": ["location names mentioned"]
  },
  "priority": "low|normal|high|urgent",
  "urgencyScore": 0-100,
  "requiresResponse": true|false,
  "actionItems": [
    {"description": "action to take", "type": "response|investigation|escalation", "priority": "low|normal|high"}
  ],
  "riskFlags": [
    {"type": "churn|complaint|legal|reputation", "description": "detailed description", "severity": "low|medium|high"}
  ],
  "isEscalated": true|false,
  "escalationReason": "reason if escalated",
  "confidenceScore": 0.0-1.0
}

Focus on:
1. Sentiment and emotional tone
2. Key topics and pain points
3. Actionable items for business improvement
4. Any red flags or escalation triggers
5. Whether a response is needed and urgency level`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return { success: false, error: 'Unexpected response type from AI' };
    }

    // Parse AI response
    const aiAnalysis = JSON.parse(content.text);

    // Store the insight
    const { data, error } = await supabaseAdmin
      .from('synthex_review_insights')
      .insert({
        tenant_id: tenantId,
        review_id: reviewId,
        summary: aiAnalysis.summary,
        sentiment: aiAnalysis.sentiment,
        sentiment_score: aiAnalysis.sentimentScore,
        topics: aiAnalysis.topics || [],
        keywords: aiAnalysis.keywords || [],
        entities: aiAnalysis.entities || {},
        priority: aiAnalysis.priority || 'normal',
        urgency_score: aiAnalysis.urgencyScore || 0,
        requires_response: aiAnalysis.requiresResponse || false,
        action_items: aiAnalysis.actionItems || [],
        risk_flags: aiAnalysis.riskFlags || [],
        is_escalated: aiAnalysis.isEscalated || false,
        escalation_reason: aiAnalysis.escalationReason,
        model_version: 'claude-sonnet-4-5-20250514',
        confidence_score: aiAnalysis.confidenceScore,
      })
      .select()
      .single();

    if (error) {
      console.error('[ReputationService] analyzeReviewWithAI error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: mapDbToReviewInsight(data) };
  } catch (error) {
    console.error('[ReputationService] analyzeReviewWithAI exception:', error);
    return { success: false, error: 'Failed to analyze review' };
  }
}

/**
 * Generate a suggested response to a review using AI
 */
export async function suggestReviewResponse(
  reviewId: string,
  tenantId: string,
  voiceId?: string
): Promise<ServiceResult<string>> {
  try {
    // Get the review
    const reviewResult = await getReview(reviewId);
    if (!reviewResult.success || !reviewResult.data) {
      return { success: false, error: 'Review not found' };
    }

    const review = reviewResult.data;

    // Get brand voice if available
    let brandVoicePrompt = '';
    const brandVoiceResult = await getBrandVoicePrompt(tenantId, voiceId);
    if (brandVoiceResult.success && brandVoiceResult.data) {
      brandVoicePrompt = brandVoiceResult.data;
    }

    const anthropic = getAnthropicClient();

    const systemPrompt = brandVoicePrompt
      ? `You are a professional customer service representative responding to customer reviews.

${brandVoicePrompt}

Always maintain professionalism, empathy, and alignment with the brand voice.`
      : `You are a professional customer service representative responding to customer reviews. Maintain professionalism, empathy, and gratitude.`;

    const userPrompt = `Generate a response to this customer review:

Review Details:
- Source: ${review.source}
- Rating: ${review.rating}/5
- Author: ${review.authorName}
- Title: ${review.title || 'N/A'}
- Body: ${review.body}

Guidelines:
1. Thank the customer for their feedback
2. For positive reviews: Express gratitude and highlight specific positives they mentioned
3. For negative reviews: Apologize sincerely, acknowledge concerns, and offer solutions
4. Keep it concise (2-4 sentences)
5. Be authentic and personalized
6. Include a call-to-action if appropriate (visit again, contact us, etc.)
7. Match the tone to the review rating

Provide ONLY the response text, no additional explanation.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: userPrompt,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return { success: false, error: 'Unexpected response type from AI' };
    }

    const suggestedResponse = content.text.trim();

    // Update the insight with suggested response if it exists
    await supabaseAdmin
      .from('synthex_review_insights')
      .update({ suggested_response: suggestedResponse })
      .eq('review_id', reviewId);

    return { success: true, data: suggestedResponse };
  } catch (error) {
    console.error(
      '[ReputationService] suggestReviewResponse exception:',
      error
    );
    return { success: false, error: 'Failed to generate response suggestion' };
  }
}

/**
 * Get insight for a review
 */
export async function getReviewInsight(
  reviewId: string
): Promise<ServiceResult<ReviewInsight | null>> {
  try {
    const { data, error } = await supabaseAdmin
      .from('synthex_review_insights')
      .select('*')
      .eq('review_id', reviewId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('[ReputationService] getReviewInsight error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data ? mapDbToReviewInsight(data) : null };
  } catch (error) {
    console.error('[ReputationService] getReviewInsight exception:', error);
    return { success: false, error: 'Failed to fetch review insight' };
  }
}

// =============================================================================
// Mapping Functions
// =============================================================================

function mapDbToReview(dbRow: any): Review {
  return {
    id: dbRow.id,
    tenantId: dbRow.tenant_id,
    source: dbRow.source,
    sourceId: dbRow.source_id,
    profileName: dbRow.profile_name,
    authorName: dbRow.author_name,
    authorEmail: dbRow.author_email,
    authorAvatarUrl: dbRow.author_avatar_url,
    rating: Number(dbRow.rating),
    title: dbRow.title,
    body: dbRow.body,
    response: dbRow.response,
    responseAuthor: dbRow.response_author,
    respondedAt: dbRow.responded_at,
    externalUrl: dbRow.external_url,
    isVerified: dbRow.is_verified,
    isFlagged: dbRow.is_flagged,
    flagReason: dbRow.flag_reason,
    createdAt: dbRow.created_at,
    ingestedAt: dbRow.ingested_at,
    updatedAt: dbRow.updated_at,
    metadata: dbRow.metadata || {},
  };
}

function mapDbToReputationSummary(dbRow: any): ReputationSummary {
  return {
    tenantId: dbRow.tenant_id,
    avgRating: Number(dbRow.avg_rating),
    totalReviews: dbRow.total_reviews,
    reviewCount30d: dbRow.review_count_30d,
    reviewCount90d: dbRow.review_count_90d,
    reviewCount365d: dbRow.review_count_365d,
    ratingDistribution: dbRow.rating_distribution,
    responseRate: Number(dbRow.response_rate || 0),
    avgResponseTimeHours: dbRow.avg_response_time_hours
      ? Number(dbRow.avg_response_time_hours)
      : null,
    trendScore: dbRow.trend_score ? Number(dbRow.trend_score) : null,
    trendDirection: dbRow.trend_direction,
    sentimentBreakdown: dbRow.sentiment_breakdown,
    sourceCounts: dbRow.source_counts,
    lastSyncAt: dbRow.last_sync_at,
    nextSyncAt: dbRow.next_sync_at,
    createdAt: dbRow.created_at,
    updatedAt: dbRow.updated_at,
  };
}

function mapDbToReviewInsight(dbRow: any): ReviewInsight {
  return {
    id: dbRow.id,
    tenantId: dbRow.tenant_id,
    reviewId: dbRow.review_id,
    summary: dbRow.summary,
    sentiment: dbRow.sentiment,
    sentimentScore: dbRow.sentiment_score ? Number(dbRow.sentiment_score) : null,
    topics: dbRow.topics || [],
    keywords: dbRow.keywords || [],
    entities: dbRow.entities || {},
    priority: dbRow.priority,
    urgencyScore: Number(dbRow.urgency_score || 0),
    requiresResponse: dbRow.requires_response,
    actionItems: dbRow.action_items || [],
    suggestedResponse: dbRow.suggested_response,
    riskFlags: dbRow.risk_flags || [],
    isEscalated: dbRow.is_escalated,
    escalationReason: dbRow.escalation_reason,
    modelVersion: dbRow.model_version,
    confidenceScore: dbRow.confidence_score
      ? Number(dbRow.confidence_score)
      : null,
    createdAt: dbRow.created_at,
  };
}
