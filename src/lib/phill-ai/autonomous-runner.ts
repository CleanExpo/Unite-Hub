/**
 * Phill AI Autonomous Runner
 * Daily planning and autonomous task execution
 */

import { TaskRouter, TaskResult } from './task-router';
import { TaskGenerator, BusinessContext, GeneratedTask } from './task-generator';
import { PhillAIClient, ChatMessage } from './llm-client';
import { getAllPersonas, PersonaRole } from './personas';

export interface DailyPlan {
  id: string;
  date: Date;
  generatedAt: Date;
  tasks: GeneratedTask[];
  summary: string;
  estimatedHours: number;
  priorityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  personaWorkload: Record<PersonaRole, number>;
  executionStatus: 'pending' | 'in_progress' | 'completed' | 'partial';
}

export interface ExecutionReport {
  planId: string;
  startTime: Date;
  endTime: Date;
  results: TaskResult[];
  successCount: number;
  failureCount: number;
  totalCost: number;
  totalTokens: number;
  summary: string;
}

export interface RunnerConfig {
  maxConcurrentTasks: number;
  maxDailyCost: number; // USD limit
  autoApprove: boolean;
  notifyOnComplete: boolean;
  skipWeekends: boolean;
  workingHours: {
    start: number; // Hour in UTC
    end: number;
  };
}

const DEFAULT_CONFIG: RunnerConfig = {
  maxConcurrentTasks: 3,
  maxDailyCost: 5.0, // $5/day limit
  autoApprove: false,
  notifyOnComplete: true,
  skipWeekends: true,
  workingHours: {
    start: 8, // 8 AM
    end: 18, // 6 PM
  },
};

/**
 * Autonomous Runner - Orchestrates daily planning and execution
 */
export class AutonomousRunner {
  private client: PhillAIClient;
  private router: TaskRouter;
  private generator: TaskGenerator;
  private config: RunnerConfig;
  private currentPlan: DailyPlan | null = null;
  private isRunning: boolean = false;
  private dailyCost: number = 0;

  constructor(config: Partial<RunnerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = new PhillAIClient();
    this.router = new TaskRouter(this.client);
    this.generator = new TaskGenerator(this.client);
  }

  /**
   * Generate daily plan from business context
   */
  async generateDailyPlan(context: BusinessContext): Promise<DailyPlan> {
    const tasks = await this.generator.fullAutonomousScan(context);

    const priorityBreakdown = {
      critical: tasks.filter((t) => t.priority === 'critical').length,
      high: tasks.filter((t) => t.priority === 'high').length,
      medium: tasks.filter((t) => t.priority === 'medium').length,
      low: tasks.filter((t) => t.priority === 'low').length,
    };

    // Calculate workload per persona
    const personaWorkload: Record<PersonaRole, number> = {
      'phill-dev': 0,
      'phill-vision': 0,
      'phill-design': 0,
      'phill-marketing': 0,
      'phill-brand': 0,
      'phill-qa': 0,
    };

    for (const task of tasks) {
      const decision = await this.router.routeTask(task);
      personaWorkload[decision.persona] += task.estimatedHours || 1;
    }

    const estimatedHours = tasks.reduce((sum, t) => sum + (t.estimatedHours || 1), 0);

    const summary = await this.generatePlanSummary(tasks, priorityBreakdown, estimatedHours);

    this.currentPlan = {
      id: `plan-${Date.now()}`,
      date: new Date(),
      generatedAt: new Date(),
      tasks,
      summary,
      estimatedHours,
      priorityBreakdown,
      personaWorkload,
      executionStatus: 'pending',
    };

    return this.currentPlan;
  }

  /**
   * Execute the current daily plan
   */
  async executePlan(plan?: DailyPlan): Promise<ExecutionReport> {
    const targetPlan = plan || this.currentPlan;

    if (!targetPlan) {
      throw new Error('No plan to execute. Generate a plan first.');
    }

    if (this.isRunning) {
      throw new Error('Runner is already executing a plan.');
    }

    this.isRunning = true;
    targetPlan.executionStatus = 'in_progress';

    const startTime = new Date();
    const results: TaskResult[] = [];
    let successCount = 0;
    let failureCount = 0;

    try {
      // Process tasks in priority order
      const sortedTasks = this.sortTasksByPriority(targetPlan.tasks);

      for (const task of sortedTasks) {
        // Check daily cost limit
        if (this.dailyCost >= this.config.maxDailyCost) {
          console.log(`Daily cost limit reached: $${this.dailyCost.toFixed(2)}`);
          break;
        }

        // Check working hours
        if (!this.isWithinWorkingHours()) {
          console.log('Outside working hours, pausing execution');
          break;
        }

        try {
          const result = await this.router.processTask(task);
          results.push(result);

          this.dailyCost += result.usage.estimatedCost;

          if (result.approvalRequired && !this.config.autoApprove) {
            console.log(`Task ${task.id} requires approval: ${task.title}`);
            // In production, this would trigger a notification
          }

          successCount++;
        } catch (error) {
          console.error(`Failed to execute task ${task.id}:`, error);
          failureCount++;
        }
      }

      targetPlan.executionStatus =
        failureCount === 0 && successCount === sortedTasks.length ? 'completed' : 'partial';
    } finally {
      this.isRunning = false;
    }

    const endTime = new Date();

    const report: ExecutionReport = {
      planId: targetPlan.id,
      startTime,
      endTime,
      results,
      successCount,
      failureCount,
      totalCost: results.reduce((sum, r) => sum + r.usage.estimatedCost, 0),
      totalTokens: results.reduce((sum, r) => sum + r.usage.totalTokens, 0),
      summary: await this.generateExecutionSummary(results, successCount, failureCount),
    };

    return report;
  }

