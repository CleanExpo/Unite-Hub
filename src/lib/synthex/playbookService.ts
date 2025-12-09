/**
 * Synthex Playbook & Coach Service
 * Phase B42: Guided Playbooks & In-App Coach
 *
 * Provides:
 * - Playbook CRUD and discovery
 * - Progress tracking
 * - AI coach messaging
 * - Proactive tips management
 */

import { supabaseAdmin } from '@/lib/supabase/admin';

// Lazy-load Anthropic client
let anthropicClient: InstanceType<
  Awaited<typeof import('@anthropic-ai/sdk')>['default']
> | null = null;

async function getAnthropicClient() {
  if (!anthropicClient) {
    const Anthropic = (await import('@anthropic-ai/sdk')).default;
    anthropicClient = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropicClient;
}

// =====================================================
// Types
// =====================================================

export interface Playbook {
  id: string;
  tenant_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  category:
    | 'onboarding'
    | 'lead_nurture'
    | 'sales_enablement'
    | 'campaign_launch'
    | 'content_creation'
    | 'automation'
    | 'analytics'
    | 'integration'
    | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_minutes: number;
  scope: 'global' | 'tenant';
  is_featured: boolean;
  is_active: boolean;
  prerequisites: string[] | null;
  outcomes: string[] | null;
  icon: string | null;
  cover_image_url: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  steps?: PlaybookStep[];
}

export interface PlaybookStep {
  id: string;
  playbook_id: string;
  step_order: number;
  title: string;
  description: string | null;
  step_type: 'action' | 'info' | 'decision' | 'integration' | 'ai_task' | 'verification';
  content: string | null;
  action_type: string | null;
  action_config: Record<string, unknown>;
  target_url: string | null;
  target_selector: string | null;
  completion_type: 'manual' | 'auto' | 'api_check' | 'form_submit';
  completion_config: Record<string, unknown>;
  tips: string[] | null;
  is_optional: boolean;
  estimated_seconds: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface PlaybookProgress {
  id: string;
  tenant_id: string;
  user_id: string;
  playbook_id: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped' | 'abandoned';
  current_step_id: string | null;
  completed_step_ids: string[] | null;
  skipped_step_ids: string[] | null;
  started_at: string | null;
  completed_at: string | null;
  last_activity_at: string;
  notes: Record<string, unknown>;
  form_data: Record<string, unknown>;
  total_time_seconds: number;
  metadata: Record<string, unknown>;
}

export interface CoachMessage {
  id: string;
  tenant_id: string;
  user_id: string;
  context_type: 'general' | 'playbook' | 'campaign' | 'analytics' | 'onboarding' | 'troubleshooting';
  context_ref: string | null;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model_used: string | null;
  tokens_used: number | null;
  thread_id: string | null;
  parent_message_id: string | null;
  rating: number | null;
  rating_feedback: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface CoachTip {
  id: string;
  tenant_id: string | null;
  trigger_type: 'page_view' | 'action' | 'milestone' | 'time_based' | 'metric_threshold' | 'first_time';
  trigger_config: Record<string, unknown>;
  title: string;
  content: string;
  cta_text: string | null;
  cta_url: string | null;
  display_type: 'tooltip' | 'modal' | 'banner' | 'sidebar' | 'inline';
  target_selector: string | null;
  priority: number;
  is_dismissible: boolean;
  max_impressions: number;
  cooldown_hours: number;
  scope: 'global' | 'tenant';
  is_active: boolean;
  start_at: string | null;
  end_at: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// =====================================================
// Playbook Functions
// =====================================================

/**
 * List playbooks (global + tenant-specific)
 */
export async function listPlaybooks(
  tenantId: string,
  options: {
    category?: Playbook['category'];
    difficulty?: Playbook['difficulty'];
    featured?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Playbook[]> {
  const { category, difficulty, featured, limit = 50, offset = 0 } = options;

  let query = supabaseAdmin
    .from('synthex_playbooks')
    .select('*')
    .or(`scope.eq.global,tenant_id.eq.${tenantId}`)
    .eq('is_active', true)
    .order('is_featured', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (category) {
    query = query.eq('category', category);
  }
  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }
  if (featured !== undefined) {
    query = query.eq('is_featured', featured);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error listing playbooks:', error);
    throw new Error(`Failed to list playbooks: ${error.message}`);
  }

  return data || [];
}

/**
 * Get playbook by ID with steps
 */
export async function getPlaybookById(playbookId: string): Promise<Playbook | null> {
  const { data: playbook, error: playbookError } = await supabaseAdmin
    .from('synthex_playbooks')
    .select('*')
    .eq('id', playbookId)
    .single();

  if (playbookError) {
    if (playbookError.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get playbook: ${playbookError.message}`);
  }

  // Get steps
  const { data: steps, error: stepsError } = await supabaseAdmin
    .from('synthex_playbook_steps')
    .select('*')
    .eq('playbook_id', playbookId)
    .order('step_order', { ascending: true });

  if (stepsError) {
    console.error('Error getting playbook steps:', stepsError);
  }

  return {
    ...playbook,
    steps: steps || [],
  };
}

/**
 * Get playbook by slug
 */
export async function getPlaybookBySlug(
  tenantId: string,
  slug: string
): Promise<Playbook | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_playbooks')
    .select('*')
    .eq('slug', slug)
    .or(`scope.eq.global,tenant_id.eq.${tenantId}`)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get playbook: ${error.message}`);
  }

  if (data) {
    // Get steps
    const { data: steps } = await supabaseAdmin
      .from('synthex_playbook_steps')
      .select('*')
      .eq('playbook_id', data.id)
      .order('step_order', { ascending: true });

    return { ...data, steps: steps || [] };
  }

  return null;
}

/**
 * Get recommended playbooks for a user
 */
export async function getRecommendedPlaybooks(
  tenantId: string,
  userId: string,
  limit: number = 5
): Promise<
  Array<{
    playbook_id: string;
    playbook_name: string;
    category: string;
    difficulty: string;
    estimated_minutes: number;
    progress_status: string;
    completion_percentage: number;
  }>
> {
  const { data, error } = await supabaseAdmin.rpc('get_recommended_playbooks', {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_limit: limit,
  });

  if (error) {
    console.error('Error getting recommended playbooks:', error);
    // Fallback to simple query
    const playbooks = await listPlaybooks(tenantId, { featured: true, limit });
    return playbooks.map((p) => ({
      playbook_id: p.id,
      playbook_name: p.name,
      category: p.category,
      difficulty: p.difficulty,
      estimated_minutes: p.estimated_minutes,
      progress_status: 'not_started',
      completion_percentage: 0,
    }));
  }

  return data || [];
}

// =====================================================
// Progress Functions
// =====================================================

/**
 * Get user's progress on a playbook
 */
export async function getPlaybookProgress(
  tenantId: string,
  userId: string,
  playbookId: string
): Promise<PlaybookProgress | null> {
  const { data, error } = await supabaseAdmin
    .from('synthex_playbook_progress')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .eq('playbook_id', playbookId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
return null;
}
    throw new Error(`Failed to get progress: ${error.message}`);
  }

  return data;
}

/**
 * Start a playbook
 */
export async function startPlaybook(
  tenantId: string,
  userId: string,
  playbookId: string
): Promise<PlaybookProgress> {
  // Get first step
  const { data: firstStep } = await supabaseAdmin
    .from('synthex_playbook_steps')
    .select('id')
    .eq('playbook_id', playbookId)
    .order('step_order', { ascending: true })
    .limit(1)
    .single();

  const { data, error } = await supabaseAdmin
    .from('synthex_playbook_progress')
    .upsert(
      {
        tenant_id: tenantId,
        user_id: userId,
        playbook_id: playbookId,
        status: 'in_progress',
        current_step_id: firstStep?.id || null,
        started_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
      },
      {
        onConflict: 'tenant_id,user_id,playbook_id',
      }
    )
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to start playbook: ${error.message}`);
  }

  return data;
}

/**
 * Update progress on a step
 */
export async function updateStepProgress(
  tenantId: string,
  userId: string,
  playbookId: string,
  stepId: string,
  action: 'complete' | 'skip'
): Promise<{
  progress_id: string;
  next_step_id: string | null;
  completed_steps: number;
  total_steps: number;
  is_completed: boolean;
}> {
  const { data, error } = await supabaseAdmin.rpc('update_playbook_progress', {
    p_tenant_id: tenantId,
    p_user_id: userId,
    p_playbook_id: playbookId,
    p_step_id: stepId,
    p_action: action,
  });

  if (error) {
    throw new Error(`Failed to update progress: ${error.message}`);
  }

  return data;
}

/**
 * Get all progress for a user
 */
export async function getUserProgress(
  tenantId: string,
  userId: string
): Promise<PlaybookProgress[]> {
  const { data, error } = await supabaseAdmin
    .from('synthex_playbook_progress')
    .select('*, playbook:synthex_playbooks(name, slug, category)')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('last_activity_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user progress: ${error.message}`);
  }

  return data || [];
}

// =====================================================
// Coach Functions
// =====================================================

/**
 * Send a message to the AI coach
 */
export async function sendCoachMessage(
  tenantId: string,
  userId: string,
  message: string,
  options: {
    contextType?: CoachMessage['context_type'];
    contextRef?: string;
    threadId?: string;
  } = {}
): Promise<CoachMessage> {
  const { contextType = 'general', contextRef, threadId } = options;

  // Store user message
  const { data: userMessage, error: userError } = await supabaseAdmin
    .from('synthex_coach_messages')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      context_type: contextType,
      context_ref: contextRef,
      role: 'user',
      content: message,
      thread_id: threadId || null,
    })
    .select()
    .single();

  if (userError) {
    throw new Error(`Failed to store message: ${userError.message}`);
  }

  // Get conversation history for context
  let conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = [];
  if (threadId) {
    const { data: history } = await supabaseAdmin
      .from('synthex_coach_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .in('role', ['user', 'assistant'])
      .order('created_at', { ascending: true })
      .limit(10);

    if (history) {
      conversationHistory = history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      }));
    }
  }

  // Build context-specific system prompt
  let systemPrompt = `You are Synthex Coach, a helpful AI assistant for marketing automation.
You help users with:
- Setting up email campaigns and drip sequences
- Understanding analytics and metrics
- Creating effective marketing content
- Troubleshooting issues
- Best practices for lead nurturing

Be concise, practical, and encouraging. Focus on actionable advice.`;

  if (contextType === 'playbook') {
    systemPrompt += `\n\nThe user is currently working through a guided playbook. Help them complete their current step or clarify any questions.`;
  } else if (contextType === 'campaign') {
    systemPrompt += `\n\nThe user is working on a campaign. Provide specific advice about campaign optimization, targeting, and content.`;
  } else if (contextType === 'troubleshooting') {
    systemPrompt += `\n\nThe user is experiencing an issue. Help them diagnose and resolve it step by step.`;
  }

  // Generate AI response
  let aiResponse = 'I apologize, but I encountered an issue generating a response. Please try again.';
  let tokensUsed = 0;

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const client = await getAnthropicClient();
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [
          ...conversationHistory,
          { role: 'user', content: message },
        ],
      });

      if (response.content[0].type === 'text') {
        aiResponse = response.content[0].text;
      }
      tokensUsed = response.usage.input_tokens + response.usage.output_tokens;
    } catch (err) {
      console.error('AI coach error:', err);
    }
  }

  // Store AI response
  const newThreadId = threadId || userMessage.id;
  const { data: assistantMessage, error: assistantError } = await supabaseAdmin
    .from('synthex_coach_messages')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      context_type: contextType,
      context_ref: contextRef,
      role: 'assistant',
      content: aiResponse,
      model_used: 'claude-sonnet-4-5-20250929',
      tokens_used: tokensUsed,
      thread_id: newThreadId,
      parent_message_id: userMessage.id,
    })
    .select()
    .single();

  if (assistantError) {
    throw new Error(`Failed to store response: ${assistantError.message}`);
  }

  return assistantMessage;
}

