/**
 * Hybrid AI Agent Framework - Type Definitions
 * Shared types between Python backend and TypeScript frontend
 */

import { z } from 'zod';

// Phase Status Enum
export enum PhaseStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  TESTING = 'testing',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

// Agent Status Enum
export enum AgentStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  PAUSED = 'paused',
  ERROR = 'error'
}

// Test Result Schema
export const TestResultSchema = z.object({
  test_name: z.string(),
  status: z.enum(['passed', 'failed', 'skipped']),
  duration: z.number(),
  error_message: z.string().optional(),
  stdout: z.string().optional(),
  stderr: z.string().optional()
});

export type TestResult = z.infer<typeof TestResultSchema>;

// Agent Phase Schema
export const AgentPhaseSchema = z.object({
  name: z.string(),
  description: z.string(),
  dependencies: z.array(z.string()).default([]),
  tests_required: z.boolean().default(true),
  docker_validation: z.boolean().default(true),
  approval_required: z.boolean().default(true),
  status: z.nativeEnum(PhaseStatus).default(PhaseStatus.PENDING),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export type AgentPhase = z.infer<typeof AgentPhaseSchema>;

// Agent State Schema
export const AgentStateSchema = z.object({
  current_phase: z.string().optional(),
  phase_status: z.nativeEnum(PhaseStatus).default(PhaseStatus.PENDING),
  completed_phases: z.array(z.string()).default([]),
  test_results: z.array(TestResultSchema).default([]),
  last_update: z.date().default(() => new Date()),
  roadmap_version: z.string().default('1.0.0'),
  agent_status: z.nativeEnum(AgentStatus).default(AgentStatus.IDLE),
  error_message: z.string().optional(),
  execution_context: z.record(z.any()).optional()
});

export type AgentState = z.infer<typeof AgentStateSchema>;

// Roadmap Item Schema
export const RoadmapItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  status: z.nativeEnum(PhaseStatus).default(PhaseStatus.PENDING),
  priority: z.number().min(1).max(5).default(3),
  estimated_hours: z.number().min(0).default(1),
  dependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date()),
  assigned_to: z.string().optional(),
  progress_percentage: z.number().min(0).max(100).default(0)
});

export type RoadmapItem = z.infer<typeof RoadmapItemSchema>;

// Agent Response Schema
export const AgentResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.record(z.any()).optional(),
  timestamp: z.date().default(() => new Date()),
  phase: z.string().optional(),
  next_actions: z.array(z.string()).default([]),
  agent_status: z.nativeEnum(AgentStatus).optional(),
  execution_id: z.string().optional()
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Agent Command Schema
export const AgentCommandSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).default([]),
  options: z.record(z.any()).default({}),
  execution_context: z.record(z.any()).optional(),
  timeout: z.number().default(30000), // 30 seconds default
  priority: z.number().min(1).max(5).default(3)
});

export type AgentCommand = z.infer<typeof AgentCommandSchema>;

// Execution Context Schema
export const ExecutionContextSchema = z.object({
  execution_id: z.string(),
  command: z.string(),
  start_time: z.date(),
  end_time: z.date().optional(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  output: z.string().optional(),
  error: z.string().optional(),
  exit_code: z.number().optional(),
  metadata: z.record(z.any()).default({})
});

export type ExecutionContext = z.infer<typeof ExecutionContextSchema>;

// Agent Configuration Schema
export const AgentConfigSchema = z.object({
  project_path: z.string().default('.'),
  python_executable: z.string().default('python'),
  agent_script_path: z.string().default('ai-agent-framework/pydantic_agent_core.py'),
  docker_enabled: z.boolean().default(true),
  auto_approve: z.boolean().default(false),
  max_concurrent_executions: z.number().min(1).max(10).default(3),
  execution_timeout: z.number().default(300000), // 5 minutes
  log_level: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  phases: z.array(AgentPhaseSchema).default([]),
  environment_variables: z.record(z.string()).default({})
});

export type AgentConfig = z.infer<typeof AgentConfigSchema>;

// Task Definition Schema
export const TaskDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  command: z.string(),
  args: z.array(z.string()).default([]),
  dependencies: z.array(z.string()).default([]),
  phase: z.string(),
  timeout: z.number().default(30000),
  retry_count: z.number().min(0).max(5).default(3),
  created_at: z.date().default(() => new Date()),
  updated_at: z.date().default(() => new Date())
});

export type TaskDefinition = z.infer<typeof TaskDefinitionSchema>;

// Execution Log Schema
export const ExecutionLogSchema = z.object({
  id: z.string(),
  execution_id: z.string(),
  timestamp: z.date(),
  level: z.enum(['debug', 'info', 'warn', 'error']),
  message: z.string(),
  data: z.record(z.any()).optional(),
  source: z.string().optional()
});

export type ExecutionLog = z.infer<typeof ExecutionLogSchema>;

// Agent Event Schema
export const AgentEventSchema = z.object({
  id: z.string(),
  type: z.enum(['phase_started', 'phase_completed', 'test_passed', 'test_failed', 'error_occurred', 'approval_requested']),
  timestamp: z.date(),
  phase: z.string().optional(),
  data: z.record(z.any()).optional(),
  handled: z.boolean().default(false)
});

export type AgentEvent = z.infer<typeof AgentEventSchema>;

// Default Agent Configuration
export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  project_path: '.',
  python_executable: 'python',
  agent_script_path: 'ai-agent-framework/pydantic_agent_core.py',
  docker_enabled: true,
  auto_approve: false,
  max_concurrent_executions: 3,
  execution_timeout: 300000,
  log_level: 'info',
  phases: [
    {
      name: 'foundation',
      description: 'Set up project foundation and core structure',
      dependencies: [],
      tests_required: true,
      docker_validation: true,
      approval_required: true,
      status: PhaseStatus.PENDING,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'implementation',
      description: 'Implement core functionality',
      dependencies: ['foundation'],
      tests_required: true,
      docker_validation: true,
      approval_required: true,
      status: PhaseStatus.PENDING,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'integration',
      description: 'Integrate components and test end-to-end',
      dependencies: ['implementation'],
      tests_required: true,
      docker_validation: true,
      approval_required: true,
      status: PhaseStatus.PENDING,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      name: 'deployment',
      description: 'Deploy to production environment',
      dependencies: ['integration'],
      tests_required: true,
      docker_validation: false,
      approval_required: true,
      status: PhaseStatus.PENDING,
      created_at: new Date(),
      updated_at: new Date()
    }
  ],
  environment_variables: {}
};

// Utility functions for type validation
export const validateAgentResponse = (data: unknown): AgentResponse => {
  return AgentResponseSchema.parse(data);
};

export const validateAgentState = (data: unknown): AgentState => {
  return AgentStateSchema.parse(data);
};

export const validateRoadmapItem = (data: unknown): RoadmapItem => {
  return RoadmapItemSchema.parse(data);
};

export const validateAgentCommand = (data: unknown): AgentCommand => {
  return AgentCommandSchema.parse(data);
};

export const validateAgentConfig = (data: unknown): AgentConfig => {
  return AgentConfigSchema.parse(data);
};

// Type guards
export const isAgentResponse = (data: unknown): data is AgentResponse => {
  try {
    AgentResponseSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

export const isAgentState = (data: unknown): data is AgentState => {
  try {
    AgentStateSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};

export const isTestResult = (data: unknown): data is TestResult => {
  try {
    TestResultSchema.parse(data);
    return true;
  } catch {
    return false;
  }
};
