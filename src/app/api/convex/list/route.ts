import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logging';
import { listStrategies } from '@/lib/convex/strategy-persistence';

/**
 * GET /api/convex/list
 *
 * List all strategies for a workspace
 *
 * Query params:
 * - workspaceId: string (required)
 * - limit: number (default 50)
 * - offset: number (default 0)
 */

export async function GET(req: NextRequest) {
  try {
    const workspaceId = req.nextUrl.searchParams.get('workspaceId');
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '50', 10);
    const offset = parseInt(req.nextUrl.searchParams.get('offset') || '0', 10);

    if (!workspaceId) {
      logger.warn('[CONVEX-LIST-API] Missing workspaceId');
      return NextResponse.json(
        { error: 'Missing workspaceId' },
        { status: 400 }
      );
    }

    logger.info(`[CONVEX-LIST-API] Listing strategies for workspace: ${workspaceId}`);

    const strategies = await listStrategies(workspaceId, limit, offset);

    return NextResponse.json(strategies);
  } catch (error) {
    logger.error('[CONVEX-LIST-API] List error:', error);
    return NextResponse.json(
      { error: 'Failed to list strategies' },
      { status: 500 }
    );
  }
}
