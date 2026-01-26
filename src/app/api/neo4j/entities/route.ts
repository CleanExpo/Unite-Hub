/**
 * Neo4j Entity Query API
 *
 * GET /api/neo4j/entities - Query entities by type
 * GET /api/neo4j/entities/[id] - Get specific entity by ID
 * POST /api/neo4j/entities/search - Search entities
 * GET /api/neo4j/entities/[id]/relationships - Get entity relationships
 *
 * @module api/neo4j/entities
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getContact,
  getContactsByWorkspace,
  searchContacts,
  type ContactEntity,
} from '@/lib/neo4j/entities';
import { readQuery } from '@/lib/neo4j/client';

/**
 * GET /api/neo4j/entities
 *
 * Query entities by type and workspace
 *
 * Query parameters:
 * - workspace_id: string (required)
 * - type: string (required) - Entity type (contact, company, email, user, workspace)
 * - limit: number (optional) - Maximum results (default: 100)
 * - offset: number (optional) - Skip results (default: 0)
 * - sort: string (optional) - Sort field (default: created_at)
 * - order: string (optional) - Sort order (asc|desc, default: desc)
 *
 * @returns Array of entities
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workspace_id = searchParams.get('workspace_id');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';

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

    // Validate type
    const validTypes = ['contact', 'company', 'email', 'user', 'workspace', 'campaign', 'tag'];
    if (!validTypes.includes(type.toLowerCase())) {
      return NextResponse.json(
        {
          error: `Invalid type: ${type}. Use: ${validTypes.join(', ')}`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Convert type to Node label
    const nodeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    // Query entities
    const query = `
      MATCH (n:${nodeLabel} {workspace_id: $workspaceId})
      RETURN n
      ORDER BY n.${sort} ${order.toUpperCase()}
      SKIP $offset
      LIMIT $limit
    `;

    const result = await readQuery(query, {
      workspaceId: workspace_id,
      offset,
      limit,
    });

    const entities = result.records.map((record) => record.get('n').properties);

    return NextResponse.json({
      workspace_id,
      type,
      entities,
      count: entities.length,
      limit,
      offset,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Neo4j entities query error:', error);

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

/**
 * POST /api/neo4j/entities/search
 *
 * Search entities with filters
 *
 * Body parameters:
 * - workspace_id: string (required)
 * - type: string (required) - Entity type
 * - query: string (optional) - Search query (name, email, etc.)
 * - filters: object (optional) - Property filters
 * - limit: number (optional) - Maximum results (default: 50)
 *
 * @returns Array of matching entities
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, type, query, filters = {}, limit = 50 } = body;

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

    if (!type) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: type',
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Handle contact search with existing utility
    if (type === 'contact' && query) {
      const contacts = await searchContacts(query, workspace_id, limit);

      return NextResponse.json({
        success: true,
        workspace_id,
        type,
        query,
        results: contacts,
        count: contacts.length,
        timestamp: new Date().toISOString(),
      });
    }

    // Generic entity search
    const nodeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    // Build WHERE clause from filters
    const filterConditions = Object.entries(filters)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `n.${key} CONTAINS $filter_${key}`;
        } else {
          return `n.${key} = $filter_${key}`;
        }
      })
      .join(' AND ');

    const whereClause = filterConditions
      ? `WHERE ${filterConditions}`
      : '';

    const searchQuery = `
      MATCH (n:${nodeLabel} {workspace_id: $workspaceId})
      ${whereClause}
      ${query ? `AND (
        toLower(n.name) CONTAINS toLower($query) OR
        toLower(n.email) CONTAINS toLower($query) OR
        toLower(n.domain) CONTAINS toLower($query)
      )` : ''}
      RETURN n
      LIMIT $limit
    `;

    const params: any = {
      workspaceId: workspace_id,
      limit,
    };

    if (query) {
      params.query = query;
    }

    // Add filter parameters
    Object.entries(filters).forEach(([key, value]) => {
      params[`filter_${key}`] = value;
    });

    const result = await readQuery(searchQuery, params);

    const results = result.records.map((record) => record.get('n').properties);

    return NextResponse.json({
      success: true,
      workspace_id,
      type,
      query,
      filters,
      results,
      count: results.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Neo4j entity search error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Entity search failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
