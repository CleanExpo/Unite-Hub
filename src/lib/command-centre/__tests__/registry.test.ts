import { describe, it, expect } from 'vitest'
import { getProjects, getProjectByName } from '@/lib/command-centre/registry'

const EXPECTED_PROJECTS = [
  'Unite-Hub',
  'RestoreAssist',
  'Synthex',
  'Disaster-Recovery',
  'DR-NRPG',
  'ATO-APP',
  'CCW-CRM',
  'Authority-Site',
  'Nexus-Hub',
  'Pi-CEO-Dev',
  'CCW',
  'Dunkin-Perkins',
  'CARSI',
]

describe('command-centre registry', () => {
  it('loads every seeded project', async () => {
    const projects = await getProjects()
    const names = projects.map((p) => p.name)
    for (const expected of EXPECTED_PROJECTS) {
      expect(names).toContain(expected)
    }
    expect(projects.length).toBe(EXPECTED_PROJECTS.length)
  })

  it('returns fully-typed project records with required fields', async () => {
    const projects = await getProjects()
    for (const p of projects) {
      expect(typeof p.name).toBe('string')
      expect(typeof p.repo_path).toBe('string')
      expect(typeof p.business_purpose).toBe('string')
      expect(typeof p.deployment_target).toBe('string')
      expect(p.owner).toBe('Phill McGurk')
      expect(typeof p.status).toBe('string')
      expect(typeof p.evidence_vault_path).toBe('string')
      expect(Array.isArray(p.validation_commands)).toBe(true)
      expect(typeof p.linear_prefix).toBe('string')
    }
  })

  it('seeds known production URLs from the portfolio registry', async () => {
    const ra = await getProjectByName('RestoreAssist')
    expect(ra?.production_url).toBe('https://restoreassist.app')
    const synthex = await getProjectByName('Synthex')
    expect(synthex?.production_url).toBe('https://synthex-h4j7.vercel.app')
  })

  it('looks up projects case-insensitively', async () => {
    const p = await getProjectByName('unite-hub')
    expect(p?.name).toBe('Unite-Hub')
  })
})
