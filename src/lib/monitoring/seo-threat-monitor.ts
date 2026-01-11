/**
 * SEO Threat Monitor
 * Detects 6 threat types and broadcasts real-time alerts via WebSocket
 *
 * Threat Types:
 * 1. Ranking drops (>3 positions in 24h)
 * 2. CWV degradation (LCP >2.5s, CLS >0.1, INP >200ms)
 * 3. Technical errors (404s, broken schemas, HTTPS issues)
 * 4. Competitor surges (new backlinks, schema markup, ranking jumps)
 * 5. Security issues (malware detected, SSL certificate expiring)
 * 6. Indexation problems (blocked URLs, noindex tags, crawl errors)
 */

import { getSupabaseServer } from '@/lib/supabase';
import { callAnthropicWithRetry } from '@/lib/anthropic/rate-limiter';

export interface SEOThreat {
  id: string;
  type: 'ranking_drop' | 'cwv_degradation' | 'technical_error' | 'competitor_surge' | 'security_issue' | 'indexation_problem';
  severity: 'critical' | 'high' | 'medium' | 'low';
  domain: string;
  title: string;
  description: string;
  detectedAt: string;
  impactEstimate: string;
  recommendedAction: string;
  data: Record<string, unknown>;
}

export interface MonitoringSession {
  workspaceId: string;
  domain: string;
  active: boolean;
  lastCheckAt: string;
  nextCheckAt: string;
  threatsDetected: number;
  lastRankings: Record<string, number>; // keyword -> position
  lastCWVMetrics: {
    lcp: number;
    cls: number;
    inp: number;
  };
}

export interface AlertEvent {
  id: string;
  workspaceId: string;
  threatId: string;
  threat: SEOThreat;
  broadcastAt: string;
  channels: ('websocket' | 'slack' | 'email')[];
  status: 'sent' | 'failed' | 'queued';
}

/**
 * Start continuous monitoring for a domain
 * Runs every 6 hours, detects threats, broadcasts alerts
 */
export async function startContinuousMonitoring(
  workspaceId: string,
  domain: string
): Promise<MonitoringSession> {
  const supabase = getSupabaseServer();

  // Create monitoring session
  const now = new Date();
  const nextCheck = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours

  const { data: session, error } = await supabase
    .from('seo_threats')
    .insert({
      workspace_id: workspaceId,
      domain: domain,
      threat_type: 'monitoring_session',
      severity: 'low',
      title: 'Monitoring started',
      description: `Continuous monitoring active for ${domain}`,
      detected_at: now.toISOString(),
      last_check_at: now.toISOString(),
      next_check_at: nextCheck.toISOString(),
    })
    .select()
    .single();

  if (error || !session) {
    throw new Error(`Failed to create monitoring session: ${error?.message}`);
  }

  console.log(`[SEO Threat Monitor] Monitoring started for ${domain}`);

  return {
    workspaceId,
    domain,
    active: true,
    lastCheckAt: now.toISOString(),
    nextCheckAt: nextCheck.toISOString(),
    threatsDetected: 0,
    lastRankings: {},
    lastCWVMetrics: { lcp: 0, cls: 0, inp: 0 },
  };
}

/**
 * Execute threat detection for domain
 * Checks all 6 threat categories
 */
export async function detectThreats(
  domain: string,
  workspaceId: string
): Promise<SEOThreat[]> {
  const threats: SEOThreat[] = [];

  try {
    // Run all threat checks in parallel
    const [
      rankingThreats,
      cwvThreats,
      technicalThreats,
      competitorThreats,
      securityThreats,
      indexationThreats,
    ] = await Promise.all([
      detectRankingDrops(domain, workspaceId),
      detectCWVDegradation(domain, workspaceId),
      detectTechnicalErrors(domain, workspaceId),
      detectCompetitorSurges(domain, workspaceId),
      detectSecurityIssues(domain, workspaceId),
      detectIndexationProblems(domain, workspaceId),
    ]);

    threats.push(
      ...rankingThreats,
      ...cwvThreats,
      ...technicalThreats,
      ...competitorThreats,
      ...securityThreats,
      ...indexationThreats
    );

    // Store threats in database
    if (threats.length > 0) {
      await storeThreatsBatch(workspaceId, threats);
    }

    console.log(`[SEO Threat Monitor] Detected ${threats.length} threats for ${domain}`);
    return threats;
  } catch (error) {
    console.error(`[SEO Threat Monitor] Detection failed for ${domain}:`, error);
    return [];
  }
}

