/**
 * Auto-Action Approval API
 *
 * Handles Critical Point approval/rejection for sensitive actions.
 *
 * POST - Submit approval or rejection for a critical point
 * GET  - Get pending approvals for the current session
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import {
  getComputerUseOrchestrator,
  getCriticalPointGuard,
  getSessionLogger,
} from '@/lib/autoAction';

// ============================================================================
// POST - Submit approval/rejection
// ============================================================================

export async function POST(req: NextRequest) {
  try {
    // Authenticate
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    let userId: string;
    let userEmail: string | undefined;

    if (token) {
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
      userEmail = data.user.email;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      userId = data.user.id;
      userEmail = data.user.email;
    }

    // Parse request body
    const body = await req.json();
    const { criticalPointId, approved, note } = body as {
      criticalPointId: string;
      approved: boolean;
      note?: string;
    };

    if (!criticalPointId || typeof approved !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: criticalPointId, approved' },
        { status: 400 }
      );
    }

    // Get critical point guard
    const guard = getCriticalPointGuard();

    // Get the critical point to verify it exists
    const criticalPoint = guard.getCriticalPoint(criticalPointId);
    if (!criticalPoint) {
      return NextResponse.json(
        { error: 'Critical point not found or already processed' },
        { status: 404 }
      );
    }

    // Check if already processed
    if (criticalPoint.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'Critical point already processed',
          status: criticalPoint.status,
        },
        { status: 409 }
      );
    }

    // Submit approval
    const orchestrator = getComputerUseOrchestrator();
    const respondedBy = userEmail || userId;

    const success = orchestrator.submitApproval(criticalPointId, approved, respondedBy, note);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to process approval' },
        { status: 500 }
      );
    }

    // Log the approval action
    const logger = getSessionLogger();
    const sessionId = orchestrator.getSessionId();
    if (sessionId) {
      logger.logApprovalReceived(sessionId, criticalPoint, approved, respondedBy);
    }

    return NextResponse.json({
      success: true,
      message: approved ? 'Action approved' : 'Action rejected',
      criticalPointId,
      approved,
      respondedBy,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Auto-action approval error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Get pending approvals
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

    // Get query params
    const sessionId = req.nextUrl.searchParams.get('sessionId');

    // Get critical point guard
    const guard = getCriticalPointGuard();

    // Get pending approvals
    const pending = guard.getPendingApprovals(sessionId || undefined);

    return NextResponse.json({
      count: pending.length,
      approvals: pending.map((cp) => ({
        id: cp.id,
        sessionId: cp.sessionId,
        category: cp.category,
        description: cp.description,
        risk: cp.risk,
        status: cp.status,
        createdAt: cp.createdAt,
        action: {
          type: cp.action.type,
          target: typeof cp.action.target === 'string'
            ? cp.action.target
            : cp.action.target?.text || 'Unknown',
          confidence: cp.action.confidence,
          reasoning: cp.action.reasoning,
        },
        context: {
          pageUrl: cp.context.pageUrl,
          pageTitle: cp.context.pageTitle,
          // Don't expose screenshot in list view for bandwidth
          hasScreenshot: !!cp.context.screenshotBase64,
        },
      })),
    });
  } catch (error) {
    console.error('Auto-action pending approvals error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
