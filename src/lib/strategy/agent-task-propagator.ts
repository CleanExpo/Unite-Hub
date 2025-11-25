/**
 * Agent Task Propagator
 * Phase 4: Task 1 - L4 Task Decomposition
 *
 * Converts L4 hierarchical strategy tasks into executable agent tasks:
 * - Maps L4 items to agent responsibilities
 * - Creates dependency chains
 * - Assigns task priorities
 * - Establishes agent handoff sequences
 *
 * @module lib/strategy/agent-task-propagator
 */

import { supabaseAdmin } from '@/lib/supabase';
import type { AgentType, AgentTask } from './execution-engine';

export interface L4Item {
  id: string;
  l3_id: string;
  title: string;
  description: string;
  effort_estimate: string;
  risk_level: 'low' | 'medium' | 'high';
  owner?: string;
  dependencies?: string[];
  deadline?: Date;
  tags?: string[];
}

export interface PropagationConfig {
  strategyId: string;
  executionId: string;
  workspaceId: string;
}

/**
 * Maps L4 items to specific agent types based on content and intent
 */
const AGENT_MAPPING: Record<string, { agents: AgentType[]; priority: 'high' | 'medium' | 'low' }> = {
  // Email-related keywords
  'email|send|contact|outreach|notify|campaign|message': {
    agents: ['email', 'coordination'],
    priority: 'high',
  },
  // Content generation
  'write|create|generate|draft|compose|document|proposal': {
    agents: ['content', 'analysis'],
    priority: 'high',
  },
  // Research and analysis
  'research|analyze|study|investigate|review|explore|examine': {
    agents: ['research', 'analysis', 'content'],
    priority: 'medium',
  },
  // Scheduling
  'schedule|calendar|meeting|appointment|plan|organize': {
    agents: ['scheduling', 'email', 'coordination'],
    priority: 'high',
  },
  // Coordination
  'coordinate|align|discuss|review|decide|approve': {
    agents: ['coordination', 'analysis'],
    priority: 'medium',
  },
  // Follow-up tasks
  'follow.?up|follow.?through|track|monitor|check': {
    agents: ['email', 'scheduling', 'coordination'],
    priority: 'medium',
  },
};

/**
 * Agent Task Propagator
 * Converts L4 strategy items to executable agent tasks
 */
export class AgentTaskPropagator {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  /**
   * Propagate L4 tasks to agent tasks
   * Creates executable tasks for each L4 item
   */
  async propagateTasks(strategyId: string, executionId: string): Promise<AgentTask[]> {
    try {
      // Fetch L4 items for strategy
      const { data: l4Items, error: l4Error } = await supabaseAdmin
        .from('strategy_l4_items')
        .select('*')
        .eq('strategy_id', strategyId)
        .eq('workspace_id', this.workspaceId)
        .order('created_at', { ascending: true });

      if (l4Error) throw l4Error;
      if (!l4Items || l4Items.length === 0) {
        console.log(`No L4 items found for strategy ${strategyId}`);
        return [];
      }

      console.log(`Propagating ${l4Items.length} L4 items to agent tasks`);

      const agentTasks: AgentTask[] = [];
      const taskIdMap: Record<string, string[]> = {}; // Maps L4 ID to created task IDs

      // Create tasks for each L4 item
      for (const l4Item of l4Items) {
        const tasksForItem = await this.createAgentTasksForL4Item(
          l4Item,
          executionId,
          l4Items,
          taskIdMap
        );

        agentTasks.push(...tasksForItem);
        taskIdMap[l4Item.id] = tasksForItem.map((t) => t.taskId);
      }

      // Insert all tasks into database
      const { error: insertError } = await supabaseAdmin.from('agent_tasks').insert(
        agentTasks.map((task) => ({
          id: task.taskId,
          execution_id: executionId,
          l4_item_id: task.l4ItemId,
          agent_type: task.agentType,
          status: task.status,
          priority: task.priority,
          description: task.description,
          dependencies: task.dependencies,
          retry_count: 0,
          max_retries: task.maxRetries,
          workspace_id: this.workspaceId,
        }))
      );

      if (insertError) throw insertError;

      console.log(`Created ${agentTasks.length} agent tasks from ${l4Items.length} L4 items`);

      return agentTasks;
    } catch (error) {
      console.error('Task propagation failed:', error);
      throw error;
    }
  }

  /**
   * Create agent tasks for a single L4 item
   */
  private async createAgentTasksForL4Item(
    l4Item: any,
    executionId: string,
    allL4Items: any[],
    taskIdMap: Record<string, string[]>
  ): Promise<AgentTask[]> {
    const tasks: AgentTask[] = [];

    // Determine agent types based on item content
    const agentTypes = this.determineAgents(l4Item);

    if (agentTypes.length === 0) {
      // Default to coordination if no specific agents matched
      agentTypes.push('coordination');
    }

    // Create task for each assigned agent
    for (let i = 0; i < agentTypes.length; i++) {
      const agentType = agentTypes[i];

      const taskId = `task_${l4Item.id}_${agentType}_${Date.now()}`;

      // Build dependencies
      const dependencies: string[] = [];

      // Add previous agent task for this L4 item (sequential execution)
      if (i > 0) {
        const prevTaskId = `task_${l4Item.id}_${agentTypes[i - 1]}_${Date.now() - 1}`;
        dependencies.push(prevTaskId);
      }

      // Add L4 dependencies
      if (l4Item.dependencies && Array.isArray(l4Item.dependencies)) {
        for (const depL4Id of l4Item.dependencies) {
          const depTaskIds = taskIdMap[depL4Id];
          if (depTaskIds && depTaskIds.length > 0) {
            dependencies.push(depTaskIds[depTaskIds.length - 1]); // Last task of dependent L4
          }
        }
      }

      // Determine priority
      const priority = this.determinePriority(l4Item, agentType);

      // Build description
      const description = this.buildTaskDescription(l4Item, agentType);

      tasks.push({
        taskId,
        l4ItemId: l4Item.id,
        agentType,
        status: 'pending',
        priority,
        description,
        dependencies,
        retryCount: 0,
        maxRetries: agentType === 'email' ? 2 : 1,
      });
    }

    return tasks;
  }

