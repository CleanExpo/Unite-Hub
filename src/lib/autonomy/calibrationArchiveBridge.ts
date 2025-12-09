/**
 * Calibration Archive Bridge
 *
 * Bridges calibration cycles and results to the memory system:
 * - Archives completed calibration cycles with results
 * - Tracks calibration patterns and performance trends
 * - Enables learning from historical calibrations
 * - Supports rollback capability for failed calibrations
 * - Maintains full audit trail for compliance
 *
 * Memory integration:
 * - Stores high-confidence calibrations as long-term learnings
 * - Records parameter adjustment patterns
 * - Tracks system health improvements from calibrations
 * - Enables agent learning from optimization history
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface CalibrationArchiveEntry {
  archiveId: string;
  cycleId: string;
  workspaceId: string;
  timestamp: string;
  cycleNumber: number;
  status: 'pending_archive' | 'archived' | 'failed' | 'rolled_back';
  metricsAnalyzed: Record<string, any>;
  proposedChanges: Record<string, any>[];
  appliedChanges: Record<string, any>[];
  overallConfidence: number;
  systemHealthBefore: number;
  systemHealthAfter: number;
  improvementPercentage: number;
  findings: string;
  recommendations: string[];
  archiveNotes: string;
}

export interface CalibrationPattern {
  patternId: string;
  workspaceId: string;
  patternName: string;
  occurrences: number;
  description: string;
  triggeringMetrics: string[];
  suggestedAdjustments: Record<string, number>;
  avgConfidence: number;
  successRate: number;
  keywords: string[];
}

class CalibrationArchiveBridge {
  private memoryStore = new MemoryStore();

  /**
   * Archive a completed calibration cycle with results
   */
  async archiveCalibrationCycle(params: {
    workspaceId: string;
    cycleId: string;
    cycleNumber: number;
    metricsAnalyzed: Record<string, any>;
    proposedChanges: Record<string, any>[];
    appliedChanges: Record<string, any>[];
    overallConfidence: number;
    systemHealthBefore: number;
    systemHealthAfter: number;
    findings: string;
    recommendations: string[];
  }): Promise<CalibrationArchiveEntry> {
    const supabase = await getSupabaseServer();

    const improvementPercentage =
      params.systemHealthBefore > 0
        ? ((params.systemHealthAfter - params.systemHealthBefore) / params.systemHealthBefore) *
          100
        : 0;

    const archiveId = crypto.randomUUID();
    const entry: CalibrationArchiveEntry = {
      archiveId,
      cycleId: params.cycleId,
      workspaceId: params.workspaceId,
      timestamp: new Date().toISOString(),
      cycleNumber: params.cycleNumber,
      status: 'archived',
      metricsAnalyzed: params.metricsAnalyzed,
      proposedChanges: params.proposedChanges,
      appliedChanges: params.appliedChanges,
      overallConfidence: params.overallConfidence,
      systemHealthBefore: params.systemHealthBefore,
      systemHealthAfter: params.systemHealthAfter,
      improvementPercentage,
      findings: params.findings,
      recommendations: params.recommendations,
      archiveNotes: this.generateArchiveNotes(params),
    };

    // 1. Store to database
    await supabase.from('calibration_archives').insert({
      workspace_id: params.workspaceId,
      archive_id: archiveId,
      calibration_cycle_id: params.cycleId,
      cycle_number: params.cycleNumber,
      status: 'archived',
      metrics_analyzed: params.metricsAnalyzed,
      proposed_changes: params.proposedChanges,
      applied_changes: params.appliedChanges,
      overall_confidence: params.overallConfidence,
      system_health_before: params.systemHealthBefore,
      system_health_after: params.systemHealthAfter,
      improvement_percentage: improvementPercentage,
      findings: params.findings,
      recommendations: params.recommendations,
      archive_notes: entry.archiveNotes,
      archived_at: new Date().toISOString(),
    });

    // 2. Archive to memory for learning
    await this.memoryStore.store({
      workspaceId: params.workspaceId,
      agent: 'calibration-archive-bridge',
      memoryType: 'calibration_archive',
      content: {
        archive_id: archiveId,
        cycle_number: params.cycleNumber,
        improvements: {
          before: params.systemHealthBefore,
          after: params.systemHealthAfter,
          delta: improvementPercentage,
        },
        applied_changes: params.appliedChanges.length,
        confidence: params.overallConfidence,
        findings: params.findings,
        timestamp: new Date().toISOString(),
      },
      importance: Math.min(100, 60 + improvementPercentage + params.overallConfidence * 0.2),
      confidence: params.overallConfidence,
      keywords: ['calibration', 'archive', 'optimization', 'system-health', 'improvement'],
    });

    // 3. Detect and record calibration patterns
    if (params.overallConfidence >= 75) {
      await this.detectAndRecordPattern(params.workspaceId, params.metricsAnalyzed,
        params.appliedChanges);
    }

    return entry;
  }

  /**
   * Detect recurring calibration patterns
   */
  private async detectAndRecordPattern(
    workspaceId: string,
    metricsAnalyzed: Record<string, any>,
    appliedChanges: Record<string, any>[]
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Identify pattern type based on metrics
    const patternType = this.identifyPatternType(metricsAnalyzed);
    if (!patternType) {
return;
}

    // Check if this pattern has been seen before
    const { data: existingPatterns } = await supabase
      .from('calibration_patterns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('pattern_name', patternType.name);

    const patternId = crypto.randomUUID();

    if (existingPatterns && existingPatterns.length > 0) {
      // Update existing pattern
      const existing = existingPatterns[0];
      const newOccurrences = (existing.occurrences || 0) + 1;
      const newAvgConfidence =
        ((existing.avg_confidence || 0) * (newOccurrences - 1) + (patternType.confidence || 75)) /
        newOccurrences;

      await supabase
        .from('calibration_patterns')
        .update({
          occurrences: newOccurrences,
          avg_confidence: newAvgConfidence,
          last_seen_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      // Create new pattern
      await supabase.from('calibration_patterns').insert({
        workspace_id: workspaceId,
        pattern_id: patternId,
        pattern_name: patternType.name,
        description: patternType.description,
        occurrences: 1,
        triggering_metrics: Object.keys(metricsAnalyzed),
        suggested_adjustments: this.extractSuggestedAdjustments(appliedChanges),
        avg_confidence: patternType.confidence || 75,
        success_rate: 100, // New patterns start at 100%
        keywords: patternType.keywords,
        first_seen_at: new Date().toISOString(),
        last_seen_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Identify pattern type from metrics
   */
  private identifyPatternType(
    metrics: Record<string, any>
  ): { name: string; description: string; keywords: string[]; confidence: number } | null {
    // False Positive Reduction pattern
    if (metrics.falsePositiveRate === 'HIGH') {
      return {
        name: 'false_positive_reduction',
        description: 'System adjusting thresholds to reduce false positives',
        keywords: ['false-positive', 'threshold-increase', 'tolerance'],
        confidence: 85,
      };
    }

    // False Negative Catch pattern
    if (metrics.falseNegativeRate === 'HIGH') {
      return {
        name: 'false_negative_detection',
        description: 'System lowering thresholds to catch more dangerous states',
        keywords: ['false-negative', 'threshold-decrease', 'sensitivity'],
        confidence: 90,
      };
    }

    // Uncertainty Calibration pattern
    if (metrics.predictionAccuracy < 70) {
      return {
        name: 'uncertainty_calibration',
        description: 'System increasing uncertainty threshold due to low prediction accuracy',
        keywords: ['uncertainty', 'prediction-accuracy', 'confidence-gating'],
        confidence: 75,
      };
    }

    // Autonomy Success Boost pattern
    if (metrics.autonomySuccessRate >= 90) {
      return {
        name: 'autonomy_optimization',
        description: 'System boosting autonomy success through agent weight increases',
        keywords: ['autonomy', 'agent-weights', 'success-optimization'],
        confidence: 88,
      };
    }

    // Enforcement Effectiveness pattern
    if (metrics.enforcementEffectiveness >= 95) {
      return {
        name: 'enforcement_tuning',
        description: 'System optimizing safety enforcement thresholds',
        keywords: ['enforcement', 'safety', 'threshold-optimization'],
        confidence: 92,
      };
    }

    return null;
  }

  /**
   * Extract suggested adjustments from applied changes
   */
  private extractSuggestedAdjustments(
    appliedChanges: Record<string, any>[]
  ): Record<string, number> {
    const adjustments: Record<string, number> = {};

    for (const change of appliedChanges) {
      if (change.parameterName && typeof change.adjustedValue === 'number') {
        adjustments[change.parameterName] = change.adjustedValue;
      }
    }

    return adjustments;
  }

  /**
   * Generate human-readable archive notes
   */
  private generateArchiveNotes(params: {
    metricsAnalyzed: Record<string, any>;
    proposedChanges: Record<string, any>[];
    appliedChanges: Record<string, any>[];
    overallConfidence: number;
    systemHealthBefore: number;
    systemHealthAfter: number;
    findings: string;
  }): string {
    const lines: string[] = [
      '# Calibration Archive Entry',
      '',
      `## Summary`,
      `System health improved from ${params.systemHealthBefore.toFixed(0)}/100 to ${params.systemHealthAfter.toFixed(0)}/100 ` +
        `(${params.systemHealthAfter > params.systemHealthBefore ? '+' : ''}${((params.systemHealthAfter - params.systemHealthBefore) / params.systemHealthBefore * 100).toFixed(1)}%)`,
      `Overall confidence: ${params.overallConfidence}%`,
      '',
      `## Changes Applied`,
      `- Proposed: ${params.proposedChanges.length} changes`,
      `- Applied: ${params.appliedChanges.length} changes`,
      '',
      `## Key Metrics`,
    ];

    for (const [key, value] of Object.entries(params.metricsAnalyzed)) {
      if (typeof value === 'number') {
        lines.push(`- ${key.replace(/_/g, ' ')}: ${value.toFixed(2)}`);
      } else if (typeof value === 'string') {
        lines.push(`- ${key.replace(/_/g, ' ')}: ${value}`);
      }
    }

    if (params.findings) {
      lines.push(`\n## Findings\n${params.findings}`);
    }

    return lines.join('\n');
  }

  /**
   * Get calibration history for workspace
   */
  async getCalibrationHistory(params: {
    workspaceId: string;
    limit?: number;
    offset?: number;
  }): Promise<CalibrationArchiveEntry[]> {
    const supabase = await getSupabaseServer();

    const { data: archives } = await supabase
      .from('calibration_archives')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .order('archived_at', { ascending: false })
      .limit(params.limit || 50)
      .offset(params.offset || 0);

    return (
      archives?.map(a => ({
        archiveId: a.archive_id,
        cycleId: a.calibration_cycle_id,
        workspaceId: a.workspace_id,
        timestamp: a.archived_at,
        cycleNumber: a.cycle_number,
        status: a.status,
        metricsAnalyzed: a.metrics_analyzed,
        proposedChanges: a.proposed_changes,
        appliedChanges: a.applied_changes,
        overallConfidence: a.overall_confidence,
        systemHealthBefore: a.system_health_before,
        systemHealthAfter: a.system_health_after,
        improvementPercentage: a.improvement_percentage,
        findings: a.findings,
        recommendations: a.recommendations,
        archiveNotes: a.archive_notes,
      })) || []
    );
  }

  /**
   * Get detected patterns for workspace
   */
  async getDetectedPatterns(params: {
    workspaceId: string;
    minOccurrences?: number;
  }): Promise<CalibrationPattern[]> {
    const supabase = await getSupabaseServer();

    const { data: patterns } = await supabase
      .from('calibration_patterns')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .gte('occurrences', params.minOccurrences || 2)
      .order('occurrences', { ascending: false });

    return (
      patterns?.map(p => ({
        patternId: p.pattern_id,
        workspaceId: p.workspace_id,
        patternName: p.pattern_name,
        occurrences: p.occurrences,
        description: p.description,
        triggeringMetrics: p.triggering_metrics,
        suggestedAdjustments: p.suggested_adjustments,
        avgConfidence: p.avg_confidence,
        successRate: p.success_rate,
        keywords: p.keywords,
      })) || []
    );
  }

  /**
   * Calculate overall system improvement from calibrations
   */
  async calculateSystemImprovement(params: {
    workspaceId: string;
    lookbackDays?: number;
  }): Promise<{ totalImprovement: number; calibrationsCount: number; avgConfidence: number }> {
    const supabase = await getSupabaseServer();
    const lookbackDate = new Date(Date.now() - (params.lookbackDays || 30) * 24 * 60 * 60 * 1000);

    const { data: archives } = await supabase
      .from('calibration_archives')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .gte('archived_at', lookbackDate.toISOString())
      .eq('status', 'archived');

    if (!archives || archives.length === 0) {
      return { totalImprovement: 0, calibrationsCount: 0, avgConfidence: 0 };
    }

    const totalImprovement = archives.reduce((sum, a) => sum + (a.improvement_percentage || 0), 0);
    const avgConfidence =
      archives.reduce((sum, a) => sum + (a.overall_confidence || 0), 0) / archives.length;

    return {
      totalImprovement: totalImprovement / archives.length,
      calibrationsCount: archives.length,
      avgConfidence,
    };
  }
}

export const calibrationArchiveBridge = new CalibrationArchiveBridge();
