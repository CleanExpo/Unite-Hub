/**
 * M1 Multi-Model Orchestrator
 *
 * Integrates OpenAI Agents SDK with Claude for intelligent task delegation
 * and multi-model execution using appropriate models for different workloads
 *
 * Version: v1.0.0
 * Phase: 20 - OpenAI Agents SDK Integration
 */

import { Agent, run as runAgent } from '@openai/agents';
import { z } from 'zod';

export type ModelType = 'gpt-4o' | 'gpt-4o-mini' | 'claude-opus' | 'claude-sonnet' | 'claude-haiku';
export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'research_intensive';
export type HandoffReason = 'specialized_task' | 'better_model_needed' | 'token_efficiency' | 'reasoning_required';

/**
 * Task classification result
 */
export interface TaskClassification {
  complexity: TaskComplexity;
  suggestedModel: ModelType;
  reasoningRequired: boolean;
  estimatedTokens: number;
  handoffRecommended: boolean;
}

/**
 * Agent definition with capabilities
 */
export interface AgentDefinition {
  id: string;
  name: string;
  instructions: string;
  model: ModelType;
  tools: Map<string, (args: unknown) => Promise<unknown>>;
  capabilities: string[];
  costPerMTok?: number;
  speedRating?: number; // 1-10, 10 is fastest
}

/**
 * Execution context for agent run
 */
export interface ExecutionContext {
  taskId: string;
  goal: string;
  classification: TaskClassification;
  primaryAgent: AgentDefinition;
  handoffChain: AgentDefinition[];
  startTime: number;
  deadline?: number;
  costBudget?: number;
}

/**
 * Execution result
 */
export interface ExecutionResult {
  taskId: string;
  success: boolean;
  output: unknown;
  agentsUsed: string[];
  totalTokens: number;
  totalCost: number;
  totalDuration: number;
  handoffsOccurred: number;
  error?: string;
}

/**
 * Task classifier using heuristics
 */
export class TaskClassifier {
  /**
   * Classify task by analyzing goal and requirements
   */
  classifyTask(goal: string, context?: Record<string, unknown>): TaskClassification {
    const lowerGoal = goal.toLowerCase();

    // Calculate complexity score (0-100)
    let complexityScore = 0;

    // Length-based scoring
    complexityScore += Math.min(30, goal.length / 10);

    // Keyword-based scoring
    const complexKeywords = [
      'analyze',
      'optimize',
      'design',
      'architect',
      'research',
      'compare',
      'evaluate',
      'complex',
      'difficult',
    ];
    complexityScore += complexKeywords.filter((kw) => lowerGoal.includes(kw)).length * 5;

    const simpleKeywords = ['list', 'count', 'summarize', 'simple', 'quick', 'fetch'];
    complexityScore -= simpleKeywords.filter((kw) => lowerGoal.includes(kw)).length * 3;

    // Context-based scoring
    if (context?.research) {
      complexityScore += 20;
    }
    if (context?.requiresReasoning) {
      complexityScore += 15;
    }
    if (context?.timeConstraint === 'urgent') {
      complexityScore += 10;
    }

    // Classify based on score
    let complexity: TaskComplexity = 'simple';
    if (complexityScore > 70) {
      complexity = 'research_intensive';
    } else if (complexityScore > 50) {
      complexity = 'complex';
    } else if (complexityScore > 25) {
      complexity = 'moderate';
    }

    // Select model based on complexity
    const suggestedModel = this.selectModelForComplexity(complexity);

    // Estimate tokens (rough heuristic)
    const estimatedTokens = Math.ceil((goal.length / 4) * 1.3); // rough token estimate

    // Determine if reasoning is required
    const reasoningRequired = ['why', 'how', 'explain', 'analyze', 'research'].some((word) =>
      lowerGoal.includes(word)
    );

    return {
      complexity,
      suggestedModel,
      reasoningRequired,
      estimatedTokens,
      handoffRecommended: complexity === 'research_intensive' || reasoningRequired,
    };
  }

  /**
   * Select optimal model for complexity level
   */
  private selectModelForComplexity(complexity: TaskComplexity): ModelType {
    const modelMap: Record<TaskComplexity, ModelType> = {
      simple: 'gpt-4o-mini', // Fast, cheap for simple tasks
      moderate: 'gpt-4o', // Balanced for moderate tasks
      complex: 'claude-sonnet', // Strong reasoning
      research_intensive: 'claude-opus', // Best for deep analysis
    };

    return modelMap[complexity];
  }

  /**
   * Estimate token cost for task
   */
  estimateCost(classification: TaskClassification): number {
    const tokenCosts: Record<ModelType, { input: number; output: number }> = {
      'gpt-4o-mini': { input: 0.075 / 1000, output: 0.3 / 1000 },
      'gpt-4o': { input: 5 / 1000, output: 15 / 1000 },
      'claude-haiku': { input: 0.8 / 1000, output: 4 / 1000 },
      'claude-sonnet': { input: 3 / 1000, output: 15 / 1000 },
      'claude-opus': { input: 15 / 1000, output: 75 / 1000 },
    };

    const costs = tokenCosts[classification.suggestedModel];
    const estimatedOutput = classification.estimatedTokens * 2; // rough estimate

    return classification.estimatedTokens * costs.input + estimatedOutput * costs.output;
  }
}

