/**
 * CONVEX Strategy Persistence Layer
 *
 * Handles saving and retrieving CONVEX strategies from database
 * - Stores strategies in convex_strategy_scores table
 * - Tracks strategy metadata and compliance status
 * - Provides workspace isolation and audit logging
 * - Implements caching for performance
 */

import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export interface StoredStrategy {
  id: string;
  workspace_id: string;
  strategy_id: string;
  framework_id: string | null;
  strategy_content: string;
  convex_score: number; // 0-100
  compliance_status: 'pass' | 'needs_revision' | 'fail';
  scoring_details: {
    clarity: number;
    specificity: number;
    outcomeFocus: number;
    proof: number;
    riskRemoval: number;
    compliance: string;
  };
  execution_plan: string[];
  success_metrics: string[];
  frameworks: string[];
  metadata: {
    businessName: string;
    industry: string;
    targetAudience: string;
    desiredOutcome: string;
    framework: string;
  };
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface StrategyListItem {
  id: string;
  strategy_id: string;
  framework: string;
  businessName: string;
  convex_score: number;
  compliance_status: string;
  created_at: string;
}

// ============================================================================
// STRATEGY PERSISTENCE
// ============================================================================

/**
 * Save a CONVEX strategy to the database
 */
export async function saveStrategy(
  workspaceId: string,
  userId: string,
  strategyData: {
    strategyId: string;
    strategy: string;
    score: {
      overallScore: number;
      clarity: number;
      specificity: number;
      outcomeFocus: number;
      proof: number;
      riskRemoval: number;
      compliance: 'pass' | 'needs_revision' | 'fail';
    };
    frameworks: string[];
    executionPlan: string[];
    successMetrics: string[];
    metadata: {
      businessName: string;
      industry: string;
      targetAudience: string;
      desiredOutcome: string;
      framework: string;
    };
  }
): Promise<StoredStrategy | null> {
  try {
    const supabase = await getSupabaseServer();

    // Determine compliance status based on score
    let complianceStatus: 'pass' | 'needs_revision' | 'fail' = 'needs_revision';
    if (strategyData.score.overallScore >= 80) {
      complianceStatus = 'pass';
    } else if (strategyData.score.overallScore < 60) {
      complianceStatus = 'fail';
    }

    const strategyRecord = {
      workspace_id: workspaceId,
      strategy_id: strategyData.strategyId,
      framework_id: null,
      strategy_content: strategyData.strategy,
      convex_score: strategyData.score.overallScore,
      compliance_status: complianceStatus,
      scoring_details: {
        clarity: strategyData.score.clarity,
        specificity: strategyData.score.specificity,
        outcomeFocus: strategyData.score.outcomeFocus,
        proof: strategyData.score.proof,
        riskRemoval: strategyData.score.riskRemoval,
        compliance: strategyData.score.compliance,
      },
      execution_plan: strategyData.executionPlan,
      success_metrics: strategyData.successMetrics,
      frameworks: strategyData.frameworks,
      metadata: strategyData.metadata,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('convex_strategy_scores')
      .insert([strategyRecord])
      .select()
      .single();

    if (error) {
      logger.error('[CONVEX-PERSIST] Failed to save strategy:', error);
      return null;
    }

    logger.info(`[CONVEX-PERSIST] Strategy saved: ${data.id}`);
    return data as StoredStrategy;
  } catch (error) {
    logger.error('[CONVEX-PERSIST] Strategy save error:', error);
    return null;
  }
}

/**
 * Retrieve a single strategy by ID
 */
export async function getStrategy(
  workspaceId: string,
  strategyId: string
): Promise<StoredStrategy | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_scores')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('strategy_id', strategyId)
      .single();

    if (error) {
      logger.warn(`[CONVEX-PERSIST] Strategy not found: ${strategyId}`);
      return null;
    }

    return data as StoredStrategy;
  } catch (error) {
    logger.error('[CONVEX-PERSIST] Strategy retrieval error:', error);
    return null;
  }
}

/**
 * List all strategies for a workspace
 */
export async function listStrategies(
  workspaceId: string,
  limit: number = 50,
  offset: number = 0
): Promise<StrategyListItem[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_scores')
      .select('id, strategy_id, convex_score, compliance_status, created_at, metadata->>framework as framework, metadata->>businessName as businessName')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      logger.warn('[CONVEX-PERSIST] Failed to list strategies:', error);
      return [];
    }

    return (data || []) as StrategyListItem[];
  } catch (error) {
    logger.error('[CONVEX-PERSIST] Strategy list error:', error);
    return [];
  }
}

/**
 * Delete a strategy
 */
