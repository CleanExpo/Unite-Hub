/**
 * Market Radar Engine Unit Tests
 *
 * Tests for pure/synchronous functions:
 * - Domain normalization and validation
 * - Watch plan limits
 * - Snapshot retention
 * - Alert severity determination
 * - Change detection between snapshots
 * - Market position calculation
 * - Competitor ranking
 */

import { describe, it, expect } from 'vitest';

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

import type { RadarSnapshot } from '@/lib/synthex/marketRadarEngine';

// ============================================================================
// Domain Normalization
// ============================================================================

describe('normalizeDomain', () => {
  it('should strip protocol', () => {
    expect(normalizeDomain('https://example.com')).toBe('example.com');
    expect(normalizeDomain('http://example.com')).toBe('example.com');
  });

  it('should strip www prefix', () => {
    expect(normalizeDomain('www.example.com')).toBe('example.com');
    expect(normalizeDomain('https://www.example.com')).toBe('example.com');
  });

  it('should strip trailing slashes', () => {
    expect(normalizeDomain('example.com/')).toBe('example.com');
    expect(normalizeDomain('https://example.com///')).toBe('example.com');
  });

  it('should lowercase', () => {
    expect(normalizeDomain('Example.COM')).toBe('example.com');
  });

  it('should trim whitespace', () => {
    expect(normalizeDomain('  example.com  ')).toBe('example.com');
  });

  it('should handle already clean domains', () => {
    expect(normalizeDomain('example.com')).toBe('example.com');
  });
});

describe('isValidDomain', () => {
  it('should accept valid domains', () => {
    expect(isValidDomain('example.com')).toBe(true);
    expect(isValidDomain('sub.example.com')).toBe(true);
    expect(isValidDomain('deep.sub.example.co.uk')).toBe(true);
    expect(isValidDomain('my-site.com')).toBe(true);
  });

  it('should reject invalid domains', () => {
    expect(isValidDomain('')).toBe(false);
    expect(isValidDomain('localhost')).toBe(false);
    expect(isValidDomain('not a domain')).toBe(false);
    expect(isValidDomain('-invalid.com')).toBe(false);
  });

  it('should normalize before validating', () => {
    expect(isValidDomain('https://www.example.com/')).toBe(true);
  });
});

// ============================================================================
// Plan Limits
// ============================================================================

describe('getMaxWatches', () => {
  it('should return correct limits per plan', () => {
    expect(getMaxWatches('launch')).toBe(3);
    expect(getMaxWatches('growth')).toBe(10);
    expect(getMaxWatches('scale')).toBe(-1); // unlimited
  });

  it('should return 0 for invalid plan', () => {
    expect(getMaxWatches('enterprise')).toBe(0);
    expect(getMaxWatches('')).toBe(0);
  });
});

describe('canAddWatch', () => {
  it('should allow adding when under limit', () => {
    expect(canAddWatch('launch', 0)).toBe(true);
    expect(canAddWatch('launch', 2)).toBe(true);
    expect(canAddWatch('growth', 5)).toBe(true);
  });

  it('should deny adding when at limit', () => {
    expect(canAddWatch('launch', 3)).toBe(false);
    expect(canAddWatch('growth', 10)).toBe(false);
  });

  it('should always allow for unlimited plans', () => {
    expect(canAddWatch('scale', 0)).toBe(true);
    expect(canAddWatch('scale', 100)).toBe(true);
    expect(canAddWatch('scale', 999)).toBe(true);
  });

  it('should deny for invalid plans (max 0)', () => {
    expect(canAddWatch('invalid', 0)).toBe(false);
  });
});

describe('getSnapshotRetention', () => {
  it('should return correct retention days', () => {
    expect(getSnapshotRetention('launch')).toBe(30);
    expect(getSnapshotRetention('growth')).toBe(90);
    expect(getSnapshotRetention('scale')).toBe(365);
  });

  it('should default to 30 days for invalid plan', () => {
    expect(getSnapshotRetention('invalid')).toBe(30);
  });
});

// ============================================================================
// Alert Severity
// ============================================================================

