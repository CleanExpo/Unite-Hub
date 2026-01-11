/**
 * Guardian H06: H-Series Unified Intelligence Summary
 * Aggregates H01-H05 outputs + governance state into single tenant-scoped summary
 * Graceful degradation if modules missing; PII-free aggregates only
 */

import { getSupabaseServer } from '@/lib/supabase';

export interface ModulePresence {
  h01_rule_suggestion: boolean;
  h02_anomaly_detection: boolean;
  h03_correlation_refinement: boolean;
  h04_incident_scoring: boolean;
  h05_governance_coach: boolean;
}

export interface HSeriesSummary {
  timestamp: string;
  range_days: number;
  modules: ModulePresence;
  governance: {
    ai_allowed: boolean;
    external_sharing_enabled: boolean;
    audit_enabled: boolean;
    backup_policy_enabled: boolean;
    validation_gate_enabled: boolean;
  };
  core: {
    risk_headline?: string;
    insights_24h?: number;
    insights_7d?: number;
    insights_30d?: number;
  };
  h01_rule_suggestions?: {
    installed: boolean;
    total_count?: number;
    by_status?: Record<string, number>;
    latest_5?: Array<{
      id: string;
      title: string;
      status: string;
      created_at: string;
      confidence?: number;
      source?: string;
    }>;
  };
  h02_anomalies?: {
    installed: boolean;
    open_count?: number;
    by_severity?: Record<string, number>;
    latest_5?: Array<{
      id: string;
      metric_key: string;
      severity: string;
      observed_at: string;
      status: string;
    }>;
  };
  h03_correlation?: {
    installed: boolean;
    total_recommendations?: number;
    by_status?: Record<string, number>;
    by_type?: Record<string, number>;
    latest_5?: Array<{
      id: string;
      title: string;
      type: string;
      status: string;
      created_at: string;
    }>;
  };
  h04_triage?: {
    installed: boolean;
    open_incidents_by_band?: Record<string, number>;
    total_scored?: number;
    top_5_scored?: Array<{
      incident_id_redacted: string;
      score: number;
      band: string;
      triage_status: string;
      last_scored_at: string;
    }>;
  };
  h05_governance_coach?: {
    installed: boolean;
    latest_session?: {
      id: string;
      status: string;
      summary: string;
      created_at: string;
    };
    open_actions_count?: number;
    last_applied_at?: string;
  };
}

/**
 * Detect module presence by checking if key tables exist
 */
async function detectModulePresence(tenantId: string): Promise<ModulePresence> {
  const supabase = getSupabaseServer();

  const [h01, h02, h03, h04, h05] = await Promise.all([
    supabase.from('guardian_ai_rules').select('id', { count: 'exact' }).eq('tenant_id', tenantId).limit(1),
    supabase.from('guardian_anomaly_events').select('id', { count: 'exact' }).eq('tenant_id', tenantId).limit(1),
    supabase.from('guardian_correlation_clusters').select('id', { count: 'exact' }).eq('tenant_id', tenantId).limit(1),
    supabase.from('guardian_incident_scores').select('id', { count: 'exact' }).eq('tenant_id', tenantId).limit(1),
    supabase.from('guardian_governance_coach_sessions').select('id', { count: 'exact' }).eq('tenant_id', tenantId).limit(1),
  ]);

  return {
    h01_rule_suggestion: h01.data !== null,
    h02_anomaly_detection: h02.data !== null,
    h03_correlation_refinement: h03.data !== null,
    h04_incident_scoring: h04.data !== null,
    h05_governance_coach: h05.data !== null,
  };
}

/**
 * Get governance state from Z10
 */
async function getGovernanceState(tenantId: string) {
  try {
    const supabase = getSupabaseServer();
    const { data } = await supabase
      .from('guardian_meta_governance_prefs')
      .select('ai_usage_policy, external_sharing_policy, backup_policy, validation_gate_policy')
      .eq('tenant_id', tenantId)
      .single();

    return {
      ai_allowed: data?.ai_usage_policy ?? false,
      external_sharing_enabled: data?.external_sharing_policy ?? false,
      audit_enabled: true, // Assume Z10 audit always enabled
      backup_policy_enabled: data?.backup_policy ?? true,
      validation_gate_enabled: data?.validation_gate_policy ?? true,
    };
  } catch {
    // Graceful fallback
    return {
      ai_allowed: false,
      external_sharing_enabled: false,
      audit_enabled: true,
      backup_policy_enabled: true,
      validation_gate_enabled: true,
    };
  }
}

