/**
 * ErrorSurfaceAnalyzer - Failure Pattern Analysis
 * Phase 14 Week 1-2: Finalization
 *
 * Aggregates and analyzes errors from:
 * - Run logs
 * - Audit logs
 * - Orchestrator errors
 */

export interface ErrorPattern {
  pattern: string;
  count: number;
  percentage: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedSubsystems: string[];
  firstOccurrence: Date;
  lastOccurrence: Date;
  suggestedFix: string;
}

export interface ErrorSource {
  source: string;
  totalErrors: number;
  uniquePatterns: number;
  topPatterns: ErrorPattern[];
}

export interface ErrorTrend {
  date: string;
  total: number;
  bySeverity: Record<string, number>;
}

export interface ErrorAnalysis {
  analyzedAt: Date;
  totalErrors: number;
  uniquePatterns: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  bySource: ErrorSource[];
  topPatterns: ErrorPattern[];
  trends: ErrorTrend[];
  recommendations: string[];
}

export interface ErrorEntry {
  id: string;
  source: string;
  message: string;
  stack?: string;
  timestamp: Date;
  metadata: Record<string, any>;
}

export class ErrorSurfaceAnalyzer {
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private errors: ErrorEntry[] = [];

  /**
   * Analyze all error sources
   */
  async analyze(): Promise<ErrorAnalysis> {
    // Collect errors from all sources
    await this.collectErrors();

    // Identify patterns
    this.identifyPatterns();

    // Generate analysis
    const bySource = this.analyzeBySource();
    const topPatterns = this.getTopPatterns(10);
    const trends = this.analyzeTrends();
    const recommendations = this.generateRecommendations(topPatterns);

    // Count by severity
    const bySeverity = {
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
    };

    const patternValues = Array.from(this.errorPatterns.values());
    for (const pattern of patternValues) {
      bySeverity[pattern.severity] += pattern.count;
    }

    return {
      analyzedAt: new Date(),
      totalErrors: this.errors.length,
      uniquePatterns: this.errorPatterns.size,
      bySeverity,
      bySource,
      topPatterns,
      trends,
      recommendations,
    };
  }

  /**
   * Collect errors from all sources
   */
  private async collectErrors(): Promise<void> {
    // Simulate collecting errors - in production, query from databases
    this.errors = [
      ...this.generateRunLogErrors(),
      ...this.generateAuditLogErrors(),
      ...this.generateOrchestratorErrors(),
    ];
  }

  /**
   * Generate simulated run log errors
   */
  private generateRunLogErrors(): ErrorEntry[] {
    const errorTypes = [
      { message: 'Connection timeout', severity: 'high' },
      { message: 'Rate limit exceeded', severity: 'medium' },
      { message: 'Authentication failed', severity: 'critical' },
      { message: 'Invalid response format', severity: 'low' },
      { message: 'Resource not found', severity: 'medium' },
    ];

    const errors: ErrorEntry[] = [];
    const count = Math.floor(Math.random() * 50) + 10;

    for (let i = 0; i < count; i++) {
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      errors.push({
        id: `run-${i}`,
        source: 'run_logs',
        message: errorType.message,
        timestamp: new Date(Date.now() - Math.random() * 7 * 86400000),
        metadata: { severity: errorType.severity },
      });
    }

    return errors;
  }

  /**
   * Generate simulated audit log errors
   */
  private generateAuditLogErrors(): ErrorEntry[] {
    const errorTypes = [
      { message: 'Deployment failed: S3 upload error', severity: 'high' },
      { message: 'Blogger API quota exceeded', severity: 'medium' },
      { message: 'GSite creation timeout', severity: 'high' },
      { message: 'Health check failed: DNS error', severity: 'medium' },
      { message: 'Link propagation incomplete', severity: 'low' },
    ];

    const errors: ErrorEntry[] = [];
    const count = Math.floor(Math.random() * 30) + 5;

    for (let i = 0; i < count; i++) {
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      errors.push({
        id: `audit-${i}`,
        source: 'audit_logs',
        message: errorType.message,
        timestamp: new Date(Date.now() - Math.random() * 7 * 86400000),
        metadata: { severity: errorType.severity },
      });
    }

    return errors;
  }

