/**
 * Evidence Collector - Autonomous Platform Audit System
 *
 * Centralized evidence collection and storage system that:
 * - Stores evidence locally on the filesystem
 * - Maintains audit trails
 * - Supports evidence retrieval for reports
 * - Implements retention policies
 */

import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

// ============================================================================
// Types
// ============================================================================

export interface Evidence {
  id: string;
  type: EvidenceType;
  source: EvidenceSource;
  category: EvidenceCategory;
  data: EvidenceData;
  metadata: EvidenceMetadata;
  storage: StorageInfo;
  created_at: string;
  expires_at?: string;
}

export type EvidenceType =
  | 'screenshot'
  | 'video'
  | 'log'
  | 'metric'
  | 'snapshot'
  | 'trace'
  | 'report'
  | 'verification';

export type EvidenceSource =
  | 'journey_runner'
  | 'friction_detector'
  | 'route_auditor'
  | 'verifier'
  | 'manual'
  | 'scheduled';

export type EvidenceCategory =
  | 'pass'
  | 'fail'
  | 'warning'
  | 'info'
  | 'error'
  | 'performance'
  | 'security';

export interface EvidenceData {
  content_type: 'text' | 'json' | 'binary' | 'url';
  content: string;
  size_bytes: number;
  checksum?: string;
}

export interface EvidenceMetadata {
  task_id?: string;
  journey_id?: string;
  step_id?: string;
  agent_id?: string;
  verifier_id?: string;
  tags: string[];
  custom: Record<string, unknown>;
}

export interface StorageInfo {
  location: 'local';
  local_path?: string;
}

export interface EvidenceQuery {
  type?: EvidenceType;
  source?: EvidenceSource;
  category?: EvidenceCategory;
  task_id?: string;
  journey_id?: string;
  from_date?: string;
  to_date?: string;
  tags?: string[];
  limit?: number;
  offset?: number;
}

export interface EvidenceStats {
  total_count: number;
  by_type: Record<EvidenceType, number>;
  by_category: Record<EvidenceCategory, number>;
  by_source: Record<EvidenceSource, number>;
  total_size_bytes: number;
  oldest: string;
  newest: string;
}

export interface RetentionPolicy {
  default_days: number;
  by_category: Record<EvidenceCategory, number>;
  by_type: Record<EvidenceType, number>;
}

// ============================================================================
// Default Retention Policy
// ============================================================================

const DEFAULT_RETENTION_POLICY: RetentionPolicy = {
  default_days: 30,
  by_category: {
    pass: 7,
    fail: 90,
    warning: 30,
    info: 7,
    error: 90,
    performance: 30,
    security: 365,
  },
  by_type: {
    screenshot: 14,
    video: 7,
    log: 30,
    metric: 90,
    snapshot: 14,
    trace: 30,
    report: 365,
    verification: 90,
  },
};

// ============================================================================
// Evidence Collector
// ============================================================================

export class EvidenceCollector {
  private readonly collectorId: string;
  private readonly localStoragePath: string;
  private readonly retentionPolicy: RetentionPolicy;
  private evidence: Map<string, Evidence> = new Map();

  constructor(options?: { localStoragePath?: string; retentionPolicy?: RetentionPolicy }) {
    this.collectorId = `evidence_collector_${uuidv4().slice(0, 8)}`;
    this.localStoragePath = options?.localStoragePath || './audit-evidence';
    this.retentionPolicy = options?.retentionPolicy || DEFAULT_RETENTION_POLICY;
  }

  getCollectorId(): string {
    return this.collectorId;
  }

  /**
   * Collect and store evidence
   */
  async collect(
    type: EvidenceType,
    source: EvidenceSource,
    category: EvidenceCategory,
    content: string | Buffer | Record<string, unknown>,
    metadata?: Partial<EvidenceMetadata>
  ): Promise<Evidence> {
    const id = `evidence_${uuidv4()}`;
    const now = new Date();

    // Determine content type and serialize
    let contentType: EvidenceData['content_type'];
    let serializedContent: string;
    let sizeBytes: number;

    if (Buffer.isBuffer(content)) {
      contentType = 'binary';
      serializedContent = content.toString('base64');
      sizeBytes = content.length;
    } else if (typeof content === 'object') {
      contentType = 'json';
      serializedContent = JSON.stringify(content);
      sizeBytes = Buffer.byteLength(serializedContent, 'utf8');
    } else {
      contentType = 'text';
      serializedContent = content;
      sizeBytes = Buffer.byteLength(content, 'utf8');
    }

    // Calculate expiration
    const retentionDays = this.getRetentionDays(type, category);
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + retentionDays);

