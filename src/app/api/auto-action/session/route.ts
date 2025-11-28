/**
 * Auto-Action Session API
 *
 * Manages auto-action sessions for client/staff onboarding and CRM automation.
 *
 * POST - Start a new auto-action session
 * GET  - Get current session status
 * DELETE - Cancel/stop current session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  getComputerUseOrchestrator,
  getFlow,
  flowToTask,
  validateFlowData,
  isAutoActionConfigured,
  isFeatureEnabled,
} from '@/lib/autoAction';
import type { OnboardingData } from '@/lib/autoAction';

// ============================================================================
// POST - Start new session
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Authenticate
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

    // Check if auto-action is configured
    if (!isAutoActionConfigured()) {
      return NextResponse.json(
        { error: 'Auto-action engine is not configured' },
        { status: 503 }
      );
    }

    // Parse request body
    const body = await req.json();
    const { flowId, workspaceId, data: flowData } = body as {
      flowId: string;
      workspaceId: string;
      data: OnboardingData;
    };

    if (!flowId || !workspaceId) {
      return NextResponse.json(
        { error: 'Missing required fields: flowId, workspaceId' },
        { status: 400 }
      );
    }

    // Get flow template
    const flow = getFlow(flowId);
    if (!flow) {
      return NextResponse.json(
        { error: `Unknown flow: ${flowId}` },
        { status: 400 }
      );
    }

    // Check feature flag
    const featureMap: Record<string, 'clientOnboarding' | 'staffOnboarding' | 'crmAutoFill' | 'documentUpload'> = {
      client_onboarding: 'clientOnboarding',
      staff_onboarding: 'staffOnboarding',
      crm_autofill: 'crmAutoFill',
      custom: 'clientOnboarding',
    };

    const feature = featureMap[flow.type];
    if (!isFeatureEnabled(feature)) {
      return NextResponse.json(
        { error: `Feature "${flow.type}" is disabled` },
        { status: 403 }
      );
    }

    // Validate required data
    const validation = validateFlowData(flow, flowData || {});
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Missing required data fields',
          missingFields: validation.missingFields,
        },
        { status: 400 }
      );
    }

    // Create task from flow
    const task = flowToTask(flow, flowData || {});

    // Get orchestrator
    const orchestrator = getComputerUseOrchestrator();

    // Check if already running
    if (orchestrator.getIsRunning()) {
      return NextResponse.json(
        {
          error: 'Another session is already running',
          sessionId: orchestrator.getSessionId(),
        },
        { status: 409 }
      );
    }

    // Note: The actual execution would be handled by a separate process
    // or WebSocket connection. This endpoint just validates and queues the task.

    return NextResponse.json({
      success: true,
      message: 'Session ready to start',
      task: {
        id: task.id,
        type: task.type,
        name: task.name,
        description: task.description,
        stepsCount: task.steps?.length || 0,
      },
      flow: {
        id: flow.id,
        name: flow.name,
        estimatedDuration: flow.estimatedDuration,
        targetUrl: flow.targetUrl,
      },
      instructions: {
        message: 'Use WebSocket connection to /api/auto-action/ws to start execution',
        note: 'Browser interface must be initialized before starting',
      },
    });
  } catch (error) {
    console.error('Auto-action session error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get session status
// ============================================================================

export async function GET(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const orchestrator = getComputerUseOrchestrator();
    const progress = orchestrator.getProgress();
    const sessionId = orchestrator.getSessionId();
    const isRunning = orchestrator.getIsRunning();

    return NextResponse.json({
      isRunning,
      sessionId,
      progress: progress
        ? {
            taskId: progress.taskId,
            status: progress.status,
            currentStep: progress.currentStep,
            totalSteps: progress.totalSteps,
            progress: progress.progress,
            pendingApproval: progress.pendingApproval
              ? {
                  id: progress.pendingApproval.id,
                  category: progress.pendingApproval.category,
                  description: progress.pendingApproval.description,
                  risk: progress.pendingApproval.risk,
                }
              : null,
            errors: progress.errors,
            startedAt: progress.startedAt,
            updatedAt: progress.updatedAt,
          }
        : null,
    });
  } catch (error) {
    console.error('Auto-action session status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Stop/cancel session
// ============================================================================

export async function DELETE(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const orchestrator = getComputerUseOrchestrator();

    if (!orchestrator.getIsRunning()) {
      return NextResponse.json(
        { error: 'No session is running' },
        { status: 404 }
      );
    }

    orchestrator.stop();

    return NextResponse.json({
      success: true,
      message: 'Session stop requested',
      sessionId: orchestrator.getSessionId(),
    });
  } catch (error) {
    console.error('Auto-action session stop error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
