/**
 * Cron Scheduler for Health Check Monitoring
 * Executes threat detection every 6 hours
 *
 * Usage:
 * - Call initializeMonitoringCrons() on app startup
 * - Each workspace/domain gets a cron job
 * - Cron triggered via vercel/cron or self-hosted scheduler
 */

import { getSupabaseServer } from '@/lib/supabase';
import { detectThreats, broadcastThreatAlert } from '@/lib/monitoring/seo-threat-monitor';

interface MonitoringSchedule {
  workspaceId: string;
  domain: string;
  interval: number; // milliseconds
  nextRun: Date;
  active: boolean;
}

// In-memory registry of active monitoring schedules
const monitoringSchedules = new Map<string, MonitoringSchedule>();

/**
 * Initialize all active monitoring schedules
 * Call once on app startup
 */
export async function initializeMonitoringCrons(): Promise<void> {
  try {
    const supabase = getSupabaseServer();

    // Fetch all active health check monitoring sessions
    const { data: sessions, error } = await supabase
      .from('health_check_jobs')
      .select('id, workspace_id, domain, analyze_threats')
      .eq('analyze_threats', true)
      .eq('status', 'completed');

    if (error || !sessions) {
      console.error('[Cron Scheduler] Failed to fetch monitoring sessions:', error);
      return;
    }

    console.log(`[Cron Scheduler] Initializing ${sessions.length} monitoring schedules`);

    // Register each session for 6-hour monitoring
    for (const session of sessions) {
      scheduleMonitoring(session.workspace_id, session.domain);
    }
  } catch (error) {
    console.error('[Cron Scheduler] Failed to initialize crons:', error);
  }
}

/**
 * Register domain for continuous monitoring
 */
export function scheduleMonitoring(workspaceId: string, domain: string, intervalHours: number = 6): void {
  const scheduleKey = `${workspaceId}-${domain}`;

  // Avoid duplicate registrations
  if (monitoringSchedules.has(scheduleKey)) {
    console.log(`[Cron Scheduler] Monitoring already scheduled for ${domain}`);
    return;
  }

  const intervalMs = intervalHours * 60 * 60 * 1000;
  const nextRun = new Date(Date.now() + intervalMs);

  const schedule: MonitoringSchedule = {
    workspaceId,
    domain,
    interval: intervalMs,
    nextRun,
    active: true,
  };

  monitoringSchedules.set(scheduleKey, schedule);

  console.log(`[Cron Scheduler] Registered monitoring: ${domain} (${workspaceId})`);

  // Schedule immediate first check after 1 minute
  setTimeout(() => {
    executeMonitoringCheck(workspaceId, domain);
  }, 60 * 1000);
}

/**
 * Unregister domain from monitoring
 */
export function unscheduleMonitoring(workspaceId: string, domain: string): void {
  const scheduleKey = `${workspaceId}-${domain}`;
  monitoringSchedules.delete(scheduleKey);
  console.log(`[Cron Scheduler] Unregistered monitoring: ${domain}`);
}

/**
 * Execute monitoring check for domain
 * Detects threats, broadcasts alerts, and publishes real-time status
 */
export async function executeMonitoringCheck(
  workspaceId: string,
  domain: string
): Promise<number> {
  const scheduleKey = `${workspaceId}-${domain}`;
  const schedule = monitoringSchedules.get(scheduleKey);

  if (!schedule || !schedule.active) {
    console.log(`[Cron Scheduler] Monitoring not active for ${domain}`);
    return 0;
  }

  try {
    const checkStartTime = Date.now();
    console.log(`[Cron Scheduler] Executing threat detection for ${domain}`);

    // Detect all 6 threat types
    const threats = await detectThreats(domain, workspaceId);

    console.log(`[Cron Scheduler] Detected ${threats.length} threats for ${domain}`);

    // Broadcast high-severity alerts immediately
    const criticalThreats = threats.filter((t) => t.severity === 'critical');
    for (const threat of criticalThreats) {
      await broadcastThreatAlert(workspaceId, threat, ['websocket']);
    }

    // Publish monitoring status to WebSocket (real-time dashboard update)
    await publishMonitoringStatusToWebSocket(workspaceId, domain, threats);

    // Schedule next check
    const nextRun = new Date(Date.now() + schedule.interval);
    schedule.nextRun = nextRun;

    const duration = Date.now() - checkStartTime;
    console.log(`[Cron Scheduler] Check completed in ${duration}ms. Next check: ${nextRun.toISOString()}`);

    return threats.length;
  } catch (error) {
    console.error(`[Cron Scheduler] Monitoring check failed for ${domain}:`, error);
    return 0;
  }
}

/**
 * Publish monitoring status to WebSocket via Ably
 * Notifies dashboard of check completion and threat summary
 */
