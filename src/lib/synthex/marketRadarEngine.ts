/**
 * Market Radar Engine
 *
 * Competitor monitoring and market intelligence for Synthex tenants.
 * Integrates with the SEO Intelligence Engine for domain analysis.
 *
 * Features:
 * - Competitor watch management (add/remove/pause domains)
 * - Periodic snapshot collection (SEO metrics, content, social)
 * - Alert generation on significant changes
 * - Competitive summary and insights via Claude AI
 */

import { Anthropic } from '@anthropic-ai/sdk';

// ============================================================================
// TYPES
// ============================================================================

export interface RadarWatch {
  id: string;
  tenant_id: string;
  domain: string;
  display_name: string | null;
  industry: string | null;
  monitor_seo: boolean;
  monitor_content: boolean;
  monitor_social: boolean;
  monitor_pricing: boolean;
  check_frequency: 'daily' | 'weekly' | 'monthly';
  status: 'active' | 'paused' | 'removed';
  last_checked_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface RadarSnapshot {
  id: string;
  tenant_id: string;
  watch_id: string;
  domain: string;
  snapshot_type: 'seo' | 'content' | 'social' | 'pricing' | 'full';
  data: Record<string, unknown>;
  authority_score: number | null;
  organic_keywords: number | null;
  estimated_traffic: number | null;
  backlinks: number | null;
  content_count: number | null;
  social_followers: number | null;
  created_at: string;
}

export interface RadarAlert {
  id: string;
  tenant_id: string;
  watch_id: string;
  alert_type: AlertType;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string | null;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
}

export type AlertType =
  | 'ranking_change'
  | 'new_content'
  | 'traffic_spike'
  | 'backlink_surge'
  | 'price_change';

export interface CompetitorInsight {
  domain: string;
  displayName: string;
  authorityScore: number;
  organicKeywords: number;
  estimatedTraffic: number;
  backlinks: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  recentChanges: string[];
}

export interface MarketRadarSummary {
  totalWatches: number;
  activeWatches: number;
  unreadAlerts: number;
  topCompetitor: string | null;
  avgAuthorityScore: number;
  insights: string[];
}

export interface CreateWatchInput {
  domain: string;
  displayName?: string;
  industry?: string;
  monitorSeo?: boolean;
  monitorContent?: boolean;
  monitorSocial?: boolean;
  monitorPricing?: boolean;
  checkFrequency?: 'daily' | 'weekly' | 'monthly';
  notes?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ALERT_SEVERITY_THRESHOLDS = {
  authority_change: { info: 5, warning: 10, critical: 20 },
  traffic_change_pct: { info: 15, warning: 30, critical: 50 },
  keyword_change: { info: 50, warning: 200, critical: 500 },
  backlink_change: { info: 100, warning: 500, critical: 2000 },
} as const;

export const MAX_WATCHES_PER_PLAN: Record<string, number> = {
  launch: 3,
  growth: 10,
  scale: -1, // Unlimited
};

export const SNAPSHOT_RETENTION_DAYS: Record<string, number> = {
  launch: 30,
  growth: 90,
  scale: 365,
};

// ============================================================================
// PURE FUNCTIONS (testable without DB)
// ============================================================================

/**
 * Get maximum watches allowed for a plan
 */
export function getMaxWatches(planCode: string): number {
  return MAX_WATCHES_PER_PLAN[planCode] ?? 0;
}

/**
 * Check if tenant can add more watches
 */
export function canAddWatch(planCode: string, currentCount: number): boolean {
  const max = getMaxWatches(planCode);
  if (max === -1) return true; // Unlimited
  return currentCount < max;
}

/**
 * Get snapshot retention period in days
 */
export function getSnapshotRetention(planCode: string): number {
  return SNAPSHOT_RETENTION_DAYS[planCode] ?? 30;
}

/**
 * Normalize domain (strip protocol, www, trailing slash)
 */
export function normalizeDomain(input: string): string {
  let domain = input.trim().toLowerCase();
  domain = domain.replace(/^https?:\/\//, '');
  domain = domain.replace(/^www\./, '');
  domain = domain.replace(/\/+$/, '');
  return domain;
}

/**
 * Validate domain format
 */
export function isValidDomain(domain: string): boolean {
  const normalized = normalizeDomain(domain);
  return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(normalized);
}

/**
 * Determine alert severity based on metric delta
 */
export function determineAlertSeverity(
  metricType: keyof typeof ALERT_SEVERITY_THRESHOLDS,
  delta: number
): 'info' | 'warning' | 'critical' {
  const thresholds = ALERT_SEVERITY_THRESHOLDS[metricType];
  const absDelta = Math.abs(delta);
  if (absDelta >= thresholds.critical) return 'critical';
  if (absDelta >= thresholds.warning) return 'warning';
  return 'info';
}

/**
 * Compare two snapshots and generate change alerts
 */
export function detectChanges(
  prev: RadarSnapshot,
  current: RadarSnapshot
): Array<{ alertType: AlertType; severity: 'info' | 'warning' | 'critical'; title: string; description: string }> {
  const alerts: Array<{ alertType: AlertType; severity: 'info' | 'warning' | 'critical'; title: string; description: string }> = [];

  // Authority change
  if (prev.authority_score != null && current.authority_score != null) {
    const delta = current.authority_score - prev.authority_score;
    if (Math.abs(delta) >= ALERT_SEVERITY_THRESHOLDS.authority_change.info) {
      const direction = delta > 0 ? 'increased' : 'decreased';
      alerts.push({
        alertType: 'ranking_change',
        severity: determineAlertSeverity('authority_change', delta),
        title: `Authority ${direction} by ${Math.abs(delta)} pts`,
        description: `${current.domain} authority ${direction} from ${prev.authority_score} to ${current.authority_score}`,
      });
    }
  }

  // Traffic change
  if (prev.estimated_traffic != null && current.estimated_traffic != null && prev.estimated_traffic > 0) {
    const pctChange = ((current.estimated_traffic - prev.estimated_traffic) / prev.estimated_traffic) * 100;
    if (Math.abs(pctChange) >= ALERT_SEVERITY_THRESHOLDS.traffic_change_pct.info) {
      const direction = pctChange > 0 ? 'surged' : 'dropped';
      alerts.push({
        alertType: 'traffic_spike',
        severity: determineAlertSeverity('traffic_change_pct', pctChange),
        title: `Traffic ${direction} ${Math.abs(Math.round(pctChange))}%`,
        description: `${current.domain} traffic ${direction} from ${prev.estimated_traffic.toLocaleString()} to ${current.estimated_traffic.toLocaleString()}`,
      });
    }
  }

  // Keyword change
  if (prev.organic_keywords != null && current.organic_keywords != null) {
    const delta = current.organic_keywords - prev.organic_keywords;
    if (Math.abs(delta) >= ALERT_SEVERITY_THRESHOLDS.keyword_change.info) {
      const direction = delta > 0 ? 'gained' : 'lost';
      alerts.push({
        alertType: 'ranking_change',
        severity: determineAlertSeverity('keyword_change', delta),
        title: `${direction} ${Math.abs(delta)} organic keywords`,
        description: `${current.domain} ${direction} keywords: ${prev.organic_keywords.toLocaleString()} -> ${current.organic_keywords.toLocaleString()}`,
      });
    }
  }

  // Backlink change
  if (prev.backlinks != null && current.backlinks != null) {
    const delta = current.backlinks - prev.backlinks;
    if (Math.abs(delta) >= ALERT_SEVERITY_THRESHOLDS.backlink_change.info) {
      const direction = delta > 0 ? 'gained' : 'lost';
      alerts.push({
        alertType: 'backlink_surge',
        severity: determineAlertSeverity('backlink_change', delta),
        title: `Backlinks ${direction}: ${Math.abs(delta).toLocaleString()}`,
        description: `${current.domain} ${direction} backlinks: ${prev.backlinks.toLocaleString()} -> ${current.backlinks.toLocaleString()}`,
      });
    }
  }

  // Content change
  if (prev.content_count != null && current.content_count != null) {
    const delta = current.content_count - prev.content_count;
    if (delta > 0) {
      alerts.push({
        alertType: 'new_content',
        severity: 'info',
        title: `${delta} new content pieces published`,
        description: `${current.domain} published ${delta} new content items since last check`,
      });
    }
  }

  return alerts;
}

/**
 * Calculate market position score (0-100) relative to competitors
 */
export function calculateMarketPosition(
  yourAuthority: number,
  competitorAuthorities: number[]
): number {
  if (competitorAuthorities.length === 0) return 50;
  const avgCompetitor = competitorAuthorities.reduce((a, b) => a + b, 0) / competitorAuthorities.length;
  if (avgCompetitor === 0) return 100;
  const ratio = yourAuthority / avgCompetitor;
  return Math.min(100, Math.max(0, Math.round(ratio * 50)));
}

/**
 * Rank competitors by overall strength
 */
export function rankCompetitors(
  snapshots: RadarSnapshot[]
): Array<{ domain: string; score: number; watchId: string }> {
  return snapshots
    .map(s => ({
      domain: s.domain,
      watchId: s.watch_id,
      score:
        (s.authority_score ?? 0) * 0.4 +
        Math.min(100, (s.organic_keywords ?? 0) / 100) * 0.3 +
        Math.min(100, (s.estimated_traffic ?? 0) / 1000) * 0.2 +
        Math.min(100, (s.backlinks ?? 0) / 500) * 0.1,
    }))
    .sort((a, b) => b.score - a.score);
}

// ============================================================================
// AI-POWERED ANALYSIS (requires Anthropic)
// ============================================================================

let anthropicClient: Anthropic | null = null;
let anthropicTimestamp = 0;
const CLIENT_TTL = 60000;

function getAnthropicClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - anthropicTimestamp > CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    anthropicTimestamp = now;
  }
  return anthropicClient;
}

/**
 * Generate competitive intelligence report via AI
 */
export async function generateCompetitiveInsight(
  yourDomain: string,
  competitors: Array<{ domain: string; authority: number; traffic: number; keywords: number }>
): Promise<CompetitorInsight[]> {
  const client = getAnthropicClient();

  const prompt = `Analyze competitive landscape for "${yourDomain}" against these competitors:

${competitors.map(c => `- ${c.domain}: Authority ${c.authority}, Traffic ~${c.traffic.toLocaleString()}, Keywords ${c.keywords.toLocaleString()}`).join('\n')}

For EACH competitor, provide:
1. Their key strengths (2-3 items)
2. Their weaknesses relative to ${yourDomain} (2-3 items)
3. Opportunities for ${yourDomain} (2-3 items)
4. Notable recent market trends

Format as JSON array:
[{
  "domain": "...",
  "strengths": ["..."],
  "weaknesses": ["..."],
  "opportunities": ["..."],
  "recentChanges": ["..."]
}]`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5-20250929',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type');

