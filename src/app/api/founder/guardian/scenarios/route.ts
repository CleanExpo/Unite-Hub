import { NextResponse } from 'next/server';
import {
  listScenarios,
  getScenario,
  listScenarioRuns,
  getScenarioRun,
  listScenarioRunEvents,
  getActiveScenariosCount,
} from '@/lib/founder/guardian/scenarioSimulatorService';
import { getGuardianTenantContext } from '@/lib/founder/guardian/tenant';

/**
 * Guardian G28 + G30: Scenario Simulator API
 * GET /api/founder/guardian/scenarios?scenarioId=<optional>&runId=<optional>
 * Returns scenario definitions, runs, and events using centralized tenant context
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const scenarioId = url.searchParams.get('scenarioId') || undefined;
    const runId = url.searchParams.get('runId') || undefined;

    const { tenantId } = await getGuardianTenantContext();

    const scenarios = await listScenarios(tenantId);

    if (scenarios.length === 0) {
      return NextResponse.json({
        scenarios: [],
        runs: [],
        events: [],
        activeScenarioId: null,
        activeRunId: null,
        summary: {
          total_scenarios: 0,
          active_scenarios: 0,
          total_runs: 0,
        },
      });
    }

    const effectiveScenarioId = scenarioId ?? scenarios[0]?.id;

    if (!effectiveScenarioId) {
      return NextResponse.json({
        scenarios,
        runs: [],
        events: [],
        activeScenarioId: null,
        activeRunId: null,
        summary: {
          total_scenarios: scenarios.length,
          active_scenarios: 0,
          total_runs: 0,
        },
      });
    }

    const [scenario, runs, activeCount] = await Promise.all([
      getScenario(tenantId, effectiveScenarioId),
      listScenarioRuns(tenantId, effectiveScenarioId),
      getActiveScenariosCount(tenantId),
    ]);

    const effectiveRunId = runId ?? runs[0]?.id;

    let run: any = null;
    let events: any[] = [];

    if (effectiveRunId) {
      [run, events] = await Promise.all([
        getScenarioRun(tenantId, effectiveRunId),
        listScenarioRunEvents(tenantId, effectiveRunId),
      ]);
    }

    return NextResponse.json({
      scenarios,
      runs,
      events,
      activeScenarioId: effectiveScenarioId,
      activeRunId: effectiveRunId || null,
      activeScenario: scenario,
      activeRun: run,
      summary: {
        total_scenarios: scenarios.length,
        active_scenarios: activeCount,
        total_runs: runs.length,
        event_count: events.length,
      },
    });
  } catch (error: any) {
    console.error('Error fetching Guardian scenario data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch scenario data' },
      { status: 500 }
    );
  }
}
