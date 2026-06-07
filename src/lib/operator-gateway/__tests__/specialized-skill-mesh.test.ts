import { describe, expect, it } from 'vitest'
import {
  generateMissionActions,
  getBusinessMissionTemplates,
  getSpecializedSkillRegistry,
  getSpecializedSkillMeshStatus,
  routeBusinessMission,
} from '../specialized-skill-mesh'

describe('specialized skill mesh registry', () => {
  it('loads the specialized skill registry with safe local operator-session invariants', () => {
    const skills = getSpecializedSkillRegistry()

    expect(skills.length).toBeGreaterThanOrEqual(17)
    expect(skills.map((skill) => skill.skillId)).toEqual(expect.arrayContaining([
      'senior_project_manager',
      'board_strategy_council',
      'senior_software_engineer',
      'local_operator_executor',
    ]))
    expect(skills.every((skill) => skill.status === 'active' || skill.status === 'blocked_op')).toBe(true)
    expect(skills.every((skill) => skill.defaultOperatorLane !== 'api_key')).toBe(true)
    expect(skills.every((skill) => skill.prohibitedTaskTypes.includes('api_key_mode'))).toBe(true)
    expect(skills.every((skill) => skill.prohibitedTaskTypes.includes('external_execution'))).toBe(true)
  })

  it('loads mission templates with first 15-20 action shapes and hard gates', () => {
    const templates = getBusinessMissionTemplates()

    expect(templates.length).toBeGreaterThanOrEqual(12)
    expect(templates.map((template) => template.templateId)).toEqual(expect.arrayContaining([
      'carsi_course_product_launch',
      'restoreassist_feature_readiness',
      'shipit_readiness',
      'evidence_audit',
    ]))
    expect(templates.every((template) => template.first20Actions.length >= 15 && template.first20Actions.length <= 20)).toBe(true)
    expect(templates.every((template) => template.allowedCommands.every((command) => !command.includes('psql')))).toBe(true)
    expect(templates.every((template) => template.stopGates.includes('production_db'))).toBe(true)
    expect(templates.every((template) => template.stopGates.includes('external_execution'))).toBe(true)
  })
})

describe('business mission router', () => {
  it('routes a RestoreAssist readiness objective to the correct senior team without external execution', () => {
    const route = routeBusinessMission('Prepare RestoreAssist feature readiness for Board review')

    expect(route.ok).toBe(true)
    expect(route.selectedTemplateId).toBe('restoreassist_feature_readiness')
    expect(route.selectedSkillTeam).toEqual(expect.arrayContaining([
      'senior_project_manager',
      'senior_software_engineer',
      'restoreassist_product_ops',
      'senior_qa',
    ]))
    expect(route.operatorLanes).toEqual(expect.arrayContaining(['hermes_local', 'agentic_nexus_skill_exec']))
    expect(route.externalExecutionEnabled).toBe(false)
    expect(route.apiKeyMode).toBe(false)
    expect(route.productionDbTouched).toBe(false)
    expect(route.actions.length).toBeGreaterThanOrEqual(15)
    expect(route.actions.length).toBeLessThanOrEqual(20)
    expect(route.actions.every((action) => action.status === 'sandbox_job_candidate')).toBe(true)
  })

  it('refuses hard-gated production deployment objectives before job generation', () => {
    const route = routeBusinessMission('Deploy the production database migration and launch live runner')

    expect(route.ok).toBe(false)
    expect(route.status).toBe('blocked_hard_gate')
    expect(route.actions).toEqual([])
    expect(route.hardGates).toEqual(expect.arrayContaining(['production_db', 'deployment', 'live_runner']))
    expect(route.externalExecutionEnabled).toBe(false)
    expect(route.apiKeyMode).toBe(false)
  })

  it('generates exactly twenty safe sandbox operator job candidates for a known template', () => {
    const actions = generateMissionActions('carsi_course_product_launch')

    expect(actions).toHaveLength(20)
    expect(actions[0]).toMatchObject({
      sequence: 1,
      status: 'sandbox_job_candidate',
      defaultLane: 'hermes_local',
    })
    expect(actions.every((action) => action.allowedCommands.includes('read_file'))).toBe(true)
    expect(actions.every((action) => action.prohibitedActions.includes('op_1password'))).toBe(true)
    expect(actions.every((action) => action.prohibitedActions.includes('external_execution'))).toBe(true)
  })

  it('reports dashboard-ready skill mesh status including active pending and blocked lanes', () => {
    const status = getSpecializedSkillMeshStatus()

    expect(status.source).toBe('static_local_registry')
    expect(status.specializedSkillCount).toBeGreaterThanOrEqual(17)
    expect(status.businessMissionTemplateCount).toBeGreaterThanOrEqual(12)
    expect(status.activeLanes).toEqual(expect.arrayContaining(['hermes_local', 'openai_codex_max', 'agentic_nexus_skill_exec']))
    expect(status.pendingLanes).toEqual(expect.arrayContaining(['claude_code_max_primary', 'cursor_cli']))
    expect(status.blockedLanes).toEqual(expect.arrayContaining(['sandbox_voice_migration_blocked_op']))
    expect(status.nextAutonomousMissionOption).toBeTruthy()
    expect(status.externalExecutionEnabled).toBe(false)
  })
})
