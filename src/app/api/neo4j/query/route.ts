/**
 * Neo4j Query Builder API
 *
 * POST /api/neo4j/query - Execute safe, parameterized graph queries
 *
 * Provides pre-defined query patterns for common graph operations
 * WITHOUT allowing arbitrary Cypher execution (security)
 *
 * @module api/neo4j/query
 */

import { NextRequest, NextResponse } from 'next/server';
import { readQuery } from '@/lib/neo4j/client';

/**
 * Safe query patterns with parameter validation
 */
const SAFE_QUERY_PATTERNS = {
  /**
   * Get contact network
   */
  contact_network: {
    query: `
      MATCH (c:Contact {id: $contactId, workspace_id: $workspaceId})
      OPTIONAL MATCH (c)-[conn:CONNECTED_TO]-(other:Contact)
      OPTIONAL MATCH (c)-[:WORKS_AT]->(company:Company)
      RETURN
        c as contact,
        COLLECT(DISTINCT {
          contact: other,
          strength: conn.strength
        }) as connections,
        company
    `,
    requiredParams: ['contactId', 'workspaceId'],
  },

  /**
   * Get email activity
   */
  email_activity: {
    query: `
      MATCH (c:Contact {id: $contactId, workspace_id: $workspaceId})
      OPTIONAL MATCH (c)-[r:SENT|RECEIVED]->(e:Email)
      WHERE e.sent_at >= datetime() - duration({days: $days})
      RETURN
        c.email as contact,
        COUNT(e) as emailCount,
        COLLECT({
          subject: e.subject,
          direction: type(r),
          sentAt: e.sent_at
        }) as recentEmails
      ORDER BY e.sent_at DESC
      LIMIT $limit
    `,
    requiredParams: ['contactId', 'workspaceId', 'days', 'limit'],
  },

  /**
   * Get company contacts
   */
  company_contacts: {
    query: `
      MATCH (co:Company {domain: $domain})
      MATCH (c:Contact {workspace_id: $workspaceId})-[:WORKS_AT]->(co)
      OPTIONAL MATCH (c)-[conn:CONNECTED_TO]-(other:Contact)
      RETURN
        c as contact,
        COUNT(DISTINCT other) as connectionCount,
        c.ai_score as aiScore
      ORDER BY c.ai_score DESC
      LIMIT $limit
    `,
    requiredParams: ['domain', 'workspaceId', 'limit'],
  },

  /**
   * Get influential contacts in network
   */
  network_influencers: {
    query: `
      MATCH (c:Contact {workspace_id: $workspaceId})
      OPTIONAL MATCH (c)-[:CONNECTED_TO]-(other:Contact)
      WITH c, COUNT(DISTINCT other) as connections
      WHERE connections >= $minConnections
      OPTIONAL MATCH (c)-[:WORKS_AT]->(co:Company)
      RETURN
        c as contact,
        connections,
        co.name as company
      ORDER BY connections DESC, c.ai_score DESC
      LIMIT $limit
    `,
    requiredParams: ['workspaceId', 'minConnections', 'limit'],
  },

  /**
   * Get recent interactions
   */
  recent_interactions: {
    query: `
      MATCH (c:Contact {workspace_id: $workspaceId})
      OPTIONAL MATCH (c)-[r:SENT|RECEIVED]->(e:Email)
      WHERE e.sent_at >= datetime() - duration({days: $days})
      WITH c, e, r
      ORDER BY e.sent_at DESC
      RETURN
        c.email as contact,
        c.name as name,
        COLLECT({
          subject: e.subject,
          direction: type(r),
          sentAt: e.sent_at,
          opened: e.opened,
          clicked: e.clicked
        })[0..$limit] as recentEmails,
        COUNT(e) as totalEmails
      ORDER BY totalEmails DESC
      LIMIT $limit
    `,
    requiredParams: ['workspaceId', 'days', 'limit'],
  },

  /**
   * Get community members
   */
  community_members: {
    query: `
      MATCH (seed:Contact {id: $seedContactId, workspace_id: $workspaceId})
      MATCH (seed)-[:CONNECTED_TO*1..2]-(member:Contact)
      WHERE member.workspace_id = $workspaceId
      OPTIONAL MATCH (member)-[:WORKS_AT]->(co:Company)
      RETURN DISTINCT
        member as contact,
        co.name as company,
        member.ai_score as aiScore,
        shortestPath((seed)-[:CONNECTED_TO*]-(member)) as path
      ORDER BY aiScore DESC
      LIMIT $limit
    `,
    requiredParams: ['seedContactId', 'workspaceId', 'limit'],
  },

  /**
   * Get email thread
   */
  email_thread: {
    query: `
      MATCH (root:Email {id: $emailId, workspace_id: $workspaceId})
      OPTIONAL MATCH path = (root)-[:REPLIED_TO*]-(related:Email)
      WITH root, related
      ORDER BY related.sent_at ASC
      RETURN
        root as rootEmail,
        COLLECT(related) as threadEmails,
        COUNT(related) as threadLength
    `,
    requiredParams: ['emailId', 'workspaceId'],
  },

  /**
   * Get contact timeline
   */
  contact_timeline: {
    query: `
      MATCH (c:Contact {id: $contactId, workspace_id: $workspaceId})
      OPTIONAL MATCH (c)-[r:SENT|RECEIVED]->(e:Email)
      WHERE e.sent_at >= datetime() - duration({days: $days})
      OPTIONAL MATCH (c)-[:OPENED]->(opened:Email)
      WHERE opened.sent_at >= datetime() - duration({days: $days})
      OPTIONAL MATCH (c)-[:CLICKED]->(clicked:Email)
      WHERE clicked.sent_at >= datetime() - duration({days: $days})
      RETURN
        c as contact,
        COUNT(DISTINCT e) as totalEmails,
        COUNT(DISTINCT opened) as emailsOpened,
        COUNT(DISTINCT clicked) as emailsClicked,
        COLLECT(DISTINCT {
          type: type(r),
          email: e,
          timestamp: e.sent_at
        }) as timeline
      ORDER BY e.sent_at DESC
    `,
    requiredParams: ['contactId', 'workspaceId', 'days'],
  },
};

