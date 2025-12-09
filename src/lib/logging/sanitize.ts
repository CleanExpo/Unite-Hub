/**
 * Comprehensive Log Sanitization System
 *
 * Prevents sensitive data from appearing in logs by detecting and redacting:
 * - API keys (Anthropic, OpenAI, Google, OpenRouter, Perplexity, AWS, etc.)
 * - JWT tokens and Bearer tokens
 * - Passwords and credentials
 * - Credit card numbers
 * - Email addresses (partial redaction)
 * - Phone numbers (partial redaction)
 * - Supabase keys and service role keys
 * - OAuth tokens and refresh tokens
 * - Session IDs and cookies
 * - Database connection strings
 *
 * Integrates with Winston logger for automatic sanitization of all log output.
 *
 * @module lib/logging/sanitize
 */

/**
 * Redaction markers for different types of sensitive data
 */
export const REDACTION_MARKERS = {
  API_KEY: '[REDACTED_API_KEY]',
  JWT_TOKEN: '[REDACTED_JWT]',
  PASSWORD: '[REDACTED_PASSWORD]',
  CREDIT_CARD: '[REDACTED_CC_****]',
  EMAIL: '[REDACTED_EMAIL]',
  PHONE: '[REDACTED_PHONE]',
  SESSION: '[REDACTED_SESSION]',
  OAUTH_TOKEN: '[REDACTED_OAUTH]',
  DATABASE_URL: '[REDACTED_DB_URL]',
  GENERIC_SECRET: '[REDACTED_SECRET]',
} as const;

/**
 * Comprehensive patterns for detecting sensitive data
 */
