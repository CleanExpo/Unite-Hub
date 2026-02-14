/**
 * Workforce AI Caller — Skill-Aware AI Service Bridge
 *
 * Wraps the enhanced-service-caller with workforce context:
 * - Injects loaded skill content into system prompts
 * - Prepends agent memory for continuity
 * - Enforces token budgets from Agent Card boundaries
 * - Tracks usage per agent for cost accounting
 *
 * Usage:
 *   const caller = new WorkforceAICaller('email-agent', 'workspace-123');
 *   const result = await caller.call({
 *     objective: 'Extract sender data from email',
 *     userMessage: emailContent,
 *   });
 *
 * @module lib/agents/workforce/ai-caller
 */

import {
  callAIService,
  type AIModel,
  type AIServiceResult,
} from '../../ai/enhanced-service-caller';
import { skillLoader } from './skill-loader';
import { memoryManager } from './memory';
import { lifecycleManager } from './agent-lifecycle';
import { agentEventLogger } from '../protocol/events';
import { getAgentCard, type UnifiedAgentId } from '../unified-registry';
import type { LoadedSkill } from './types';

// ============================================================================
// Types
// ============================================================================

/**
 * Request to the Workforce AI Caller.
 */
export interface WorkforceAIRequest {
  /** The task/objective for this AI call */
  objective: string;
  /** User-facing message content */
  userMessage: string;
  /** Override model selection (default: inferred from Agent Card) */
  model?: AIModel;
  /** Maximum tokens to generate */
  maxTokens?: number;
  /** Use Extended Thinking (Opus only) */
  thinking?: boolean;
  /** Thinking token budget */
  thinkingBudget?: number;
  /** Enable prompt caching */
  caching?: boolean;
  /** Additional system prompt to prepend */
  additionalSystemPrompt?: string;
  /** Correlation ID for tracing */
  correlationId?: string;
  /** Skip skill injection (for simple calls) */
  skipSkills?: boolean;
  /** Skip memory injection */
  skipMemory?: boolean;
}

/**
 * Extended result from a workforce AI call.
 */
export interface WorkforceAIResult extends AIServiceResult {
  /** Agent that made the call */
  agentId: string;
  /** Skills injected into context */
  skillsInjected: string[];
  /** Memory entries injected */
  memoryEntriesInjected: number;
  /** Token budget used by skills + memory */
  contextTokensUsed: number;
}

// ============================================================================
// Agent model tier mapping
// ============================================================================

function modelTierToAIModel(tier: string): AIModel {
  switch (tier) {
    case 'opus':
      return 'opus';
    case 'sonnet':
      return 'sonnet';
    case 'haiku':
      return 'haiku';
    default:
      return 'sonnet';
  }
}

// ============================================================================
// Workforce AI Caller
// ============================================================================

export class WorkforceAICaller {
  private readonly agentId: string;
  private readonly workspaceId: string;
  private cumulativeTokens = 0;

  constructor(agentId: string, workspaceId: string) {
    this.agentId = agentId;
    this.workspaceId = workspaceId;
  }