/**
 * Multi-Model Agent Orchestrator
 */
export class MultiModelOrchestrator {
  private agents: Map<string, AgentDefinition> = new Map();
  private classifier: TaskClassifier;
  private executionHistory: ExecutionResult[] = [];
  private performanceMetrics: Map<string, unknown> = new Map();

  constructor() {
    this.classifier = new TaskClassifier();
    this.initializeDefaultAgents();
  }

  /**
   * Initialize default agents with Claude and OpenAI models
   */
  private initializeDefaultAgents(): void {
    // Ultra-fast agent for simple tasks
    this.registerAgent({
      id: 'gpt-4o-mini-agent',
      name: 'GPT-4o Mini Agent',
      instructions: 'You are a fast, efficient assistant optimized for quick, accurate responses.',
      model: 'gpt-4o-mini',
      tools: new Map(),
      capabilities: ['quick_response', 'simple_tasks', 'formatting'],
      costPerMTok: 0.075,
      speedRating: 9,
    });

    // Balanced agent for general work
    this.registerAgent({
      id: 'gpt-4o-agent',
      name: 'GPT-4o Agent',
      instructions: 'You are a balanced, versatile assistant capable of complex reasoning and task execution.',
      model: 'gpt-4o',
      tools: new Map(),
      capabilities: ['reasoning', 'analysis', 'coding', 'general_tasks'],
      costPerMTok: 5,
      speedRating: 7,
    });

    // Research specialist using Claude Sonnet
    this.registerAgent({
      id: 'claude-sonnet-agent',
      name: 'Claude Sonnet Research Specialist',
      instructions:
        'You are a research-focused assistant excellent at deep analysis, synthesis, and complex reasoning tasks.',
      model: 'claude-sonnet',
      tools: new Map(),
      capabilities: ['research', 'analysis', 'synthesis', 'complex_reasoning'],
      costPerMTok: 3,
      speedRating: 6,
    });

    // Expert researcher using Claude Opus
    this.registerAgent({
      id: 'claude-opus-agent',
      name: 'Claude Opus Expert Researcher',
      instructions:
        'You are an elite research expert capable of the most complex analysis, cross-domain synthesis, and novel insights.',
      model: 'claude-opus',
      tools: new Map(),
      capabilities: ['expert_research', 'complex_synthesis', 'novel_insights', 'strategic_analysis'],
      costPerMTok: 15,
      speedRating: 5,
    });

    // Speed specialist using Claude Haiku
    this.registerAgent({
      id: 'claude-haiku-agent',
      name: 'Claude Haiku Speed Agent',
      instructions: 'You are an ultra-fast assistant optimized for speed and efficiency in simple tasks.',
      model: 'claude-haiku',
      tools: new Map(),
      capabilities: ['speed', 'simple_tasks', 'formatting', 'quick_response'],
      costPerMTok: 0.8,
      speedRating: 10,
    });
  }

  /**
   * Register custom agent
   */
  registerAgent(definition: AgentDefinition): void {
    this.agents.set(definition.id, definition);
  }

  /**
   * Execute task with intelligent agent selection and handoff management
   */
  async executeTask(goal: string, context?: Record<string, unknown>): Promise<ExecutionResult> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const startTime = Date.now();