export const SENSITIVE_PATTERNS = {
  // API Keys
  anthropic: /sk-ant-[a-zA-Z0-9-]{95,}/g,
  openai: /sk-[a-zA-Z0-9]{48}/g,
  google: /AIza[a-zA-Z0-9_-]{30,}/g,
  openrouter: /sk-or-v1-[a-zA-Z0-9]{64}/g,
  perplexity: /pplx-[a-zA-Z0-9]{40}/g,
  aws_access_key: /AKIA[0-9A-Z]{16}/g,
  aws_secret_key: /[a-zA-Z0-9/+=]{40}/g,
  github_token: /gh[pousr]_[A-Za-z0-9_]{36,}/g,
  stripe_key: /sk_(live|test)_[0-9a-zA-Z]{24,}/g,

  // Supabase Keys
  supabase_anon: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  supabase_service_role: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,

  // JWT Tokens (generic)
  jwt: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,

  // Bearer tokens
  bearer_token: /Bearer\s+[a-zA-Z0-9\-._~+/]+=*/gi,

  // OAuth tokens
  oauth_token: /oauth_token[=:]\s*['"]?([a-zA-Z0-9\-._~+/]+)['"]?/gi,
  refresh_token: /refresh_token[=:]\s*['"]?([a-zA-Z0-9\-._~+/]+)['"]?/gi,
  access_token: /access_token[=:]\s*['"]?([a-zA-Z0-9\-._~+/]+)['"]?/gi,

  // Passwords
  password: /password[=:]\s*['"]?([^'"\s]{6,})['"]?/gi,
  passwd: /passwd[=:]\s*['"]?([^'"\s]{6,})['"]?/gi,
  pwd: /pwd[=:]\s*['"]?([^'"\s]{6,})['"]?/gi,

  // Credit Cards (matches Visa, MC, Amex, Discover patterns)
  credit_card: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,

  // Email addresses (will be partially redacted)
  email: /\b([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g,

  // Phone numbers (various formats)
  phone_us: /\b(?:\+?1[-.\s]?)?(?:\([0-9]{3}\)|[0-9]{3})[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
  phone_intl: /\+[0-9]{1,3}[-.\s]?(?:\([0-9]{1,4}\)|[0-9]{1,4})[-.\s]?[0-9]{1,4}[-.\s]?[0-9]{1,9}/g,

  // Session IDs and cookies
  session_id: /session[_-]?id[=:]\s*['"]?([a-zA-Z0-9\-._]{20,})['"]?/gi,
  cookie: /Set-Cookie:\s*([^;\n]+)/gi,

  // Database connection strings
  postgres_url: /postgres(?:ql)?:\/\/[^:]+:[^@]+@[^\s]+/gi,
  mysql_url: /mysql:\/\/[^:]+:[^@]+@[^\s]+/gi,
  mongodb_url: /mongodb(?:\+srv)?:\/\/[^:]+:[^@]+@[^\s]+/gi,

  // Private keys
  private_key: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----[\s\S]*?-----END (?:RSA |EC )?PRIVATE KEY-----/g,

  // Generic secrets in environment variable format
  env_secret: /(?:SECRET|TOKEN|KEY|PASSWORD)[_A-Z]*[=:]\s*['"]?([a-zA-Z0-9\-._~+/]{16,})['"]?/gi,
} as const;

/**
 * Sanitize a string by redacting all detected sensitive data
 */
export function sanitizeString(str: string): string {
  if (typeof str !== 'string') {
return str;
}

  let sanitized = str;

  // API Keys
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.anthropic, REDACTION_MARKERS.API_KEY);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.openai, REDACTION_MARKERS.API_KEY);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.google, REDACTION_MARKERS.API_KEY);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.openrouter, REDACTION_MARKERS.API_KEY);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.perplexity, REDACTION_MARKERS.API_KEY);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.aws_access_key, REDACTION_MARKERS.API_KEY);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.github_token, REDACTION_MARKERS.API_KEY);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.stripe_key, REDACTION_MARKERS.API_KEY);

  // JWT and Supabase tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.jwt, REDACTION_MARKERS.JWT_TOKEN);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.supabase_anon, REDACTION_MARKERS.JWT_TOKEN);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.supabase_service_role, REDACTION_MARKERS.JWT_TOKEN);

  // Bearer tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.bearer_token, `Bearer ${REDACTION_MARKERS.OAUTH_TOKEN}`);

  // OAuth tokens
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.oauth_token, `oauth_token=${REDACTION_MARKERS.OAUTH_TOKEN}`);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.refresh_token, `refresh_token=${REDACTION_MARKERS.OAUTH_TOKEN}`);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.access_token, `access_token=${REDACTION_MARKERS.OAUTH_TOKEN}`);

  // Passwords
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.password, `password=${REDACTION_MARKERS.PASSWORD}`);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.passwd, `passwd=${REDACTION_MARKERS.PASSWORD}`);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.pwd, `pwd=${REDACTION_MARKERS.PASSWORD}`);

  // Credit cards (keep last 4 digits)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.credit_card, (match) => {
    const last4 = match.slice(-4);
    return `${REDACTION_MARKERS.CREDIT_CARD}${last4}`;
  });

  // Email (keep domain, redact username)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.email, (match, username, domain) => {
    const firstChar = username.charAt(0);
    const lastChar = username.charAt(username.length - 1);
    return `${firstChar}***${lastChar}@${domain}`;
  });

  // Phone numbers (keep last 4 digits)
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.phone_us, (match) => {
    const digits = match.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return `***-***-${last4}`;
  });
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.phone_intl, (match) => {
    const digits = match.replace(/\D/g, '');
    const last4 = digits.slice(-4);
    return `+**-***-${last4}`;
  });

  // Session IDs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.session_id, `session_id=${REDACTION_MARKERS.SESSION}`);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.cookie, `Set-Cookie: ${REDACTION_MARKERS.SESSION}`);

  // Database URLs
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.postgres_url, REDACTION_MARKERS.DATABASE_URL);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.mysql_url, REDACTION_MARKERS.DATABASE_URL);
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.mongodb_url, REDACTION_MARKERS.DATABASE_URL);

  // Private keys
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.private_key, REDACTION_MARKERS.GENERIC_SECRET);

  // Generic environment secrets
  sanitized = sanitized.replace(SENSITIVE_PATTERNS.env_secret, (match, p1, offset, string) => {
    // Extract the key name
    const keyMatch = match.match(/^([^=:]+)[=:]/);
    if (keyMatch) {
      return `${keyMatch[1]}=${REDACTION_MARKERS.GENERIC_SECRET}`;
    }
    return REDACTION_MARKERS.GENERIC_SECRET;
  });

  return sanitized;
}

/**
 * Sanitize an object recursively
 */
