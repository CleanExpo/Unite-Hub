/**
 * Phill AI Task Generator
 * Autonomous task generation from business context
 */

import { PhillAIClient, ChatMessage } from './llm-client';
import { Task, TaskCategory, TaskPriority } from './task-router';
import { v4 as uuidv4 } from 'uuid';

export interface BusinessContext {
  clients: ClientContext[];
  projects: ProjectContext[];
  recentActivity: ActivityItem[];
  systemHealth: SystemHealthStatus;
  marketTrends?: MarketTrendData[];
}

export interface ClientContext {
  id: string;
  name: string;
  industry: string;
  status: 'active' | 'onboarding' | 'churning' | 'dormant';
  lastContact: Date;
  contractValue: number;
  upcomingDeliverables: string[];
  healthScore: number; // 0-100
}

export interface ProjectContext {
  id: string;
  clientId: string;
  name: string;
  type: 'website' | 'branding' | 'marketing' | 'seo' | 'maintenance';
  status: 'planning' | 'active' | 'review' | 'launched' | 'paused';
  deadline?: Date;
  completionPercentage: number;
  blockers: string[];
  nextMilestone?: string;
}

export interface ActivityItem {
  id: string;
  type: 'email' | 'meeting' | 'task' | 'alert' | 'feedback';
  timestamp: Date;
  summary: string;
  clientId?: string;
  projectId?: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface SystemHealthStatus {
  uptime: number;
  errorRate: number;
  performanceScore: number;
  securityAlerts: number;
  pendingUpdates: string[];
}

export interface MarketTrendData {
  topic: string;
  trend: 'rising' | 'stable' | 'declining';
  relevance: number; // 0-100
  source: string;
}

export interface GeneratedTask extends Task {
  source: 'autonomous' | 'triggered' | 'scheduled';
  trigger?: string;
  confidence: number; // 0-100 - how confident we are this task is valuable
  dependencies?: string[]; // Task IDs this depends on
  estimatedHours?: number;
  suggestedDeadline?: Date;
}

/**
 * Task generation prompts for each trigger type
 */
const GENERATION_PROMPTS = {
  dailyPlanning: `Based on the current business context, generate 5-10 prioritized tasks for today.

Consider:
1. Urgent client deliverables
2. At-risk projects needing attention
3. Clients who haven't been contacted recently
4. System maintenance needs
5. Growth opportunities

Output JSON array of tasks with: title, description, category, priority, clientId (if applicable), estimatedHours`,

  clientCheck: `Analyze this client's health and generate proactive tasks:
- Content opportunities based on their industry
- Engagement tasks if contact is overdue
- Upsell opportunities if appropriate
- Risk mitigation if health score is low

Output JSON array of 1-3 specific, actionable tasks.`,

  projectMonitor: `Review this project's status and generate tasks:
- Address any blockers
- Prepare for upcoming milestones
- Quality assurance if near completion
- Client communication needs

Output JSON array of 1-3 specific tasks.`,

  systemHealth: `Based on system health status, generate maintenance tasks:
- Critical fixes for high error rates
- Performance optimization opportunities
- Security patches needed
- Update schedules

Output JSON array with priority based on severity.`,

  marketTrends: `Based on current market trends, generate opportunity tasks:
- Content topics trending in client industries
- New service offerings to consider
- Competitive positioning adjustments
- Client education opportunities

Output JSON array of strategic tasks.`,
};

/**
 * Task Generator - Creates tasks autonomously from context
 */
export class TaskGenerator {
  private client: PhillAIClient;

  constructor(client?: PhillAIClient) {
    this.client = client || new PhillAIClient();
  }

  /**
   * Generate daily planning tasks
   */
  async generateDailyTasks(context: BusinessContext): Promise<GeneratedTask[]> {
    const prompt = this.buildContextualPrompt(GENERATION_PROMPTS.dailyPlanning, context);

    const response = await this.client.free(prompt, this.getGeneratorSystemPrompt());

    return this.parseGeneratedTasks(response, 'scheduled', 'daily_planning');
  }

