/**
 * Pre-Client Identity Agent
 *
 * Agent for processing incoming emails to identify potential clients,
 * build relationship timelines, and detect business opportunities.
 * Part of the Client Historical Email Identity Engine.
 *
 * @module agents/preClientIdentityAgent
 */

import Anthropic from '@anthropic-ai/sdk';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';
import { db } from '@/lib/db';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import { getSupabaseServer } from '@/lib/supabase';
import {
  threadClusterService,
  type ClusteredThread,
} from '@/lib/emailIngestion/threadClusterService';
import {
  opportunityDetectorService,
  type DetectedInsight,
  type OpportunityAnalysis,
} from '@/lib/emailIngestion/opportunityDetectorService';

// ============================================================================
// Types & Interfaces
// ============================================================================

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

export interface PreClientProfile {
  id: string;
  workspaceId: string;
  email: string;
  name?: string;
  company?: string;
  firstContactDate: Date;
  lastContactDate: Date;
  emailCount: number;
  threadCount: number;
  relationshipStage: 'lead' | 'prospect' | 'negotiation' | 'client' | 'churned' | 'unknown';
  engagementScore: number;
  opportunityScore: number;
  primaryThemes: string[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  date: Date;
  type: 'email' | 'meeting' | 'proposal' | 'milestone' | 'insight';
  title: string;
  description: string;
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface EmailProcessingResult {
  preClientId: string;
  isNewContact: boolean;
  threads: ClusteredThread[];
  insights: DetectedInsight[];
  opportunityScore: number;
  nextSteps: string[];
}

export interface RelationshipAnalysis {
  profile: PreClientProfile;
  opportunities: DetectedInsight[];
  risks: DetectedInsight[];
  recommendations: string[];
  healthScore: number;
}

// ============================================================================
// Agent Functions
// ============================================================================

/**
 * Process an incoming email and identify/update pre-client
 */
export async function processEmail(
  workspaceId: string,
  emailData: {
    fromEmail: string;
    fromName?: string;
    subject: string;
    bodyPlain: string;
    messageTimestamp: Date;
  }
): Promise<EmailProcessingResult> {
  const supabase = await getSupabaseServer();

  // Check if pre-client exists
  const { data: existingPreClient } = await supabase
    .from('pre_clients')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('email', emailData.fromEmail.toLowerCase())
    .single();

  let preClientId: string;
  let isNewContact = false;

  if (!existingPreClient) {
    // Create new pre-client
    const { data: newPreClient, error } = await supabase
      .from('pre_clients')
      .insert({
        workspace_id: workspaceId,
        email: emailData.fromEmail.toLowerCase(),
        name: emailData.fromName,
        first_contact_date: emailData.messageTimestamp.toISOString(),
        last_contact_date: emailData.messageTimestamp.toISOString(),
        email_count: 1,
        thread_count: 0,
        relationship_stage: 'lead',
        engagement_score: 0,
        opportunity_score: 0,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create pre-client: ${error.message}`);
    }

    preClientId = newPreClient.id;
    isNewContact = true;
  } else {
    preClientId = existingPreClient.id;

    // Update last contact date and email count
    await supabase
      .from('pre_clients')
      .update({
        last_contact_date: emailData.messageTimestamp.toISOString(),
        email_count: (existingPreClient.email_count || 0) + 1,
      })
      .eq('id', preClientId);
  }

  // Extract insights from email
  const insights = await opportunityDetectorService.extractFromMessage(
    emailData.bodyPlain,
    {
      subject: emailData.subject,
      fromEmail: emailData.fromEmail,
      timestamp: emailData.messageTimestamp,
      isInbound: true,
    }
  );

  // Convert insights to DetectedInsight format
  const detectedInsights: DetectedInsight[] = [];

  for (const task of insights.tasks || []) {
    detectedInsights.push({
      preClientId,
      workspaceId,
      category: 'task',
      title: task.text,
      detail: task.context,
      detectedAt: emailData.messageTimestamp,
      priority: task.priority,
      status: 'pending',
      confidenceScore: task.confidence,
    });
  }

  for (const opportunity of insights.opportunities || []) {
    detectedInsights.push({
      preClientId,
      workspaceId,
      category: 'opportunity',
      title: opportunity.text,
      detail: opportunity.context,
      detectedAt: emailData.messageTimestamp,
      priority: opportunity.priority,
      status: 'pending',
      confidenceScore: opportunity.confidence,
    });
  }

  // Calculate opportunity score
  const opportunityScore = detectedInsights
    .filter((i) => i.category === 'opportunity' && i.priority === 'high')
    .reduce((sum, i) => sum + i.confidenceScore, 0);

  // Update opportunity score
  await supabase
    .from('pre_clients')
    .update({ opportunity_score: opportunityScore })
    .eq('id', preClientId);

  // Log processing
  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'email_processed_for_pre_client',
    details: {
      preClientId,
      isNewContact,
      fromEmail: emailData.fromEmail,
      insightsDetected: detectedInsights.length,
      opportunityScore,
    },
  });

  return {
    preClientId,
    isNewContact,
    threads: [],
    insights: detectedInsights,
    opportunityScore,
    nextSteps: generateNextSteps(detectedInsights),
  };
}

/**
 * Build comprehensive relationship timeline for a pre-client
 */
export async function buildTimeline(
  preClientId: string,
  workspaceId: string
): Promise<TimelineEvent[]> {
  const supabase = await getSupabaseServer();

  // Get all email threads for this pre-client
  const { data: threads } = await supabase
    .from('email_threads')
    .select('*')
    .eq('pre_client_id', preClientId)
    .order('first_message_at', { ascending: true });

  // Get all insights
  const { data: insights } = await supabase
    .from('pre_client_insights')
    .select('*')
    .eq('pre_client_id', preClientId)
    .order('detected_at', { ascending: true });

  const timeline: TimelineEvent[] = [];

  // Add email threads as events
  for (const thread of threads || []) {
    timeline.push({
      date: new Date(thread.first_message_at),
      type: 'email',
      title: thread.subject,
      description: thread.snippet || '',
      importance: thread.importance || 'medium',
    });
  }

  // Add insights as events
  for (const insight of insights || []) {
    timeline.push({
      date: new Date(insight.detected_at),
      type: 'insight',
      title: insight.title,
      description: insight.detail || '',
      importance: insight.priority,
    });
  }

  // Sort by date
  timeline.sort((a, b) => a.date.getTime() - b.date.getTime());

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'timeline_built',
    details: {
      preClientId,
      eventsCount: timeline.length,
    },
  });

  return timeline;
}

/**
 * Identify business opportunities from email history
 */
export async function identifyOpportunity(
  preClientId: string,
  workspaceId: string
): Promise<OpportunityAnalysis> {
  const supabase = await getSupabaseServer();

  // Get all insights for this pre-client
  const { data: insights } = await supabase
    .from('pre_client_insights')
    .select('*')
    .eq('pre_client_id', preClientId);

  const analysis: OpportunityAnalysis = {
    totalInsights: insights?.length || 0,
    byCategory: {
      task: 0,
      opportunity: 0,
      decision: 0,
      commitment: 0,
      question: 0,
      complaint: 0,
      praise: 0,
      request: 0,
      milestone: 0,
      risk: 0,
    },
    byPriority: {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
    pendingTasks: [],
    openOpportunities: [],
    unresolvedQuestions: [],
    activeCommitments: [],
    risks: [],
  };

  // Categorize insights
  for (const insight of insights || []) {
    const mappedInsight: DetectedInsight = {
      id: insight.id,
      preClientId: insight.pre_client_id,
      workspaceId: insight.workspace_id,
      category: insight.category,
      subcategory: insight.subcategory,
      title: insight.title,
      detail: insight.detail,
      sourceMessageId: insight.source_message_id,
      sourceThreadId: insight.source_thread_id,
      detectedAt: new Date(insight.detected_at),
      dueDate: insight.due_date ? new Date(insight.due_date) : undefined,
      priority: insight.priority,
      status: insight.status,
      confidenceScore: insight.confidence_score,
    };

    analysis.byCategory[insight.category]++;
    analysis.byPriority[insight.priority]++;

    if (insight.category === 'task' && insight.status === 'pending') {
      analysis.pendingTasks.push(mappedInsight);
    }
    if (insight.category === 'opportunity' && insight.status !== 'completed') {
      analysis.openOpportunities.push(mappedInsight);
    }
    if (insight.category === 'question' && insight.status !== 'completed') {
      analysis.unresolvedQuestions.push(mappedInsight);
    }
    if (insight.category === 'commitment' && insight.status !== 'completed') {
      analysis.activeCommitments.push(mappedInsight);
    }
    if (insight.category === 'risk') {
      analysis.risks.push(mappedInsight);
    }
  }

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'opportunities_identified',
    details: {
      preClientId,
      totalInsights: analysis.totalInsights,
      openOpportunities: analysis.openOpportunities.length,
      risks: analysis.risks.length,
    },
  });

  return analysis;
}

/**
 * Analyze relationship health and provide recommendations
 */
export async function analyzeRelationship(
  preClientId: string,
  workspaceId: string
): Promise<RelationshipAnalysis> {
  const supabase = await getSupabaseServer();

  // Get pre-client profile
  const { data: preClient } = await supabase
    .from('pre_clients')
    .select('*')
    .eq('id', preClientId)
    .single();

  if (!preClient) {
    throw new Error('Pre-client not found');
  }

  // Get opportunity analysis
  const opportunityAnalysis = await identifyOpportunity(preClientId, workspaceId);

  // Build timeline
  const timeline = await buildTimeline(preClientId, workspaceId);

  // Calculate health score using AI
  const systemPrompt = `You are a relationship analyst. Assess client relationship health and provide recommendations.

Return ONLY valid JSON with this structure:
{
  "healthScore": <0-100>,
  "recommendations": ["<recommendation 1>", "<recommendation 2>", "<recommendation 3>"]
}`;

  const userPrompt = `Analyze this pre-client relationship:

Email: ${preClient.email}
Name: ${preClient.name || 'Unknown'}
Company: ${preClient.company || 'Unknown'}
First Contact: ${preClient.first_contact_date}
Last Contact: ${preClient.last_contact_date}
Email Count: ${preClient.email_count}
Thread Count: ${preClient.thread_count}
Relationship Stage: ${preClient.relationship_stage}
Engagement Score: ${preClient.engagement_score}
Opportunity Score: ${preClient.opportunity_score}

Insights:
- Total: ${opportunityAnalysis.totalInsights}
- Open Opportunities: ${opportunityAnalysis.openOpportunities.length}
- Pending Tasks: ${opportunityAnalysis.pendingTasks.length}
- Unresolved Questions: ${opportunityAnalysis.unresolvedQuestions.length}
- Risks: ${opportunityAnalysis.risks.length}

Timeline Events: ${timeline.length}

Provide health score and recommendations.`;

  let healthScore = 50;
  let recommendations: string[] = [];

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1500,
        system: [
          {
            type: 'text',
            text: systemPrompt,
            cache_control: { type: 'ephemeral' },
          },
        ],
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });
    });

    // Log cache performance
    const cacheStats = extractCacheStats(result.data, 'claude-sonnet-4-5-20250929');
    logCacheStats('PreClientIdentity:analyzeOpportunity', cacheStats);

    const responseText =
      result.data.content[0].type === 'text' ? result.data.content[0].text : '';

    const jsonMatch =
      responseText.match(/```json\n?([\s\S]*?)\n?```/) ||
      responseText.match(/({[\s\S]*})/);
    const cleanJson = jsonMatch ? jsonMatch[1] : responseText;

    const analysis = JSON.parse(cleanJson);
    healthScore = analysis.healthScore || 50;
    recommendations = analysis.recommendations || [];
  } catch (error) {
    console.error('[PreClientIdentityAgent] Analysis error:', error);
    recommendations = [
      'Review recent communication history',
      'Address pending tasks and questions',
      'Follow up on open opportunities',
    ];
  }

  const profile: PreClientProfile = {
    id: preClient.id,
    workspaceId: preClient.workspace_id,
    email: preClient.email,
    name: preClient.name,
    company: preClient.company,
    firstContactDate: new Date(preClient.first_contact_date),
    lastContactDate: new Date(preClient.last_contact_date),
    emailCount: preClient.email_count,
    threadCount: preClient.thread_count,
    relationshipStage: preClient.relationship_stage,
    engagementScore: preClient.engagement_score,
    opportunityScore: preClient.opportunity_score,
    primaryThemes: preClient.primary_themes || [],
    timeline,
  };

  await db.auditLogs.create({
    workspace_id: workspaceId,
    action: 'relationship_analyzed',
    details: {
      preClientId,
      healthScore,
      recommendationsCount: recommendations.length,
    },
  });

  return {
    profile,
    opportunities: opportunityAnalysis.openOpportunities,
    risks: opportunityAnalysis.risks,
    recommendations,
    healthScore,
  };
}

/**
 * Get all pre-clients for a workspace
 */
export async function getPreClients(
  workspaceId: string,
  filters?: {
    relationshipStage?: string[];
    minOpportunityScore?: number;
    minEngagementScore?: number;
  }
): Promise<PreClientProfile[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('pre_clients')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('last_contact_date', { ascending: false });

  if (filters?.relationshipStage?.length) {
    query = query.in('relationship_stage', filters.relationshipStage);
  }

  if (filters?.minOpportunityScore !== undefined) {
    query = query.gte('opportunity_score', filters.minOpportunityScore);
  }

  if (filters?.minEngagementScore !== undefined) {
    query = query.gte('engagement_score', filters.minEngagementScore);
  }

  const { data } = await query;

  return (data || []).map((pc) => ({
    id: pc.id,
    workspaceId: pc.workspace_id,
    email: pc.email,
    name: pc.name,
    company: pc.company,
    firstContactDate: new Date(pc.first_contact_date),
    lastContactDate: new Date(pc.last_contact_date),
    emailCount: pc.email_count,
    threadCount: pc.thread_count,
    relationshipStage: pc.relationship_stage,
    engagementScore: pc.engagement_score,
    opportunityScore: pc.opportunity_score,
    primaryThemes: pc.primary_themes || [],
    timeline: [],
  }));
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateNextSteps(insights: DetectedInsight[]): string[] {
  const steps: string[] = [];

  const highPriorityTasks = insights.filter(
    (i) => i.category === 'task' && i.priority === 'high'
  );
  const opportunities = insights.filter((i) => i.category === 'opportunity');
  const questions = insights.filter((i) => i.category === 'question');

  if (highPriorityTasks.length > 0) {
    steps.push(`Address ${highPriorityTasks.length} high-priority task(s)`);
  }

  if (opportunities.length > 0) {
    steps.push(`Explore ${opportunities.length} business opportunity(ies)`);
  }

  if (questions.length > 0) {
    steps.push(`Respond to ${questions.length} outstanding question(s)`);
  }

  if (steps.length === 0) {
    steps.push('Monitor for future engagement opportunities');
  }

  return steps;
}

// Export singleton instance
export const preClientIdentityAgent = {
  processEmail,
  buildTimeline,
  identifyOpportunity,
  analyzeRelationship,
  getPreClients,
};
