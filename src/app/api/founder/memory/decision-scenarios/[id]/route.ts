/**
 * Individual Decision Scenario API
 *
 * GET: Fetch specific scenario
 * PATCH: Update scenario status or record actual outcome
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { decisionSimulatorService, type ScenarioStatus } from '@/lib/founderMemory';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const { id } = await params;
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const scenario = await decisionSimulatorService.getScenarioById(id, workspaceId);

    if (!scenario) {
      return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      scenario: {
        id: scenario.id,
        scenarioType: scenario.scenarioType,
        title: scenario.title,
        description: scenario.description,
        assumptions: scenario.assumptionsJson,
        simulatedOutcomes: scenario.simulatedOutcomesJson,
        aiRecommendation: scenario.aiRecommendation,
        confidenceScore: scenario.confidenceScore,
        status: scenario.status,
        createdAt: scenario.createdAt.toISOString(),
        decidedAt: scenario.decidedAt?.toISOString() || null,
        actualOutcome: scenario.actualOutcomeJson,
      },
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/decision-scenarios/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
    }

    const { id } = await params;
    const body = await req.json();
    const { workspaceId, status, actualOutcome, notes } = body;

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    // If recording actual outcome
    if (actualOutcome) {
      const updated = await decisionSimulatorService.recordActualOutcome(
        id,
        workspaceId,
        actualOutcome
      );

      if (!updated) {
        return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        scenario: {
          id: updated.id,
          status: updated.status,
          actualOutcome: updated.actualOutcomeJson,
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    // Update status
    if (status) {
      const updated = await decisionSimulatorService.updateScenarioStatus(
        id,
        workspaceId,
        status as ScenarioStatus,
        notes
      );

      if (!updated) {
        return NextResponse.json({ error: 'Scenario not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        scenario: {
          id: updated.id,
          status: updated.status,
          decidedAt: updated.decidedAt?.toISOString() || null,
          updatedAt: updated.updatedAt.toISOString(),
        },
      });
    }

    return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
  } catch (error) {
    console.error('[API] PATCH /api/founder/memory/decision-scenarios/[id] error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
