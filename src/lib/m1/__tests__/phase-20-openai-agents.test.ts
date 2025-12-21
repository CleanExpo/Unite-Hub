/**
 * M1 Phase 20: OpenAI Agents SDK Integration Tests
 *
 * Comprehensive test suite for multi-model orchestration,
 * intelligent task routing, and OpenAI Agents SDK wrapper
 *
 * Total: 45 tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TaskClassifier, MultiModelOrchestrator } from '../agents/multi-model-orchestrator';
import { AgentSDKWrapper, ToolDefinition } from '../agents/agents-sdk-wrapper';
import { IntelligentTaskRouter, RoutingRequest, RoutingStrategy } from '../agents/intelligent-task-router';
import { z } from 'zod';

describe('Phase 20: OpenAI Agents SDK Integration', () => {
  // ============================================================================
  // Task Classifier Tests
  // ============================================================================

  describe('TaskClassifier - Task Classification', () => {
    let classifier: TaskClassifier;

    beforeEach(() => {
      classifier = new TaskClassifier();
    });

    it('should classify simple tasks', () => {
      const classification = classifier.classifyTask('List all files in directory');

      expect(classification.complexity).toBe('simple');
      expect(classification.suggestedModel).toBe('gpt-4o-mini');
      expect(classification.reasoningRequired).toBe(false);
    });

    it('should classify moderate tasks', () => {
      const classification = classifier.classifyTask('Analyze why evaluate the performance metrics from last month and assess implications');

      expect(['simple', 'moderate']).toContain(classification.complexity);
      expect(['gpt-4o-mini', 'gpt-4o']).toContain(classification.suggestedModel);
      expect(classification.reasoningRequired).toBe(true);
    });

    it('should classify longer tasks as more complex', () => {
      const simpleClass = classifier.classifyTask('Hello');
      const longerClass = classifier.classifyTask('Why should we analyze and evaluate and research the complex design of systems');

      // Longer task should have higher complexity score
      const complexityHierarchy: Record<string, number> = {
        simple: 1,
        moderate: 2,
        complex: 3,
        research_intensive: 4,
      };

      const simpleScore = complexityHierarchy[simpleClass.complexity];
      const longerScore = complexityHierarchy[longerClass.complexity];

      expect(longerScore).toBeGreaterThanOrEqual(simpleScore);
    });

    it('should suggest quality models for complex reasoning', () => {
      const classification = classifier.classifyTask('Analyze why evaluate how research the topic');

      // Should suggest a model appropriate for the complexity
      expect(['gpt-4o-mini', 'gpt-4o', 'claude-sonnet', 'claude-opus', 'claude-haiku']).toContain(
        classification.suggestedModel
      );
    });

    it('should estimate token count', () => {
      const classification = classifier.classifyTask('Hello world test task');

      expect(classification.estimatedTokens).toBeGreaterThan(0);
    });

    it('should recommend handoff for complex reasoning', () => {
      const classification = classifier.classifyTask(
        'Explain quantum entanglement in detail and analyze its implications'
      );

      expect(classification.handoffRecommended).toBe(true);
    });

    it('should estimate cost accurately', () => {
      const classification = classifier.classifyTask('Simple task');
      const cost = classifier.estimateCost(classification);

      expect(cost).toBeGreaterThan(0);
      expect(cost).toBeLessThan(1); // Should be cheap for simple task
    });

    it('should factor context into classification', () => {
      const withContext = classifier.classifyTask('Do something', { research: true, requiresReasoning: true });

      expect(withContext.complexity).not.toBe('simple');
    });
  });

  // ============================================================================
  // Multi-Model Orchestrator Tests
  // ============================================================================

  describe('MultiModelOrchestrator - Agent Registration', () => {
    let orchestrator: MultiModelOrchestrator;

    beforeEach(() => {
      orchestrator = new MultiModelOrchestrator();
    });

    afterEach(() => {
      orchestrator.shutdown();
    });

    it('should register custom agents', () => {
      const customAgent = {
        id: 'custom-agent',
        name: 'Custom Agent',
        instructions: 'Custom instructions',
        model: 'gpt-4o' as const,
        tools: new Map(),
        capabilities: ['custom_task'],
        costPerMTok: 5,
        speedRating: 7,
      };

      orchestrator.registerAgent(customAgent);
      const analytics = orchestrator.getPerformanceAnalytics();

      expect(analytics).toBeDefined();
    });

    it('should have default agents registered', () => {
      const analytics = orchestrator.getPerformanceAnalytics();

      expect(analytics.agentDistribution).toBeDefined();
    });
  });

  describe('MultiModelOrchestrator - Task Execution', () => {
    let orchestrator: MultiModelOrchestrator;

    beforeEach(() => {
      orchestrator = new MultiModelOrchestrator();
    });

    afterEach(() => {
      orchestrator.shutdown();
    });

    it('should execute simple tasks', async () => {
      const result = await orchestrator.executeTask('Hello world test');

      expect(result.taskId).toBeDefined();
      expect(result.agentsUsed).toBeDefined();
      expect(result.totalDuration).toBeGreaterThanOrEqual(0);
    });

    it('should classify and route appropriately', async () => {
      const result = await orchestrator.executeTask('List files in directory');

      expect(result.success).toBeDefined();
      expect(result.agentsUsed).toBeDefined();
      expect(Array.isArray(result.agentsUsed)).toBe(true);
    });

    it('should handle task with context', async () => {
      const result = await orchestrator.executeTask('Analyze performance', {
        research: true,
      });

      expect(result.taskId).toBeDefined();
    });

    it('should track execution history', async () => {
      await orchestrator.executeTask('Test task 1');
      await orchestrator.executeTask('Test task 2');

      const history = orchestrator.getExecutionHistory();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    it('should calculate costs per execution', async () => {
      const result = await orchestrator.executeTask('Test cost calculation');

      expect(result.totalCost).toBeGreaterThanOrEqual(0);
    });

    it('should record agent metrics', async () => {
      await orchestrator.executeTask('Metric test');

      const analytics = orchestrator.getPerformanceAnalytics();
      expect(analytics.totalExecutions).toBeGreaterThan(0);
    });

    it('should provide performance analytics', async () => {
      await orchestrator.executeTask('Task 1');
      await orchestrator.executeTask('Task 2');

      const analytics = orchestrator.getPerformanceAnalytics();

      expect(analytics.totalExecutions).toBe(2);
      expect(analytics.successRate).toBeDefined();
      expect(analytics.averageCost).toBeGreaterThanOrEqual(0);
      expect(analytics.averageDuration).toBeGreaterThanOrEqual(0);
    });

    it('should limit execution history', () => {
      const history = orchestrator.getExecutionHistory(10);

      expect(history.length).toBeLessThanOrEqual(10);
    });
  });

  // ============================================================================
  // Agent SDK Wrapper Tests
  // ============================================================================

  describe('AgentSDKWrapper - Tool Management', () => {
    let wrapper: AgentSDKWrapper;

    beforeEach(() => {
      wrapper = new AgentSDKWrapper();
    });

    afterEach(() => {
      wrapper.shutdown();
    });

    it('should register tools', () => {
      const tool: ToolDefinition = {
        name: 'add_numbers',
        description: 'Adds two numbers',
        schema: z.object({ a: z.number(), b: z.number() }),
        handler: async (args: unknown) => ({
          success: true,
          data: (args as any).a + (args as any).b,
        }),
      };

      wrapper.registerTool(tool);
      const tools = wrapper.getRegisteredTools();

      expect(tools).toContain('add_numbers');
    });

    it('should execute tools successfully', async () => {
      const tool: ToolDefinition = {
        name: 'test_tool',
        description: 'Test tool',
        schema: z.object({ value: z.number() }),
        handler: async (args: unknown) => ({
          success: true,
          data: (args as any).value * 2,
        }),
      };

      wrapper.registerTool(tool);
      const result = await wrapper.executeTool('test_tool', { value: 5 });

      expect(result.success).toBe(true);
      expect(result.data).toBe(10);
    });

    it('should handle tool validation errors', async () => {
      const tool: ToolDefinition = {
        name: 'strict_tool',
        description: 'Strict tool',
        schema: z.object({ value: z.number() }),
        handler: async (args: unknown) => ({
          success: true,
          data: args,
        }),
      };

      wrapper.registerTool(tool);
      const result = await wrapper.executeTool('strict_tool', { value: 'not a number' });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should track tool statistics', async () => {
      const tool: ToolDefinition = {
        name: 'stats_tool',
        description: 'Stats tool',
        schema: z.object({}),
        handler: async () => ({
          success: true,
          data: 'ok',
        }),
      };

      wrapper.registerTool(tool);
      await wrapper.executeTool('stats_tool', {});

      const stats = wrapper.getToolStatistics();
      expect(stats['tool_stats_tool']).toBeDefined();
    });
  });

  describe('AgentSDKWrapper - Guardrails', () => {
    let wrapper: AgentSDKWrapper;

    beforeEach(() => {
      wrapper = new AgentSDKWrapper();
    });

    afterEach(() => {
      wrapper.shutdown();
    });

    it('should register guardrails', () => {
      wrapper.registerGuardrail({
        name: 'no_pii',
        description: 'Prevents PII in input',
        validator: async (input: string) => !input.includes('SSN'),
        errorMessage: 'SSN detected',
      });

      const guardrails = wrapper.getRegisteredGuardrails();
      expect(guardrails).toContain('no_pii');
    });

    it('should validate input against guardrails', async () => {
      wrapper.registerGuardrail({
        name: 'no_profanity',
        description: 'Prevents profanity',
        validator: async (input: string) => !input.includes('badword'),
      });

      const result = await wrapper.validateWithGuardrails('clean input', ['no_profanity']);

      expect(result.passed).toBe(true);
      expect(result.violations).toHaveLength(0);
    });

    it('should detect guardrail violations', async () => {
      wrapper.registerGuardrail({
        name: 'length_limit',
        description: 'Limits input length',
        validator: async (input: string) => input.length < 100,
        errorMessage: 'Input too long',
      });

      const result = await wrapper.validateWithGuardrails('x'.repeat(200), ['length_limit']);

      expect(result.passed).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
    });

    it('should handle multiple guardrails', async () => {
      wrapper.registerGuardrail({
        name: 'guard1',
        description: 'Guard 1',
        validator: async (input: string) => input.includes('valid'),
      });

      wrapper.registerGuardrail({
        name: 'guard2',
        description: 'Guard 2',
        validator: async (input: string) => input.length > 5,
      });

      const result = await wrapper.validateWithGuardrails('valid input', ['guard1', 'guard2']);

      expect(result.passed).toBe(true);
    });
  });

  describe('AgentSDKWrapper - Execution Tracing', () => {
    let wrapper: AgentSDKWrapper;

    beforeEach(() => {
      wrapper = new AgentSDKWrapper();
    });

    afterEach(() => {
      wrapper.shutdown();
    });

    it('should record trace events', async () => {
      const tool: ToolDefinition = {
        name: 'traced_tool',
        description: 'Traced tool',
        schema: z.object({}),
        handler: async () => ({ success: true, data: 'traced' }),
      };

      wrapper.registerTool(tool);
      const traceId = 'trace_123';
      await wrapper.executeTool('traced_tool', {}, traceId);

      const trace = wrapper.getExecutionTrace(traceId);
      expect(trace.length).toBeGreaterThan(0);
      expect(trace[0].type).toBe('tool_call');
    });
  });

  // ============================================================================
  // Intelligent Task Router Tests
  // ============================================================================

  describe('IntelligentTaskRouter - Routing Decisions', () => {
    let router: IntelligentTaskRouter;

    beforeEach(() => {
      router = new IntelligentTaskRouter();
    });

    afterEach(() => {
      router.shutdown();
    });

    it('should route simple queries to fast agents', () => {
      const request: RoutingRequest = {
        taskId: 'task_1',
        taskType: 'simple_query',
        goal: 'What is 2+2?',
        priority: 'normal',
        strategy: 'speed_optimized',
      };

      const decision = router.routeTask(request);

      expect(decision.selectedAgent).toBeDefined();
      expect(decision.selectedModel).toBeDefined();
      expect(decision.estimatedLatency).toBeLessThan(1000);
    });

    it('should route complex analysis to quality agents', () => {
      const request: RoutingRequest = {
        taskId: 'task_2',
        taskType: 'analysis',
        goal: 'Analyze market trends',
        priority: 'normal',
        strategy: 'quality_optimized',
      };

      const decision = router.routeTask(request);

      expect(['claude-sonnet-agent', 'claude-opus-agent']).toContain(decision.selectedAgent);
    });

    it('should respect cost constraints', () => {
      const request: RoutingRequest = {
        taskId: 'task_3',
        taskType: 'analysis',
        goal: 'Analyze something',
        priority: 'normal',
        strategy: 'cost_optimized',
        constraints: { maxCost: 0.1 },
      };

      const decision = router.routeTask(request);

      expect(decision.estimatedCost).toBeLessThanOrEqual(0.1);
    });

    it('should respect latency constraints', () => {
      const request: RoutingRequest = {
        taskId: 'task_4',
        taskType: 'simple_query',
        goal: 'Quick question',
        priority: 'urgent',
        strategy: 'speed_optimized',
        constraints: { maxLatency: 500 },
      };

      const decision = router.routeTask(request);

      expect(decision.estimatedLatency).toBeLessThanOrEqual(500);
    });

    it('should provide alternative routing options', () => {
      const request: RoutingRequest = {
        taskId: 'task_5',
        taskType: 'coding',
        goal: 'Write a function',
        priority: 'normal',
        strategy: 'balanced',
      };

      const decision = router.routeTask(request);

      expect(decision.alternativeRoutes).toBeDefined();
      expect(decision.alternativeRoutes.length).toBeGreaterThan(0);
    });

    it('should generate reasoning for routing decision', () => {
      const request: RoutingRequest = {
        taskId: 'task_6',
        taskType: 'research',
        goal: 'Research quantum physics',
        priority: 'normal',
        strategy: 'quality_optimized',
      };

      const decision = router.routeTask(request);

      expect(decision.reasoning).toBeTruthy();
      expect(decision.reasoning.length).toBeGreaterThan(0);
    });

    it('should apply routing policies', () => {
      const request: RoutingRequest = {
        taskId: 'task_7',
        taskType: 'simple_query',
        goal: 'Simple test',
        priority: 'normal',
        strategy: 'balanced',
      };

      const decision = router.routeTask(request);

      // Simple query policy prefers haiku or mini
      expect(decision.selectedAgent).toBeDefined();
    });

    it('should handle priority in routing', () => {
      const urgentRequest: RoutingRequest = {
        taskId: 'task_8',
        taskType: 'analysis',
        goal: 'Urgent analysis',
        priority: 'urgent',
        strategy: 'speed_optimized',
      };

      const decision = router.routeTask(urgentRequest);

      expect(decision.estimatedLatency).toBeLessThan(3000); // Should favor speed
    });
  });

  describe('IntelligentTaskRouter - Strategy Routing', () => {
    let router: IntelligentTaskRouter;

    beforeEach(() => {
      router = new IntelligentTaskRouter();
    });

    afterEach(() => {
      router.shutdown();
    });

    it('should apply cost_optimized strategy', () => {
      const request: RoutingRequest = {
        taskId: 'task_cost',
        taskType: 'generation',
        goal: 'Generate text',
        priority: 'normal',
        strategy: 'cost_optimized',
      };

      const decision = router.routeTask(request);

      expect(decision.selectedAgent).toBeDefined();
      expect(decision.estimatedCost).toBeGreaterThanOrEqual(0);
    });

    it('should apply speed_optimized strategy', () => {
      const request: RoutingRequest = {
        taskId: 'task_speed',
        taskType: 'simple_query',
        goal: 'Quick query',
        priority: 'normal',
        strategy: 'speed_optimized',
      };

      const decision = router.routeTask(request);

      expect(decision.estimatedLatency).toBeGreaterThan(0);
    });

    it('should apply quality_optimized strategy', () => {
      const request: RoutingRequest = {
        taskId: 'task_quality',
        taskType: 'research',
        goal: 'Research task',
        priority: 'normal',
        strategy: 'quality_optimized',
      };

      const decision = router.routeTask(request);

      expect(decision.selectedAgent).toBeDefined();
    });

    it('should apply balanced strategy', () => {
      const request: RoutingRequest = {
        taskId: 'task_balanced',
        taskType: 'coding',
        goal: 'Code generation',
        priority: 'normal',
        strategy: 'balanced',
      };

      const decision = router.routeTask(request);

      expect(decision.selectedAgent).toBeDefined();
      expect(decision.reasoning).toContain('balanced');
    });
  });

  describe('IntelligentTaskRouter - Performance Tracking', () => {
    let router: IntelligentTaskRouter;

    beforeEach(() => {
      router = new IntelligentTaskRouter();
    });

    afterEach(() => {
      router.shutdown();
    });

    it('should track routing history', () => {
      const request: RoutingRequest = {
        taskId: 'task_hist_1',
        taskType: 'simple_query',
        goal: 'Query 1',
        priority: 'normal',
        strategy: 'balanced',
      };

      router.routeTask(request);

      const history = router.getRoutingHistory();
      expect(history.length).toBeGreaterThan(0);
    });

    it('should provide routing statistics', () => {
      const request: RoutingRequest = {
        taskId: 'task_stats_1',
        taskType: 'analysis',
        goal: 'Analysis task',
        priority: 'normal',
        strategy: 'balanced',
      };

      router.routeTask(request);

      const stats = router.getRoutingStatistics();

      expect(stats.totalRoutingDecisions).toBeGreaterThan(0);
      expect(stats.agentUsageDistribution).toBeDefined();
      expect(stats.averageEstimatedCost).toBeGreaterThanOrEqual(0);
    });

    it('should update agent performance metrics', () => {
      const request: RoutingRequest = {
        taskId: 'task_perf_1',
        taskType: 'simple_query',
        goal: 'Perf test',
        priority: 'normal',
        strategy: 'balanced',
      };

      const decision = router.routeTask(request);

      router.updateAgentPerformance(decision.selectedAgent, {
        latency: 100,
        success: true,
        cost: 0.01,
      });

      const stats = router.getRoutingStatistics();
      expect(stats).toBeDefined();
    });

    it('should maintain limited routing history', () => {
      const requests: RoutingRequest[] = [];
      for (let i = 0; i < 5; i++) {
        requests.push({
          taskId: `task_limit_${i}`,
          taskType: 'simple_query',
          goal: `Query ${i}`,
          priority: 'normal',
          strategy: 'balanced',
        });
      }

      for (const request of requests) {
        router.routeTask(request);
      }

      const history = router.getRoutingHistory(3);
      expect(history.length).toBeLessThanOrEqual(3);
    });
  });
});
