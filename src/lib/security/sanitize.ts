/**
 * Input Sanitization
 * 
 * Protects against XSS, SQL injection, and other injection attacks.
 * Sanitizes user input before processing or storage.
 */

/**
 * HTML entity encoding map
 */
const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/**
 * Sanitize a string by HTML-encoding special characters
 * Prevents XSS attacks by escaping HTML entities
 */
export function sanitizeString(input: string, maxLength?: number): string {
  if (typeof input !== 'string') {
    return '';
  }

  let sanitized = input
    .replace(/[&<>"'\/]/g, (char) => HTML_ENTITIES[char])
    .trim();

  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

/**
 * Sanitize an email address
 * Validates format and removes potentially dangerous characters
 */
export function sanitizeEmail(email: string): string {
  const sanitized = email.trim().toLowerCase();

  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitized)) {
    throw new Error('Invalid email format');
  }

  // Remove any HTML tags or special characters
  return sanitized.replace(/[<>'"]/g, '');
}

/**
 * Sanitize a URL
 * Ensures URL is safe and uses allowed protocols
 */
export function sanitizeUrl(url: string, allowedProtocols: string[] = ['http', 'https']): string {
  const sanitized = url.trim();

  try {
    const parsed = new URL(sanitized);

    // Check if protocol is allowed
    const protocol = parsed.protocol.replace(':', '');
    if (!allowedProtocols.includes(protocol)) {
      throw new Error('Invalid URL protocol');
    }

    return parsed.toString();
  } catch {
    throw new Error('Invalid URL format');
  }
}

/**
 * Sanitize a filename
 * Removes path traversal attempts and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  // Remove path traversal attempts
  let sanitized = filename.replace(/\.\./g, '').replace(/[\/\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');

  // Limit to alphanumeric, dash, underscore, and dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Ensure filename is not empty
  if (!sanitized || sanitized === '.' || sanitized === '..') {
    sanitized = 'file';
  }

  return sanitized;
}

/**
 * Sanitize a phone number
 * Removes non-numeric characters except + and spaces
 */
export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9+\s()-]/g, '').trim();
}

/**
 * Sanitize an object by applying sanitization to specified fields
 */
export function sanitizeObject<T extends Record<string, any>>(
  obj: T,
  fields: Array<keyof T>,
  maxLength?: number
): T {
  const sanitized = { ...obj };

  for (const field of fields) {
    if (typeof sanitized[field] === 'string') {
      sanitized[field] = sanitizeString(sanitized[field] as string, maxLength) as T[keyof T];
    }
  }

  return sanitized;
}

/**
 * Validate and sanitize JSON input
 * Prevents JSON injection attacks
 */
export function sanitizeJson<T = any>(input: string, maxSize: number = 10000): T {
  if (input.length > maxSize) {
    throw new Error('JSON input exceeds maximum size');
  }

  try {
    return JSON.parse(input) as T;
  } catch {
    throw new Error('Invalid JSON format');
  }
}

/**
 * Remove SQL injection patterns
 * Note: Use parameterized queries instead of this as primary defense
 */
export function sanitizeSqlInput(input: string): string {
  // Remove common SQL injection patterns
  const patterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(;|--|\bOR\b|\bAND\b|\bUNION\b)/gi,
    /('|"|`)/g,
  ];

  let sanitized = input;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '');
  }

  return sanitized.trim();
}

/**
 * Strip HTML tags from input
 * For cases where you need plain text only
 */
export function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, '').trim();
}

/**
 * Validate integer input
 * Returns validated integer or throws error
 */
export function sanitizeInteger(
  input: string | number,
  min?: number,
  max?: number
): number {
  const num = typeof input === 'string' ? parseInt(input, 10) : input;

  if (isNaN(num)) {
    throw new Error('Invalid integer');
  }

  if (min !== undefined && num < min) {
    throw new Error(`Value must be at least ${min}`);
  }

  if (max !== undefined && num > max) {
    throw new Error(`Value must be at most ${max}`);
  }

  return num;
}

/**
 * Validate UUID format
 * Returns validated UUID or throws error
 */
export function sanitizeUuid(input: string): string {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(input)) {
    throw new Error('Invalid UUID format');
  }

  return input.toLowerCase();
}

/**
 * Sanitize markdown input
 * Allows basic markdown but strips dangerous HTML
 */
export function sanitizeMarkdown(input: string): string {
  // Strip script tags and event handlers
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');

  return sanitized.trim();
}