describe('determineAlertSeverity', () => {
  it('should classify authority changes', () => {
    expect(determineAlertSeverity('authority_change', 3)).toBe('info');
    expect(determineAlertSeverity('authority_change', 5)).toBe('info');
    expect(determineAlertSeverity('authority_change', 10)).toBe('warning');
    expect(determineAlertSeverity('authority_change', 20)).toBe('critical');
    expect(determineAlertSeverity('authority_change', -25)).toBe('critical');
  });

  it('should classify traffic changes', () => {
    expect(determineAlertSeverity('traffic_change_pct', 10)).toBe('info');
    expect(determineAlertSeverity('traffic_change_pct', 15)).toBe('info');
    expect(determineAlertSeverity('traffic_change_pct', 30)).toBe('warning');
    expect(determineAlertSeverity('traffic_change_pct', 55)).toBe('critical');
  });

  it('should classify keyword changes', () => {
    expect(determineAlertSeverity('keyword_change', 30)).toBe('info');
    expect(determineAlertSeverity('keyword_change', 50)).toBe('info');
    expect(determineAlertSeverity('keyword_change', 200)).toBe('warning');
    expect(determineAlertSeverity('keyword_change', 600)).toBe('critical');
  });

  it('should classify backlink changes', () => {
    expect(determineAlertSeverity('backlink_change', 50)).toBe('info');
    expect(determineAlertSeverity('backlink_change', 100)).toBe('info');
    expect(determineAlertSeverity('backlink_change', 500)).toBe('warning');
    expect(determineAlertSeverity('backlink_change', 3000)).toBe('critical');
  });

  it('should use absolute values for negative changes', () => {
    expect(determineAlertSeverity('authority_change', -20)).toBe('critical');
    expect(determineAlertSeverity('traffic_change_pct', -50)).toBe('critical');
  });
});

// ============================================================================
// Change Detection
// ============================================================================

