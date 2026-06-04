// src/lib/command-centre/registry.ts
//
// Typed, read-only accessor over the Nexus Command Centre project registry.
// Loads the seed `data/command-centre/projects.json` fallback (before the
// `cc_projects` table exists). No DB writes, no secrets — env var names only.

import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type DeploymentTarget = 'Vercel' | 'Railway' | 'Docker' | string

export type ProjectStatus = 'active' | 'stub' | 'paused' | 'archived' | string

/**
 * A single project the command centre can read about (and, later, act on).
 * Mirrors the `cc_projects` shape in the Nexus spec. Read-only here.
 */
export interface CommandCentreProject {
  name: string
  repo_path: string
  github_repo: string | null
  business_purpose: string
  brand_rules_ref: string
  deployment_target: DeploymentTarget
  owner: string
  status: ProjectStatus
  evidence_vault_path: string
  validation_commands: string[]
  linear_prefix: string
  production_url: string | null
}

interface RegistryFile {
  $schema_version?: string
  generated_note?: string
  projects: CommandCentreProject[]
}

/** Absolute path to the seed registry JSON, relative to the repo root (cwd). */
function registryFilePath(): string {
  return path.join(process.cwd(), 'data', 'command-centre', 'projects.json')
}

function isProject(value: unknown): value is CommandCentreProject {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.name === 'string' &&
    typeof v.repo_path === 'string' &&
    typeof v.business_purpose === 'string' &&
    typeof v.deployment_target === 'string' &&
    typeof v.owner === 'string' &&
    typeof v.status === 'string' &&
    typeof v.evidence_vault_path === 'string' &&
    Array.isArray(v.validation_commands) &&
    typeof v.linear_prefix === 'string'
  )
}

/**
 * Load every project from the seed registry. Read-only.
 * Throws if the file is missing or malformed so callers fail loudly rather
 * than silently serving an empty registry.
 */
export async function getProjects(): Promise<CommandCentreProject[]> {
  const raw = await readFile(registryFilePath(), 'utf-8')
  const parsed = JSON.parse(raw) as RegistryFile

  if (!parsed || !Array.isArray(parsed.projects)) {
    throw new Error('command-centre registry: malformed projects.json (missing "projects" array)')
  }

  const projects = parsed.projects.filter(isProject)
  if (projects.length !== parsed.projects.length) {
    throw new Error('command-centre registry: one or more projects failed schema validation')
  }

  return projects
}

/** Look up a single project by its canonical name (case-insensitive). */
export async function getProjectByName(name: string): Promise<CommandCentreProject | undefined> {
  const projects = await getProjects()
  const target = name.trim().toLowerCase()
  return projects.find((p) => p.name.toLowerCase() === target)
}
