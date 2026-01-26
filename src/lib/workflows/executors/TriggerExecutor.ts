/**
 * Trigger Executor
 *
 * Executes trigger nodes (campaign entry points)
 *
 * @module lib/workflows/executors/TriggerExecutor
 */

import { createApiLogger } from '@/lib/logger';
import { VisualNode, ExecutionContext } from '@/lib/models/social-drip-campaign';
import { NodeExecutor, NodeExecutionResult } from './NodeExecutor';

const logger = createApiLogger({ service: 'TriggerExecutor' });

export class TriggerExecutor extends NodeExecutor {
  async execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config = node.data.config || {};
    const triggerType = config.trigger_type || 'manual';

    logger.info('Executing trigger node', {
      nodeId: node.id,
      triggerType,
      contactId: context.contact.id,
    });

    // Trigger nodes just mark the start of the workflow
    // Actual triggering logic is handled by enrollment
    return {
      success: true,
      eventData: {
        trigger_type: triggerType,
        trigger_config: config.trigger_config,
      },
    };
  }

  validate(node: VisualNode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = node.data.config || {};

    if (!config.trigger_type) {
      errors.push('Trigger type is required');
    }

    const validTypes = ['manual', 'new_contact', 'tag', 'score_threshold', 'webhook', 'scheduled'];
    if (config.trigger_type && !validTypes.includes(config.trigger_type)) {
      errors.push(`Invalid trigger type: ${config.trigger_type}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
