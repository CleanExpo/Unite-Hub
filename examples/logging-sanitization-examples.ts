/**
 * Log Sanitization - Usage Examples
 *
 * This file demonstrates how to use the log sanitization system
 * to prevent sensitive data from appearing in logs.
 *
 * @module examples/logging-sanitization-examples
 */

import logger, { createApiLogger, auditLog, securityLog } from '@/lib/logger';
import {
  sanitizeString,
  sanitizeObject,
  sanitizeError,
  sanitizeRequest,
  sanitizeResponse,
  testSanitization,
  runSanitizationTests,
} from '@/lib/logging/sanitize';

// ============================================================================
// EXAMPLE 1: Automatic Sanitization (Recommended)
// ============================================================================

/**
 * The logger automatically sanitizes all output.
 * Just use the logger normally - sensitive data is automatically redacted.
 */
export function example1_AutomaticSanitization() {
  console.log('\n=== Example 1: Automatic Sanitization ===\n');

  // ✅ API keys are automatically redacted
  logger.info('Initializing AI service', {
    apiKey: 'sk-ant-api03-' + 'a'.repeat(95), // Will be redacted
    model: 'claude-sonnet-4-5-20250929',
  });

  // ✅ JWT tokens are automatically redacted
  logger.info('User authenticated', {
    userId: 'user-123',
    token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc',
  });

  // ✅ Passwords are automatically redacted
  logger.debug('Login attempt', {
    username: 'john@example.com',
    password: 'mysecretpass123', // Will be redacted
  });

  // ✅ Credit cards are partially redacted (last 4 kept)
  logger.info('Payment processed', {
    cardNumber: '4532123456789012', // Will show as [REDACTED_CC_****]9012
    amount: 99.99,
  });
}

// ============================================================================
// EXAMPLE 2: API Route Logging
// ============================================================================

/**
 * Logging in Next.js API routes with automatic sanitization
 */
export async function example2_ApiRouteLogging(req: Request) {
  console.log('\n=== Example 2: API Route Logging ===\n');

  // Create an API-specific logger with context
  const apiLogger = createApiLogger({
    route: '/api/users',
    userId: 'user-123',
    requestId: crypto.randomUUID(),
  });

  try {
    const body = await req.json();

    // Log request (automatically sanitized)
    apiLogger.info('Processing request', {
      body: body, // Sensitive fields will be redacted
      headers: Object.fromEntries(req.headers),
    });

    // Simulate some processing
    const result = { success: true, userId: 'user-123' };

    // Log success
    apiLogger.info('Request completed', { result });

    return result;
  } catch (error) {
    // Log error (automatically sanitized)
    apiLogger.error('Request failed', {
      error: error,
      request: sanitizeRequest(req), // Extra manual sanitization
    });

    throw error;
  }
}

// ============================================================================
// EXAMPLE 3: Manual Sanitization
// ============================================================================

/**
 * Manually sanitize data before logging or processing
 */
export function example3_ManualSanitization() {
  console.log('\n=== Example 3: Manual Sanitization ===\n');

  // Sanitize a string
  const unsafeMessage = 'Error with API key: sk-ant-api03-' + 'a'.repeat(95);
  const safeMessage = sanitizeString(unsafeMessage);
  console.log('Sanitized message:', safeMessage);
  // Output: "Error with API key: [REDACTED_API_KEY]"

  // Sanitize an object
  const unsafeConfig = {
    apiKey: 'sk-ant-api03-' + 'a'.repeat(95),
    username: 'john',
    password: 'secret123',
    email: 'john.doe@example.com',
    nested: {
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc',
      publicData: 'this is safe',
    },
  };
  const safeConfig = sanitizeObject(unsafeConfig);
  console.log('Sanitized config:', JSON.stringify(safeConfig, null, 2));
  // API keys, passwords, and tokens will be redacted
  // Email will be partially redacted (j***e@example.com)

  // Sanitize an error
  try {
    throw new Error('Failed to connect with key: sk-ant-' + 'a'.repeat(98));
  } catch (error) {
    const safeError = sanitizeError(error);
    console.log('Sanitized error:', safeError);
    // Error message will have API key redacted
  }
}

