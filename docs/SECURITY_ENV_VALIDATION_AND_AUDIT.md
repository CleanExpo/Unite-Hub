# Security: Environment Validation and Audit Logging

**Tasks**: P3-1, P3-2, P3-6
**Priority**: LOW
**Status**: ✅ COMPLETE
**Date**: 2025-12-03

## Overview

This document covers three related security enhancements:

1. **P3-1**: Startup Environment Validation
2. **P3-2**: Expanded Audit Logging
3. **P3-6**: Environment Variable Validation Enhancement

## Table of Contents

- [P3-1: Startup Environment Validation](#p3-1-startup-environment-validation)
- [P3-2: Expanded Audit Logging](#p3-2-expanded-audit-logging)
- [P3-6: Environment Variable Validation Enhancement](#p3-6-environment-variable-validation-enhancement)
- [Integration Guide](#integration-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)

---

## P3-1: Startup Environment Validation

### Purpose

Validates all required environment variables before app startup to prevent runtime errors and provide clear error messages.

### Implementation

**Script**: `scripts/validate-env-production.mjs`

**Features**:
- ✅ Validates existence of required variables
- ✅ Checks format (UUIDs, URLs, key prefixes)
- ✅ Groups by service (Supabase, Auth, AI, Email, etc.)
- ✅ Exits with code 1 if validation fails
- ✅ Color-coded terminal output
- ✅ Masked sensitive values in output
- ✅ Suggests fixes for common issues

**Services Validated**:

| Service | Variables | Required |
|---------|-----------|----------|
| **Next.js** | NODE_ENV, NEXTAUTH_URL, NEXTAUTH_SECRET | 2/3 |
| **Supabase** | NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY | 3/3 |
| **Google OAuth** | GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET | 2/3 |
| **AI Services** | ANTHROPIC_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY, PERPLEXITY_API_KEY, GEMINI_API_KEY | 1/5 |
| **Email** | SENDGRID_API_KEY, RESEND_API_KEY, EMAIL_SERVER_* | 0/7 (at least one service) |
| **Stripe** | STRIPE_SECRET_KEY, STRIPE_PRICE_ID_*, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | 0/6 |
| **Redis** | REDIS_URL, UPSTASH_REDIS_REST_* | 0/3 |
| **Monitoring** | SENTRY_DSN, NEXT_PUBLIC_POSTHOG_KEY | 0/3 |

### Usage

```bash
# Manual validation
node scripts/validate-env-production.mjs

# Automatic validation (runs before build/start)
npm run build    # prebuild hook runs validation
npm run start    # prestart hook runs validation
```

### Output Example

```
╔═══════════════════════════════════════════════════════════╗
║     Unite-Hub Production Environment Validation          ║
╚═══════════════════════════════════════════════════════════╝

[Supabase]
────────────────────────────────────────────────────────────
✓ NEXT_PUBLIC_SUPABASE_URL
  https://xxxxx.supabase.co
✓ NEXT_PUBLIC_SUPABASE_ANON_KEY
  eyJhbGci...XVCd
✓ SUPABASE_SERVICE_ROLE_KEY
  eyJhbGci...k5Qw

[AI Services]
────────────────────────────────────────────────────────────
✓ ANTHROPIC_API_KEY
  sk-ant-a...3mNQ
○ OPENAI_API_KEY
  Not set (optional)
  OpenAI API key (for Whisper transcription)

[Validation Summary]
────────────────────────────────────────────────────────────
Total variables checked: 45
Required variables: 12
Passed: 12
Failed: 0
Warnings: 0
Missing (optional): 33

✅ Environment validation PASSED
```

### Package.json Hooks

```json
{
  "scripts": {
    "prebuild": "node scripts/validate-env-production.mjs",
    "prestart": "node scripts/validate-env-production.mjs"
  }
}
```

These hooks automatically run validation before building or starting the app.

---

## P3-2: Expanded Audit Logging

### Purpose

Comprehensive audit logging system for tracking admin actions, data access, authentication events, and security incidents.

### Implementation

**Module**: `src/lib/audit/audit-logger.ts`

**Integrates with**:
- `src/lib/auth/audit-logger.ts` (auth-specific events)
- `src/core/security/audit-logger.ts` (security-focused events)

### Event Categories

#### 1. Admin Actions

```typescript
import {
  logAdminAction,
  logUserManagement,
  logRoleChange,
  logWorkspaceManagement,
  logSystemConfigChange
} from '@/lib/audit/audit-logger';

// Example: Log user creation
await logUserManagement(
  adminUserId,
  'created',
  newUserId,
  { email: 'user@example.com', role: 'member' }
);

// Example: Log role change
await logRoleChange(
  adminUserId,
  targetUserId,
  'member',
  'admin',
  workspaceId
);

// Example: Log system config change
await logSystemConfigChange(
  adminUserId,
  'FEATURE_NEW_DASHBOARD',
  false,
  true,
  'Enabling new dashboard for beta testing'
);
```

**Admin Event Types**:
- `admin.user_created`
- `admin.user_deleted`
- `admin.user_updated`
- `admin.role_changed`
- `admin.permissions_changed`
- `admin.workspace_created`
- `admin.workspace_deleted`
- `admin.workspace_settings_changed`
- `admin.billing_changed`
- `admin.feature_flag_changed`
- `admin.system_config_changed`

#### 2. Data Access Events

```typescript
import {
  logDataAccess,
  logBulkExport,
  logSensitiveFieldAccess,
  logReportGeneration
} from '@/lib/audit/audit-logger';

// Example: Log contact view
await logDataAccess(
  userId,
  'contacts',
  contactId,
  'viewed',
  workspaceId
);

// Example: Log bulk export
await logBulkExport(
  userId,
  'contacts',
  150,  // count
  workspaceId,
  'csv'
);

// Example: Log sensitive field access
await logSensitiveFieldAccess(
  userId,
  'contacts',
  contactId,
  'email',
  workspaceId
);
```

**Data Event Types**:
- `data.contact_viewed`
- `data.contact_exported`
- `data.bulk_export`
- `data.email_viewed`
- `data.campaign_viewed`
- `data.report_generated`
- `data.sensitive_field_accessed`

#### 3. Authentication Events

**Note**: Handled by `src/lib/auth/audit-logger.ts`

```typescript
import {
  logAuthSuccess,
  logAuthFailure,
  logAccessGranted,
  logAccessDenied
} from '@/lib/auth/audit-logger';

// Example: Log successful login
await logAuthSuccess(userId, email, { method: 'google_oauth' });

// Example: Log failed login
await logAuthFailure(email, 'Invalid credentials');
```

#### 4. Security Events

```typescript
import {
  logSecurityEvent,
  logRateLimitExceeded,
  logSuspiciousActivity,
  logUnauthorizedAccess
} from '@/lib/audit/audit-logger';

// Example: Log rate limit exceeded
await logRateLimitExceeded(
  userId,
  '/api/contacts',
  ipAddress,
  userAgent
);

// Example: Log suspicious activity
await logSuspiciousActivity(
  userId,
  'multiple_failed_logins',
  '5 failed login attempts in 2 minutes',
  { attempts: 5, timeWindow: '2min' }
);
```

**Security Event Types**:
- `security.rate_limit_exceeded`
- `security.suspicious_activity`
- `security.ip_blocked`
- `security.unauthorized_access`
- `security.api_key_leaked`
- `security.webhook_signature_invalid`

### Severity Levels

```typescript
type AuditSeverity = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
```

| Level | Usage | Examples |
|-------|-------|----------|
| **DEBUG** | Development/troubleshooting | Data access logging |
| **INFO** | Normal operations | User created, login success |
| **WARN** | Important changes | Role changed, workspace deleted |
| **ERROR** | Failed operations | Unauthorized access, API errors |
| **CRITICAL** | Security incidents | Data breach, system compromise |

### Querying Audit Logs

```typescript
import {
  queryAuditLogs,
  getUserAuditLogs,
  getWorkspaceAuditLogs,
  getRecentSecurityEvents,
  getAdminActivityLog
} from '@/lib/audit/audit-logger';

// Query with filters
const logs = await queryAuditLogs({
  userId: 'user-id',
  workspaceId: 'workspace-id',
  action: 'admin.',  // All admin actions
  severity: 'ERROR',
  startDate: new Date('2025-12-01'),
  endDate: new Date('2025-12-03'),
  limit: 100,
  offset: 0
});

// Get user audit logs
const userLogs = await getUserAuditLogs(userId, {
  limit: 50,
  action: 'data.'
});

// Get recent security events
const securityEvents = await getRecentSecurityEvents(50);
```

### Database Schema

The `audit_logs` table (from migration `001_initial_schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  resource_id TEXT,
  agent TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error', 'warning')),
  error_message TEXT,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_audit_logs_org_id ON audit_logs(org_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
```

**Note**: The schema uses `org_id` but the logger maps it to `workspace_id` for consistency.

---

## P3-6: Environment Variable Validation Enhancement

### Purpose

Advanced environment variable validation with type checking, format validation, defaults, and runtime validation.

### Implementation

**Module**: `src/lib/env-validation-enhanced.ts`

### Features

#### 1. Type Validation

Supported types:
- `string` - Non-empty string
- `number` - Valid number
- `boolean` - true/false, 1/0, yes/no
- `url` - Valid URL
- `email` - Valid email address
- `uuid` - Valid UUID format
- `json` - Valid JSON string

```typescript
import { getValidatedEnv } from '@/lib/env-validation-enhanced';

// Validate as number with default
const port = getValidatedEnv<number>('PORT', {
  type: 'number',
  required: false,
  default: 3008,
  description: 'Server port'
});

// Validate as URL
const apiUrl = getValidatedEnv<string>('API_URL', {
  type: 'url',
  required: true,
  description: 'API base URL'
});

// Validate as boolean
const debugMode = getValidatedEnv<boolean>('DEBUG_MODE', {
  type: 'boolean',
  required: false,
  default: false
});
```

#### 2. Format Validation

Supported formats:
- `jwt` - JWT token format
- `supabase_key` - Supabase key (JWT)
- `anthropic_key` - Anthropic API key (sk-ant-)
- `openai_key` - OpenAI API key (sk- or sk-proj-)
- `stripe_key` - Stripe key (sk_test_, sk_live_, etc.)
- `google_client_id` - Google OAuth client ID
- `google_client_secret` - Google OAuth secret
- `port` - Valid port number (1-65535)

```typescript
import { getValidatedEnv } from '@/lib/env-validation-enhanced';

// Validate Anthropic API key
const anthropicKey = getValidatedEnv('ANTHROPIC_API_KEY', {
  type: 'string',
  format: 'anthropic_key',
  required: true,
  description: 'Anthropic Claude API key'
});

// Validate Stripe key
const stripeKey = getValidatedEnv('STRIPE_SECRET_KEY', {
  type: 'string',
  format: 'stripe_key',
  required: false,
  description: 'Stripe secret key'
});
```

#### 3. Feature Flags

```typescript
import {
  getFeatureFlag,
  isFeatureEnabled
} from '@/lib/env-validation-enhanced';

// Get feature flag with default
const newDashboardEnabled = getFeatureFlag('FEATURE_NEW_DASHBOARD', false);

// Check if feature is enabled
if (isFeatureEnabled('FEATURE_AI_AGENTS')) {
  // Run AI agent workflows
}
```

**Predefined Feature Flags**:

| Flag | Description | Default |
|------|-------------|---------|
| `FEATURE_NEW_DASHBOARD` | Enable new dashboard UI | false |
| `FEATURE_AI_AGENTS` | Enable AI agent workflows | true |
| `FEATURE_ADVANCED_ANALYTICS` | Enable advanced analytics | false |
| `FEATURE_STRIPE_BILLING` | Enable Stripe billing integration | false |

#### 4. Runtime Validation

Validate environment when features are accessed at runtime:

```typescript
import { validateRuntimeEnv } from '@/lib/env-validation-enhanced';

// Validate Stripe env vars when billing feature is accessed
if (isFeatureEnabled('FEATURE_STRIPE_BILLING')) {
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
}
```

#### 5. Custom Validators and Transformers

```typescript
import { getValidatedEnv } from '@/lib/env-validation-enhanced';

// Custom validator
const customValue = getValidatedEnv('CUSTOM_VALUE', {
  type: 'string',
  required: true,
  validator: (value) => value.length >= 10,
  description: 'Custom value (min 10 chars)'
});

// Custom transformer
const parsedConfig = getValidatedEnv<{ key: string }>('APP_CONFIG', {
  type: 'json',
  required: true,
  transformer: (value) => JSON.parse(value),
  description: 'Application configuration (JSON)'
});
```

### Example Configuration

```typescript
import { EnhancedEnvConfig } from '@/lib/env-validation-enhanced';

const myEnvVars: EnhancedEnvConfig[] = [
  {
    name: 'DATABASE_URL',
    required: true,
    type: 'url',
    description: 'PostgreSQL connection URL',
    example: 'postgresql://user:pass@host:5432/db'
  },
  {
    name: 'CACHE_TTL',
    required: false,
    type: 'number',
    default: 3600,
    description: 'Cache TTL in seconds',
    validator: (v) => parseInt(v) > 0
  },
  {
    name: 'DEPRECATED_KEY',
    required: false,
    type: 'string',
    deprecated: true,
    deprecationMessage: 'Use NEW_KEY instead',
    description: 'Old API key (deprecated)'
  }
];
```

---

## Integration Guide

### 1. Add Environment Validation to API Routes

```typescript
// src/app/api/admin/users/route.ts
import { logAdminAction } from '@/lib/audit/audit-logger';
import { getValidatedEnv } from '@/lib/env-validation-enhanced';

export async function POST(req: Request) {
  try {
    // Validate environment
    const adminSecret = getValidatedEnv('ADMIN_SECRET', {
      type: 'string',
      required: true,
      description: 'Admin API secret'
    });

    // ... create user logic ...

    // Log admin action
    await logAdminAction(
      adminUserId,
      'user_created',
      newUser.id,
      { email: newUser.email, role: newUser.role }
    );

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

### 2. Add Audit Logging to Middleware

```typescript
// src/middleware.ts
import { logAccessDenied } from '@/lib/auth/audit-logger';
import { extractIpAddress, extractUserAgent } from '@/lib/audit/audit-logger';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  if (!token) {
    // Log unauthorized access
    await logAccessDenied(
      undefined,
      'api',
      req.nextUrl.pathname,
      'No authentication token'
    );

    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}
```

### 3. Feature Flag Usage

```typescript
// src/app/dashboard/analytics/page.tsx
import { isFeatureEnabled } from '@/lib/env-validation-enhanced';

export default function AnalyticsPage() {
  const advancedAnalyticsEnabled = isFeatureEnabled('FEATURE_ADVANCED_ANALYTICS');

  return (
    <div>
      {advancedAnalyticsEnabled ? (
        <AdvancedAnalyticsDashboard />
      ) : (
        <BasicAnalyticsDashboard />
      )}
    </div>
  );
}
```

---

## Testing

### Test Environment Validation

```bash
# Run validation script
node scripts/validate-env-production.mjs

# Should pass with all required vars set
# Should fail if required vars missing
# Should warn for optional vars not set
```

### Test Audit Logging

```typescript
// tests/unit/lib/audit/audit-logger.test.ts
import { describe, it, expect } from 'vitest';
import { logAdminAction, queryAuditLogs } from '@/lib/audit/audit-logger';

describe('Audit Logger', () => {
  it('should log admin action', async () => {
    await logAdminAction('admin-id', 'user_created', 'user-id', {
      email: 'test@example.com'
    });

    const logs = await queryAuditLogs({
      userId: 'admin-id',
      action: 'admin.user_created',
      limit: 1
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].action).toBe('admin.user_created');
  });
});
```

### Test Enhanced Validation

```typescript
// tests/unit/lib/env-validation-enhanced.test.ts
import { describe, it, expect } from 'vitest';
import { validateEnvVar, getFeatureFlag } from '@/lib/env-validation-enhanced';

describe('Enhanced Env Validation', () => {
  it('should validate URL format', () => {
    const result = validateEnvVar({
      name: 'TEST_URL',
      required: true,
      type: 'url',
      description: 'Test URL'
    });

    // Set process.env.TEST_URL = 'https://example.com' before test
    expect(result.valid).toBe(true);
  });

  it('should get feature flag', () => {
    // Set process.env.FEATURE_TEST = 'true' before test
    const enabled = getFeatureFlag('FEATURE_TEST', false);
    expect(enabled).toBe(true);
  });
});
```

---

## Troubleshooting

### Environment Validation Fails

**Problem**: `npm run build` or `npm run start` fails with validation errors

**Solution**:
1. Check error output for missing/invalid variables
2. Copy `.env.example` to `.env.local`
3. Fill in required values
4. Verify format matches examples

### Audit Logs Not Appearing

**Problem**: Audit events logged but not visible in database

**Solution**:
1. Check `audit_logs` table exists: `SELECT * FROM audit_logs LIMIT 1;`
2. Check Supabase connection in audit logger
3. Check console for "Audit logging failed" errors
4. Verify workspace_id is valid UUID

### Feature Flag Not Working

**Problem**: Feature flag returns wrong value

**Solution**:
1. Check environment variable is set (e.g., `FEATURE_NEW_DASHBOARD=true`)
2. Verify boolean format (true/false, 1/0, yes/no)
3. Check default value in code
4. Restart app after changing env vars

### Type Validation Errors

**Problem**: `getValidatedEnv` throws type validation error

**Solution**:
1. Verify type matches value (e.g., 'number' for PORT=3008)
2. Check format validator requirements (e.g., URL must include protocol)
3. Use `required: false` and `default` for optional vars
4. Check custom validator logic if provided

---

## Summary

### Files Created

1. ✅ `scripts/validate-env-production.mjs` - Startup validation script
2. ✅ `src/lib/audit/audit-logger.ts` - Centralized audit logger
3. ✅ `src/lib/env-validation-enhanced.ts` - Enhanced validation module
4. ✅ `docs/SECURITY_ENV_VALIDATION_AND_AUDIT.md` - This documentation

### Files Modified

1. ✅ `package.json` - Added prebuild and prestart hooks

### Integration Points

- **Existing Auth Audit Logger**: `src/lib/auth/audit-logger.ts`
- **Existing Security Audit Logger**: `src/core/security/audit-logger.ts`
- **Existing Env Validation**: `src/lib/env-validation.ts`
- **Database Schema**: `supabase/migrations/001_initial_schema.sql`

### Next Steps

1. **Integrate audit logging** into critical API routes
2. **Add feature flags** to .env.example
3. **Test validation** in CI/CD pipeline
4. **Monitor audit logs** in production
5. **Create admin UI** for viewing audit logs
6. **Set up alerts** for security events

---

**Documentation Version**: 1.0
**Last Updated**: 2025-12-03
**Author**: Backend System Architect
