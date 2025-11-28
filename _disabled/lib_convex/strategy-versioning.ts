/**
 * CONVEX Strategy Versioning and Comparison
 *
 * Implements version control for strategies:
 * - Save strategy versions with changeset tracking
 * - Compare versions side-by-side
 * - Restore previous versions
 * - Track changelog and metadata
 * - Diff visualization support
 */

import { getSupabaseServer } from '@/lib/supabase';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

export interface StrategyVersion {
  id: string;
  strategy_id: string;
  version: number;
  title: string;
  description?: string;
  strategy_content: string;
  convex_score: number;
  compliance_status: 'pass' | 'needs_revision' | 'fail';
  frameworks: string[];
  execution_plan: string[];
  success_metrics: string[];
  created_by: string;
  created_at: string;
  change_summary?: string;
}

export interface StrategyDiff {
  field: string;
  oldValue: any;
  newValue: any;
  changeType: 'added' | 'modified' | 'removed';
}

export interface StrategyComparison {
  version1: StrategyVersion;
  version2: StrategyVersion;
  diffs: StrategyDiff[];
  scoreChange: number;
  similarityScore: number; // 0-100
}

// ============================================================================
// VERSIONING FUNCTIONS
// ============================================================================

/**
 * Create a new version of a strategy
 */
export async function saveStrategyVersion(
  strategyId: string,
  workspaceId: string,
  userId: string,
  versionData: {
    title: string;
    description?: string;
    strategy_content: string;
    convex_score: number;
    compliance_status: 'pass' | 'needs_revision' | 'fail';
    frameworks: string[];
    execution_plan: string[];
    success_metrics: string[];
    changeSummary?: string;
  }
): Promise<StrategyVersion | null> {
  try {
    const supabase = await getSupabaseServer();

    // Get current version number
    const { data: lastVersion } = await supabase
      .from('convex_strategy_versions')
      .select('version')
      .eq('strategy_id', strategyId)
      .order('version', { ascending: false })
      .limit(1)
      .single();

    const newVersion = (lastVersion?.version || 0) + 1;

    const versionRecord = {
      strategy_id: strategyId,
      workspace_id: workspaceId,
      version: newVersion,
      title: versionData.title,
      description: versionData.description,
      strategy_content: versionData.strategy_content,
      convex_score: versionData.convex_score,
      compliance_status: versionData.compliance_status,
      frameworks: versionData.frameworks,
      execution_plan: versionData.execution_plan,
      success_metrics: versionData.success_metrics,
      change_summary: versionData.changeSummary,
      created_by: userId,
    };

    const { data, error } = await supabase
      .from('convex_strategy_versions')
      .insert([versionRecord])
      .select()
      .single();

    if (error) {
      logger.error('[CONVEX-VERSION] Failed to save version:', error);
      return null;
    }

    logger.info(`[CONVEX-VERSION] Version ${newVersion} saved for strategy ${strategyId}`);
    return data as StrategyVersion;
  } catch (error) {
    logger.error('[CONVEX-VERSION] Version save error:', error);
    return null;
  }
}

/**
 * Get all versions of a strategy
 */
export async function getStrategyVersions(
  strategyId: string,
  workspaceId: string
): Promise<StrategyVersion[]> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_versions')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('workspace_id', workspaceId)
      .order('version', { ascending: false });

    if (error) {
      logger.warn(`[CONVEX-VERSION] Failed to get versions for strategy ${strategyId}`, error);
      return [];
    }

    return (data || []) as StrategyVersion[];
  } catch (error) {
    logger.error('[CONVEX-VERSION] Version retrieval error:', error);
    return [];
  }
}

/**
 * Get a specific version
 */
export async function getStrategyVersion(
  strategyId: string,
  workspaceId: string,
  version: number
): Promise<StrategyVersion | null> {
  try {
    const supabase = await getSupabaseServer();

    const { data, error } = await supabase
      .from('convex_strategy_versions')
      .select('*')
      .eq('strategy_id', strategyId)
      .eq('workspace_id', workspaceId)
      .eq('version', version)
      .single();

    if (error) {
      logger.warn(`[CONVEX-VERSION] Version ${version} not found`, error);
      return null;
    }

    return data as StrategyVersion;
  } catch (error) {
    logger.error('[CONVEX-VERSION] Version fetch error:', error);
    return null;
  }
}

/**
 * Calculate diff between two versions
 */
export function calculateDiff(
  version1: StrategyVersion,
  version2: StrategyVersion
): StrategyDiff[] {
  const diffs: StrategyDiff[] = [];

  // Compare scalar fields
  const scalarFields = [
    'title',
    'convex_score',
    'compliance_status',
  ];

  scalarFields.forEach((field) => {
    const v1 = (version1 as any)[field];
    const v2 = (version2 as any)[field];

    if (v1 !== v2) {
      diffs.push({
        field,
        oldValue: v1,
        newValue: v2,
        changeType: 'modified',
      });
    }
  });

  // Compare arrays
  const arrayFields = ['frameworks', 'execution_plan', 'success_metrics'];

  arrayFields.forEach((field) => {
    const v1 = (version1 as any)[field] || [];
    const v2 = (version2 as any)[field] || [];

    const added = v2.filter((item: any) => !v1.includes(item));
    const removed = v1.filter((item: any) => !v2.includes(item));

    added.forEach((item: any) => {
      diffs.push({
        field: `${field}.added`,
        oldValue: undefined,
        newValue: item,
        changeType: 'added',
      });
    });

    removed.forEach((item: any) => {
      diffs.push({
        field: `${field}.removed`,
        oldValue: item,
        newValue: undefined,
        changeType: 'removed',
      });
    });
  });

  // Compare content (word-level diff)
  const v1Content = version1.strategy_content.split(' ');
  const v2Content = version2.strategy_content.split(' ');

  if (v1Content.length !== v2Content.length || !v1Content.every((w, i) => w === v2Content[i])) {
    diffs.push({
      field: 'strategy_content',
      oldValue: v1Content.length,
      newValue: v2Content.length,
      changeType: 'modified',
    });
  }

  return diffs;
}

