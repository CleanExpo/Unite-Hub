/**
 * Documentation Sync Agent
 * Keeps documentation in sync with code changes
 *
 * Part of Agentic Layer Phase 4 - Self-Improving Agents
 */

import { BaseAgent, AgentTask } from './base-agent';
import { getClaudeOrchestrator } from './sdk/claude-orchestrator';

export interface DocsSyncResult {
  filesUpdated: string[];
  summary: string;
}

export class DocsSyncAgent extends BaseAgent {
  constructor() {
    super({
      name: 'DocsSyncAgent',
      queueName: 'docs-sync-queue',
      concurrency: 1
    });
  }

  protected async processTask(task: AgentTask): Promise<DocsSyncResult> {
    const { changedFiles } = task.payload;
    const orchestrator = getClaudeOrchestrator();

    // Use SDK to update docs in parallel
    const updates = await orchestrator.executeParallel([
      {
        agentType: 'docs',
        task: `Update .claude/CLAUDE.md if architecture changed in: ${changedFiles.join(', ')}`
      },
      {
        agentType: 'docs',
        task: `Update src/lib/agents/AGENT-GUIDE.md if agent patterns changed`
      },
      {
        agentType: 'docs',
        task: `Check if API docs need updates`
      }
    ]);

    const filesUpdated: string[] = [];
    updates.forEach(u => {
      if (u.success && u.result?.updated) {
        filesUpdated.push(...u.result.updated);
      }
    });

    return {
      filesUpdated,
      summary: `Updated ${filesUpdated.length} documentation files`
    };
  }
}

export function getDocsSyncAgent(): DocsSyncAgent {
  return new DocsSyncAgent();
}
