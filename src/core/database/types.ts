/**
 * Core Database Types
 *
 * Type definitions for database operations with workspace scoping.
 *
 * @module core/database/types
 */

import { SupabaseClient, PostgrestFilterBuilder } from '@supabase/supabase-js';

/**
 * Tables that require workspace scoping
 * These tables MUST have workspace_id filtering applied
 */
export const WORKSPACE_SCOPED_TABLES = [
  'contacts',
  'campaigns',
  'drip_campaigns',
  'campaign_steps',
  'campaign_enrollments',
  'campaign_execution_logs',
  'emails',
  'email_opens',
  'email_clicks',
  'generatedContent',
  'aiMemory',
  'integrations',
  'projects',
  'tasks',
  'audit_logs',
  'founder_businesses',
  'founder_business_vault_secrets',
  'founder_business_signals',
  'founder_os_snapshots',
  'ai_phill_insights',
  'ai_phill_journal_entries',
  'cognitive_twin_scores',
  'cognitive_twin_digests',
  'cognitive_twin_decisions',
  'seo_leak_signal_profiles',
  'social_inbox_accounts',
  'social_messages',
  'search_keywords',
  'boost_jobs',
  'pre_clients',
] as const;

export type WorkspaceScopedTable = typeof WORKSPACE_SCOPED_TABLES[number];

/**
 * Tables that are globally accessible (no workspace filter)
 */
export const GLOBAL_TABLES = [
  'organizations',
  'profiles',
  'user_profiles',
  'user_organizations',
  'workspaces',
  'subscriptions',
] as const;

export type GlobalTable = typeof GLOBAL_TABLES[number];

/**
 * Check if a table requires workspace scoping
 */
export function isWorkspaceScopedTable(table: string): boolean {
  return WORKSPACE_SCOPED_TABLES.includes(table as WorkspaceScopedTable);
}

/**
 * Workspace-scoped record interface
 */
export interface WorkspaceScopedRecord {
  workspace_id: string;
  [key: string]: unknown;
}

/**
 * Connection pool configuration
 * ADR-003: Connection Pooling via Supabase
 */
export interface PoolConfig {
  /**
   * Whether to use Supabase's transaction pooler
   * Set to true for serverless environments
   */
  useTransactionPooler: boolean;

  /**
   * Connection timeout in milliseconds
   */
  connectionTimeout: number;

  /**
   * Idle timeout before connection is released
   */
  idleTimeout: number;
}

/**
 * Default pool configuration for serverless
 */
export const DEFAULT_POOL_CONFIG: PoolConfig = {
  useTransactionPooler: true,
  connectionTimeout: 5000,
  idleTimeout: 30000,
};

/**
 * Scoped query builder type
 */
export type ScopedQueryBuilder<T> = {
  select: (...args: Parameters<PostgrestFilterBuilder<any, any, T[]>['select']>) =>
    PostgrestFilterBuilder<any, any, T[]>;
  insert: (data: Partial<T> | Partial<T>[]) =>
    PostgrestFilterBuilder<any, any, T[]>;
  update: (data: Partial<T>) =>
    PostgrestFilterBuilder<any, any, T[]>;
  delete: () =>
    PostgrestFilterBuilder<any, any, T[]>;
  upsert: (data: Partial<T> | Partial<T>[], options?: { onConflict?: string }) =>
    PostgrestFilterBuilder<any, any, T[]>;
};

/**
 * Database error codes
 */
export const DB_ERROR_CODES = {
  CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  QUERY_FAILED: 'DB_QUERY_FAILED',
  WORKSPACE_REQUIRED: 'DB_WORKSPACE_REQUIRED',
  RLS_VIOLATION: 'DB_RLS_VIOLATION',
  CONSTRAINT_VIOLATION: 'DB_CONSTRAINT_VIOLATION',
  NOT_FOUND: 'DB_NOT_FOUND',
} as const;

export type DbErrorCode = typeof DB_ERROR_CODES[keyof typeof DB_ERROR_CODES];
