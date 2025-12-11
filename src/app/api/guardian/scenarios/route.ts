import { NextResponse } from 'next/server';
import {
  listScenarios,
  listScenarioRuns,
  listScenarioRunEvents,
} from '@/lib/guardian/scenarioSimulatorService';
import { getGuardianTenantContext } from '@/lib/guardian/tenant';
import { getGuardianAccessContext, assertGuardianRole } from '@/lib/guardian/access';
import { logGuardianAccess, extractSourceIp, extractUserAgent } from '@/lib/guardian/audit';

/**
 * Guardian G28 + G30 + G31 + G32 + G33: Scenario Simulator API
 * Read-only access with role-based permissions and audit logging
 *
 * Allowed roles: guardian_admin only
 *
 * GET /api/guardian/scenarios?scenarioId=<optional>&runId=<optional>
 * Returns scenario definitions, runs, and events for authenticated founder
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const scenarioIdParam = url.searchParams.get('scenarioId') || undefined;
  const runIdParam = url.searchParams.get('runId') || undefined;
  const endpoint = '/api/guardian/scenarios';
  const method = 'GET';

  try {
    // G32: Check access level (admin only)
    const { role, userId } = await getGuardianAccessContext();
    assertGuardianRole(role, ['guardian_admin']);

    const { tenantId } = await getGuardianTenantContext();

    const scenarios = await listScenarios(tenantId);

    if (scenarios.length === 0) {
      // G33: Best-effort audit logging (success - empty state)
      await logGuardianAccess({
        tenantId,
        userId,
        role,
        endpoint,
        method,
        statusCode: 200,
        success: true,
        sourceIp: extractSourceIp(req),
        userAgent: extractUserAgent(req),
        meta: { note: 'no_scenarios' },
      });

      return NextResponse.json({
        scenarios: [],
        runs: [],
        events: [],
        activeScenarioId: null,
        activeRunId: null,
      });
    }

    const activeScenarioId = scenarioIdParam ?? scenarios[0].id;

    const runs = await listScenarioRuns(tenantId, activeScenarioId);

    const activeRunId = runIdParam ?? runs[0]?.id ?? null;

    const events = activeRunId ? await listScenarioRunEvents(tenantId, activeRunId) : [];

    // G33: Best-effort audit logging (success)
    await logGuardianAccess({
      tenantId,
      userId,
      role,
      endpoint,
      method,
      statusCode: 200,
      success: true,
      sourceIp: extractSourceIp(req),
      userAgent: extractUserAgent(req),
      meta: {
        activeScenarioId,
        requestedScenarioId: scenarioIdParam ?? null,
        activeRunId,
        requestedRunId: runIdParam ?? null,
        scenarioCount: scenarios.length,
        runCount: runs.length,
        eventCount: events.length,
      },
    });

    return NextResponse.json({
      scenarios,
      runs,
      events,
      activeScenarioId,
      activeRunId,
    });
  } catch (error: any) {
    const message = String(error);
    const code = message.includes('UNAUTHENTICATED')
      ? 401
      : message.includes('FORBIDDEN')
      ? 403
      : 500;

    // G33: Best-effort audit logging (failure)
    try {
      const { tenantId } = await getGuardianTenantContext().catch(() => ({
        tenantId: 'UNKNOWN_TENANT',
      }));
      const { role, userId } = await getGuardianAccessContext().catch(() => ({
        role: 'guardian_viewer' as const,
        userId: 'UNKNOWN_USER',
      }));

      await logGuardianAccess({
        tenantId,
        userId,
        role,
        endpoint,
        method,
        statusCode: code,
        success: false,
        sourceIp: extractSourceIp(req),
        userAgent: extractUserAgent(req),
        meta: {
          error: message,
          scenarioId: scenarioIdParam ?? null,
          runId: runIdParam ?? null,
        },
      });
    } catch (_) {
      // Ignore audit failures in error path
    }

    console.error('Guardian Scenarios access denied:', error);
    return NextResponse.json(
      { error: 'Guardian scenario simulator access denied.' },
      { status: code }
    );
  }
}