// ============================================================================
// EXAMPLE 4: Sanitize HTTP Requests/Responses
// ============================================================================

/**
 * Sanitize HTTP request and response objects before logging
 */
export function example4_HttpSanitization(req: any, res: any) {
  console.log('\n=== Example 4: HTTP Sanitization ===\n');

  // Sanitize request
  const safeReq = sanitizeRequest(req);
  logger.info('Incoming request', { request: safeReq });
  // Authorization headers, cookies, and sensitive query params will be redacted

  // Sanitize response
  const safeRes = sanitizeResponse(res);
  logger.info('Outgoing response', { response: safeRes });
  // Set-Cookie headers and sensitive response headers will be redacted
}

// ============================================================================
// EXAMPLE 5: Error Handling with Sanitization
// ============================================================================

/**
 * Handle errors with automatic sanitization
 */
export async function example5_ErrorHandling() {
  console.log('\n=== Example 5: Error Handling ===\n');

  try {
    // Simulate an API call that might fail with sensitive data in the error
    throw new Error('API call failed with token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc');
  } catch (error) {
    // Option 1: Let the logger sanitize automatically
    logger.error('Operation failed', { error });

    // Option 2: Manually sanitize before logging
    const safeError = sanitizeError(error);
    logger.error('Operation failed (manual sanitization)', { error: safeError });

    // Both approaches work - logger sanitizes automatically anyway
  }
}

// ============================================================================
// EXAMPLE 6: Audit Logging with Sanitization
// ============================================================================

/**
 * Audit logging with automatic sensitive data redaction
 */
export function example6_AuditLogging() {
  console.log('\n=== Example 6: Audit Logging ===\n');

  // Audit logs are automatically sanitized
  auditLog('USER_LOGIN', 'user-123', {
    ip: '192.168.1.1',
    userAgent: 'Mozilla/5.0...',
    sessionId: 'abc123def456', // Will be redacted
    token: 'eyJhbGciOiJIUzI1NiIs...', // Will be redacted
  });

  auditLog('PASSWORD_CHANGE', 'user-123', {
    oldPassword: 'old-secret-123', // Will be redacted
    newPassword: 'new-secret-456', // Will be redacted
    timestamp: new Date().toISOString(),
  });
}

// ============================================================================
// EXAMPLE 7: Security Logging with Sanitization
// ============================================================================

/**
 * Security logging with automatic sensitive data redaction
 */
export function example7_SecurityLogging() {
  console.log('\n=== Example 7: Security Logging ===\n');

  // Security logs are automatically sanitized
  securityLog('UNAUTHORIZED_ACCESS', 'high', {
    userId: 'user-123',
    resource: '/admin/users',
    ip: '192.168.1.1',
    apiKey: 'sk-ant-api03-' + 'a'.repeat(95), // Will be redacted
  });

  securityLog('BRUTE_FORCE_ATTEMPT', 'critical', {
    ip: '192.168.1.100',
    attempts: 50,
    password: 'attempted-password', // Will be redacted
  });
}

// ============================================================================
// EXAMPLE 8: Database Operations Logging
// ============================================================================

/**
 * Log database operations with connection string sanitization
 */
export function example8_DatabaseLogging() {
  console.log('\n=== Example 8: Database Logging ===\n');

  // Database URLs are automatically redacted
  logger.info('Connecting to database', {
    url: 'postgresql://admin:password123@db.example.com:5432/mydb', // Will be redacted
    maxConnections: 10,
  });

  logger.info('Database query executed', {
    query: 'SELECT * FROM users WHERE email = ?',
    params: ['john@example.com'], // Email will be partially redacted
    duration: '45ms',
  });
}

// ============================================================================
// EXAMPLE 9: Third-Party API Integration Logging
// ============================================================================

/**
 * Log third-party API calls with key sanitization
 */
