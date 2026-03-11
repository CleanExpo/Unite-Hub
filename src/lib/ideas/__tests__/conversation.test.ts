// src/lib/ideas/__tests__/conversation.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt, parseClaudeResponse } from '../conversation'

describe('parseClaudeResponse', () => {
  it('detects a JSON spec block', () => {
    const raw = `Sure thing!\n\`\`\`json\n{"type":"spec","title":"Add PDF export","teamKey":"RA","priority":2,"labels":["feature"],"description":"Allow export","acceptanceCriteria":["PDF downloads"]}\n\`\`\``
    const result = parseClaudeResponse(raw)
    expect(result.type).toBe('spec')
    if (result.type !== 'spec') throw new Error('expected spec result')
    expect(result.spec.title).toBe('Add PDF export')
  })

  it('returns a question when no spec block present', () => {
    const raw = "I'd classify this as a Feature Request. Does that sound right?"
    const result = parseClaudeResponse(raw)
    expect(result.type).toBe('question')
    expect(result.question).toBe(raw)
  })
})

describe('buildSystemPrompt', () => {
  it('includes all business keys', () => {
    const prompt = buildSystemPrompt()
    expect(prompt).toContain('dr')
    expect(prompt).toContain('dr_qld')
    expect(prompt).toContain('nrpg')
    expect(prompt).toContain('carsi')
    expect(prompt).toContain('restore')
    expect(prompt).toContain('synthex')
    expect(prompt).toContain('ato')
    expect(prompt).toContain('ccw')
  })
})
