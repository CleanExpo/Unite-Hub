/**
 * Workflow Execution Engine
 *
 * Core workflow execution system for social drip campaigns
 *
 * @module lib/workflows
 */

export { WorkflowEngine } from './WorkflowEngine';
export { StateManager } from './StateManager';
export { EventLogger } from './EventLogger';

// Executors
export { NodeExecutor } from './executors/NodeExecutor';
export { TriggerExecutor } from './executors/TriggerExecutor';
export { EmailExecutor } from './executors/EmailExecutor';
export { WaitExecutor } from './executors/WaitExecutor';
export { ConditionExecutor } from './executors/ConditionExecutor';
export { SplitExecutor } from './executors/SplitExecutor';
export { ActionExecutor } from './executors/ActionExecutor';
export { ExitExecutor } from './executors/ExitExecutor';

// Types
export type { NodeExecutionResult } from './executors/NodeExecutor';
export type { WorkflowEngineConfig } from './WorkflowEngine';