/**
 * POST /api/neo4j/query
 *
 * Execute safe, pre-defined query patterns
 *
 * Body parameters:
 * - workspace_id: string (required)
 * - pattern: string (required) - Query pattern name
 * - parameters: object (required) - Pattern-specific parameters
 *
 * Available patterns:
 * - contact_network: Get contact with connections and company
 * - email_activity: Get email activity for contact
 * - company_contacts: Get all contacts at a company
 * - network_influencers: Get influential contacts by connection count
 * - recent_interactions: Get recent email interactions
 * - community_members: Get contacts in network community
 * - email_thread: Get email thread with replies
 * - contact_timeline: Get contact activity timeline
 *
 * @returns Query results
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workspace_id, pattern, parameters = {} } = body;

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

    if (!pattern) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required parameter: pattern',
          availablePatterns: Object.keys(SAFE_QUERY_PATTERNS),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate pattern exists
    const queryPattern = SAFE_QUERY_PATTERNS[pattern as keyof typeof SAFE_QUERY_PATTERNS];
    if (!queryPattern) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid pattern: ${pattern}`,
          availablePatterns: Object.keys(SAFE_QUERY_PATTERNS),
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Validate required parameters
    const missingParams = queryPattern.requiredParams.filter(
      (param) => parameters[param] === undefined
    );

    if (missingParams.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing required parameters: ${missingParams.join(', ')}`,
          pattern,
          requiredParams: queryPattern.requiredParams,
          timestamp: new Date().toISOString(),
        },
        { status: 400 }
      );
    }

    // Add workspace_id to parameters
    const queryParams = {
      ...parameters,
      workspaceId: workspace_id,
    };

    // Execute query
    const result = await readQuery(queryPattern.query, queryParams);

    // Extract results
    const records = result.records.map((record) => {
      const obj: any = {};
      record.keys.forEach((key) => {
        const value = record.get(key);

        // Convert Neo4j types to plain objects
        if (value && typeof value === 'object' && 'properties' in value) {
          obj[key] = value.properties;
        } else if (Array.isArray(value)) {
          obj[key] = value.map((item) => {
            if (item && typeof item === 'object' && 'properties' in item) {
              return item.properties;
            }
            return item;
          });
        } else {
          obj[key] = value;
        }
      });
      return obj;
    });

    return NextResponse.json({
      success: true,
      workspace_id,
      pattern,
      parameters: queryParams,
      results: records,
      count: records.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[API] Neo4j query execution error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Query execution failed',
        message: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/neo4j/query
 *
 * Get available query patterns
 *
 * @returns List of available patterns with descriptions
 */
export async function GET(request: NextRequest) {
  const patterns = Object.entries(SAFE_QUERY_PATTERNS).map(([name, pattern]) => ({
    name,
    requiredParams: pattern.requiredParams,
    description: pattern.query.split('\n')[1]?.trim().replace('*', '').trim() || name,
  }));

  return NextResponse.json({
    availablePatterns: patterns,
    totalPatterns: patterns.length,
    timestamp: new Date().toISOString(),
  });
}