    try {
      // Classify the task
      const classification = this.classifier.classifyTask(goal, context);

      // Select primary agent based on classification
      const primaryAgent = this.selectAgent(classification);

      // Create execution context
      const execContext: ExecutionContext = {
        taskId,
        goal,
        classification,
        primaryAgent,
        handoffChain: [primaryAgent],
        startTime,
        deadline: context?.deadline as number | undefined,
        costBudget: context?.costBudget as number | undefined,
      };

      // Execute with primary agent
      let output: unknown;
      let tokensUsed = 0;

      try {
        // Create OpenAI agent
        const agent = new Agent({
          name: primaryAgent.name,
          instructions: primaryAgent.instructions,
          model: primaryAgent.model,
        });

        // Execute agent
        const result = await runAgent(agent, goal);

        output = result.finalOutput;
        tokensUsed = result.tokenUsage?.totalTokens || classification.estimatedTokens;

        // Check if handoff is needed
        if (classification.handoffRecommended && !output) {
          // Perform handoff to more capable agent
          const handoffAgent = this.selectHandoffAgent(primaryAgent);
          execContext.handoffChain.push(handoffAgent);

          const handoffAgentSdk = new Agent({
            name: handoffAgent.name,
            instructions: handoffAgent.instructions,
            model: handoffAgent.model,
          });

          const handoffResult = await runAgent(handoffAgentSdk, goal);
          output = handoffResult.finalOutput;
          tokensUsed += handoffResult.tokenUsage?.totalTokens || 0;
        }
      } catch (error) {
        throw error;
      }

      // Calculate costs
      const costs = this.calculateExecutionCost(execContext, tokensUsed);

      // Record execution
      const executionResult: ExecutionResult = {
        taskId,
        success: true,
        output,
        agentsUsed: execContext.handoffChain.map((a) => a.id),
        totalTokens: tokensUsed,
        totalCost: costs,
        totalDuration: Date.now() - startTime,
        handoffsOccurred: execContext.handoffChain.length - 1,
      };

      this.executionHistory.push(executionResult);
      this.recordMetrics(executionResult);

      return executionResult;
    } catch (error) {
      const executionResult: ExecutionResult = {
        taskId,
        success: false,
        output: null,
        agentsUsed: [],
        totalTokens: 0,
        totalCost: 0,
        totalDuration: Date.now() - startTime,
        handoffsOccurred: 0,
        error: error instanceof Error ? error.message : String(error),
      };

      this.executionHistory.push(executionResult);

      return executionResult;
    }
  }

  /**
   * Select appropriate agent for task classification
   */
  private selectAgent(classification: TaskClassification): AgentDefinition {
    const agentMap: Record<ModelType, string> = {
      'gpt-4o-mini': 'gpt-4o-mini-agent',
      'gpt-4o': 'gpt-4o-agent',
      'claude-sonnet': 'claude-sonnet-agent',
      'claude-opus': 'claude-opus-agent',
      'claude-haiku': 'claude-haiku-agent',
    };

    const agentId = agentMap[classification.suggestedModel];
    const agent = this.agents.get(agentId);

    if (!agent) {
      throw new Error(`Agent not found for model ${classification.suggestedModel}`);
    }

    return agent;
  }

  /**
   * Select handoff agent (more capable than primary)
   */
  private selectHandoffAgent(primaryAgent: AgentDefinition): AgentDefinition {
    const capabilityHierarchy = [
      'claude-haiku-agent',
      'gpt-4o-mini-agent',
      'gpt-4o-agent',
      'claude-sonnet-agent',
      'claude-opus-agent',
    ];

    const currentIndex = capabilityHierarchy.indexOf(primaryAgent.id);
    const nextIndex = Math.min(currentIndex + 1, capabilityHierarchy.length - 1);
    const nextAgentId = capabilityHierarchy[nextIndex];

    const agent = this.agents.get(nextAgentId);
    if (!agent) {
      return primaryAgent;
    }

    return agent;
  }

  /**
   * Calculate execution cost
   */
  private calculateExecutionCost(context: ExecutionContext, tokensUsed: number): number {
    let totalCost = 0;

    for (const agent of context.handoffChain) {
      const cost = agent.costPerMTok || 0;
      totalCost += (tokensUsed / 1000) * cost;
    }

    return totalCost;
  }

  /**
   * Record performance metrics
   */
  private recordMetrics(result: ExecutionResult): void {
    const metrics = {
      executionTime: result.totalDuration,
      costPerToken: result.totalCost / result.totalTokens,
      efficiency: (1000 * result.totalTokens) / result.totalDuration, // tokens per second
      success: result.success ? 1 : 0,
    };

    const key = `metrics_${result.taskId}`;
    this.performanceMetrics.set(key, metrics);
  }

  /**
   * Get execution history
   */
  getExecutionHistory(limit?: number): ExecutionResult[] {
    if (limit) {
      return this.executionHistory.slice(-limit);
    }
    return this.executionHistory;
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(): Record<string, unknown> {
    const successfulRuns = this.executionHistory.filter((r) => r.success);
    const failedRuns = this.executionHistory.filter((r) => !r.success);

    const avgCost = successfulRuns.length > 0 ? successfulRuns.reduce((sum, r) => sum + r.totalCost, 0) / successfulRuns.length : 0;

    const avgDuration = successfulRuns.length > 0 ? successfulRuns.reduce((sum, r) => sum + r.totalDuration, 0) / successfulRuns.length : 0;

    const totalHandoffs = this.executionHistory.reduce((sum, r) => sum + r.handoffsOccurred, 0);

    return {
      totalExecutions: this.executionHistory.length,
      successfulRuns: successfulRuns.length,
      failedRuns: failedRuns.length,
      successRate: this.executionHistory.length > 0 ? (successfulRuns.length / this.executionHistory.length) * 100 : 0,
      averageCost: avgCost,
      averageDuration: avgDuration,
      totalCostSpent: successfulRuns.reduce((sum, r) => sum + r.totalCost, 0),
      totalTokensUsed: successfulRuns.reduce((sum, r) => sum + r.totalTokens, 0),
      totalHandoffs,
      agentDistribution: this.getAgentDistribution(),
    };
  }

  /**
   * Get distribution of agents used
   */
  private getAgentDistribution(): Record<string, number> {
    const distribution: Record<string, number> = {};

    for (const result of this.executionHistory) {
      for (const agentId of result.agentsUsed) {
        distribution[agentId] = (distribution[agentId] || 0) + 1;
      }
    }

    return distribution;
  }

  /**
   * Shutdown orchestrator
   */
  shutdown(): void {
    this.agents.clear();
    this.executionHistory = [];
    this.performanceMetrics.clear();
  }
}

// Export singleton
export const multiModelOrchestrator = new MultiModelOrchestrator();
