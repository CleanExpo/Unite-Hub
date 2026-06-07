import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const nexusDir = join(process.cwd(), 'docs/operator-gateway/self-evolving')

function readJson(path: string) {
  return JSON.parse(readFileSync(join(nexusDir, path), 'utf8'))
}

function readJsonl(path: string) {
  return readFileSync(join(nexusDir, path), 'utf8')
    .trim()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))
}

describe('self-evolving skill mesh local schema artifacts', () => {
  it('defines required skill evolution schema fields and validates registry safety shape', () => {
    const schema = readJson('skill_evolution.schema.json')
    const records = readJsonl('skill_evolution_registry.jsonl')

    expect(schema.required).toEqual(expect.arrayContaining([
      'skill_id',
      'current_version',
      'candidate_version',
      'model_lane',
      'eval_strategy',
      'graders',
      'pass_threshold',
      'latest_score',
      'promotion_status',
      'rollback_available',
      'evidence_path',
      'production_gate_required',
      'status',
    ]))
    expect(records.length).toBeGreaterThanOrEqual(10)
    expect(records.every((record) => record.production_gate_required === true)).toBe(true)
    expect(records.every((record) => record.external_eval_api_called === false)).toBe(true)
    expect(records.every((record) => record.api_key_mode === false)).toBe(true)
    expect(records.every((record) => record.live_auto_promotion_enabled === false)).toBe(true)
  })

  it('defines grader and prompt-version schemas with rollback/no-live-promotion constraints', () => {
    const graderSchema = readJson('skill_evaluation_grader.schema.json')
    const promptSchema = readJson('skill_prompt_version.schema.json')

    expect(graderSchema.required).toEqual(expect.arrayContaining([
      'grader_id',
      'input',
      'output',
      'scoring_range',
      'pass_threshold',
      'failure_reasons',
      'safe_automated_use',
      'human_review_required_when',
    ]))
    expect(graderSchema.properties.scoring_range.properties.min.const).toBe(0)
    expect(graderSchema.properties.scoring_range.properties.max.const).toBe(1)
    expect(promptSchema.properties.candidate_live.const).toBe(false)
    expect(promptSchema.properties.production_mutation_allowed.const).toBe(false)
    expect(promptSchema.required).toEqual(expect.arrayContaining([
      'skill_id',
      'current_version',
      'candidate_version',
      'rollback_version',
      'rollback_available',
      'promotion_gate_required',
    ]))
  })
})
