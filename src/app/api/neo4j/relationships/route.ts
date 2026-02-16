/**
 * Neo4j Relationship Traversal API
 *
 * POST /api/neo4j/relationships/traverse - Traverse relationships
 * POST /api/neo4j/relationships/find - Find relationships between entities
 * GET /api/neo4j/relationships/types - Get all relationship types
 *
 * @module api/neo4j/relationships
 */

import { NextRequest, NextResponse } from 'next/server';
import { readQuery } from '@/lib/neo4j/client';

/**
 * POST /api/neo4j/relationships/traverse
 *
 * Traverse relationships from starting entity
 *
 * Body parameters:
 * - workspace_id: string (required)
 * - entity_id: string (required) - Starting entity ID
 * - entity_type: string (required) - Starting entity type
 * - relationship_types: string[] (optional) - Filter by relationship types
 * - direction: string (optional) - Direction (outgoing|incoming|both, default: both)
 * - depth: number (optional) - Traversal depth (1-5, default: 1)
 * - limit: number (optional) - Maximum results (default: 100)
 *
 * @returns Traversal results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspace_id,
      entity_id,
      entity_type,
      relationship_types = [],
      direction = 'both',
      depth = 1,
      limit = 100,
    } = body;

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

    if (!entity_id || !entity_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: entity_id, entity_type',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate depth
    if (depth < 1 || depth > 5) {
      return NextResponse.json(
        {
          success: false,
          error: 'Depth must be between 1 and 5',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const nodeLabel = entity_type.charAt(0).toUpperCase() + entity_type.slice(1);

    // Build relationship type filter
    const relTypeFilter =
      relationship_types.length > 0 ? `:${relationship_types.join('|')}` : '';

    // Build direction pattern
    let directionPattern;
    switch (direction) {
      case 'outgoing':
        directionPattern = `-[r${relTypeFilter}*1..${depth}]->`;
        break;
      case 'incoming':
        directionPattern = `<-[r${relTypeFilter}*1..${depth}]-`;
        break;
      default:
        directionPattern = `-[r${relTypeFilter}*1..${depth}]-`;
    }

    const query = `
      MATCH (start:${nodeLabel} {id: $entityId, workspace_id: $workspaceId})
      MATCH path = (start)${directionPattern}(end)
      WITH path, relationships(path) as rels, nodes(path) as pathNodes, end
      RETURN
        [node in pathNodes | {
          labels: labels(node),
          properties: properties(node)
        }] as nodes,
        [rel in rels | {
          type: type(rel),
          properties: properties(rel)
        }] as relationships,
        length(path) as pathLength,
        labels(end) as endLabels,
        properties(end) as endProperties
      ORDER BY pathLength ASC
      LIMIT $limit
    `;

    const result = await readQuery(query, {
      entityId: entity_id,
      workspaceId: workspace_id,
      limit,
    });

    const paths = result.records.map((record) => ({
      nodes: record.get('nodes'),
      relationships: record.get('relationships'),
      pathLength: record.get('pathLength').toNumber(),
      endNode: {
        labels: record.get('endLabels'),
        properties: record.get('endProperties'),
      },
    }));

    return NextResponse.json({
      success: true,
      workspace_id,
      startEntity: {
        id: entity_id,
        type: entity_type,
      },
      traversal: {
        direction,
        depth,
        relationshipTypes: relationship_types,
      },
      paths,
      pathCount: paths.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[API] Neo4j relationship traversal error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Relationship traversal failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/neo4j/relationships/types
 *
 * Get all relationship types in workspace
 *
 * Query parameters:
 * - workspace_id: string (required)
 *
 * @returns Array of relationship types with counts
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

    const query = `
      MATCH (n {workspace_id: $workspaceId})-[r]-(m)
      RETURN
        type(r) as relationshipType,
        COUNT(r) as count,
        COLLECT(DISTINCT labels(n)[0]) as startNodeTypes,
        COLLECT(DISTINCT labels(m)[0]) as endNodeTypes
      ORDER BY count DESC
    `;

    const result = await readQuery(query, { workspaceId: workspace_id });

    const relationshipTypes = result.records.map((record) => ({
      type: record.get('relationshipType'),
      count: record.get('count').toNumber(),
      startNodeTypes: [...new Set(record.get('startNodeTypes'))],
      endNodeTypes: [...new Set(record.get('endNodeTypes'))],
    }));

    return NextResponse.json({
      workspace_id,
      relationshipTypes,
      totalTypes: relationshipTypes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[API] Neo4j relationship types error:', error);

    return NextResponse.json(
      {
        error: 'Failed to get relationship types',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