  /**
   * Generate tasks for a specific client
   */
  async generateClientTasks(
    client: ClientContext,
    recentActivity: ActivityItem[]
  ): Promise<GeneratedTask[]> {
    const contextData = {
      client,
      recentActivity: recentActivity.filter((a) => a.clientId === client.id).slice(0, 10),
    };

    const prompt = `${GENERATION_PROMPTS.clientCheck}\n\nClient Context:\n${JSON.stringify(contextData, null, 2)}`;

    const response = await this.client.free(prompt, this.getGeneratorSystemPrompt());

    return this.parseGeneratedTasks(response, 'triggered', `client_check:${client.id}`);
  }

  /**
   * Generate tasks for a specific project
   */
  async generateProjectTasks(
    project: ProjectContext,
    client: ClientContext
  ): Promise<GeneratedTask[]> {
    const contextData = { project, client };

    const prompt = `${GENERATION_PROMPTS.projectMonitor}\n\nProject Context:\n${JSON.stringify(contextData, null, 2)}`;

    const response = await this.client.free(prompt, this.getGeneratorSystemPrompt());

    return this.parseGeneratedTasks(response, 'triggered', `project_check:${project.id}`);
  }

  /**
   * Generate system maintenance tasks
   */
  async generateSystemTasks(health: SystemHealthStatus): Promise<GeneratedTask[]> {
    const prompt = `${GENERATION_PROMPTS.systemHealth}\n\nSystem Health:\n${JSON.stringify(health, null, 2)}`;

    const response = await this.client.free(prompt, this.getGeneratorSystemPrompt());

    return this.parseGeneratedTasks(response, 'triggered', 'system_health');
  }

  /**
   * Generate opportunity tasks from market trends
   */
  async generateTrendTasks(
    trends: MarketTrendData[],
    clients: ClientContext[]
  ): Promise<GeneratedTask[]> {
    const contextData = {
      trends: trends.filter((t) => t.relevance > 50),
      clientIndustries: Array.from(new Set(clients.map((c) => c.industry))),
    };

    const prompt = `${GENERATION_PROMPTS.marketTrends}\n\nTrend Context:\n${JSON.stringify(contextData, null, 2)}`;

    const response = await this.client.free(prompt, this.getGeneratorSystemPrompt());

    return this.parseGeneratedTasks(response, 'autonomous', 'market_trends');
  }

  /**
   * Full autonomous scan - generates all types of tasks
   */
  async fullAutonomousScan(context: BusinessContext): Promise<GeneratedTask[]> {
    const allTasks: GeneratedTask[] = [];

    // 1. Daily planning
    const dailyTasks = await this.generateDailyTasks(context);
    allTasks.push(...dailyTasks);

    // 2. Client health checks for at-risk clients
    const atRiskClients = context.clients.filter((c) => c.healthScore < 70 || c.status === 'churning');

    for (const client of atRiskClients) {
      const clientTasks = await this.generateClientTasks(client, context.recentActivity);
      allTasks.push(...clientTasks);
    }

    // 3. Project checks for projects with blockers or near deadline
    const criticalProjects = context.projects.filter(
      (p) =>
        p.blockers.length > 0 ||
        (p.deadline && new Date(p.deadline).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000)
    );

    for (const project of criticalProjects) {
      const client = context.clients.find((c) => c.id === project.clientId);
      if (client) {
        const projectTasks = await this.generateProjectTasks(project, client);
        allTasks.push(...projectTasks);
      }
    }

    // 4. System health if issues detected
    if (
      context.systemHealth.errorRate > 0.01 ||
      context.systemHealth.securityAlerts > 0 ||
      context.systemHealth.pendingUpdates.length > 0
    ) {
      const systemTasks = await this.generateSystemTasks(context.systemHealth);
      allTasks.push(...systemTasks);
    }

    // 5. Market trends if available
    if (context.marketTrends && context.marketTrends.length > 0) {
      const trendTasks = await this.generateTrendTasks(context.marketTrends, context.clients);
      allTasks.push(...trendTasks);
    }

    // Dedupe and prioritize
    return this.deduplicateAndPrioritize(allTasks);
  }

