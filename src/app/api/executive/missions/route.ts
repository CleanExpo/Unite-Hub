/**
 * Executive Missions API
 * Phase 62: Manage cross-agent missions
 */

import { NextRequest, NextResponse } from 'next/server';
import { MissionPlanner } from '@/lib/executive/missionPlanner';
import { ExecutiveBrain, DecisionTrigger } from '@/lib/executive/executiveBrain';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const missionId = searchParams.get('id');
    const clientId = searchParams.get('client_id');

    const planner = new MissionPlanner();

    if (missionId) {
      const mission = planner.getMission(missionId);
      if (!mission) {
        return NextResponse.json(
          { error: 'Mission not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ data: mission });
    }

    if (clientId) {
      const missions = planner.getClientMissions(clientId);
      return NextResponse.json({ data: missions });
    }

    const activeMissions = planner.getActiveMissions();
    return NextResponse.json({
      data: activeMissions,
      total: activeMissions.length,
    });
  } catch (error) {
    console.error('Executive missions GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, trigger, client_id, mission_type, priority, mission_id, step_number, result } = body;

    const brain = new ExecutiveBrain();
    const planner = new MissionPlanner();

    switch (action) {
      case 'create':
        if (!trigger || !client_id) {
          return NextResponse.json(
            { error: 'trigger and client_id required' },
            { status: 400 }
          );
        }

        // Process trigger to get decision
        const decision = await brain.processTrigger(trigger as DecisionTrigger, {
          client_id,
          data: body.data,
        });

        // Plan mission if decision approved
        let mission = null;
        if (decision.status === 'approved') {
          mission = planner.planMission(
            decision.mission_type,
            client_id,
            decision.priority
          );
          planner.startMission(mission.id);
        }

        return NextResponse.json({
          success: true,
          data: {
            decision,
            mission,
          },
        });

      case 'plan':
        if (!mission_type || !client_id || !priority) {
          return NextResponse.json(
            { error: 'mission_type, client_id, and priority required' },
            { status: 400 }
          );
        }

        const plannedMission = planner.planMission(
          mission_type,
          client_id,
          priority
        );

        return NextResponse.json({
          success: true,
          data: plannedMission,
        });

      case 'start':
        if (!mission_id) {
          return NextResponse.json(
            { error: 'mission_id required' },
            { status: 400 }
          );
        }

        const started = planner.startMission(mission_id);
        return NextResponse.json({
          success: started,
          message: started ? 'Mission started' : 'Mission not found or already started',
        });

      case 'complete_step':
        if (!mission_id || !step_number || !result) {
          return NextResponse.json(
            { error: 'mission_id, step_number, and result required' },
            { status: 400 }
          );
        }

        const completed = planner.completeStep(mission_id, step_number, result);
        const updatedMission = planner.getMission(mission_id);

        return NextResponse.json({
          success: completed,
          data: updatedMission,
        });

      case 'cancel':
        if (!mission_id) {
          return NextResponse.json(
            { error: 'mission_id required' },
            { status: 400 }
          );
        }

        const cancelled = planner.cancelMission(mission_id);
        return NextResponse.json({
          success: cancelled,
          message: cancelled ? 'Mission cancelled' : 'Mission not found or already completed',
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: create, plan, start, complete_step, cancel' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Executive missions POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