/**
 * Detect ranking position drops (>3 positions in 24 hours)
 */
async function detectRankingDrops(domain: string, workspaceId: string): Promise<SEOThreat[]> {
  const threats: SEOThreat[] = [];

  // In production: Compare current rankings with last 24h data from health_check_results
  // For now: Simulate ranking drop detection
  const simulatedDrop = Math.random() > 0.8; // 20% chance of detecting drop

  if (simulatedDrop) {
    threats.push({
      id: `threat-ranking-${Date.now()}`,
      type: 'ranking_drop',
      severity: 'high',
      domain,
      title: 'Ranking drop detected',
      description: 'Keywords lost 3-5 SERP positions in 24 hours',
      detectedAt: new Date().toISOString(),
      impactEstimate: 'High - 10-20% traffic loss expected',
      recommendedAction: 'Review recent changes, check for technical issues, analyze competitor activity',
      data: {
        affectedKeywords: ['target keyword 1', 'target keyword 2'],
        positionDrops: [3, 4, 2],
        previousAvgPosition: 8,
        currentAvgPosition: 12,
      },
    });
  }

  return threats;
}

/**
 * Detect Core Web Vitals degradation
 * LCP >2.5s, CLS >0.1, INP >200ms threshold breaches
 */
async function detectCWVDegradation(domain: string, workspaceId: string): Promise<SEOThreat[]> {
  const threats: SEOThreat[] = [];

  // In production: Fetch latest CWV from PageSpeed Insights or Web Vitals API
  // For now: Simulate CWV degradation
  const currentCWV = {
    lcp: 1500 + Math.random() * 2000, // 1.5-3.5 seconds
    cls: 0.05 + Math.random() * 0.15, // 0.05-0.2
    inp: 100 + Math.random() * 300, // 100-400ms
  };

  if (currentCWV.lcp > 2500) {
    threats.push({
      id: `threat-cwv-lcp-${Date.now()}`,
      type: 'cwv_degradation',
      severity: currentCWV.lcp > 4000 ? 'critical' : 'high',
      domain,
      title: 'LCP degradation detected',
      description: `Largest Contentful Paint increased to ${Math.round(currentCWV.lcp)}ms (threshold: 2500ms)`,
      detectedAt: new Date().toISOString(),
      impactEstimate: 'High - Ranking impact likely within 7 days',
      recommendedAction: 'Optimize largest page element, enable lazy loading, upgrade hosting',
      data: {
        currentLCP: Math.round(currentCWV.lcp),
        threshold: 2500,
        exceededBy: Math.round(currentCWV.lcp - 2500),
      },
    });
  }

  if (currentCWV.cls > 0.1) {
    threats.push({
      id: `threat-cwv-cls-${Date.now()}`,
      type: 'cwv_degradation',
      severity: currentCWV.cls > 0.25 ? 'critical' : 'medium',
      domain,
      title: 'CLS degradation detected',
      description: `Cumulative Layout Shift increased to ${currentCWV.cls.toFixed(3)} (threshold: 0.1)`,
      detectedAt: new Date().toISOString(),
      impactEstimate: 'Medium - Affects user experience and rankings',
      recommendedAction: 'Reserve space for dynamic content, optimize fonts, use transform for animations',
      data: {
        currentCLS: currentCWV.cls,
        threshold: 0.1,
      },
    });
  }

  if (currentCWV.inp > 200) {
    threats.push({
      id: `threat-cwv-inp-${Date.now()}`,
      type: 'cwv_degradation',
      severity: currentCWV.inp > 500 ? 'high' : 'medium',
      domain,
      title: 'INP degradation detected',
      description: `Interaction to Next Paint increased to ${Math.round(currentCWV.inp)}ms (threshold: 200ms)`,
      detectedAt: new Date().toISOString(),
      impactEstimate: 'Medium - Impacts user interactivity and Core Web Vitals score',
      recommendedAction: 'Break up long tasks, optimize event handlers, defer non-critical JavaScript',
      data: {
        currentINP: Math.round(currentCWV.inp),
        threshold: 200,
      },
    });
  }

  return threats;
}

/**
 * Detect technical SEO errors
 * 404s, broken schemas, HTTPS issues, crawl errors
 */
