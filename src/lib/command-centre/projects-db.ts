// src/lib/command-centre/projects-db.ts
//
// Hand-written types + typed accessors for the durable Command Centre project
// registry (cc_projects). This is the DB-backed mirror of the read-only
// json registry in registry.ts — `seed` upserts the json rows into cc_projects.
//
// No remote calls are made at import time — the Supabase server client is
// created lazily inside each accessor (matching tasks.ts / decisions.ts).
// All rows are founder-scoped by RLS (founder_id = auth.uid()) and the table's
// UNIQUE(founder_id, name) constraint makes the upsert idempotent.

import { createClient } from '@/lib/supabase/server'
import type { CommandCentreProject } from './registry'

// ─── Types (hand-written; mirror the SQL schema) ──────────────────────────────

/** A durable Command Centre project row (cc_projects). */
export interface CommandCentreProjectRow {
  id: string
  founder_id: string
  name: string
  repo_path: string | null
  github_repo: string | null
  brand_rules_ref: string | null
  business_purpose: string
  deployment_target: string | null
  owner: string | null
  agent_team: string[]
  status: string
  evidence_vault_path: string | null
  validation_commands: string[]
  linear_prefix: string | null
  production_url: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

/** Insert/upsert input — founder_id is supplied by the accessor. */
export interface UpsertProjectInput {
  founderId: string
  name: string
  repoPath?: string | null
  githubRepo?: string | null
  brandRulesRef?: string | null
  businessPurpose?: string
  deploymentTarget?: string | null
  owner?: string | null
  agentTeam?: string[]
  status?: string
  evidenceVaultPath?: string | null
  validationCommands?: string[]
  linearPrefix?: string | null
  productionUrl?: string | null
  metadata?: Record<string, unknown>
}

// Table name constant — single source of truth, asserted by tests.
export const CC_PROJECTS_TABLE = 'cc_projects'

// Allowed status values per the cc_projects CHECK constraint.
const VALID_STATUSES = new Set(['active', 'stub', 'paused', 'archived'])

// A minimal structural type for the Supabase client this module depends on.
// (tasks.ts' SupabaseLike doesn't model `upsert`, so we declare just what we
// need here — keeps the module testable with a plain mock.)
export interface ProjectsSupabaseLike {
  from(table: string): {
    upsert(
      values: unknown,
      options?: { onConflict?: string },
    ): {
      select(columns?: string): { single(): Promise<{ data: unknown; error: { message: string } | null }> }
    }
    select(columns?: string): {
      eq(column: string, value: unknown): {
        order(column: string, opts: { ascending: boolean }): Promise<{ data: unknown; error: { message: string } | null }>
      }
    }
  }
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

/** Map a json registry project to an upsert input for the current founder. */
export function projectToUpsertInput(
  founderId: string,
  project: CommandCentreProject,
): UpsertProjectInput {
  return {
    founderId,
    name: project.name,
    repoPath: project.repo_path,
    githubRepo: project.github_repo,
    brandRulesRef: project.brand_rules_ref,
    businessPurpose: project.business_purpose,
    deploymentTarget: project.deployment_target,
    owner: project.owner,
    status: VALID_STATUSES.has(project.status) ? project.status : 'stub',
    evidenceVaultPath: project.evidence_vault_path,
    validationCommands: project.validation_commands,
    linearPrefix: project.linear_prefix,
    productionUrl: project.production_url,
  }
}

// ─── Accessors ────────────────────────────────────────────────────────────────

/**
 * Upsert a project row, idempotent on (founder_id, name). Returns the row.
 * The `client` argument is for testing — production callers omit it and a
 * founder-scoped server client is created lazily.
 */
export async function upsertProject(
  input: UpsertProjectInput,
  client?: ProjectsSupabaseLike,
): Promise<CommandCentreProjectRow> {
  const db = client ?? ((await createClient()) as unknown as ProjectsSupabaseLike)

  const row = {
    founder_id: input.founderId,
    name: input.name,
    repo_path: input.repoPath ?? null,
    github_repo: input.githubRepo ?? null,
    brand_rules_ref: input.brandRulesRef ?? null,
    business_purpose: input.businessPurpose ?? '',
    deployment_target: input.deploymentTarget ?? null,
    owner: input.owner ?? null,
    agent_team: input.agentTeam ?? [],
    status: input.status && VALID_STATUSES.has(input.status) ? input.status : 'active',
    evidence_vault_path: input.evidenceVaultPath ?? null,
    validation_commands: input.validationCommands ?? [],
    linear_prefix: input.linearPrefix ?? null,
    production_url: input.productionUrl ?? null,
    metadata: input.metadata ?? {},
  }

  const { data, error } = await db
    .from(CC_PROJECTS_TABLE)
    .upsert(row, { onConflict: 'founder_id,name' })
    .select('*')
    .single()

  if (error) throw new Error(`upsertProject failed: ${error.message}`)
  return data as CommandCentreProjectRow
}

/**
 * List a founder's project rows, newest first. Founder-scoped.
 * The `client` argument is for testing — production callers omit it.
 */
export async function listProjects(
  founderId: string,
  client?: ProjectsSupabaseLike,
): Promise<CommandCentreProjectRow[]> {
  const db = client ?? ((await createClient()) as unknown as ProjectsSupabaseLike)

  const { data, error } = await db
    .from(CC_PROJECTS_TABLE)
    .select('*')
    .eq('founder_id', founderId)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(`listProjects failed: ${error.message}`)
  return (data as CommandCentreProjectRow[]) ?? []
}
