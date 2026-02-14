/**
 * PII Redaction Layer
 *
 * Detects and redacts personally identifiable information before
 * data is sent to external APIs. Supports reversible tokenization
 * so originals can be restored after processing.
 *
 * @module security/pii-redactor
 */

import { randomBytes, createCipheriv, createDecipheriv, scryptSync } from 'node:crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PIIType =
  | 'email'
  | 'phone'
  | 'credit_card'
  | 'ssn'
  | 'ip_address'
  | 'date_of_birth'
  | 'address'
  | 'url'
  | 'name';

export interface PIIDetection {
  type: PIIType;
  original: string;
  token: string;
  position: { start: number; end: number };
  confidence: number;
}

export interface RedactionResult {
  redacted: string;
  detections: PIIDetection[];
  tokenMap: Map<string, string>; // token → original
  stats: {
    totalDetections: number;
    byType: Record<PIIType, number>;
    redactionTimeMs: number;
  };
}

export interface RedactionAuditEntry {
  timestamp: string;
  source: string;
  totalPIIFound: number;
  byType: Record<string, number>;
  redactionApplied: boolean;
}

export interface PIIRedactorConfig {
  /** Types of PII to detect. Defaults to all types. */
  enabledTypes?: PIIType[];
  /** Custom patterns to add on top of built-in patterns */
  customPatterns?: Array<{ type: PIIType; pattern: RegExp; confidence: number }>;
  /** When true, replaces with reversible tokens. When false, replaces with masks. */
  reversible?: boolean;
  /** Prefix for generated tokens (default: 'PII') */
  tokenPrefix?: string;
}

// ---------------------------------------------------------------------------
// Detection Patterns
// ---------------------------------------------------------------------------

