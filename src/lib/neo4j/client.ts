/**
 * Neo4j Knowledge Graph Client
 *
 * Provides connection management and utilities for the Neo4j graph database.
 * Used for entity relationships, contact intelligence, and pattern detection.
 *
 * @module lib/neo4j/client
 */

import neo4j, { Driver, Session, Result, auth } from 'neo4j-driver';

/**
 * Neo4j connection configuration
 */
interface Neo4jConfig {
  uri: string;
  user: string;
  password: string;
  database?: string;
}

/**
 * Singleton Neo4j driver instance
 */
let driver: Driver | null = null;

/**
 * Get Neo4j configuration from environment variables
 */
function getConfig(): Neo4jConfig {
  const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const user = process.env.NEO4J_USER || 'neo4j';
  const password = process.env.NEO4J_PASSWORD;

  if (!password) {
    throw new Error('NEO4J_PASSWORD environment variable is required');
  }

  return {
    uri,
    user,
    password,
    database: process.env.NEO4J_DATABASE || 'neo4j',
  };
}

/**
 * Initialize Neo4j driver (singleton pattern)
 *
 * @returns Neo4j driver instance
 */
export function getDriver(): Driver {
  if (!driver) {
    const config = getConfig();

    driver = neo4j.driver(
      config.uri,
      auth.basic(config.user, config.password),
      {
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 60000, // 60 seconds
        maxTransactionRetryTime: 30000, // 30 seconds
        logging: {
          level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
          logger: (level, message) => {
            if (level === 'error') {
              console.error('[Neo4j]', message);
            } else if (level === 'warn') {
              console.warn('[Neo4j]', message);
            } else if (process.env.NODE_ENV !== 'production') {
              console.log('[Neo4j]', message);
            }
          },
        },
      }
    );

    // Verify connectivity on initialization
    driver
      .verifyConnectivity()
      .then(() => {
        console.log('✓ Neo4j connection established successfully');
      })
      .catch((error) => {
        console.error('✗ Neo4j connection failed:', error.message);
        // Don't throw here - allow app to start even if Neo4j is temporarily unavailable
      });
  }

  return driver;
}

/**
 * Create a new Neo4j session
 *
 * @param mode - Session mode ('READ' or 'WRITE')
 * @param database - Optional database name (defaults to config database)
 * @returns Neo4j session
 *
 * @example
 * ```typescript
 * const session = getSession('READ');
 * try {
 *   const result = await session.run('MATCH (n) RETURN n LIMIT 10');
 *   return result.records;
 * } finally {
 *   await session.close();
 * }
 * ```
 */
export function getSession(
  mode: 'READ' | 'WRITE' = 'READ',
  database?: string
): Session {
  const driver = getDriver();
  const config = getConfig();

  return driver.session({
    database: database || config.database,
    defaultAccessMode: mode === 'READ' ? neo4j.session.READ : neo4j.session.WRITE,
  });
}

/**
 * Execute a read query
 *
 * @param query - Cypher query string
 * @param params - Query parameters
 * @returns Query result
 *
 * @example
 * ```typescript
 * const result = await readQuery(
 *   'MATCH (c:Contact {email: $email}) RETURN c',
 *   { email: 'user@example.com' }
 * );
 * ```
 */
export async function readQuery(
  query: string,
  params?: Record<string, any>
): Promise<Result> {
  const session = getSession('READ');
  try {
    return await session.run(query, params);
  } finally {
    await session.close();
  }
}

/**
 * Execute a write query
 *
 * @param query - Cypher query string
 * @param params - Query parameters
 * @returns Query result
 *
 * @example
 * ```typescript
 * const result = await writeQuery(
 *   'CREATE (c:Contact {email: $email, name: $name}) RETURN c',
 *   { email: 'user@example.com', name: 'John Doe' }
 * );
 * ```
 */
export async function writeQuery(
  query: string,
  params?: Record<string, any>
): Promise<Result> {
  const session = getSession('WRITE');
  try {
    return await session.run(query, params);
  } finally {
    await session.close();
  }
}

/**
 * Execute a transaction (supports multiple queries with rollback on error)
 *
 * @param queries - Array of {query, params} objects
 * @returns Array of query results
 *
 * @example
 * ```typescript
 * await executeTransaction([
 *   { query: 'CREATE (c:Contact {email: $email})', params: { email: 'user@example.com' } },
 *   { query: 'CREATE (e:Email {subject: $subject})', params: { subject: 'Hello' } },
 *   { query: 'MATCH (c:Contact), (e:Email) CREATE (c)-[:SENT]->(e)', params: {} }
 * ]);
 * ```
 */
export async function executeTransaction(
  queries: Array<{ query: string; params?: Record<string, any> }>
): Promise<Result[]> {
  const session = getSession('WRITE');
  const results: Result[] = [];

  try {
    await session.executeWrite(async (tx) => {
      for (const { query, params } of queries) {
        const result = await tx.run(query, params);
        results.push(result);
      }
    });
    return results;
  } finally {
    await session.close();
  }
}

/**
 * Close the Neo4j driver connection
 *
 * Should be called when the application is shutting down.
 */
export async function closeDriver(): Promise<void> {
  if (driver) {
    await driver.close();
    driver = null;
    console.log('✓ Neo4j driver closed');
  }
}

/**
 * Verify Neo4j connectivity
 *
 * @returns True if connected, false otherwise
 */
export async function verifyConnectivity(): Promise<boolean> {
  try {
    const driver = getDriver();
    await driver.verifyConnectivity();
    return true;
  } catch (error) {
    console.error('Neo4j connectivity check failed:', error);
    return false;
  }
}

/**
 * Get Neo4j server information
 *
 * @returns Server version and address information
 */
export async function getServerInfo(): Promise<{
  version: string;
  address: string;
  edition: string;
}> {
  const session = getSession('READ');
  try {
    const result = await session.run('CALL dbms.components() YIELD versions, edition');
    const record = result.records[0];

    return {
      version: record.get('versions')[0],
      address: getConfig().uri,
      edition: record.get('edition'),
    };
  } finally {
    await session.close();
  }
}

/**
 * Health check for Neo4j connection
 *
 * @returns Health status object
 */
export async function healthCheck(): Promise<{
  status: 'healthy' | 'unhealthy';
  message: string;
  details?: any;
}> {
  try {
    const isConnected = await verifyConnectivity();

    if (!isConnected) {
      return {
        status: 'unhealthy',
        message: 'Cannot connect to Neo4j database',
      };
    }

    const info = await getServerInfo();

    return {
      status: 'healthy',
      message: 'Neo4j connection is healthy',
      details: {
        version: info.version,
        edition: info.edition,
        address: info.address,
      },
    };
  } catch (error: any) {
    return {
      status: 'unhealthy',
      message: error.message || 'Neo4j health check failed',
      details: error,
    };
  }
}

// Export neo4j types for convenience
export { neo4j };
export type { Driver, Session, Result };
