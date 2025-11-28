/**
 * Opportunity Detector Service
 *
 * Identifies opportunities, gaps, pending deliverables, and actionable insights
 * from historical email conversations.
 * Part of the Client Historical Email Identity Engine.
 */

import Anthropic from '@anthropic-ai/sdk';
import { getSupabaseServer } from '@/lib/supabase';

// Types
export type InsightCategory =
  | 'task'
  | 'opportunity'
  | 'decision'
  | 'commitment'
  | 'question'
  | 'complaint'
  | 'praise'
  | 'request'
  | 'milestone'
  | 'risk';

export type InsightPriority = 'low' | 'medium' | 'high' | 'urgent';
export type InsightStatus = 'pending' | 'in_progress' | 'completed' | 'dismissed' | 'converted';

export interface DetectedInsight {
  id?: string;
  preClientId: string;
  workspaceId: string;
  category: InsightCategory;
  subcategory?: string;
  title: string;
  detail?: string;
  sourceMessageId?: string;
  sourceThreadId?: string;
  detectedAt: Date;
  dueDate?: Date;
  priority: InsightPriority;
  status: InsightStatus;
  confidenceScore: number;
}

export interface OpportunityAnalysis {
  totalInsights: number;
  byCategory: Record<InsightCategory, number>;
  byPriority: Record<InsightPriority, number>;
  pendingTasks: DetectedInsight[];
  openOpportunities: DetectedInsight[];
  unresolvedQuestions: DetectedInsight[];
  activeCommitments: DetectedInsight[];
  risks: DetectedInsight[];
}

export interface ExtractionResult {
  tasks: ExtractedItem[];
  questions: ExtractedItem[];
  commitments: ExtractedItem[];
  opportunities: ExtractedItem[];
  risks: ExtractedItem[];
}

export interface ExtractedItem {
  text: string;
  context: string;
  priority: InsightPriority;
  confidence: number;
  dueDate?: string;
}

class OpportunityDetectorService {
  private anthropic: Anthropic | null = null;

  private getAnthropicClient(): Anthropic {
    if (!this.anthropic) {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('ANTHROPIC_API_KEY is not configured');
      }
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    return this.anthropic;
  }

  /**
   * Extract actionable items from a single message
   */
  async extractFromMessage(
    messageContent: string,
    messageContext: {
      subject: string;
      fromEmail: string;
      timestamp: Date;
      isInbound: boolean;
    }
  ): Promise<ExtractionResult> {
    const anthropic = this.getAnthropicClient();

    const prompt = `Analyze this email and extract actionable items.

Email Details:
Subject: ${messageContext.subject}
From: ${messageContext.fromEmail}
Date: ${messageContext.timestamp.toISOString()}
Direction: ${messageContext.isInbound ? 'Received from client' : 'Sent to client'}

Content:
${messageContent.slice(0, 2000)}

Extract the following if present:
1. TASKS: Action items that need to be done
2. QUESTIONS: Unanswered questions (especially from the client)
3. COMMITMENTS: Promises made (by either party)
4. OPPORTUNITIES: Sales/upsell/relationship opportunities
5. RISKS: Potential issues, complaints, or concerns

For each item, assess:
- Priority: low, medium, high, urgent
- Confidence: 0.0-1.0 (how certain is this extraction)
- Due date: if mentioned or implied (ISO format)

Respond with JSON only:
{
  "tasks": [{"text": "", "context": "", "priority": "", "confidence": 0.0, "dueDate": null}],
  "questions": [{"text": "", "context": "", "priority": "", "confidence": 0.0}],
  "commitments": [{"text": "", "context": "", "priority": "", "confidence": 0.0, "dueDate": null}],
  "opportunities": [{"text": "", "context": "", "priority": "", "confidence": 0.0}],
  "risks": [{"text": "", "context": "", "priority": "", "confidence": 0.0}]
}

If nothing found for a category, return empty array.`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return this.emptyResult();
      }

