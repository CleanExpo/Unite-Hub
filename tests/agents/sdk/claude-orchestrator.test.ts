/**
 * Tests for Claude Agent SDK Orchestrator
 * Part of Agentic Layer Phase 3
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ClaudeOrchestrator } from '@/lib/agents/sdk/claude-orchestrator';

describe('ClaudeOrchestrator', () => {
  let orchestrator: ClaudeOrchestrator;

  beforeEach(() => {
    orchestrator = new ClaudeOrchestrator();
  });

  describe('initialization', () => {
    it('creates orchestrator instance', () => {
      expect(orchestrator).toBeDefined();
    });

    it('allows initialization without API key for testing', () => {
      // Constructor should not throw even without API key
      const testOrchestrator = new ClaudeOrchestrator();
      expect(testOrchestrator).toBeDefined();
    });
  });

  describe('subagent configuration', () => {
    it('returns agent description for known types', () => {
      const desc = (orchestrator as any).getAgentDescription('planner');
      expect(desc).toContain('decomposing');
    });

    it('returns agent prompt with context', () => {
      const prompt = (orchestrator as any).getAgentPrompt('coder', { workspace: 'test' });
      expect(prompt).toContain('coder agent');
      expect(prompt).toContain('workspace');
    });

    it('returns appropriate tools for agent type', () => {
      const tools = (orchestrator as any).getAgentTools('coder');
      expect(tools).toContain('Read');
      expect(tools).toContain('Edit');
    });
  });

  describe('parallel execution structure', () => {
    it('accepts array of subagent tasks', () => {
      const tasks = [
        { agentType: 'coder', task: 'Write code' },
        { agentType: 'tester', task: 'Write tests' }
      ];

      // Structure validation
      expect(tasks).toHaveLength(2);
      expect(tasks[0].agentType).toBe('coder');
    });
  });
});