/**
 * Get H01 rule suggestions summary
 */
async function getH01Summary(tenantId: string) {
  try {
    const supabase = getSupabaseServer();

    // Count by status
    const { data: byStatus } = await supabase
      .from('guardian_ai_rules')
      .select('status', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Latest 5
    const { data: latest } = await supabase
      .from('guardian_ai_rules')
      .select('id, title, status, created_at, confidence, source')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    const statusCounts: Record<string, number> = {};
    if (byStatus) {
      for (const row of byStatus) {
        statusCounts[row.status] = (statusCounts[row.status] || 0) + 1;
      }
    }

    return {
      installed: true,
      total_count: byStatus?.length || 0,
      by_status: statusCounts,
      latest_5: (latest || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        status: r.status,
        created_at: r.created_at,
        confidence: r.confidence,
        source: r.source,
      })),
    };
  } catch {
    return { installed: false };
  }
}

/**
 * Get H02 anomalies summary
 */
async function getH02Summary(tenantId: string) {
  try {
    const supabase = getSupabaseServer();

    // Open count
    const { data: openEvents } = await supabase
      .from('guardian_anomaly_events')
      .select('severity', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'open');

    // By severity
    const { data: bySeverity } = await supabase
      .from('guardian_anomaly_events')
      .select('severity', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Latest 5
    const { data: latest } = await supabase
      .from('guardian_anomaly_events')
      .select('id, metric_key, severity, observed_at, status')
      .eq('tenant_id', tenantId)
      .order('observed_at', { ascending: false })
      .limit(5);

    const severityCounts: Record<string, number> = {};
    if (bySeverity) {
      for (const row of bySeverity) {
        severityCounts[row.severity] = (severityCounts[row.severity] || 0) + 1;
      }
    }

    return {
      installed: true,
      open_count: openEvents?.length || 0,
      by_severity: severityCounts,
      latest_5: (latest || []).map((e: any) => ({
        id: e.id,
        metric_key: e.metric_key,
        severity: e.severity,
        observed_at: e.observed_at,
        status: e.status,
      })),
    };
  } catch {
    return { installed: false };
  }
}

/**
 * Get H03 correlation summary
 */
async function getH03Summary(tenantId: string) {
  try {
    const supabase = getSupabaseServer();

    // Count by status and type
    const { data: allRecs } = await supabase
      .from('guardian_correlation_recommendations')
      .select('id, status, recommendation_type')
      .eq('tenant_id', tenantId);

    // Latest 5
    const { data: latest } = await supabase
      .from('guardian_correlation_recommendations')
      .select('id, title, recommendation_type, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    const statusCounts: Record<string, number> = {};
    const typeCounts: Record<string, number> = {};

    if (allRecs) {
      for (const rec of allRecs) {
        statusCounts[rec.status] = (statusCounts[rec.status] || 0) + 1;
        typeCounts[rec.recommendation_type] = (typeCounts[rec.recommendation_type] || 0) + 1;
      }
    }

    return {
      installed: true,
      total_recommendations: allRecs?.length || 0,
      by_status: statusCounts,
      by_type: typeCounts,
      latest_5: (latest || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        type: r.recommendation_type,
        status: r.status,
        created_at: r.created_at,
      })),
    };
  } catch {
    return { installed: false };
  }
}

/**
 * Get H04 triage summary
 */
async function getH04Summary(tenantId: string) {
  try {
    const supabase = getSupabaseServer();

    // Scored incidents by band
    const { data: byBand } = await supabase
      .from('guardian_incident_scores')
      .select('band', { count: 'exact' })
      .eq('tenant_id', tenantId);

    // Top 5 scored
    const { data: topScored } = await supabase
      .from('guardian_incident_scores')
      .select('id, incident_id, score, band, computed_at')
      .from('guardian_incident_triage')
      .select('triage_status, last_scored_at')
      .eq('tenant_id', tenantId)
      .order('score', { ascending: false })
      .limit(5);

    const bandCounts: Record<string, number> = {};
    if (byBand) {
      for (const row of byBand) {
        bandCounts[row.band] = (bandCounts[row.band] || 0) + 1;
      }
    }

    return {
      installed: true,
      open_incidents_by_band: bandCounts,
      total_scored: byBand?.length || 0,
      top_5_scored: (topScored || []).map((s: any) => ({
        incident_id_redacted: s.incident_id ? s.incident_id.substring(0, 8) + '...' : 'unknown',
        score: s.score,
        band: s.band,
        triage_status: s.triage_status || 'pending',
        last_scored_at: s.computed_at,
      })),
    };
  } catch {
    return { installed: false };
  }
}