export function sanitizeObject(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => {
      if (typeof item === 'string') {
        return sanitizeString(item);
      } else if (typeof item === 'object' && item !== null) {
        return sanitizeObject(item);
      }
      return item;
    });
  }

  // Handle objects
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(obj)) {
    // Check if key name suggests sensitive data
    const sensitiveKeyPatterns = [
      /api[_-]?key/i,
      /secret/i,
      /token/i,
      /password/i,
      /passwd/i,
      /pwd/i,
      /auth/i,
      /bearer/i,
      /credential/i,
      /private[_-]?key/i,
      /access[_-]?key/i,
      /session[_-]?id/i,
      /cookie/i,
      /authorization/i,
      /x-api-key/i,
    ];

    const isSensitiveKey = sensitiveKeyPatterns.some(pattern => pattern.test(key));

    // If it's a sensitive key, redact the entire value
    if (isSensitiveKey) {
      if (typeof value === 'string') {
        // Try to determine what type of secret it is for better redaction marker
        if (key.toLowerCase().includes('password') || key.toLowerCase().includes('pwd')) {
          sanitized[key] = REDACTION_MARKERS.PASSWORD;
        } else if (key.toLowerCase().includes('token')) {
          sanitized[key] = REDACTION_MARKERS.OAUTH_TOKEN;
        } else if (key.toLowerCase().includes('session')) {
          sanitized[key] = REDACTION_MARKERS.SESSION;
        } else {
          sanitized[key] = REDACTION_MARKERS.GENERIC_SECRET;
        }
      } else {
        sanitized[key] = REDACTION_MARKERS.GENERIC_SECRET;
      }
    } else if (typeof value === 'string') {
      // Not a sensitive key, but still sanitize the string value
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      // Recursively sanitize nested objects
      sanitized[key] = sanitizeObject(value);
    } else {
      // Keep other types as-is
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize an Error object
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

    // Sanitize additional properties on the error
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
    return sanitizeObject(error);
  }

  return error;
}

/**
 * Winston format for automatic log sanitization
 *
 * Usage:
 * ```ts
 * import winston from 'winston';
 * import { sanitizeFormat } from './sanitize';
 *
 * const logger = winston.createLogger({
 *   format: winston.format.combine(
 *     sanitizeFormat(),
 *     winston.format.json()
 *   )
 * });
 * ```
 */
export function sanitizeFormat() {
  return {
    transform: (info: any) => {
      // Sanitize the message
      if (typeof info.message === 'string') {
        info.message = sanitizeString(info.message);
      } else if (typeof info.message === 'object' && info.message !== null) {
        info.message = sanitizeObject(info.message);
      }

      // Sanitize error property
      if (info.error) {
        info.error = sanitizeError(info.error);
      }

      // Sanitize stack traces
      if (info.stack && typeof info.stack === 'string') {
        info.stack = sanitizeString(info.stack);
      }

      // Sanitize all other metadata
      const keysToSkip = ['level', 'timestamp', 'label', 'message', 'error', 'stack'];
      Object.keys(info).forEach(key => {
        if (!keysToSkip.includes(key)) {
          const value = info[key];
          if (typeof value === 'string') {
            info[key] = sanitizeString(value);
          } else if (typeof value === 'object' && value !== null) {
            info[key] = sanitizeObject(value);
          }
        }
      });

      return info;
    }
  };
}

/**
 * Middleware function to sanitize request objects in logs
 *
 * Use this to sanitize Express/Next.js request objects before logging
 */
export function sanitizeRequest(req: any): any {
  if (!req) {
return req;
}

  const sanitized: Record<string, any> = {
    method: req.method,
    url: sanitizeString(req.url || ''),
    path: sanitizeString(req.path || ''),
  };

  // Sanitize headers (remove Authorization, Cookie, etc.)
  if (req.headers) {
    sanitized.headers = sanitizeObject({ ...req.headers });
  }

  // Sanitize query parameters
  if (req.query) {
    sanitized.query = sanitizeObject({ ...req.query });
  }

  // Sanitize body (if present)
  if (req.body) {
    sanitized.body = sanitizeObject({ ...req.body });
  }

  return sanitized;
}

/**
 * Middleware function to sanitize response objects in logs
 */
export function sanitizeResponse(res: any): any {
  if (!res) {
return res;
}

  const sanitized: Record<string, any> = {
    statusCode: res.statusCode,
  };

  // Sanitize headers
  if (res.headers) {
    sanitized.headers = sanitizeObject({ ...res.headers });
  }

  // Don't include response body in logs (too large, potentially sensitive)

  return sanitized;
}

/**
 * Test suite to validate sanitization is working correctly
 */
