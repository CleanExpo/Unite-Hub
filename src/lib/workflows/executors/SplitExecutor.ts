/**
 * Split Executor
 *
 * Executes split nodes (A/B testing, traffic splits)
 *
 * @module lib/workflows/executors/SplitExecutor
 */

import { createApiLogger } from '@/lib/logger';
import { VisualNode, ExecutionContext, ABTestVariant } from '@/lib/models/social-drip-campaign';
import { NodeExecutor, NodeExecutionResult } from './NodeExecutor';

const logger = createApiLogger({ service: 'SplitExecutor' });

export class SplitExecutor extends NodeExecutor {
  async execute(node: VisualNode, context: ExecutionContext): Promise<NodeExecutionResult> {
    const config = node.data.config || {};
    const splitType = config.type || 'random';
    const variants: ABTestVariant[] = config.variants || [];

    if (variants.length === 0) {
      throw new Error('Split node has no variants');
    }

    logger.info('Executing split node', {
      nodeId: node.id,
      contactId: context.contact.id,
      splitType,
      variantCount: variants.length,
    });

    // Check if contact already assigned to variant
    if (context.workflow_state.assigned_variant) {
      logger.info('Contact already assigned to variant', {
        variant: context.workflow_state.assigned_variant,
      });

      const assignedVariant = variants.find(
        (v) => v.id === context.workflow_state.assigned_variant
      );

      if (assignedVariant) {
        return {
          success: true,
          variantId: assignedVariant.id,
          eventData: {
            variant_id: assignedVariant.id,
            variant_name: assignedVariant.name,
            already_assigned: true,
          },
        };
      }
    }

    // Assign variant based on type
    let selectedVariant: ABTestVariant;

    if (splitType === 'ab_test') {
      selectedVariant = this.assignABTestVariant(variants, context);
    } else {
      selectedVariant = this.assignRandomVariant(variants);
    }

    logger.info('Variant assigned', {
      nodeId: node.id,
      contactId: context.contact.id,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
    });

    return {
      success: true,
      variantId: selectedVariant.id,
      eventData: {
        variant_id: selectedVariant.id,
        variant_name: selectedVariant.name,
        variant_percentage: selectedVariant.percentage,
        split_type: splitType,
      },
    };
  }

  /**
   * Assign A/B test variant with consistent distribution
   */
  private assignABTestVariant(
    variants: ABTestVariant[],
    context: ExecutionContext
  ): ABTestVariant {
    // Use contact ID hash for consistent assignment
    const contactIdHash = this.hashContactId(context.contact.id);

    // Calculate cumulative percentages
    let cumulative = 0;
    const ranges: Array<{ variant: ABTestVariant; min: number; max: number }> = [];

    for (const variant of variants) {
      const min = cumulative;
      const max = cumulative + variant.percentage;
      ranges.push({ variant, min, max });
      cumulative = max;
    }

    // Normalize hash to 0-100 range
    const normalizedHash = (contactIdHash % 10000) / 100;

    // Find matching range
    const match = ranges.find((r) => normalizedHash >= r.min && normalizedHash < r.max);

    return match?.variant || variants[0];
  }

  /**
   * Assign random variant (weighted by percentage)
   */
  private assignRandomVariant(variants: ABTestVariant[]): ABTestVariant {
    const random = Math.random() * 100;

    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.percentage;
      if (random < cumulative) {
        return variant;
      }
    }

    return variants[variants.length - 1];
  }

  /**
   * Hash contact ID to deterministic number
   */
  private hashContactId(contactId: string): number {
    let hash = 0;
    for (let i = 0; i < contactId.length; i++) {
      const char = contactId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }

    return Math.abs(hash);
  }

  validate(node: VisualNode): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = node.data.config || {};
    const variants: ABTestVariant[] = config.variants || [];

    if (!config.type) {
      errors.push('Split type is required');
    }

    const validTypes = ['ab_test', 'random'];
    if (config.type && !validTypes.includes(config.type)) {
      errors.push(`Invalid split type: ${config.type}`);
    }

    if (variants.length === 0) {
      errors.push('Split node must have at least one variant');
    }

    if (variants.length < 2) {
      errors.push('Split node should have at least 2 variants');
    }

    // Validate percentages sum to 100
    const totalPercentage = variants.reduce((sum, v) => sum + (v.percentage || 0), 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      errors.push(`Variant percentages must sum to 100 (current: ${totalPercentage})`);
    }

    variants.forEach((variant, index) => {
      if (!variant.id) {
        errors.push(`Variant ${index} missing ID`);
      }

      if (!variant.name) {
        errors.push(`Variant ${index} missing name`);
      }

      if (variant.percentage === undefined || variant.percentage < 0 || variant.percentage > 100) {
        errors.push(`Variant ${index} has invalid percentage`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