export async function example9_ThirdPartyApiLogging() {
  console.log('\n=== Example 9: Third-Party API Logging ===\n');

  // Stripe API
  logger.info('Calling Stripe API', {
    apiKey: 'sk_live_' + 'a'.repeat(24), // Will be redacted
    endpoint: '/v1/charges',
  });

  // OpenAI API
  logger.info('Calling OpenAI API', {
    apiKey: 'sk-' + 'a'.repeat(48), // Will be redacted
    model: 'gpt-4',
  });

  // Google API
  logger.info('Calling Google Maps API', {
    apiKey: 'AIzaSyC' + 'a'.repeat(32), // Will be redacted
    location: 'Sydney, Australia',
  });
}

// ============================================================================
// EXAMPLE 10: Environment Variable Logging
// ============================================================================

/**
 * Log environment configuration with secret redaction
 */
export function example10_EnvironmentLogging() {
  console.log('\n=== Example 10: Environment Variable Logging ===\n');

  const config = {
    NODE_ENV: 'production',
    DATABASE_URL: 'postgresql://user:pass@host/db', // Will be redacted
    API_KEY: 'sk-ant-api03-' + 'a'.repeat(95), // Will be redacted
    NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co', // Safe, public
    SUPABASE_SERVICE_ROLE_KEY: 'eyJhbGciOiJIUzI1NiIs...', // Will be redacted
    PORT: 3008, // Safe
  };

  logger.info('Application configuration', { config });
  // All secrets will be automatically redacted
}

// ============================================================================
// EXAMPLE 11: Testing Sanitization
// ============================================================================

/**
 * Test the sanitization system to ensure it's working correctly
 */
export function example11_TestingSanitization() {
  console.log('\n=== Example 11: Testing Sanitization ===\n');

  // Option 1: Pretty-printed test results
  runSanitizationTests();

  // Option 2: Programmatic test results
  const { passed, results } = testSanitization();

  if (passed) {
    console.log('\n✅ All sanitization tests passed!');
  } else {
    console.log('\n❌ Some sanitization tests failed:');
    results
      .filter((r) => !r.passed)
      .forEach((r) => {
        console.log(`  - ${r.test}`);
        if (r.details) {
          console.log(`    Output: ${r.details}`);
        }
      });
  }

  return passed;
}

// ============================================================================
// EXAMPLE 12: Before and After Comparison
// ============================================================================

/**
 * Visual comparison of data before and after sanitization
 */
export function example12_BeforeAfterComparison() {
  console.log('\n=== Example 12: Before and After Comparison ===\n');

  const unsafeData = {
    user: {
      id: 'user-123',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
    },
    auth: {
      apiKey: 'sk-ant-api03-' + 'a'.repeat(95),
      token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abc',
      password: 'mysecretpassword123',
    },
    payment: {
      cardNumber: '4532123456789012',
      cvv: '123',
      expiry: '12/25',
    },
    database: {
      url: 'postgresql://admin:secret@db.example.com/mydb',
      maxConnections: 10,
    },
  };

  console.log('BEFORE SANITIZATION:');
  console.log(JSON.stringify(unsafeData, null, 2));

  const safeData = sanitizeObject(unsafeData);

  console.log('\nAFTER SANITIZATION:');
  console.log(JSON.stringify(safeData, null, 2));

  console.log('\nNotice:');
  console.log('  - API keys → [REDACTED_GENERIC_SECRET]');
  console.log('  - JWT tokens → [REDACTED_OAUTH_TOKEN]');
  console.log('  - Passwords → [REDACTED_PASSWORD]');
  console.log('  - Credit cards → [REDACTED_CC_****]9012 (last 4 kept)');
  console.log('  - Emails → j***e@example.com (partial)');
  console.log('  - Phones → ***-***-4567 (last 4 kept)');
  console.log('  - Database URLs → [REDACTED_DB_URL]');
}

// ============================================================================
// RUN ALL EXAMPLES
// ============================================================================

/**
 * Run all examples to demonstrate sanitization capabilities
 */
export async function runAllExamples() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║     Log Sanitization System - Usage Examples             ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  example1_AutomaticSanitization();
  example3_ManualSanitization();
  example6_AuditLogging();
  example7_SecurityLogging();
  example8_DatabaseLogging();
  await example9_ThirdPartyApiLogging();
  example10_EnvironmentLogging();
  example11_TestingSanitization();
  example12_BeforeAfterComparison();

  console.log('\n✨ All examples completed! ✨\n');
}

// Run examples if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}
