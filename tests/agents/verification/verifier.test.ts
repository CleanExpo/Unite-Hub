/**
 * Tests for AgentVerifier
 * Part of Project Vend Phase 2
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AgentVerifier, getAgentVerifier } from '@/lib/agents/verification/verifier';

// Mock Supabase
const mockInsert = vi.fn().mockReturnThis();
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockGte = vi.fn().mockReturnThis();
const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  select: mockSelect,
  eq: mockEq,
  gte: mockGte
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom
  }))
}));

describe('AgentVerifier', () => {
  let verifier: AgentVerifier;

  beforeEach(() => {
    vi.clearAllMocks();
    verifier = new AgentVerifier();
  });

  describe('verifyEmailIntent', () => {
    it('passes for valid intent', () => {
      const result = verifier.verifyEmailIntent(
        'asking about pricing information',
        'Hi, I would like to know more about your pricing plans.'
      );

      expect(result.passed).toBe(true);
      expect(result.confidence).toBeGreaterThan(0.7);
      expect(result.errors).toHaveLength(0);
    });

    it('fails for empty intent', () => {
      const result = verifier.verifyEmailIntent('', 'Some email body');

      expect(result.passed).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.errors).toContain('Intent is empty');
    });

    it('fails for too short intent', () => {
      const result = verifier.verifyEmailIntent('hi', 'Hello there how are you doing today?');

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Intent too short (< 5 chars)');
    });

    it('warns for unusually long intent', () => {
      const longIntent = 'a'.repeat(250);
      const result = verifier.verifyEmailIntent(longIntent, 'Short email');

      expect(result.warnings).toContain('Intent unusually long (> 200 chars)');
    });

    it('warns for low word overlap', () => {
      const result = verifier.verifyEmailIntent(
        'zebra yellow xylophone quantum',
        'I need help with my software subscription.'
      );

      // No word overlap, should warn and reduce confidence
      expect(result.warnings.some(w => w.includes('Low word overlap'))).toBe(true);
      expect(result.confidence).toBeLessThan(0.9);
    });
  });

  describe('verifySentimentAccuracy', () => {
    it('passes for positive sentiment with positive words', () => {
      const result = verifier.verifySentimentAccuracy(
        'positive',
        'This is excellent work! I love it.'
      );

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('passes for negative sentiment with negative words', () => {
      const result = verifier.verifySentimentAccuracy(
        'negative',
        'This is terrible and I hate it.'
      );

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails for invalid sentiment value', () => {
      const result = verifier.verifySentimentAccuracy('invalid', 'Some email');

      expect(result.passed).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.errors[0]).toContain('Invalid sentiment');
    });

    it('warns for sentiment contradiction', () => {
      const result = verifier.verifySentimentAccuracy(
        'positive',
        'This is awful and terrible.'
      );

      expect(result.warnings.some(w => w.includes('contains negative words'))).toBe(true);
      expect(result.confidence).toBeLessThan(1.0);
    });
  });

  describe('verifyContactData', () => {
    it('passes for valid contact', () => {
      const result = verifier.verifyContactData({
        email: 'john@example.com',
        name: 'John Doe'
      });

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails for invalid email format', () => {
      const result = verifier.verifyContactData({
        email: 'invalid-email',
        name: 'John Doe'
      });

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Invalid email format');
      expect(result.confidence).toBe(0);
    });

    it('fails for missing email', () => {
      const result = verifier.verifyContactData({
        name: 'John Doe'
      });

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Missing email');
    });

    it('warns for missing name', () => {
      const result = verifier.verifyContactData({
        email: 'john@example.com'
      });

      expect(result.warnings).toContain('Missing name fields');
    });

    it('warns for placeholder values', () => {
      const result = verifier.verifyContactData({
        email: 'test@example.com',
        name: 'Foo Bar',
        company: 'TODO'
      });

      expect(result.warnings.some(w => w.includes('Placeholder values'))).toBe(true);
    });
  });

  describe('verifyContentQuality', () => {
    it('passes for good quality content', () => {
      const result = verifier.verifyContentQuality(
        'Hi {firstName}, check out this amazing offer! Click here to learn more.'
      );

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.details?.has_tokens).toBe(true);
      expect(result.details?.has_cta).toBe(true);
    });

    it('fails for empty content', () => {
      const result = verifier.verifyContentQuality('');

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Content is empty');
    });

    it('fails for too short content', () => {
      const result = verifier.verifyContentQuality('Hi there');

      expect(result.passed).toBe(false);
      expect(result.errors).toContain('Content too short (< 20 chars)');
    });

    it('warns for missing personalization', () => {
      const result = verifier.verifyContentQuality(
        'This is generic content without any personalization tokens.'
      );

      expect(result.warnings).toContain('No personalization tokens found');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('warns for missing CTA', () => {
      const result = verifier.verifyContentQuality(
        'Hello {firstName}, this is just some information for you.'
      );

      expect(result.warnings).toContain('No clear call-to-action found');
    });

    it('warns for excessive caps', () => {
      const result = verifier.verifyContentQuality(
        'Hi {firstName}, THIS IS VERY IMPORTANT URGENT MESSAGE ACT NOW'
      );

      expect(result.warnings.some(w => w.includes('all-caps'))).toBe(true);
    });
  });

  describe('verifyPersonalization', () => {
    it('passes when all tokens have data', () => {
      const result = verifier.verifyPersonalization(
        'Hi {firstName}, welcome to {company}!',
        { firstName: 'John', company: 'Acme Corp' }
      );

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails when tokens missing from contact data', () => {
      const result = verifier.verifyPersonalization(
        'Hi {firstName}, welcome to {company}!',
        { firstName: 'John' } // Missing company
      );

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain('Missing contact data for tokens: company');
    });

    it('warns when no tokens found', () => {
      const result = verifier.verifyPersonalization(
        'Generic content without personalization',
        { firstName: 'John' }
      );

      expect(result.warnings).toContain('No personalization tokens found');
    });
  });

  describe('verifyScoreChangeReasonable', () => {
    it('passes for reasonable score changes', () => {
      const result = verifier.verifyScoreChangeReasonable(15);

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('fails for extreme score changes', () => {
      const result = verifier.verifyScoreChangeReasonable(35);

      expect(result.passed).toBe(false);
      expect(result.confidence).toBe(0);
      expect(result.errors).toContain('Extreme score change: 35');
    });

    it('warns for large but not extreme changes', () => {
      const result = verifier.verifyScoreChangeReasonable(25);

      expect(result.warnings).toContain('Large score change: 25');
      expect(result.confidence).toBeLessThan(1.0);
    });

    it('warns when change deviates from historical pattern', () => {
      const result = verifier.verifyScoreChangeReasonable(20, {
        recent_changes: [2, 3, 2, 4, 3] // Avg ~3
      });

      expect(result.warnings.some(w => w.includes('historical average'))).toBe(true);
    });
  });

  describe('verifyCampaignConditions', () => {
    it('passes for simple conditions', () => {
      const result = verifier.verifyCampaignConditions({
        field: 'score',
        operator: 'gt',
        value: 50
      });

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('warns for deep nesting', () => {
      const deepConditions = {
        and: [
          { field: 'score', operator: 'gt', value: 50 },
          {
            and: [
              { field: 'email_opened', operator: 'eq', value: true },
              {
                and: [
                  { field: 'clicked', operator: 'eq', value: true },
                  {
                    and: [
                      { field: 'replied', operator: 'eq', value: true }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      };

      const result = verifier.verifyCampaignConditions(deepConditions);

      expect(result.warnings.some(w => w.includes('Condition depth high'))).toBe(true);
    });

    it('fails for extremely deep nesting', () => {
      let deepConditions: any = { field: 'base', operator: 'eq', value: 1 };
      for (let i = 0; i < 15; i++) {
        deepConditions = { and: [deepConditions, { field: `level${i}`, operator: 'eq', value: i }] };
      }

      const result = verifier.verifyCampaignConditions(deepConditions);

      expect(result.passed).toBe(false);
      expect(result.errors[0]).toContain('Condition depth too deep');
    });
  });

  describe('singleton pattern', () => {
    it('returns same instance', () => {
      const instance1 = getAgentVerifier();
      const instance2 = getAgentVerifier();

      expect(instance1).toBe(instance2);
    });
  });
});
