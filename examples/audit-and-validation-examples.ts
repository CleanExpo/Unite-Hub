/**
 * Audit Logging and Environment Validation Examples
 *
 * This file demonstrates how to use the new P3-1, P3-2, and P3-6 features:
 * - Environment validation
 * - Audit logging
 * - Feature flags
 *
 * @module examples/audit-and-validation-examples
 */

import { NextRequest, NextResponse } from 'next/server';

// ═══════════════════════════════════════════════════════════
// P3-6: Environment Validation Examples
// ═══════════════════════════════════════════════════════════

import {
  getValidatedEnv,
  validateRuntimeEnv,
  getFeatureFlag,
  isFeatureEnabled,
  EnhancedEnvConfig
} from '@/lib/env-validation-enhanced';

/**
 * Example 1: Basic environment variable validation
 */
function exampleBasicValidation() {
  // Get required string
  const apiKey = getValidatedEnv('ANTHROPIC_API_KEY', {
    type: 'string',
    format: 'anthropic_key',
    required: true,
    description: 'Anthropic Claude API key'
  });

  // Get optional number with default
  const port = getValidatedEnv<number>('PORT', {
    type: 'number',
    required: false,
    default: 3008,
    description: 'Server port'
  });

  // Get URL
  const supabaseUrl = getValidatedEnv('NEXT_PUBLIC_SUPABASE_URL', {
    type: 'url',
    required: true,
    description: 'Supabase project URL'
  });

  console.log({ apiKey: apiKey.substring(0, 8), port, supabaseUrl });
}

/**
 * Example 2: Custom validators
 */
function exampleCustomValidation() {
  // Custom validator for minimum length
  const secret = getValidatedEnv('NEXTAUTH_SECRET', {
    type: 'string',
    required: true,
    validator: (value) => value.length >= 32,
    description: 'NextAuth secret (min 32 chars)'
  });

  // Custom validator for allowed values
  const environment = getValidatedEnv('NODE_ENV', {
    type: 'string',
    required: false,
    default: 'development',
    validator: (v) => ['development', 'production', 'test'].includes(v),
    description: 'Node environment'
  });

  console.log({ secretLength: secret.length, environment });
}

/**
 * Example 3: Feature flags
 */
function exampleFeatureFlags() {
  // Get feature flag with default
  const newDashboardEnabled = getFeatureFlag('FEATURE_NEW_DASHBOARD', false);

  // Check if feature is enabled
  const aiAgentsEnabled = isFeatureEnabled('FEATURE_AI_AGENTS');

  // Conditional logic based on feature flag
  if (newDashboardEnabled) {
    console.log('Using new dashboard');
  } else {
    console.log('Using legacy dashboard');
  }

  console.log({ newDashboardEnabled, aiAgentsEnabled });
}

/**
 * Example 4: Runtime validation
 */
function exampleRuntimeValidation() {
  // Check if Stripe billing is enabled
  if (isFeatureEnabled('FEATURE_STRIPE_BILLING')) {
    // Validate Stripe environment variables at runtime
    const stripeConfig: EnhancedEnvConfig[] = [
      {
        name: 'STRIPE_SECRET_KEY',
        required: true,
        type: 'string',
        format: 'stripe_key',
        description: 'Stripe secret key'
      },
      {
        name: 'STRIPE_WEBHOOK_SECRET',
        required: true,
        type: 'string',
        description: 'Stripe webhook signing secret'
      }
    ];

    try {
      validateRuntimeEnv(stripeConfig);
      console.log('Stripe environment validated');
    } catch (error) {
      console.error('Stripe validation failed:', error.message);
    }
  }
}

// ═══════════════════════════════════════════════════════════
// P3-2: Audit Logging Examples
// ═══════════════════════════════════════════════════════════

import {
  // Admin actions
  logAdminAction,
  logUserManagement,
  logRoleChange,
  logWorkspaceManagement,
  logSystemConfigChange,

  // Data access
  logDataAccess,
  logBulkExport,
  logSensitiveFieldAccess,
  logReportGeneration,

  // Security events
  logSecurityEvent,
  logRateLimitExceeded,
  logSuspiciousActivity,
  logUnauthorizedAccess,

  // Query functions
  queryAuditLogs,
  getUserAuditLogs,
  getWorkspaceAuditLogs,
  getRecentSecurityEvents,
  getAdminActivityLog,

  // Utilities
  extractIpAddress,
  extractUserAgent
} from '@/lib/audit/audit-logger';

/**
 * Example 5: Log admin actions
 */
