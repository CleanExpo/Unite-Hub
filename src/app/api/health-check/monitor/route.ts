/**
 * SEO Threat Monitoring API
 * GET /api/health-check/monitor?workspaceId=xxx&domain=yyy&triggerCheck=true
 *
 * Returns real-time SEO threats, monitoring status, and threat detection
 * Integrates with SEOThreatMonitor and cron scheduler for continuous monitoring
 */

import { NextRequest } from 'next/server';
import { validateUserAndWorkspace } from '@/lib/api-helpers';
import { successResponse, errorResponse } from '@/lib/api-helpers';
import { withErrorBoundary } from '@/lib/error-boundary';
import { getSupabaseServer } from '@/lib/supabase';
import {
  executeMonitoringCheck,
  getWorkspaceMonitoringSessions,
  scheduleMonitoring,
} from '@/lib/monitoring/cron-scheduler';
import { detectThreats, getActivethreats } from '@/lib/monitoring/seo-threat-monitor';

export const GET = withErrorBoundary(async (req: NextRequest) => {
  // Validate workspace
  const workspaceId = req.nextUrl.searchParams.get('workspaceId');
  const domain = req.nextUrl.searchParams.get('domain');
  const triggerCheck = req.nextUrl.searchParams.get('triggerCheck') === 'true';

  if (!workspaceId) {
    return errorResponse('workspaceId required', 400);
  }

  if (!domain) {
    return errorResponse('domain parameter required', 400);
  }

  await validateUserAndWorkspace(req, workspaceId);

  // If triggerCheck requested, execute immediate threat detection
  if (triggerCheck) {
    const threatCount = await executeMonitoringCheck(workspaceId, domain);
    return successResponse(
      {
        status: 'check_triggered',
        domain,
        threatsDetected: threatCount,
        timestamp: new Date().toISOString(),
      },
      202 // Accepted
    );
  }

  const supabase = getSupabaseServer();

  // 1. Get active threats using new SEOThreatMonitor service
  const threats = await getActivethreats(workspaceId, 20);
  const domainThreats = threats.filter((t) => t.domain === domain);

  // 2. Categorize threats by severity
  const threatsBySeverity = {
    critical: domainThreats.filter((t) => t.severity === 'critical'),
    high: domainThreats.filter((t) => t.severity === 'high'),
    medium: domainThreats.filter((t) => t.severity === 'medium'),
    low: domainThreats.filter((t) => t.severity === 'low'),
  };

  // 3. Get threat statistics
  const threatStats = {
    total: domainThreats.length,
    critical: threatsBySeverity.critical.length,
    high: threatsBySeverity.high.length,
    medium: threatsBySeverity.medium.length,
    low: threatsBySeverity.low.length,
    mostRecent: domainThreats.length > 0 ? domainThreats[0].detectedAt : null,
  };

  // 4. Format threat details
  const formattedThreats = {
    critical: threatsBySeverity.critical.map(formatThreat),
    high: threatsBySeverity.high.map(formatThreat),
    medium: threatsBySeverity.medium.map(formatThreat),
    low: threatsBySeverity.low.map(formatThreat),
  };

  // 5. Generate action items
  const actionItems = generateActionItems(threatsBySeverity.critical, threatsBySeverity.high);

  return successResponse({
    domain,
    monitoring: {
      active: true,
      interval: '6 hours',
      nextCheck: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
    },
    threats: formattedThreats,
    stats: threatStats,
    actionItems,
    recommendations: generateRecommendations(threatsBySeverity),
  });
});

/**
 * Format threat for API response
 */
function formatThreat(threat: any) {
  return {
    id: threat.id,
    type: threat.type,
    severity: threat.severity,
    domain: threat.domain,
    title: threat.title,
    description: threat.description,
    detectedAt: threat.detectedAt,
    impact: threat.impactEstimate,
    action: threat.recommendedAction,
    data: threat.data || {},
  };
}

/**
 * Generate prioritized action items
 */
function generateActionItems(critical: any[], high: any[]): string[] {
  const actions: string[] = [];

  // Critical action items
  critical.forEach((threat) => {
    if (threat.type === 'ranking_drop') {
      actions.push(`URGENT: ${threat.title} - ${threat.recommendedAction}`);
    } else if (threat.type === 'security_issue') {
      actions.push(`CRITICAL: ${threat.title} - Fix within 24 hours`);
    } else {
      actions.push(`CRITICAL: ${threat.title} - ${threat.recommendedAction}`);
    }
  });

  // High priority action items
  high.forEach((threat) => {
    if (threat.type === 'cwv_degradation') {
      actions.push(`Optimize: ${threat.title} - ${threat.recommendedAction}`);
    } else if (threat.type === 'technical_error') {
      actions.push(`Fix: ${threat.title} - ${threat.recommendedAction}`);
    } else {
      actions.push(`Address: ${threat.title} - ${threat.recommendedAction}`);
    }
  });

  return actions;
}

/**
 * Generate recommendations
 */
function generateRecommendations(
  threatsBySeverity: Record<string, any[]>
): Array<{ priority: string; action: string; timeframe: string }> {
  const recommendations = [];

  if (threatsBySeverity.critical.length > 0) {
    recommendations.push({
      priority: 'critical',
      action: 'Address all critical threats immediately',
      timeframe: 'within 24 hours',
    });
  }

  if (threatsBySeverity.high.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Resolve high-priority threats',
      timeframe: 'within 1 week',
    });
  }

  if (threatsBySeverity.medium.length > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Plan to address medium-priority issues',
      timeframe: 'within 2 weeks',
    });
  }

  return recommendations;
}
