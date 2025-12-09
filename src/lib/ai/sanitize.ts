/**
 * AI API Key Sanitization Utilities
 *
 * Redacts sensitive API keys from logs, errors, and objects to prevent
 * accidental exposure in error messages, stack traces, and monitoring systems.
 *
 * @module ai/sanitize
 */

/**
 * Regex patterns for detecting sensitive API keys
 */
export const SENSITIVE_PATTERNS = {
  anthropic: /sk-ant-[a-zA-Z0-9-]{95,}/g,
  openai: /sk-[a-zA-Z0-9]{48}/g,
  google: /AIza[a-zA-Z0-9_-]{30,}/g,
  openrouter: /sk-or-v1-[a-zA-Z0-9]{64}/g,
  perplexity: /pplx-[a-zA-Z0-9]{40}/g,
  generic: /[a-zA-Z0-9]{40,}/g, // Long alphanumeric strings (use carefully)
} as const;

/**
 * Redaction marker for sanitized values
 */
const REDACTED = '[REDACTED_API_KEY]';

/**
 * Sanitizes a string by replacing all detected API keys with redaction markers.
 *
 * @param str - The string to sanitize
 * @returns The sanitized string with API keys redacted
 *
 * @example
 * ```ts
 * const log = "Error with key sk-ant-abc123...";
 * const safe = sanitizeString(log);
 * // Returns: "Error with key [REDACTED_API_KEY]"
 * ```
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
return str;
}

  let sanitized = str;

  // Apply specific patterns first (more precise)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.anthropic, REDACTED);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.openai, REDACTED);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.google, REDACTED);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.openrouter, REDACTED);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.perplexity, REDACTED);

  // Apply generic pattern last, but only in specific contexts to avoid false positives
  // Only redact if it looks like an environment variable value or Bearer token
  sanitized = sanitized.replace(
    /(?:Bearer\s+|API[_-]?KEY[=:]\s*['"]?)([a-zA-Z0-9]{40,})(?:['"]?)/gi,
    `$1${REDACTED}`
  );

  return sanitized;
}

/**
 * Sanitizes an Error object, redacting API keys from message and stack trace.
 * Preserves the error structure and all non-sensitive properties.
 *
 * @param error - The error to sanitize
 * @returns A sanitized version of the error
 *
 * @example
 * ```ts
 * try {
 *   await anthropic.messages.create({...});
 * } catch (error) {
 *   const safeError = sanitizeError(error);
 *   logger.error(safeError);
 * }
 * ```
 */
export function sanitizeError(error: unknown): unknown {
  if (!error) {
return error;
}

  // Handle Error objects
  if (error instanceof Error) {
    const sanitized = new Error(sanitizeString(error.message));
    sanitized.name = error.name;

    if (error.stack) {
      sanitized.stack = sanitizeString(error.stack);
    }

    // Preserve additional properties
    const errorObj = error as Record<string, any>;
    Object.keys(errorObj).forEach(key => {
      if (key !== 'message' && key !== 'stack' && key !== 'name') {
        const value = errorObj[key];
        if (typeof value === 'string') {
          (sanitized as any)[key] = sanitizeString(value);
        } else if (typeof value === 'object' && value !== null) {
          (sanitized as any)[key] = sanitizeObject(value);
        } else {
          (sanitized as any)[key] = value;
        }
      }
    });

    return sanitized;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return sanitizeString(error);
  }

  // Handle object errors
  if (typeof error === 'object' && error !== null) {
    return sanitizeObject(error as Record<string, any>);
  }

  return error;
}

/**
 * Recursively sanitizes an object, redacting API keys from all string values.
 * Handles nested objects and arrays.
 *
 * @param obj - The object to sanitize
 * @returns A new object with all string values sanitized
 *
 * @example
 * ```ts
 * const config = {
 *   apiKey: 'sk-ant-abc123...',
 *   nested: { token: 'AIza...' }
 * };
 * const safe = sanitizeObject(config);
 * ```
 */
