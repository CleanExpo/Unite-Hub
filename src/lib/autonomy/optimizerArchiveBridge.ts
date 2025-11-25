/**
 * Optimizer Archive Bridge
 *
 * Archives execution optimization results and enables learning:
 * - Track optimization effectiveness
 * - Detect patterns in successful optimizations
 * - Correlate optimizations to workflow success
 * - Store adaptation insights to memory system
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

export interface OptimizationResult {
  resultId: string;
  optimizationId: string;
  workflowId: string;
  workspaceId: string;
  timestamp: string;
  actualDuration: number; // ms
  actualCost: number; // USD
  actualSuccessRate: number; // 0-1
  estimatedDuration: number; // ms (from optimization)
  estimatedCost: number; // USD (from optimization)
  efficiencyGain: number; // percentage improvement
  successStatus: boolean;
  notes: string;
}

class OptimizerArchiveBridge {
  private memoryStore = new MemoryStore();

  /**
   * Archive optimization result and measure effectiveness
   */
  async archiveOptimizationResult(params: {
    workspaceId: string;
    optimizationId: string;
    workflowId: string;
    estimatedDuration: number;
    estimatedCost: number;
    actualDuration: number;
    actualCost: number;
    workflowSuccess: boolean;
    executionNotes?: string;
  }): Promise<OptimizationResult> {
    const supabase = await getSupabaseServer();
    const resultId = crypto.randomUUID();

    try {
      // 1. Calculate metrics
      const durationAccuracy = ((params.estimatedDuration - params.actualDuration) / params.estimatedDuration) * 100;
      const costAccuracy = ((params.estimatedCost - params.actualCost) / params.estimatedCost) * 100;
      const efficiencyGain = Math.max(durationAccuracy, costAccuracy);

      const result: OptimizationResult = {
        resultId,
        optimizationId: params.optimizationId,
        workflowId: params.workflowId,
        workspaceId: params.workspaceId,
        timestamp: new Date().toISOString(),
        actualDuration: params.actualDuration,
        actualCost: params.actualCost,
        actualSuccessRate: params.workflowSuccess ? 1 : 0,
        estimatedDuration: params.estimatedDuration,
        estimatedCost: params.estimatedCost,
        efficiencyGain,
        successStatus: params.workflowSuccess,
        notes: params.executionNotes || '',
      };

      // 2. Store result to database
      await supabase.from('execution_optimizer_results').insert({
        workspace_id: params.workspaceId,
        result_id: resultId,
        optimization_id: params.optimizationId,
        workflow_id: params.workflowId,
        estimated_duration: params.estimatedDuration,
        estimated_cost: params.estimatedCost,
        actual_duration: params.actualDuration,
        actual_cost: params.actualCost,
        duration_accuracy: durationAccuracy,
        cost_accuracy: costAccuracy,
        efficiency_gain: efficiencyGain,
        workflow_success: params.workflowSuccess,
        execution_notes: params.executionNotes,
        created_at: new Date().toISOString(),
      });

      // 3. Detect patterns in successful optimizations
      if (params.workflowSuccess && efficiencyGain > 10) {
        await this.detectOptimizationPattern(
          params.workspaceId,
          params.optimizationId,
          efficiencyGain,
          durationAccuracy,
          costAccuracy
        );
      }

      // 4. Archive to memory
      await this.memoryStore.store({
        workspaceId: params.workspaceId,
        agent: 'optimizer-archive-bridge',
        memoryType: 'optimization_result',
        content: {
          result_id: resultId,
          workflow_id: params.workflowId,
          success: params.workflowSuccess,
          efficiency_gain: efficiencyGain,
          cost_saved: params.estimatedCost - params.actualCost,
          duration_improvement: params.estimatedDuration - params.actualDuration,
          timestamp: new Date().toISOString(),
        },
        importance: Math.min(100, 50 + (params.workflowSuccess ? 30 : -20) + Math.abs(efficiencyGain) * 0.2),
        confidence: 80,
        keywords: ['optimization', 'efficiency', 'execution', 'result', 'performance'],
      });

      return result;
    } catch (error) {
      console.error('Optimization archive error:', error);
      throw error;
    }
  }

  /**
   * Detect patterns in successful optimizations
   */
  private async detectOptimizationPattern(
    workspaceId: string,
    optimizationId: string,
    efficiencyGain: number,
    durationAccuracy: number,
    costAccuracy: number
  ): Promise<void> {
    const supabase = await getSupabaseServer();

    // Determine pattern type
    let patternType = 'general_optimization';
    if (durationAccuracy > costAccuracy) {
      patternType = 'duration_optimization';
    } else if (costAccuracy > durationAccuracy) {
      patternType = 'cost_optimization';
    }

    // Check if pattern already exists
    const { data: existing } = await supabase
      .from('execution_optimizer_patterns')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('pattern_type', patternType);

    const patternId = crypto.randomUUID();

    if (existing && existing.length > 0) {
      // Update existing pattern
      const pattern = existing[0];
      const newOccurrences = (pattern.occurrences || 0) + 1;
      const newAvgGain =
        ((pattern.avg_efficiency_gain || 0) * (newOccurrences - 1) + efficiencyGain) / newOccurrences;
      const successRate =
        ((pattern.success_count || 0) + 1) / newOccurrences;

      await supabase
        .from('execution_optimizer_patterns')
        .update({
          occurrences: newOccurrences,
          avg_efficiency_gain: newAvgGain,
          success_count: (pattern.success_count || 0) + 1,
          success_rate: successRate,
          last_applied_at: new Date().toISOString(),
        })
        .eq('id', pattern.id);
    } else {
      // Create new pattern
      await supabase.from('execution_optimizer_patterns').insert({
        workspace_id: workspaceId,
        pattern_id: patternId,
        pattern_type: patternType,
        description: `${patternType.replace(/_/g, ' ')} with ${efficiencyGain.toFixed(1)}% gain`,
        occurrences: 1,
        avg_efficiency_gain: efficiencyGain,
        success_count: 1,
        success_rate: 1.0,
        first_applied_at: new Date().toISOString(),
        last_applied_at: new Date().toISOString(),
      });
    }
  }

  /**
   * Correlate optimizations to workflow outcomes
   */
  async correlateOptimizationToSuccess(params: {
    workspaceId: string;
    lookbackDays?: number;
  }): Promise<{
    totalOptimizations: number;
    successfulOptimizations: number;
    avgEfficiencyGain: number;
    avgCostSavings: number;
    avgDurationImprovement: number;
  }> {
    const supabase = await getSupabaseServer();
    const lookbackDate = new Date(Date.now() - (params.lookbackDays || 7) * 24 * 60 * 60 * 1000);

    const { data: results } = await supabase
      .from('execution_optimizer_results')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .gte('created_at', lookbackDate.toISOString());

    if (!results || results.length === 0) {
      return {
        totalOptimizations: 0,
        successfulOptimizations: 0,
        avgEfficiencyGain: 0,
        avgCostSavings: 0,
        avgDurationImprovement: 0,
      };
    }

    const successful = results.filter(r => r.workflow_success);
    const avgEfficiencyGain = results.reduce((sum, r) => sum + (r.efficiency_gain || 0), 0) / results.length;
    const avgCostSavings =
      results.reduce((sum, r) => sum + (r.estimated_cost - r.actual_cost), 0) / results.length;
    const avgDurationImprovement =
      results.reduce((sum, r) => sum + (r.estimated_duration - r.actual_duration), 0) / results.length;

    return {
      totalOptimizations: results.length,
      successfulOptimizations: successful.length,
      avgEfficiencyGain,
      avgCostSavings,
      avgDurationImprovement,
    };
  }

  /**
   * Get detected optimization patterns
   */
  async getDetectedPatterns(params: {
    workspaceId: string;
    minOccurrences?: number;
  }): Promise<Array<{
    patternType: string;
    occurrences: number;
    avgEfficiencyGain: number;
    successRate: number;
  }>> {
    const supabase = await getSupabaseServer();

    const { data: patterns } = await supabase
      .from('execution_optimizer_patterns')
      .select('*')
      .eq('workspace_id', params.workspaceId)
      .gte('occurrences', params.minOccurrences || 1)
      .order('occurrences', { ascending: false });

    return (
      patterns?.map(p => ({
        patternType: p.pattern_type,
        occurrences: p.occurrences,
        avgEfficiencyGain: p.avg_efficiency_gain,
        successRate: p.success_rate,
      })) || []
    );
  }

  /**
   * Calculate ROI of execution optimization
   */
  async calculateOptimizationROI(params: {
    workspaceId: string;
    lookbackDays?: number;
  }): Promise<{
    totalCostSaved: number;
    totalTimeSaved: number;
    totalOptimizations: number;
    ROI: number; // percentage
    paybackPeriod: string;
  }> {
    const stats = await this.correlateOptimizationToSuccess(params);

    const totalCostSaved = stats.avgCostSavings * stats.totalOptimizations;
    const totalTimeSaved = stats.avgDurationImprovement * stats.totalOptimizations;

    // Assume $0.01 per minute saved
    const timeValue = (totalTimeSaved / 1000 / 60) * 0.01;
    const totalValue = totalCostSaved + timeValue;

    // Assume optimization system costs $10/day to run
    const costOfOptimization = 10 * (params.lookbackDays || 7);
    const roi = (totalValue / costOfOptimization) * 100;

    return {
      totalCostSaved,
      totalTimeSaved: Math.round(totalTimeSaved),
      totalOptimizations: stats.totalOptimizations,
      ROI: Math.round(roi),
      paybackPeriod: roi > 100 ? 'Less than 1 day' : `${Math.round(costOfOptimization / (totalValue || 1))} days`,
    };
  }
}

export const optimizerArchiveBridge = new OptimizerArchiveBridge();
