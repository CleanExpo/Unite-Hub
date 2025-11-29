/**
 * Chaos Test API
 * Phase 65: Manage chaos test execution and events
 * ADMIN ONLY - Chaos tests can destabilize the system
 */

import { NextRequest, NextResponse } from 'next/server';
import ChaosTestEngine, { ApprovedFault, ChaosMode } from '@/lib/testing/chaosTestEngine';
import { createClient } from '@/lib/supabase/server';

const chaosTestEngine = new ChaosTestEngine();

// Helper to verify admin access
async function verifyAdminAccess(): Promise<{ authorized: boolean; userId?: string; error?: NextResponse }> {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Unauthorized - authentication required' }, { status: 401 })
    };
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = profile?.role || 'CLIENT';
  if (!['ADMIN', 'FOUNDER'].includes(role)) {
    return {
      authorized: false,
      error: NextResponse.json({ error: 'Forbidden - admin access required for chaos testing' }, { status: 403 })
    };
  }

  return { authorized: true, userId: user.id };
}

export async function GET(req: NextRequest) {
  // Verify admin access
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return authCheck.error;
  }

  try {
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const action = searchParams.get('action') || 'status';

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'status': {
        // Get current chaos event status
        const currentEvent = chaosTestEngine.getCurrentEvent();
        return NextResponse.json({
          current_event: currentEvent,
          available_faults: chaosTestEngine.getAvailableFaults(),
          blocked_faults: chaosTestEngine.getBlockedFaults(),
        });
      }

      case 'faults': {
        // List available faults with configs
        const faults = chaosTestEngine.getAvailableFaults();
        const faultDetails = faults.map(fault => ({
          fault,
          config: chaosTestEngine.getFaultConfig(fault),
        }));
        return NextResponse.json({ faults: faultDetails });
      }

      case 'modes': {
        // List available modes
        const modes: ChaosMode[] = ['safe', 'aggressive', 'extreme'];
        const modeDetails = modes.map(mode => ({
          mode,
          multiplier: chaosTestEngine.getModeMultiplier(mode),
        }));
        return NextResponse.json({ modes: modeDetails });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Chaos test API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  // Verify admin access
  const authCheck = await verifyAdminAccess();
  if (!authCheck.authorized) {
    return authCheck.error;
  }

  try {
    const body = await req.json();
    const { action, workspaceId, fault, mode, intensity, duration_seconds, auto_pause_threshold } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'start': {
        // Start a chaos test
        if (!fault) {
          return NextResponse.json(
            { error: 'fault is required' },
            { status: 400 }
          );
        }

        // Check if fault is blocked
        if (chaosTestEngine.isFaultBlocked(fault)) {
          return NextResponse.json(
            { error: `Blocked fault type: ${fault}` },
            { status: 403 }
          );
        }

        // Validate fault
        const availableFaults = chaosTestEngine.getAvailableFaults();
        if (!availableFaults.includes(fault as ApprovedFault)) {
          return NextResponse.json(
            { error: `Invalid fault. Available: ${availableFaults.join(', ')}` },
            { status: 400 }
          );
        }

        // Check if chaos event already active
        const currentEvent = chaosTestEngine.getCurrentEvent();
        if (currentEvent && currentEvent.status === 'active') {
          return NextResponse.json(
            { error: 'A chaos event is already active' },
            { status: 409 }
          );
        }

        // Start chaos test
        const result = await chaosTestEngine.startChaosTest(workspaceId, {
          fault: fault as ApprovedFault,
          mode: (mode as ChaosMode) || 'safe',
          intensity: intensity || 50,
          duration_seconds: duration_seconds || 120,
          affected_services: [],
          auto_pause_threshold: auto_pause_threshold || 0.1,
        });

        return NextResponse.json({
          message: 'Chaos test started',
          event: result,
        });
      }

      case 'pause': {
        // Pause current chaos test
        chaosTestEngine.pauseTest();
        return NextResponse.json({
          message: 'Chaos test paused',
          event: chaosTestEngine.getCurrentEvent(),
        });
      }

      case 'kill_switch': {
        // Activate kill switch
        chaosTestEngine.activateKillSwitch();
        return NextResponse.json({
          message: 'Kill switch activated - all chaos tests aborted',
          event: chaosTestEngine.getCurrentEvent(),
        });
      }

      case 'reset_kill_switch': {
        // Deactivate kill switch
        chaosTestEngine.deactivateKillSwitch();
        return NextResponse.json({
          message: 'Kill switch deactivated',
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: start, pause, kill_switch, reset_kill_switch' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Chaos test API error:', error);

    // Handle specific errors
    if (error instanceof Error && error.message.includes('Kill switch')) {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
