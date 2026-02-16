/**
 * Market Radar Engine
 *
 * Competitor monitoring, change detection, alert generation,
 * market position scoring, and ranking.
 */

// =============================================================
// Types
// =============================================================

export interface RadarSnapshot {
  id: string;
  tenant_id: string;
  watch_id: string;
  domain: string;
  snapshot_type: string;
  data: Record<string, any>;
  authority_score: number | null;
  organic_keywords: number | null;
  estimated_traffic: number | null;
  backlinks: number | null;
  content_count: number | null;
  social_followers: number | null;
  created_at: string;
}

export interface RadarWatch {
  id: string;
  tenant_id: string;
  domain: string;
  plan: string;
  is_active: boolean;
  created_at: string;
}

export type AlertType = 'ranking_change' | 'traffic_spike' | 'backlink_surge' | 'new_content';
export type AlertSeverity = 'info' | 'warning' | 'critical';

export interface RadarAlert {
  alertType: AlertType;
  title: string;
  description: string;
  severity: AlertSeverity;
  delta: number;
}

export interface CreateWatchInput {
  tenant_id: string;
  domain: string;
  plan: string;
}

export interface RankedCompetitor {
  domain: string;
  watch_id: string;
  score: number;
  authority_score: number | null;
  organic_keywords: number | null;
  estimated_traffic: number | null;
  backlinks: number | null;
}

// =============================================================
// Constants
// =============================================================

export const MAX_WATCHES_PER_PLAN: Record<string, number> = {
  launch: 3,
  growth: 10,
  scale: -1, // unlimited
};

export const SNAPSHOT_RETENTION_DAYS: Record<string, number> = {
  launch: 30,
  growth: 90,
  scale: 365,
};

export const ALERT_SEVERITY_THRESHOLDS: Record<string, { info: number; warning: number; critical: number }> = {
  authority_change: { info: 5, warning: 10, critical: 20 },
  traffic_change_pct: { info: 15, warning: 25, critical: 50 },
  keyword_change: { info: 50, warning: 100, critical: 500 },
  backlink_change: { info: 100, warning: 300, critical: 2000 },
};

// =============================================================
// Domain Functions
// =============================================================

export function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  // Strip protocol
  domain = domain.replace(/^https?:\/\//, '');
  // Strip www
  domain = domain.replace(/^www\./, '');
  // Strip trailing slashes
  domain = domain.replace(/\/+$/, '');
  return domain;
}

export function isValidDomain(input: string): boolean {
  const domain = normalizeDomain(input);
  if (!domain || domain.length === 0) return false;
  // Must have at least one dot, no spaces, not start/end with hyphen
  const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/;
  return domainRegex.test(domain);
}

// =============================================================
// Plan Limits
// =============================================================

export function getMaxWatches(plan: string): number {
  return MAX_WATCHES_PER_PLAN[plan] ?? 0;
}

export function canAddWatch(plan: string, currentCount: number): boolean {
  const max = getMaxWatches(plan);
  if (max === 0) return false;
  if (max === -1) return true; // unlimited
  return currentCount < max;
}

export function getSnapshotRetention(plan: string): number {
  return SNAPSHOT_RETENTION_DAYS[plan] ?? 30;
}

// =============================================================
// Alert Severity
// =============================================================

export function determineAlertSeverity(
  metricType: string,
  delta: number
): AlertSeverity {
  const absDelta = Math.abs(delta);
  const thresholds = ALERT_SEVERITY_THRESHOLDS[metricType];

  if (!thresholds) return 'info';

  if (absDelta >= thresholds.critical) return 'critical';
  if (absDelta >= thresholds.warning) return 'warning';
  if (absDelta >= thresholds.info) return 'info';

  return 'info';
}

// =============================================================
// Change Detection
// =============================================================

