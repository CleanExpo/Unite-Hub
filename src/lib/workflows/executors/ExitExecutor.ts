/**
 * Exit Executor
 *
 * Executes exit nodes (workflow termination)
 *
 * @module lib/workflows/executors/ExitExecutor
 */

import { createApiLogger } from '@/lib/logger';
import { VisualNode, ExecutionContext } from '@/lib/models/social-drip-campaign';
import { NodeExecutor, NodeExecutionResult } from './NodeExecutor';

const logger = createApiLogger({ service: 'ExitExecutor' });

export class ExitExecutor extends NodeExecutor {
  async execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config = node.data.config || {};
    const exitReason = config.reason || 'Workflow completed';

    logger.info('Executing exit node', {
      nodeId: node.id,
      contactId: context.contact.id,
      exitReason,
    });

    return {
      success: true,
      exit: true,
      exit_reason: exitReason,
      eventData: {
        exit_reason: exitReason,
      },
    };
  }

  validate(node: VisualNode): { valid: boolean; errors: string[] } {
    // Exit nodes have no required configuration
    return {
      valid: true,
      errors: [],
    };
  }
}
