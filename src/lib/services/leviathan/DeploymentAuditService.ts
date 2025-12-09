/**
 * DeploymentAuditService - Comprehensive Audit Trail
 * Phase 13 Week 7-8: Deployment logging and tracking
 *
 * Handles:
 * - Audit log creation for all deployment actions
 * - Variant and seed tracking
 * - Link and asset logging
 * - Query and reporting
 */

import * as crypto from 'crypto';

export interface AuditLogEntry {
  id: string;
  orgId: string;
  runId?: string;
  stepId?: string;

  // Action
  actionType: string;
  actionTarget?: string;
  actionResult: 'success' | 'failure' | 'partial' | 'skipped';

  // Details
  details: Record<string, any>;

  // Variants
  variantIndex?: number;
  seed?: number;
  randomisationOutput?: Record<string, any>;

  // Links
  linksCreated: number;
  linkDetails?: Record<string, any>[];

  // Assets
  assetsUploaded: number;
  assetDetails?: Record<string, any>[];

  // Timing
  timestamp: Date;
  durationMs?: number;

  // Actor
  actorType: 'system' | 'user' | 'scheduled' | 'webhook';
  actorId?: string;

  // Metadata
  metadata: Record<string, any>;
}

export interface AuditQuery {
  orgId: string;
  runId?: string;
  actionType?: string;
  actionResult?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface AuditReport {
  totalEntries: number;
  successCount: number;
  failureCount: number;
  partialCount: number;
  totalLinksCreated: number;
  totalAssetsUploaded: number;
  averageDuration: number;
  byActionType: Record<string, number>;
  byActorType: Record<string, number>;
  timeline: { date: string; count: number }[];
}

export class DeploymentAuditService {
  private logs: AuditLogEntry[] = [];

  /**
   * Log a deployment action
   */
  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): AuditLogEntry {
    const logEntry: AuditLogEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: new Date(),
    };

