/**
 * Founder Ops Brand Binding
 *
 * Brand-aware task routing and validation using the Brand Matrix.
 * Ensures all tasks respect brand context, cross-link rules, and positioning.
 *
 * Key Features:
 * - Brand context injection for all tasks
 * - Cross-link rule validation
 * - Brand-specific task recommendations
 * - Brand workload distribution
 * - Integration with v1_1_02 Brand Matrix
 *
 * @module founderOps/founderOpsBrandBinding
 */

import { createApiLogger } from '@/lib/logger';
import { brandRegistry } from '@/lib/brands/brandRegistry';
import { brandContextResolver } from '@/lib/brands/brandContextResolver';
import type { Brand } from '@/lib/brands/brandRegistry';
import type { BrandContext } from '@/lib/brands/brandContextResolver';
import type { FounderTask, TaskArchetype } from './founderOpsTaskLibrary';
import { TASK_LIBRARY } from './founderOpsTaskLibrary';

const logger = createApiLogger({ route: '/founder-ops/brand-binding' });

// ====================================
// Types
// ====================================

export interface BrandTaskMetrics {
  brand_slug: string;
  total_tasks: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_archetype: Record<TaskArchetype, number>;
  total_duration_minutes: number;
  pending_approvals: number;
  next_deadline?: string;
}

export interface BrandTaskRecommendation {
  brand_slug: string;
  archetype: TaskArchetype;
  reason: string;
  priority: 'low' | 'medium' | 'high';
  estimated_impact: 'low' | 'medium' | 'high';
}

export interface BrandWorkloadSummary {
  brand_slug: string;
  brand_name: string;
  domain: string;
  current_workload: number; // Number of active tasks
  capacity_percentage: number; // 0-100
  is_overloaded: boolean;
  recommended_capacity: number;
  next_available_slot?: string;
  metrics: BrandTaskMetrics;
}

// ====================================
// Founder Ops Brand Binding Class
// ====================================

export class FounderOpsBrandBinding {
  private workspaceId: string;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  // ====================================
  // Brand Task Assignment
  // ====================================

  /**
   * Assign task to a brand
   */
  async assignTaskToBrand(taskId: string, brandSlug: string): Promise<void> {
    logger.info('Assigning task to brand', {
      workspaceId: this.workspaceId,
      taskId,
      brandSlug,
    });

    // Validate brand exists
    const brand = await brandRegistry.getBrandBySlug(brandSlug);
    if (!brand) {
      throw new Error(`Invalid brand: ${brandSlug}`);
    }

    // TODO: Update task in database with brand_slug

    logger.info('Task assigned to brand', { taskId, brandSlug });
  }

  /**
   * Reassign task to different brand
   */
  async reassignTaskToBrand(
    taskId: string,
    newBrandSlug: string,
    userId: string
  ): Promise<void> {
    logger.info('Reassigning task to different brand', {
      workspaceId: this.workspaceId,
      taskId,
      newBrandSlug,
      userId,
    });

    // Validate new brand exists
    const brand = await brandRegistry.getBrandBySlug(newBrandSlug);
    if (!brand) {
      throw new Error(`Invalid brand: ${newBrandSlug}`);
    }

    // TODO: Update task in database
    // TODO: Log reassignment to audit logs

    logger.info('Task reassigned to brand', { taskId, newBrandSlug });
  }

  // ====================================
  // Brand Task Validation
  // ====================================

