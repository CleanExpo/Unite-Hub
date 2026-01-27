/**
 * Input Sanitization for API Routes
 * Strips HTML tags, encodes entities, trims, and enforces length limits.
 * Use for plain text fields (names, descriptions, etc.) — NOT for rich HTML content.
 */

/**
 * Sanitize a single string value.
 * Strips HTML tags, encodes dangerous characters, trims whitespace, enforces max length.
 */
export function sanitizeString(input: unknown, maxLength = 1000): string {
  if (typeof input !== 'string') return '';

  return input
    // Strip HTML tags
    .replace(/<[^>]*>/g, '')
    // Encode dangerous characters
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Trim whitespace
    .trim()
    // Enforce max length
    .slice(0, maxLength);
}

/**
 * Sanitize multiple fields on an object.
 * Only sanitizes specified string fields; leaves other fields untouched.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  maxLength = 1000,
): T {
  const result = { ...obj };
  for (const field of fields) {
    if (typeof result[field] === 'string') {
      (result as Record<string, unknown>)[field as string] = sanitizeString(
        result[field] as string,
        maxLength,
      );
    }
  }
  return result;
}
