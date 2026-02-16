/**
 * Neo4j Pattern Detection & Analytics API
 *
 * POST /api/neo4j/analytics - Run analytics queries
 * GET /api/neo4j/analytics/stats - Get network statistics
 *
 * @module api/neo4j/analytics
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  calculateDegreeCentrality,
  calculateBetweennessCentrality,
  calculatePageRank,
  detectCommunities,
  calculateInfluenceScores,
  analyzeCommunicationPatterns,
  calculateRelationshipStrength,
  getNetworkStats,
  findShortestPath,
} from '@/lib/neo4j/analytics';

/**
 * POST /api/neo4j/analytics
 *
 * Run analytics queries on the knowledge graph
 *
 * Body parameters:
 * - workspace_id: string (required) - Workspace to analyze
 * - action: string (required) - Analytics operation to perform
 * - contact_id: string (optional) - Specific contact for some operations
 * - limit: number (optional) - Result limit
 * - min_strength: number (optional) - Minimum relationship strength
 *
 * Actions:
 * - "centrality" - Calculate degree centrality
 * - "betweenness" - Calculate betweenness centrality (requires GDS)
 * - "pagerank" - Calculate PageRank scores (requires GDS)
 * - "communities" - Detect communities
 * - "influence" - Calculate influence scores
 * - "patterns" - Analyze communication patterns
 * - "relationships" - Calculate relationship strengths
 * - "path" - Find shortest path between contacts (requires contact1_id and contact2_id)
 *
 * @returns Analytics results based on action
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, action, contact_id, contact1_id, contact2_id, limit = 100, min_strength = 0.3 } = body;

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

    // Validate action
    if (!action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: action',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'centrality':
        result = await calculateDegreeCentrality(workspace_id, limit);
        break;

      case 'betweenness':
        result = await calculateBetweennessCentrality(workspace_id, limit);
        break;

      case 'pagerank':
        result = await calculatePageRank(workspace_id, limit);
        break;

      case 'communities':
        result = await detectCommunities(workspace_id);
        break;

      case 'influence':
        result = await calculateInfluenceScores(workspace_id, limit);
        break;

      case 'patterns':
        result = await analyzeCommunicationPatterns(workspace_id, contact_id, limit);
        break;

      case 'relationships':
        result = await calculateRelationshipStrength(workspace_id, contact_id, min_strength, limit);
        break;

      case 'path':
        if (!contact1_id || !contact2_id) {
          return NextResponse.json(
            {
              success: false,
              error: 'Missing required parameters for path: contact1_id, contact2_id',
              timestamp: new Date().toISOString(),
            },
            { status: 400 }
          );
        }
        result = await findShortestPath(contact1_id, contact2_id, workspace_id);
        break;

      default:
        return NextResponse.json(
          {
            success: false,
            error: `Invalid action: ${action}. Use: centrality, betweenness, pagerank, communities, influence, patterns, relationships, or path`,
            timestamp: new Date().toISOString(),
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      workspace_id,
      action,
      result,
      count: Array.isArray(result) ? result.length : result ? 1 : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[API] Neo4j analytics error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Analytics operation failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/neo4j/analytics/stats
 *
 * Get network statistics for a workspace
 *
 * Query parameters:
 * - workspace_id: string (required)
 *
 * @returns Network statistics
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

    const stats = await getNetworkStats(workspace_id);

    return NextResponse.json({
      workspace_id,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[API] Neo4j analytics stats error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get network stats',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
