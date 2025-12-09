/**
 * Compliance Integration Service
 * Phase 93: Wire compliance into VIF, Orchestration, Posting, and Autopilot
 */

import { checkContent } from './contentComplianceCheckerService';
import { logIncident, getRecentCriticalIncidents } from './complianceIncidentService';
import { requiresImmediateAttention } from './complianceTruthAdapter';
import type { ComplianceCheckResult } from './complianceTypes';

interface PreflightContext {
  agencyId: string;
  regionId?: string;
  regionSlug: string;
  clientId?: string;
  platform: string;
  content: {
    text: string;
    mediaMeta?: Record<string, unknown>;
  };
  contentRef: {
    type: string;
    id: string;
  };
  complianceResult?: ComplianceCheckResult;
}

/**
 * Attach compliance check to preflight context
 */
export async function attachComplianceToPreflight(
  context: PreflightContext
): Promise<PreflightContext> {
  // Run compliance check
  const result = await checkContent({
    text: context.content.text,
    mediaMeta: context.content.mediaMeta,
    regionSlug: context.regionSlug,
    platform: context.platform,
  });

  // Log incidents for violations
  for (const violation of result.violations) {
    if (violation.severity === 'critical' || violation.severity === 'high') {
      await logIncident({
        agencyId: context.agencyId,
        regionId: context.regionId,
        clientId: context.clientId,
        platform: context.platform,
        policyCode: violation.policyCode,
        severity: violation.severity,
        status: result.blockedReason ? 'blocked' : 'warning',
        contentRef: {
          type: context.contentRef.type,
          id: context.contentRef.id,
          preview: context.content.text.slice(0, 200),
        },
        notesMarkdown: `**Auto-detected violation**\n\n${violation.description}\n\nMatched patterns: ${violation.matchedPatterns.join(', ')}`,
      });
    }
  }

  return {
    ...context,
    complianceResult: result,
  };
}

/**
 * Prevent execution if critical violations exist
 */
export function preventExecutionOnCriticalViolations(
  context: PreflightContext
): boolean {
  if (!context.complianceResult) {
    return false; // No check performed
  }

  return requiresImmediateAttention(context.complianceResult);
}

/**
 * Emit autopilot tasks from compliance incidents
 */
export async function emitAutopilotTasksFromIncidents(
  agencyId: string
): Promise<Array<{
  type: string;
  priority: number;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
}>> {
  const criticalIncidents = await getRecentCriticalIncidents(agencyId, 5);

  const tasks: Array<{
    type: string;
    priority: number;
    title: string;
    description: string;
    metadata: Record<string, unknown>;
  }> = [];

  for (const incident of criticalIncidents) {
    // Only unresolved incidents
    if (incident.resolvedAt) {
continue;
}

    tasks.push({
      type: 'compliance_review',
      priority: incident.severity === 'critical' ? 10 : 8,
      title: `Review ${incident.severity} compliance issue: ${incident.policyCode}`,
      description:
        `A ${incident.severity} compliance incident was detected for ${incident.platform}. ` +
        `Content may violate ${incident.policyCode} policy. Review and resolve.`,
      metadata: {
        incidentId: incident.id,
        policyCode: incident.policyCode,
        severity: incident.severity,
        platform: incident.platform,
        contentRef: incident.contentRef,
      },
    });
  }

  return tasks;
}

/**
 * Get compliance status for a content item
 */
export async function getComplianceStatus(
  text: string,
  regionSlug: string,
  platform: string
): Promise<{
  status: 'clear' | 'warning' | 'blocked';
  summary: string;
  violationCount: number;
}> {
  const result = await checkContent({ text, regionSlug, platform });

  let status: 'clear' | 'warning' | 'blocked' = 'clear';
  let summary = 'No compliance issues detected.';

  if (result.blockedReason) {
    status = 'blocked';
    summary = result.blockedReason;
  } else if (result.violations.length > 0) {
    status = 'warning';
    summary = `${result.violations.length} potential issue(s) found. Review recommended.`;
  }

  return {
    status,
    summary,
    violationCount: result.violations.length,
  };
}

/**
 * Batch check multiple content items
 */
export async function batchComplianceCheck(
  items: Array<{
    id: string;
    text: string;
    regionSlug: string;
    platform: string;
  }>
): Promise<Map<string, ComplianceCheckResult>> {
  const results = new Map<string, ComplianceCheckResult>();

  // Process in parallel (with reasonable concurrency)
  const chunks = [];
  for (let i = 0; i < items.length; i += 5) {
    chunks.push(items.slice(i, i + 5));
  }

  for (const chunk of chunks) {
    const promises = chunk.map(async item => {
      const result = await checkContent({
        text: item.text,
        regionSlug: item.regionSlug,
        platform: item.platform,
      });
      return { id: item.id, result };
    });

    const chunkResults = await Promise.all(promises);
    for (const { id, result } of chunkResults) {
      results.set(id, result);
    }
  }

  return results;
}
