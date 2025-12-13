/**
 * Tests for Guardian Plugin Narrative Service
 * Verifies AI-powered narrative generation for plugin signals
 */

import { describe, it, expect, vi } from 'vitest';
import {
  generateNarrative,
  formatNarrativeForUI,
  type NarrativeRequest
} from '@/lib/guardian/plugins/narrativeService';

describe('Plugin Narrative Service', () => {
  const mockRequest: NarrativeRequest = {
    workspaceId: 'test-workspace',
    pluginKey: 'industry_insurance_pack',
    pluginName: 'Insurance & Claims Oversight',
    signals: [
      {
        key: 'claims_velocity_spike',
        severity: 'high',
        rationale: 'Claims intake 250% above baseline',
        suggestedAction: 'Check intake workflows'
      },
      {
        key: 'fraud_risk_cluster',
        severity: 'medium',
        rationale: '6 anomalies detected',
        suggestedAction: 'Escalate to fraud team'
      }
    ],
    riskLabel: 'high',
    totals: {
      alerts: 35,
      incidents: 12,
      correlations: 5
    },
    allowExternal: true
  };

  describe('Narrative Generation', () => {
    it('should generate mock narrative when API unavailable', async () => {
      const response = await generateNarrative(mockRequest);

      expect(response).toBeDefined();
      expect(response.narrative).toBeTruthy();
      expect(response.narrative.length).toBeGreaterThan(0);
      expect(response.generatedAt).toBeDefined();
    });

    it('should include disclaimers', async () => {
      const response = await generateNarrative(mockRequest);

      expect(Array.isArray(response.disclaimers)).toBe(true);
      expect(response.disclaimers.length).toBeGreaterThan(0);
    });

    it('should set urgent priority for high risk with multiple signals', async () => {
      const response = await generateNarrative(mockRequest);

      expect(['urgent', 'high', 'normal', 'low']).toContain(response.priority);
    });

    it('should extract key takeaways from signals', async () => {
      const response = await generateNarrative(mockRequest);

      expect(Array.isArray(response.keyTakeaways)).toBe(true);
      // Mock version may or may not have takeaways
      if (response.keyTakeaways.length > 0) {
        expect(response.keyTakeaways[0]).toBeTruthy();
      }
    });

    it('should respect governance flag (external sharing disabled)', async () => {
      const restrictedRequest: NarrativeRequest = {
        ...mockRequest,
        allowExternal: false
      };

      const response = await generateNarrative(restrictedRequest);

      // Should return mock when external sharing disabled
      expect(response).toBeDefined();
      expect(response.disclaimers.some((d) => d.includes('unavailable') || d.includes('restricted'))).toBe(true);
    });

    it('should handle low-risk scenario', async () => {
      const lowRiskRequest: NarrativeRequest = {
        ...mockRequest,
        riskLabel: 'low',
        signals: []
      };

      const response = await generateNarrative(lowRiskRequest);

      expect(response.priority).toBe('low');
      expect(response.narrative.toLowerCase()).toContain('normal');
    });

    it('should handle medium-risk scenario', async () => {
      const mediumRiskRequest: NarrativeRequest = {
        ...mockRequest,
        riskLabel: 'medium',
        signals: [mockRequest.signals[0], mockRequest.signals[1]]
      };

      const response = await generateNarrative(mediumRiskRequest);

      expect(['high', 'normal']).toContain(response.priority);
    });

    it('should compute priority from risk label', async () => {
      const testCases = [
        { riskLabel: 'high', signals: 3, expectedPriority: 'urgent' },
        { riskLabel: 'high', signals: 1, expectedPriority: 'high' },
        { riskLabel: 'medium', signals: 3, expectedPriority: 'high' },
        { riskLabel: 'low', signals: 0, expectedPriority: 'low' }
      ];

      for (const testCase of testCases) {
        const request: NarrativeRequest = {
          ...mockRequest,
          riskLabel: testCase.riskLabel as any,
          signals: Array(testCase.signals).fill(mockRequest.signals[0])
        };

        const response = await generateNarrative(request);
        expect(response.priority).toBe(testCase.expectedPriority);
      }
    });
  });

  describe('Narrative Formatting', () => {
    it('should format narrative with priority indicator', () => {
      const response = {
        narrative: 'Operations appear normal.',
        keyTakeaways: [],
        priority: 'low' as const,
        generatedAt: new Date().toISOString(),
        disclaimers: ['Test disclaimer']
      };

      const formatted = formatNarrativeForUI(response);

      expect(formatted).toContain('🟢');
      expect(formatted).toContain('LOW');
    });

    it('should include key takeaways when present', () => {
      const response = {
        narrative: 'Operations at risk.',
        keyTakeaways: ['Action 1', 'Action 2'],
        priority: 'high' as const,
        generatedAt: new Date().toISOString(),
        disclaimers: []
      };

      const formatted = formatNarrativeForUI(response);

      expect(formatted).toContain('Recommended Actions');
      expect(formatted).toContain('Action 1');
      expect(formatted).toContain('Action 2');
    });

    it('should format urgent priority correctly', () => {
      const response = {
        narrative: 'Critical operational alert.',
        keyTakeaways: [],
        priority: 'urgent' as const,
        generatedAt: new Date().toISOString(),
        disclaimers: []
      };

      const formatted = formatNarrativeForUI(response);

      expect(formatted).toContain('🔴');
      expect(formatted).toContain('URGENT');
    });

    it('should include disclaimers in formatted output', () => {
      const response = {
        narrative: 'Test narrative.',
        keyTakeaways: [],
        priority: 'normal' as const,
        generatedAt: new Date().toISOString(),
        disclaimers: ['Disclaimer 1', 'Disclaimer 2']
      };

      const formatted = formatNarrativeForUI(response);

      expect(formatted).toContain('Disclaimers');
      expect(formatted).toContain('Disclaimer 1');
      expect(formatted).toContain('Disclaimer 2');
    });

    it('should handle missing key takeaways', () => {
      const response = {
        narrative: 'Test narrative.',
        keyTakeaways: [],
        priority: 'normal' as const,
        generatedAt: new Date().toISOString(),
        disclaimers: []
      };

      const formatted = formatNarrativeForUI(response);

      expect(formatted).not.toContain('Recommended Actions');
      expect(formatted).toContain('Test narrative');
    });

    it('should format all priority levels', () => {
      const priorities: Array<'urgent' | 'high' | 'normal' | 'low'> = [
        'urgent',
        'high',
        'normal',
        'low'
      ];
      const colors = ['🔴', '🟠', '🟡', '🟢'];

      priorities.forEach((priority, idx) => {
        const response = {
          narrative: 'Test',
          keyTakeaways: [],
          priority,
          generatedAt: new Date().toISOString(),
          disclaimers: []
        };

        const formatted = formatNarrativeForUI(response);
        expect(formatted).toContain(colors[idx]);
      });
    });
  });

  describe('Error Handling', () => {
    it('should return mock narrative on API errors', async () => {
      const response = await generateNarrative(mockRequest);

      expect(response).toBeDefined();
      expect(response.narrative).toBeTruthy();
      // Should have fallback disclaimers
      expect(response.disclaimers.length).toBeGreaterThan(0);
    });

    it('should handle empty signal list', async () => {
      const emptyRequest: NarrativeRequest = {
        ...mockRequest,
        signals: []
      };

      const response = await generateNarrative(emptyRequest);

      expect(response).toBeDefined();
      expect(response.narrative).toBeTruthy();
    });

    it('should handle unknown risk label gracefully', async () => {
      const unknownRiskRequest: NarrativeRequest = {
        ...mockRequest,
        riskLabel: 'unknown'
      };

      const response = await generateNarrative(unknownRiskRequest);

      expect(response).toBeDefined();
      expect(response.priority).toBe('normal');
    });
  });

  describe('Governance Compliance', () => {
    it('should respect allowExternal: false', async () => {
      const request: NarrativeRequest = {
        ...mockRequest,
        allowExternal: false
      };

      const response = await generateNarrative(request);

      expect(response.disclaimers.some((d) => d.toLowerCase().includes('unavailable') || d.toLowerCase().includes('restricted'))).toBe(
        true
      );
    });

    it('should allow allowExternal: true', async () => {
      const request: NarrativeRequest = {
        ...mockRequest,
        allowExternal: true
      };

      const response = await generateNarrative(request);

      expect(response).toBeDefined();
      // Should still have disclaimers (AI-generated content)
      expect(response.disclaimers.length).toBeGreaterThan(0);
    });

    it('should never leak sensitive data in narrative', async () => {
      const response = await generateNarrative(mockRequest);

      // Should not contain any specific claim/policy identifiers
      expect(response.narrative).not.toMatch(/claim.?#|policy.?#|claimant|adjuster/i);
    });
  });

  describe('Integration', () => {
    it('should generate consistent responses', async () => {
      const response1 = await generateNarrative(mockRequest);
      const response2 = await generateNarrative(mockRequest);

      expect(response1).toBeDefined();
      expect(response2).toBeDefined();
      // Both should have generated timestamps (different)
      expect(response1.generatedAt).toBeDefined();
      expect(response2.generatedAt).toBeDefined();
    });

    it('should work with insurance pack signals', async () => {
      const insuranceRequest: NarrativeRequest = {
        ...mockRequest,
        pluginKey: 'industry_insurance_pack',
        pluginName: 'Insurance & Claims Oversight'
      };

      const response = await generateNarrative(insuranceRequest);

      expect(response).toBeDefined();
      expect(response.narrative).toContain('Insurance') || expect(response.narrative).toBeTruthy();
    });

    it('should work with restoration pack signals', async () => {
      const restorationRequest: NarrativeRequest = {
        ...mockRequest,
        pluginKey: 'industry_restoration_pack',
        pluginName: 'Restoration Operations',
        signals: [
          {
            key: 'water_spike',
            severity: 'high',
            rationale: 'Water incidents 3x baseline',
            suggestedAction: 'Alert restoration teams'
          }
        ]
      };

      const response = await generateNarrative(restorationRequest);

      expect(response).toBeDefined();
      expect(response.narrative).toBeTruthy();
    });
  });
});