  /**
   * Determine which agents should handle this L4 item
   */
  private determineAgents(l4Item: any): AgentType[] {
    const agents: Set<AgentType> = new Set();

    const text = `${l4Item.title} ${l4Item.description}`.toLowerCase();

    for (const [pattern, mapping] of Object.entries(AGENT_MAPPING)) {
      const regex = new RegExp(pattern, 'i');
      if (regex.test(text)) {
        mapping.agents.forEach((agent) => agents.add(agent));
      }
    }

    // Sort to ensure consistent ordering
    return Array.from(agents).sort();
  }

  /**
   * Determine task priority
   */
  private determinePriority(l4Item: any, agentType: AgentType): 'high' | 'medium' | 'low' {
    // Higher priority for email and scheduling tasks
    if (agentType === 'email' || agentType === 'scheduling') {
      return 'high';
    }

    // Check item risk level
    if (l4Item.risk_level === 'high') {
      return 'high';
    }

    if (l4Item.risk_level === 'low') {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Build descriptive task description
   */
  private buildTaskDescription(l4Item: any, agentType: AgentType): string {
    const base = `Execute: ${l4Item.title}`;

    if (l4Item.description) {
      return `${base}\n\nDetails: ${l4Item.description}`;
    }

    // Add agent-specific guidance
    switch (agentType) {
      case 'email':
        return `${base}\n\nAction: Compose and send email communication.`;
      case 'content':
        return `${base}\n\nAction: Generate content for this objective.`;
      case 'scheduling':
        return `${base}\n\nAction: Schedule required meetings or activities.`;
      case 'research':
        return `${base}\n\nAction: Research and gather information.`;
      case 'analysis':
        return `${base}\n\nAction: Analyze situation and provide insights.`;
      case 'coordination':
        return `${base}\n\nAction: Coordinate with other team members.`;
      default:
        return base;
    }
  }

  /**
   * Get task dependency graph
   */
  async getDependencyGraph(executionId: string): Promise<Record<string, string[]>> {
    const { data: tasks, error } = await supabaseAdmin
      .from('agent_tasks')
      .select('id, dependencies')
      .eq('execution_id', executionId);

    if (error) throw error;

    const graph: Record<string, string[]> = {};

    for (const task of tasks || []) {
      graph[task.id] = task.dependencies || [];
    }

    return graph;
  }

  /**
   * Validate task dependencies
   */
  async validateDependencies(executionId: string): Promise<{ valid: boolean; issues: string[] }> {
    try {
      const graph = await this.getDependencyGraph(executionId);
      const issues: string[] = [];

      // Check for circular dependencies
      for (const [taskId, deps] of Object.entries(graph)) {
        const visited = new Set<string>();
        const hasCycle = this.detectCycle(taskId, deps, graph, visited);

        if (hasCycle) {
          issues.push(`Circular dependency detected involving task ${taskId}`);
        }
      }

      // Check for missing dependencies
      const allTasks = new Set(Object.keys(graph));

      for (const [, deps] of Object.entries(graph)) {
        for (const dep of deps) {
          if (!allTasks.has(dep)) {
            issues.push(`Missing dependency: task ${dep} not found`);
          }
        }
      }

      return {
        valid: issues.length === 0,
        issues,
      };
    } catch (error) {
      console.error('Dependency validation failed:', error);
      throw error;
    }
  }

  /**
   * Detect cycles in dependency graph
   */
  private detectCycle(
    taskId: string,
    deps: string[],
    graph: Record<string, string[]>,
    visited: Set<string>
  ): boolean {
    if (visited.has(taskId)) return true;

    visited.add(taskId);

    for (const dep of deps) {
      const depDeps = graph[dep] || [];
      if (this.detectCycle(dep, depDeps, graph, visited)) {
        return true;
      }
    }

    visited.delete(taskId);
    return false;
  }

  /**
   * Get topological sort of tasks
   */
  async getTaskOrder(executionId: string): Promise<string[]> {
    const graph = await this.getDependencyGraph(executionId);
    const ordered: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (taskId: string) => {
      if (visited.has(taskId)) return;
      if (visiting.has(taskId)) throw new Error('Circular dependency detected');

      visiting.add(taskId);

      for (const dep of graph[taskId] || []) {
        visit(dep);
      }

      visiting.delete(taskId);
      visited.add(taskId);
      ordered.push(taskId);
    };

    for (const taskId of Object.keys(graph)) {
      visit(taskId);
    }

    return ordered;
  }
}

export default AgentTaskPropagator;