async function publishMonitoringStatusToWebSocket(
  workspaceId: string,
  domain: string,
  threats: any[]
): Promise<void> {
  try {
    const { publishMonitoringStatus, publishThreatSummary } = await import('@/lib/realtime/ably-client');

    // Count threats by severity
    const summary = {
      domain,
      total: threats.length,
      critical: threats.filter((t) => t.severity === 'critical').length,
      high: threats.filter((t) => t.severity === 'high').length,
      medium: threats.filter((t) => t.severity === 'medium').length,
      low: threats.filter((t) => t.severity === 'low').length,
      mostRecent: threats.length > 0 ? threats[0].detectedAt : null,
    };

    // Publish status update
    await publishMonitoringStatus(workspaceId, {
      domain,
      checkCompletedAt: new Date().toISOString(),
      nextCheckAt: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
      threatsDetected: threats.length,
    });

    // Publish summary for dashboard display
    await publishThreatSummary(workspaceId, summary);

    console.log(`[Cron Scheduler] Published status to WebSocket for ${domain}`);
  } catch (error) {
    console.error(`[Cron Scheduler] Failed to publish monitoring status:`, error);
    // Don't fail - check already completed and threats stored in database
  }
}

/**
 * Health check endpoint for monitoring schedules
 * Returns status of all active monitors
 */
export function getMonitoringStatus(): {
  activeSchedules: number;
  schedules: MonitoringSchedule[];
  nextChecks: Array<{ domain: string; scheduledAt: string }>;
} {
  const schedules = Array.from(monitoringSchedules.values());
  const nextChecks = schedules
    .filter((s) => s.active)
    .sort((a, b) => a.nextRun.getTime() - b.nextRun.getTime())
    .slice(0, 5)
    .map((s) => ({
      domain: s.domain,
      scheduledAt: s.nextRun.toISOString(),
    }));

  return {
    activeSchedules: schedules.filter((s) => s.active).length,
    schedules,
    nextChecks,
  };
}

/**
 * API endpoint handler for health check monitoring
 * GET /api/health-check/monitor?workspaceId=xxx&domain=xxx
 */
export async function handleMonitoringRequest(
  workspaceId: string,
  domain: string
): Promise<{
  status: string;
  threats: Array<{ title: string; severity: string; type: string }>;
  monitoring: { active: boolean; nextCheck: string };
  summary: { critical: number; high: number; medium: number; low: number };
}> {
  try {
    const supabase = getSupabaseServer();

    // Fetch recent threats
    const { data: threats, error } = await supabase
      .from('seo_threats')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('domain', domain)
      .order('detected_at', { ascending: false })
      .limit(20);

    if (error) {
      throw new Error(`Failed to fetch threats: ${error.message}`);
    }

    // Count by severity
    const summary = {
      critical: threats?.filter((t) => t.severity === 'critical').length ?? 0,
      high: threats?.filter((t) => t.severity === 'high').length ?? 0,
      medium: threats?.filter((t) => t.severity === 'medium').length ?? 0,
      low: threats?.filter((t) => t.severity === 'low').length ?? 0,
    };

    // Get next scheduled check
    const scheduleKey = `${workspaceId}-${domain}`;
    const schedule = monitoringSchedules.get(scheduleKey);

    return {
      status: 'active',
      threats: (threats || []).map((t) => ({
        title: t.title,
        severity: t.severity,
        type: t.threat_type,
      })),
      monitoring: {
        active: schedule?.active ?? false,
        nextCheck: schedule?.nextRun.toISOString() ?? new Date().toISOString(),
      },
      summary,
    };
  } catch (error) {
    console.error('[Cron Scheduler] Request handler failed:', error);
    throw error;
  }
}

/**
 * List all active monitoring schedules for workspace
 */
export async function getWorkspaceMonitoringSessions(workspaceId: string): Promise<
  Array<{
    domain: string;
    active: boolean;
    nextCheck: string;
    threatsToday: number;
  }>
> {
  try {
    const supabase = getSupabaseServer();

    // Get all domains being monitored for this workspace
    const workspaceSchedules = Array.from(monitoringSchedules.values())
      .filter((s) => s.workspaceId === workspaceId)
      .sort((a, b) => a.domain.localeCompare(b.domain));

    // Fetch threat counts for each domain (last 24 hours)
    const threatCounts: Record<string, number> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const schedule of workspaceSchedules) {
      const { data, error } = await supabase
        .from('seo_threats')
        .select('id', { count: 'exact' })
        .eq('workspace_id', workspaceId)
        .eq('domain', schedule.domain)
        .gte('detected_at', today.toISOString());

      if (!error && data) {
        threatCounts[schedule.domain] = data.length;
      }
    }

    return workspaceSchedules.map((s) => ({
      domain: s.domain,
      active: s.active,
      nextCheck: s.nextRun.toISOString(),
      threatsToday: threatCounts[s.domain] ?? 0,
    }));
  } catch (error) {
    console.error('[Cron Scheduler] Failed to get workspace sessions:', error);
    return [];
  }
}

/**
 * Manual trigger for monitoring check
 * Useful for testing or immediate detection
 */
export async function triggerImmediateCheck(workspaceId: string, domain: string): Promise<number> {
  console.log(`[Cron Scheduler] Manual trigger: ${domain} (${workspaceId})`);
  return await executeMonitoringCheck(workspaceId, domain);
}

/**
 * Stop all monitoring (on app shutdown)
 */
export function stopAllMonitoring(): void {
  monitoringSchedules.clear();
  console.log('[Cron Scheduler] All monitoring stopped');
}