async function exampleAdminLogging() {
  const adminUserId = 'admin-123';
  const targetUserId = 'user-456';
  const workspaceId = 'workspace-789';

  // Log user creation
  await logUserManagement(
    adminUserId,
    'created',
    targetUserId,
    {
      email: 'newuser@example.com',
      role: 'member'
    }
  );

  // Log role change
  await logRoleChange(
    adminUserId,
    targetUserId,
    'member',      // old role
    'admin',       // new role
    workspaceId
  );

  // Log workspace creation
  await logWorkspaceManagement(
    adminUserId,
    'created',
    workspaceId,
    {
      name: 'New Workspace',
      plan: 'professional'
    }
  );

  // Log system config change
  await logSystemConfigChange(
    adminUserId,
    'FEATURE_NEW_DASHBOARD',
    false,  // old value
    true,   // new value
    'Enabling for beta testing'
  );

  // Generic admin action
  await logAdminAction(
    adminUserId,
    'billing_changed',
    'subscription-123',
    {
      oldPlan: 'starter',
      newPlan: 'professional'
    }
  );
}

/**
 * Example 6: Log data access
 */
async function exampleDataAccessLogging() {
  const userId = 'user-123';
  const workspaceId = 'workspace-456';
  const contactId = 'contact-789';

  // Log contact view
  await logDataAccess(
    userId,
    'contacts',
    contactId,
    'viewed',
    workspaceId
  );

  // Log bulk export
  await logBulkExport(
    userId,
    'contacts',
    150,  // count
    workspaceId,
    'csv'
  );

  // Log sensitive field access
  await logSensitiveFieldAccess(
    userId,
    'contacts',
    contactId,
    'email',
    workspaceId
  );

  // Log report generation
  await logReportGeneration(
    userId,
    'sales_report',
    workspaceId,
    {
      startDate: '2025-11-01',
      endDate: '2025-11-30',
      format: 'pdf'
    }
  );
}

/**
 * Example 7: Log security events
 */
async function exampleSecurityLogging(request: NextRequest) {
  const userId = 'user-123';
  const ipAddress = extractIpAddress(request as unknown as Request);
  const userAgent = extractUserAgent(request as unknown as Request);

  // Log rate limit exceeded
  await logRateLimitExceeded(
    userId,
    '/api/contacts',
    ipAddress,
    userAgent
  );

  // Log suspicious activity
  await logSuspiciousActivity(
    userId,
    'multiple_failed_logins',
    '5 failed login attempts in 2 minutes',
    {
      attempts: 5,
      timeWindow: '2min',
      ipAddress
    }
  );

  // Log unauthorized access
  await logUnauthorizedAccess(
    userId,
    'contacts',
    'contact-123',
    'User not in workspace',
    ipAddress
  );

  // Generic security event
  await logSecurityEvent(
    'api_key_leaked',
    'CRITICAL',
    {
      keyPrefix: 'sk-ant-...',
      detectedAt: new Date().toISOString(),
      revokedAt: new Date().toISOString()
    }
  );
}

/**
 * Example 8: Query audit logs
 */
async function exampleQueryingLogs() {
  const userId = 'user-123';
  const workspaceId = 'workspace-456';

  // Get user audit logs
  const userLogs = await getUserAuditLogs(userId, {
    limit: 50,
    action: 'data.'  // All data access events
  });

  // Get workspace audit logs
  const workspaceLogs = await getWorkspaceAuditLogs(workspaceId, {
    limit: 100
  });

  // Get security events
  const securityLogs = await getRecentSecurityEvents(50);

  // Get admin activity
  const adminLogs = await getAdminActivityLog('admin-123', 100);

  // Custom query with filters
  const customLogs = await queryAuditLogs({
    userId,
    workspaceId,
    action: 'admin.',
    severity: 'ERROR',
    startDate: new Date('2025-12-01'),
    endDate: new Date('2025-12-03'),
    limit: 100,
    offset: 0
  });

  console.log({
    userLogsCount: userLogs.length,
    workspaceLogsCount: workspaceLogs.length,
    securityLogsCount: securityLogs.length,
    adminLogsCount: adminLogs.length,
    customLogsCount: customLogs.length
  });
}

// ═══════════════════════════════════════════════════════════
// Complete Integration Examples
// ═══════════════════════════════════════════════════════════

/**
 * Example 9: API route with environment validation and audit logging
 */
