/**
 * M1 Compliance Manager
 *
 * Manages GDPR, HIPAA, and SOC 2 compliance requirements
 * Enforces privacy-by-design, data retention, and audit logging
 *
 * Version: v2.4.3
 * Phase: 11D - Enhanced Compliance
 */

/**
 * Compliance framework types
 */
export type ComplianceFramework = 'gdpr' | 'hipaa' | 'soc2' | 'ccpa' | 'pci-dss';
export type DataClassification = 'public' | 'internal' | 'confidential' | 'restricted';
export type ConsentType = 'marketing' | 'analytics' | 'processing' | 'storage';

/**
 * Compliance policy
 */
export interface CompliancePolicy {
  framework: ComplianceFramework;
  enabled: boolean;
  minDataRetention: number;     // days
  maxDataRetention: number;     // days
  encryptionRequired: boolean;
  auditLoggingRequired: boolean;
  dataMinimization: boolean;
  rightsOfAccess: boolean;
  rightToForget: boolean;
  dataPortability: boolean;
  consentRequired: boolean;
  privacyByDesign: boolean;
  dataBreachNotification: number; // hours
}

/**
 * Data processing agreement
 */
export interface DataProcessingRecord {
  recordId: string;
  dataCategory: string;
  dataClassification: DataClassification;
  processingPurpose: string;
  legalBasis: string;
  retention: number;            // days
  recipients: string[];         // processors
  transfers: string[];          // transfer mechanisms (Standard Contractual Clauses, etc.)
  timestamp: number;
  expires: number;
}

/**
 * Consent record
 */
export interface ConsentRecord {
  consentId: string;
  userId: string;
  consentType: ConsentType;
  granted: boolean;
  timestamp: number;
  expiresAt?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Data subject rights request
 */
export interface DataSubjectRequest {
  requestId: string;
  userId: string;
  requestType: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction' | 'objection';
  status: 'received' | 'processing' | 'completed' | 'denied';
  createdAt: number;
  completedAt?: number;
  responseData?: Record<string, unknown>;
  denyReason?: string;
}

/**
 * Data breach report
 */
export interface DataBreachReport {
  breachId: string;
  discoveredAt: number;
  reportedAt: number;
  description: string;
  affectedIndividuals: number;
  dataCategories: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  mitigationMeasures: string[];
  status: 'reported' | 'investigating' | 'resolved';
}

/**
 * Compliance Manager
 */
export class ComplianceManager {
  private policies: Map<ComplianceFramework, CompliancePolicy> = new Map();
  private processingRecords: Map<string, DataProcessingRecord> = new Map();
  private consentRecords: Map<string, ConsentRecord> = new Map();
  private subjectRequests: Map<string, DataSubjectRequest> = new Map();
  private breachReports: Map<string, DataBreachReport> = new Map();
  private auditLog: Map<string, unknown[]> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
    this.initializeAuditLogs();
  }

  /**
   * Initialize audit log categories
   */
  private initializeAuditLogs(): void {
    this.auditLog.set('data_processing', []);
    this.auditLog.set('consent', []);
    this.auditLog.set('data_subject_requests', []);
    this.auditLog.set('data_breaches', []);
  }

  /**
   * Initialize default compliance policies
   */
  private initializeDefaultPolicies(): void {
    // GDPR policy
    this.policies.set('gdpr', {
      framework: 'gdpr',
      enabled: true,
      minDataRetention: 0,
      maxDataRetention: 2555,      // 7 years
      encryptionRequired: true,
      auditLoggingRequired: true,
      dataMinimization: true,
      rightsOfAccess: true,
      rightToForget: true,
      dataPortability: true,
      consentRequired: true,
      privacyByDesign: true,
      dataBreachNotification: 72,  // 72 hours
    });

    // HIPAA policy
    this.policies.set('hipaa', {
      framework: 'hipaa',
      enabled: true,
      minDataRetention: 6 * 365,   // 6 years minimum
      maxDataRetention: 10 * 365,  // 10 years maximum
      encryptionRequired: true,
      auditLoggingRequired: true,
      dataMinimization: false,     // Not required by HIPAA
      rightsOfAccess: true,
      rightToForget: false,        // Not permitted under HIPAA
      dataPortability: true,
      consentRequired: false,       // Authorization instead
      privacyByDesign: true,
      dataBreachNotification: 60,  // 60 days
    });

    // SOC 2 policy
    this.policies.set('soc2', {
      framework: 'soc2',
      enabled: true,
      minDataRetention: 90,
      maxDataRetention: 2555,      // 7 years
      encryptionRequired: true,
      auditLoggingRequired: true,
      dataMinimization: true,
      rightsOfAccess: false,       // Not SOC 2 requirement
      rightToForget: false,        // Not SOC 2 requirement
      dataPortability: false,      // Not SOC 2 requirement
      consentRequired: false,      // Not SOC 2 requirement
      privacyByDesign: true,
      dataBreachNotification: 24,  // 24 hours for SOC 2
    });

    // CCPA policy
    this.policies.set('ccpa', {
      framework: 'ccpa',
      enabled: true,
      minDataRetention: 0,
      maxDataRetention: 365,       // 1 year
      encryptionRequired: true,
      auditLoggingRequired: true,
      dataMinimization: true,
      rightsOfAccess: true,
      rightToForget: true,
      dataPortability: true,
      consentRequired: false,      // Opt-out instead
      privacyByDesign: true,
      dataBreachNotification: 72,  // 72 hours
    });

    // PCI DSS policy
    this.policies.set('pci-dss', {
      framework: 'pci-dss',
      enabled: true,
      minDataRetention: 365,
      maxDataRetention: 3 * 365,   // 3 years
      encryptionRequired: true,
      auditLoggingRequired: true,
      dataMinimization: false,
      rightsOfAccess: false,
      rightToForget: false,
      dataPortability: false,
      consentRequired: false,
      privacyByDesign: true,
      dataBreachNotification: 24,  // 24 hours
    });
  }

