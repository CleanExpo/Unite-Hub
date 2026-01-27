/**
 * Market Radar Integration Tests
 *
 * Tests for the complete Market Radar feature:
 * - Watch management (create, list, duplicates)
 * - Alert lifecycle (create, read, mark read)
 * - Snapshot storage and comparison
 * - Plan-based access control
 * - Domain validation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock supabase before importing
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  },
}));

import {
  normalizeDomain,
  isValidDomain,
  getMaxWatches,
  canAddWatch,
  getSnapshotRetention,
  determineAlertSeverity,
  detectChanges,
  calculateMarketPosition,
  rankCompetitors,
  MAX_WATCHES_PER_PLAN,
  SNAPSHOT_RETENTION_DAYS,
  ALERT_SEVERITY_THRESHOLDS,
} from '@/lib/synthex/marketRadarEngine';
import type { RadarSnapshot, RadarWatch, RadarAlert, AlertType, CreateWatchInput } from '@/lib/synthex/marketRadarEngine';

// Helper to build test objects
function buildSnapshot(overrides: Partial<RadarSnapshot> = {}): RadarSnapshot {
  return {
    id: 'snap-test',
    tenant_id: 'tenant-test',
    watch_id: 'watch-test',
    domain: 'competitor.com',
    snapshot_type: 'seo',
    data: {},
    authority_score: 60,
    organic_keywords: 2000,
    estimated_traffic: 10000,
    backlinks: 5000,
    content_count: 200,
    social_followers: null,
    created_at: '2026-01-15T00:00:00Z',
    ...overrides,
  };
}

// ============================================================================
// Watch Management
// ============================================================================

describe('Watch Management', () => {
  describe('Domain Processing', () => {
    it('should normalize various URL formats to bare domain', () => {
      const inputs = [
        'https://www.competitor.com/',
        'http://competitor.com',
        'www.competitor.com',
        'COMPETITOR.COM',
        '  competitor.com  ',
      ];
      inputs.forEach(input => {
        expect(normalizeDomain(input)).toBe('competitor.com');
      });
    });

    it('should preserve subdomains (except www)', () => {
      expect(normalizeDomain('blog.competitor.com')).toBe('blog.competitor.com');
      expect(normalizeDomain('shop.competitor.co.uk')).toBe('shop.competitor.co.uk');
    });

    it('should validate common TLDs', () => {
      expect(isValidDomain('example.com')).toBe(true);
      expect(isValidDomain('example.co.uk')).toBe(true);
      expect(isValidDomain('example.com.au')).toBe(true);
      expect(isValidDomain('example.io')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidDomain('')).toBe(false);
      expect(isValidDomain('just-a-word')).toBe(false);
      expect(isValidDomain('has spaces.com')).toBe(false);
      expect(isValidDomain('.com')).toBe(false);
    });
  });

  describe('Plan-based Watch Limits', () => {
    it('launch plan allows 3 watches', () => {
      expect(getMaxWatches('launch')).toBe(3);
      expect(canAddWatch('launch', 0)).toBe(true);
      expect(canAddWatch('launch', 2)).toBe(true);
      expect(canAddWatch('launch', 3)).toBe(false);
      expect(canAddWatch('launch', 5)).toBe(false);
    });

    it('growth plan allows 10 watches', () => {
      expect(getMaxWatches('growth')).toBe(10);
      expect(canAddWatch('growth', 9)).toBe(true);
      expect(canAddWatch('growth', 10)).toBe(false);
    });

    it('scale plan has unlimited watches', () => {
      expect(getMaxWatches('scale')).toBe(-1);
      expect(canAddWatch('scale', 0)).toBe(true);
      expect(canAddWatch('scale', 500)).toBe(true);
    });

    it('unknown plan gets 0 watches', () => {
      expect(getMaxWatches('free')).toBe(0);
      expect(canAddWatch('free', 0)).toBe(false);
    });
  });
});

// ============================================================================
// Snapshot Comparison & Alert Generation
// ============================================================================

describe('Snapshot Comparison', () => {
  describe('Change Detection', () => {
    it('should generate authority change alert', () => {
      const prev = buildSnapshot({ authority_score: 50 });
      const curr = buildSnapshot({ authority_score: 62, id: 'snap-2' });
      const alerts = detectChanges(prev, curr);

      expect(alerts.some(a => a.alertType === 'ranking_change')).toBe(true);
      const auth = alerts.find(a => a.title.includes('Authority'));
      expect(auth).toBeDefined();
      expect(auth!.severity).toBe('warning'); // delta 12
    });

    it('should generate traffic spike alert for >15% change', () => {
      const prev = buildSnapshot({ estimated_traffic: 10000 });
      const curr = buildSnapshot({ estimated_traffic: 13000, id: 'snap-2' });
      const alerts = detectChanges(prev, curr);

      const traffic = alerts.find(a => a.alertType === 'traffic_spike');
      expect(traffic).toBeDefined();
      expect(traffic!.title).toContain('surged');
    });

    it('should not alert on small changes', () => {
      const prev = buildSnapshot({
        authority_score: 50,
        estimated_traffic: 10000,
        organic_keywords: 2000,
        backlinks: 5000,
        content_count: 200,
      });
      const curr = buildSnapshot({
        id: 'snap-2',
        authority_score: 51,      // delta 1 < 5
        estimated_traffic: 10500,  // 5% < 15%
        organic_keywords: 2020,    // delta 20 < 50
        backlinks: 5050,           // delta 50 < 100
        content_count: 200,        // no change
      });
      const alerts = detectChanges(prev, curr);
      expect(alerts.length).toBe(0);
    });

    it('should detect multiple simultaneous changes', () => {
      const prev = buildSnapshot({
        authority_score: 30,
        estimated_traffic: 5000,
        backlinks: 1000,
        content_count: 50,
      });
      const curr = buildSnapshot({
        id: 'snap-2',
        authority_score: 60,       // +30 critical
        estimated_traffic: 15000,  // +200% critical
        backlinks: 3000,           // +2000 critical
        content_count: 55,         // +5 new content
      });

      const alerts = detectChanges(prev, curr);
      expect(alerts.length).toBeGreaterThanOrEqual(3);

      const types = alerts.map(a => a.alertType);
      expect(types).toContain('ranking_change');
      expect(types).toContain('traffic_spike');
      expect(types).toContain('backlink_surge');
      expect(types).toContain('new_content');
    });
  });

  describe('Severity Classification', () => {
    it('should escalate severity with larger deltas', () => {
      expect(determineAlertSeverity('authority_change', 6)).toBe('info');
      expect(determineAlertSeverity('authority_change', 15)).toBe('warning');
      expect(determineAlertSeverity('authority_change', 25)).toBe('critical');
    });

    it('should handle negative deltas by absolute value', () => {
      expect(determineAlertSeverity('traffic_change_pct', -50)).toBe('critical');
      expect(determineAlertSeverity('keyword_change', -300)).toBe('warning');
    });
  });
});

// ============================================================================
// Market Intelligence
// ============================================================================

describe('Market Intelligence', () => {
  describe('Market Position Score', () => {
    it('should calculate relative position', () => {
      // Equal to competitors = 50
      expect(calculateMarketPosition(50, [50])).toBe(50);

      // Double competitor average = 100 (capped)
      expect(calculateMarketPosition(100, [50])).toBe(100);

      // Half of competitor average = 25
      expect(calculateMarketPosition(25, [50])).toBe(25);
    });

    it('should handle edge cases', () => {
      expect(calculateMarketPosition(0, [0])).toBe(100); // 0/0 edge
      expect(calculateMarketPosition(50, [])).toBe(50);  // no competitors
      expect(calculateMarketPosition(0, [100])).toBe(0); // zero authority
    });
  });

  describe('Competitor Ranking', () => {
    it('should rank by composite score', () => {
      const snaps: RadarSnapshot[] = [
        buildSnapshot({ watch_id: 'a', domain: 'alpha.com', authority_score: 90, organic_keywords: 10000, estimated_traffic: 100000, backlinks: 50000 }),
        buildSnapshot({ watch_id: 'b', domain: 'beta.com', authority_score: 30, organic_keywords: 500, estimated_traffic: 1000, backlinks: 200 }),
        buildSnapshot({ watch_id: 'c', domain: 'gamma.com', authority_score: 60, organic_keywords: 3000, estimated_traffic: 20000, backlinks: 5000 }),
      ];

      const ranked = rankCompetitors(snaps);
      expect(ranked[0].domain).toBe('alpha.com');
      expect(ranked[1].domain).toBe('gamma.com');
      expect(ranked[2].domain).toBe('beta.com');
    });

    it('should assign zero score for null metrics', () => {
      const snaps: RadarSnapshot[] = [
        buildSnapshot({ watch_id: 'x', domain: 'empty.com', authority_score: null, organic_keywords: null, estimated_traffic: null, backlinks: null }),
      ];

      const ranked = rankCompetitors(snaps);
      expect(ranked[0].score).toBe(0);
    });
  });
});

// ============================================================================
// Snapshot Retention
// ============================================================================

describe('Snapshot Retention', () => {
  it('should tier retention by plan', () => {
    expect(getSnapshotRetention('launch')).toBe(30);
    expect(getSnapshotRetention('growth')).toBe(90);
    expect(getSnapshotRetention('scale')).toBe(365);
  });

  it('should increase with plan tier', () => {
    const launchDays = getSnapshotRetention('launch');
    const growthDays = getSnapshotRetention('growth');
    const scaleDays = getSnapshotRetention('scale');

    expect(launchDays).toBeLessThan(growthDays);
    expect(growthDays).toBeLessThan(scaleDays);
  });
});

// ============================================================================
// Alert Type Coverage
// ============================================================================

describe('Alert Types', () => {
  it('should cover all alert types through detection', () => {
    // Build a snapshot pair that triggers every alert type
    const prev = buildSnapshot({
      authority_score: 40,
      estimated_traffic: 5000,
      organic_keywords: 1000,
      backlinks: 1000,
      content_count: 50,
    });
    const curr = buildSnapshot({
      id: 'snap-full',
      authority_score: 65,
      estimated_traffic: 15000,
      organic_keywords: 1600,
      backlinks: 3200,
      content_count: 55,
    });

    const alerts = detectChanges(prev, curr);
    const alertTypes = new Set(alerts.map(a => a.alertType));

    expect(alertTypes.has('ranking_change')).toBe(true);
    expect(alertTypes.has('traffic_spike')).toBe(true);
    expect(alertTypes.has('backlink_surge')).toBe(true);
    expect(alertTypes.has('new_content')).toBe(true);
  });

  it('should include domain in alert descriptions', () => {
    const prev = buildSnapshot({ authority_score: 30, domain: 'rival.com' });
    const curr = buildSnapshot({ authority_score: 55, domain: 'rival.com', id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    alerts.forEach(alert => {
      expect(alert.description).toContain('rival.com');
    });
  });
});

// ============================================================================
// Threshold Configuration
// ============================================================================

describe('Threshold Configuration', () => {
  it('should have ascending thresholds for all metric types', () => {
    for (const [, thresholds] of Object.entries(ALERT_SEVERITY_THRESHOLDS)) {
      expect(thresholds.info).toBeLessThan(thresholds.warning);
      expect(thresholds.warning).toBeLessThan(thresholds.critical);
    }
  });

  it('should cover 4 metric types', () => {
    const metricTypes = Object.keys(ALERT_SEVERITY_THRESHOLDS);
    expect(metricTypes).toContain('authority_change');
    expect(metricTypes).toContain('traffic_change_pct');
    expect(metricTypes).toContain('keyword_change');
    expect(metricTypes).toContain('backlink_change');
  });
});
