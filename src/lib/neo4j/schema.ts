/**
 * Neo4j Knowledge Graph Schema Definition
 *
 * Defines the graph schema for Unite-Hub's knowledge graph:
 * - Node types (entities)
 * - Relationship types
 * - Properties
 * - Constraints and indexes
 *
 * @module lib/neo4j/schema
 */

import { writeQuery, executeTransaction } from './client';

/**
 * Node Types (Entity Labels)
 */
export const NodeTypes = {
  CONTACT: 'Contact',
  COMPANY: 'Company',
  EMAIL: 'Email',
  USER: 'User',
  WORKSPACE: 'Workspace',
  CAMPAIGN: 'Campaign',
  TAG: 'Tag',
  INTERACTION: 'Interaction',
} as const;

/**
 * Relationship Types
 */
export const RelationshipTypes = {
  // Email relationships
  SENT: 'SENT',
  RECEIVED: 'RECEIVED',
  REPLIED_TO: 'REPLIED_TO',
  FORWARDED: 'FORWARDED',
  OPENED: 'OPENED',
  CLICKED: 'CLICKED',

  // Contact relationships
  WORKS_AT: 'WORKS_AT',
  CONNECTED_TO: 'CONNECTED_TO',
  INTRODUCED_BY: 'INTRODUCED_BY',
  SIMILAR_TO: 'SIMILAR_TO',

  // Organization relationships
  MEMBER_OF: 'MEMBER_OF',
  MANAGES: 'MANAGES',
  OWNS: 'OWNS',

  // Campaign relationships
  ENROLLED_IN: 'ENROLLED_IN',
  RESPONDED_TO: 'RESPONDED_TO',
  CONVERTED_FROM: 'CONVERTED_FROM',

  // Tag relationships
  TAGGED_WITH: 'TAGGED_WITH',

  // Interaction relationships
  PARTICIPATED_IN: 'PARTICIPATED_IN',
} as const;

/**
 * Initialize Neo4j schema with constraints and indexes
 *
 * Creates:
 * - Uniqueness constraints
 * - Required property constraints
 * - Performance indexes
 *
 * @returns Promise resolving when schema is initialized
 */
export async function initializeSchema(): Promise<void> {
  console.log('Initializing Neo4j schema...');

  try {
    // Create constraints (ensures uniqueness and required properties)
    await createConstraints();

    // Create indexes (improves query performance)
    await createIndexes();

    console.log('✓ Neo4j schema initialized successfully');
  } catch (error) {
    console.error('✗ Failed to initialize Neo4j schema:', error);
    throw error;
  }
}

/**
 * Create uniqueness and required property constraints
 */
async function createConstraints(): Promise<void> {
  const constraints = [
    // Contact constraints
    `CREATE CONSTRAINT contact_id_unique IF NOT EXISTS
     FOR (c:Contact) REQUIRE c.id IS UNIQUE`,

    `CREATE CONSTRAINT contact_email_unique IF NOT EXISTS
     FOR (c:Contact) REQUIRE c.email IS UNIQUE`,

    `CREATE CONSTRAINT contact_workspace_required IF NOT EXISTS
     FOR (c:Contact) REQUIRE c.workspace_id IS NOT NULL`,

    // Company constraints
    `CREATE CONSTRAINT company_id_unique IF NOT EXISTS
     FOR (c:Company) REQUIRE c.id IS UNIQUE`,

    `CREATE CONSTRAINT company_domain_unique IF NOT EXISTS
     FOR (c:Company) REQUIRE c.domain IS UNIQUE`,

    // Email constraints
    `CREATE CONSTRAINT email_id_unique IF NOT EXISTS
     FOR (e:Email) REQUIRE e.id IS UNIQUE`,

    `CREATE CONSTRAINT email_workspace_required IF NOT EXISTS
     FOR (e:Email) REQUIRE e.workspace_id IS NOT NULL`,

    // User constraints
    `CREATE CONSTRAINT user_id_unique IF NOT EXISTS
     FOR (u:User) REQUIRE u.id IS UNIQUE`,

    `CREATE CONSTRAINT user_email_unique IF NOT EXISTS
     FOR (u:User) REQUIRE u.email IS UNIQUE`,

    // Workspace constraints
    `CREATE CONSTRAINT workspace_id_unique IF NOT EXISTS
     FOR (w:Workspace) REQUIRE w.id IS UNIQUE`,

    // Campaign constraints
    `CREATE CONSTRAINT campaign_id_unique IF NOT EXISTS
     FOR (c:Campaign) REQUIRE c.id IS UNIQUE`,

    // Tag constraints
    `CREATE CONSTRAINT tag_name_unique IF NOT EXISTS
     FOR (t:Tag) REQUIRE t.name IS UNIQUE`,
  ];

  console.log('Creating constraints...');
  for (const constraint of constraints) {
    try {
      await writeQuery(constraint);
    } catch (error: unknown) {
      // Ignore "already exists" errors
      if (!error.message.includes('already exists')) {
        console.warn(`Constraint creation warning:`, error.message);
      }
    }
  }
  console.log('✓ Constraints created');
}

