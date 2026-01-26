/**
 * Neo4j Knowledge Graph Module
 *
 * Centralized exports for Neo4j graph database utilities.
 *
 * @module lib/neo4j
 */

export {
  getDriver,
  getSession,
  readQuery,
  writeQuery,
  executeTransaction,
  closeDriver,
  verifyConnectivity,
  getServerInfo,
  healthCheck,
  neo4j,
} from './client';

export type { Driver, Session, Result } from './client';
