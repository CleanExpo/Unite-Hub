/**
 * AI Security Manager Implementation
 * Unite Group AI Gateway - Security and Compliance Management
 */

import {
  AIRequest,
  AIResponse,
  AIContentModerationResult,
  AIAuditLog,
  AISecurityConfig,
  AIContentCategory,
  AIContentCategoryType
} from '../types';

export class AISecurityManager {
  private config: AISecurityConfig;
  private auditLogs: Map<string, AIAuditLog> = new Map();
  private blockedPatterns: RegExp[] = [];

  constructor(config?: Partial<AISecurityConfig>) {
    this.config = {
      enableContentFiltering: true,
      enablePIIDetection: true,
      enableAuditLogging: true,
      dataRetentionDays: 90,
      allowedDomains: [],
      blockedPatterns: [],
      complianceMode: 'GDPR',
      ...config
    };

    this.initializeBlockedPatterns();
  }

  /**
   * Validate AI request for security compliance
   */
  async validateRequest(request: AIRequest): Promise<void> {
    if (!this.config.enableContentFiltering) {
      return;
    }

    // Check for blocked patterns
    await this.checkBlockedPatterns(request.prompt);

    // Check for PII if enabled
    if (this.config.enablePIIDetection) {
      await this.detectPII(request.prompt);
    }

    // Domain validation if specified
    if (this.config.allowedDomains && this.config.allowedDomains.length > 0) {
      // This would check if request comes from allowed domains
      // For now, we'll skip this check
    }
  }

  /**
   * Moderate content for safety and compliance
   */
  async moderateContent(content: string): Promise<AIContentModerationResult> {
    const categories: AIContentCategory[] = [];
    let safe = true;
    const reasons: string[] = [];

    // Check for hate speech
    const hateScore = this.detectHateSpeech(content);
    if (hateScore > 0.5) {
      categories.push({
        category: 'hate_speech',
        score: hateScore,
        severity: hateScore > 0.8 ? 'high' : 'medium'
      });
      safe = false;
      reasons.push('Contains potential hate speech');
    }

    // Check for harassment
    const harassmentScore = this.detectHarassment(content);
    if (harassmentScore > 0.5) {
      categories.push({
        category: 'harassment',
        score: harassmentScore,
        severity: harassmentScore > 0.8 ? 'high' : 'medium'
      });
      safe = false;
      reasons.push('Contains potential harassment');
    }

    // Check for violence
    const violenceScore = this.detectViolence(content);
    if (violenceScore > 0.5) {
      categories.push({
        category: 'violence',
        score: violenceScore,
        severity: violenceScore > 0.8 ? 'high' : 'medium'
      });
      safe = false;
      reasons.push('Contains violent content');
    }

    // Check for sexual content
    const sexualScore = this.detectSexualContent(content);
    if (sexualScore > 0.5) {
      categories.push({
        category: 'sexual_content',
        score: sexualScore,
        severity: sexualScore > 0.8 ? 'high' : 'medium'
      });
      safe = false;
      reasons.push('Contains sexual content');
    }

    // Check for personal information
    const piiScore = this.detectPersonalInfo(content);
    if (piiScore > 0.5) {
      categories.push({
        category: 'personal_information',
        score: piiScore,
        severity: piiScore > 0.8 ? 'high' : 'medium'
      });
      safe = false;
      reasons.push('Contains personal information');
    }

    // Overall confidence calculation
    const confidence = categories.length > 0 
      ? categories.reduce((sum, cat) => sum + cat.score, 0) / categories.length
      : 0.95; // High confidence if no issues detected

    return {
      safe,
      categories,
      confidence,
      reasons,
      suggestions: safe ? [] : this.generateSafetyRecommendations(categories)
    };
  }

  /**
   * Log AI request for audit purposes
   */
  async logRequest(request: AIRequest, response?: AIResponse): Promise<void> {
    if (!this.config.enableAuditLogging) {
      return;
    }

    const auditLog: AIAuditLog = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      userId: request.userId,
      sessionId: request.metadata?.sessionId as string,
      requestId: request.id,
      provider: request.provider,
      requestType: request.type,
      promptHash: this.hashContent(request.prompt),
      responseHash: response ? this.hashContent(response.content) : '',
      usage: response?.usage || {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        model: 'unknown'
      },
      ipAddress: request.metadata?.ipAddress as string,
      userAgent: request.metadata?.userAgent as string,
      metadata: {
        contentLength: request.prompt.length,
        responseLength: response?.content.length || 0,
        processingTime: response?.processingTime || 0,
        cached: response?.cached || false
      }
    };