function makeSnapshot(overrides: Partial<RadarSnapshot> = {}): RadarSnapshot {
  return {
    id: 'snap-1',
    tenant_id: 'tenant-1',
    watch_id: 'watch-1',
    domain: 'competitor.com',
    snapshot_type: 'seo',
    data: {},
    authority_score: 50,
    organic_keywords: 1000,
    estimated_traffic: 5000,
    backlinks: 2000,
    content_count: 100,
    social_followers: null,
    created_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('detectChanges', () => {
  it('should detect authority increase', () => {
    const prev = makeSnapshot({ authority_score: 50 });
    const curr = makeSnapshot({ authority_score: 65, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    expect(alerts.length).toBeGreaterThan(0);
    const authAlert = alerts.find(a => a.alertType === 'ranking_change' && a.title.includes('Authority'));
    expect(authAlert).toBeDefined();
    expect(authAlert!.title).toContain('increased');
    expect(authAlert!.severity).toBe('warning'); // delta 15
  });

  it('should detect authority decrease', () => {
    const prev = makeSnapshot({ authority_score: 70 });
    const curr = makeSnapshot({ authority_score: 45, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    const authAlert = alerts.find(a => a.title.includes('Authority'));
    expect(authAlert).toBeDefined();
    expect(authAlert!.title).toContain('decreased');
    expect(authAlert!.severity).toBe('critical'); // delta 25
  });

  it('should detect traffic spike', () => {
    const prev = makeSnapshot({ estimated_traffic: 5000 });
    const curr = makeSnapshot({ estimated_traffic: 10000, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    const trafficAlert = alerts.find(a => a.alertType === 'traffic_spike');
    expect(trafficAlert).toBeDefined();
    expect(trafficAlert!.title).toContain('surged');
    expect(trafficAlert!.severity).toBe('critical'); // 100% increase
  });

  it('should detect traffic drop', () => {
    const prev = makeSnapshot({ estimated_traffic: 10000 });
    const curr = makeSnapshot({ estimated_traffic: 5000, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    const trafficAlert = alerts.find(a => a.alertType === 'traffic_spike');
    expect(trafficAlert).toBeDefined();
    expect(trafficAlert!.title).toContain('dropped');
  });

  it('should detect keyword changes', () => {
    const prev = makeSnapshot({ organic_keywords: 1000 });
    const curr = makeSnapshot({ organic_keywords: 1300, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    const kwAlert = alerts.find(a => a.title.includes('keywords'));
    expect(kwAlert).toBeDefined();
    expect(kwAlert!.title).toContain('gained');
  });

  it('should detect backlink surge', () => {
    const prev = makeSnapshot({ backlinks: 2000 });
    const curr = makeSnapshot({ backlinks: 2600, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    const blAlert = alerts.find(a => a.alertType === 'backlink_surge');
    expect(blAlert).toBeDefined();
  });

  it('should detect new content', () => {
    const prev = makeSnapshot({ content_count: 100 });
    const curr = makeSnapshot({ content_count: 105, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    const contentAlert = alerts.find(a => a.alertType === 'new_content');
    expect(contentAlert).toBeDefined();
    expect(contentAlert!.title).toContain('5');
  });

  it('should return no alerts for minor changes', () => {
    const prev = makeSnapshot({ authority_score: 50, organic_keywords: 1000 });
    const curr = makeSnapshot({ authority_score: 52, organic_keywords: 1020, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    // Authority delta 2 < threshold 5, keyword delta 20 < threshold 50
    const authAlerts = alerts.filter(a => a.title.includes('Authority'));
    const kwAlerts = alerts.filter(a => a.title.includes('keywords'));
    expect(authAlerts.length).toBe(0);
    expect(kwAlerts.length).toBe(0);
  });

  it('should handle null values gracefully', () => {
    const prev = makeSnapshot({ authority_score: null, estimated_traffic: null });
    const curr = makeSnapshot({ authority_score: 50, estimated_traffic: 5000, id: 'snap-2' });
    const alerts = detectChanges(prev, curr);

    // Should not crash, null comparisons produce no alerts
    const authAlerts = alerts.filter(a => a.title.includes('Authority'));
    expect(authAlerts.length).toBe(0);
  });
});

// ============================================================================
// Market Position
// ============================================================================

describe('calculateMarketPosition', () => {
  it('should return 50 when equal to average', () => {
    expect(calculateMarketPosition(50, [50, 50, 50])).toBe(50);
  });

  it('should return higher score when above competitors', () => {
    const score = calculateMarketPosition(80, [40, 50, 30]);
    expect(score).toBeGreaterThan(50);
  });

  it('should return lower score when below competitors', () => {
    const score = calculateMarketPosition(20, [60, 70, 80]);
    expect(score).toBeLessThan(50);
  });

  it('should return 50 with no competitors', () => {
    expect(calculateMarketPosition(50, [])).toBe(50);
  });

  it('should cap at 100', () => {
    const score = calculateMarketPosition(100, [10]);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('should floor at 0', () => {
    const score = calculateMarketPosition(0, [80, 90]);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('should handle zero-authority competitors', () => {
    expect(calculateMarketPosition(50, [0, 0, 0])).toBe(100);
  });
});

// ============================================================================
// Competitor Ranking
// ============================================================================

describe('rankCompetitors', () => {
  it('should rank by composite score descending', () => {
    const snapshots: RadarSnapshot[] = [
      makeSnapshot({ watch_id: 'w1', domain: 'weak.com', authority_score: 20, organic_keywords: 100, estimated_traffic: 500, backlinks: 50 }),
      makeSnapshot({ watch_id: 'w2', domain: 'strong.com', authority_score: 80, organic_keywords: 5000, estimated_traffic: 50000, backlinks: 10000 }),
      makeSnapshot({ watch_id: 'w3', domain: 'mid.com', authority_score: 50, organic_keywords: 1000, estimated_traffic: 5000, backlinks: 1000 }),
    ];

    const ranked = rankCompetitors(snapshots);
    expect(ranked[0].domain).toBe('strong.com');
    expect(ranked[ranked.length - 1].domain).toBe('weak.com');
  });

  it('should handle empty input', () => {
    expect(rankCompetitors([])).toEqual([]);
  });

  it('should handle null scores', () => {
    const snapshots: RadarSnapshot[] = [
      makeSnapshot({ watch_id: 'w1', domain: 'null.com', authority_score: null, organic_keywords: null, estimated_traffic: null, backlinks: null }),
    ];

    const ranked = rankCompetitors(snapshots);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].score).toBe(0);
  });
});

// ============================================================================
// Constants
// ============================================================================

describe('Constants', () => {
  it('should define plan limits for all tiers', () => {
    expect(MAX_WATCHES_PER_PLAN).toHaveProperty('launch');
    expect(MAX_WATCHES_PER_PLAN).toHaveProperty('growth');
    expect(MAX_WATCHES_PER_PLAN).toHaveProperty('scale');
  });

  it('should define retention for all tiers', () => {
    expect(SNAPSHOT_RETENTION_DAYS.launch).toBeLessThan(SNAPSHOT_RETENTION_DAYS.growth);
    expect(SNAPSHOT_RETENTION_DAYS.growth).toBeLessThan(SNAPSHOT_RETENTION_DAYS.scale);
  });

  it('should define alert thresholds', () => {
    expect(ALERT_SEVERITY_THRESHOLDS.authority_change.info).toBeLessThan(
      ALERT_SEVERITY_THRESHOLDS.authority_change.warning
    );
    expect(ALERT_SEVERITY_THRESHOLDS.authority_change.warning).toBeLessThan(
      ALERT_SEVERITY_THRESHOLDS.authority_change.critical
    );
  });
});
