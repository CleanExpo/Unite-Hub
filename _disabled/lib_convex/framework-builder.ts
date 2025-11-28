/**
 * CONVEX Custom Framework Builder
 *
 * Implements framework creation and management:
 * - Create custom frameworks from templates or from scratch
 * - Validate framework structure
 * - Manage framework components
 * - Track framework usage and effectiveness
 * - Version framework changes
 */

import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export interface FrameworkComponent {
  id?: string;
  name: string;
  type: 'input' | 'section' | 'rule' | 'pattern' | 'metric';
  description?: string;
  properties?: Record<string, any>;
  validationRules?: Record<string, any>;
  examples?: any[];
  isReusable?: boolean;
}

export interface CustomFramework {
  id: string;
  workspace_id: string;
  name: string;
  description?: string;
  framework_type: 'positioning' | 'funnel' | 'seo' | 'competitor' | 'offer' | 'custom';
  components: FrameworkComponent[];
  rules?: Record<string, any>;
  reasoning_patterns?: Record<string, any>[];
  version: number;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  usage_count: number;
  last_used_at?: string;
}

export interface FrameworkTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  framework_data: any;
  preview_image?: string;
  downloads: number;
  rating: number;
  featured: boolean;
}

export interface FrameworkValidationResult {
  valid: boolean;
  errors: FrameworkValidationError[];
  warnings: string[];
}

export interface FrameworkValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// ============================================================================
// CUSTOM FRAMEWORK FUNCTIONS
// ============================================================================

/**
 * Create a new custom framework
 */
export async function createCustomFramework(
  workspaceId: string,
  userId: string,
  name: string,
  description: string,
  frameworkType: string,
  components: FrameworkComponent[],
  rules?: Record<string, any>,
  reasoningPatterns?: Record<string, any>[]
): Promise<CustomFramework | null> {
  try {
    // Validate framework before saving
    const validation = validateFramework({
      components,
      rules,
      reasoning_patterns: reasoningPatterns,
    });

    if (!validation.valid) {
      logger.warn('[FRAMEWORK-BUILDER] Validation failed:', validation.errors);
      throw new Error(`Framework validation failed: ${validation.errors[0].message}`);
    }

    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_custom_frameworks')
      .insert([
        {
          workspace_id: workspaceId,
          name,
          description,
          framework_type: frameworkType,
          components,
          rules,
          reasoning_patterns: reasoningPatterns || [],
          version: 1,
          created_by: userId,
          is_public: false,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('[FRAMEWORK-BUILDER] Creation error:', error);
      return null;
    }

    logger.info(`[FRAMEWORK-BUILDER] Framework created: ${name} (${data.id})`);
    return data as CustomFramework;
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Create error:', error);
    return null;
  }
}

/**
 * Get custom framework by ID
 */
export async function getCustomFramework(
  frameworkId: string,
  workspaceId: string
): Promise<CustomFramework | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_custom_frameworks')
      .select('*')
      .eq('id', frameworkId)
      .eq('workspace_id', workspaceId)
      .single();

    if (error) {
      logger.warn('[FRAMEWORK-BUILDER] Framework not found:', error);
      return null;
    }

    return data as CustomFramework;
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Get error:', error);
    return null;
  }
}

/**
 * List custom frameworks for workspace
 */
export async function listCustomFrameworks(
  workspaceId: string,
  limit: number = 50,
  offset: number = 0
): Promise<CustomFramework[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_custom_frameworks')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.warn('[FRAMEWORK-BUILDER] List error:', error);
      return [];
    }

    return (data || []) as CustomFramework[];
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] List error:', error);
    return [];
  }
}

/**
 * Update custom framework
 */
export async function updateCustomFramework(
  frameworkId: string,
  workspaceId: string,
  userId: string,
  updates: {
    name?: string;
    description?: string;
    components?: FrameworkComponent[];
    rules?: Record<string, any>;
    reasoning_patterns?: Record<string, any>[];
    is_public?: boolean;
  }
): Promise<CustomFramework | null> {
  try {
    const supabase = await getSupabaseServer();

    // Validate if components changed
    if (updates.components) {
      const validation = validateFramework({
        components: updates.components,
        rules: updates.rules,
        reasoning_patterns: updates.reasoning_patterns,
      });

      if (!validation.valid) {
        throw new Error(`Framework validation failed: ${validation.errors[0].message}`);
      }
    }

    // Get current version
    const { data: currentData } = await supabase
      .from('convex_custom_frameworks')
      .select('version')
      .eq('id', frameworkId)
      .single();

    const nextVersion = ((currentData?.version as number) || 0) + 1;

    // Update framework
    const { data, error } = await supabase
      .from('convex_custom_frameworks')
      .update({
        ...updates,
        version: nextVersion,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', frameworkId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      logger.error('[FRAMEWORK-BUILDER] Update error:', error);
      return null;
    }

    // Save version history
    await saveFrameworkVersion(
      frameworkId,
      workspaceId,
      nextVersion,
      updates.name || 'Framework updated',
      'Framework updated',
      userId
    );

    logger.info(`[FRAMEWORK-BUILDER] Framework updated: ${frameworkId}`);
    return data as CustomFramework;
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Update error:', error);
    return null;
  }
}

/**
 * Delete custom framework
 */
export async function deleteCustomFramework(
  frameworkId: string,
  workspaceId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('convex_custom_frameworks')
      .delete()
      .eq('id', frameworkId)
      .eq('workspace_id', workspaceId);

    if (error) {
      logger.error('[FRAMEWORK-BUILDER] Delete error:', error);
      return false;
    }

    logger.info(`[FRAMEWORK-BUILDER] Framework deleted: ${frameworkId}`);
    return true;
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Delete error:', error);
    return false;
  }
}