export function sanitizeObject(obj: Record<string, any>): Record<string, any> {
  if (!obj || typeof obj !== 'object') {
return obj;
}

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
return sanitizeString(item);
}
      if (typeof item === 'object' && item !== null) {
return sanitizeObject(item);
}
      return item;
    });
  }

  // Handle objects
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Redact keys that look like they contain secrets
    const sensitiveKeyPatterns = [
      /api[_-]?key/i,
      /secret/i,
      /token/i,
      /password/i,
      /auth/i,
      /bearer/i,
    ];

    const isSensitiveKey = sensitiveKeyPatterns.some(pattern => pattern.test(key));

    if (isSensitiveKey && typeof value === 'string') {
      sanitized[key] = REDACTED;
    } else if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Creates a Winston-compatible logger format that automatically sanitizes all log entries.
 *
 * @returns A Winston format function for sanitization
 *
 * @example
 * ```ts
 * import winston from 'winston';
 *
 * const logger = winston.createLogger({
 *   format: winston.format.combine(
 *     createSanitizedLogger(),
 *     winston.format.json()
 *   )
 * });
 *
 * logger.error('API error', { apiKey: 'sk-ant-123...' });
 * // Logs: { message: 'API error', apiKey: '[REDACTED_API_KEY]' }
 * ```
 */
export function createSanitizedLogger() {
  return {
    transform: (info: any) => {
      // Sanitize the message
      if (typeof info.message === 'string') {
        info.message = sanitizeString(info.message);
      }

      // Sanitize metadata
      const sanitized: Record<string, any> = { ...info };
      Object.keys(sanitized).forEach(key => {
        if (key !== 'level' && key !== 'timestamp') {
          const value = sanitized[key];
          if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
          } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value);
          }
        }
      });

      return sanitized;
    }
  };
}

/**
 * Wraps an async function to automatically sanitize any thrown errors.
 * Useful for wrapping AI API calls to ensure no API keys leak in error logs.
 *
 * @param fn - The async function to wrap
 * @returns A wrapped version that sanitizes errors
 *
 * @example
 * ```ts
 * const safeCall = withErrorSanitization(async () => {
 *   return await anthropic.messages.create({
 *     model: 'claude-sonnet-4-5-20250929',
 *     max_tokens: 1024,
 *     messages: [...]
 *   });
 * });
 *
 * try {
 *   const result = await safeCall();
 * } catch (error) {
 *   // Error is automatically sanitized
 *   logger.error('AI call failed', error);
 * }
 * ```
 */
export async function withErrorSanitization<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    // Sanitize and re-throw
    const sanitized = sanitizeError(error);
    throw sanitized;
  }
}

/**
 * Type guard to check if a value is an Error
 */
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Test utility - validates that sanitization is working correctly
 * Should only be used in tests or during development
 *
 * @returns Test results with pass/fail status
 */
export function testSanitization(): {
  passed: boolean;
  results: Array<{ test: string; passed: boolean; details?: string }>;
} {
  const results: Array<{ test: string; passed: boolean; details?: string }> = [];

  // Test 1: Anthropic key sanitization
  const anthropicTest = sanitizeString('Error: sk-ant-api03-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567ABC890DEF123GHI456JKL789MNO012PQR345STU678VWX901YZ234');
  results.push({
    test: 'Anthropic API key',
    passed: anthropicTest.includes(REDACTED) && !anthropicTest.includes('sk-ant-'),
    details: anthropicTest
  });

  // Test 2: OpenAI key sanitization
  const openaiTest = sanitizeString('Token: sk-1234567890abcdefghijklmnopqrstuvwxyz123456789012');
  results.push({
    test: 'OpenAI API key',
    passed: openaiTest.includes(REDACTED) && !openaiTest.includes('sk-1234'),
    details: openaiTest
  });

  // Test 3: Google key sanitization
  const googleTest = sanitizeString('Config: AIzaSyC1234567890abcdefghijklmnopqrs');
  results.push({
    test: 'Google API key',
    passed: googleTest.includes(REDACTED) && !googleTest.includes('AIza'),
    details: googleTest
  });

  // Test 4: Object sanitization
  const objTest = sanitizeObject({
    apiKey: 'sk-ant-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567ABC890DEF123GHI456JKL789MNO012PQR345STU678VWX901YZ234',
    message: 'Safe message',
    nested: { token: 'AIzaSyC1234567890abcdefghijklmnopqrs' }
  });
  results.push({
    test: 'Object sanitization',
    passed: objTest.apiKey === REDACTED && objTest.message === 'Safe message',
    details: JSON.stringify(objTest)
  });

  // Test 5: Error sanitization
  const error = new Error('Failed with key: sk-ant-abc123def456ghi789jkl012mno345pqr678stu901vwx234yz567ABC890DEF123GHI456JKL789MNO012PQR345STU678VWX901YZ234');
  const errorTest = sanitizeError(error) as Error;
  results.push({
    test: 'Error sanitization',
    passed: isError(errorTest) && errorTest.message.includes(REDACTED) && !errorTest.message.includes('sk-ant-'),
    details: errorTest.message
  });

  const passed = results.every(r => r.passed);

  return { passed, results };
}
