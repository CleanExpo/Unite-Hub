/**
 * Wait Executor
 *
 * Executes wait nodes (delays/pauses)
 *
 * @module lib/workflows/executors/WaitExecutor
 */

import { createApiLogger } from '@/lib/logger';
import { VisualNode, ExecutionContext, WaitConfig } from '@/lib/models/social-drip-campaign';
import { NodeExecutor, NodeExecutionResult } from './NodeExecutor';

const logger = createApiLogger({ service: 'WaitExecutor' });

export class WaitExecutor extends NodeExecutor {
  async execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config: WaitConfig = node.data.config || context.current_step?.wait_config || {};

    logger.info('Executing wait node', {
      nodeId: node.id,
      waitType: config.type,
      contactId: context.contact.id,
    });

    if (!config.type) {
      throw new Error('Wait type not specified');
    }

    switch (config.type) {
      case 'duration':
        return this.executeDurationWait(node, context, config);

      case 'until_event':
        return this.executeEventWait(node, context, config);

      case 'until_time':
        return this.executeTimeWait(node, context, config);

      default:
        throw new Error(`Invalid wait type: ${config.type}`);
    }
  }

  /**
   * Execute duration-based wait
   */
  private async executeDurationWait(
    node: VisualNode,
    context: ExecutionContext,
    config: WaitConfig
  ): Promise<NodeExecutionResult> {
    if (!config.value || !config.unit) {
      throw new Error('Duration wait requires value and unit');
    }

    const waitMilliseconds = this.convertToMilliseconds(config.value, config.unit);
    const waitUntil = new Date(Date.now() + waitMilliseconds);

    logger.info('Duration wait scheduled', {
      nodeId: node.id,
      waitUntil,
      duration: `${config.value} ${config.unit}`,
    });

    return {
      success: true,
      wait: true,
      wait_until: waitUntil,
      eventData: {
        wait_type: 'duration',
        wait_duration: `${config.value} ${config.unit}`,
        wait_until: waitUntil.toISOString(),
      },
    };
  }

  /**
   * Execute event-based wait
   */
  private async executeEventWait(
    node: VisualNode,
    context: ExecutionContext,
    config: WaitConfig
  ): Promise<NodeExecutionResult> {
    if (!config.event_type) {
      throw new Error('Event wait requires event_type');
    }

    // Calculate maximum wait time
    const maxWaitMs = config.max_wait_duration
      ? config.max_wait_duration * 60 * 60 * 1000
      : 7 * 24 * 60 * 60 * 1000; // Default 7 days

    const waitUntil = new Date(Date.now() + maxWaitMs);

    logger.info('Event wait scheduled', {
      nodeId: node.id,
      eventType: config.event_type,
      maxWaitUntil: waitUntil,
    });

    return {
      success: true,
      wait: true,
      wait_for_event: config.event_type,
      wait_until: waitUntil, // Max wait time
      eventData: {
        wait_type: 'until_event',
        event_type: config.event_type,
        max_wait_until: waitUntil.toISOString(),
      },
    };
  }

  /**
   * Execute time-based wait
   */
  private async executeTimeWait(
    node: VisualNode,
    context: ExecutionContext,
    config: WaitConfig
  ): Promise<NodeExecutionResult> {
    let targetTime: Date;

    if (config.target_time) {
      targetTime = new Date(config.target_time);
    } else if (config.target_day_of_week !== undefined && config.target_hour !== undefined) {
      // Calculate next occurrence of day/time
      targetTime = this.getNextOccurrence(config.target_day_of_week, config.target_hour);
    } else {
      throw new Error('Time wait requires either target_time or target_day_of_week + target_hour');
    }

    // Ensure target time is in the future
    if (targetTime <= new Date()) {
      throw new Error('Target time must be in the future');
    }

    logger.info('Time wait scheduled', {
      nodeId: node.id,
      targetTime,
    });

    return {
      success: true,
      wait: true,
      wait_until: targetTime,
      eventData: {
        wait_type: 'until_time',
        target_time: targetTime.toISOString(),
      },
    };
  }

  validate(node: VisualNode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config: WaitConfig = node.data.config || {};

    if (!config.type) {
      errors.push('Wait type is required');
    }

    if (config.type === 'duration') {
      if (!config.value || config.value <= 0) {
        errors.push('Wait duration value must be positive');
      }

      if (!config.unit) {
        errors.push('Wait duration unit is required');
      }

      const validUnits = ['minutes', 'hours', 'days', 'weeks'];
      if (config.unit && !validUnits.includes(config.unit)) {
        errors.push(`Invalid wait unit: ${config.unit}`);
      }
    }

    if (config.type === 'until_event' && !config.event_type) {
      errors.push('Event type is required for event-based wait');
    }

    if (config.type === 'until_time') {
      if (!config.target_time && (config.target_day_of_week === undefined || config.target_hour === undefined)) {
        errors.push('Time wait requires either target_time or target_day_of_week + target_hour');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Convert duration to milliseconds
   */
  private convertToMilliseconds(value: number, unit: string): number {
    const conversions: Record<string, number> = {
      minutes: 60 * 1000,
      hours: 60 * 60 * 1000,
      days: 24 * 60 * 60 * 1000,
      weeks: 7 * 24 * 60 * 60 * 1000,
    };

    return value * (conversions[unit] || 0);
  }

  /**
   * Get next occurrence of day/hour combination
   */
  private getNextOccurrence(dayOfWeek: number, hour: number): Date {
    const now = new Date();
    const target = new Date(now);

    // Set target hour
    target.setHours(hour, 0, 0, 0);

    // Calculate days until target day of week
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;

    // If target day is today but time has passed, or target day is in the past this week
    if (daysUntil < 0 || (daysUntil === 0 && target <= now)) {
      daysUntil += 7;
    }

    target.setDate(target.getDate() + daysUntil);

    return target;
  }
}
