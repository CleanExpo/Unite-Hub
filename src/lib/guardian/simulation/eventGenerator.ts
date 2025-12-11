/**
 * Guardian I02: Synthetic Event Generator
 *
 * Expands simulation scenarios into ordered synthetic events.
 * Generates GuardianGeneratedEventSpec objects for pipeline emulation.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianGeneratedEventSpec {
  sequenceIndex: number;
  generatedAt: Date;
  ruleKey: string;
  severity: string;
  label?: string;
  patternId?: string;
  attributes?: Record<string, unknown>;
}

export interface GuardianSimulationPattern {
  ruleKey: string;
  severity: string;
  distribution: 'uniform' | 'front_loaded' | 'back_loaded';
  eventCount: number;
}

export interface GenerationContext {
  tenantId: string;
  runId: string;
  patterns: GuardianSimulationPattern[];
  durationMinutes: number;
  baseWindow: { start: Date; end: Date };
}

/**
 * Calculate event timestamps based on distribution strategy
 */
function calculateEventTimestamps(
  count: number,
  distribution: 'uniform' | 'front_loaded' | 'back_loaded',
  baseWindow: { start: Date; end: Date }
): Date[] {
  const timestamps: Date[] = [];
  const durationMs = baseWindow.end.getTime() - baseWindow.start.getTime();

  if (distribution === 'uniform') {
    // Evenly spaced
    const intervalMs = durationMs / count;
    for (let i = 0; i < count; i++) {
      timestamps.push(new Date(baseWindow.start.getTime() + intervalMs * (i + 0.5)));
    }
  } else if (distribution === 'front_loaded') {
    // Cluster events toward the start
    for (let i = 0; i < count; i++) {
      const ratio = Math.pow(i / count, 0.5); // Square root gives front-loading
      const offsetMs = ratio * durationMs;
      timestamps.push(new Date(baseWindow.start.getTime() + offsetMs));
    }
  } else if (distribution === 'back_loaded') {
    // Cluster events toward the end
    for (let i = 0; i < count; i++) {
      const ratio = Math.pow(i / count, 2); // Square gives back-loading
      const offsetMs = ratio * durationMs;
      timestamps.push(new Date(baseWindow.start.getTime() + offsetMs));
    }
  }

  return timestamps;
}

/**
 * Generate synthetic events for a simulation run
 */
export async function generateEventsForScenario(
  tenantId: string,
  runId: string,
  patterns: GuardianSimulationPattern[],
  baseWindow: { start: Date; end: Date }
): Promise<GuardianGeneratedEventSpec[]> {
  const specs: GuardianGeneratedEventSpec[] = [];
  let sequenceIndex = 0;

  for (const pattern of patterns) {
    const timestamps = calculateEventTimestamps(
      pattern.eventCount,
      pattern.distribution,
      baseWindow
    );

    for (const ts of timestamps) {
      specs.push({
        sequenceIndex: sequenceIndex++,
        generatedAt: ts,
        ruleKey: pattern.ruleKey,
        severity: pattern.severity,
        label: `Simulated ${pattern.ruleKey} [${pattern.severity}]`,
        patternId: pattern.ruleKey,
        attributes: {
          pattern: pattern.ruleKey,
          distribution: pattern.distribution,
          synthetic: true,
        },
      });
    }
  }

  // Sort by timestamp to ensure proper sequencing
  specs.sort((a, b) => a.generatedAt.getTime() - b.generatedAt.getTime());

  // Reassign sequence indices after sort
  specs.forEach((spec, idx) => {
    spec.sequenceIndex = idx;
  });

  // Persist to database
  const supabase = getSupabaseServer();

  if (specs.length > 0) {
    const { error } = await supabase.from('guardian_simulation_events').insert(
      specs.map(spec => ({
        tenant_id: tenantId,
        run_id: runId,
        sequence_index: spec.sequenceIndex,
        generated_at: spec.generatedAt.toISOString(),
        rule_key: spec.ruleKey,
        severity: spec.severity,
        label: spec.label,
        pattern_id: spec.patternId,
        attributes: spec.attributes || {},
        metadata: {
          generator: 'eventGenerator',
          generatedAt: new Date().toISOString(),
        },
      }))
    );

    if (error) {
      console.error('Error persisting generated events:', error);
      throw new Error(`Failed to persist synthetic events: ${error.message}`);
    }
  }

  return specs;
}

/**
 * Load generated events for a run
 */
export async function loadGeneratedEventsForRun(
  tenantId: string,
  runId: string
): Promise<GuardianGeneratedEventSpec[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('guardian_simulation_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('run_id', runId)
    .order('sequence_index', { ascending: true });

  if (error) {
    console.error('Error loading generated events:', error);
    throw new Error(`Failed to load synthetic events: ${error.message}`);
  }

  return (data || []).map(row => ({
    sequenceIndex: row.sequence_index,
    generatedAt: new Date(row.generated_at),
    ruleKey: row.rule_key,
    severity: row.severity,
    label: row.label,
    patternId: row.pattern_id,
    attributes: row.attributes,
  }));
}