    const evidence: Evidence = {
      id,
      type,
      source,
      category,
      data: {
        content_type: contentType,
        content: serializedContent,
        size_bytes: sizeBytes,
        checksum: this.calculateChecksum(serializedContent),
      },
      metadata: {
        tags: [],
        custom: {},
        ...metadata,
      },
      storage: {
        location: 'local',
      },
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    };

    // Store locally
    await this.storeLocal(evidence);

    // Cache in memory
    this.evidence.set(id, evidence);

    return evidence;
  }

  /**
   * Store evidence locally
   */
  private async storeLocal(evidence: Evidence): Promise<void> {
    const dateFolder = evidence.created_at.slice(0, 10);
    const folder = path.join(this.localStoragePath, dateFolder, evidence.source);

    try {
      await fs.mkdir(folder, { recursive: true });

      const filename = `${evidence.id}.json`;
      const filepath = path.join(folder, filename);

      await fs.writeFile(filepath, JSON.stringify(evidence, null, 2));

      evidence.storage.local_path = filepath;
    } catch (error) {
      console.error('Failed to store evidence locally:', error);
    }
  }

  /**
   * Retrieve evidence by ID
   */
  async get(id: string): Promise<Evidence | null> {
    // Check memory cache
    if (this.evidence.has(id)) {
      return this.evidence.get(id) || null;
    }

    return null;
  }

  /**
   * Query evidence with filters
   */
  async query(query: EvidenceQuery): Promise<Evidence[]> {
    return this.queryMemory(query);
  }

  /**
   * Query evidence from memory
   */
  private queryMemory(query: EvidenceQuery): Evidence[] {
    let results = Array.from(this.evidence.values());

    if (query.type) {
      results = results.filter((e) => e.type === query.type);
    }
    if (query.source) {
      results = results.filter((e) => e.source === query.source);
    }
    if (query.category) {
      results = results.filter((e) => e.category === query.category);
    }
    if (query.task_id) {
      results = results.filter((e) => e.metadata.task_id === query.task_id);
    }
    if (query.journey_id) {
      results = results.filter((e) => e.metadata.journey_id === query.journey_id);
    }
    if (query.from_date) {
      results = results.filter((e) => e.created_at >= query.from_date!);
    }
    if (query.to_date) {
      results = results.filter((e) => e.created_at <= query.to_date!);
    }
    if (query.tags && query.tags.length > 0) {
      results = results.filter((e) => query.tags!.some((tag) => e.metadata.tags.includes(tag)));
    }

    // Sort by created_at descending
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 100;
    return results.slice(offset, offset + limit);
  }

  /**
   * Get statistics about stored evidence
   */
  async getStats(): Promise<EvidenceStats> {
    const allEvidence = Array.from(this.evidence.values());

    const byType = {} as Record<EvidenceType, number>;
    const byCategory = {} as Record<EvidenceCategory, number>;
    const bySource = {} as Record<EvidenceSource, number>;
    let totalSize = 0;
    let oldest = new Date().toISOString();
    let newest = '1970-01-01T00:00:00.000Z';

    for (const e of allEvidence) {
      byType[e.type] = (byType[e.type] || 0) + 1;
      byCategory[e.category] = (byCategory[e.category] || 0) + 1;
      bySource[e.source] = (bySource[e.source] || 0) + 1;
      totalSize += e.data.size_bytes;

      if (e.created_at < oldest) oldest = e.created_at;
      if (e.created_at > newest) newest = e.created_at;
    }

    return {
      total_count: allEvidence.length,
      by_type: byType,
      by_category: byCategory,
      by_source: bySource,
      total_size_bytes: totalSize,
      oldest,
      newest,
    };
  }

  /**
   * Clean up expired evidence
   */
  async cleanupExpired(): Promise<{ deleted: number; errors: string[] }> {
    const now = new Date().toISOString();
    let deleted = 0;
    const errors: string[] = [];

    // Clean from memory
    for (const [id, evidence] of this.evidence.entries()) {
      if (evidence.expires_at && evidence.expires_at < now) {
        this.evidence.delete(id);
        deleted++;

        // Clean local file
        if (evidence.storage.local_path) {
          try {
            await fs.unlink(evidence.storage.local_path);
          } catch {
            errors.push(`Failed to delete local file: ${evidence.storage.local_path}`);
          }
        }
      }
    }

    return { deleted, errors };
  }

  /**
   * Get retention days for evidence type/category
   */
  private getRetentionDays(type: EvidenceType, category: EvidenceCategory): number {
    // Check category-specific retention first
    if (this.retentionPolicy.by_category[category]) {
      return this.retentionPolicy.by_category[category];
    }

    // Then type-specific
    if (this.retentionPolicy.by_type[type]) {
      return this.retentionPolicy.by_type[type];
    }

    // Fall back to default
    return this.retentionPolicy.default_days;
  }

  /**
   * Calculate simple checksum for content
   */
  private calculateChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0');
  }
}

export default EvidenceCollector;
