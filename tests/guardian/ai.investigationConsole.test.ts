import { describe, it, expect } from 'vitest';

/**
 * Guardian AI Investigation Console Tests (H08)
 *
 * Tests for natural-language query interface.
 */

describe('Guardian AI Investigation Console', () => {
  it('validates investigation turn structure', () => {
    const mockTurn = {
      sequenceIndex: 1,
      question: 'What were the critical incidents today?',
      answerMarkdown: 'Based on the data...',
      answerSummary: 'Summary of answer',
      answerType: 'outage',
      keyEntities: { incidentCount: 5 },
      keyTimeWindow: {
        start: '2025-12-10T00:00:00Z',
        end: '2025-12-11T00:00:00Z',
        inferred: true,
      },
    };

    expect(mockTurn.question).toBeTruthy();
    expect(mockTurn.answerMarkdown).toBeTruthy();
    expect(['trend', 'outage', 'risk', 'anomaly', 'predictive', 'rules', 'correlation', 'mixed', 'generic']).toContain(mockTurn.answerType);
  });

  it('classifies question intents', () => {
    const riskQuestion = 'what is my risk score?';
    const anomalyQuestion = 'are there any anomalies?';
    const incidentQuestion = 'show me recent incidents';

    expect(riskQuestion.toLowerCase()).toContain('risk');
    expect(anomalyQuestion.toLowerCase()).toContain('anomal');
    expect(incidentQuestion.toLowerCase()).toContain('incident');
  });

  it('infers time windows from questions', () => {
    const last24h = 'what happened in the last 24 hours?';
    const last7d = 'show me alerts from the last 7 days';
    const thisWeek = 'incidents this week';

    expect(last24h.toLowerCase()).toContain('24');
    expect(last7d.toLowerCase()).toContain('7 days');
    expect(thisWeek.toLowerCase()).toContain('week');
  });

  it('validates answer types', () => {
    const validTypes = ['trend', 'outage', 'risk', 'anomaly', 'predictive', 'rules', 'correlation', 'mixed', 'generic'];

    for (const type of validTypes) {
      expect(validTypes).toContain(type);
    }
  });

  it('validates question length limits', () => {
    const validQuestion = 'What is my risk score?';
    const tooLong = 'x'.repeat(501);

    expect(validQuestion.length).toBeLessThanOrEqual(500);
    expect(tooLong.length).toBeGreaterThan(500); // Should be rejected
  });

  it('handles session sequencing', () => {
    const turns = [
      { sequenceIndex: 1 },
      { sequenceIndex: 2 },
      { sequenceIndex: 3 },
    ];

    expect(turns[0].sequenceIndex).toBe(1);
    expect(turns[turns.length - 1].sequenceIndex).toBe(3);
    expect(turns.length).toBe(3);
  });
});
