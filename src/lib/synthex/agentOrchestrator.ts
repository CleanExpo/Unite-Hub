/**
 * Synthex Agent Orchestrator
 *
 * Coordinates AI agents with memory, context, and task management.
 * Enables autonomous operations with persistent state.
 *
 * Phase: B4 - Synthex Agent Automation
 */

import {
  getAnthropicClient,
  recordAnthropicSuccess,
  recordAnthropicFailure,
} from '@/lib/anthropic/client';
import { ANTHROPIC_MODELS } from '@/lib/anthropic/models';
import { saveMessage, getHistory, type AssistantMessage } from './assistantService';
import {
  buildContextFromMemory,
  setMemory,
  createTask,
  updateTaskStatus,
  type TaskType,
} from './memoryService';
import { listContent } from './contentService';
import { listCampaigns } from './campaignService';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ============================================================================
// Types
// ============================================================================

export interface AgentRunParams {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  task: string;
  conversationId?: string | null;
  autonomousMode?: boolean; // If true, agent can take actions
}

export interface AgentRunResult {
  response: string;
  tokensUsed: number;
  actions?: AgentAction[];
  conversationId: string;
}

export interface AgentAction {
  type: 'content_created' | 'campaign_created' | 'memory_saved' | 'task_queued';
  details: Record<string, unknown>;
}

export interface ContentGenerationParams {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  contentType: 'email' | 'blog' | 'social' | 'ad_copy';
  topic: string;
  additionalContext?: string;
}

export interface CampaignSequenceParams {
  tenantId: string;
  brandId?: string | null;
  userId: string;
  campaignType: 'drip' | 'email' | 'newsletter';
  goal: string;
  emailCount?: number;
}

// ============================================================================
// Helper Functions
// ============================================================================

async function getTenantContext(tenantId: string, brandId?: string | null): Promise<string> {
  let context = '';

  // Get tenant info
  const { data: tenant } = await supabaseAdmin
    .from('synthex_tenants')
    .select('name, business_type, settings')
    .eq('id', tenantId)
    .single();

  if (tenant) {
    context += `\nBusiness: ${tenant.name}`;
    if (tenant.business_type) {
      context += ` (${tenant.business_type})`;
    }
  }

  // Get brand info if specified
  if (brandId) {
    const { data: brand } = await supabaseAdmin
      .from('synthex_brands')
      .select('name, voice_tone, target_audience')
      .eq('id', brandId)
      .single();

    if (brand) {
      context += `\nBrand: ${brand.name}`;
      if (brand.voice_tone) {
        context += `\nBrand Voice: ${brand.voice_tone}`;
      }
      if (brand.target_audience) {
        context += `\nTarget Audience: ${brand.target_audience}`;
      }
    }
  }

  return context;
}

async function getRecentActivity(tenantId: string): Promise<string> {
  // Get recent content
  const { content } = await listContent({
    tenantId,
    limit: 5,
  });

  // Get recent campaigns
  const { campaigns } = await listCampaigns({
    tenantId,
    limit: 5,
  });

  let activity = '';

  if (content.length > 0) {
    activity += '\nRecent Content:';
    content.forEach((c) => {
      activity += `\n- ${c.title} (${c.type}, ${c.status})`;
    });
  }

  if (campaigns.length > 0) {
    activity += '\nRecent Campaigns:';
    campaigns.forEach((c) => {
      activity += `\n- ${c.name} (${c.type}, ${c.status})`;
    });
  }

  return activity;
}

// ============================================================================
// Main Orchestrator
// ============================================================================

/**
 * Run the agent with full context awareness
 */