  /**
   * Execute a single task immediately
   */
  async executeImmediately(task: GeneratedTask): Promise<TaskResult> {
    return this.router.processTask(task);
  }

  /**
   * Escalate a task result to higher tier
   */
  async escalate(result: TaskResult, reason: string): Promise<TaskResult> {
    return this.router.escalateTask(result, reason);
  }

  /**
   * Get collaboration from multiple personas
   */
  async getCollaborativeOutput(
    task: GeneratedTask,
    personas: PersonaRole[]
  ): Promise<Record<PersonaRole, TaskResult>> {
    return this.router.collaborativeTask(task, personas);
  }

  /**
   * Morning briefing - summary of what needs attention
   */
  async getMorningBriefing(context: BusinessContext): Promise<string> {
    const plan = await this.generateDailyPlan(context);

    const briefing = `
# Good Morning, Phill! ☀️

## Today's Snapshot
- **${plan.tasks.length} tasks** identified
- **${plan.estimatedHours} hours** estimated work
- **${plan.priorityBreakdown.critical} critical**, ${plan.priorityBreakdown.high} high priority

## Top 3 Priorities
${plan.tasks
  .slice(0, 3)
  .map((t, i) => `${i + 1}. **${t.title}** (${t.priority}) - ${t.description.slice(0, 100)}...`)
  .join('\n')}

## Team Workload
${Object.entries(plan.personaWorkload)
  .filter(([_, hours]) => hours > 0)
  .map(([persona, hours]) => `- ${persona}: ${hours}h`)
  .join('\n')}

## Summary
${plan.summary}

---
*Generated at ${new Date().toLocaleTimeString()}*
    `.trim();

    return briefing;
  }

  /**
   * Evening recap - what was accomplished
   */
  async getEveningRecap(report: ExecutionReport): Promise<string> {
    const recap = `
# Evening Recap 🌙

## Execution Summary
- **${report.successCount}** tasks completed
- **${report.failureCount}** tasks failed
- **$${report.totalCost.toFixed(4)}** spent
- **${report.totalTokens.toLocaleString()}** tokens used

## Duration
Started: ${report.startTime.toLocaleTimeString()}
Ended: ${report.endTime.toLocaleTimeString()}
Total: ${Math.round((report.endTime.getTime() - report.startTime.getTime()) / 60000)} minutes

## Outputs Generated
${report.results
  .map((r) => `- **${r.task.title}** (${r.persona}, ${r.tier}) - ${r.executionTime}ms`)
  .join('\n')}

## Summary
${report.summary}

---
*Good night, Phill! 🌟*
    `.trim();

    return recap;
  }

  /**
   * Get current status
   */
  getStatus(): {
    isRunning: boolean;
    currentPlan: DailyPlan | null;
    dailyCost: number;
    costRemaining: number;
  } {
    return {
      isRunning: this.isRunning,
      currentPlan: this.currentPlan,
      dailyCost: this.dailyCost,
      costRemaining: Math.max(0, this.config.maxDailyCost - this.dailyCost),
    };
  }

  /**
   * Reset daily cost (call at midnight)
   */
  resetDailyCost(): void {
    this.dailyCost = 0;
  }

  /**
   * Check if currently within working hours
   */
  private isWithinWorkingHours(): boolean {
    const now = new Date();
    const hour = now.getUTCHours();

    if (this.config.skipWeekends) {
      const day = now.getUTCDay();
      if (day === 0 || day === 6) {
return false;
}
    }

    return hour >= this.config.workingHours.start && hour < this.config.workingHours.end;
  }

  /**
   * Sort tasks by priority
   */
  private sortTasksByPriority(tasks: GeneratedTask[]): GeneratedTask[] {
    const priorityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return [...tasks].sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];
      return aPriority - bPriority;
    });
  }

  /**
   * Generate plan summary using LLM
   */
  private async generatePlanSummary(
    tasks: GeneratedTask[],
    breakdown: DailyPlan['priorityBreakdown'],
    hours: number
  ): Promise<string> {
    const prompt = `Summarize this daily plan in 2-3 sentences for Phill:
- ${tasks.length} tasks total
- ${breakdown.critical} critical, ${breakdown.high} high, ${breakdown.medium} medium, ${breakdown.low} low priority
- ${hours} estimated hours
- Top tasks: ${tasks.slice(0, 3).map((t) => t.title).join(', ')}

Be concise and action-oriented.`;

    return this.client.free(prompt);
  }

  /**
   * Generate execution summary using LLM
   */
  private async generateExecutionSummary(
    results: TaskResult[],
    success: number,
    failure: number
  ): Promise<string> {
    const uniquePersonas = Array.from(new Set(results.map((r) => r.persona)));
    const prompt = `Summarize this execution run in 2-3 sentences:
- ${success} tasks succeeded, ${failure} failed
- Personas used: ${uniquePersonas.join(', ')}
- Total time: ${results.reduce((sum, r) => sum + r.executionTime, 0)}ms

Be concise and highlight any issues.`;

    return this.client.free(prompt);
  }
}

/**
 * Singleton runner instance
 */
let runnerInstance: AutonomousRunner | null = null;

export function getAutonomousRunner(config?: Partial<RunnerConfig>): AutonomousRunner {
  if (!runnerInstance) {
    runnerInstance = new AutonomousRunner(config);
  }
  return runnerInstance;
}

export default AutonomousRunner;
