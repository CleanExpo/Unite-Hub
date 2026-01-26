/**
 * Condition Executor
 *
 * Executes condition nodes (branching logic)
 *
 * @module lib/workflows/executors/ConditionExecutor
 */

import { createApiLogger } from '@/lib/logger';
import { VisualNode, ExecutionContext, Condition, ConditionalBranch } from '@/lib/models/social-drip-campaign';
import { NodeExecutor, NodeExecutionResult } from './NodeExecutor';

const logger = createApiLogger({ service: 'ConditionExecutor' });

export class ConditionExecutor extends NodeExecutor {
  async execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config = node.data.config || {};
    const branches: ConditionalBranch[] = config.branches || context.current_step?.conditional_branches || [];

    if (branches.length === 0) {
      throw new Error('Condition node has no branches');
    }

    logger.info('Executing condition node', {
      nodeId: node.id,
      contactId: context.contact.id,
      branchCount: branches.length,
    });

    // Evaluate branches in order
    for (const branch of branches) {
      const result = await this.evaluateCondition(branch.condition, context);

      if (result) {
        logger.info('Condition branch matched', {
          nodeId: node.id,
          branchId: branch.id,
          branchLabel: branch.label,
        });

        return {
          success: true,
          branchId: branch.id,
          eventData: {
            branch_id: branch.id,
            branch_label: branch.label,
            condition_type: branch.condition.type,
          },
        };
      }
    }

    // No branch matched - use default/false branch
    const defaultBranch = branches.find((b) => b.condition.type === 'default');
    if (defaultBranch) {
      logger.info('Using default branch', { nodeId: node.id });

      return {
        success: true,
        branchId: defaultBranch.id,
        eventData: {
          branch_id: defaultBranch.id,
          branch_label: 'default',
        },
      };
    }

    throw new Error('No condition matched and no default branch found');
  }

  /**
   * Evaluate condition against context
   */
  private async evaluateCondition(condition: Condition, context: ExecutionContext): Promise<boolean> {
    switch (condition.type) {
      case 'field':
        return this.evaluateFieldCondition(condition, context);

      case 'score':
        return this.evaluateScoreCondition(condition, context);

      case 'tag':
        return this.evaluateTagCondition(condition, context);

      case 'event':
        return this.evaluateEventCondition(condition, context);

      case 'time':
        return this.evaluateTimeCondition(condition, context);

      case 'composite':
        return this.evaluateCompositeCondition(condition, context);

      default:
        logger.warn('Unknown condition type', { type: condition.type });
        return false;
    }
  }

  /**
   * Evaluate field condition
   */
  private evaluateFieldCondition(condition: Condition, context: ExecutionContext): boolean {
    if (!condition.field) return false;

    const contact = context.contact;
    const fieldValue = contact[condition.field];

    return this.compareValues(fieldValue, condition.value, condition.operator);
  }

  /**
   * Evaluate score condition
   */
  private evaluateScoreCondition(condition: Condition, context: ExecutionContext): boolean {
    const contactScore = context.contact.score || 0;
    const targetScore = condition.value || 0;

    return this.compareValues(contactScore, targetScore, condition.operator);
  }

  /**
   * Evaluate tag condition
   */
  private evaluateTagCondition(condition: Condition, context: ExecutionContext): boolean {
    const contactTags = context.contact.tags || [];
    const targetTag = condition.value;

    if (condition.operator === 'exists' || condition.operator === 'contains') {
      return contactTags.includes(targetTag);
    }

    if (condition.operator === 'not_exists' || condition.operator === 'not_contains') {
      return !contactTags.includes(targetTag);
    }

    return false;
  }

  /**
   * Evaluate event condition
   */
  private async evaluateEventCondition(condition: Condition, context: ExecutionContext): Promise<boolean> {
    if (!condition.event_type) return false;

    // Check if event occurred within time window
    // TODO: Query campaign_events table
    // For now, return false (will be implemented with event tracking)
    logger.warn('Event condition evaluation not fully implemented', {
      eventType: condition.event_type,
    });

    return false;
  }

  /**
   * Evaluate time condition
   */
  private evaluateTimeCondition(condition: Condition, context: ExecutionContext): boolean {
    const now = new Date();
    const targetTime = condition.value ? new Date(condition.value) : null;

    if (!targetTime) return false;

    return this.compareValues(now.getTime(), targetTime.getTime(), condition.operator);
  }

  /**
   * Evaluate composite condition (AND/OR logic)
   */
  private async evaluateCompositeCondition(condition: Condition, context: ExecutionContext): Promise<boolean> {
    if (!condition.sub_conditions || condition.sub_conditions.length === 0) {
      return false;
    }

    const results = await Promise.all(
      condition.sub_conditions.map((subCondition) => this.evaluateCondition(subCondition, context))
    );

    if (condition.logic === 'AND') {
      return results.every((r) => r === true);
    } else {
      // Default to OR
      return results.some((r) => r === true);
    }
  }

  /**
   * Compare values using operator
   */
  private compareValues(leftValue: any, rightValue: any, operator: string): boolean {
    switch (operator) {
      case '==':
        return leftValue == rightValue;

      case '!=':
        return leftValue != rightValue;

      case '>':
        return leftValue > rightValue;

      case '<':
        return leftValue < rightValue;

      case '>=':
        return leftValue >= rightValue;

      case '<=':
        return leftValue <= rightValue;

      case 'contains':
        return String(leftValue).includes(String(rightValue));

      case 'not_contains':
        return !String(leftValue).includes(String(rightValue));

      case 'exists':
        return leftValue !== null && leftValue !== undefined;

      case 'not_exists':
        return leftValue === null || leftValue === undefined;

      case 'in':
        return Array.isArray(rightValue) && rightValue.includes(leftValue);

      case 'not_in':
        return Array.isArray(rightValue) && !rightValue.includes(leftValue);

      default:
        logger.warn('Unknown operator', { operator });
        return false;
    }
  }

  validate(node: VisualNode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = node.data.config || {};
    const branches: ConditionalBranch[] = config.branches || [];

    if (branches.length === 0) {
      errors.push('Condition node must have at least one branch');
    }

    branches.forEach((branch, index) => {
      if (!branch.id) {
        errors.push(`Branch ${index} missing ID`);
      }

      if (!branch.condition) {
        errors.push(`Branch ${index} missing condition`);
      } else {
        if (!branch.condition.type) {
          errors.push(`Branch ${index} condition missing type`);
        }

        if (branch.condition.type === 'field' && !branch.condition.field) {
          errors.push(`Branch ${index} field condition missing field name`);
        }

        if (branch.condition.type === 'composite' && !branch.condition.sub_conditions) {
          errors.push(`Branch ${index} composite condition missing sub-conditions`);
        }
      }

      if (!branch.target_node_id) {
        errors.push(`Branch ${index} missing target_node_id`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