/**
 * Get conversation history
 */
export async function getConversationHistory(
  tenantId: string,
  userId: string,
  options: {
    threadId?: string;
    contextType?: CoachMessage['context_type'];
    limit?: number;
  } = {}
): Promise<CoachMessage[]> {
  const { threadId, contextType, limit = 50 } = options;

  let query = supabaseAdmin
    .from('synthex_coach_messages')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (threadId) {
    query = query.eq('thread_id', threadId);
  }
  if (contextType) {
    query = query.eq('context_type', contextType);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get conversation: ${error.message}`);
  }

  return (data || []).reverse();
}

/**
 * Rate a coach response
 */
export async function rateCoachResponse(
  messageId: string,
  rating: number,
  feedback?: string
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_coach_messages')
    .update({
      rating,
      rating_feedback: feedback || null,
    })
    .eq('id', messageId);

  if (error) {
    throw new Error(`Failed to rate response: ${error.message}`);
  }
}

// =====================================================
// Tips Functions
// =====================================================

/**
 * Get applicable tips for a user in a context
 */
export async function getApplicableTips(
  tenantId: string,
  userId: string,
  options: {
    triggerType?: CoachTip['trigger_type'];
    triggerValue?: string;
    page?: string;
  } = {}
): Promise<CoachTip[]> {
  const { triggerType, triggerValue, page } = options;

  // Get tips
  let query = supabaseAdmin
    .from('synthex_coach_tips')
    .select('*')
    .or(`scope.eq.global,tenant_id.eq.${tenantId}`)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (triggerType) {
    query = query.eq('trigger_type', triggerType);
  }

  const { data: tips, error } = await query;

  if (error) {
    console.error('Error getting tips:', error);
    return [];
  }

  if (!tips || tips.length === 0) {
return [];
}

  // Get user's tip impressions
  const { data: impressions } = await supabaseAdmin
    .from('synthex_coach_tip_impressions')
    .select('tip_id, action, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId);

  const impressionMap = new Map<
    string,
    { count: number; lastSeen: Date; dismissed: boolean }
  >();
  impressions?.forEach((imp) => {
    const existing = impressionMap.get(imp.tip_id) || {
      count: 0,
      lastSeen: new Date(0),
      dismissed: false,
    };
    existing.count++;
    const impDate = new Date(imp.created_at);
    if (impDate > existing.lastSeen) {
      existing.lastSeen = impDate;
    }
    if (imp.action === 'dismissed') {
      existing.dismissed = true;
    }
    impressionMap.set(imp.tip_id, existing);
  });

  const now = new Date();

  // Filter tips based on rules
  const applicableTips = tips.filter((tip) => {
    const impression = impressionMap.get(tip.id);

    // Check if dismissed
    if (impression?.dismissed && tip.is_dismissible) {
      return false;
    }

    // Check max impressions
    if (impression && impression.count >= tip.max_impressions) {
      return false;
    }

    // Check cooldown
    if (impression) {
      const cooldownMs = tip.cooldown_hours * 60 * 60 * 1000;
      if (now.getTime() - impression.lastSeen.getTime() < cooldownMs) {
        return false;
      }
    }

    // Check date range
    if (tip.start_at && new Date(tip.start_at) > now) {
      return false;
    }
    if (tip.end_at && new Date(tip.end_at) < now) {
      return false;
    }

    // Check trigger conditions
    if (tip.trigger_type === 'page_view' && page) {
      const pagePattern = tip.trigger_config.page_pattern as string;
      if (pagePattern && !page.match(new RegExp(pagePattern))) {
        return false;
      }
    }

    return true;
  });

  return applicableTips;
}

/**
 * Record a tip impression
 */
export async function recordTipImpression(
  tipId: string,
  tenantId: string,
  userId: string,
  action: 'viewed' | 'dismissed' | 'clicked' | 'completed'
): Promise<void> {
  const { error } = await supabaseAdmin
    .from('synthex_coach_tip_impressions')
    .insert({
      tip_id: tipId,
      tenant_id: tenantId,
      user_id: userId,
      action,
    });

  if (error) {
    console.error('Error recording tip impression:', error);
  }
}

/**
 * Create a custom tip for a tenant
 */
export async function createTip(
  tenantId: string,
  tip: Omit<CoachTip, 'id' | 'created_at' | 'updated_at'>
): Promise<CoachTip> {
  const { data, error } = await supabaseAdmin
    .from('synthex_coach_tips')
    .insert({
      ...tip,
      tenant_id: tenantId,
      scope: 'tenant',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create tip: ${error.message}`);
  }

  return data;
}
