/**
 * Phill AI - Multi-Tier LLM Agent System
 *
 * Cost-optimized agent architecture using OpenRouter
 * 95% FREE tier | 4% Refinement | 1% Premium
 *
 * @module phill-ai
 */

// LLM Client
export {
  PhillAIClient,
  getPhillAIClient,
  LLM_MODELS,
  type Tier,
  type ModelKey,
  type LLMClientConfig,
  type ChatMessage,
  type ChatOptions,
  type ChatResponse,
} from './llm-client';

// Personas
export {
  PERSONAS,
  getPersona,
  getAllPersonas,
  getPersonaPrompt,
  getEscalationChain,
  type Persona,
  type PersonaRole,
} from './personas';

// Task Router
export {
  TaskRouter,
  getTaskRouter,
  type Task,
  type TaskCategory,
  type TaskPriority,
  type RoutingDecision,
  type TaskResult,
} from './task-router';

// Task Generator
export {
  TaskGenerator,
  getTaskGenerator,
  type BusinessContext,
  type ClientContext,
  type ProjectContext,
  type ActivityItem,
  type SystemHealthStatus,
  type MarketTrendData,
  type GeneratedTask,
} from './task-generator';

// Autonomous Runner
export {
  AutonomousRunner,
  getAutonomousRunner,
  type DailyPlan,
  type ExecutionReport,
  type RunnerConfig,
} from './autonomous-runner';

// Synthex Visual Pipeline
export {
  SynthexVisualPipeline,
  getSynthexPipeline,
  type VisualRequest,
  type VisualStyle,
  type BrandContext,
  type GeneratedVisual,
  type ApprovalStep,
  type VisualPromptEnhancement,
} from './synthex-integration';

/**
 * Quick start example:
 *
 * ```typescript
 * import { getAutonomousRunner, getTaskRouter } from '@/lib/phill-ai';
 *
 * // For autonomous daily planning
 * const runner = getAutonomousRunner({ maxDailyCost: 5 });
 * const briefing = await runner.getMorningBriefing(businessContext);
 *
 * // For single task execution
 * const router = getTaskRouter();
 * const result = await router.processTask({
 *   id: 'task-1',
 *   title: 'Design homepage hero section',
 *   description: 'Create a modern, premium hero section for client X...',
 *   createdAt: new Date(),
 * });
 *
 * // For visual generation
 * const pipeline = getSynthexPipeline();
 * const visual = await pipeline.generateVisual({
 *   id: 'visual-1',
 *   type: 'hero',
 *   prompt: 'Modern tech startup hero image',
 * });
 * ```
 */
