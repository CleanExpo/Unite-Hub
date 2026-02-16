/**
 * Neo4j Relationship Finding API
 *
 * POST /api/neo4j/relationships/find - Find relationships between entities
 *
 * @module api/neo4j/relationships/find
 */

import { NextRequest, NextResponse } from 'next/server';
import { readQuery } from '@/lib/neo4j/client';
import { findShortestPath } from '@/lib/neo4j/analytics';

/**
 * POST /api/neo4j/relationships/find
 *
 * Find relationships and paths between two entities
 *
 * Body parameters:
 * - workspace_id: string (required)
 * - entity1_id: string (required) - First entity ID
 * - entity2_id: string (required) - Second entity ID
 * - entity1_type: string (required) - First entity type
 * - entity2_type: string (required) - Second entity type
 * - mode: string (optional) - Finding mode (shortest|all|direct, default: shortest)
 * - max_depth: number (optional) - Maximum path depth (default: 5)
 * - limit: number (optional) - Maximum paths to return (default: 10)
 *
 * @returns Paths between entities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      workspace_id,
      entity1_id,
      entity2_id,
      entity1_type,
      entity2_type,
      mode = 'shortest',
      max_depth = 5,
      limit = 10,
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

    if (!entity1_id || !entity2_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: entity1_id, entity2_id',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    if (!entity1_type || !entity2_type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameters: entity1_type, entity2_type',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    const nodeLabel1 = entity1_type.charAt(0).toUpperCase() + entity1_type.slice(1);
    const nodeLabel2 = entity2_type.charAt(0).toUpperCase() + entity2_type.slice(1);

    let query: string;
    let paths: any[] = [];

    switch (mode) {
      case 'direct':
        // Only direct relationships
        query = `
          MATCH (e1:${nodeLabel1} {id: $entity1Id, workspace_id: $workspaceId})
          MATCH (e2:${nodeLabel2} {id: $entity2Id, workspace_id: $workspaceId})
          MATCH path = (e1)-[r]-(e2)
          RETURN
            [node in nodes(path) | {
              labels: labels(node),
              properties: properties(node)
            }] as nodes,
            [{
              type: type(r),
              properties: properties(r),
              direction: CASE
                WHEN startNode(r) = e1 THEN 'outgoing'
                ELSE 'incoming'
              END
            }] as relationships,
            1 as pathLength
        `;

        const directResult = await readQuery(query, {
          entity1Id: entity1_id,
          entity2Id: entity2_id,
          workspaceId: workspace_id,
        });

        paths = directResult.records.map((record) => ({
          nodes: record.get('nodes'),
          relationships: record.get('relationships'),
          pathLength: record.get('pathLength'),
        }));

        break;

      case 'shortest':
        // Use analytics shortest path function for Contact entities
        if (entity1_type.toLowerCase() === 'contact' && entity2_type.toLowerCase() === 'contact') {
          const shortestPath = await findShortestPath(entity1_id, entity2_id, workspace_id);

          if (shortestPath) {
            paths = [
              {
                nodes: shortestPath.map((contact) => ({
                  labels: ['Contact'],
                  properties: contact,
                })),
                pathLength: shortestPath.length - 1,
              },
            ];
          }
        } else {
          // Generic shortest path
          query = `
            MATCH (e1:${nodeLabel1} {id: $entity1Id, workspace_id: $workspaceId})
            MATCH (e2:${nodeLabel2} {id: $entity2Id, workspace_id: $workspaceId})
            MATCH path = shortestPath((e1)-[*..${max_depth}]-(e2))
            RETURN
              [node in nodes(path) | {
                labels: labels(node),
                properties: properties(node)
              }] as nodes,
              [rel in relationships(path) | {
                type: type(rel),
                properties: properties(rel)
              }] as relationships,
              length(path) as pathLength
          `;

          const shortestResult = await readQuery(query, {
            entity1Id: entity1_id,
            entity2Id: entity2_id,
            workspaceId: workspace_id,
          });

          if (shortestResult.records.length > 0) {
            paths = [
              {
                nodes: shortestResult.records[0].get('nodes'),
                relationships: shortestResult.records[0].get('relationships'),
                pathLength: shortestResult.records[0].get('pathLength').toNumber(),
              },
            ];
          }
        }

        break;

      case 'all':
      default:
        // All paths up to max_depth
        query = `
          MATCH (e1:${nodeLabel1} {id: $entity1Id, workspace_id: $workspaceId})
          MATCH (e2:${nodeLabel2} {id: $entity2Id, workspace_id: $workspaceId})
          MATCH path = (e1)-[*1..${max_depth}]-(e2)
          RETURN
            [node in nodes(path) | {
              labels: labels(node),
              properties: properties(node)
            }] as nodes,
            [rel in relationships(path) | {
              type: type(rel),
              properties: properties(rel)
            }] as relationships,
            length(path) as pathLength
          ORDER BY pathLength ASC
          LIMIT $limit
        `;

        const allResult = await readQuery(query, {
          entity1Id: entity1_id,
          entity2Id: entity2_id,
          workspaceId: workspace_id,
          limit,
        });

        paths = allResult.records.map((record) => ({
          nodes: record.get('nodes'),
          relationships: record.get('relationships'),
          pathLength: record.get('pathLength').toNumber(),
        }));

        break;
    }

    if (paths.length === 0) {
      return NextResponse.json({
        success: true,
        workspace_id,
        entity1: {
          id: entity1_id,
          type: entity1_type,
        },
        entity2: {
          id: entity2_id,
          type: entity2_type,
        },
        mode,
        paths: [],
        pathCount: 0,
        message: 'No path found between entities',
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      workspace_id,
      entity1: {
        id: entity1_id,
        type: entity1_type,
      },
      entity2: {
        id: entity2_id,
        type: entity2_type,
      },
      mode,
      paths,
      pathCount: paths.length,
      shortestPathLength: paths.length > 0 ? Math.min(...paths.map((p) => p.pathLength)) : 0,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[API] Neo4j relationship find error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Relationship finding failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