/**
 * Publish framework to public library
 */
export async function publishFramework(
  frameworkId: string,
  workspaceId: string,
  userId: string
): Promise<CustomFramework | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_custom_frameworks')
      .update({
        is_public: true,
        updated_at: new Date().toISOString(),
        updated_by: userId,
      })
      .eq('id', frameworkId)
      .eq('workspace_id', workspaceId)
      .select()
      .single();

    if (error) {
      logger.error('[FRAMEWORK-BUILDER] Publish error:', error);
      return null;
    }

    logger.info(`[FRAMEWORK-BUILDER] Framework published: ${frameworkId}`);
    return data as CustomFramework;
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Publish error:', error);
    return null;
  }
}

// ============================================================================
// FRAMEWORK TEMPLATE FUNCTIONS
// ============================================================================

/**
 * Get framework templates from library
 */
export async function getFrameworkTemplates(
  category?: string,
  featured: boolean = false,
  limit: number = 20
): Promise<FrameworkTemplate[]> {
  try {
    const supabase = await getSupabaseServer();

    let query = supabase
      .from('convex_framework_templates')
      .select('*')
      .eq('status', 'active');

    if (category) {
      query = query.eq('category', category);
    }

    if (featured) {
      query = query.eq('featured', true);
    }

    const { data, error } = await query
      .order('rating', { ascending: false })
      .order('downloads', { ascending: false })
      .limit(limit);

    if (error) {
      logger.warn('[FRAMEWORK-BUILDER] Template fetch error:', error);
      return [];
    }

    return (data || []) as FrameworkTemplate[];
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Template list error:', error);
    return [];
  }
}

/**
 * Clone framework template to workspace
 */