  const jsonMatch = content.text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Could not parse competitive insight');

  const parsed = JSON.parse(jsonMatch[0]) as Array<{
    domain: string;
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    recentChanges: string[];
  }>;

  return parsed.map((item, i) => ({
    domain: item.domain,
    displayName: competitors[i]?.domain || item.domain,
    authorityScore: competitors[i]?.authority ?? 0,
    organicKeywords: competitors[i]?.keywords ?? 0,
    estimatedTraffic: competitors[i]?.traffic ?? 0,
    backlinks: 0,
    strengths: item.strengths,
    weaknesses: item.weaknesses,
    opportunities: item.opportunities,
    recentChanges: item.recentChanges,
  }));
}

/**
 * Generate market radar summary with AI insights
 */
export async function generateMarketSummary(
  yourDomain: string,
  watches: RadarWatch[],
  latestSnapshots: RadarSnapshot[],
  unreadAlertCount: number
): Promise<MarketRadarSummary> {
  const activeWatches = watches.filter(w => w.status === 'active');
  const ranked = rankCompetitors(latestSnapshots);
  const avgAuth = latestSnapshots.length > 0
    ? Math.round(latestSnapshots.reduce((sum, s) => sum + (s.authority_score ?? 0), 0) / latestSnapshots.length)
    : 0;

  // Generate AI insights if there's meaningful data
  let insights: string[] = [];
  if (latestSnapshots.length > 0) {
    try {
      const client = getAnthropicClient();
      const snapshotSummary = latestSnapshots.map(s =>
        `${s.domain}: Authority ${s.authority_score ?? '?'}, Traffic ~${s.estimated_traffic ?? '?'}, Keywords ${s.organic_keywords ?? '?'}`
      ).join('\n');

      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: `Give 3 brief competitive insights for "${yourDomain}" based on competitors:\n${snapshotSummary}\n\nFormat: JSON array of 3 strings, each under 100 chars.`,
        }],
      });

      const text = response.content[0];
      if (text.type === 'text') {
        const match = text.text.match(/\[[\s\S]*\]/);
        if (match) insights = JSON.parse(match[0]);
      }
    } catch {
      insights = ['Monitor competitors regularly for best results'];
    }
  }

  return {
    totalWatches: watches.length,
    activeWatches: activeWatches.length,
    unreadAlerts: unreadAlertCount,
    topCompetitor: ranked[0]?.domain ?? null,
    avgAuthorityScore: avgAuth,
    insights,
  };
}