async function detectTechnicalErrors(domain: string, workspaceId: string): Promise<SEOThreat[]> {
  const threats: SEOThreat[] = [];

  // In production: Check URLs from sitemaps, validate schemas, verify HTTPS
  // For now: Simulate technical error detection
  const has404s = Math.random() > 0.7;
  const hasSSLIssue = Math.random() > 0.9;

  if (has404s) {
    threats.push({
      id: `threat-tech-404-${Date.now()}`,
      type: 'technical_error',
      severity: 'high',
      domain,
      title: '404 errors detected',
      description: '5+ 404 errors found in recent crawl (were previously returning 200)',
      detectedAt: new Date().toISOString(),
      impactEstimate: 'High - Broken links hurt crawlability and user experience',
      recommendedAction: 'Fix broken links, redirect to working pages, set up 404 monitoring',
      data: {
        count: 5,
        affectedPaths: ['/old-product', '/deprecated-page', '/test-page'],
      },
    });
  }

  if (hasSSLIssue) {
    threats.push({
      id: `threat-tech-ssl-${Date.now()}`,
      type: 'technical_error',
      severity: 'critical',
      domain,
      title: 'SSL certificate expiring',
      description: 'SSL certificate expires in 7 days',
      detectedAt: new Date().toISOString(),
      impactEstimate: 'Critical - Site will become inaccessible',
      recommendedAction: 'Renew SSL certificate immediately',
      data: {
        expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  }

  return threats;
}

/**
 * Detect competitor activity
 * New backlinks, schema markup adoption, ranking jumps
 */
async function detectCompetitorSurges(domain: string, workspaceId: string): Promise<SEOThreat[]> {
  const threats: SEOThreat[] = [];

  // In production: Compare competitor rankings/backlinks with historical data
  // For now: Simulate competitor surge detection
  const competitorSurge = Math.random() > 0.75;

  if (competitorSurge) {
    threats.push({
      id: `threat-comp-surge-${Date.now()}`,
      type: 'competitor_surge',
      severity: 'high',
      domain,
      title: 'Top competitor gaining advantage',
      description: 'competitor1.com gained 5 new referring domains and improved schema markup',
      detectedAt: new Date().toISOString(),
      impactEstimate: 'Medium - Competitor improving faster than you',
      recommendedAction: 'Audit competitor backlink strategy, implement missing schema types, increase content quality',
      data: {
        competitorDomain: 'competitor1.com',
        newBacklinks: 5,
        newSchemaTypes: ['FAQ', 'Reviews'],
      },
    });
  }

  return threats;
}

/**
 * Detect security threats
 * Malware, SSL issues, suspicious patterns
 */
async function detectSecurityIssues(domain: string, workspaceId: string): Promise<SEOThreat[]> {
  const threats: SEOThreat[] = [];

  // In production: Check against Google Safe Browsing, security headers, certificate status
  // For now: Return empty (low probability in demo)
  return threats;
}

/**
 * Detect indexation problems
 * Blocked URLs, noindex tags, crawl errors
 */
async function detectIndexationProblems(domain: string, workspaceId: string): Promise<SEOThreat[]> {
  const threats: SEOThreat[] = [];

  // In production: Query Google Search Console for indexation status
  // For now: Simulate crawl error detection
  const hasCrawlErrors = Math.random() > 0.85;

  if (hasCrawlErrors) {
    threats.push({
      id: `threat-index-crawl-${Date.now()}`,
      type: 'indexation_problem',
      severity: 'high',
      domain,
      title: 'Crawl errors detected',
      description: 'Googlebot unable to crawl 3 pages (timeout/connection errors)',
      detectedAt: new Date().toISOString(),
      impactEstimate: 'Medium - Pages not indexed due to crawl failures',
      recommendedAction: 'Fix server timeouts, check robots.txt, optimize crawl budget',
      data: {
        crawlErrors: 3,
        errorTypes: ['timeout', 'connection_timeout'],
        affectedPages: ['/product-page-1', '/blog/post-5'],
      },
    });
  }

  return threats;
}

/**
 * Store threats in database
 */
async function storeThreatsBatch(workspaceId: string, threats: SEOThreat[]): Promise<void> {
  const supabase = getSupabaseServer();

  const records = threats.map((threat) => ({
    workspace_id: workspaceId,
    domain: threat.domain,
    threat_type: threat.type,
    severity: threat.severity,
    title: threat.title,
    description: threat.description,
    detected_at: threat.detectedAt,
    impact_estimate: threat.impactEstimate,
    recommended_action: threat.recommendedAction,
    threat_data: threat.data,
  }));

  const { error } = await supabase.from('seo_threats').insert(records);

  if (error) {
    console.error('[SEO Threat Monitor] Failed to store threats:', error);
  }
}

/**
 * Broadcast alert via WebSocket + channels with circuit breaker
 * Prevents alert fatigue (max 3 alerts/day)
 */
export async function broadcastThreatAlert(
  workspaceId: string,
  threat: SEOThreat,
  channels: ('websocket' | 'slack' | 'email')[] = ['websocket']
): Promise<AlertEvent> {
  // Circuit breaker: Check daily alert count
  const supabase = getSupabaseServer();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: alertsToday } = await supabase
    .from('seo_threats')
    .select('id')
    .eq('workspace_id', workspaceId)
    .gte('detected_at', today.toISOString())
    .limit(3);

  const alertEvent: AlertEvent = {
    id: `alert-${Date.now()}`,
    workspaceId,
    threatId: threat.id,
    threat,
    broadcastAt: new Date().toISOString(),
    channels,
    status: 'queued',
  };

  // If circuit breaker hit (3+ alerts today), queue for manual review instead
  if ((alertsToday?.length ?? 0) >= 3) {
    console.log(`[SEO Threat Monitor] Circuit breaker: Max alerts/day reached. Queueing for review.`);
    alertEvent.status = 'queued';
    return alertEvent;
  }

  // Broadcast via channels
  try {
    for (const channel of channels) {
      if (channel === 'websocket') {
        await broadcastWebSocketAlert(workspaceId, threat);
      } else if (channel === 'slack') {
        // TODO: Implement Slack integration
        // await notifySlack(workspaceId, threat);
      } else if (channel === 'email') {
        // TODO: Implement email integration
        // await notifyEmail(workspaceId, threat);
      }
    }

    alertEvent.status = 'sent';
  } catch (error) {
    console.error(`[SEO Threat Monitor] Failed to broadcast alert:`, error);
    alertEvent.status = 'failed';
  }

  return alertEvent;
}

/**
 * Broadcast alert via WebSocket (real-time dashboard update)
 * Uses Ably for reliable real-time messaging
 */
async function broadcastWebSocketAlert(workspaceId: string, threat: SEOThreat): Promise<void> {
  try {
    // Dynamic import to avoid circular dependencies
    const { publishThreat } = await import('@/lib/realtime/ably-client');

    await publishThreat(workspaceId, threat);
    console.log(`[SEO Threat Monitor] Threat broadcast via Ably: ${threat.id}`);
  } catch (error) {
    console.error(`[SEO Threat Monitor] WebSocket broadcast failed:`, error);
    // Log error but don't fail - threat is already in database
  }

  // Trigger alert orchestration (Slack, email, webhooks)
  try {
    const { orchestrateAlert } = await import('@/lib/monitoring/alert-orchestrator');

    await orchestrateAlert({
      workspaceId,
      threat,
      dashboardUrl: `https://app.unite-hub.com/workspace/${workspaceId}/health-check`,
    });
  } catch (error) {
    console.error(`[SEO Threat Monitor] Alert orchestration failed:`, error);
    // Log error but don't fail - threat is still in database and WebSocket sent
  }
}

/**
 * Get active threats for workspace
 */
export async function getActivethreats(
  workspaceId: string,
  limit: number = 10
): Promise<SEOThreat[]> {
  const supabase = getSupabaseServer();

  const { data, error } = await supabase
    .from('seo_threats')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('detected_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[SEO Threat Monitor] Failed to fetch threats:', error);
    return [];
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    type: row.threat_type,
    severity: row.severity,
    domain: row.domain,
    title: row.title,
    description: row.description,
    detectedAt: row.detected_at,
    impactEstimate: row.impact_estimate,
    recommendedAction: row.recommended_action,
    data: row.threat_data || {},
  }));
}

/**
 * Resolve threat (mark as reviewed/fixed)
 */
export async function resolveThreat(threatId: string, workspaceId: string): Promise<void> {
  const supabase = getSupabaseServer();

  const { error } = await supabase
    .from('seo_threats')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', threatId)
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[SEO Threat Monitor] Failed to resolve threat:', error);
  }
}
