/**
 * Neo4j Entity Detail API
 *
 * GET /api/neo4j/entities/[id] - Get entity by ID with relationships
 * GET /api/neo4j/entities/[id]/relationships - Get entity relationships
 *
 * @module api/neo4j/entities/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { readQuery } from '@/lib/neo4j/client';

/**
 * GET /api/neo4j/entities/[id]
 *
 * Get specific entity by ID with optional relationships
 *
 * Query parameters:
 * - workspace_id: string (required)
 * - type: string (required) - Entity type
 * - include_relationships: boolean (optional) - Include relationships (default: false)
 * - relationship_limit: number (optional) - Limit relationships (default: 50)
 *
 * @returns Entity with optional relationships
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get('workspace_id');
    const type = searchParams.get('type');
    const include_relationships = searchParams.get('include_relationships') === 'true';
    const relationship_limit = parseInt(searchParams.get('relationship_limit') || '50');

    if (!workspace_id) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: workspace_id',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!type) {
      return NextResponse.json(
        {
          error: 'Missing required parameter: type',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const nodeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    // Get entity
    const entityQuery = `
      MATCH (n:${nodeLabel} {id: $id, workspace_id: $workspaceId})
      RETURN n
    `;

    const entityResult = await readQuery(entityQuery, {
      id,
      workspaceId: workspace_id,
    });

    if (entityResult.records.length === 0) {
      return NextResponse.json(
        {
          error: 'Entity not found',
          id,
          type,
          timestamp: new Date().toISOString(),
        },
        { status: 404 }
      );
    }

    const entity = entityResult.records[0].get('n').properties;

    if (!include_relationships) {
      return NextResponse.json({
        workspace_id,
        type,
        entity,
        timestamp: new Date().toISOString(),
      });
    }

    // Get relationships
    const relationshipsQuery = `
      MATCH (n:${nodeLabel} {id: $id, workspace_id: $workspaceId})
      OPTIONAL MATCH (n)-[r]-(related)
      RETURN
        type(r) as relationshipType,
        startNode(r) = n as isOutgoing,
        properties(r) as relationshipProps,
        labels(related) as relatedLabels,
        properties(related) as relatedProps
      LIMIT $limit
    `;

    const relationshipsResult = await readQuery(relationshipsQuery, {
      id,
      workspaceId: workspace_id,
      limit: relationship_limit,
    });

    const relationships = relationshipsResult.records
      .filter((record) => record.get('relationshipType') !== null)
      .map((record) => ({
        type: record.get('relationshipType'),
        direction: record.get('isOutgoing') ? 'outgoing' : 'incoming',
        properties: record.get('relationshipProps'),
        relatedEntity: {
          labels: record.get('relatedLabels'),
          properties: record.get('relatedProps'),
        },
      }));

    return NextResponse.json({
      workspace_id,
      type,
      entity,
      relationships,
      relationshipCount: relationships.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Neo4j entity detail error:', error);

    return NextResponse.json(
      {
        error: 'Entity query failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