  /**
   * Get system prompt for task generation
   */
  private getGeneratorSystemPrompt(): string {
    return `You are Phill AI's Task Generator. Your job is to analyze business context and generate specific, actionable tasks.

RULES:
1. Tasks must be specific and actionable (not vague like "improve website")
2. Each task should have clear success criteria
3. Prioritize based on business impact and urgency
4. Consider dependencies between tasks
5. Estimate realistic hours based on task complexity

OUTPUT FORMAT:
Return ONLY a valid JSON array of tasks with this structure:
[
  {
    "title": "Specific task title",
    "description": "Detailed description with context",
    "category": "technical|visual|ux|marketing|brand|quality",
    "priority": "low|medium|high|critical",
    "clientId": "optional-client-id",
    "projectId": "optional-project-id",
    "estimatedHours": 2,
    "suggestedDeadline": "2025-12-01T00:00:00Z",
    "confidence": 85
  }
]

Do not include any explanation outside the JSON array.`;
  }

  /**
   * Build contextual prompt with business data
   */
  private buildContextualPrompt(basePrompt: string, context: BusinessContext): string {
    const summary = {
      totalClients: context.clients.length,
      activeProjects: context.projects.filter((p) => p.status === 'active').length,
      atRiskClients: context.clients.filter((c) => c.healthScore < 70).length,
      blockedProjects: context.projects.filter((p) => p.blockers.length > 0).length,
      recentActivityCount: context.recentActivity.length,
      systemHealth: context.systemHealth,
    };

    return `${basePrompt}

BUSINESS SNAPSHOT:
${JSON.stringify(summary, null, 2)}

TOP CLIENTS (by contract value):
${JSON.stringify(context.clients.slice(0, 5), null, 2)}

ACTIVE PROJECTS:
${JSON.stringify(
  context.projects.filter((p) => p.status === 'active').slice(0, 5),
  null,
  2
)}

RECENT ACTIVITY (last 24h):
${JSON.stringify(context.recentActivity.slice(0, 10), null, 2)}`;
  }

  /**
   * Parse LLM response into GeneratedTask array
   */
  private parseGeneratedTasks(
    response: string,
    source: GeneratedTask['source'],
    trigger: string
  ): GeneratedTask[] {
    try {
      // Extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn('No JSON array found in task generation response');
        return [];
      }

      const parsed = JSON.parse(jsonMatch[0]);

      return parsed.map(
        (
          task: Partial<GeneratedTask> & {
            title: string;
            description: string;
          }
        ) => ({
          id: uuidv4(),
          title: task.title,
          description: task.description,
          category: (task.category || 'general') as TaskCategory,
          priority: (task.priority || 'medium') as TaskPriority,
          clientId: task.clientId,
          projectId: task.projectId,
          createdAt: new Date(),
          source,
          trigger,
          confidence: task.confidence || 70,
          estimatedHours: task.estimatedHours,
          suggestedDeadline: task.suggestedDeadline
            ? new Date(task.suggestedDeadline)
            : undefined,
        })
      );
    } catch (error) {
      console.error('Failed to parse generated tasks:', error);
      return [];
    }
  }

  /**
   * Deduplicate and prioritize tasks
   */
  private deduplicateAndPrioritize(tasks: GeneratedTask[]): GeneratedTask[] {
    // Simple deduplication by similar titles
    const seen = new Set<string>();
    const unique = tasks.filter((task) => {
      const key = task.title.toLowerCase().replace(/\s+/g, ' ').trim();
      if (seen.has(key)) {
return false;
}
      seen.add(key);
      return true;
    });

    // Sort by priority and confidence
    const priorityOrder: Record<TaskPriority, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };

    return unique.sort((a, b) => {
      const aPriority = priorityOrder[a.priority || 'medium'];
      const bPriority = priorityOrder[b.priority || 'medium'];

      if (aPriority !== bPriority) {
return aPriority - bPriority;
}

      return (b.confidence || 70) - (a.confidence || 70);
    });
  }
}

/**
 * Singleton generator instance
 */
let generatorInstance: TaskGenerator | null = null;

export function getTaskGenerator(): TaskGenerator {
  if (!generatorInstance) {
    generatorInstance = new TaskGenerator();
  }
  return generatorInstance;
}

export default TaskGenerator;
