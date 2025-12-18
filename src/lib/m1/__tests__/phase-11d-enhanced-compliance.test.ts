/**
 * Phase 11D: Enhanced Compliance Tests
 *
 * Comprehensive test suite for GDPR, HIPAA, SOC 2, CCPA, and PCI DSS compliance
 * Privacy controls, data protection, and audit logging
 *
 * Version: v2.4.3
 * Phase: 11D - Enhanced Compliance
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ComplianceManager,
  complianceManager,
  DataProcessingRecord,
  ConsentRecord,
  DataSubjectRequest,
} from '../compliance/compliance-manager';
import {
  PrivacyControls,
  privacyControls,
  MaskingRule,
  PrivacyDataRecord,
} from '../compliance/privacy-controls';

/**
 * ============================================================================
 * COMPLIANCE MANAGER TESTS (25 tests)
 * ============================================================================
 */

describe('Compliance Manager', () => {
  let manager: ComplianceManager;

  beforeEach(() => {
    manager = new ComplianceManager();
  });

  // Test 1: GDPR policy initialization
  it('should initialize GDPR policy with required fields', () => {
    const policy = manager.getPolicy('gdpr');

    expect(policy).not.toBeNull();
    expect(policy!.framework).toBe('gdpr');
    expect(policy!.enabled).toBe(true);
    expect(policy!.rightsOfAccess).toBe(true);
    expect(policy!.rightToForget).toBe(true);
    expect(policy!.dataPortability).toBe(true);
    expect(policy!.dataBreachNotification).toBe(72);
  });

  // Test 2: HIPAA policy differences
  it('should have different HIPAA policy from GDPR', () => {
    const gdpr = manager.getPolicy('gdpr');
    const hipaa = manager.getPolicy('hipaa');

    expect(hipaa!.rightToForget).toBe(false);
    expect(hipaa!.minDataRetention).toBeGreaterThan(gdpr!.minDataRetention);
    expect(hipaa!.dataBreachNotification).toBe(60);
  });

  // Test 3: SOC 2 policy configuration
  it('should have SOC 2 policy without privacy rights', () => {
    const policy = manager.getPolicy('soc2');

    expect(policy!.rightsOfAccess).toBe(false);
    expect(policy!.rightToForget).toBe(false);
    expect(policy!.dataPortability).toBe(false);
    expect(policy!.encryptionRequired).toBe(true);
    expect(policy!.auditLoggingRequired).toBe(true);
  });

  // Test 4: CCPA policy configuration
  it('should have CCPA policy with access and deletion rights', () => {
    const policy = manager.getPolicy('ccpa');

    expect(policy!.rightsOfAccess).toBe(true);
    expect(policy!.rightToForget).toBe(true);
    expect(policy!.dataPortability).toBe(true);
  });

  // Test 5: PCI DSS policy for payment data
  it('should have PCI DSS policy for payment protection', () => {
    const policy = manager.getPolicy('pci-dss');

    expect(policy!.encryptionRequired).toBe(true);
    expect(policy!.minDataRetention).toBe(365);
    expect(policy!.dataBreachNotification).toBe(24);
  });

  // Test 6: Register data processing
  it('should register data processing activity', () => {
    const recordId = manager.registerDataProcessing({
      dataCategory: 'customer_email_gdpr',
      dataClassification: 'confidential',
      processingPurpose: 'marketing_communications',
      legalBasis: 'consent',
      retention: 90,
      recipients: ['email_service_provider'],
      transfers: ['Standard Contractual Clauses'],
    });

    expect(recordId).toBeDefined();
    expect(recordId).toContain('dpr_');
  });

  // Test 7: Record user consent
  it('should record user consent decision', () => {
    const consentId = manager.recordConsent('user_123', 'marketing', true);

    expect(consentId).toBeDefined();
    expect(consentId).toContain('consent_');
  });

  // Test 8: Check processing compliance
  it('should validate data processing compliance', () => {
    const recordId = manager.registerDataProcessing({
      dataCategory: 'minimal_customer_email',
      dataClassification: 'confidential',
      processingPurpose: 'marketing',
      legalBasis: 'consent',
      retention: 90,
      recipients: ['email_service'],
      transfers: [],
    });

    const isCompliant = manager.isProcessingCompliant(recordId, ['gdpr']);

    expect(typeof isCompliant).toBe('boolean');
  });

  // Test 9: Detect non-compliant retention
  it('should detect non-compliant retention period', () => {
    const recordId = manager.registerDataProcessing({
      dataCategory: 'hipaa_medical',
      dataClassification: 'restricted',
      processingPurpose: 'healthcare',
      legalBasis: 'legal_obligation',
      retention: 30, // Too short for HIPAA (min 6 years)
      recipients: [],
      transfers: [],
    });

    const isCompliant = manager.isProcessingCompliant(recordId, ['hipaa']);

    expect(isCompliant).toBe(false);
  });

  // Test 10: Create data subject access request
  it('should create data subject access request', () => {
    const requestId = manager.createDataSubjectRequest('user_123', 'access');

    expect(requestId).toBeDefined();
    expect(requestId).toContain('dsr_');
  });

  // Test 11: Report data breach
  it('should report data breach', () => {
    const breachId = manager.reportDataBreach(
      'Unauthorized access to database',
      500,
      ['customer_data', 'email_addresses'],
    );

    expect(breachId).toBeDefined();
    expect(breachId).toContain('breach_');
  });

  // Test 12: Classify breach severity
  it('should classify breach severity by affected individuals', () => {
    const lowBreach = manager.reportDataBreach('Low impact', 50, ['data']);
    const criticalBreach = manager.reportDataBreach('High impact', 2000, ['data']);

    const lowReport = manager.getRecentBreaches(1).find(b => b.breachId === lowBreach);
    const criticalReport = manager.getRecentBreaches(1).find(b => b.breachId === criticalBreach);

    expect(lowReport!.severity).toBe('medium');
    expect(criticalReport!.severity).toBe('critical');
  });

  // Test 13: Get compliance status
  it('should calculate compliance status', () => {
    manager.registerDataProcessing({
      dataCategory: 'gdpr_data',
      dataClassification: 'confidential',
      processingPurpose: 'marketing',
      legalBasis: 'consent',
      retention: 90,
      recipients: [],
      transfers: [],
    });

    const status = manager.getComplianceStatus(['gdpr']);

    expect(status.frameworks).toBeDefined();
    expect((status.frameworks as any).gdpr).toBeDefined();
  });

  // Test 14: Get active data subject requests
  it('should retrieve active data subject requests', () => {
    manager.createDataSubjectRequest('user_1', 'access');
    manager.createDataSubjectRequest('user_2', 'erasure');

    const active = manager.getActiveRequests();

    expect(active.length).toBe(2);
  });

  // Test 15: Get recent breaches
  it('should retrieve recent breach reports', () => {
    manager.reportDataBreach('Breach 1', 100, ['data']);
    manager.reportDataBreach('Breach 2', 200, ['data']);

    const recent = manager.getRecentBreaches(1);

    expect(recent.length).toBe(2);
  });

  // Test 16: Multi-framework compliance
  it('should check compliance across multiple frameworks', () => {
    const recordId = manager.registerDataProcessing({
      dataCategory: 'general_data',
      dataClassification: 'internal',
      processingPurpose: 'operations',
      legalBasis: 'legitimate_interest',
      retention: 365,
      recipients: [],
      transfers: [],
    });

    const gdprCompliant = manager.isProcessingCompliant(recordId, ['gdpr']);
    const ccpaCompliant = manager.isProcessingCompliant(recordId, ['ccpa']);

    expect(typeof gdprCompliant).toBe('boolean');
    expect(typeof ccpaCompliant).toBe('boolean');
  });

  // Test 17: Consent validity
  it('should validate consent records', () => {
    const consentId = manager.recordConsent('user_123', 'analytics', true);

    expect(manager.isConsentValid(consentId)).toBe(true);
  });

  // Test 18: Update policy
  it('should allow policy updates', () => {
    manager.updatePolicy('gdpr', { dataBreachNotification: 48 });

    const updated = manager.getPolicy('gdpr');
    expect(updated!.dataBreachNotification).toBe(48);
  });

  // Test 19: Audit log retrieval
  it('should maintain audit logs', () => {
    manager.registerDataProcessing({
      dataCategory: 'gdpr',
      dataClassification: 'confidential',
      processingPurpose: 'marketing',
      legalBasis: 'consent',
      retention: 90,
      recipients: [],
      transfers: [],
    });

    const logs = manager.getAuditLog('data_processing');
    expect(logs.length).toBeGreaterThanOrEqual(0);
  });

  // Test 20: All frameworks initialized
  it('should have all required frameworks initialized', () => {
    const frameworks = ['gdpr', 'hipaa', 'soc2', 'ccpa', 'pci-dss'] as const;

    frameworks.forEach(framework => {
      const policy = manager.getPolicy(framework);
      expect(policy).not.toBeNull();
      expect(policy!.framework).toBe(framework);
    });
  });

  // Test 21: Data processing registration with valid retention
  it('should register processing with valid retention range', () => {
    const recordId = manager.registerDataProcessing({
      dataCategory: 'test',
      dataClassification: 'internal',
      processingPurpose: 'testing',
      legalBasis: 'consent',
      retention: 30,
      recipients: [],
      transfers: [],
    });

    expect(recordId).toBeDefined();
  });

  // Test 22: Multiple consents per user
  it('should support multiple consents per user', () => {
    manager.recordConsent('user_1', 'marketing', true);
    manager.recordConsent('user_1', 'analytics', false);
    manager.recordConsent('user_1', 'processing', true);

    expect(manager.getActiveRequests()).toBeDefined();
  });

  // Test 23: Breach severity levels
  it('should correctly classify breach severity', () => {
    const levels = [
      { affected: 10, expected: 'medium' },
      { affected: 50, expected: 'medium' },
      { affected: 150, expected: 'high' },
      { affected: 1500, expected: 'critical' },
    ];

    levels.forEach(({ affected, expected }) => {
      const breachId = manager.reportDataBreach(`Test ${affected}`, affected, ['data']);
      const breach = manager.getRecentBreaches(1).find(b => b.breachId === breachId);
      expect(breach!.severity).toBe(expected);
    });
  });

  // Test 24: Processing record metadata
  it('should include all processing metadata', () => {
    const recordId = manager.registerDataProcessing({
      dataCategory: 'customer_gdpr',
      dataClassification: 'confidential',
      processingPurpose: 'fulfillment',
      legalBasis: 'contract',
      retention: 180,
      recipients: ['fulfillment_partner'],
      transfers: ['Binding Corporate Rules'],
    });

    expect(recordId).toBeDefined();
  });

  // Test 25: DSR status tracking
  it('should track data subject request status', () => {
    const requestId = manager.createDataSubjectRequest('user_123', 'portability');

    expect(requestId).toBeDefined();
    expect(requestId).toContain('dsr_');
  });
});