export async function runAgent(params: AgentRunParams): Promise<AgentRunResult> {
  const { tenantId, brandId, userId, task, conversationId, autonomousMode = false } = params;

  // Generate conversation ID if not provided
  const activeConversationId = conversationId || crypto.randomUUID();

  // Build context from multiple sources
  const memoryContext = await buildContextFromMemory(tenantId, userId);
  const tenantContext = await getTenantContext(tenantId, brandId || undefined);
  const activityContext = await getRecentActivity(tenantId);

  // Get conversation history
  const history = await getHistory({
    tenantId,
    userId,
    conversationId: activeConversationId,
    limit: 20,
  });

  // Build enhanced system prompt
  const systemPrompt = `You are Synthex Autonomous Marketing Agent - an intelligent AI assistant that helps businesses with marketing automation.

## Your Capabilities
- Content creation (emails, blog posts, social media, ad copy)
- Campaign planning and sequence design
- SEO strategy and recommendations
- Marketing analytics insights
- Brand voice and messaging guidance

## Context
${tenantContext}
${memoryContext ? `\n## User Memory & Preferences\n${memoryContext}` : ''}
${activityContext ? `\n## Recent Activity\n${activityContext}` : ''}

## Guidelines
1. Be concise and actionable in your responses
2. Tailor advice to the specific business context provided
3. When suggesting content, match the brand voice
4. For campaigns, consider the target audience
5. Always explain your reasoning briefly

${autonomousMode ? `
## Autonomous Mode Active
You can suggest taking actions. When you want to take an action, format it as:
[ACTION: action_type] Description of what will be done

Available actions:
- [ACTION: GENERATE_CONTENT] - Create content piece
- [ACTION: CREATE_CAMPAIGN] - Set up a campaign
- [ACTION: SAVE_MEMORY] - Remember something important
- [ACTION: QUEUE_TASK] - Schedule a task for later
` : ''}

Respond naturally and helpfully to the user's request.`;

  // Format messages for Claude
  const messages = history
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  // Add current user message
  messages.push({ role: 'user', content: task });

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
    });

    recordAnthropicSuccess();

    // Extract response text
    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    const responseText = textContent.text;
    const tokensUsed = (response.usage?.input_tokens || 0) + (response.usage?.output_tokens || 0);

    // Parse any actions from the response (if autonomous mode)
    const actions: AgentAction[] = [];
    if (autonomousMode) {
      const actionMatches = responseText.matchAll(/\[ACTION: (\w+)\]/g);
      for (const match of actionMatches) {
        const actionType = match[1];
        switch (actionType) {
          case 'SAVE_MEMORY':
            actions.push({ type: 'memory_saved', details: { trigger: 'agent_suggestion' } });
            break;
          case 'QUEUE_TASK':
            actions.push({ type: 'task_queued', details: { trigger: 'agent_suggestion' } });
            break;
        }
      }
    }

    // Save user message
    await saveMessage({
      tenantId,
      brandId: brandId || undefined,
      userId,
      role: 'user',
      content: task,
      conversationId: activeConversationId,
    });

    // Save assistant response
    await saveMessage({
      tenantId,
      brandId: brandId || undefined,
      userId,
      role: 'assistant',
      content: responseText,
      conversationId: activeConversationId,
      tokensUsed,
      modelVersion: ANTHROPIC_MODELS.SONNET_4_5,
    });

    // Auto-save context to memory if it seems important
    if (task.toLowerCase().includes('remember') || task.toLowerCase().includes('my goal')) {
      await setMemory({
        tenantId,
        userId,
        key: `context_${Date.now()}`,
        value: { task, response: responseText.substring(0, 500) },
        memoryType: 'context',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      });
    }

    return {
      response: responseText,
      tokensUsed,
      actions: actions.length > 0 ? actions : undefined,
      conversationId: activeConversationId,
    };
  } catch (error) {
    recordAnthropicFailure(error);
    console.error('[agentOrchestrator] Error:', error);
    throw new Error('Agent service unavailable');
  }
}

/**
 * Generate content using the agent
 */
