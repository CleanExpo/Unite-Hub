/**
 * Phill AI Task Router
 * Intelligent routing of tasks to appropriate personas and tiers
 */

import { PhillAIClient, LLM_MODELS, Tier, ChatMessage } from './llm-client';
import { PERSONAS, PersonaRole, getPersona, getEscalationChain } from './personas';

export type TaskCategory =
  | 'technical'
  | 'visual'
  | 'ux'
  | 'marketing'
  | 'brand'
  | 'quality'
  | 'security'
  | 'general';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Task {
  id: string;
  title: string;
  description: string;
  category?: TaskCategory;
  priority?: TaskPriority;
  clientId?: string;
  projectId?: string;
  context?: Record<string, unknown>;
  requiresApproval?: boolean;
  createdAt: Date;
}

export interface RoutingDecision {
  task: Task;
  persona: PersonaRole;
  tier: Tier;
  reasoning: string;
  estimatedCost: number;
  shouldEscalate: boolean;
  escalationReason?: string;
}

export interface TaskResult {
  task: Task;
  persona: PersonaRole;
  tier: Tier;
  output: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    estimatedCost: number;
  };
  executionTime: number;
  escalated: boolean;
  approvalRequired: boolean;
}

/**
 * Keyword patterns for task classification
 */
const CATEGORY_PATTERNS: Record<TaskCategory, RegExp[]> = {
  technical: [
    /\b(api|endpoint|database|schema|code|typescript|react|component|bug|error|fix|implement|refactor|performance|security|auth|migration)\b/i,
  ],
  visual: [
    /\b(visual|design|aesthetic|color|palette|mood|creative|imagery|photo|video|animation|motion|style|look|feel|branding)\b/i,
  ],
  ux: [
    /\b(ux|ui|user experience|interface|wireframe|prototype|flow|journey|usability|interaction|accessibility|responsive)\b/i,
  ],
  marketing: [
    /\b(marketing|campaign|seo|content|social|email|newsletter|analytics|conversion|growth|leads|funnel|traffic)\b/i,
  ],
  brand: [
    /\b(brand|messaging|voice|tone|positioning|values|identity|guidelines|consistency|perception)\b/i,
  ],
  quality: [
    /\b(test|qa|quality|bug|issue|regression|performance|audit|review|check|validate|verify)\b/i,
  ],
  security: [
    /\b(security|vulnerability|attack|injection|xss|csrf|auth|permission|access|encryption|audit)\b/i,
  ],
  general: [],
};

/**
 * Category to persona mapping
 */
const CATEGORY_PERSONA_MAP: Record<TaskCategory, PersonaRole> = {
  technical: 'phill-dev',
  visual: 'phill-vision',
  ux: 'phill-design',
  marketing: 'phill-marketing',
  brand: 'phill-brand',
  quality: 'phill-qa',
  security: 'phill-dev', // Security goes to dev with escalation
  general: 'phill-dev', // Default to dev
};

/**
 * Priority to tier mapping
 */
const PRIORITY_TIER_MAP: Record<TaskPriority, Tier> = {
  low: 'tier1',
  medium: 'tier1',
  high: 'tier2',
  critical: 'tier3',
};

/**
 * Task Router - Routes tasks to appropriate personas and tiers
 */
export class TaskRouter {
  private client: PhillAIClient;

  constructor(client?: PhillAIClient) {
    this.client = client || new PhillAIClient();
  }

  /**
   * Classify task category based on content
   */
  classifyCategory(task: Task): TaskCategory {
    if (task.category) return task.category;

    const text = `${task.title} ${task.description}`.toLowerCase();

    // Check each category's patterns
    for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
      if (category === 'general') continue;
      for (const pattern of patterns) {
        if (pattern.test(text)) {
          return category as TaskCategory;
        }
      }
    }

