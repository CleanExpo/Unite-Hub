/**
 * Z11 PII Scrubber for Export Bundles
 * Removes or redacts sensitive fields from export payloads
 * Defensive approach: scrub first, then validate
 */

/**
 * PII-prone field names to redact from export payloads
 * Matched case-insensitively, field-name-only (not values)
 *
 * Redacted fields (guaranteed PII/sensitive):
 * - created_by, updated_by, actor: User identities
 * - owner: Cycle/resource ownership (potentially sensitive)
 * - email, phone: Contact information
 * - notes, commentary, free_text: User-generated content (may contain PII)
 * - webhook_url, webhook_secret, api_key, token, password: Credentials
 * - headers, payload, body: Raw request/response data (likely PII)
 */
const PII_FIELDS = [
  'created_by',
  'updated_by',
  'owner',
  'actor',
  'email',
  'phone',
  'notes',
  'commentary',
  'free_text',
  'webhook_secret',
  'api_key',
  'token',
  'password',
  'headers',
  'payload',
  'body',
];

/**
 * Recursively scrub PII-prone fields from export payload
 * Returns new object/array with PII redacted to '[REDACTED]'
 *
 * Special handling:
 * - Webhook URLs: extract hostname only
 * - Arrays: recursively scrub elements
 * - Objects: recursively scrub values, redact PII keys
 */
export function scrubExportPayload(value: unknown): unknown {
  if (value === null || value === undefined) {
return null;
}

  // Scalars pass through
  if (typeof value !== 'object') {
return value;
}

  // Arrays: recursively scrub each element
  if (Array.isArray(value)) {
    return value.map(scrubExportPayload);
  }

  // Objects: scrub PII fields recursively
  const scrubbed: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(value)) {
    const keyLower = key.toLowerCase();

    // Check if this key is a PII field
    if (PII_FIELDS.some((pii) => keyLower.includes(pii))) {
      scrubbed[key] = '[REDACTED]';
      continue;
    }

    // Special handling for webhook URLs: extract hostname only
    if (keyLower.includes('webhook') && typeof val === 'string' && val.startsWith('http')) {
      try {
        const url = new URL(val);
        scrubbed[key] = {
          webhook_configured: true,
          webhook_host: url.hostname,
        };
      } catch {
        scrubbed[key] = {
          webhook_configured: true,
          webhook_host: '[REDACTED]',
        };
      }
      continue;
    }

    // Recursively scrub nested values
    scrubbed[key] = scrubExportPayload(val);
  }

  return scrubbed;
}

/**
 * Validate export item content for potential PII leaks
 * Returns validation result with warnings
 *
 * Checks:
 * - Size (warn if > 1MB per item)
 * - Email patterns (basic heuristic)
 * - IP addresses (basic heuristic)
 *
 * Should be called AFTER scrubbing to catch any missed PII
 */
export function validateExportContent(content: unknown): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  const contentStr = JSON.stringify(content);

  // Check size (warn if > 1MB per item)
  if (contentStr.length > 1000000) {
    warnings.push('Item content exceeds 1MB (consider summarizing)');
  }

  // Check for email patterns (basic heuristic)
  // Pattern: word@domain.suffix
  if (/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(contentStr)) {
    warnings.push('Potential email addresses detected (ensure scrubbing applied)');
  }

  // Check for IP addresses (basic heuristic)
  // Pattern: xxx.xxx.xxx.xxx where x is 1-3 digits
  if (/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(contentStr)) {
    warnings.push('Potential IP addresses detected (ensure scrubbing applied)');
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}

/**
 * Combine scrub + validate in one call
 * Returns scrubbed content + validation result
 */
export function scrubAndValidateExportContent(content: unknown): {
  scrubbed: unknown;
  validation: { valid: boolean; warnings: string[] };
} {
  const scrubbed = scrubExportPayload(content);
  const validation = validateExportContent(scrubbed);
  return { scrubbed, validation };
}