export async function cloneFrameworkTemplate(
  templateId: string,
  workspaceId: string,
  userId: string,
  customName?: string
): Promise<CustomFramework | null> {
  try {
    const supabase = await getSupabaseServer();

    // Get template
    const { data: templateData, error: templateError } = await supabase
      .from('convex_framework_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (templateError || !templateData) {
      logger.error('[FRAMEWORK-BUILDER] Template not found:', templateError);
      return null;
    }

    // Create framework from template
    const framework = await createCustomFramework(
      workspaceId,
      userId,
      customName || `${templateData.name} (Clone)`,
      templateData.description || '',
      templateData.category || 'custom',
      templateData.framework_data.components || [],
      templateData.framework_data.rules,
      templateData.framework_data.reasoning_patterns
    );

    if (framework) {
      // Increment download count
      await supabase
        .from('convex_framework_templates')
        .update({ downloads: templateData.downloads + 1 })
        .eq('id', templateId);

      logger.info(
        `[FRAMEWORK-BUILDER] Template cloned: ${templateId} -> ${framework.id}`
      );
    }

    return framework;
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Clone error:', error);
    return null;
  }
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate framework structure
 */
export function validateFramework(framework: any): FrameworkValidationResult {
  const errors: FrameworkValidationError[] = [];
  const warnings: string[] = [];

  // Validate components
  if (!framework.components || !Array.isArray(framework.components)) {
    errors.push({
      field: 'components',
      message: 'Components must be an array',
      severity: 'error',
    });
  } else if (framework.components.length === 0) {
    errors.push({
      field: 'components',
      message: 'Framework must have at least one component',
      severity: 'error',
    });
  } else {
    framework.components.forEach((component: any, index: number) => {
      if (!component.name) {
        errors.push({
          field: `components[${index}].name`,
          message: 'Component name is required',
          severity: 'error',
        });
      }
      if (!component.type) {
        errors.push({
          field: `components[${index}].type`,
          message: 'Component type is required',
          severity: 'error',
        });
      }
      if (!['input', 'section', 'rule', 'pattern', 'metric'].includes(component.type)) {
        errors.push({
          field: `components[${index}].type`,
          message: `Invalid component type: ${component.type}`,
          severity: 'error',
        });
      }
    });
  }

  // Validate rules if present
  if (framework.rules && typeof framework.rules !== 'object') {
    errors.push({
      field: 'rules',
      message: 'Rules must be an object',
      severity: 'error',
    });
  }

  // Validate reasoning patterns if present
  if (framework.reasoning_patterns) {
    if (!Array.isArray(framework.reasoning_patterns)) {
      errors.push({
        field: 'reasoning_patterns',
        message: 'Reasoning patterns must be an array',
        severity: 'error',
      });
    } else {
      framework.reasoning_patterns.forEach((pattern: any, index: number) => {
        if (!pattern.name) {
          warnings.push(`Reasoning pattern ${index} has no name`);
        }
      });
    }
  }

  return {
    valid: errors.filter((e) => e.severity === 'error').length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// FRAMEWORK USAGE TRACKING
// ============================================================================

/**
 * Track framework usage and effectiveness
 */
export async function recordFrameworkUsage(
  workspaceId: string,
  frameworkId: string,
  strategyId: string,
  metrics: {
    effectiveness_score?: number;
    completion_rate?: number;
    conversion_rate?: number;
    adoption_time_days?: number;
    user_feedback?: string;
  }
): Promise<any | null> {
  try {
    const supabase = await getSupabaseServer();

    // Update framework usage count
    const { data: framework } = await supabase
      .from('convex_custom_frameworks')
      .select('usage_count')
      .eq('id', frameworkId)
      .single();

    if (framework) {
      await supabase
        .from('convex_custom_frameworks')
        .update({
          usage_count: (framework.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', frameworkId);
    }

    // Record usage metrics
    const { data, error } = await supabase
      .from('convex_framework_usage')
      .insert([
        {
          workspace_id: workspaceId,
          framework_id: frameworkId,
          strategy_id: strategyId,
          ...metrics,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('[FRAMEWORK-BUILDER] Usage tracking error:', error);
      return null;
    }

    logger.info(
      `[FRAMEWORK-BUILDER] Framework usage recorded: ${frameworkId} -> ${strategyId}`
    );
    return data;
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Usage error:', error);
    return null;
  }
}

/**
 * Get framework effectiveness metrics
 */
export async function getFrameworkMetrics(
  frameworkId: string,
  workspaceId: string
): Promise<any | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_framework_usage')
      .select('*')
      .eq('framework_id', frameworkId)
      .eq('workspace_id', workspaceId);

    if (error) {
      logger.warn('[FRAMEWORK-BUILDER] Metrics fetch error:', error);
      return null;
    }

    const usageData = data || [];

    if (usageData.length === 0) {
      return {
        usage_count: 0,
        avg_effectiveness: 0,
        avg_completion_rate: 0,
        avg_conversion_rate: 0,
        avg_adoption_time: 0,
      };
    }

    const avgEffectiveness =
      usageData.reduce((sum, item) => sum + (item.effectiveness_score || 0), 0) /
      usageData.length;
    const avgCompletion =
      usageData.reduce((sum, item) => sum + (item.completion_rate || 0), 0) /
      usageData.length;
    const avgConversion =
      usageData.reduce((sum, item) => sum + (item.conversion_rate || 0), 0) /
      usageData.length;
    const avgAdoption =
      usageData.reduce((sum, item) => sum + (item.adoption_time_days || 0), 0) /
      usageData.length;

    return {
      usage_count: usageData.length,
      avg_effectiveness: avgEffectiveness.toFixed(2),
      avg_completion_rate: avgCompletion.toFixed(2),
      avg_conversion_rate: avgConversion.toFixed(2),
      avg_adoption_time: avgAdoption.toFixed(2),
    };
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Metrics error:', error);
    return null;
  }
}

// ============================================================================
// FRAMEWORK VERSIONING
// ============================================================================

/**
 * Save framework version
 */
export async function saveFrameworkVersion(
  frameworkId: string,
  workspaceId: string,
  version: number,
  name: string,
  changeSummary: string,
  userId: string,
  components?: FrameworkComponent[],
  rules?: Record<string, any>,
  reasoningPatterns?: Record<string, any>[]
): Promise<any | null> {
  try {
    const supabase = await getSupabaseServer();

    // Get current framework if not provided
    let frameworkData;
    if (!components || !rules) {
      const { data } = await supabase
        .from('convex_custom_frameworks')
        .select('*')
        .eq('id', frameworkId)
        .single();
      frameworkData = data;
    }

    const { data, error } = await supabase
      .from('convex_framework_versions')
      .insert([
        {
          framework_id: frameworkId,
          workspace_id: workspaceId,
          version,
          name,
          components: components || frameworkData?.components,
          rules: rules || frameworkData?.rules,
          reasoning_patterns: reasoningPatterns || frameworkData?.reasoning_patterns,
          change_summary: changeSummary,
          changed_by: userId,
        },
      ])
      .select()
      .single();

    if (error) {
      logger.error('[FRAMEWORK-BUILDER] Version save error:', error);
      return null;
    }

    logger.info(
      `[FRAMEWORK-BUILDER] Framework version saved: v${version} of ${frameworkId}`
    );
    return data;
  } catch (error) {
    logger.error('[FRAMEWORK-BUILDER] Version error:', error);
    return null;
  }
}