    return 'general';
  }

  /**
   * Determine task priority based on content and context
   */
  determinePriority(task: Task): TaskPriority {
    if (task.priority) return task.priority;

    const text = `${task.title} ${task.description}`.toLowerCase();

    // Critical indicators
    if (
      /\b(urgent|critical|emergency|asap|immediately|production down|security breach)\b/i.test(
        text
      )
    ) {
      return 'critical';
    }

    // High priority indicators
    if (/\b(important|priority|deadline|client|launch|release|security)\b/i.test(text)) {
      return 'high';
    }

    // Low priority indicators
    if (/\b(when you can|no rush|nice to have|future|backlog|minor)\b/i.test(text)) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Route task to appropriate persona and tier
   */
  async routeTask(task: Task): Promise<RoutingDecision> {
    const category = this.classifyCategory(task);
    const priority = this.determinePriority(task);
    const persona = CATEGORY_PERSONA_MAP[category];

    // Determine tier based on priority and category
    let tier = PRIORITY_TIER_MAP[priority];

    // Security tasks always escalate to at least tier2
    if (category === 'security' && tier === 'tier1') {
      tier = 'tier2';
    }

    // Brand-critical tasks go to tier2 minimum
    if (category === 'brand' && tier === 'tier1') {
      tier = 'tier2';
    }

    // Estimate cost
    const estimatedCost = this.estimateCost(tier, task.description.length);

    // Determine if escalation is needed
    const shouldEscalate =
      priority === 'critical' || (category === 'security' && priority === 'high');

    return {
      task: {
        ...task,
        category,
        priority,
      },
      persona,
      tier,
      reasoning: this.buildReasoningExplanation(category, priority, persona, tier),
      estimatedCost,
      shouldEscalate,
      escalationReason: shouldEscalate
        ? `${priority} priority ${category} task requires senior review`
        : undefined,
    };
  }

  /**
   * Execute task with appropriate persona
   */
  async executeTask(decision: RoutingDecision): Promise<TaskResult> {
    const startTime = Date.now();
    const persona = getPersona(decision.persona);

    const messages: ChatMessage[] = [
      { role: 'system', content: persona.systemPrompt },
      {
        role: 'user',
        content: this.buildTaskPrompt(decision.task),
      },
    ];

    const response = await this.client.chat(messages, {
      tier: decision.tier,
    });

    const executionTime = Date.now() - startTime;

    return {
      task: decision.task,
      persona: decision.persona,
      tier: decision.tier,
      output: response.content,
      usage: response.usage,
      executionTime,
      escalated: decision.shouldEscalate,
      approvalRequired: decision.task.requiresApproval || decision.tier === 'tier3',
    };
  }

  /**
   * Route and execute task in one call
   */
  async processTask(task: Task): Promise<TaskResult> {
    const decision = await this.routeTask(task);
    return this.executeTask(decision);
  }

  /**
   * Escalate task to higher tier/persona
   */
  async escalateTask(result: TaskResult, reason: string): Promise<TaskResult> {
    const escalationChain = getEscalationChain(result.persona);

    // Move to next persona in chain
    const currentIndex = escalationChain.indexOf(result.persona);
    const nextPersona =
      currentIndex < escalationChain.length - 1
        ? escalationChain[currentIndex + 1]
        : result.persona;

    // Upgrade tier
    const nextTier: Tier =
      result.tier === 'tier1' ? 'tier2' : result.tier === 'tier2' ? 'tier3' : 'tier3';

    const newDecision: RoutingDecision = {
      task: result.task,
      persona: nextPersona,
      tier: nextTier,
      reasoning: `Escalated from ${result.persona} to ${nextPersona}: ${reason}`,
      estimatedCost: this.estimateCost(nextTier, result.task.description.length),
      shouldEscalate: false,
      escalationReason: reason,
    };

    const escalatedResult = await this.executeTask(newDecision);
    return {
      ...escalatedResult,
      escalated: true,
    };
  }

  /**
   * Multi-persona collaboration for complex tasks
   */
  async collaborativeTask(
    task: Task,
    personas: PersonaRole[]
  ): Promise<Record<PersonaRole, TaskResult>> {
    const results: Record<PersonaRole, TaskResult> = {} as Record<PersonaRole, TaskResult>;

    for (const personaRole of personas) {
      const persona = getPersona(personaRole);
      const decision: RoutingDecision = {
        task,
        persona: personaRole,
        tier: persona.defaultTier,
        reasoning: `Collaborative task - ${persona.title} perspective`,
        estimatedCost: this.estimateCost(persona.defaultTier, task.description.length),
        shouldEscalate: false,
      };

      results[personaRole] = await this.executeTask(decision);
    }

    return results;
  }

  /**
   * Build task prompt from task object
   */
  private buildTaskPrompt(task: Task): string {
    let prompt = `# Task: ${task.title}\n\n`;
    prompt += `## Description\n${task.description}\n\n`;

    if (task.priority) {
      prompt += `## Priority: ${task.priority.toUpperCase()}\n\n`;
    }

    if (task.context && Object.keys(task.context).length > 0) {
      prompt += `## Context\n${JSON.stringify(task.context, null, 2)}\n\n`;
    }

    prompt += `## Instructions\nProvide a complete, detailed specification following your output format. Be specific enough that a junior team member could execute without asking questions.`;

    return prompt;
  }

  /**
   * Build reasoning explanation for routing decision
   */
  private buildReasoningExplanation(
    category: TaskCategory,
    priority: TaskPriority,
    persona: PersonaRole,
    tier: Tier
  ): string {
    const personaInfo = getPersona(persona);
    return `Task classified as "${category}" with "${priority}" priority. Routed to ${personaInfo.name} (${personaInfo.title}) using ${tier} for ${this.getTierDescription(tier)}.`;
  }

  /**
   * Get tier description
   */
  private getTierDescription(tier: Tier): string {
    switch (tier) {
      case 'tier1':
        return 'cost-effective processing (FREE models)';
      case 'tier2':
        return 'refined output quality';
      case 'tier3':
        return 'premium quality with final approval authority';
    }
  }

  /**
   * Estimate cost based on tier and content length
   */
  private estimateCost(tier: Tier, contentLength: number): number {
    const estimatedTokens = Math.ceil(contentLength / 4) + 2000; // Rough estimate

    switch (tier) {
      case 'tier1':
        return 0; // FREE tier
      case 'tier2':
        // DeepSeek V3.1 paid: $0.216/MTok input, $0.80/MTok output
        return (estimatedTokens / 1000000) * 0.216 + (estimatedTokens / 1000000) * 0.8;
      case 'tier3':
        // Claude Opus 4.5: $5/MTok input, $25/MTok output
        return (estimatedTokens / 1000000) * 5 + (estimatedTokens / 1000000) * 25;
    }
  }
}

/**
 * Singleton router instance
 */
let routerInstance: TaskRouter | null = null;

export function getTaskRouter(): TaskRouter {
  if (!routerInstance) {
    routerInstance = new TaskRouter();
  }
  return routerInstance;
}

export default TaskRouter;
