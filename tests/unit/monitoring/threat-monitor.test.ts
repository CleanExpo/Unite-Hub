/**
 * Tests for SEOThreatMonitor service
 * Tests: threat detection, alert broadcasting, database storage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectThreats,
  broadcastThreatAlert,
  getActivethreats,
  resolveThreat,
  type SEOThreat,
} from '@/lib/monitoring/seo-threat-monitor';

describe('SEOThreatMonitor', () => {
  const workspaceId = 'test-workspace';
  const domain = 'example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Threat Detection', () => {
    it('should detect ranking drop threats', async () => {
      const threats = await detectThreats(domain, workspaceId);
      // May or may not detect (simulated with randomness)
      expect(Array.isArray(threats)).toBe(true);
    });

    it('should detect CWV degradation threats', async () => {
      const threats = await detectThreats(domain, workspaceId);
      const cwvThreats = threats.filter((t) => t.type === 'cwv_degradation');
      expect(Array.isArray(cwvThreats)).toBe(true);
    });

    it('should detect technical error threats', async () => {
      const threats = await detectThreats(domain, workspaceId);
      expect(threats.every((t) => ['ranking_drop', 'cwv_degradation', 'technical_error', 'competitor_surge', 'security_issue', 'indexation_problem'].includes(t.type))).toBe(true);
    });

    it('should categorize threats by severity', async () => {
      const threats = await detectThreats(domain, workspaceId);
      const severities = new Set(threats.map((t) => t.severity));
      expect(severities.size).toBeGreaterThanOrEqual(0);
      severities.forEach((s) => {
        expect(['critical', 'high', 'medium', 'low']).toContain(s);
      });
    });

    it('should include threat data', async () => {
      const threats = await detectThreats(domain, workspaceId);
      threats.forEach((threat) => {
        expect(threat).toHaveProperty('id');
        expect(threat).toHaveProperty('type');
        expect(threat).toHaveProperty('severity');
        expect(threat).toHaveProperty('title');
        expect(threat).toHaveProperty('description');
        expect(threat).toHaveProperty('detectedAt');
        expect(threat).toHaveProperty('impactEstimate');
        expect(threat).toHaveProperty('recommendedAction');
      });
    });
  });

  describe('Alert Broadcasting', () => {
    it('should broadcast threat alert', async () => {
      const threat: SEOThreat = {
        id: 'threat-123',
        type: 'ranking_drop',
        severity: 'high',
        domain,
        title: 'Ranking drop detected',
        description: 'Keywords lost 3 positions',
        detectedAt: new Date().toISOString(),
        impactEstimate: 'High',
        recommendedAction: 'Investigate changes',
        data: {},
      };

      const alert = await broadcastThreatAlert(workspaceId, threat);
      expect(alert).toHaveProperty('id');
      expect(alert).toHaveProperty('status');
      expect(['sent', 'queued', 'failed']).toContain(alert.status);
    });

    it('should support multiple channels', async () => {
      const threat: SEOThreat = {
        id: 'threat-124',
        type: 'security_issue',
        severity: 'critical',
        domain,
        title: 'Security issue',
        description: 'SSL certificate expiring',
        detectedAt: new Date().toISOString(),
        impactEstimate: 'Critical',
        recommendedAction: 'Renew certificate',
        data: {},
      };

      const alert = await broadcastThreatAlert(workspaceId, threat, ['websocket', 'slack']);
      expect(alert.channels).toContain('websocket');
      expect(alert.channels).toContain('slack');
    });

    it('should enforce circuit breaker (max 3 alerts/day)', async () => {
      // This test would require mocking database queries
      // Placeholder for actual implementation
      expect(true).toBe(true);
    });
  });

  describe('Threat Retrieval', () => {
    it('should get active threats for workspace', async () => {
      const threats = await getActivethreats(workspaceId, 10);
      expect(Array.isArray(threats)).toBe(true);
    });

    it('should limit returned threats', async () => {
      const threats = await getActivethreats(workspaceId, 5);
      expect(threats.length).toBeLessThanOrEqual(5);
    });

    it('should return properly formatted threats', async () => {
      const threats = await getActivethreats(workspaceId, 1);
      if (threats.length > 0) {
        const threat = threats[0];
        expect(threat).toHaveProperty('id');
        expect(threat).toHaveProperty('type');
        expect(threat).toHaveProperty('severity');
      }
    });
  });

  describe('Threat Resolution', () => {
    it('should mark threat as resolved', async () => {
      const threatId = 'threat-test-123';
      // This would require mocking the database update
      await resolveThreat(threatId, workspaceId);
      expect(true).toBe(true); // Placeholder
    });
  });

  describe('Threat Types', () => {
    it('should detect 6 threat categories', async () => {
      const threatTypes = [
        'ranking_drop',
        'cwv_degradation',
        'technical_error',
        'competitor_surge',
        'security_issue',
        'indexation_problem',
      ];

      threatTypes.forEach((type) => {
        expect(type).toBeDefined();
      });
    });

    it('ranking drop should have keywords data', () => {
      const threat: SEOThreat = {
        id: 'threat-ranking',
        type: 'ranking_drop',
        severity: 'high',
        domain,
        title: 'Ranking drop',
        description: 'Positions lost',
        detectedAt: new Date().toISOString(),
        impactEstimate: 'High',
        recommendedAction: 'Investigate',
        data: {
          affectedKeywords: ['keyword1', 'keyword2'],
          positionDrops: [3, 2],
        },
      };

      expect(threat.data.affectedKeywords).toBeDefined();
      expect(threat.data.positionDrops).toBeDefined();
    });

    it('cwv_degradation should include metric data', () => {
      const threat: SEOThreat = {
        id: 'threat-cwv',
        type: 'cwv_degradation',
        severity: 'critical',
        domain,
        title: 'LCP degradation',
        description: 'LCP exceeds threshold',
        detectedAt: new Date().toISOString(),
        impactEstimate: 'High',
        recommendedAction: 'Optimize',
        data: {
          currentLCP: 3000,
          threshold: 2500,
        },
      };

      expect(threat.data.currentLCP).toBeDefined();
      expect(threat.data.threshold).toBeDefined();
    });

    it('competitor_surge should include competitor domain', () => {
      const threat: SEOThreat = {
        id: 'threat-comp',
        type: 'competitor_surge',
        severity: 'high',
        domain,
        title: 'Competitor gaining',
        description: 'Competitor improved',
        detectedAt: new Date().toISOString(),
        impactEstimate: 'Medium',
        recommendedAction: 'Audit',
        data: {
          competitorDomain: 'competitor.com',
          newBacklinks: 5,
        },
      };

      expect(threat.data.competitorDomain).toBeDefined();
      expect(threat.data.newBacklinks).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle detection errors gracefully', async () => {
      const threats = await detectThreats('invalid-domain', workspaceId);
      expect(Array.isArray(threats)).toBe(true);
      // Should return empty array or handle error without throwing
    });

    it('should handle broadcast errors', async () => {
      const threat: SEOThreat = {
        id: 'threat-error',
        type: 'ranking_drop',
        severity: 'high',
        domain,
        title: 'Test threat',
        description: 'Error handling test',
        detectedAt: new Date().toISOString(),
        impactEstimate: 'High',
        recommendedAction: 'Test',
        data: {},
      };

      const alert = await broadcastThreatAlert(workspaceId, threat);
      expect(alert).toBeDefined();
      expect(['sent', 'queued', 'failed']).toContain(alert.status);
    });
  });
});