  /**
   * Register data processing activity
   */
  registerDataProcessing(record: Omit<DataProcessingRecord, 'recordId' | 'timestamp'>): string {
    const recordId = `dpr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const processingRecord: DataProcessingRecord = {
      recordId,
      timestamp: now,
      expires: now + (record.retention * 24 * 60 * 60 * 1000),
      ...record,
    };

    this.processingRecords.set(recordId, processingRecord);

    // Log to audit trail
    this.auditLog.get('data_processing')?.push({
      action: 'register_processing',
      recordId,
      timestamp: now,
    });

    return recordId;
  }

  /**
   * Record user consent
   */
  recordConsent(userId: string, consentType: ConsentType, granted: boolean): string {
    const consentId = `consent_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const consentRecord: ConsentRecord = {
      consentId,
      userId,
      consentType,
      granted,
      timestamp: now,
      expiresAt: now + (365 * 24 * 60 * 60 * 1000), // 1 year
    };

    this.consentRecords.set(consentId, consentRecord);

    // Log consent decision
    this.auditLog.get('consent')?.push({
      action: 'record_consent',
      userId,
      consentType,
      granted,
      timestamp: now,
    });

    return consentId;
  }

  /**
   * Create data subject access request
   */
  createDataSubjectRequest(userId: string, requestType: DataSubjectRequest['requestType']): string {
    const requestId = `dsr_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const request: DataSubjectRequest = {
      requestId,
      userId,
      requestType,
      status: 'received',
      createdAt: now,
    };

    this.subjectRequests.set(requestId, request);

    // Log DSR
    this.auditLog.get('data_subject_requests')?.push({
      action: 'create_dsr',
      requestId,
      userId,
      requestType,
      timestamp: now,
    });

    return requestId;
  }

  /**
   * Report data breach
   */
  reportDataBreach(description: string, affectedIndividuals: number, dataCategories: string[]): string {
    const breachId = `breach_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const now = Date.now();

    const breach: DataBreachReport = {
      breachId,
      discoveredAt: now,
      reportedAt: now,
      description,
      affectedIndividuals,
      dataCategories,
      severity: affectedIndividuals > 1000 ? 'critical' : affectedIndividuals > 100 ? 'high' : 'medium',
      mitigationMeasures: [],
      status: 'reported',
    };

    this.breachReports.set(breachId, breach);

    // Log breach
    this.auditLog.get('data_breaches')?.push({
      action: 'report_breach',
      breachId,
      affectedIndividuals,
      severity: breach.severity,
      timestamp: now,
    });

    return breachId;
  }

  /**
   * Check if processing is compliant
   */
  isProcessingCompliant(recordId: string, frameworks: ComplianceFramework[]): boolean {
    const record = this.processingRecords.get(recordId);
    if (!record) {
return false;
}

    const now = Date.now();

    // Check retention compliance
    for (const framework of frameworks) {
      const policy = this.policies.get(framework);
      if (!policy) {
continue;
}

      const retentionDays = record.retention;

      if (retentionDays < policy.minDataRetention || retentionDays > policy.maxDataRetention) {
        return false;
      }

      // Check data minimization if required
      if (policy.dataMinimization && !record.dataCategory.includes('minimal')) {
        return false; // Simplified check
      }
    }

    return true;
  }

  /**
   * Check if consent is valid
   */
  isConsentValid(consentId: string): boolean {
    const consent = this.consentRecords.get(consentId);
    if (!consent || !consent.granted) {
return false;
}

    const now = Date.now();
    if (consent.expiresAt && now > consent.expiresAt) {
      return false; // Consent expired
    }

    return true;
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(frameworks: ComplianceFramework[]): Record<string, unknown> {
    const status: Record<string, unknown> = {
      timestamp: Date.now(),
      frameworks: {},
    };

    for (const framework of frameworks) {
      const policy = this.policies.get(framework);
      if (!policy) {
continue;
}

      const records = Array.from(this.processingRecords.values()).filter(
        r => r.dataCategory.includes(framework),
      );

      const compliantRecords = records.filter(r => this.isProcessingCompliant(r.recordId, [framework])).length;

      (status.frameworks as any)[framework] = {
        enabled: policy.enabled,
        totalRecords: records.length,
        compliantRecords,
        complianceRate: records.length > 0 ? (compliantRecords / records.length) * 100 : 0,
      };
    }

    return status;
  }

  /**
   * Get active data subject requests
   */
  getActiveRequests(): DataSubjectRequest[] {
    return Array.from(this.subjectRequests.values()).filter(
      r => r.status === 'received' || r.status === 'processing',
    );
  }

  /**
   * Get recent data breaches
   */
  getRecentBreaches(days: number = 30): DataBreachReport[] {
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    return Array.from(this.breachReports.values()).filter(b => b.reportedAt > cutoff);
  }

  /**
   * Get audit log
   */
  getAuditLog(category: string, limit: number = 100): unknown[] {
    return (this.auditLog.get(category) || []).slice(-limit);
  }

  /**
   * Get policy
   */
  getPolicy(framework: ComplianceFramework): CompliancePolicy | null {
    return this.policies.get(framework) || null;
  }

  /**
   * Update policy
   */
  updatePolicy(framework: ComplianceFramework, updates: Partial<CompliancePolicy>): void {
    const policy = this.policies.get(framework);
    if (policy) {
      Object.assign(policy, updates);
    }
  }
}

// Export singleton
export const complianceManager = new ComplianceManager();
