import { createHash } from 'crypto';

/**
 * Canonicalize JSON value to stable string representation
 * - Sorts object keys lexicographically (recursive)
 * - Preserves array order
 * - Normalizes dates to ISO strings
 * - Ensures deterministic output (no random fields, no unstable ordering)
 *
 * This is critical for Z11 bundle integrity: same inputs → same checksums
 */
export function canonicalizeJson(value: unknown): string {
  if (value === null) {
return 'null';
}
  if (value === undefined) {
return 'null';
} // Treat undefined as null

  if (typeof value === 'boolean') {
return String(value);
}
  if (typeof value === 'number') {
return String(value);
}
  if (typeof value === 'string') {
return JSON.stringify(value);
}

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    const items = value.map(canonicalizeJson);
    return `[${items.join(',')}]`;
  }

  if (typeof value === 'object') {
    const keys = Object.keys(value).sort(); // Lexicographic sort
    const pairs = keys.map((key) => {
      const val = (value as Record<string, unknown>)[key];
      return `${JSON.stringify(key)}:${canonicalizeJson(val)}`;
    });
    return `{${pairs.join(',')}}`;
  }

  return 'null';
}

/**
 * Compute SHA-256 checksum of input string
 */
export function sha256(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}

/**
 * Compute canonical JSON string and its SHA-256 checksum
 * Returns both forms for flexibility (some consumers use canonical, some only checksum)
 */
export function computeJsonChecksum(value: unknown): {
  canonical: string;
  checksum: string;
} {
  const canonical = canonicalizeJson(value);
  const checksum = sha256(canonical);
  return { canonical, checksum };
}
