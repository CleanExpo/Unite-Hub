import { describe, expect, it } from 'vitest'
import { buildTaskPacketFromIdea, classifyFounderIdea } from '../task-packet-router'

describe('buildTaskPacketFromIdea', () => {
  it('routes a Synthex social idea into social ops with high-risk approval discipline', () => {
    const result = buildTaskPacketFromIdea({
      message: 'I have an idea for Synthex to connect LinkedIn, Facebook and YouTube social accounts cleanly.',
      now: '2026-06-02T00:00:00.000Z',
      idSeed: 'synthex-social',
    })

    expect(result.taskPacket.portfolioTarget).toBe('synthex')
    expect(result.taskPacket.lane).toBe('social_ops')
    expect(result.taskPacket.riskLevel).toBe('high')
    expect(result.taskPacket.requiresHumanApproval).toBe(true)
    expect(result.taskPacket.requiredAgents).toEqual(
      expect.arrayContaining(['project-manager', 'api-integrations', 'security-auditor', 'risk-approval-agent']),
    )
    expect(result.contextPack.id).toBe(result.taskPacket.contextPackId)
    expect(result.contextPack.constraints).toContain('Require Phill/Margot approval before external side effects.')
  })

  it('routes Unite-Hub command-centre build ideas as code-change feature work', () => {
    const result = buildTaskPacketFromIdea({
      message: 'Build the Unite-Hub command centre panel for run queue visibility.',
      now: '2026-06-02T00:00:00.000Z',
      idSeed: 'command-centre',
    })

    expect(result.taskPacket.portfolioTarget).toBe('unite_hub')
    expect(result.taskPacket.lane).toBe('feature_build')
    expect(result.taskPacket.taskType).toBe('code_change')
    expect(result.taskPacket.requiresLocalExecution).toBe(true)
    expect(result.contextPack.nextRecommendedAction).toBe('Assign a scoped implementation lane with tests and evidence.')
  })

  it('routes browser/computer-use requests to browser automation with explicit safety constraints', () => {
    const result = buildTaskPacketFromIdea({
      message: 'Use Chrome browser computer use to log in and check Stripe status.',
      now: '2026-06-02T00:00:00.000Z',
      idSeed: 'browser-stripe',
    })

    expect(result.taskPacket.lane).toBe('finance_ops')
    expect(result.taskPacket.taskType).toBe('credential_grant')
    expect(result.taskPacket.riskLevel).toBe('high')
    expect(result.contextPack.constraints).toContain('Require Phill/Margot approval before external side effects.')
    expect(result.contextPack.nextRecommendedAction).toBe('Create an approval item before assigning execution.')
  })

  it('creates stable IDs so another machine can reload the same task context', () => {
    const first = buildTaskPacketFromIdea({ message: 'Research model provider routing for Kimi and Gemini.', idSeed: 'models' })
    const second = buildTaskPacketFromIdea({ message: 'Research model provider routing for Kimi and Gemini.', idSeed: 'models' })

    expect(first.taskPacket.id).toBe(second.taskPacket.id)
    expect(first.contextPack.id).toBe(second.contextPack.id)
    expect(first.contextPack.durableSummary).toContain('model_routing')
  })
})

describe('classifyFounderIdea', () => {
  it('keeps tax/banking actions human-only when money or tax submission is requested', () => {
    const result = classifyFounderIdea('Submit tax and move money from the bank account')

    expect(result.portfolioTarget).toBe('ato_app')
    expect(result.lane).toBe('finance_ops')
    expect(result.riskLevel).toBe('human_only')
    expect(result.requiresHumanApproval).toBe(true)
  })
})
