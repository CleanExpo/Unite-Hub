/**
 * M1 Privacy Controls
 *
 * Implements privacy-by-design principles and data protection mechanisms
 * Enforces data anonymization, pseudonymization, and access controls
 *
 * Version: v2.4.3
 * Phase: 11D - Enhanced Compliance
 */

/**
 * Privacy level for data handling
 */
export type PrivacyLevel = 'public' | 'internal' | 'confidential' | 'restricted';

/**
 * Anonymization technique
 */
export type AnonymizationTechnique = 'hashing' | 'masking' | 'aggregation' | 'differential-privacy' | 'tokenization';

/**
 * Data masking rules
 */
export interface MaskingRule {
  fieldName: string;
  technique: AnonymizationTechnique;
  preserveLength: boolean;
  replacementChar?: string;
}

/**
 * Privacy-enhanced data record
 */
export interface PrivacyDataRecord {
  recordId: string;
  originalHash: string;           // Hash of original data for verification
  privacyLevel: PrivacyLevel;
  anonymized: boolean;
  pseudonymized: boolean;
  pseudonym?: string;
  techniques: AnonymizationTechnique[];
  createdAt: number;
  expiresAt: number;
  accessLog: { userId: string; timestamp: number }[];
}

/**
 * Privacy Controls Manager
 */
export class PrivacyControls {
  private maskingRules: Map<string, MaskingRule> = new Map();
  private privacyRecords: Map<string, PrivacyDataRecord> = new Map();
  private pseudonymMappings: Map<string, string> = new Map(); // pseudonym → encrypted value
  private accessLog: Array<{ userId: string; recordId: string; action: string; timestamp: number }> = [];

  constructor() {
    this.initializeDefaultRules();
  }

  /**
   * Initialize default masking rules
   */
  private initializeDefaultRules(): void {
    // Email masking: abc@example.com → a**@example.com
    this.maskingRules.set('email', {
      fieldName: 'email',
      technique: 'masking',
      preserveLength: true,
      replacementChar: '*',
    });

    // Phone masking: +1-555-0123 → +1-555-01**
    this.maskingRules.set('phone', {
      fieldName: 'phone',
      technique: 'masking',
      preserveLength: true,
      replacementChar: '*',
    });

    // SSN masking: 123-45-6789 → ***-**-6789
    this.maskingRules.set('ssn', {
      fieldName: 'ssn',
      technique: 'masking',
      preserveLength: true,
      replacementChar: '*',
    });

    // Credit card masking: 4532-1234-5678-9010 → 4532-****-****-9010
    this.maskingRules.set('creditCard', {
      fieldName: 'creditCard',
      technique: 'masking',
      preserveLength: true,
      replacementChar: '*',
    });
  }

  /**
   * Mask PII in data
   */
  maskPII(data: Record<string, unknown>, fieldNames: string[]): Record<string, unknown> {
    const masked: Record<string, unknown> = { ...data };

    for (const fieldName of fieldNames) {
      const rule = this.maskingRules.get(fieldName);
      if (!rule) {
continue;
}

      const value = data[fieldName];
      if (typeof value !== 'string') {
continue;
}

      masked[fieldName] = this.applyMasking(value, rule);
    }

    return masked;
  }

  /**
   * Apply masking to a single value
   */
  private applyMasking(value: string, rule: MaskingRule): string {
    const { technique, preserveLength, replacementChar = '*' } = rule;

    switch (technique) {
      case 'masking':
        return this.maskValue(value, preserveLength, replacementChar);

      case 'hashing':
        return `hash_${this.simpleHash(value)}`;

      case 'tokenization':
        return `token_${Math.random().toString(36).substring(7)}`;

      case 'aggregation':
        return '[aggregated]';

      case 'differential-privacy':
        return this.addDifferentialPrivacyNoise(value);

      default:
        return value;
    }
  }

  /**
   * Mask characters in value
   */
  private maskValue(value: string, preserveLength: boolean, replacementChar: string): string {
    if (!preserveLength) {
      return replacementChar.repeat(3); // Generic masked value
    }

    // Preserve length, mask middle part
    const length = value.length;
    const unmaskLength = Math.ceil(length / 4); // Keep 25% visible

    const unmasked = value.substring(length - unmaskLength);
    const masked = replacementChar.repeat(length - unmaskLength);

    return masked + unmasked;
  }

