/**
 * Client Agent Planner Service
 * Phase 83: AI-powered planning for client operations
 */

import Anthropic from "@anthropic-ai/sdk";
import { callAnthropicWithRetry } from "@/lib/anthropic/rate-limiter";
import {
  PlannerInput,
  PlannerOutput,
  ActionProposal,
  ActionType,
  ContextSnapshot,
  SessionMessage,
  ClientAgentPolicy,
} from './clientAgentTypes';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generate agent response and action proposals
 */
export async function planAgentResponse(
  input: PlannerInput
): Promise<PlannerOutput> {
  const systemPrompt = buildSystemPrompt(input.context, input.policy);
  const conversationHistory = buildConversationHistory(input.session_history);

  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 2048,
      system: systemPrompt,
      messages: [
        ...conversationHistory,
        { role: 'user', content: input.user_message },
      ],
    })
    });

    const response = result.data;;

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return parseAgentResponse(content.text);
  } catch (error) {
    console.error('Planner error:', error);
    return {
      response_message: 'I encountered an error while processing your request. Please try again.',
      proposed_actions: [],
      reasoning_trace: ['Error occurred during planning'],
    };
  }
}

/**
 * Build system prompt with context
 */
function buildSystemPrompt(
  context: ContextSnapshot,
  policy: ClientAgentPolicy
): string {
  const contextSummary = buildContextSummary(context);
  const policySummary = buildPolicySummary(policy);

  return `You are a Client Operations Agent for a CRM system. Your role is to help manage client relationships by proposing and executing low-risk operational tasks.

## Your Capabilities
You can propose these actions (if allowed by policy):
- send_followup: Send a follow-up email to the client
- update_status: Update client status (lead → prospect → customer)
- add_tag: Add a tag to categorize the client
- remove_tag: Remove a tag from the client
- schedule_task: Schedule a task for the user
- generate_content: Generate marketing content for the client
- update_score: Update the client's AI score
- create_note: Add a note to the client record
- send_notification: Send a notification to the user

## Safety Constraints
- ONLY propose actions that are allowed by the current policy
- ALWAYS explain your reasoning for each action
- LOW-RISK actions (tags, notes) can be auto-executed
- MEDIUM/HIGH-RISK actions (emails, status changes) need approval
- Respect early warnings - pause if high severity warnings exist
- Never fabricate data - use only what's in context

## Current Context
${contextSummary}

## Current Policy
${policySummary}

## Response Format
Respond in this exact JSON format:
{
  "message": "Your conversational response to the user",
  "proposed_actions": [
    {
      "action_type": "action_name",
      "action_payload": { "key": "value" },
      "agent_reasoning": "Why this action is appropriate",
      "confidence_score": 0.85,
      "data_sources": [
        { "source": "description", "recency": "2 hours ago", "reliability": 0.9 }
      ]
    }
  ],
  "reasoning_trace": [
    "Step 1: Analyzed user request",
    "Step 2: Reviewed client context",
    "Step 3: Selected appropriate actions"
  ]
}

If you cannot help or shouldn't take action, return empty proposed_actions array and explain why in the message.`;
}

/**
 * Build context summary for prompt
 */
function buildContextSummary(context: ContextSnapshot): string {
  const parts: string[] = [];

  if (context.client_profile) {
    const cp = context.client_profile;
    parts.push(`### Client Profile
- Name: ${cp.name}
- Email: ${cp.email || 'Not set'}
- Company: ${cp.company || 'Not set'}
- Status: ${cp.status}
- AI Score: ${cp.ai_score}
- Tags: ${cp.tags?.join(', ') || 'None'}`);
  }

  if (context.recent_interactions?.length) {
    parts.push(`### Recent Interactions
${context.recent_interactions.map(i => `- ${i.type}: ${i.summary} (${i.date})`).join('\n')}`);
  }

  if (context.performance_metrics) {
    const pm = context.performance_metrics;
    parts.push(`### Performance Metrics
- Open Rate: ${pm.open_rate !== undefined ? Math.round(pm.open_rate * 100) + '%' : 'N/A'}
- Click Rate: ${pm.click_rate !== undefined ? Math.round(pm.click_rate * 100) + '%' : 'N/A'}
- Sentiment Trend: ${pm.sentiment_trend || 'Unknown'}`);
  }

  if (context.early_warnings?.length) {
    parts.push(`### ⚠️ Early Warnings
${context.early_warnings.map(w => `- [${w.severity.toUpperCase()}] ${w.warning_type}: ${w.message}`).join('\n')}`);
  }

  return parts.join('\n\n') || 'No context available';
}

/**
 * Build policy summary for prompt
 */
function buildPolicySummary(policy: ClientAgentPolicy): string {
  return `- Agent Enabled: ${policy.agent_enabled}
- Allowed Actions: ${policy.allowed_actions.join(', ')}
- Auto-Execute: ${policy.auto_exec_enabled ? `Yes (up to ${policy.auto_exec_risk_threshold} risk)` : 'No'}
- Max Actions/Day: ${policy.max_actions_per_day}
- Human Review Above Score: ${policy.require_human_review_above_score}
- Pause on High Warnings: ${policy.pause_on_high_severity_warning}`;
}

/**
 * Build conversation history for API
 */
function buildConversationHistory(
  messages: SessionMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter(m => m.role === 'user' || m.role === 'agent')
    .map(m => ({
      role: m.role === 'agent' ? 'assistant' : 'user',
      content: m.content,
    }));
}

/**
 * Parse agent response from JSON
 */
function parseAgentResponse(text: string): PlannerOutput {
  try {
    // Extract JSON from response (might be wrapped in markdown)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      response_message: parsed.message || 'I processed your request.',
      proposed_actions: (parsed.proposed_actions || []).map((a: Record<string, unknown>) => ({
        action_type: a.action_type as ActionType,
        action_payload: a.action_payload as Record<string, unknown> || {},
        agent_reasoning: a.agent_reasoning as string || '',
        confidence_score: a.confidence_score as number || 0.8,
        data_sources: a.data_sources || [],
      })),
      reasoning_trace: parsed.reasoning_trace || [],
    };
  } catch (error) {
    console.error('Failed to parse agent response:', error);

    // Return the text as message if parsing fails
    return {
      response_message: text,
      proposed_actions: [],
      reasoning_trace: ['Failed to parse structured response'],
    };
  }
}

/**
 * Generate simple response without actions
 */
export async function generateSimpleResponse(
  message: string,
  context: ContextSnapshot
): Promise<string> {
  try {
    const result = await callAnthropicWithRetry(async () => {
      return await anthropic.messages.create{
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      system: `You are a helpful CRM assistant. Answer questions concisely based on the provided context. If you don't have enough information, say so honestly.

Context:
${buildContextSummary(context)}`,
      messages: [{ role: 'user', content: message }],
    })
    });

    const response = result.data;;

    const content = response.content[0];
    if (content.type !== 'text') {
      return 'I was unable to generate a response.';
    }

    return content.text;
  } catch (error) {
    console.error('Simple response error:', error);
    return 'I encountered an error. Please try again.';
  }
}