    this.logs.push(logEntry);
    return logEntry;
  }

  /**
   * Log fabrication action
   */
  logFabrication(params: {
    orgId: string;
    runId: string;
    stepId?: string;
    topic: string;
    contentType: string;
    wordCount: number;
    contentHash: string;
    durationMs: number;
    success: boolean;
  }): AuditLogEntry {
    return this.log({
      orgId: params.orgId,
      runId: params.runId,
      stepId: params.stepId,
      actionType: 'fabrication',
      actionTarget: params.topic,
      actionResult: params.success ? 'success' : 'failure',
      details: {
        topic: params.topic,
        contentType: params.contentType,
        wordCount: params.wordCount,
        contentHash: params.contentHash,
      },
      linksCreated: 0,
      assetsUploaded: 0,
      durationMs: params.durationMs,
      actorType: 'system',
      metadata: {},
    });
  }

  /**
   * Log cloud deployment action
   */
  logCloudDeployment(params: {
    orgId: string;
    runId: string;
    stepId?: string;
    provider: string;
    variantIndex: number;
    seed: number;
    deployedUrl: string;
    assetCount: number;
    durationMs: number;
    success: boolean;
    randomisation: Record<string, any>;
  }): AuditLogEntry {
    return this.log({
      orgId: params.orgId,
      runId: params.runId,
      stepId: params.stepId,
      actionType: 'cloud_deployment',
      actionTarget: params.provider,
      actionResult: params.success ? 'success' : 'failure',
      details: {
        provider: params.provider,
        deployedUrl: params.deployedUrl,
      },
      variantIndex: params.variantIndex,
      seed: params.seed,
      randomisationOutput: params.randomisation,
      linksCreated: 0,
      assetsUploaded: params.assetCount,
      assetDetails: [{
        url: params.deployedUrl,
        provider: params.provider,
      }],
      durationMs: params.durationMs,
      actorType: 'system',
      metadata: {},
    });
  }

  /**
   * Log Blogger publishing action
   */
  logBloggerPublish(params: {
    orgId: string;
    runId: string;
    stepId?: string;
    blogId: string;
    postId: string;
    postUrl: string;
    variantIndex: number;
    seed: number;
    durationMs: number;
    success: boolean;
  }): AuditLogEntry {
    return this.log({
      orgId: params.orgId,
      runId: params.runId,
      stepId: params.stepId,
      actionType: 'blogger_publish',
      actionTarget: params.blogId,
      actionResult: params.success ? 'success' : 'failure',
      details: {
        blogId: params.blogId,
        postId: params.postId,
        postUrl: params.postUrl,
      },
      variantIndex: params.variantIndex,
      seed: params.seed,
      linksCreated: 1,
      linkDetails: [{
        type: 'blogger_post',
        url: params.postUrl,
      }],
      assetsUploaded: 0,
      durationMs: params.durationMs,
      actorType: 'system',
      metadata: {},
    });
  }

  /**
   * Log GSite creation action
   */
  logGSiteCreation(params: {
    orgId: string;
    runId: string;
    stepId?: string;
    siteName: string;
    siteUrl: string;
    embeddedCount: number;
    variantIndex: number;
    seed: number;
    durationMs: number;
    success: boolean;
  }): AuditLogEntry {
    return this.log({
      orgId: params.orgId,
      runId: params.runId,
      stepId: params.stepId,
      actionType: 'gsite_creation',
      actionTarget: params.siteName,
      actionResult: params.success ? 'success' : 'failure',
      details: {
        siteName: params.siteName,
        siteUrl: params.siteUrl,
        embeddedCount: params.embeddedCount,
      },
      variantIndex: params.variantIndex,
      seed: params.seed,
      linksCreated: params.embeddedCount + 1,
      assetsUploaded: 0,
      durationMs: params.durationMs,
      actorType: 'system',
      metadata: {},
    });
  }

  /**
   * Log link propagation action
   */
  logLinkPropagation(params: {
    orgId: string;
    runId: string;
    stepId?: string;
    totalLinks: number;
    linksByLayer: Record<string, number>;
    durationMs: number;
    success: boolean;
  }): AuditLogEntry {
    return this.log({
      orgId: params.orgId,
      runId: params.runId,
      stepId: params.stepId,
      actionType: 'link_propagation',
      actionResult: params.success ? 'success' : 'failure',
      details: {
        linksByLayer: params.linksByLayer,
      },
      linksCreated: params.totalLinks,
      assetsUploaded: 0,
      durationMs: params.durationMs,
      actorType: 'system',
      metadata: {},
    });
  }

  /**
   * Log health check action
   */
  logHealthCheck(params: {
    orgId: string;
    runId?: string;
    url: string;
    healthScore: number;
    issues: string[];
    durationMs: number;
  }): AuditLogEntry {
    return this.log({
      orgId: params.orgId,
      runId: params.runId,
      actionType: 'health_check',
      actionTarget: params.url,
      actionResult: params.healthScore >= 70 ? 'success' : params.healthScore >= 50 ? 'partial' : 'failure',
      details: {
        url: params.url,
        healthScore: params.healthScore,
        issues: params.issues,
      },
      linksCreated: 0,
      assetsUploaded: 0,
      durationMs: params.durationMs,
      actorType: 'system',
      metadata: {},
    });
  }

  /**
   * Log rollback action
   */
  logRollback(params: {
    orgId: string;
    runId: string;
    stepId: string;
    reason: string;
    itemsRolledBack: number;
    durationMs: number;
    success: boolean;
  }): AuditLogEntry {
    return this.log({
      orgId: params.orgId,
      runId: params.runId,
      stepId: params.stepId,
      actionType: 'rollback',
      actionResult: params.success ? 'success' : 'failure',
      details: {
        reason: params.reason,
        itemsRolledBack: params.itemsRolledBack,
      },
      linksCreated: 0,
      assetsUploaded: 0,
      durationMs: params.durationMs,
      actorType: 'system',
      metadata: {},
    });
  }

  /**
   * Query audit logs
   */
  query(query: AuditQuery): AuditLogEntry[] {
    let results = this.logs.filter(log => log.orgId === query.orgId);

    if (query.runId) {
      results = results.filter(log => log.runId === query.runId);
    }

    if (query.actionType) {
      results = results.filter(log => log.actionType === query.actionType);
    }

    if (query.actionResult) {
      results = results.filter(log => log.actionResult === query.actionResult);
    }

    if (query.startDate) {
      results = results.filter(log => log.timestamp >= query.startDate!);
    }

    if (query.endDate) {
      results = results.filter(log => log.timestamp <= query.endDate!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * Generate audit report
   */
  generateReport(query: AuditQuery): AuditReport {
    const logs = this.query({ ...query, limit: 10000 });

    const byActionType: Record<string, number> = {};
    const byActorType: Record<string, number> = {};
    const byDate: Record<string, number> = {};

    let successCount = 0;
    let failureCount = 0;
    let partialCount = 0;
    let totalLinksCreated = 0;
    let totalAssetsUploaded = 0;
    let totalDuration = 0;
    let durationCount = 0;

    for (const log of logs) {
      // Count by result
      if (log.actionResult === 'success') {
successCount++;
} else if (log.actionResult === 'failure') {
failureCount++;
} else if (log.actionResult === 'partial') {
partialCount++;
}

      // Count by action type
      byActionType[log.actionType] = (byActionType[log.actionType] || 0) + 1;

      // Count by actor type
      byActorType[log.actorType] = (byActorType[log.actorType] || 0) + 1;

      // Count by date
      const date = log.timestamp.toISOString().split('T')[0];
      byDate[date] = (byDate[date] || 0) + 1;

      // Totals
      totalLinksCreated += log.linksCreated;
      totalAssetsUploaded += log.assetsUploaded;

      if (log.durationMs) {
        totalDuration += log.durationMs;
        durationCount++;
      }
    }

    // Build timeline
    const timeline = Object.entries(byDate)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalEntries: logs.length,
      successCount,
      failureCount,
      partialCount,
      totalLinksCreated,
      totalAssetsUploaded,
      averageDuration: durationCount > 0 ? totalDuration / durationCount : 0,
      byActionType,
      byActorType,
      timeline,
    };
  }

  /**
   * Get logs for a specific run
   */
  getRunLogs(runId: string): AuditLogEntry[] {
    return this.logs.filter(log => log.runId === runId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Get latest logs for an org
   */
  getLatestLogs(orgId: string, limit: number = 50): AuditLogEntry[] {
    return this.query({ orgId, limit });
  }

  /**
   * Clear logs (for testing)
   */
  clearLogs(): void {
    this.logs = [];
  }
}

export default DeploymentAuditService;