const BUILT_IN_PATTERNS: Array<{
  type: PIIType;
  pattern: RegExp;
  confidence: number;
}> = [
  // Email addresses
  {
    type: 'email',
    pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    confidence: 0.95,
  },
  // Phone numbers (international and US formats)
  {
    type: 'phone',
    pattern:
      /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g,
    confidence: 0.85,
  },
  // Credit card numbers (Visa, MC, Amex, Discover)
  {
    type: 'credit_card',
    pattern: /\b(?:4\d{3}|5[1-5]\d{2}|3[47]\d{2}|6(?:011|5\d{2}))[- ]?\d{4}[- ]?\d{4,7}[- ]?\d{0,4}\b/g,
    confidence: 0.9,
  },
  // SSN
  {
    type: 'ssn',
    pattern: /\b\d{3}[-]?\d{2}[-]?\d{4}\b/g,
    confidence: 0.8,
  },
  // IPv4 addresses
  {
    type: 'ip_address',
    pattern:
      /\b(?:(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(?:25[0-5]|2[0-4]\d|[01]?\d\d?)\b/g,
    confidence: 0.9,
  },
  // Dates of birth (various formats)
  {
    type: 'date_of_birth',
    pattern:
      /\b(?:0[1-9]|1[0-2])[\/\-.](?:0[1-9]|[12]\d|3[01])[\/\-.](?:19|20)\d{2}\b/g,
    confidence: 0.7,
  },
  // URLs with potential PII in query strings
  {
    type: 'url',
    pattern:
      /https?:\/\/[^\s]+(?:\?[^\s]*(?:email|user|name|phone|ssn|token|key|password|secret)[^\s]*)/gi,
    confidence: 0.75,
  },
];

// ---------------------------------------------------------------------------
// Masking Helpers
// ---------------------------------------------------------------------------

function generateToken(prefix: string): string {
  const id = randomBytes(6).toString('hex');
  return `[${prefix}_${id}]`;
}

function getMask(type: PIIType, value: string): string {
  switch (type) {
    case 'email': {
      const [local, domain] = value.split('@');
      if (!local || !domain) return '[EMAIL_REDACTED]';
      return `${local[0]}***@${domain}`;
    }
    case 'phone':
      return `***-***-${value.slice(-4)}`;
    case 'credit_card':
      return `****-****-****-${value.replace(/\D/g, '').slice(-4)}`;
    case 'ssn':
      return `***-**-${value.replace(/\D/g, '').slice(-4)}`;
    case 'ip_address':
      return value.replace(/\d+\.\d+\.\d+/, '***.***.***');
    case 'date_of_birth':
      return '**/**/****';
    case 'url':
      return '[URL_REDACTED]';
    case 'address':
      return '[ADDRESS_REDACTED]';
    case 'name':
      return '[NAME_REDACTED]';
    default:
      return '[REDACTED]';
  }
}

// ---------------------------------------------------------------------------
// PIIRedactor Class
// ---------------------------------------------------------------------------

export class PIIRedactor {
  private config: Required<PIIRedactorConfig>;
  private auditLog: RedactionAuditEntry[] = [];

  constructor(config: PIIRedactorConfig = {}) {
    this.config = {
      enabledTypes: config.enabledTypes ?? [
        'email',
        'phone',
        'credit_card',
        'ssn',
        'ip_address',
        'date_of_birth',
        'url',
      ],
      customPatterns: config.customPatterns ?? [],
      reversible: config.reversible ?? true,
      tokenPrefix: config.tokenPrefix ?? 'PII',
    };
  }

  // -------------------------------------------------------------------------
  // Core Detection
  // -------------------------------------------------------------------------

  /**
   * Detect all PII in a string without redacting.
   */
  detect(text: string): PIIDetection[] {
    const detections: PIIDetection[] = [];
    const allPatterns = [
      ...BUILT_IN_PATTERNS.filter((p) =>
        this.config.enabledTypes.includes(p.type)
      ),
      ...this.config.customPatterns,
    ];

    for (const { type, pattern, confidence } of allPatterns) {
      // Reset regex state for global patterns
      const regex = new RegExp(pattern.source, pattern.flags);
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const token = this.config.reversible
          ? generateToken(this.config.tokenPrefix)
          : getMask(type, match[0]);

        detections.push({
          type,
          original: match[0],
          token,
          position: { start: match.index, end: match.index + match[0].length },
          confidence,
        });
      }
    }

    // Sort by position (reverse order for safe replacement)
    return detections.sort((a, b) => b.position.start - a.position.start);
  }

  // -------------------------------------------------------------------------
  // Redact String
  // -------------------------------------------------------------------------

  /**
   * Redact all PII from a string. Returns redacted text + token map for
   * restoring originals.
   */
  redact(text: string, source = 'unknown'): RedactionResult {
    const start = Date.now();
    const detections = this.detect(text);
    const tokenMap = new Map<string, string>();

    let redacted = text;
    for (const detection of detections) {
      // Replace from end to preserve positions
      redacted =
        redacted.slice(0, detection.position.start) +
        detection.token +
        redacted.slice(detection.position.end);

      if (this.config.reversible) {
        tokenMap.set(detection.token, detection.original);
      }
    }

    // Build stats
    const byType = {} as Record<PIIType, number>;
    for (const d of detections) {
      byType[d.type] = (byType[d.type] ?? 0) + 1;
    }

    // Audit entry
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      source,
      totalPIIFound: detections.length,
      byType,
      redactionApplied: detections.length > 0,
    });

    return {
      redacted,
      detections,
      tokenMap,
      stats: {
        totalDetections: detections.length,
        byType,
        redactionTimeMs: Date.now() - start,
      },
    };
  }

  // -------------------------------------------------------------------------
  // Restore (Reverse Tokenization)
  // -------------------------------------------------------------------------

  /**
   * Restore original values from tokens after external processing.
   */
  restore(text: string, tokenMap: Map<string, string>): string {
    let restored = text;
    for (const [token, original] of tokenMap) {
      restored = restored.replaceAll(token, original);
    }
    return restored;
  }

  // -------------------------------------------------------------------------
  // Object Deep Redaction
  // -------------------------------------------------------------------------

  /**
   * Recursively redact PII from all string values in an object.
   * Returns deep-cloned object with redactions + combined token map.
   */
  redactObject<T>(
    obj: T,
    source = 'object'
  ): { redacted: T; tokenMap: Map<string, string>; totalDetections: number } {
    const combinedTokenMap = new Map<string, string>();
    let totalDetections = 0;

    const traverse = (value: unknown): unknown => {
      if (typeof value === 'string') {
        const result = this.redact(value, source);
        for (const [k, v] of result.tokenMap) {
          combinedTokenMap.set(k, v);
        }
        totalDetections += result.stats.totalDetections;
        return result.redacted;
      }
      if (Array.isArray(value)) {
        return value.map(traverse);
      }
      if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          out[k] = traverse(v);
        }
        return out;
      }
      return value;
    };

    return {
      redacted: traverse(obj) as T,
      tokenMap: combinedTokenMap,
      totalDetections,
    };
  }

  /**
   * Restore all tokens in an object tree.
   */
  restoreObject<T>(obj: T, tokenMap: Map<string, string>): T {
    const traverse = (value: unknown): unknown => {
      if (typeof value === 'string') {
        return this.restore(value, tokenMap);
      }
      if (Array.isArray(value)) {
        return value.map(traverse);
      }
      if (value !== null && typeof value === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
          out[k] = traverse(v);
        }
        return out;
      }
      return value;
    };
    return traverse(obj) as T;
  }

  // -------------------------------------------------------------------------
  // Logging-Safe Masking
  // -------------------------------------------------------------------------

  /**
   * One-way mask for logging (not reversible).
   */
  maskForLogging(text: string): string {
    const allPatterns = [
      ...BUILT_IN_PATTERNS.filter((p) =>
        this.config.enabledTypes.includes(p.type)
      ),
      ...this.config.customPatterns,
    ];

    let masked = text;
    for (const { type, pattern } of allPatterns) {
      const regex = new RegExp(pattern.source, pattern.flags);
      masked = masked.replace(regex, (match) => getMask(type, match));
    }
    return masked;
  }

  // -------------------------------------------------------------------------
  // Audit
  // -------------------------------------------------------------------------

  getAuditLog(): RedactionAuditEntry[] {
    return [...this.auditLog];
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }
}