/**
 * Create performance indexes
 */
async function createIndexes(): Promise<void> {
  const indexes = [
    // Contact indexes
    `CREATE INDEX contact_name IF NOT EXISTS
     FOR (c:Contact) ON (c.name)`,

    `CREATE INDEX contact_status IF NOT EXISTS
     FOR (c:Contact) ON (c.status)`,

    `CREATE INDEX contact_ai_score IF NOT EXISTS
     FOR (c:Contact) ON (c.ai_score)`,

    `CREATE INDEX contact_created_at IF NOT EXISTS
     FOR (c:Contact) ON (c.created_at)`,

    `CREATE INDEX contact_workspace_email IF NOT EXISTS
     FOR (c:Contact) ON (c.workspace_id, c.email)`,

    // Company indexes
    `CREATE INDEX company_name IF NOT EXISTS
     FOR (c:Company) ON (c.name)`,

    `CREATE INDEX company_industry IF NOT EXISTS
     FOR (c:Company) ON (c.industry)`,

    // Email indexes
    `CREATE INDEX email_sent_at IF NOT EXISTS
     FOR (e:Email) ON (e.sent_at)`,

    `CREATE INDEX email_subject IF NOT EXISTS
     FOR (e:Email) ON (e.subject)`,

    `CREATE INDEX email_workspace IF NOT EXISTS
     FOR (e:Email) ON (e.workspace_id)`,

    // User indexes
    `CREATE INDEX user_email IF NOT EXISTS
     FOR (u:User) ON (u.email)`,

    `CREATE INDEX user_name IF NOT EXISTS
     FOR (u:User) ON (u.name)`,

    // Workspace indexes
    `CREATE INDEX workspace_org_id IF NOT EXISTS
     FOR (w:Workspace) ON (w.org_id)`,

    // Campaign indexes
    `CREATE INDEX campaign_status IF NOT EXISTS
     FOR (c:Campaign) ON (c.status)`,

    `CREATE INDEX campaign_type IF NOT EXISTS
     FOR (c:Campaign) ON (c.type)`,

    // Tag indexes
    `CREATE INDEX tag_category IF NOT EXISTS
     FOR (t:Tag) ON (t.category)`,

    // Relationship indexes
    `CREATE INDEX sent_timestamp IF NOT EXISTS
     FOR ()-[r:SENT]-() ON (r.timestamp)`,

    `CREATE INDEX received_timestamp IF NOT EXISTS
     FOR ()-[r:RECEIVED]-() ON (r.timestamp)`,

    `CREATE INDEX opened_timestamp IF NOT EXISTS
     FOR ()-[r:OPENED]-() ON (r.timestamp)`,

    `CREATE INDEX clicked_timestamp IF NOT EXISTS
     FOR ()-[r:CLICKED]-() ON (r.timestamp)`,
  ];

  console.log('Creating indexes...');
  for (const index of indexes) {
    try {
      await writeQuery(index);
    } catch (error: unknown) {
      // Ignore "already exists" errors
      if (!error.message.includes('already exists')) {
        console.warn(`Index creation warning:`, error.message);
      }
    }
  }
  console.log('✓ Indexes created');
}

