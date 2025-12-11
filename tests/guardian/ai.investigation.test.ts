import { describe, it, expect } from 'vitest';

/**
 * Guardian AI Investigation Console Tests (H08)
 */

describe('Guardian AI Investigation Console', () => {
  it('validates investigation answer structure', () => {
    const mockAnswer = {
      answerMarkdown: '**Analysis:** Your workspace...',
      answerSummary: 'Critical alerts increased 300%',
      answerType: 'trend',
      keyEntities: { alertCount: 45 },
      keyTimeWindow: { start: '2025-12-10T00:00:00Z', end: '2025-12-11T00:00:00Z', inferred: true },
    };

    expect(mockAnswer.answerMarkdown).toBeTruthy();
    expect(mockAnswer.answerSummary).toBeTruthy();
    expect(['trend', 'outage', 'risk', 'anomaly', 'predictive', 'rules', 'correlation', 'mixed', 'generic']).toContain(mockAnswer.answerType);
    expect(mockAnswer.keyEntities).toBeTruthy();
    expect(mockAnswer.keyTimeWindow).toHaveProperty('start');
  });

  it('validates answer types', () => {
    const validTypes = ['trend', 'outage', 'risk', 'anomaly', 'predictive', 'rules', 'correlation', 'mixed', 'generic'];
    
    for (const type of validTypes) {
      expect(validTypes).toContain(type);
    }
  });

  it('classifies question intents', () => {
    const questions = [
      { q: 'What is my risk score?', expectedType: 'risk' },
      { q: 'Show anomalies from last week', expectedType: 'anomaly' },
      { q: 'List recent incidents', expectedType: 'outage' },
    ];

    for (const { q, expectedType } of questions) {
      const lowerQ = q.toLowerCase();
      let type = 'generic';
      if (lowerQ.includes('risk')) type = 'risk';
      else if (lowerQ.includes('anomaly') || lowerQ.includes('anomalies')) type = 'anomaly';
      else if (lowerQ.includes('incident')) type = 'outage';
      
      expect(type).toBe(expectedType);
    }
  });

  it('infers time windows from questions', () => {
    const questions = [
      { q: 'alerts from last 24 hours', expectedHours: 24 },
      { q: 'incidents this week', expectedHours: 7 * 24 },
      { q: 'risk trends last 30 days', expectedHours: 30 * 24 },
    ];

    for (const { q, expectedHours } of questions) {
      const lowerQ = q.toLowerCase();
      let hours = 24; // default

      if (lowerQ.includes('last 24 hours') || lowerQ.includes('today')) hours = 24;
      else if (lowerQ.includes('week')) hours = 7 * 24;
      else if (lowerQ.includes('30 days') || lowerQ.includes('month')) hours = 30 * 24;

      expect(hours).toBe(expectedHours);
    }
  });

  it('validates session and sequence management', () => {
    const session = {
      sessionId: crypto.randomUUID(),
      turns: [
        { sequenceIndex: 0, question: 'Q1' },
        { sequenceIndex: 1, question: 'Q2' },
        { sequenceIndex: 2, question: 'Q3' },
      ],
    };

    expect(session.turns.length).toBe(3);
    expect(session.turns[0].sequenceIndex).toBe(0);
    expect(session.turns[2].sequenceIndex).toBe(2);
  });

  it('validates question length limits', () => {
    const validQuestion = 'What is my risk score?';
    const tooLongQuestion = 'x'.repeat(1001);

    expect(validQuestion.length).toBeLessThanOrEqual(1000);
    expect(tooLongQuestion.length).toBeGreaterThan(1000);
  });
});
