/**
 * AI Consultation Service
 *
 * Manages AI-powered consultation sessions with clients.
 * Supports multiple explanation modes (ELI5, Beginner, Technical, Founder).
 */

import { getSupabaseServer } from '@/lib/supabase';
import Anthropic from '@anthropic-ai/sdk';
import { extractCacheStats, logCacheStats } from '@/lib/anthropic/features/prompt-cache';
import type {
  AIConsultation,
  AIConsultationMessage,
  AIConsultationInsight,
  ConsultationCreateInput,
  ConsultationMessageInput,
  ConsultationListFilters,
  ExplanationMode,
} from './consultationTypes';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  defaultHeaders: {
    'anthropic-beta': 'prompt-caching-2024-07-31',
  },
});

class AIConsultationService {
  /**
   * Create a new consultation session
   */
  async create(input: ConsultationCreateInput): Promise<AIConsultation> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ai_consultations')
      .insert({
        business_id: input.business_id,
        client_id: input.client_id || null,
        created_by: input.created_by || null,
        context: input.context || null,
        explanation_mode: input.explanation_mode || 'founder',
        title: input.title || null,
        status: 'active',
      })
      .select('*')
      .single();

    if (error) {
      console.error('[AIConsultationService] Create error:', error);
      throw error;
    }

    // Add system message to set context
    await this.addMessage({
      consultation_id: data.id,
      role: 'system',
      content: this.getSystemPrompt(input.explanation_mode || 'founder'),
      explanation_mode: input.explanation_mode || 'founder',
    });

