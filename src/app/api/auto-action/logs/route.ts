/**
 * Auto-Action Logs API
 *
 * Retrieves session logs and audit trail for auto-action operations.
 *
 * GET - Get session logs with optional filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer, supabaseBrowser } from '@/lib/supabase';
import { getSessionLogger } from '@/lib/autoAction';

// ============================================================================
// GET - Get session logs
// ============================================================================

export async function GET(req: NextRequest) {
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

    // Get query params
    const sessionId = req.nextUrl.searchParams.get('sessionId');
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const flowType = req.nextUrl.searchParams.get('flowType');
    const startDate = req.nextUrl.searchParams.get('startDate');
    const endDate = req.nextUrl.searchParams.get('endDate');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
    const includeEntries = req.nextUrl.searchParams.get('includeEntries') === 'true';

    // Get logger
    const logger = getSessionLogger();

    // If specific session ID requested
    if (sessionId) {
      const session = logger.getSession(sessionId);

      if (!session) {
        return NextResponse.json(
          { error: 'Session not found' },
          { status: 404 }
        );
      }

      // Verify user has access (must own the session or be admin)
      if (session.userId !== userId) {
        return NextResponse.json(
          { error: 'Access denied to this session' },
          { status: 403 }
        );
      }

      return NextResponse.json({
        session: {
          sessionId: session.sessionId,
          userId: session.userId,
          workspaceId: session.workspaceId,
          flowType: session.flowType,
          task: session.task,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          status: session.status,
          stepCount: session.stepCount,
          criticalPointCount: session.criticalPointCount,
          approvedCount: session.approvedCount,
          rejectedCount: session.rejectedCount,
          outcome: session.outcome,
          entries: includeEntries
            ? session.entries.map((entry) => ({
                id: entry.id,
                timestamp: entry.timestamp,
                level: entry.level,
                eventType: entry.eventType,
                message: entry.message,
                data: entry.data,
                // Don't include full screenshot in response
                hasScreenshot: !!entry.screenshotBase64,
                action: entry.action
                  ? {
                      type: entry.action.type,
                      confidence: entry.action.confidence,
                    }
                  : undefined,
                criticalPoint: entry.criticalPoint
                  ? {
                      id: entry.criticalPoint.id,
                      category: entry.criticalPoint.category,
                      risk: entry.criticalPoint.risk,
                    }
                  : undefined,
                violation: entry.violation,
                error: entry.error,
              }))
            : undefined,
          entryCount: session.entries.length,
        },
      });
    }

    // Export logs with filters
    const filters: {
      userId?: string;
      workspaceId?: string;
      flowType?: string;
      startDate?: Date;
      endDate?: Date;
    } = {};

    // Always filter by user (security)
    filters.userId = userId;

    if (workspaceId) {
      filters.workspaceId = workspaceId;
    }

    if (flowType) {
      filters.flowType = flowType;
    }

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    const exportData = logger.exportLogs(filters);

    // Limit results
    const sessions = exportData.sessions.slice(0, limit);

    return NextResponse.json({
      exportedAt: exportData.exportedAt,
      totalCount: exportData.sessions.length,
      returnedCount: sessions.length,
      filtered: exportData.filtered,
      filters: exportData.filters,
      sessions: sessions.map((session) => ({
        sessionId: session.sessionId,
        flowType: session.flowType,
        task: session.task,
        startedAt: session.startedAt,
        endedAt: session.endedAt,
        status: session.status,
        stepCount: session.stepCount,
        criticalPointCount: session.criticalPointCount,
        approvedCount: session.approvedCount,
        rejectedCount: session.rejectedCount,
        outcome: session.outcome,
        entryCount: session.entries.length,
        // Summary of entry types
        entrySummary: {
          errors: session.entries.filter((e) => e.level === 'error').length,
          warnings: session.entries.filter((e) => e.level === 'warn').length,
          criticalPoints: session.entries.filter(
            (e) => e.eventType === 'critical_point_detected'
          ).length,
          approvals: session.entries.filter(
            (e) => e.eventType === 'approval_received'
          ).length,
        },
      })),
    });
  } catch (error) {
    console.error('Auto-action logs error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
