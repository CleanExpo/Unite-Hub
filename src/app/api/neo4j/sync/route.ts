/**
 * Neo4j Data Synchronization API
 *
 * POST /api/neo4j/sync - Sync Supabase data to Neo4j
 *
 * @module api/neo4j/sync
 */

import { NextRequest, NextResponse } from 'next/server';
import { fullSync, incrementalSync } from '@/lib/neo4j/sync';

/**
 * POST /api/neo4j/sync
 *
 * Sync data from Supabase to Neo4j
 *
 * Body parameters:
 * - workspace_id: string (required) - Workspace to sync
 * - mode: 'full' | 'incremental' (default: 'full')
 * - since: string (optional) - Timestamp for incremental sync
 *
 * @returns Sync result
 *
 * @example Request:
 * ```json
 * {
 *   "workspace_id": "123e4567-e89b-12d3-a456-426614174000",
 *   "mode": "full"
 * }
 * ```
 *
 * @example Response:
 * ```json
 * {
 *   "success": true,
 *   "synced": {
 *     "contacts": 150,
 *     "companies": 45,
 *     "emails": 1200,
 *     "workspaces": 1,
 *     "relationships": 0
 *   },
 *   "errors": [],
 *   "duration_ms": 5432,
 *   "timestamp": "2026-01-27T08:00:00.000Z"
 * }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, mode = 'full', since } = body;

    // Validate workspace_id
    if (!workspace_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: workspace_id',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate since for incremental sync
    if (mode === 'incremental' && !since) {
      return NextResponse.json(
        {
          success: false,
          error: 'Incremental sync requires "since" timestamp',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    console.log(`[API] Starting ${mode} sync for workspace ${workspace_id}...`);

    // Execute sync
    const result =
      mode === 'incremental'
        ? await incrementalSync(workspace_id, since!)
        : await fullSync(workspace_id);

    return NextResponse.json({
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[API] Neo4j sync error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Sync failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/neo4j/sync
 *
 * Get sync status and last sync timestamp
 *
 * @returns Sync status
 */
export async function GET() {
  try {
    // For now, just return a simple status
    // In production, you would track sync timestamps in a database
    return NextResponse.json({
      status: 'ready',
      message: 'Neo4j sync endpoint is ready',
      modes: ['full', 'incremental'],
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[API] Neo4j sync status error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get sync status',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