/**
 * Calculate similarity between two versions (0-100)
 */
export function calculateSimilarity(
  version1: StrategyVersion,
  version2: StrategyVersion
): number {
  const diffs = calculateDiff(version1, version2);

  if (diffs.length === 0) return 100;

  // Weight different types of changes
  let diffWeight = 0;
  diffs.forEach((diff) => {
    switch (diff.changeType) {
      case 'modified':
        diffWeight += diff.field === 'convex_score' ? 20 : 10;
        break;
      case 'added':
      case 'removed':
        diffWeight += 5;
        break;
    }
  });

  // Calculate similarity (0-100)
  const similarity = Math.max(0, 100 - diffWeight);
  return Math.round(similarity);
}

/**
 * Compare two versions
 */
export async function compareVersions(
  strategyId: string,
  workspaceId: string,
  version1: number,
  version2: number
): Promise<StrategyComparison | null> {
  try {
    const v1 = await getStrategyVersion(strategyId, workspaceId, version1);
    const v2 = await getStrategyVersion(strategyId, workspaceId, version2);

    if (!v1 || !v2) {
      logger.warn(`[CONVEX-VERSION] Could not fetch versions for comparison`);
      return null;
    }

    const diffs = calculateDiff(v1, v2);
    const similarity = calculateSimilarity(v1, v2);
    const scoreChange = v2.convex_score - v1.convex_score;

    logger.info(
      `[CONVEX-VERSION] Comparison: v${version1} vs v${version2}, similarity: ${similarity}%`
    );

    return {
      version1: v1,
      version2: v2,
      diffs,
      scoreChange,
      similarityScore: similarity,
    };
  } catch (error) {
    logger.error('[CONVEX-VERSION] Comparison error:', error);
    return null;
  }
}

/**
 * Restore a previous version (creates new version based on old)
 */
export async function restoreVersion(
  strategyId: string,
  workspaceId: string,
  versionToRestore: number,
  userId: string,
  restorationNote?: string
): Promise<StrategyVersion | null> {
  try {
    const oldVersion = await getStrategyVersion(strategyId, workspaceId, versionToRestore);

    if (!oldVersion) {
      logger.warn(`[CONVEX-VERSION] Cannot restore - version ${versionToRestore} not found`);
      return null;
    }

    // Create new version with restored content
    const restoredVersion = await saveStrategyVersion(
      strategyId,
      workspaceId,
      userId,
      {
        title: `${oldVersion.title} (Restored)`,
        description: oldVersion.description,
        strategy_content: oldVersion.strategy_content,
        convex_score: oldVersion.convex_score,
        compliance_status: oldVersion.compliance_status,
        frameworks: oldVersion.frameworks,
        execution_plan: oldVersion.execution_plan,
        success_metrics: oldVersion.success_metrics,
        changeSummary: `Restored from version ${versionToRestore}. ${restorationNote || ''}`,
      }
    );

    if (restoredVersion) {
      logger.info(
        `[CONVEX-VERSION] Version ${versionToRestore} restored as new version for strategy ${strategyId}`
      );
    }

    return restoredVersion;
  } catch (error) {
    logger.error('[CONVEX-VERSION] Restoration error:', error);
    return null;
  }
}

/**
 * Get version history with timeline
 */
export async function getVersionTimeline(
  strategyId: string,
  workspaceId: string
): Promise<Array<{
  version: number;
  title: string;
  date: string;
  score: number;
  author: string;
  changeSummary?: string;
}>> {
  try {
    const versions = await getStrategyVersions(strategyId, workspaceId);

    return versions.map((v) => ({
      version: v.version,
      title: v.title,
      date: v.created_at,
      score: v.convex_score,
      author: v.created_by,
      changeSummary: v.change_summary,
    }));
  } catch (error) {
    logger.error('[CONVEX-VERSION] Timeline error:', error);
    return [];
  }
}

/**
 * Get changelog for strategy
 */
export async function getChangelog(
  strategyId: string,
  workspaceId: string,
  limit: number = 20
): Promise<string> {
  try {
    const versions = await getStrategyVersions(strategyId, workspaceId);
    const limited = versions.slice(0, limit);

    let changelog = '# Strategy Changelog\n\n';

    for (let i = 0; i < limited.length; i++) {
      const current = limited[i];
      const next = limited[i + 1];

      changelog += `## Version ${current.version}\n`;
      changelog += `**Date**: ${new Date(current.created_at).toLocaleDateString()}\n`;
      changelog += `**Author**: ${current.created_by}\n`;
      changelog += `**Score**: ${current.convex_score}/100\n`;
      changelog += `**Status**: ${current.compliance_status}\n`;

      if (current.change_summary) {
        changelog += `**Changes**: ${current.change_summary}\n`;
      }

      if (next) {
        const comparison = await compareVersions(
          strategyId,
          workspaceId,
          next.version,
          current.version
        );

        if (comparison) {
          changelog += `**Differences from v${next.version}**:\n`;
          comparison.diffs.slice(0, 5).forEach((diff) => {
            changelog += `- ${diff.field}: ${diff.changeType}\n`;
          });
        }
      }

      changelog += '\n';
    }

    return changelog;
  } catch (error) {
    logger.error('[CONVEX-VERSION] Changelog generation error:', error);
    return '';
  }
}
