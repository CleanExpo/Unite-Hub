/**
 * Neo4j Knowledge Graph Module
 *
 * Centralized exports for Neo4j graph database utilities.
 *
 * @module lib/neo4j
 */

// Client utilities
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

// Schema management
export {
  NodeTypes,
  RelationshipTypes,
  initializeSchema,
  dropSchema,
  verifySchema,
  getSchemaStats,
} from './schema';

// Entity management
export {
  upsertContact,
  upsertCompany,
  createEmail,
  createUser,
  createWorkspace,
  linkContactToCompany,
  linkContacts,
  recordEmailOpen,
  recordEmailClick,
  getContact,
  getContactsByWorkspace,
  searchContacts,
  deleteContact,
} from './entities';

export type {
  ContactEntity,
  CompanyEntity,
  EmailEntity,
  UserEntity,
  WorkspaceEntity,
} from './entities';

// Data synchronization
export { fullSync, incrementalSync, syncContacts, syncCompanies, syncEmails } from './sync';

export type { SyncResult } from './sync';

// Entity resolution
export {
  calculateSimilarity,
  findDuplicates,
  findDuplicatesForContact,
  mergeContacts,
  aiResolveConflicts,
  linkSimilarContacts,
  getResolutionStats,
} from './resolution';

export type { SimilarityMatch, MergeStrategy, MergeResult } from './resolution';