export async function deleteStrategy(
  workspaceId: string,
  strategyId: string,
  userId: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('convex_strategy_scores')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('strategy_id', strategyId)
      .eq('created_by', userId);

    if (error) {
      logger.error('[CONVEX-PERSIST] Failed to delete strategy:', error);
      return false;
    }

    logger.info(`[CONVEX-PERSIST] Strategy deleted: ${strategyId}`);
    return true;
  } catch (error) {
    logger.error('[CONVEX-PERSIST] Strategy deletion error:', error);
    return false;
  }
}

/**
 * Update strategy compliance status
 */
export async function updateComplianceStatus(
  workspaceId: string,
  strategyId: string,
  status: 'pass' | 'needs_revision' | 'fail',
  reviewedBy: string
): Promise<boolean> {
  try {
    const supabase = await getSupabaseServer();

    const { error } = await supabase
      .from('convex_strategy_scores')
      .update({
        compliance_status: status,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('strategy_id', strategyId);

    if (error) {
      logger.error('[CONVEX-PERSIST] Failed to update compliance status:', error);
      return false;
    }

    logger.info(`[CONVEX-PERSIST] Compliance status updated: ${strategyId} → ${status}`);
    return true;
  } catch (error) {
    logger.error('[CONVEX-PERSIST] Compliance update error:', error);
    return false;
  }
}

/**
 * Get strategies by framework type
 */
export async function getStrategiesByFramework(
  workspaceId: string,
  framework: string
): Promise<StrategyListItem[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_scores')
      .select('id, strategy_id, convex_score, compliance_status, created_at, metadata->>framework as framework, metadata->>businessName as businessName')
      .eq('workspace_id', workspaceId)
      .eq('metadata->>framework', framework)
      .order('created_at', { ascending: false });

    if (error) {
      logger.warn(`[CONVEX-PERSIST] Failed to get strategies by framework: ${framework}`, error);
      return [];
    }

    return (data || []) as StrategyListItem[];
  } catch (error) {
    logger.error('[CONVEX-PERSIST] Framework filter error:', error);
    return [];
  }
}

/**
 * Get strategies by compliance status
 */
export async function getStrategiesByCompliance(
  workspaceId: string,
  status: 'pass' | 'needs_revision' | 'fail'
): Promise<StrategyListItem[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_scores')
      .select('id, strategy_id, convex_score, compliance_status, created_at, metadata->>framework as framework, metadata->>businessName as businessName')
      .eq('workspace_id', workspaceId)
      .eq('compliance_status', status)
      .order('created_at', { ascending: false });

    if (error) {
      logger.warn(`[CONVEX-PERSIST] Failed to get strategies by compliance: ${status}`, error);
      return [];
    }

    return (data || []) as StrategyListItem[];
  } catch (error) {
    logger.error('[CONVEX-PERSIST] Compliance filter error:', error);
    return [];
  }
}

/**
 * Get workspace statistics
 */
export async function getWorkspaceStats(workspaceId: string): Promise<{
  totalStrategies: number;
  avgScore: number;
  passCount: number;
  needsRevisionCount: number;
  failCount: number;
  byFramework: Record<string, number>;
}> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_scores')
      .select('id, convex_score, compliance_status, metadata->>framework as framework')
      .eq('workspace_id', workspaceId);

    if (error) {
      logger.warn('[CONVEX-PERSIST] Failed to get workspace stats:', error);
      return {
        totalStrategies: 0,
        avgScore: 0,
        passCount: 0,
        needsRevisionCount: 0,
        failCount: 0,
        byFramework: {},
      };
    }

    const strategies = data || [];
    const byFramework: Record<string, number> = {};

    strategies.forEach((s: any) => {
      const framework = s.framework || 'unknown';
      byFramework[framework] = (byFramework[framework] || 0) + 1;
    });

    const passCount = strategies.filter((s: any) => s.compliance_status === 'pass').length;
    const needsRevisionCount = strategies.filter((s: any) => s.compliance_status === 'needs_revision').length;
    const failCount = strategies.filter((s: any) => s.compliance_status === 'fail').length;
    const avgScore = strategies.length > 0
      ? Math.round(strategies.reduce((sum: number, s: any) => sum + (s.convex_score || 0), 0) / strategies.length)
      : 0;

    return {
      totalStrategies: strategies.length,
      avgScore,
      passCount,
      needsRevisionCount,
      failCount,
      byFramework,
    };
  } catch (error) {
    logger.error('[CONVEX-PERSIST] Stats error:', error);
    return {
      totalStrategies: 0,
      avgScore: 0,
      passCount: 0,
      needsRevisionCount: 0,
      failCount: 0,
      byFramework: {},
    };
  }
}