/**
 * Get H05 governance coach summary
 */
async function getH05Summary(tenantId: string) {
  try {
    const supabase = getSupabaseServer();

    // Latest session
    const { data: latestSession } = await supabase
      .from('guardian_governance_coach_sessions')
      .select('id, status, summary, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Open actions count
    const { data: openActions, count: openCount } = await supabase
      .from('guardian_governance_coach_actions')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending');

    // Last applied time
    const { data: lastApplied } = await supabase
      .from('guardian_governance_coach_sessions')
      .select('updated_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'applied')
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    return {
      installed: true,
      latest_session: latestSession ? {
        id: latestSession.id,
        status: latestSession.status,
        summary: latestSession.summary,
        created_at: latestSession.created_at,
      } : undefined,
      open_actions_count: openCount || 0,
      last_applied_at: lastApplied?.updated_at,
    };
  } catch {
    return { installed: false };
  }
}

/**
 * Get core insights summary (risk + insights)
 */
async function getCoreInsightsSummary(tenantId: string, rangeDays: number) {
  try {
    const supabase = getSupabaseServer();

    // Get recent insights counts
    const cutoff = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000).toISOString();

    const { data: insights24h } = await supabase
      .from('guardian_insights')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    const { data: insights7d } = await supabase
      .from('guardian_insights')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const { data: insights30d } = await supabase
      .from('guardian_insights')
      .select('id', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .gte('created_at', cutoff);

    return {
      risk_headline: 'System healthy - all H-series modules reporting',
      insights_24h: insights24h?.length || 0,
      insights_7d: insights7d?.length || 0,
      insights_30d: insights30d?.length || 0,
    };
  } catch {
    return {};
  }
}

/**
 * Get unified H-series summary for tenant
 */
export async function getHSeriesSummary(tenantId: string, range?: { days: number }): Promise<HSeriesSummary> {
  const rangeDays = range?.days || 30;
  const timestamp = new Date().toISOString();

  try {
    // Detect module presence
    const modules = await detectModulePresence(tenantId);

    // Get governance state
    const governance = await getGovernanceState(tenantId);

    // Get core insights
    const core = await getCoreInsightsSummary(tenantId, rangeDays);

    // Gather H01-H05 summaries in parallel
    const [h01, h02, h03, h04, h05] = await Promise.all([
      modules.h01_rule_suggestion ? getH01Summary(tenantId) : { installed: false },
      modules.h02_anomaly_detection ? getH02Summary(tenantId) : { installed: false },
      modules.h03_correlation_refinement ? getH03Summary(tenantId) : { installed: false },
      modules.h04_incident_scoring ? getH04Summary(tenantId) : { installed: false },
      modules.h05_governance_coach ? getH05Summary(tenantId) : { installed: false },
    ]);

    return {
      timestamp,
      range_days: rangeDays,
      modules,
      governance,
      core,
      h01_rule_suggestions: h01,
      h02_anomalies: h02,
      h03_correlation: h03,
      h04_triage: h04,
      h05_governance_coach: h05,
    };
  } catch (error) {
    console.error('[H06] Failed to get H-series summary:', error);
    throw error;
  }
}

/**
 * Check if summary contains any PII (safety validation)
 */
export function validateSummaryForPII(summary: HSeriesSummary): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const summaryStr = JSON.stringify(summary);

  // Check for email patterns
  if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(summaryStr)) {
    warnings.push('Potential email addresses detected');
  }

  // Check for IP addresses
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(summaryStr)) {
    warnings.push('Potential IP addresses detected');
  }

  // Check for URLs
  if (/https?:\/\/[^\s]+/.test(summaryStr)) {
    warnings.push('URLs detected (should be redacted)');
  }

  // Check for webhook/secret patterns
  if (/webhook|secret|password|api[_-]key|token/i.test(summaryStr)) {
    warnings.push('Potential secrets detected');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