    this.auditLogs.set(auditLog.id, auditLog);
    this.cleanupOldAuditLogs();
  }

  /**
   * Get audit logs with optional filtering
   */
  async getAuditLogs(filter?: Record<string, unknown>): Promise<AIAuditLog[]> {
    let logs = Array.from(this.auditLogs.values());

    if (filter) {
      logs = logs.filter(log => {
        for (const [key, value] of Object.entries(filter)) {
          if (key === 'userId' && log.userId !== value) return false;
          if (key === 'provider' && log.provider !== value) return false;
          if (key === 'requestType' && log.requestType !== value) return false;
          if (key === 'startDate' && new Date(log.timestamp) < new Date(value as string)) return false;
          if (key === 'endDate' && new Date(log.timestamp) > new Date(value as string)) return false;
        }
        return true;
      });
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Check for blocked patterns in content
   */
  private async checkBlockedPatterns(content: string): Promise<void> {
    for (const pattern of this.blockedPatterns) {
      if (pattern.test(content)) {
        throw new Error(`Content contains blocked pattern: ${pattern.source}`);
      }
    }
  }

  /**
   * Detect personally identifiable information
   */
  private async detectPII(content: string): Promise<void> {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email pattern
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card pattern
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone number pattern
    ];

    for (const pattern of piiPatterns) {
      if (pattern.test(content)) {
        throw new Error('Content contains personally identifiable information');
      }
    }
  }

  /**
   * Initialize blocked patterns from configuration
   */
  private initializeBlockedPatterns(): void {
    if (this.config.blockedPatterns) {
      this.blockedPatterns = this.config.blockedPatterns.map(pattern => new RegExp(pattern, 'i'));
    }

    // Add default blocked patterns
    this.blockedPatterns.push(
      /\b(password|api[_-]?key|secret|token)\s*[:=]\s*\S+/i,
      /\b(credit[_-]?card|ssn|social[_-]?security)\b/i,
      // Add more patterns as needed
    );
  }

  /**
   * Detect hate speech (simplified implementation)
   */
  private detectHateSpeech(content: string): number {
    const hateSpeechKeywords = [
      'hate', 'racist', 'discrimination', 'supremacist', 'nazi',
      'terrorist', 'extremist', 'bigot', 'xenophobic'
    ];

    const lowerContent = content.toLowerCase();
    let score = 0;

    for (const keyword of hateSpeechKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Detect harassment (simplified implementation)
   */
  private detectHarassment(content: string): number {
    const harassmentKeywords = [
      'bully', 'threaten', 'harass', 'stalk', 'intimidate',
      'abuse', 'torment', 'persecute'
    ];

    const lowerContent = content.toLowerCase();
    let score = 0;

    for (const keyword of harassmentKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Detect violence (simplified implementation)
   */
  private detectViolence(content: string): number {
    const violenceKeywords = [
      'kill', 'murder', 'assault', 'attack', 'violence',
      'weapon', 'bomb', 'shoot', 'stab', 'hurt'
    ];

    const lowerContent = content.toLowerCase();
    let score = 0;

    for (const keyword of violenceKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.2;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Detect sexual content (simplified implementation)
   */
  private detectSexualContent(content: string): number {
    const sexualKeywords = [
      'explicit', 'pornographic', 'sexual', 'nude', 'erotic'
    ];

    const lowerContent = content.toLowerCase();
    let score = 0;

    for (const keyword of sexualKeywords) {
      if (lowerContent.includes(keyword)) {
        score += 0.3;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Detect personal information (simplified implementation)
   */
  private detectPersonalInfo(content: string): number {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/ // Phone
    ];

    let score = 0;

    for (const pattern of piiPatterns) {
      if (pattern.test(content)) {
        score += 0.4;
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Generate safety recommendations
   */
  private generateSafetyRecommendations(categories: AIContentCategory[]): string[] {
    const recommendations: string[] = [];

    for (const category of categories) {
      switch (category.category) {
        case 'hate_speech':
          recommendations.push('Remove or rephrase language that could be considered hate speech');
          break;
        case 'harassment':
          recommendations.push('Avoid language that could be interpreted as harassment or bullying');
          break;
        case 'violence':
          recommendations.push('Remove references to violence or threatening behavior');
          break;
        case 'sexual_content':
          recommendations.push('Remove explicit or inappropriate sexual content');
          break;
        case 'personal_information':
          recommendations.push('Remove or redact personally identifiable information');
          break;
        default:
          recommendations.push('Review content for potential policy violations');
      }
    }

    return recommendations;
  }

  /**
   * Hash content for audit logging
   */
  private hashContent(content: string): string {
    // Simple hash function for audit purposes
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clean up old audit logs based on retention policy
   */
  private cleanupOldAuditLogs(): void {
    const cutoffTime = new Date(Date.now() - this.config.dataRetentionDays * 24 * 60 * 60 * 1000);

    for (const [id, log] of this.auditLogs.entries()) {
      if (new Date(log.timestamp) < cutoffTime) {
        this.auditLogs.delete(id);
      }
    }
  }

  /**
   * Export audit logs for compliance reporting
   */
  async exportAuditLogs(timeRange?: { start: string; end: string }): Promise<{
    logs: AIAuditLog[];
    metadata: {
      exportedAt: string;
      totalRecords: number;
      timeRange?: { start: string; end: string };
      complianceMode: string;
    };
  }> {
    let logs = Array.from(this.auditLogs.values());

    if (timeRange) {
      const startTime = new Date(timeRange.start);
      const endTime = new Date(timeRange.end);
      
      logs = logs.filter(log => {
        const logTime = new Date(log.timestamp);
        return logTime >= startTime && logTime <= endTime;
      });
    }

    return {
      logs: logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: logs.length,
        timeRange,
        complianceMode: this.config.complianceMode || 'GDPR'
      }
    };
  }

  /**
   * Generate compliance report
   */
  async generateComplianceReport(): Promise<{
    summary: {
      totalRequests: number;
      blockedRequests: number;
      flaggedContent: number;
      dataRetentionCompliance: boolean;
    };
    details: {
      contentModerationStats: Record<AIContentCategoryType, number>;
      auditLogRetention: {
        oldestRecord: string;
        newestRecord: string;
        totalRecords: number;
      };
      securityIncidents: number;
    };
  }> {
    const logs = Array.from(this.auditLogs.values());
    
    // Calculate content moderation stats
    const contentModerationStats: Record<AIContentCategoryType, number> = {
      hate_speech: 0,
      harassment: 0,
      violence: 0,
      sexual_content: 0,
      illegal_activity: 0,
      spam: 0,
      personal_information: 0,
      financial_information: 0,
      medical_information: 0,
      copyrighted_content: 0
    };

    // This would be populated from actual moderation results
    // For now, we'll return zero values

    const sortedLogs = logs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    return {
      summary: {
        totalRequests: logs.length,
        blockedRequests: 0, // Would be tracked separately
        flaggedContent: 0, // Would be tracked separately
        dataRetentionCompliance: true
      },
      details: {
        contentModerationStats,
        auditLogRetention: {
          oldestRecord: sortedLogs[0]?.timestamp || '',
          newestRecord: sortedLogs[sortedLogs.length - 1]?.timestamp || '',
          totalRecords: logs.length
        },
        securityIncidents: 0 // Would be tracked separately
      }
    };
  }

  /**
   * Update security configuration
   */
  updateConfig(updates: Partial<AISecurityConfig>): void {
    this.config = { ...this.config, ...updates };
    
    if (updates.blockedPatterns) {
      this.initializeBlockedPatterns();
    }
  }

  /**
   * Get security configuration
   */
  getConfig(): AISecurityConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  async destroy(): Promise<void> {
    this.auditLogs.clear();
    this.blockedPatterns = [];
  }
}

export default AISecurityManager;
