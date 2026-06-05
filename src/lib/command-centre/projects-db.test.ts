// src/lib/command-centre/projects-db.test.ts
//
// Unit tests for the cc_projects accessors. Supabase is mocked via the injected
// `client` argument — no network, no real DB.

import { describe, it, expect, vi } from 'vitest'
import {
  upsertProject,
  listProjects,
  projectToUpsertInput,
  CC_PROJECTS_TABLE,
  type ProjectsSupabaseLike,
} from './projects-db'
import type { CommandCentreProject } from './registry'

const FOUNDER = '11111111-1111-1111-1111-111111111111'

/** Build a mock that captures upsert(row, options) and returns a fixed row. */
function makeUpsertClient(returnRow: Record<string, unknown>) {
  const upsert = vi.fn().mockReturnValue({
    select: () => ({ single: () => Promise.resolve({ data: returnRow, error: null }) }),
  })
  const from = vi.fn().mockReturnValue({ upsert })
  const client = { from } as unknown as ProjectsSupabaseLike
  return { client, from, upsert }
}

/** Build a mock that captures the founder-scoped list query. */
function makeListClient(rows: unknown[]) {
  const order = vi.fn().mockResolvedValue({ data: rows, error: null })
  const eq = vi.fn().mockReturnValue({ order })
  const select = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ select })
  const client = { from } as unknown as ProjectsSupabaseLike
  return { client, from, select, eq, order }
}

describe('upsertProject', () => {
  it('maps input fields to cc_projects columns and upserts on (founder_id, name)', async () => {
    const { client, from, upsert } = makeUpsertClient({ id: 'p1', name: 'Unite-Hub' })

    const result = await upsertProject(
      {
        founderId: FOUNDER,
        name: 'Unite-Hub',
        repoPath: 'D:/Unite-Hub',
        githubRepo: 'org/unite-hub',
        businessPurpose: 'CRM',
        deploymentTarget: 'Vercel',
        owner: 'founder',
        status: 'active',
        linearPrefix: 'UH',
        validationCommands: ['pnpm test'],
        productionUrl: 'https://unite.app',
      },
      client,
    )

    expect(from).toHaveBeenCalledWith(CC_PROJECTS_TABLE)
    const [row, options] = upsert.mock.calls[0]
    expect(options).toEqual({ onConflict: 'founder_id,name' })
    expect(row).toMatchObject({
      founder_id: FOUNDER,
      name: 'Unite-Hub',
      repo_path: 'D:/Unite-Hub',
      github_repo: 'org/unite-hub',
      business_purpose: 'CRM',
      deployment_target: 'Vercel',
      owner: 'founder',
      status: 'active',
      linear_prefix: 'UH',
      validation_commands: ['pnpm test'],
      production_url: 'https://unite.app',
    })
    expect(result).toEqual({ id: 'p1', name: 'Unite-Hub' })
  })

  it('applies safe defaults and coerces an invalid status to active', async () => {
    const { client, upsert } = makeUpsertClient({ id: 'p2' })
    await upsertProject({ founderId: FOUNDER, name: 'Stub', status: 'nonsense' }, client)
    const [row] = upsert.mock.calls[0]
    expect(row.status).toBe('active')
    expect(row.business_purpose).toBe('')
    expect(row.agent_team).toEqual([])
    expect(row.metadata).toEqual({})
  })

  it('throws when the upsert errors', async () => {
    const upsert = vi.fn().mockReturnValue({
      select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'boom' } }) }),
    })
    const client = { from: () => ({ upsert }) } as unknown as ProjectsSupabaseLike
    await expect(upsertProject({ founderId: FOUNDER, name: 'X' }, client)).rejects.toThrow(
      /upsertProject failed: boom/,
    )
  })
})

describe('listProjects', () => {
  it('scopes the query to the founder and returns rows', async () => {
    const rows = [{ id: 'a', name: 'A' }, { id: 'b', name: 'B' }]
    const { client, from, select, eq, order } = makeListClient(rows)

    const result = await listProjects(FOUNDER, client)

    expect(from).toHaveBeenCalledWith(CC_PROJECTS_TABLE)
    expect(select).toHaveBeenCalledWith('*')
    expect(eq).toHaveBeenCalledWith('founder_id', FOUNDER)
    expect(order).toHaveBeenCalledWith('updated_at', { ascending: false })
    expect(result).toEqual(rows)
  })

  it('returns [] when the query yields null data', async () => {
    const { client } = makeListClient(null as unknown as unknown[])
    const result = await listProjects(FOUNDER, client)
    expect(result).toEqual([])
  })

  it('throws when the list errors', async () => {
    const order = vi.fn().mockResolvedValue({ data: null, error: { message: 'nope' } })
    const client = {
      from: () => ({ select: () => ({ eq: () => ({ order }) }) }),
    } as unknown as ProjectsSupabaseLike
    await expect(listProjects(FOUNDER, client)).rejects.toThrow(/listProjects failed: nope/)
  })
})

describe('projectToUpsertInput', () => {
  it('maps a json registry project to upsert input for the founder', () => {
    const project: CommandCentreProject = {
      name: 'RestoreAssist',
      repo_path: 'D:/RestoreAssist',
      github_repo: 'org/ra',
      business_purpose: 'Restoration ops',
      brand_rules_ref: 'brand.md',
      deployment_target: 'Vercel',
      owner: 'founder',
      status: 'active',
      evidence_vault_path: 'wiki/ra',
      validation_commands: ['pnpm build'],
      linear_prefix: 'RA',
      production_url: 'https://ra.app',
    }
    const input = projectToUpsertInput(FOUNDER, project)
    expect(input).toMatchObject({
      founderId: FOUNDER,
      name: 'RestoreAssist',
      repoPath: 'D:/RestoreAssist',
      githubRepo: 'org/ra',
      businessPurpose: 'Restoration ops',
      deploymentTarget: 'Vercel',
      status: 'active',
      linearPrefix: 'RA',
      validationCommands: ['pnpm build'],
      productionUrl: 'https://ra.app',
    })
  })

  it('coerces a non-CHECK status to stub', () => {
    const project = {
      name: 'X',
      repo_path: '',
      github_repo: null,
      business_purpose: '',
      brand_rules_ref: '',
      deployment_target: 'Docker',
      owner: 'o',
      status: 'experimental',
      evidence_vault_path: '',
      validation_commands: [],
      linear_prefix: 'X',
      production_url: null,
    } as CommandCentreProject
    expect(projectToUpsertInput(FOUNDER, project).status).toBe('stub')
  })
})