    return data as AIConsultation;
  }

  /**
   * Get a consultation by ID
   */
  async getById(id: string): Promise<AIConsultation | null> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ai_consultations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data as AIConsultation;
  }

  /**
   * List consultations with filters
   */
  async list(filters: ConsultationListFilters = {}): Promise<AIConsultation[]> {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('ai_consultations')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.business_id) {
      query = query.eq('business_id', filters.business_id);
    }

    if (filters.client_id) {
      query = query.eq('client_id', filters.client_id);
    }

    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[AIConsultationService] List error:', error);
      throw error;
    }

    return (data || []) as AIConsultation[];
  }

  /**
   * Add a message to a consultation
   */
  async addMessage(input: ConsultationMessageInput): Promise<AIConsultationMessage> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ai_consultation_messages')
      .insert({
        consultation_id: input.consultation_id,
        role: input.role,
        content: input.content,
        explanation_mode: input.explanation_mode,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[AIConsultationService] Add message error:', error);
      throw error;
    }

    return data as AIConsultationMessage;
  }

  /**
   * Get all messages for a consultation
   */
  async getMessages(consultation_id: string): Promise<AIConsultationMessage[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ai_consultation_messages')
      .select('*')
      .eq('consultation_id', consultation_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[AIConsultationService] Get messages error:', error);
      throw error;
    }

    return (data || []) as AIConsultationMessage[];
  }

  /**
   * Process a client message and generate AI response
   */
  async processMessage(
    consultation_id: string,
    content: string,
    explanation_mode: ExplanationMode
  ): Promise<{ clientMessage: AIConsultationMessage; assistantMessage: AIConsultationMessage }> {
    // Store client message
    const clientMessage = await this.addMessage({
      consultation_id,
      role: 'client',
      content,
      explanation_mode,
    });

    // Get conversation history
    const messages = await this.getMessages(consultation_id);

    // Build messages for Claude
    const claudeMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'client' ? 'user' : 'assistant',
        content: m.content,
      })) as Array<{ role: 'user' | 'assistant'; content: string }>;

    // Get system prompt for current mode
    const systemPrompt = this.getSystemPrompt(explanation_mode);

    // Call Claude
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: [
        {
          type: 'text',
          text: systemPrompt,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: claudeMessages,
    });

    // Log cache performance
    const cacheStats = extractCacheStats(response, 'claude-sonnet-4-5-20250929');
    logCacheStats('Consultation:processMessage', cacheStats);

    const assistantContent =
      response.content[0].type === 'text'
        ? response.content[0].text
        : 'I apologize, but I was unable to generate a response.';

    // Store assistant message
    const assistantMessage = await this.addMessage({
      consultation_id,
      role: 'assistant',
      content: assistantContent,
      explanation_mode,
    });

    return { clientMessage, assistantMessage };
  }

  /**
   * Add an insight to a consultation
   */
  async addInsight(
    consultation_id: string,
    insight_type: string,
    payload: Record<string, unknown>
  ): Promise<AIConsultationInsight> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ai_consultation_insights')
      .insert({
        consultation_id,
        insight_type,
        payload,
      })
      .select('*')
      .single();

    if (error) {
      console.error('[AIConsultationService] Add insight error:', error);
      throw error;
    }

    return data as AIConsultationInsight;
  }

  /**
   * Get insights for a consultation
   */
  async getInsights(consultation_id: string): Promise<AIConsultationInsight[]> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ai_consultation_insights')
      .select('*')
      .eq('consultation_id', consultation_id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[AIConsultationService] Get insights error:', error);
      throw error;
    }

    return (data || []) as AIConsultationInsight[];
  }

  /**
   * Close a consultation
   */
  async close(id: string): Promise<AIConsultation> {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('ai_consultations')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('[AIConsultationService] Close error:', error);
      throw error;
    }

    return data as AIConsultation;
  }

  /**
   * Get system prompt based on explanation mode
   */
  private getSystemPrompt(mode: ExplanationMode): string {
    const basePrompt = `You are AI Phill, a strategic advisor for business owners. You help clients understand their marketing, SEO, and growth strategies. You have access to their business context and can explain complex concepts clearly.

Key traits:
- Direct and honest without being harsh
- Focus on actionable insights
- Use data and evidence when available
- Acknowledge uncertainty when appropriate
- Keep client goals and constraints in mind`;

    switch (mode) {
      case 'eli5':
        return `${basePrompt}

IMPORTANT: Explain everything as if talking to a 5-year-old. Use simple words, analogies to everyday things, and avoid all jargon. If you must use a technical term, immediately explain it in the simplest possible way.

Example: Instead of "SEO improves organic search visibility", say "SEO helps your website show up when people search on Google, like putting a big sign on your store so people can find it."`;

      case 'beginner':
        return `${basePrompt}

IMPORTANT: Explain things for someone who owns a business but doesn't know much about digital marketing or technology. Define any technical terms the first time you use them. Use real-world business examples they can relate to.

Example: Instead of "CTR optimization", explain "Click-through rate (CTR) is the percentage of people who see your listing and click on it. Improving this means making your listing more attractive so more people visit your site."`;

      case 'technical':
        return `${basePrompt}

IMPORTANT: You're talking to someone who understands SEO, marketing, and technology. Use precise technical terminology. Include specific metrics, algorithms, and implementation details. Reference industry standards and best practices.

Example: "Based on NavBoost signals and the recent algorithm updates affecting E-E-A-T scoring, we should focus on improving dwell time metrics through enhanced above-the-fold content and reducing pogo-sticking through better search intent alignment."`;

      case 'founder':
      default:
        return `${basePrompt}

IMPORTANT: You're talking to a founder or business owner who is strategic but time-constrained. Focus on:
- Business impact and ROI
- Key decisions and trade-offs
- Bottom-line summaries with option to dive deeper
- Risk assessment and mitigation

Start with the most important point. Use bullet points for multiple items. End with clear next steps or questions.`;
    }
  }
}

// Singleton instance
let _instance: AIConsultationService | null = null;

export function getAIConsultationService(): AIConsultationService {
  if (!_instance) {
    _instance = new AIConsultationService();
  }
  return _instance;
}

export const aiConsultationService = new Proxy({} as AIConsultationService, {
  get(_target, prop) {
    const instance = getAIConsultationService();
    return (instance as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export { AIConsultationService };
export default aiConsultationService;
