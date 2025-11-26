import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { getWorkspaceStats } from '@/lib/convex/strategy-persistence';

/**
 * GET /api/convex/stats
 *
 * Get workspace statistics for CONVEX strategies
 *
 * Query params:
 * - workspaceId: string (required)
 */

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');

    if (!workspaceId) {
      logger.warn('[CONVEX-STATS-API] Missing workspaceId');
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    logger.info(`[CONVEX-STATS-API] Getting stats for workspace: ${workspaceId}`);

    const stats = await getWorkspaceStats(workspaceId);

    return NextResponse.json(stats);
  } catch (error) {
    logger.error('[CONVEX-STATS-API] Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get statistics' },
      { status: 500 }
    );
  }
}
