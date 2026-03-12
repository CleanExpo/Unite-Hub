// src/lib/ai/__tests__/features/thinking.test.ts
// Tests for adaptive thinking budget calculation.

import { describe, it, expect } from 'vitest'
import { detectComplexity, calculateThinkingBudget } from '../../features/thinking'

describe('detectComplexity', () => {
  it('returns a low score for a simple query', () => {
    const score = detectComplexity('What is our revenue?')
    expect(score).toBeLessThan(5)
  })

  it('returns a higher score for compare/versus signals', () => {
    const simple = detectComplexity('What is the weather?')
    const complex = detectComplexity('Compare option A vs option B and weigh the trade-offs')
    expect(complex).toBeGreaterThan(simple)
  })

  it('scores analyse/evaluate/assess signals', () => {
    const score = detectComplexity('Analyse the financial implications and evaluate the risk')
    expect(score).toBeGreaterThan(5)
  })

  it('scores Australian tax-specific terms', () => {
    const score = detectComplexity(
      'Review the CGT implications under Division 115 and check the ATO ruling on Part IVA'
    )
    expect(score).toBeGreaterThan(7)
  })

  it('adds weight for question marks', () => {
    const noQuestions = detectComplexity('Analyse the revenue')
    const withQuestions = detectComplexity('Analyse the revenue? What about profit? And cashflow?')
    expect(withQuestions).toBeGreaterThan(noQuestions)
  })

  it('adds length-based weight from word count', () => {
    const short = detectComplexity('Analyse this')
    const long = detectComplexity(
      'Analyse this very long and detailed prompt that contains many words ' +
        'to ensure the length-based scoring adds a meaningful contribution ' +
        'to the overall complexity score for budget calculation purposes'
    )
    expect(long).toBeGreaterThan(short)
  })

  it('scores large numbers', () => {
    const withNumbers = detectComplexity('The revenue was 12500000 last year')
    const without = detectComplexity('The revenue was big last year')
    expect(withNumbers).toBeGreaterThan(without)
  })
})

describe('calculateThinkingBudget', () => {
  it('returns minimum budget for a simple query', () => {
    const budget = calculateThinkingBudget('What is our revenue?')
    expect(budget).toBeGreaterThanOrEqual(2000)
    expect(budget).toBeLessThanOrEqual(5000)
  })

  it('returns a high budget for a complex tax query', () => {
    const budget = calculateThinkingBudget(
      'Compare the CGT implications of restructuring Division 115 vs Division 152 ' +
        'and analyse the risk of Part IVA applying. Consider the ATO ruling TR 2024/1 ' +
        'and evaluate the financial impact on cashflow and profit. What are the consequences? ' +
        'What strategy should we adopt?'
    )
    expect(budget).toBeGreaterThanOrEqual(8000)
  })

  it('caps budget at MAX_BUDGET (16000)', () => {
    // Build a prompt that triggers many signals to push complexity very high
    const hugePrompt =
      'Compare and analyse the strategic implications of restructuring. ' +
      'Evaluate the risk, consequences, and impact. ' +
      'Consider tax, CGT, GST, BAS, ATO, Division 115, Subdivision 115-A, Part IVA. ' +
      'Multi-step phased strategy with legal compliance and regulation. ' +
      'Financial revenue profit loss cashflow budget 1234567890. ' +
      'What? Why? How? When? Where? Who? ' +
      'Trade-off pros and cons versus alternatives. ' +
      'Investigate assess factor in weigh the legislation ruling. ' +
      'Optimise refactor restructure the entire operation across all phases and stages.'
    const budget = calculateThinkingBudget(hugePrompt)
    expect(budget).toBeLessThanOrEqual(16000)
  })

  it('never goes below MIN_BUDGET (2000)', () => {
    const budget = calculateThinkingBudget('Hi')
    expect(budget).toBe(2000)
  })
})