// ---------------------------------------------------------------------------
// Field-Level Encryption
// ---------------------------------------------------------------------------

const ENCRYPTION_ALGO = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 16;

/**
 * Field-level encryption for PII storage at rest.
 *
 * Uses AES-256-GCM with per-field IVs and key derivation via scrypt.
 * The encryption key is derived from FIELD_ENCRYPTION_KEY env var
 * (or a fallback for non-production environments).
 */
export class PIIFieldEncryptor {
  private derivedKey: Buffer;

  constructor(masterKey?: string) {
    const key =
      masterKey ??
      process.env.FIELD_ENCRYPTION_KEY ??
      (process.env.NODE_ENV === 'production'
        ? ''
        : 'dev-only-not-for-production-use-32ch');

    if (!key) {
      throw new Error(
        'FIELD_ENCRYPTION_KEY environment variable is required in production'
      );
    }

    // Derive a 256-bit key from the master key
    const salt = Buffer.from('unite-hub-pii-v1'); // Static salt for deterministic derivation
    this.derivedKey = scryptSync(key, salt, 32);
  }

  /**
   * Encrypt a single field value.
   * Returns: base64(iv + authTag + ciphertext)
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ENCRYPTION_ALGO, this.derivedKey, iv);

    let encrypted = cipher.update(plaintext, 'utf8');
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    const authTag = cipher.getAuthTag();

    // Pack: IV (16) + AuthTag (16) + Ciphertext
    const packed = Buffer.concat([iv, authTag, encrypted]);
    return packed.toString('base64');
  }

  /**
   * Decrypt a single field value.
   */
  decrypt(encryptedBase64: string): string {
    const packed = Buffer.from(encryptedBase64, 'base64');

    const iv = packed.subarray(0, IV_LENGTH);
    const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ENCRYPTION_ALGO, this.derivedKey, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString('utf8');
  }

  /**
   * Encrypt all values in a key-value map (for storing PII fields at rest).
   */
  encryptFields(fields: Record<string, string>): Record<string, string> {
    const encrypted: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      encrypted[key] = this.encrypt(value);
    }
    return encrypted;
  }

  /**
   * Decrypt all values in a key-value map.
   */
  decryptFields(fields: Record<string, string>): Record<string, string> {
    const decrypted: Record<string, string> = {};
    for (const [key, value] of Object.entries(fields)) {
      try {
        decrypted[key] = this.decrypt(value);
      } catch {
        // If decryption fails, return the original value (may not be encrypted)
        decrypted[key] = value;
      }
    }
    return decrypted;
  }

  /**
   * Encrypt a PII token map (from PIIRedactor.redact()) for secure storage.
   * The token map contains token → original PII mappings.
   */
  encryptTokenMap(tokenMap: Map<string, string>): string {
    const json = JSON.stringify(Object.fromEntries(tokenMap));
    return this.encrypt(json);
  }

  /**
   * Decrypt a stored token map back to a Map.
   */
  decryptTokenMap(encrypted: string): Map<string, string> {
    const json = this.decrypt(encrypted);
    const obj = JSON.parse(json) as Record<string, string>;
    return new Map(Object.entries(obj));
  }
}

/**
 * Singleton encryptor (lazy-init to avoid startup errors if key isn't set).
 */
let _encryptor: PIIFieldEncryptor | null = null;
export function getPIIEncryptor(): PIIFieldEncryptor {
  if (!_encryptor) {
    _encryptor = new PIIFieldEncryptor();
  }
  return _encryptor;
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const piiRedactor = new PIIRedactor();