export function testSanitization(): {
  passed: boolean;
  results: Array<{ test: string; passed: boolean; details?: string }>;
} {
  const results: Array<{ test: string; passed: boolean; details?: string }> = [];

  // Test 1: API Keys
  const apiKeyTest = sanitizeString('Error: sk-ant-api03-' + 'a'.repeat(95));
  results.push({
    test: 'Anthropic API key redaction',
    passed: apiKeyTest.includes(REDACTION_MARKERS.API_KEY) && !apiKeyTest.includes('sk-ant-'),
    details: apiKeyTest
  });

  // Test 2: JWT Token
  const jwtTest = sanitizeString('Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c');
  results.push({
    test: 'JWT token redaction',
    passed: jwtTest.includes(REDACTION_MARKERS.JWT_TOKEN) && !jwtTest.includes('eyJhbGciOiJIUzI1NiIs'),
    details: jwtTest
  });

  // Test 3: Password
  const passwordTest = sanitizeString('Config: password=mysecretpass123');
  results.push({
    test: 'Password redaction',
    passed: passwordTest.includes(REDACTION_MARKERS.PASSWORD) && !passwordTest.includes('mysecretpass'),
    details: passwordTest
  });

  // Test 4: Credit Card
  const ccTest = sanitizeString('CC: 4532123456789012');
  results.push({
    test: 'Credit card partial redaction',
    passed: ccTest.includes('9012') && ccTest.includes(REDACTION_MARKERS.CREDIT_CARD) && !ccTest.includes('4532'),
    details: ccTest
  });

  // Test 5: Email
  const emailTest = sanitizeString('Contact: john.doe@example.com');
  results.push({
    test: 'Email partial redaction',
    passed: emailTest.includes('@example.com') && emailTest.includes('j***e') && !emailTest.includes('john.doe'),
    details: emailTest
  });

  // Test 6: Phone Number
  const phoneTest = sanitizeString('Phone: (555) 123-4567');
  results.push({
    test: 'Phone number partial redaction',
    passed: phoneTest.includes('4567') && phoneTest.includes('***') && !phoneTest.includes('555'),
    details: phoneTest
  });

  // Test 7: Database URL
  const dbTest = sanitizeString('DB: postgresql://user:pass@host/db');
  results.push({
    test: 'Database URL redaction',
    passed: dbTest.includes(REDACTION_MARKERS.DATABASE_URL) && !dbTest.includes('postgresql://user:pass'),
    details: dbTest
  });

  // Test 8: Object sanitization
  const objTest = sanitizeObject({
    apiKey: 'sk-ant-api03-' + 'a'.repeat(95),
    username: 'john',
    email: 'john@example.com',
    nested: {
      password: 'secret123',
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdef'
    }
  });
  results.push({
    test: 'Object sanitization',
    passed: objTest.apiKey === REDACTION_MARKERS.GENERIC_SECRET &&
            objTest.username === 'john' &&
            objTest.nested.password === REDACTION_MARKERS.PASSWORD &&
            objTest.nested.token === REDACTION_MARKERS.OAUTH_TOKEN,
    details: JSON.stringify(objTest, null, 2)
  });

  // Test 9: Error sanitization
  const error = new Error('Failed with key: sk-ant-' + 'a'.repeat(98));
  const errorTest = sanitizeError(error) as Error;
  results.push({
    test: 'Error sanitization',
    passed: errorTest instanceof Error &&
            errorTest.message.includes(REDACTION_MARKERS.API_KEY) &&
            !errorTest.message.includes('sk-ant-a'),
    details: errorTest.message
  });

  const passed = results.every(r => r.passed);

  return { passed, results };
}

/**
 * Utility to check if sanitization is properly configured
 */
export function isSanitizationEnabled(): boolean {
  // Check if the sanitization format is applied to the logger
  // This is a placeholder - actual implementation would check Winston config
  return true;
}

/**
 * Export convenience function for testing sanitization in development
 */
export function runSanitizationTests(): void {
  const { passed, results } = testSanitization();

  console.log('\n=== Sanitization Test Results ===\n');

  results.forEach(({ test, passed, details }) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${test}`);
    if (!passed && details) {
      console.log(`   Output: ${details}`);
    }
  });

  console.log(`\n${passed ? '✅ All tests passed!' : '❌ Some tests failed!'}\n`);
}