  /**
   * Generate simulated orchestrator errors
   */
  private generateOrchestratorErrors(): ErrorEntry[] {
    const errorTypes = [
      { message: 'Step execution failed: fabrication', severity: 'high' },
      { message: 'Rollback triggered: cloud deployment', severity: 'critical' },
      { message: 'Health threshold not met', severity: 'medium' },
      { message: 'Max retries exceeded', severity: 'high' },
      { message: 'Configuration validation error', severity: 'low' },
    ];

    const errors: ErrorEntry[] = [];
    const count = Math.floor(Math.random() * 20) + 3;

    for (let i = 0; i < count; i++) {
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      errors.push({
        id: `orch-${i}`,
        source: 'orchestrator',
        message: errorType.message,
        timestamp: new Date(Date.now() - Math.random() * 7 * 86400000),
        metadata: { severity: errorType.severity },
      });
    }

    return errors;
  }

  /**
   * Identify error patterns from collected errors
   */
  private identifyPatterns(): void {
    this.errorPatterns.clear();

    for (const error of this.errors) {
      const patternKey = this.normalizeErrorMessage(error.message);

      if (this.errorPatterns.has(patternKey)) {
        const pattern = this.errorPatterns.get(patternKey)!;
        pattern.count++;
        if (error.timestamp < pattern.firstOccurrence) {
          pattern.firstOccurrence = error.timestamp;
        }
        if (error.timestamp > pattern.lastOccurrence) {
          pattern.lastOccurrence = error.timestamp;
        }
        if (!pattern.affectedSubsystems.includes(error.source)) {
          pattern.affectedSubsystems.push(error.source);
        }
      } else {
        this.errorPatterns.set(patternKey, {
          pattern: patternKey,
          count: 1,
          percentage: 0,
          severity: this.determineSeverity(error.message),
          affectedSubsystems: [error.source],
          firstOccurrence: error.timestamp,
          lastOccurrence: error.timestamp,
          suggestedFix: this.suggestFix(error.message),
        });
      }
    }

    // Calculate percentages
    const total = this.errors.length;
    for (const pattern of this.errorPatterns.values()) {
      pattern.percentage = (pattern.count / total) * 100;
    }
  }