export async function POST_createUser(req: NextRequest) {
  try {
    // 1. Validate environment
    const adminSecret = getValidatedEnv('ADMIN_SECRET', {
      type: 'string',
      required: true,
      description: 'Admin API secret'
    });

    // 2. Parse request
    const body = await req.json();
    const { email, role } = body;

    // 3. Extract request metadata
    const adminUserId = req.headers.get('x-user-id');
    const ipAddress = extractIpAddress(req as unknown as Request);

    // 4. Verify admin secret
    const providedSecret = req.headers.get('x-admin-secret');
    if (providedSecret !== adminSecret) {
      // Log unauthorized access
      await logUnauthorizedAccess(
        adminUserId || undefined,
        'user',
        'create',
        'Invalid admin secret',
        ipAddress
      );

      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 5. Create user (mock)
    const newUser = {
      id: 'user-' + Date.now(),
      email,
      role
    };

    // 6. Log user creation
    await logUserManagement(
      adminUserId!,
      'created',
      newUser.id,
      { email, role }
    );

    // 7. Return success
    return NextResponse.json({ user: newUser });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Example 10: Server action with data access logging
 */
export async function viewContact(contactId: string) {
  'use server';

  // Mock functions (replace with actual implementations)
  const getCurrentUserId = async () => 'user-123';
  const getCurrentWorkspaceId = async () => 'workspace-456';
  const getContactFromDb = async (id: string) => ({ id, name: 'John Doe', email: 'john@example.com' });

  try {
    const userId = await getCurrentUserId();
    const workspaceId = await getCurrentWorkspaceId();

    // Fetch contact
    const contact = await getContactFromDb(contactId);

    // Log data access (fire and forget)
    logDataAccess(userId, 'contacts', contactId, 'viewed', workspaceId)
      .catch(console.error);

    return contact;
  } catch (error) {
    console.error('Error viewing contact:', error);
    throw error;
  }
}

/**
 * Example 11: Feature-gated functionality with runtime validation
 */
export async function processPayment(paymentData: unknown) {
  'use server';

  // Check if billing feature is enabled
  if (!isFeatureEnabled('FEATURE_STRIPE_BILLING')) {
    throw new Error('Billing feature is not enabled');
  }

  // Validate Stripe environment at runtime
  try {
    validateRuntimeEnv([
      {
        name: 'STRIPE_SECRET_KEY',
        required: true,
        type: 'string',
        format: 'stripe_key',
        description: 'Stripe secret key'
      },
      {
        name: 'STRIPE_WEBHOOK_SECRET',
        required: true,
        type: 'string',
        description: 'Stripe webhook signing secret'
      }
    ]);
  } catch (error) {
    console.error('Stripe environment validation failed:', error);
    throw new Error('Billing service not properly configured');
  }

  // Process payment (mock)
  console.log('Processing payment with Stripe:', paymentData);

  // Log billing event
  await logAdminAction(
    'system',
    'payment_processed',
    'payment-123',
    {
      amount: 1000,
      currency: 'USD',
      method: 'stripe'
    }
  );

  return { success: true };
}

/**
 * Example 12: Middleware with access logging
 */
export async function authMiddleware(req: NextRequest) {
  // Mock function (replace with actual implementation)
  const getToken = async () => ({ userId: 'user-123' });

  const token = await getToken();

  if (!token) {
    // Log unauthorized access
    await logUnauthorizedAccess(
      undefined,
      'api',
      req.nextUrl.pathname,
      'No authentication token',
      extractIpAddress(req as unknown as Request)
    );

    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

// ═══════════════════════════════════════════════════════════
// Export all examples
// ═══════════════════════════════════════════════════════════

export const examples = {
  // Environment validation
  exampleBasicValidation,
  exampleCustomValidation,
  exampleFeatureFlags,
  exampleRuntimeValidation,

  // Audit logging
  exampleAdminLogging,
  exampleDataAccessLogging,
  exampleSecurityLogging,
  exampleQueryingLogs,

  // Integration
  POST_createUser,
  viewContact,
  processPayment,
  authMiddleware
};

/**
 * Run all examples (for testing)
 */
export async function runAllExamples() {
  console.log('Running all examples...\n');

  try {
    console.log('=== Environment Validation Examples ===');
    exampleBasicValidation();
    exampleCustomValidation();
    exampleFeatureFlags();
    exampleRuntimeValidation();

    console.log('\n=== Audit Logging Examples ===');
    await exampleAdminLogging();
    await exampleDataAccessLogging();
    // exampleSecurityLogging requires NextRequest
    await exampleQueryingLogs();

    console.log('\nAll examples completed successfully!');
  } catch (error) {
    console.error('Example failed:', error);
  }
}
