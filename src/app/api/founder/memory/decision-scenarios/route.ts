/**
 * Founder Decision Scenarios API
 *
 * GET: List all scenarios
 * POST: Create new scenario simulation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  decisionSimulatorService,
  type ScenarioType,
  type ScenarioStatus,
} from '@/lib/founderMemory';

export async function GET(req: NextRequest) {
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

    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const scenarioType = req.nextUrl.searchParams.get('scenarioType') as ScenarioType | null;
    const status = req.nextUrl.searchParams.get('status') as ScenarioStatus | null;
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '20');

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 });
    }

    const scenarios = await decisionSimulatorService.getScenarios(userId, workspaceId, {
      scenarioType: scenarioType || undefined,
      status: status || undefined,
      limit,
    });

    return NextResponse.json({
      success: true,
      scenarios: scenarios.map((s) => ({
        id: s.id,
        scenarioType: s.scenarioType,
        title: s.title,
        description: s.description,
        assumptions: s.assumptionsJson,
        simulatedOutcomes: s.simulatedOutcomesJson,
        aiRecommendation: s.aiRecommendation,
        confidenceScore: s.confidenceScore,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
        decidedAt: s.decidedAt?.toISOString() || null,
        actualOutcome: s.actualOutcomeJson,
      })),
      count: scenarios.length,
    });
  } catch (error) {
    console.error('[API] GET /api/founder/memory/decision-scenarios error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const { workspaceId, scenarioType, title, description, assumptions } = body;

    if (!workspaceId || !scenarioType || !title) {
      return NextResponse.json(
        { error: 'workspaceId, scenarioType, and title are required' },
        { status: 400 }
      );
    }

    const scenario = await decisionSimulatorService.createScenario({
      founderId: userId,
      workspaceId,
      scenarioType,
      title,
      description,
      assumptions,
    });

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
      },
    });
  } catch (error) {
    console.error('[API] POST /api/founder/memory/decision-scenarios error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