  /**
   * Make an AI call with full workforce context (skills + memory + permissions).
   */
  async call(request: WorkforceAIRequest): Promise<WorkforceAIResult> {
    const startTime = Date.now();
    const correlationId = request.correlationId || `wf-ai-${Date.now()}`;

    // 1. Resolve model from Agent Card if not specified
    let model = request.model;
    if (!model) {
      try {
        const card = getAgentCard(this.agentId as UnifiedAgentId);
        model = modelTierToAIModel(card.modelTier);
      } catch {
        model = 'sonnet';
      }
    }

    // Force opus for Extended Thinking
    if (request.thinking) {
      model = 'opus';
    }

    // 2. Check token budget from Agent Card boundaries
    let maxTokens = request.maxTokens || 2048;
    try {
      const card = getAgentCard(this.agentId as UnifiedAgentId);
      if (card.boundaries.maxTokensPerRequest > 0) {
        maxTokens = Math.min(maxTokens, card.boundaries.maxTokensPerRequest);
      }
    } catch {
      // Use default
    }

    // 3. Build system prompt with skills + memory
    const systemParts: string[] = [];
    const skillsInjected: string[] = [];
    let contextTokensUsed = 0;

    // Add agent role header
    try {
      const card = getAgentCard(this.agentId as UnifiedAgentId);
      systemParts.push(
        `You are ${card.name}, a ${card.role} agent.`,
        `Capabilities: ${card.capabilities.map((c) => c.name).join(', ')}.`
      );
    } catch {
      systemParts.push(`You are the ${this.agentId} agent.`);
    }

    // Add additional system prompt
    if (request.additionalSystemPrompt) {
      systemParts.push(request.additionalSystemPrompt);
    }

    // 4. Inject skills
    if (!request.skipSkills) {
      try {
        const agentSkills = await skillLoader.loadForAgent(this.agentId);
        const taskSkills = await skillLoader.matchSkillsForTask(request.objective);
        const allSkills = [...agentSkills, ...taskSkills];
        const uniqueSkills = allSkills.filter(
          (s, i, arr) => arr.findIndex((x) => x.manifest.name === s.manifest.name) === i
        );

        // Add skill content within budget
        const skillBudget = 4000; // ~4000 tokens for skills
        let skillTokensUsed = 0;

        for (const skill of uniqueSkills) {
          if (skillTokensUsed + skill.tokenCount > skillBudget) break;
          systemParts.push(
            `\n--- Skill: ${skill.manifest.name} ---`,
            skill.content.slice(0, 2000)
          );
          skillsInjected.push(skill.manifest.name);
          skillTokensUsed += skill.tokenCount;
        }

        contextTokensUsed += skillTokensUsed;
      } catch {
        // Skill loading is best-effort
      }
    }

    // 5. Inject memory
    let memoryEntriesInjected = 0;
    if (!request.skipMemory) {
      try {
        const memoryContext = await memoryManager.getAgentContext(
          this.agentId,
          this.workspaceId,
          { maxTokens: 1500, minImportance: 40 }
        );

        if (memoryContext.length > 0) {
          systemParts.push('\n--- Agent Memory ---', ...memoryContext);
          memoryEntriesInjected = memoryContext.length;
          contextTokensUsed += memoryContext.join('\n').length / 4;
        }
      } catch {
        // Memory loading is best-effort
      }
    }

    const systemPrompt = systemParts.join('\n');

    // 6. Call AI service
    const aiResult = await callAIService({
      model,
      systemPrompt,
      userMessage: request.userMessage,
      maxTokens,
      options: {
        thinking: request.thinking || false,
        thinkingBudget: request.thinkingBudget || 10000,
        caching: request.caching !== false, // Cache by default
      },
    });

    // 7. Track cumulative tokens
    this.cumulativeTokens += aiResult.usage.inputTokens + aiResult.usage.outputTokens;

    // 8. Log the AI call event
    agentEventLogger.logEvent({
      eventType: 'task.completed',
      agentId: this.agentId,
      workspaceId: this.workspaceId,
      severity: 'info',
      correlationId,
      payload: {
        type: 'ai_call',
        model: aiResult.model,
        inputTokens: aiResult.usage.inputTokens,
        outputTokens: aiResult.usage.outputTokens,
        cacheReadTokens: aiResult.usage.cacheReadTokens,
        thinkingTokens: aiResult.usage.thinkingTokens,
        estimatedCost: aiResult.estimatedCost,
        skillsInjected,
        memoryEntriesInjected,
        totalTime: Date.now() - startTime,
      },
    });

    return {
      ...aiResult,
      agentId: this.agentId,
      skillsInjected,
      memoryEntriesInjected,
      contextTokensUsed: Math.ceil(contextTokensUsed),
    };
  }

  /**
   * Quick call without Extended Thinking.
   */
  async quick(
    objective: string,
    userMessage: string,
    model?: AIModel
  ): Promise<string> {
    const result = await this.call({
      objective,
      userMessage,
      model: model || 'sonnet',
      thinking: false,
      skipSkills: false,
      skipMemory: false,
    });
    return result.content;
  }

  /**
   * Deep analysis with Extended Thinking.
   */
  async think(
    objective: string,
    userMessage: string,
    thinkingBudget?: number
  ): Promise<{ content: string; thinking?: string }> {
    const result = await this.call({
      objective,
      userMessage,
      model: 'opus',
      thinking: true,
      thinkingBudget: thinkingBudget || 10000,
    });
    return { content: result.content, thinking: result.thinking };
  }

  /**
   * Get cumulative token usage for this caller instance.
   */
  get totalTokensUsed(): number {
    return this.cumulativeTokens;
  }
}

/**
 * Factory: create a workforce AI caller for an agent.
 */
export function createWorkforceAICaller(
  agentId: string,
  workspaceId: string
): WorkforceAICaller {
  return new WorkforceAICaller(agentId, workspaceId);
}
