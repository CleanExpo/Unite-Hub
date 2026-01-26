/**
 * Node Executor Base Interface
 *
 * Base interface for all node type executors
 *
 * @module lib/workflows/executors/NodeExecutor
 */

import { VisualNode, ExecutionContext } from '@/lib/models/social-drip-campaign';

export interface NodeExecutionResult {
  success: boolean;
  eventData?: Record<string, any>;

  // For wait nodes
  wait?: boolean;
  wait_until?: Date;
  wait_for_event?: string;

  // For exit nodes
  exit?: boolean;
  exit_reason?: string;

  // For condition nodes
  branchId?: string;

  // For split nodes
  variantId?: string;

  // Additional data
  [key: string]: any;
}

/**
 * Base class for node executors
 */
export abstract class NodeExecutor {
  /**
   * Execute node logic
   */
  abstract execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult>;

  /**
   * Validate node configuration
   */
  abstract validate(node: VisualNode): { valid: boolean; errors: string[] };
}