  /**
   * Validate task against brand context
   */
  async validateBrandTask(task: FounderTask): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    logger.info('Validating task against brand context', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      brandSlug: task.brand_slug,
      archetype: task.archetype,
    });

    const errors: string[] = [];
    const warnings: string[] = [];

    // Get brand context
    const brandContext = await brandContextResolver.resolveBrandContext(task.brand_slug);
    if (!brandContext) {
      errors.push(`Invalid brand: ${task.brand_slug}`);
      return { valid: false, errors, warnings };
    }

    // Validate cross-link rules if task references other brands
    if (task.metadata?.referenced_brands) {
      const referencedBrands = task.metadata.referenced_brands as string[];

      for (const refBrand of referencedBrands) {
        if (!brandContext.allowed_references.includes(refBrand)) {
          errors.push(
            `Brand ${task.brand_slug} cannot reference ${refBrand} (cross-link rule violation)`
          );
        }
      }
    }

    // Validate task archetype is appropriate for brand
    const taskDef = TASK_LIBRARY[task.archetype];
    if (taskDef && taskDef.requires_brand_context) {
      // Check if task channels align with brand's recommended channels
      const brandChannels = brandContext.brand.metadata?.recommended_channels || [];
      if (brandChannels.length > 0) {
        const hasValidChannel = task.channels.some((ch) => brandChannels.includes(ch));
        if (!hasValidChannel) {
          warnings.push(
            `Task channels ${task.channels.join(', ')} may not align with brand's recommended channels`
          );
        }
      }
    }

    // Check if founder approval is required
    if (brandContext.restrictions.founder_approval_required) {
      const requiresApproval = await brandContextResolver.requiresFounderApproval(
        task.brand_slug,
        'content_publish'
      );

      if (requiresApproval && !taskDef?.requires_founder_approval) {
        warnings.push(
          `Brand ${task.brand_slug} requires founder approval but task archetype doesn't enforce it`
        );
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Enrich task with brand context
   */
  async enrichTaskWithBrandContext(task: FounderTask): Promise<FounderTask> {
    logger.info('Enriching task with brand context', {
      workspaceId: this.workspaceId,
      taskId: task.id,
      brandSlug: task.brand_slug,
    });

    // Get brand context
    const brandContext = await brandContextResolver.resolveBrandContext(task.brand_slug);
    if (!brandContext) {
      logger.warn('Could not enrich task - invalid brand', { brandSlug: task.brand_slug });
      return task;
    }

    // Enrich task metadata with brand context
    const enrichedTask: FounderTask = {
      ...task,
      metadata: {
        ...task.metadata,
        brand_context: {
          tone_of_voice: brandContext.content_guidelines.tone_of_voice,
          positioning_keywords: brandContext.content_guidelines.positioning_keywords,
          target_audience: brandContext.content_guidelines.target_audience,
          content_themes: brandContext.content_guidelines.content_themes,
          allowed_references: brandContext.allowed_references,
        },
      },
    };

    logger.info('Task enriched with brand context', { taskId: task.id });

    return enrichedTask;
  }

  // ====================================
  // Brand Task Metrics
  // ====================================

  /**
   * Get task metrics for a specific brand
   */
  async getBrandTaskMetrics(brandSlug: string): Promise<BrandTaskMetrics> {
    logger.info('Fetching brand task metrics', {
      workspaceId: this.workspaceId,
      brandSlug,
    });

    // TODO: Calculate from database
    // For now, return mock metrics

    const metrics: BrandTaskMetrics = {
      brand_slug: brandSlug,
      total_tasks: 0,
      by_status: {},
      by_priority: {},
      by_archetype: {} as Record<TaskArchetype, number>,
      total_duration_minutes: 0,
      pending_approvals: 0,
    };

    return metrics;
  }

  /**
   * Get workload summary for all brands
   */
  async getAllBrandWorkloads(): Promise<BrandWorkloadSummary[]> {
    logger.info('Fetching all brand workloads', {
      workspaceId: this.workspaceId,
    });

    // Get all brands
    const brands = await brandRegistry.getAllBrands();

    // Get metrics for each brand
    const workloads: BrandWorkloadSummary[] = [];

    for (const brand of brands) {
      const metrics = await this.getBrandTaskMetrics(brand.slug);

      // Calculate capacity (simple heuristic: 100 tasks = 100%)
      const capacity = Math.min(100, (metrics.total_tasks / 100) * 100);
      const isOverloaded = capacity > 80;

      const workload: BrandWorkloadSummary = {
        brand_slug: brand.slug,
        brand_name: brand.slug,
        domain: brand.domain,
        current_workload: metrics.total_tasks,
        capacity_percentage: Math.round(capacity),
        is_overloaded: isOverloaded,
        recommended_capacity: 100,
        metrics,
      };

      workloads.push(workload);
    }

    return workloads;
  }

  // ====================================
  // Brand Task Recommendations
  // ====================================

  /**
   * Get task recommendations for a brand
   */
  async getBrandTaskRecommendations(brandSlug: string): Promise<BrandTaskRecommendation[]> {
    logger.info('Generating task recommendations', {
      workspaceId: this.workspaceId,
      brandSlug,
    });

    const recommendations: BrandTaskRecommendation[] = [];

    // Get brand context
    const brandContext = await brandContextResolver.resolveBrandContext(brandSlug);
    if (!brandContext) {
      return recommendations;
    }

    // Get current task metrics
    const metrics = await this.getBrandTaskMetrics(brandSlug);

    // Recommend social posts if none exist
    if (!metrics.by_archetype.social_post_single || metrics.by_archetype.social_post_single === 0) {
      recommendations.push({
        brand_slug: brandSlug,
        archetype: 'social_post_single',
        reason: 'No social media posts scheduled. Recommended to maintain brand presence.',
        priority: 'high',
        estimated_impact: 'medium',
      });
    }

    // Recommend blog posts if content themes exist
    if (brandContext.content_guidelines.content_themes.length > 0) {
      recommendations.push({
        brand_slug: brandSlug,
        archetype: 'blog_draft',
        reason: `Brand has ${brandContext.content_guidelines.content_themes.length} content themes. Blog posts would leverage these effectively.`,
        priority: 'medium',
        estimated_impact: 'high',
      });
    }

    // Recommend email if target audience is defined
    if (brandContext.content_guidelines.target_audience.length > 0) {
      recommendations.push({
        brand_slug: brandSlug,
        archetype: 'email_draft',
        reason: `Brand has defined target audience. Email campaigns would be effective.`,
        priority: 'medium',
        estimated_impact: 'medium',
      });
    }

    return recommendations;
  }

  /**
   * Get cross-brand task opportunities
   */
  async getCrossBrandOpportunities(): Promise<
    Array<{
      source_brand: string;
      target_brands: string[];
      opportunity_type: string;
      description: string;
    }>
  > {
    logger.info('Identifying cross-brand opportunities', {
      workspaceId: this.workspaceId,
    });

    const opportunities: Array<{
      source_brand: string;
      target_brands: string[];
      opportunity_type: string;
      description: string;
    }> = [];

    // Get all brands
    const brands = await brandRegistry.getAllBrands();

    // Check for brands with cross-links
    for (const brand of brands) {
      if (brand.cross_links && brand.cross_links.length > 0) {
        opportunities.push({
          source_brand: brand.slug,
          target_brands: brand.cross_links,
          opportunity_type: 'cross_promotion',
          description: `${brand.slug} can cross-reference ${brand.cross_links.join(', ')} in content`,
        });
      }
    }

    return opportunities;
  }

  // ====================================
  // Brand Task Distribution
  // ====================================

  /**
   * Get recommended task distribution across brands
   */
  async getRecommendedTaskDistribution(): Promise<
    Record<
      string,
      {
        recommended_tasks: number;
        current_tasks: number;
        delta: number;
      }
    >
  > {
    logger.info('Calculating recommended task distribution', {
      workspaceId: this.workspaceId,
    });

    const distribution: Record<
      string,
      {
        recommended_tasks: number;
        current_tasks: number;
        delta: number;
      }
    > = {};

    // Get all brands
    const brands = await brandRegistry.getAllBrands();

    // Simple heuristic: equal distribution
    const totalBrands = brands.length;
    const recommendedPerBrand = 20; // 20 tasks per brand

    for (const brand of brands) {
      const metrics = await this.getBrandTaskMetrics(brand.slug);

      distribution[brand.slug] = {
        recommended_tasks: recommendedPerBrand,
        current_tasks: metrics.total_tasks,
        delta: recommendedPerBrand - metrics.total_tasks,
      };
    }

    return distribution;
  }
}

/**
 * Create Founder Ops Brand Binding instance
 */
export function createFounderOpsBrandBinding(workspaceId: string): FounderOpsBrandBinding {
  return new FounderOpsBrandBinding(workspaceId);
}