  /**
   * Normalize error message to identify patterns
   */
  private normalizeErrorMessage(message: string): string {
    // Remove specific IDs, timestamps, etc.
    return message
      .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, 'UUID')
      .replace(/\d{4}-\d{2}-\d{2}/g, 'DATE')
      .replace(/\d+/g, 'N')
      .trim();
  }

  /**
   * Determine error severity
   */
  private determineSeverity(message: string): 'critical' | 'high' | 'medium' | 'low' {
    const lower = message.toLowerCase();

    if (lower.includes('authentication') || lower.includes('rollback') || lower.includes('critical')) {
      return 'critical';
    }
    if (lower.includes('failed') || lower.includes('timeout') || lower.includes('error')) {
      return 'high';
    }
    if (lower.includes('exceeded') || lower.includes('not met') || lower.includes('incomplete')) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Suggest fix for error pattern
   */
  private suggestFix(message: string): string {
    const lower = message.toLowerCase();

    if (lower.includes('timeout')) {
      return 'Increase timeout values or optimize operation performance';
    }
    if (lower.includes('rate limit') || lower.includes('quota')) {
      return 'Implement request throttling or upgrade API tier';
    }
    if (lower.includes('authentication')) {
      return 'Verify credentials and refresh tokens';
    }
    if (lower.includes('not found')) {
      return 'Verify resource existence before operation';
    }
    if (lower.includes('deployment failed')) {
      return 'Check cloud provider credentials and permissions';
    }
    if (lower.includes('rollback')) {
      return 'Review step dependencies and failure handling';
    }

    return 'Review logs for detailed error context';
  }

  /**
   * Analyze errors by source
   */
  private analyzeBySource(): ErrorSource[] {
    const sources = new Map<string, ErrorEntry[]>();

    for (const error of this.errors) {
      if (!sources.has(error.source)) {
        sources.set(error.source, []);
      }
      sources.get(error.source)!.push(error);
    }

    return Array.from(sources.entries()).map(([source, errors]) => {
      const patterns = new Map<string, ErrorPattern>();

      for (const error of errors) {
        const key = this.normalizeErrorMessage(error.message);
        if (patterns.has(key)) {
          patterns.get(key)!.count++;
        } else {
          patterns.set(key, {
            pattern: key,
            count: 1,
            percentage: 0,
            severity: this.determineSeverity(error.message),
            affectedSubsystems: [source],
            firstOccurrence: error.timestamp,
            lastOccurrence: error.timestamp,
            suggestedFix: this.suggestFix(error.message),
          });
        }
      }

      const topPatterns = Array.from(patterns.values())
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        source,
        totalErrors: errors.length,
        uniquePatterns: patterns.size,
        topPatterns,
      };
    });
  }

  /**
   * Get top error patterns
   */
  private getTopPatterns(limit: number): ErrorPattern[] {
    const patterns = Array.from(this.errorPatterns.values());
    return patterns
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Analyze error trends over time
   */
  private analyzeTrends(): ErrorTrend[] {
    const trends = new Map<string, { total: number; bySeverity: Record<string, number> }>();

    for (const error of this.errors) {
      const date = error.timestamp.toISOString().split('T')[0];

      if (!trends.has(date)) {
        trends.set(date, {
          total: 0,
          bySeverity: { critical: 0, high: 0, medium: 0, low: 0 },
        });
      }

      const trend = trends.get(date)!;
      trend.total++;

      const severity = this.determineSeverity(error.message);
      trend.bySeverity[severity]++;
    }

    return Array.from(trends.entries())
      .map(([date, data]) => ({
        date,
        total: data.total,
        bySeverity: data.bySeverity,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Generate recommendations based on patterns
   */
  private generateRecommendations(patterns: ErrorPattern[]): string[] {
    const recommendations: string[] = [];

    // Check for critical patterns
    const criticalPatterns = patterns.filter(p => p.severity === 'critical');
    if (criticalPatterns.length > 0) {
      recommendations.push(
        `URGENT: ${criticalPatterns.length} critical error patterns detected. Immediate attention required.`
      );
    }

    // Check for high frequency patterns
    const highFrequency = patterns.filter(p => p.percentage > 20);
    for (const pattern of highFrequency) {
      recommendations.push(
        `High frequency pattern (${pattern.percentage.toFixed(1)}%): "${pattern.pattern}" - ${pattern.suggestedFix}`
      );
    }

    // Check for patterns affecting multiple subsystems
    const crossSubsystem = patterns.filter(p => p.affectedSubsystems.length > 2);
    for (const pattern of crossSubsystem) {
      recommendations.push(
        `Cross-subsystem issue: "${pattern.pattern}" affects ${pattern.affectedSubsystems.join(', ')}`
      );
    }

    // Check for recurring patterns
    for (const pattern of patterns) {
      const hoursSinceFirst = (Date.now() - pattern.firstOccurrence.getTime()) / 3600000;
      const hoursSinceLast = (Date.now() - pattern.lastOccurrence.getTime()) / 3600000;

      if (hoursSinceFirst > 24 && hoursSinceLast < 1) {
        recommendations.push(
          `Recurring issue: "${pattern.pattern}" - occurring for ${Math.floor(hoursSinceFirst / 24)} days`
        );
      }
    }

    if (recommendations.length === 0) {
      recommendations.push('No critical issues detected. Continue monitoring.');
    }

    return recommendations;
  }

  /**
   * Add error for analysis
   */
  addError(error: ErrorEntry): void {
    this.errors.push(error);
  }

  /**
   * Clear all errors
   */
  clearErrors(): void {
    this.errors = [];
    this.errorPatterns.clear();
  }

  /**
   * Get errors by severity
   */
  getErrorsBySeverity(severity: 'critical' | 'high' | 'medium' | 'low'): ErrorEntry[] {
    return this.errors.filter(e =>
      this.determineSeverity(e.message) === severity
    );
  }
}

export default ErrorSurfaceAnalyzer;
