/**
 * Neo4j Entity Resolution API
 *
 * POST /api/neo4j/resolution/find - Find duplicate contacts
 * POST /api/neo4j/resolution/merge - Merge two contacts
 * GET /api/neo4j/resolution/stats - Get resolution statistics
 *
 * @module api/neo4j/resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  findDuplicates,
  findDuplicatesForContact,
  mergeContacts,
  aiResolveConflicts,
  linkSimilarContacts,
  getResolutionStats,
  type MergeStrategy,
} from '@/lib/neo4j/resolution';

/**
 * POST /api/neo4j/resolution/find
 *
 * Find duplicate contacts in a workspace
 *
 * Body parameters:
 * - workspace_id: string (required) - Workspace to search
 * - contact_id: string (optional) - Find duplicates for specific contact
 * - threshold: number (optional) - Minimum similarity score (default: 0.7)
 *
 * @returns Array of similarity matches
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, contact_id, threshold = 0.7, action } = body;

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

    // Handle different actions
    if (action === 'find') {
      // Find duplicates
      const matches = contact_id
        ? await findDuplicatesForContact(contact_id, workspace_id, threshold)
        : await findDuplicates(workspace_id, threshold);

      return NextResponse.json({
        success: true,
        workspace_id,
        threshold,
        matches,
        count: matches.length,
        timestamp: new Date().toISOString(),
      });
    } else if (action === 'merge') {
      // Merge contacts
      const { contact1_id, contact2_id, strategy = 'prefer_complete', use_ai = false } = body;

      if (!contact1_id || !contact2_id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required parameters: contact1_id, contact2_id',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      const result = await mergeContacts(
        contact1_id,
        contact2_id,
        workspace_id,
        strategy as MergeStrategy
      );

      return NextResponse.json({
        success: result.success,
        mergedContact: result.mergedContact,
        removedContactId: result.removedContactId,
        conflicts: result.conflicts,
        timestamp: new Date().toISOString(),
      });
    } else if (action === 'link') {
      // Create SIMILAR_TO relationship
      const { contact1_id, contact2_id, similarity_score, factors } = body;

      if (!contact1_id || !contact2_id || similarity_score === undefined) {
        return NextResponse.json(
          {
            success: false,
            error: 'Missing required parameters: contact1_id, contact2_id, similarity_score',
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
      }

      await linkSimilarContacts(contact1_id, contact2_id, workspace_id, similarity_score, factors || {});

      return NextResponse.json({
        success: true,
        message: 'Contacts linked with SIMILAR_TO relationship',
        contact1_id,
        contact2_id,
        similarity_score,
        timestamp: new Date().toISOString(),
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid action. Use: find, merge, or link',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('[API] Neo4j resolution error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Resolution operation failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/neo4j/resolution/stats
 *
 * Get entity resolution statistics for a workspace
 *
 * Query parameters:
 * - workspace_id: string (required)
 *
 * @returns Resolution statistics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get('workspace_id');

    if (!workspace_id) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: workspace_id',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const stats = await getResolutionStats(workspace_id);

    return NextResponse.json({
      workspace_id,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Neo4j resolution stats error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get resolution stats',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