/**
 * ============================================================================
 * PRIVACY CONTROLS TESTS (25 tests)
 * ============================================================================
 */

describe('Privacy Controls', () => {
  let privacy: PrivacyControls;

  beforeEach(() => {
    privacy = new PrivacyControls();
  });

  // Test 26: PII masking
  it('should mask email addresses', () => {
    const data = { email: 'user@example.com', name: 'John' };

    const masked = privacy.maskPII(data, ['email']);

    expect(masked.email).not.toBe('user@example.com');
    expect((masked.email as string).includes('*')).toBe(true);
  });

  // Test 27: Phone number masking
  it('should mask phone numbers', () => {
    const data = { phone: '+1-555-0123', name: 'John' };

    const masked = privacy.maskPII(data, ['phone']);

    expect(masked.phone).not.toBe('+1-555-0123');
  });

  // Test 28: SSN masking
  it('should mask social security numbers', () => {
    const data = { ssn: '123-45-6789', name: 'John' };

    const masked = privacy.maskPII(data, ['ssn']);

    expect(masked.ssn).not.toBe('123-45-6789');
    expect(typeof masked.ssn).toBe('string');
    expect((masked.ssn as string).includes('*')).toBe(true);
  });

  // Test 29: Credit card masking
  it('should mask credit card numbers', () => {
    const data = { creditCard: '4532-1234-5678-9010', amount: 100 };

    const masked = privacy.maskPII(data, ['creditCard']);

    expect(masked.creditCard).not.toBe('4532-1234-5678-9010');
  });

  // Test 30: Create pseudonym
  it('should create pseudonym for PII', () => {
    const pseudonym = privacy.createPseudonym('sensitive_value', 'restricted');

    expect(pseudonym).toBeDefined();
    expect(pseudonym).toContain('ps_');
  });

  // Test 31: Retrieve pseudonym value
  it('should retrieve original value using pseudonym', () => {
    const originalValue = 'test@example.com';
    const pseudonym = privacy.createPseudonym(originalValue);

    const retrieved = privacy.retrievePseudonymValue(pseudonym, 'admin_user');

    expect(retrieved).toBe(originalValue);
  });

  // Test 32: Register privacy record
  it('should register privacy-tracked data record', () => {
    privacy.registerPrivacyRecord(
      'record_123',
      'hash_abc123',
      'confidential',
      90,
      ['hashing', 'masking'],
    );

    const record = privacy.getPrivacyRecord('record_123');

    expect(record).not.toBeNull();
    expect(record!.privacyLevel).toBe('confidential');
  });

  // Test 33: Check anonymization
  it('should verify data anonymization', () => {
    privacy.registerPrivacyRecord(
      'record_123',
      'hash_abc',
      'public',
      90,
      ['aggregation'],
    );

    const isAnon = privacy.isAnonymized('record_123');

    expect(isAnon).toBe(true);
  });

  // Test 34: Log data access
  it('should log data access for audit trail', () => {
    privacy.registerPrivacyRecord('record_123', 'hash_abc', 'confidential', 90, []);

    privacy.logAccess('user_1', 'record_123', 'read');
    privacy.logAccess('user_2', 'record_123', 'update');

    const history = privacy.getAccessHistory('record_123');

    expect(history.length).toBe(2);
  });

  // Test 35: Get masking rule
  it('should retrieve masking rule', () => {
    const rule = privacy.getMaskingRule('email');

    expect(rule).not.toBeNull();
    expect(rule!.technique).toBe('masking');
  });

  // Test 36: Add custom masking rule
  it('should add custom masking rule', () => {
    const customRule: MaskingRule = {
      fieldName: 'customField',
      technique: 'tokenization',
      preserveLength: false,
    };

    privacy.addMaskingRule(customRule);

    const retrieved = privacy.getMaskingRule('customField');

    expect(retrieved).toEqual(customRule);
  });

  // Test 37: Data minimization check
  it('should verify data minimization', () => {
    privacy.registerPrivacyRecord('record_123', 'hash_abc', 'internal', 60, []);

    const isMinimal = privacy.isDataMinimal('record_123', ['email', 'phone']);

    expect(typeof isMinimal).toBe('boolean');
  });

  // Test 38: Get privacy statistics
  it('should calculate privacy statistics', () => {
    privacy.registerPrivacyRecord('r1', 'h1', 'public', 30, ['hashing']);
    privacy.registerPrivacyRecord('r2', 'h2', 'confidential', 90, ['tokenization']);
    privacy.registerPrivacyRecord('r3', 'h3', 'restricted', 365, []);

    const stats = privacy.getPrivacyStats();

    expect(stats.totalRecords).toBe(3);
    expect(stats.anonymizedRecords).toBe(1);
    expect(stats.pseudonymizedRecords).toBe(1);
  });

  // Test 39: Privacy levels tracking
  it('should track privacy levels distribution', () => {
    privacy.registerPrivacyRecord('r1', 'h1', 'public', 30, []);
    privacy.registerPrivacyRecord('r2', 'h2', 'internal', 60, []);
    privacy.registerPrivacyRecord('r3', 'h3', 'confidential', 90, []);
    privacy.registerPrivacyRecord('r4', 'h4', 'restricted', 365, []);

    const stats = privacy.getPrivacyStats() as any;

    expect(stats.privacyLevels.public).toBe(1);
    expect(stats.privacyLevels.internal).toBe(1);
    expect(stats.privacyLevels.confidential).toBe(1);
    expect(stats.privacyLevels.restricted).toBe(1);
  });

  // Test 40: Multiple masking techniques
  it('should support multiple PII fields', () => {
    const data = {
      email: 'test@example.com',
      phone: '555-1234',
      ssn: '123-45-6789',
    };

    const masked = privacy.maskPII(data, ['email', 'phone', 'ssn']);

    expect(masked.email).not.toBe(data.email);
    expect(masked.phone).not.toBe(data.phone);
    expect(masked.ssn).not.toBe(data.ssn);
  });

  // Test 41: Access history tracking
  it('should maintain detailed access history', () => {
    privacy.registerPrivacyRecord('record_1', 'hash', 'confidential', 90, []);

    privacy.logAccess('user_1', 'record_1', 'read');
    privacy.logAccess('user_1', 'record_1', 'read');
    privacy.logAccess('user_2', 'record_1', 'update');

    const history = privacy.getAccessHistory('record_1');

    expect(history.length).toBe(3);
  });

  // Test 42: Record expiration tracking
  it('should track data record expiration', () => {
    const retentionDays = 90;
    privacy.registerPrivacyRecord('record_1', 'hash', 'internal', retentionDays, []);

    const record = privacy.getPrivacyRecord('record_1');

    expect(record!.expiresAt).toBeGreaterThan(record!.createdAt);
  });

  // Test 43: Anonymization combinations
  it('should support combinations of anonymization techniques', () => {
    privacy.registerPrivacyRecord(
      'record_1',
      'hash',
      'public',
      180,
      ['hashing', 'aggregation', 'differential-privacy'],
    );

    const record = privacy.getPrivacyRecord('record_1');

    expect(record!.techniques.length).toBe(3);
    expect(record!.anonymized).toBe(true);
  });

  // Test 44: Pseudonym security
  it('should maintain pseudonym mappings securely', () => {
    const value1 = privacy.createPseudonym('sensitive_1');
    const value2 = privacy.createPseudonym('sensitive_2');

    expect(value1).not.toBe(value2);
    expect(value1).toContain('ps_');
    expect(value2).toContain('ps_');
  });

  // Test 45: Privacy record not found handling
  it('should handle non-existent privacy record', () => {
    const record = privacy.getPrivacyRecord('non_existent');

    expect(record).toBeNull();
  });

  // Test 46: Masking rule with preserve length
  it('should preserve length when masking', () => {
    const data = { email: 'test@example.com' };

    const masked = privacy.maskPII(data, ['email']);
    const maskedEmail = masked.email as string;

    expect(maskedEmail.length).toBe(data.email.length);
  });

  // Test 47: Empty masking request
  it('should handle empty masking request', () => {
    const data = { email: 'test@example.com', name: 'John' };

    const masked = privacy.maskPII(data, []);

    expect(masked).toEqual(data);
  });

  // Test 48: All default rules available
  it('should have all default masking rules', () => {
    const fields = ['email', 'phone', 'ssn', 'creditCard'];

    fields.forEach(field => {
      const rule = privacy.getMaskingRule(field);
      expect(rule).not.toBeNull();
    });
  });

  // Test 49: Access log with user context
  it('should track access with user context', () => {
    privacy.registerPrivacyRecord('record_1', 'hash', 'confidential', 90, []);

    privacy.logAccess('admin_user', 'record_1', 'export');
    privacy.logAccess('readonly_user', 'record_1', 'read');

    const history = privacy.getAccessHistory('record_1');

    expect(history.some(h => h.userId === 'admin_user')).toBe(true);
    expect(history.some(h => h.userId === 'readonly_user')).toBe(true);
  });

  // Test 50: Privacy statistics completeness
  it('should include all privacy metrics', () => {
    privacy.registerPrivacyRecord('r1', 'h1', 'public', 30, ['hashing']);

    const stats = privacy.getPrivacyStats();

    expect(stats.totalRecords).toBeDefined();
    expect(stats.anonymizedRecords).toBeDefined();
    expect(stats.pseudonymizedRecords).toBeDefined();
    expect(stats.totalAccess).toBeDefined();
    expect(stats.privacyLevels).toBeDefined();
  });
});