export function detectChanges(prev: RadarSnapshot, curr: RadarSnapshot): RadarAlert[] {
  const alerts: RadarAlert[] = [];

  // Authority change
  if (prev.authority_score != null && curr.authority_score != null) {
    const delta = curr.authority_score - prev.authority_score;
    if (Math.abs(delta) >= ALERT_SEVERITY_THRESHOLDS.authority_change.info) {
      const direction = delta > 0 ? 'increased' : 'decreased';
      alerts.push({
        alertType: 'ranking_change',
        title: `Authority ${direction} by ${Math.abs(delta)} for ${curr.domain}`,
        description: `${curr.domain} authority score ${direction} from ${prev.authority_score} to ${curr.authority_score} (delta: ${delta})`,
        severity: determineAlertSeverity('authority_change', delta),
        delta,
      });
    }
  }

  // Traffic change
  if (prev.estimated_traffic != null && curr.estimated_traffic != null && prev.estimated_traffic > 0) {
    const pctChange = ((curr.estimated_traffic - prev.estimated_traffic) / prev.estimated_traffic) * 100;
    if (Math.abs(pctChange) >= ALERT_SEVERITY_THRESHOLDS.traffic_change_pct.info) {
      const direction = pctChange > 0 ? 'surged' : 'dropped';
      alerts.push({
        alertType: 'traffic_spike',
        title: `Traffic ${direction} ${Math.abs(Math.round(pctChange))}% for ${curr.domain}`,
        description: `${curr.domain} estimated traffic ${direction} from ${prev.estimated_traffic} to ${curr.estimated_traffic} (${Math.round(pctChange)}%)`,
        severity: determineAlertSeverity('traffic_change_pct', pctChange),
        delta: pctChange,
      });
    }
  }

  // Keyword change
  if (prev.organic_keywords != null && curr.organic_keywords != null) {
    const delta = curr.organic_keywords - prev.organic_keywords;
    if (Math.abs(delta) >= ALERT_SEVERITY_THRESHOLDS.keyword_change.info) {
      const direction = delta > 0 ? 'gained' : 'lost';
      alerts.push({
        alertType: 'ranking_change',
        title: `${curr.domain} ${direction} ${Math.abs(delta)} keywords`,
        description: `${curr.domain} organic keywords changed from ${prev.organic_keywords} to ${curr.organic_keywords} (${direction} ${Math.abs(delta)})`,
        severity: determineAlertSeverity('keyword_change', delta),
        delta,
      });
    }
  }

  // Backlink change
  if (prev.backlinks != null && curr.backlinks != null) {
    const delta = curr.backlinks - prev.backlinks;
    if (Math.abs(delta) >= ALERT_SEVERITY_THRESHOLDS.backlink_change.info) {
      alerts.push({
        alertType: 'backlink_surge',
        title: `${curr.domain} backlinks changed by ${delta}`,
        description: `${curr.domain} backlinks changed from ${prev.backlinks} to ${curr.backlinks} (delta: ${delta})`,
        severity: determineAlertSeverity('backlink_change', delta),
        delta,
      });
    }
  }

  // New content
  if (prev.content_count != null && curr.content_count != null) {
    const delta = curr.content_count - prev.content_count;
    if (delta > 0) {
      alerts.push({
        alertType: 'new_content',
        title: `${curr.domain} published ${delta} new pages`,
        description: `${curr.domain} content count increased from ${prev.content_count} to ${curr.content_count} (+${delta} pages)`,
        severity: 'info',
        delta,
      });
    }
  }

  return alerts;
}

// =============================================================
// Market Position
// =============================================================

export function calculateMarketPosition(myScore: number, competitorScores: number[]): number {
  if (competitorScores.length === 0) return 50;

  const avgCompetitor = competitorScores.reduce((a, b) => a + b, 0) / competitorScores.length;

  if (avgCompetitor === 0) {
    return myScore === 0 ? 100 : 100;
  }

  const position = (myScore / avgCompetitor) * 50;
  return Math.max(0, Math.min(100, Math.round(position)));
}

// =============================================================
// Competitor Ranking
// =============================================================

export function rankCompetitors(snapshots: RadarSnapshot[]): RankedCompetitor[] {
  const ranked = snapshots.map(snap => {
    const authority = snap.authority_score ?? 0;
    const keywords = snap.organic_keywords ?? 0;
    const traffic = snap.estimated_traffic ?? 0;
    const backlinks = snap.backlinks ?? 0;

    // Composite score: weighted combination
    const score = authority * 0.3 + (keywords / 100) * 0.2 + (traffic / 1000) * 0.3 + (backlinks / 1000) * 0.2;

    return {
      domain: snap.domain,
      watch_id: snap.watch_id,
      score: Math.round(score * 100) / 100,
      authority_score: snap.authority_score,
      organic_keywords: snap.organic_keywords,
      estimated_traffic: snap.estimated_traffic,
      backlinks: snap.backlinks,
    };
  });

  // Sort descending by score
  ranked.sort((a, b) => b.score - a.score);

  return ranked;
}
