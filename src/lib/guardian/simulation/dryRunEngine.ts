/**
 * Guardian I01+I02: Dry Run & Pipeline Emulation Engine
 *
 * Orchestrates simulation execution:
 * - I01: Impact estimation and scenario expansion
 * - I02: Full pipeline emulation with trace logging
 */

import { getSupabaseServer } from '@/lib/supabase';
import { generateEventsForScenario, GuardianSimulationPattern } from './eventGenerator';
import {
  emulatePipelineForRun,
  GuardianPipelineEmulationContext,
  GuardianEmulationResultSummary,
} from './pipelineEmulator';

export interface GuardianSimulationRequest {
  tenantId: string;
  scenarioId: string;
  actorId?: string;
  overrideWindow?: { start: Date; end: Date };
  emulatePipeline?: boolean;
  emulateScope?: 'alerts_only' | 'incident_flow' | 'full_guardian';
}

export interface GuardianDryRunResult {
  runId: string;
  status: 'completed' | 'failed';
  impactEstimate: {
    estimatedEvents: number;
    estimatedAlerts?: number;
    estimatedIncidents?: number;
    estimatedNotifications?: number;
  };
  pipelineSummary?: GuardianEmulationResultSummary;
  errorMessage?: string;
  traceLogs?: string[];
}

/**
 * Run a dry-run simulation, optionally with full pipeline emulation
 */
export async function runDryRun(
  req: GuardianSimulationRequest
): Promise<GuardianDryRunResult> {
  const supabase = getSupabaseServer();
  const { tenantId, scenarioId, actorId = 'system', overrideWindow, emulatePipeline = false, emulateScope = 'full_guardian' } = req;

  // Create simulation run
  const { data: runData, error: runError } = await supabase
    .from('guardian_simulation_runs')
    .insert({
      tenant_id: tenantId,
      scenario_id: scenarioId,
      actor_id: actorId,
      status: 'running',
      mode: emulatePipeline ? 'pipeline_emulation' : 'impact_estimation',
      effective_window_start: overrideWindow?.start || new Date(Date.now() - 24 * 60 * 60 * 1000),
      effective_window_end: overrideWindow?.end || new Date(),
      metadata: {
        emulateScope: emulateScope,
      },
    })
    .select('id')
    .single();

  if (runError || !runData) {
    return {
      runId: '',
      status: 'failed',
      impactEstimate: { estimatedEvents: 0 },
      errorMessage: `Failed to create simulation run: ${runError?.message || 'Unknown error'}`,
    };
  }

  const runId = runData.id;
  const traceLogs: string[] = [];

  try {
    // For now, use mock scenario patterns
    // In production, these would be resolved from guardian_simulation_scenarios table
    const patterns: GuardianSimulationPattern[] = [
      {
        ruleKey: 'auth_brute_force',
        severity: 'high',
        distribution: 'front_loaded',
        eventCount: 10,
      },
      {
        ruleKey: 'data_exfiltration',
        severity: 'critical',
        distribution: 'uniform',
        eventCount: 5,
      },
      {
        ruleKey: 'policy_violation',
        severity: 'medium',
        distribution: 'back_loaded',
        eventCount: 8,
      },
    ];

    // Determine effective window
    const effectiveWindow = overrideWindow || {
      start: new Date(Date.now() - 24 * 60 * 60 * 1000),
      end: new Date(),
    };

    // Generate synthetic events
    const events = await generateEventsForScenario(tenantId, runId, patterns, effectiveWindow);
    traceLogs.push(`Generated ${events.length} synthetic events`);

    let pipelineSummary: GuardianEmulationResultSummary | undefined;
    if (emulatePipeline) {
      const context: GuardianPipelineEmulationContext = {
        tenantId,
        runId,
        scope: emulateScope,
        startTime: effectiveWindow.start,
        endTime: effectiveWindow.end,
      };

      pipelineSummary = await emulatePipelineForRun(context);
      traceLogs.push(`Pipeline emulation complete: ${pipelineSummary.simulatedAlerts} alerts, ${pipelineSummary.simulatedIncidents} incidents`);
    }

    // Update run with completion status
    const impactEstimate = {
      estimatedEvents: events.length,
      estimatedAlerts: pipelineSummary?.simulatedAlerts || events.length,
      estimatedIncidents: pipelineSummary?.simulatedIncidents,
      estimatedNotifications: pipelineSummary?.simulatedNotifications,
    };

    await supabase
      .from('guardian_simulation_runs')
      .update({
        status: 'completed',
        impact_estimate: impactEstimate,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    return {
      runId,
      status: 'completed',
      impactEstimate,
      pipelineSummary,
      traceLogs,
    };
  } catch (error: any) {
    traceLogs.push(`Error: ${error.message}`);

    // Update run with failure status
    await supabase
      .from('guardian_simulation_runs')
      .update({
        status: 'failed',
        error_message: error.message,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId)
      .catch(() => {
        // Ignore update errors
      });

    return {
      runId,
      status: 'failed',
      impactEstimate: { estimatedEvents: 0 },
      errorMessage: error.message,
      traceLogs,
    };
  }
}