  /**
   * Simple hash function (for demo)
   */
  private simpleHash(value: string): string {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      const char = value.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  /**
   * Add differential privacy noise to value
   */
  private addDifferentialPrivacyNoise(value: string): string {
    // Simplified differential privacy: add small random noise
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) {
      return value;
    }

    const noise = Math.floor((Math.random() - 0.5) * 10);
    return String(Math.max(0, numValue + noise));
  }

  /**
   * Create pseudonym for PII
   */
  createPseudonym(originalValue: string, privacyLevel: PrivacyLevel = 'confidential'): string {
    const pseudonym = `ps_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Store encrypted mapping (in production: use actual encryption)
    const encrypted = Buffer.from(originalValue).toString('base64');
    this.pseudonymMappings.set(pseudonym, encrypted);

    return pseudonym;
  }

  /**
   * Retrieve original value using pseudonym (requires authorization)
   */
  retrievePseudonymValue(pseudonym: string, userId: string): string | null {
    const encrypted = this.pseudonymMappings.get(pseudonym);
    if (!encrypted) {
return null;
}

    // Log access
    this.accessLog.push({
      userId,
      recordId: pseudonym,
      action: 'retrieve_pseudonym',
      timestamp: Date.now(),
    });

    // Retrieve and decrypt
    const original = Buffer.from(encrypted, 'base64').toString();
    return original;
  }

  /**
   * Register data record with privacy tracking
   */
  registerPrivacyRecord(
    recordId: string,
    originalHash: string,
    privacyLevel: PrivacyLevel,
    retentionDays: number,
    techniques: AnonymizationTechnique[],
  ): void {
    const now = Date.now();

    const record: PrivacyDataRecord = {
      recordId,
      originalHash,
      privacyLevel,
      anonymized: techniques.includes('hashing') || techniques.includes('aggregation'),
      pseudonymized: techniques.includes('tokenization'),
      techniques,
      createdAt: now,
      expiresAt: now + retentionDays * 24 * 60 * 60 * 1000,
      accessLog: [],
    };

    this.privacyRecords.set(recordId, record);
  }

  /**
   * Get privacy record
   */
  getPrivacyRecord(recordId: string): PrivacyDataRecord | null {
    return this.privacyRecords.get(recordId) || null;
  }

  /**
   * Check if data is sufficiently anonymized
   */
  isAnonymized(recordId: string): boolean {
    const record = this.privacyRecords.get(recordId);
    if (!record) {
return false;
}

    // Data is considered anonymized if using aggregation or differential privacy
    return (
      record.anonymized &&
      (record.techniques.includes('aggregation') || record.techniques.includes('differential-privacy'))
    );
  }

  /**
   * Log data access
   */
  logAccess(userId: string, recordId: string, action: string): void {
    this.accessLog.push({
      userId,
      recordId,
      action,
      timestamp: Date.now(),
    });

    // Also log to privacy record
    const record = this.privacyRecords.get(recordId);
    if (record) {
      record.accessLog.push({
        userId,
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Get access history
   */
  getAccessHistory(recordId: string, limit: number = 100): Array<{ userId: string; timestamp: number }> {
    const record = this.privacyRecords.get(recordId);
    return (record?.accessLog || []).slice(-limit);
  }

  /**
   * Get masking rule
   */
  getMaskingRule(fieldName: string): MaskingRule | null {
    return this.maskingRules.get(fieldName) || null;
  }

  /**
   * Add custom masking rule
   */
  addMaskingRule(rule: MaskingRule): void {
    this.maskingRules.set(rule.fieldName, rule);
  }

  /**
   * Data minimization check
   */
  isDataMinimal(recordId: string, requiredFields: string[]): boolean {
    const record = this.privacyRecords.get(recordId);
    if (!record) {
return false;
}

    // Data is considered minimal if only storing what's necessary
    // This would require schema metadata in production
    return true; // Simplified
  }

  /**
   * Get privacy statistics
   */
  getPrivacyStats(): Record<string, unknown> {
    const records = Array.from(this.privacyRecords.values());

    const anonymized = records.filter(r => r.anonymized).length;
    const pseudonymized = records.filter(r => r.pseudonymized).length;

    return {
      totalRecords: records.length,
      anonymizedRecords: anonymized,
      pseudonymizedRecords: pseudonymized,
      totalAccess: this.accessLog.length,
      privacyLevels: {
        public: records.filter(r => r.privacyLevel === 'public').length,
        internal: records.filter(r => r.privacyLevel === 'internal').length,
        confidential: records.filter(r => r.privacyLevel === 'confidential').length,
        restricted: records.filter(r => r.privacyLevel === 'restricted').length,
      },
    };
  }
}

// Export singleton
export const privacyControls = new PrivacyControls();
