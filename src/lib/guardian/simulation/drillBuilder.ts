/**
 * Guardian I07: Drill Builder
 *
 * Transforms I01–I04 simulations into reusable drill templates.
 * Extracts event timelines and reconstructs incident narratives
 * without exposing sensitive data or PII.
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface GuardianDrillSourceDescriptor {
  type: 'scenario_run' | 'regression_run' | 'playbook_sim_run' | 'historical_incident';
  id: string;
}

export interface GuardianDrillEvent {
  sequenceIndex: number;
  occurredOffsetSeconds: number;
  eventType: string; // 'alert' | 'incident' | 'correlation' | 'risk_change' | 'notification' | 'system_message'
  severity?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface GuardianDrillTemplateDraft {
  name: string;
  description?: string;
  difficulty: 'easy' | 'normal' | 'hard' | 'chaos';
  expectedObjectives?: Record<string, unknown>;
  events: GuardianDrillEvent[];
  metadata?: Record<string, unknown>;
}

/**
 * Build a drill template from a simulation run
 */
export async function buildDrillTemplateFromSimulation(
  tenantId: string,
  source: GuardianDrillSourceDescriptor
): Promise<GuardianDrillTemplateDraft> {
  const supabase = getSupabaseServer();
  const events: GuardianDrillEvent[] = [];

  if (source.type === 'scenario_run' || source.type === 'regression_run') {
    // Load simulation events from I02/I03
    const { data: simulationEvents, error } = await supabase
      .from('guardian_simulation_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('simulation_run_id', source.id)
      .order('occurred_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to load simulation events: ${error.message}`);
    }

    if (simulationEvents && simulationEvents.length > 0) {
      const startTime = new Date(simulationEvents[0].occurred_at).getTime();

      simulationEvents.forEach((evt, idx) => {
        const eventTime = new Date(evt.occurred_at).getTime();
        const offsetSeconds = Math.round((eventTime - startTime) / 1000);

        events.push({
          sequenceIndex: idx,
          occurredOffsetSeconds: offsetSeconds,
          eventType: evt.event_type || 'system_message',
          severity: evt.severity,
          message: evt.message || `${evt.event_type} event`,
          details: {
            sourceRunId: source.id,
            simulatedRuleKey: evt.metadata?.rule_key,
            simulatedIncidentId: evt.metadata?.incident_id,
          },
        });
      });
    }
  } else if (source.type === 'playbook_sim_run') {
    // Load playbook simulation steps from I04
    const { data: playbookSteps, error } = await supabase
      .from('guardian_playbook_simulation_steps')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('simulation_run_id', source.id)
      .order('sequence_index', { ascending: true });

    if (error) {
      throw new Error(`Failed to load playbook steps: ${error.message}`);
    }

    if (playbookSteps && playbookSteps.length > 0) {
      playbookSteps.forEach((step, idx) => {
        events.push({
          sequenceIndex: idx,
          occurredOffsetSeconds: (step.sequence_index || idx) * 30, // Estimate 30s per action
          eventType: 'system_message',
          severity: step.severity,
          message: step.action_description || `Playbook action: ${step.action_type}`,
          details: {
            sourceRunId: source.id,
            playbookId: step.playbook_id,
            actionType: step.action_type,
            actionDescription: step.action_description,
          },
        });
      });
    }
  } else if (source.type === 'historical_incident') {
    // Load real incident data in read-only mode (no mutation)
    const { data: incident, error: incidentError } = await supabase
      .from('guardian_incidents')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('id', source.id)
      .single();

    if (incidentError || !incident) {
      throw new Error(`Failed to load historical incident: ${incidentError?.message || 'Not found'}`);
    }

    // Load related alerts for the incident
    const { data: alerts, error: alertsError } = await supabase
      .from('guardian_alerts')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('incident_id', source.id)
      .order('occurred_at', { ascending: true });

    if (alertsError) {
      throw new Error(`Failed to load alerts: ${alertsError.message}`);
    }

    if (alerts && alerts.length > 0) {
      const startTime = new Date(alerts[0].occurred_at).getTime();

      alerts.forEach((alert, idx) => {
        const alertTime = new Date(alert.occurred_at).getTime();
        const offsetSeconds = Math.round((alertTime - startTime) / 1000);

        events.push({
          sequenceIndex: idx,
          occurredOffsetSeconds: offsetSeconds,
          eventType: 'alert',
          severity: alert.severity,
          message: `Alert: ${alert.rule_key}`,
          details: {
            sourceIncidentId: source.id,
            ruleKey: alert.rule_key,
            alertId: alert.id,
          },
        });
      });
    }
  }

  // Build template metadata
  const metadata: Record<string, unknown> = {
    sourceDescriptor: source,
    reconstructedAt: new Date().toISOString(),
  };

  return {
    name: `Drill from ${source.type}: ${source.id.substring(0, 8)}`,
    description: `Training drill based on ${source.type}`,
    difficulty: 'normal',
    expectedObjectives: {
      understanding: 'Understand incident flow and response priorities',
      speed: 'Respond to critical events within SLA',
      communication: 'Clearly document decisions and actions',
    },
    events,
    metadata,
  };
}

/**
 * Create a drill from a template
 */
export async function createDrillFromTemplate(
  tenantId: string,
  template: GuardianDrillTemplateDraft,
  source: GuardianDrillSourceDescriptor,
  actorId?: string
): Promise<string> {
  const supabase = getSupabaseServer();

  // Create drill record
  const { data: drill, error: drillError } = await supabase
    .from('guardian_incident_drills')
    .insert({
      tenant_id: tenantId,
      name: template.name,
      description: template.description,
      source_type: source.type,
      source_ref: source.id,
      difficulty: template.difficulty,
      expected_objectives: template.expectedObjectives,
      created_by: actorId,
      metadata: template.metadata,
    })
    .select('id')
    .single();

  if (drillError || !drill) {
    throw new Error(`Failed to create drill: ${drillError?.message || 'Unknown error'}`);
  }

  const drillId = drill.id;

  // Insert events
  if (template.events.length > 0) {
    const eventRows = template.events.map((evt) => ({
      tenant_id: tenantId,
      drill_id: drillId,
      sequence_index: evt.sequenceIndex,
      occurred_offset_seconds: evt.occurredOffsetSeconds,
      event_type: evt.eventType,
      severity: evt.severity,
      message: evt.message,
      details: evt.details,
    }));

    const { error: eventsError } = await supabase
      .from('guardian_incident_drill_events')
      .insert(eventRows);

    if (eventsError) {
      throw new Error(`Failed to create drill events: ${eventsError.message}`);
    }
  }

  return drillId;
}

/**
 * List available simulation sources for drill creation
 */
export async function listSimulationSources(
  tenantId: string,
  type?: 'scenario_run' | 'regression_run' | 'playbook_sim_run'
): Promise<GuardianDrillSourceDescriptor[]> {
  const supabase = getSupabaseServer();
  const sources: GuardianDrillSourceDescriptor[] = [];

  if (!type || type === 'scenario_run' || type === 'regression_run') {
    // Load simulation runs from I02
    const { data: simRuns, error } = await supabase
      .from('guardian_simulation_runs')
      .select('id, simulation_type')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && simRuns) {
      simRuns.forEach((run) => {
        const simType = run.simulation_type === 'chaos' ? 'scenario_run' : 'regression_run';
        if (!type || type === simType) {
          sources.push({
            type: simType as 'scenario_run' | 'regression_run',
            id: run.id,
          });
        }
      });
    }
  }

  if (!type || type === 'playbook_sim_run') {
    // Load playbook simulation runs from I04
    const { data: pbSimRuns, error } = await supabase
      .from('guardian_playbook_simulation_runs')
      .select('id')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && pbSimRuns) {
      pbSimRuns.forEach((run) => {
        sources.push({
          type: 'playbook_sim_run',
          id: run.id,
        });
      });
    }
  }

  return sources;
}
