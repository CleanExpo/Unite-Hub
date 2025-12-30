/**
 * Claude Agent SDK Orchestrator
 * Spawns subagents with isolated contexts for parallel execution
 *
 * Part of Agentic Layer - Class 2 Implementation
 */

import { query, ClaudeAgentOptions } from "@anthropic-ai/claude-agent-sdk";

export interface SubagentTask {
  agentType: string;
  task: string;
  context?: Record<string, any>;
}

export interface SubagentResult {
  agentType: string;
  success: boolean;
  result?: any;
  error?: string;
  duration: number;
}

export class ClaudeOrchestrator {
  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || '';
    // Don't throw in constructor - allow for testing
    // Actual execution will fail if API key missing, which is fine
  }

  /**
   * Spawn single subagent with isolated context
   */
  async spawnSubagent(
    agentType: string,
    task: string,
    context: Record<string, any> = {}
  ): Promise<SubagentResult> {
    const startTime = Date.now();

    try {
      const options: ClaudeAgentOptions = {
        agents: {
          [agentType]: {
            description: this.getAgentDescription(agentType),
            prompt: this.getAgentPrompt(agentType, context),
            tools: this.getAgentTools(agentType)
          }
        },
        allowedTools: ["Read", "Edit", "Bash", "Glob", "Grep", "Task"],
        settingSources: ["project"], // Load .claude/CLAUDE.md
        permissionMode: "acceptEdits" // Trust edits for dev agents
      };

      let result: any;

      for await (const message of query({ prompt: task, options })) {
        // Collect final result
        if ('result' in message) {
          result = message.result;
        }
      }

      return {
        agentType,
        success: true,
        result,
        duration: Date.now() - startTime
      };

    } catch (error: any) {
      return {
        agentType,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Execute multiple subagents in parallel
   * Pattern: Plan → Parallelize → Integrate
   */
  async executeParallel(tasks: SubagentTask[]): Promise<SubagentResult[]> {
    const promises = tasks.map(t =>
      this.spawnSubagent(t.agentType, t.task, t.context || {})
    );

    return Promise.all(promises);
  }

  /**
   * Plan → Parallelize → Integrate workflow
   */
  async executePlanParallelizeIntegrate(
    objective: string,
    context: Record<string, any> = {}
  ): Promise<{
    plan: any;
    results: SubagentResult[];
    integrated: any;
  }> {
    // 1. PLAN: Use planner subagent to decompose
    const planResult = await this.spawnSubagent('planner', `
      Decompose this objective into parallelizable subtasks:
      ${objective}

      Return a JSON array of tasks with:
      - agentType (which subagent to use)
      - task (what the subagent should do)
      - parallelizable (can run in parallel?)
    `, context);

    if (!planResult.success) {
      throw new Error(`Planning failed: ${planResult.error}`);
    }

    const plan = planResult.result;

    // 2. PARALLELIZE: Execute independent tasks concurrently
    const parallelTasks = plan.tasks?.filter((t: any) => t.parallelizable) || [];
    const sequentialTasks = plan.tasks?.filter((t: any) => !t.parallelizable) || [];

    const parallelResults = await this.executeParallel(parallelTasks);

    // Execute sequential tasks one by one
    const sequentialResults: SubagentResult[] = [];
    for (const task of sequentialTasks) {
      const result = await this.spawnSubagent(task.agentType, task.task, context);
      sequentialResults.push(result);
    }

    // 3. INTEGRATE: Merge all results
    const integratorResult = await this.spawnSubagent('integrator', `
      Integrate these results into a cohesive output:
      Parallel results: ${JSON.stringify(parallelResults)}
      Sequential results: ${JSON.stringify(sequentialResults)}

      Original objective: ${objective}
    `, context);

    return {
      plan,
      results: [...parallelResults, ...sequentialResults],
      integrated: integratorResult.result
    };
  }

  /**
   * Get agent description from registry
   */
  private getAgentDescription(agentType: string): string {
    const descriptions: Record<string, string> = {
      'planner': 'Expert at decomposing complex tasks into parallelizable subtasks',
      'coder': 'Writes TypeScript code following Unite-Hub patterns',
      'tester': 'Generates and executes Vitest tests',
      'reviewer': 'Reviews code for quality, security, and standards compliance',
      'integrator': 'Merges multiple agent outputs into cohesive result',
      'docs': 'Updates documentation to match code changes',
      'optimizer': 'Finds and fixes code smells and performance issues',
      'security': 'Scans for vulnerabilities and creates security patches'
    };

    return descriptions[agentType] || `${agentType} agent for Unite-Hub`;
  }

  /**
   * Get agent prompt with context
   */
  private getAgentPrompt(agentType: string, context: Record<string, any>): string {
    const basePrompt = `
You are a ${agentType} agent for Unite-Hub.

Follow these standards:
- Read AGENTS.md for project context
- Check .claude/rules/*.md for patterns
- Use .claude/skills/ when relevant
- Filter all DB queries by workspace_id
- Write tests (100% pass required)
- Verify outputs

Context: ${JSON.stringify(context, null, 2)}
`;

    return basePrompt;
  }

  /**
   * Get tools allowed for agent type
   */
  private getAgentTools(agentType: string): string[] {
    const toolsets: Record<string, string[]> = {
      'planner': ["Read", "Glob"],
      'coder': ["Read", "Write", "Edit", "Glob", "Grep"],
      'tester': ["Read", "Write", "Bash"],
      'reviewer': ["Read", "Glob", "Grep"],
      'integrator': ["Read"],
      'docs': ["Read", "Edit"],
      'optimizer': ["Read", "Glob", "Grep"],
      'security': ["Read", "Glob", "Grep", "Bash"]
    };

    return toolsets[agentType] || ["Read", "Glob"];
  }
}

// Singleton
let instance: ClaudeOrchestrator | null = null;

export function getClaudeOrchestrator(): ClaudeOrchestrator {
  if (!instance) {
    instance = new ClaudeOrchestrator();
  }
  return instance;
}

/**
 * Quick usage example
 */
export async function exampleUsage() {
  const orchestrator = getClaudeOrchestrator();

  // Single subagent
  const result = await orchestrator.spawnSubagent(
    'coder',
    'Create a new API endpoint for /api/example that returns workspace data'
  );

  // Parallel execution
  const results = await orchestrator.executeParallel([
    { agentType: 'coder', task: 'Write the API route' },
    { agentType: 'tester', task: 'Write tests for the API' },
    { agentType: 'docs', task: 'Document the new endpoint' }
  ]);

  // Full workflow
  const workflow = await orchestrator.executePlanParallelizeIntegrate(
    'Add a new feature to export contacts as CSV'
  );

  return workflow;
}