      // Extract JSON from response
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return this.emptyResult();
      }

      return JSON.parse(jsonMatch[0]) as ExtractionResult;
    } catch (error) {
      console.error('[OpportunityDetector] Extraction error:', error);
      return this.emptyResult();
    }
  }

  private emptyResult(): ExtractionResult {
    return {
      tasks: [],
      questions: [],
      commitments: [],
      opportunities: [],
      risks: [],
    };
  }

  /**
   * Process all messages for a pre-client and detect opportunities
   */
  async processPreClient(
    preClientId: string,
    workspaceId: string
  ): Promise<DetectedInsight[]> {
    const supabase = await getSupabaseServer();

    // Fetch messages that haven't been analyzed
    const { data: messages, error: messagesError } = await supabase
      .from('pre_client_messages')
      .select('*')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('message_timestamp', { ascending: true });

    if (messagesError) {
      console.error('[OpportunityDetector] Failed to fetch messages:', messagesError);
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }

    if (!messages?.length) {
      return [];
    }

    const allInsights: DetectedInsight[] = [];

    // Process messages in batches
    const batchSize = 5;
    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);

      for (const message of batch) {
        const extraction = await this.extractFromMessage(
          message.body_plain || message.snippet || '',
          {
            subject: message.subject || '',
            fromEmail: message.from_email,
            timestamp: new Date(message.message_timestamp),
            isInbound: message.is_inbound,
          }
        );

        // Convert extractions to insights
        const messageInsights = this.convertToInsights(
          extraction,
          preClientId,
          workspaceId,
          message.id,
          message.thread_id
        );

        // Save to database
        for (const insight of messageInsights) {
          const savedId = await this.saveInsight(insight);
          if (savedId) {
            insight.id = savedId;
            allInsights.push(insight);
          }
        }

        // Update message with extracted items
        await supabase
          .from('pre_client_messages')
          .update({
            extracted_tasks: extraction.tasks,
            extracted_questions: extraction.questions,
            extracted_commitments: extraction.commitments,
          })
          .eq('id', message.id);
      }

      // Small delay to avoid rate limits
      if (i + batchSize < messages.length) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    return allInsights;
  }

  /**
   * Convert extraction result to insight records
   */
  private convertToInsights(
    extraction: ExtractionResult,
    preClientId: string,
    workspaceId: string,
    messageId: string,
    threadId?: string
  ): DetectedInsight[] {
    const insights: DetectedInsight[] = [];
    const now = new Date();

    // Convert tasks
    for (const task of extraction.tasks) {
      if (task.confidence >= 0.6) {
        insights.push({
          preClientId,
          workspaceId,
          category: 'task',
          title: task.text,
          detail: task.context,
          sourceMessageId: messageId,
          sourceThreadId: threadId,
          detectedAt: now,
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          priority: task.priority,
          status: 'pending',
          confidenceScore: task.confidence,
        });
      }
    }

    // Convert questions
    for (const question of extraction.questions) {
      if (question.confidence >= 0.6) {
        insights.push({
          preClientId,
          workspaceId,
          category: 'question',
          title: question.text,
          detail: question.context,
          sourceMessageId: messageId,
          sourceThreadId: threadId,
          detectedAt: now,
          priority: question.priority,
          status: 'pending',
          confidenceScore: question.confidence,
        });
      }
    }

    // Convert commitments
    for (const commitment of extraction.commitments) {
      if (commitment.confidence >= 0.6) {
        insights.push({
          preClientId,
          workspaceId,
          category: 'commitment',
          title: commitment.text,
          detail: commitment.context,
          sourceMessageId: messageId,
          sourceThreadId: threadId,
          detectedAt: now,
          dueDate: commitment.dueDate ? new Date(commitment.dueDate) : undefined,
          priority: commitment.priority,
          status: 'pending',
          confidenceScore: commitment.confidence,
        });
      }
    }

    // Convert opportunities
    for (const opportunity of extraction.opportunities) {
      if (opportunity.confidence >= 0.5) {
        insights.push({
          preClientId,
          workspaceId,
          category: 'opportunity',
          title: opportunity.text,
          detail: opportunity.context,
          sourceMessageId: messageId,
          sourceThreadId: threadId,
          detectedAt: now,
          priority: opportunity.priority,
          status: 'pending',
          confidenceScore: opportunity.confidence,
        });
      }
    }

    // Convert risks
    for (const risk of extraction.risks) {
      if (risk.confidence >= 0.5) {
        insights.push({
          preClientId,
          workspaceId,
          category: 'risk',
          title: risk.text,
          detail: risk.context,
          sourceMessageId: messageId,
          sourceThreadId: threadId,
          detectedAt: now,
          priority: risk.priority,
          status: 'pending',
          confidenceScore: risk.confidence,
        });
      }
    }

    return insights;
  }

  /**
   * Save insight to database
   */
  async saveInsight(insight: DetectedInsight): Promise<string | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('pre_client_insights')
      .insert({
        pre_client_id: insight.preClientId,
        workspace_id: insight.workspaceId,
        category: insight.category,
        subcategory: insight.subcategory,
        title: insight.title,
        detail: insight.detail,
        source_message_id: insight.sourceMessageId,
        source_thread_id: insight.sourceThreadId,
        detected_at: insight.detectedAt.toISOString(),
        due_date: insight.dueDate?.toISOString(),
        priority: insight.priority,
        status: insight.status,
        confidence_score: insight.confidenceScore,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[OpportunityDetector] Failed to save insight:', error);
      return null;
    }

    return data?.id || null;
  }

  /**
   * Get insights for a pre-client
   */
  async getInsights(
    preClientId: string,
    workspaceId: string,
    options: {
      categories?: InsightCategory[];
      priorities?: InsightPriority[];
      statuses?: InsightStatus[];
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<DetectedInsight[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('pre_client_insights')
      .select('*')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('detected_at', { ascending: false });

    if (options.categories?.length) {
      query = query.in('category', options.categories);
    }

    if (options.priorities?.length) {
      query = query.in('priority', options.priorities);
    }

    if (options.statuses?.length) {
      query = query.in('status', options.statuses);
    }

    if (options.limit) {
      query = query.limit(options.limit);
    }

    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[OpportunityDetector] Failed to fetch insights:', error);
      throw new Error(`Failed to fetch insights: ${error.message}`);
    }

    return (data || []).map((i) => ({
      id: i.id,
      preClientId: i.pre_client_id,
      workspaceId: i.workspace_id,
      category: i.category as InsightCategory,
      subcategory: i.subcategory,
      title: i.title,
      detail: i.detail,
      sourceMessageId: i.source_message_id,
      sourceThreadId: i.source_thread_id,
      detectedAt: new Date(i.detected_at),
      dueDate: i.due_date ? new Date(i.due_date) : undefined,
      priority: i.priority as InsightPriority,
      status: i.status as InsightStatus,
      confidenceScore: parseFloat(i.confidence_score) || 0,
    }));
  }

  /**
   * Update insight status
   */
  async updateInsightStatus(
    insightId: string,
    workspaceId: string,
    status: InsightStatus,
    convertedToTaskId?: string
  ): Promise<boolean> {
    const supabase = await getSupabaseServer();

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed' || status === 'dismissed') {
      updateData.resolved_at = new Date().toISOString();
    }

    if (status === 'converted' && convertedToTaskId) {
      updateData.converted_to_task_id = convertedToTaskId;
    }

    const { error } = await supabase
      .from('pre_client_insights')
      .update(updateData)
      .eq('id', insightId)
      .eq('workspace_id', workspaceId);

    if (error) {
      console.error('[OpportunityDetector] Failed to update insight:', error);
      return false;
    }

    return true;
  }

  /**
   * Generate opportunity analysis for a pre-client
   */
  async generateAnalysis(
    preClientId: string,
    workspaceId: string
  ): Promise<OpportunityAnalysis> {
    const insights = await this.getInsights(preClientId, workspaceId);

    const byCategory: Record<InsightCategory, number> = {
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
    };

    const byPriority: Record<InsightPriority, number> = {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    };

    const pendingTasks: DetectedInsight[] = [];
    const openOpportunities: DetectedInsight[] = [];
    const unresolvedQuestions: DetectedInsight[] = [];
    const activeCommitments: DetectedInsight[] = [];
    const risks: DetectedInsight[] = [];

    for (const insight of insights) {
      byCategory[insight.category]++;
      byPriority[insight.priority]++;

      if (insight.status === 'pending' || insight.status === 'in_progress') {
        switch (insight.category) {
          case 'task':
            pendingTasks.push(insight);
            break;
          case 'opportunity':
            openOpportunities.push(insight);
            break;
          case 'question':
            unresolvedQuestions.push(insight);
            break;
          case 'commitment':
            activeCommitments.push(insight);
            break;
          case 'risk':
          case 'complaint':
            risks.push(insight);
            break;
        }
      }
    }

    return {
      totalInsights: insights.length,
      byCategory,
      byPriority,
      pendingTasks: pendingTasks.slice(0, 10),
      openOpportunities: openOpportunities.slice(0, 10),
      unresolvedQuestions: unresolvedQuestions.slice(0, 10),
      activeCommitments: activeCommitments.slice(0, 10),
      risks: risks.slice(0, 10),
    };
  }

  /**
   * Identify cross-thread patterns and opportunities
   */
  async identifyCrossThreadPatterns(
    preClientId: string,
    workspaceId: string
  ): Promise<{
    patterns: string[];
    recommendations: string[];
  }> {
    const supabase = await getSupabaseServer();

    // Fetch threads with insights
    const { data: threads } = await supabase
      .from('pre_client_threads')
      .select('subject, primary_theme, themes, importance')
      .eq('pre_client_id', preClientId)
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false })
      .limit(20);

    // Fetch high-priority insights
    const insights = await this.getInsights(preClientId, workspaceId, {
      priorities: ['high', 'urgent'],
      limit: 20,
    });

    if (!threads?.length && !insights.length) {
      return { patterns: [], recommendations: [] };
    }

    const anthropic = this.getAnthropicClient();

    const context = `Threads:\n${
      threads?.map((t) => `- ${t.subject} (${t.primary_theme}, ${t.importance})`).join('\n') || 'None'
    }\n\nHigh-Priority Insights:\n${
      insights.map((i) => `- [${i.category}] ${i.title}`).join('\n') || 'None'
    }`;

    const prompt = `Analyze this client relationship data and identify patterns and opportunities.

${context}

Provide:
1. PATTERNS: Recurring themes, behaviors, or concerns in the relationship
2. RECOMMENDATIONS: Actionable suggestions to strengthen the relationship

Respond with JSON:
{
  "patterns": ["pattern 1", "pattern 2"],
  "recommendations": ["recommendation 1", "recommendation 2"]
}`;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        return { patterns: [], recommendations: [] };
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { patterns: [], recommendations: [] };
      }

      return JSON.parse(jsonMatch[0]);
    } catch (error) {
      console.error('[OpportunityDetector] Pattern analysis error:', error);
      return { patterns: [], recommendations: [] };
    }
  }

  /**
   * Get overdue insights
   */
  async getOverdueInsights(workspaceId: string): Promise<DetectedInsight[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('pre_client_insights')
      .select('*')
      .eq('workspace_id', workspaceId)
      .in('status', ['pending', 'in_progress'])
      .not('due_date', 'is', null)
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (error) {
      console.error('[OpportunityDetector] Failed to fetch overdue:', error);
      return [];
    }

    return (data || []).map((i) => ({
      id: i.id,
      preClientId: i.pre_client_id,
      workspaceId: i.workspace_id,
      category: i.category as InsightCategory,
      subcategory: i.subcategory,
      title: i.title,
      detail: i.detail,
      sourceMessageId: i.source_message_id,
      sourceThreadId: i.source_thread_id,
      detectedAt: new Date(i.detected_at),
      dueDate: i.due_date ? new Date(i.due_date) : undefined,
      priority: i.priority as InsightPriority,
      status: i.status as InsightStatus,
      confidenceScore: parseFloat(i.confidence_score) || 0,
    }));
  }
}

export const opportunityDetectorService = new OpportunityDetectorService();
