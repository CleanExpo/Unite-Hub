/**
 * AI Orchestrator - Phase 1 Foundation
 * Intelligent event routing and multi-agent coordination
 *
 * This orchestrator routes AI tasks to the appropriate models:
 * - Gemini 3 Pro: Google Workspace tasks, Gmail intelligence
 * - OpenRouter: Standard operations (cost-optimized)
 * - Anthropic Direct: Complex reasoning, Extended Thinking
 */

import { GoogleGenAI } from '@google/genai';
import Anthropic from '@anthropic-ai/sdk';
import { supabaseStaff } from '../auth/supabase';

// Initialize AI clients
const gemini = new GoogleGenAI(process.env.GOOGLE_AI_API_KEY || '');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

/**
 * Event types that trigger AI orchestration
 */
export type AIEventType =
  | 'idea_submitted' // Client submits new idea
  | 'proposal_generated' // AI generates proposal from idea
  | 'project_update' // Project status change
  | 'task_completed' // Staff completes task
  | 'email_received' // New email requiring processing
  | 'content_requested' // Generate marketing content
  | 'intelligence_analysis'; // Analyze data for insights

/**
 * AI Provider selection based on task type
 */
function selectProvider(eventType: AIEventType): 'gemini' | 'openrouter' | 'anthropic' {
  switch (eventType) {
    case 'email_received':
    case 'intelligence_analysis':
      return 'gemini'; // Google Workspace integration

    case 'idea_submitted':
    case 'proposal_generated':
      return 'anthropic'; // Extended Thinking for complex reasoning

    case 'content_requested':
    case 'task_completed':
    case 'project_update':
      return 'openrouter'; // Cost-optimized for standard tasks

    default:
      return 'openrouter';
  }
}

/**
 * Main orchestrator function
 * Routes events to appropriate AI provider and agents
 */
export async function runAI(eventType: AIEventType, payload: any) {
  const provider = selectProvider(eventType);

  // Log event to database
  await logAIEvent(provider, eventType, payload);

  try {
    let result;

    switch (eventType) {
      case 'idea_submitted':
        result = await processIdeaSubmission(payload);
        break;

      case 'proposal_generated':
        result = await generateProposal(payload);
        break;

      case 'email_received':
        result = await processEmailIntelligence(payload);
        break;

      case 'content_requested':
        result = await generateContent(payload);
        break;

      case 'intelligence_analysis':
        result = await analyzeIntelligence(payload);
        break;

      default:
        result = {
          status: 'error',
          message: `Unknown event type: ${eventType}`,
        };
    }

    return {
      success: true,
      provider,
      eventType,
      result,
    };
  } catch (error) {
    console.error('AI Orchestrator error:', error);

    return {
      success: false,
      provider,
      eventType,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Process idea submission using Anthropic Extended Thinking
 */
async function processIdeaSubmission(payload: { ideaId: string; content: string }) {
  const message = await anthropic.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 4096,
    thinking: {
      type: 'enabled',
      budget_tokens: 5000,
    },
    messages: [
      {
        role: 'user',
        content: `Analyze this client idea submission and structure it:

Idea: ${payload.content}

Provide:
1. Core objective (what they want to achieve)
2. Suggested approach (technical implementation)
3. Estimated complexity (simple/medium/complex)
4. Key requirements extracted
5. Potential challenges

Format as structured JSON.`,
      },
    ],
  });

  return {
    status: 'processed',
    interpretation: message.content,
    thinkingTokens: message.usage.input_tokens,
  };
}

/**
 * Generate proposal using Anthropic
 */
async function generateProposal(payload: { ideaId: string; interpretation: any }) {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `Generate a detailed project proposal based on this analysis:

${JSON.stringify(payload.interpretation, null, 2)}

Include:
1. Scope of work (deliverables, features, timeline)
2. Pricing breakdown (development, design, testing, deployment)
3. Timeline (phases, milestones, estimated hours)
4. Technology stack recommendation
5. Success metrics

Format as structured JSON with these sections.`,
      },
    ],
  });

  return {
    status: 'generated',
    proposal: message.content,
  };
}

/**
 * Process email intelligence using Gemini 3
 */
async function processEmailIntelligence(payload: { emailId: string; body: string }) {
  const model = gemini.getGenerativeModel({ model: 'gemini-3-pro' });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze this email and extract intelligence:

Email: ${payload.body}

Extract:
1. Sender intent (inquiry, complaint, request, feedback)
2. Sentiment (positive, neutral, negative)
3. Action required (yes/no and what action)
4. Priority (high/medium/low)
5. Key entities mentioned (people, companies, products)

Format as JSON.`,
          },
        ],
      },
    ],
  });

  const response = await result.response;

  return {
    status: 'analyzed',
    intelligence: response.text(),
  };
}

/**
 * Generate content using OpenRouter (cost-optimized)
 */
async function generateContent(payload: { contentType: string; context: string }) {
  // Placeholder for OpenRouter implementation
  return {
    status: 'generated',
    content: 'OpenRouter implementation pending',
    provider: 'openrouter',
  };
}

/**
 * Analyze intelligence patterns using Gemini 3
 */
async function analyzeIntelligence(payload: { dataPoints: any[] }) {
  const model = gemini.getGenerativeModel({ model: 'gemini-3-pro' });

  const result = await model.generateContent({
    contents: [
      {
        role: 'user',
        parts: [
          {
            text: `Analyze these data points and identify patterns:

${JSON.stringify(payload.dataPoints, null, 2)}

Provide:
1. Key trends identified
2. Anomalies or outliers
3. Predictive insights
4. Recommended actions

Format as JSON.`,
          },
        ],
      },
    ],
  });

  const response = await result.response;

  return {
    status: 'analyzed',
    insights: response.text(),
  };
}

/**
 * Log AI event to database
 */
async function logAIEvent(agent: string, eventType: string, payload: any) {
  try {
    await supabaseStaff.from('ai_event_logs').insert({
      agent,
      event: {
        type: eventType,
        payload,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to log AI event:', error);
    // Don't throw - logging shouldn't break the flow
  }
}

/**
 * Get AI event logs (for monitoring/debugging)
 */
export async function getAIEventLogs(limit: number = 100) {
  const { data, error } = await supabaseStaff
    .from('ai_event_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Failed to fetch AI event logs:', error);
    return [];
  }

  return data;
}