/**
 * Drop all constraints and indexes (use with caution!)
 *
 * Useful for schema migrations or testing.
 */
export async function dropSchema(): Promise<void> {
  console.warn('⚠️  Dropping Neo4j schema (constraints and indexes)...');

  try {
    // Get all constraints
    const constraintsResult = await writeQuery('SHOW CONSTRAINTS');
    const constraints = constraintsResult.records.map(
      (record) => record.get('name') as string
    );

    // Drop each constraint
    for (const constraintName of constraints) {
      await writeQuery(`DROP CONSTRAINT ${constraintName} IF EXISTS`);
    }

    // Get all indexes
    const indexesResult = await writeQuery('SHOW INDEXES');
    const indexes = indexesResult.records.map((record) => record.get('name') as string);

    // Drop each index (except constraint-backed indexes)
    for (const indexName of indexes) {
      try {
        await writeQuery(`DROP INDEX ${indexName} IF EXISTS`);
      } catch (error: unknown) {
        // Ignore constraint-backed index errors
        if (!error.message.includes('constraint')) {
          console.warn(`Index drop warning:`, error.message);
        }
      }
    }

    console.log('✓ Schema dropped successfully');
  } catch (error) {
    console.error('✗ Failed to drop schema:', error);
    throw error;
  }
}

/**
 * Verify schema is properly initialized
 *
 * @returns Schema health report
 */
export async function verifySchema(): Promise<{
  constraints: number;
  indexes: number;
  status: 'healthy' | 'incomplete';
}> {
  try {
    const constraintsResult = await writeQuery('SHOW CONSTRAINTS');
    const constraintsCount = constraintsResult.records.length;

    const indexesResult = await writeQuery('SHOW INDEXES');
    const indexesCount = indexesResult.records.length;

    const status = constraintsCount >= 10 && indexesCount >= 15 ? 'healthy' : 'incomplete';

    return {
      constraints: constraintsCount,
      indexes: indexesCount,
      status,
    };
  } catch (error) {
    console.error('Schema verification failed:', error);
    return {
      constraints: 0,
      indexes: 0,
      status: 'incomplete',
    };
  }
}

/**
 * Get schema statistics
 *
 * @returns Node and relationship counts by type
 */
export async function getSchemaStats(): Promise<{
  nodes: Record<string, number>;
  relationships: Record<string, number>;
  totalNodes: number;
  totalRelationships: number;
}> {
  try {
    // Count nodes by label
    const nodesResult = await writeQuery(`
      CALL db.labels() YIELD label
      CALL apoc.cypher.run('MATCH (n:' + label + ') RETURN count(n) as count', {})
      YIELD value
      RETURN label, value.count as count
    `);

    const nodes: Record<string, number> = {};
    let totalNodes = 0;

    for (const record of nodesResult.records) {
      const label = record.get('label') as string;
      const count = record.get('count').toNumber();
      nodes[label] = count;
      totalNodes += count;
    }

    // Count relationships by type
    const relsResult = await writeQuery(`
      CALL db.relationshipTypes() YIELD relationshipType
      CALL apoc.cypher.run('MATCH ()-[r:' + relationshipType + ']->() RETURN count(r) as count', {})
      YIELD value
      RETURN relationshipType, value.count as count
    `);

    const relationships: Record<string, number> = {};
    let totalRelationships = 0;

    for (const record of relsResult.records) {
      const type = record.get('relationshipType') as string;
      const count = record.get('count').toNumber();
      relationships[type] = count;
      totalRelationships += count;
    }

    return {
      nodes,
      relationships,
      totalNodes,
      totalRelationships,
    };
  } catch (error) {
    console.error('Failed to get schema stats:', error);
    return {
      nodes: {},
      relationships: {},
      totalNodes: 0,
      totalRelationships: 0,
    };
  }
}