export async function generateContent(params: ContentGenerationParams): Promise<{
  title: string;
  content: string;
  suggestedTags: string[];
}> {
  const { tenantId, brandId, userId, contentType, topic, additionalContext } = params;

  const tenantContext = await getTenantContext(tenantId, brandId || undefined);
  const memoryContext = await buildContextFromMemory(tenantId, userId);

  const systemPrompt = `You are a content creation specialist for Synthex.

${tenantContext}
${memoryContext ? `\nUser Context:\n${memoryContext}` : ''}

Generate high-quality ${contentType} content that:
1. Matches the brand voice
2. Engages the target audience
3. Is optimized for the platform
4. Includes a clear call-to-action

Respond in JSON format:
{
  "title": "Content title",
  "content": "Full content body",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

  const userPrompt = `Create ${contentType} content about: ${topic}${additionalContext ? `\n\nAdditional context: ${additionalContext}` : ''}`;

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    recordAnthropicSuccess();

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      title: result.title || `${contentType}: ${topic}`,
      content: result.content || textContent.text,
      suggestedTags: result.suggestedTags || [],
    };
  } catch (error) {
    recordAnthropicFailure(error);
    console.error('[agentOrchestrator] Content generation error:', error);
    throw new Error('Content generation failed');
  }
}

/**
 * Generate a campaign sequence
 */
export async function generateCampaignSequence(params: CampaignSequenceParams): Promise<{
  name: string;
  description: string;
  steps: Array<{
    type: 'email' | 'wait' | 'condition';
    subject?: string;
    content?: string;
    delay?: number;
    condition?: string;
  }>;
}> {
  const { tenantId, brandId, userId, campaignType, goal, emailCount = 5 } = params;

  const tenantContext = await getTenantContext(tenantId, brandId || undefined);

  const systemPrompt = `You are a campaign strategist for Synthex.

${tenantContext}

Design a ${campaignType} campaign sequence that:
1. Achieves the stated goal
2. Has natural pacing (appropriate wait times)
3. Includes compelling subject lines
4. Builds toward a clear call-to-action
5. Has ${emailCount} emails in the sequence

Respond in JSON format:
{
  "name": "Campaign name",
  "description": "Campaign description",
  "steps": [
    { "type": "email", "subject": "Subject line", "content": "Email body outline" },
    { "type": "wait", "delay": 2 },
    { "type": "email", "subject": "Subject line", "content": "Email body outline" }
  ]
}

Wait delays are in days.`;

  const userPrompt = `Create a ${campaignType} campaign with goal: ${goal}`;

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    recordAnthropicSuccess();

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    // Parse JSON response
    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format');
    }

    const result = JSON.parse(jsonMatch[0]);
    return {
      name: result.name || `${campaignType} Campaign`,
      description: result.description || goal,
      steps: result.steps || [],
    };
  } catch (error) {
    recordAnthropicFailure(error);
    console.error('[agentOrchestrator] Campaign generation error:', error);
    throw new Error('Campaign generation failed');
  }
}

/**
 * Get AI suggestions for content metadata
 */
export async function suggestMetadata(params: {
  tenantId: string;
  content: string;
  contentType: string;
}): Promise<{
  suggestedTitle: string;
  suggestedTags: string[];
  suggestedCategory: string;
  summary: string;
}> {
  const { tenantId, content, contentType } = params;

  const tenantContext = await getTenantContext(tenantId);

  const systemPrompt = `You are a content analyst for Synthex.

${tenantContext}

Analyze the content and suggest appropriate metadata.

Respond in JSON format:
{
  "suggestedTitle": "Suggested title",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "suggestedCategory": "Category name",
  "summary": "Brief 1-2 sentence summary"
}`;

  try {
    const anthropic = getAnthropicClient();

    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODELS.SONNET_4_5,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: `Analyze this ${contentType} content and suggest metadata:\n\n${content.substring(0, 2000)}`,
        },
      ],
    });

    recordAnthropicSuccess();

    const textContent = response.content.find((c) => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text content in response');
    }

    const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        suggestedTitle: '',
        suggestedTags: [],
        suggestedCategory: '',
        summary: '',
      };
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    recordAnthropicFailure(error);
    console.error('[agentOrchestrator] Metadata suggestion error:', error);
    return {
      suggestedTitle: '',
      suggestedTags: [],
      suggestedCategory: '',
      summary: '',
    };
  }
}
