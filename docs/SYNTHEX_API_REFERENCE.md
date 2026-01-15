# Synthex CLI - API Reference

**Version**: 1.0.0
**Last Updated**: 2026-01-15
**Target Audience**: Developers, system integrators

---

## Table of Contents

1. [Introduction](#introduction)
2. [Service Architecture](#service-architecture)
3. [Tenant Management Service](#tenant-management-service)
4. [Shopify Integration Service](#shopify-integration-service)
5. [Google Merchant Service](#google-merchant-service)
6. [Batch Operations Service](#batch-operations-service)
7. [Tenant Template Service](#tenant-template-service)
8. [Usage Analytics Service](#usage-analytics-service)
9. [Credential Alert Service](#credential-alert-service)
10. [Health Monitor Service](#health-monitor-service)
11. [Notification Service](#notification-service)
12. [Type Definitions](#type-definitions)
13. [Error Handling](#error-handling)

---

## Introduction

This document provides comprehensive API documentation for all Synthex Apex Architecture services. Each service exposes TypeScript/JavaScript APIs for programmatic access.

**Base Path**: `src/cli/services/`

**Import Pattern**:
```typescript
import { ServiceName } from '@/cli/services/category/service-name';
```

**Authentication**: All services require valid Supabase credentials in environment variables.

---

## Service Architecture

```
src/cli/services/
├── tenant-management/       # Core tenant operations
│   ├── tenant-service.ts
│   └── credential-service.ts
├── integrations/            # Platform integrations
│   ├── shopify-service.ts
│   └── google-merchant-service.ts
├── advanced/                # Advanced features
│   ├── batch-operations.ts
│   └── tenant-templates.ts
└── monitoring/              # Monitoring & alerting
    ├── usage-analytics.ts
    ├── credential-alerts.ts
    ├── health-monitor.ts
    └── notification-service.ts
```

---

## Tenant Management Service

**Location**: `src/cli/services/tenant-management/tenant-service.ts`

### Class: `TenantService`

Manages tenant lifecycle operations (CRUD).

#### Constructor

```typescript
constructor(workspaceId?: string)
```

**Parameters**:
- `workspaceId` (optional): Workspace UUID. If not provided, reads from config.

---

#### Method: `create()`

Create a new tenant.

```typescript
async create(tenant: CreateTenantInput): Promise<Tenant>
```

**Parameters**:
```typescript
interface CreateTenantInput {
  workspaceId: string;
  tenantId: string;          // Unique tenant identifier
  name: string;              // Display name
  type: 'shopify' | 'google-merchant' | 'mixed';
  market: 'ANZ_SMB' | 'ANZ_ENTERPRISE' | 'US_SMB' | 'UK_SMB';
  region: string;            // e.g., 'AU-SE1', 'US-EA1'
  shopifyShop?: string;      // Required if type includes Shopify
  gmcMerchantId?: string;    // Required if type includes GMC
  industry?: string;
  website?: string;
  contactEmail?: string;
}
```

**Returns**: `Promise<Tenant>`

**Example**:
```typescript
const tenantService = new TenantService('workspace-uuid');

const tenant = await tenantService.create({
  workspaceId: 'workspace-uuid',
  tenantId: 'SMB_CLIENT_001',
  name: 'Acme Corporation',
  type: 'shopify',
  market: 'ANZ_SMB',
  region: 'AU-SE1',
  shopifyShop: 'acme.myshopify.com',
  industry: 'Retail',
  website: 'https://acme.com',
  contactEmail: 'contact@acme.com',
});

console.log(`Created tenant: ${tenant.tenantId}`);
```

---

#### Method: `list()`

List all tenants in workspace.

```typescript
async list(filters?: TenantFilters): Promise<Tenant[]>
```

**Parameters**:
```typescript
interface TenantFilters {
  status?: 'active' | 'inactive' | 'suspended';
  type?: 'shopify' | 'google-merchant' | 'mixed';
  market?: string;
}
```

**Returns**: `Promise<Tenant[]>`

**Example**:
```typescript
// Get all active Shopify tenants
const activeTenants = await tenantService.list({
  status: 'active',
  type: 'shopify',
});

console.log(`Found ${activeTenants.length} active Shopify tenants`);
```

---

#### Method: `get()`

Get single tenant by ID.

```typescript
async get(tenantId: string): Promise<Tenant | null>
```

**Returns**: `Promise<Tenant | null>` - null if not found

**Example**:
```typescript
const tenant = await tenantService.get('SMB_CLIENT_001');

if (tenant) {
  console.log(`Tenant: ${tenant.name}`);
} else {
  console.log('Tenant not found');
}
```

---

#### Method: `update()`

Update tenant properties.

```typescript
async update(tenantId: string, updates: Partial<Tenant>): Promise<Tenant>
```

**Example**:
```typescript
const updated = await tenantService.update('SMB_CLIENT_001', {
  name: 'Acme Corp Pty Ltd',
  status: 'active',
});
```

---

#### Method: `delete()`

Delete tenant (soft delete).

```typescript
async delete(tenantId: string): Promise<void>
```

**Example**:
```typescript
await tenantService.delete('SMB_CLIENT_001');
console.log('Tenant deleted');
```

---

## Shopify Integration Service

**Location**: `src/cli/services/integrations/shopify-service.ts`

### Class: `ShopifyService`

Manages Shopify product and order synchronization.

#### Method: `syncProducts()`

Sync products from Shopify store.

```typescript
async syncProducts(
  tenantId: string,
  options?: SyncOptions
): Promise<SyncResult>
```

**Parameters**:
```typescript
interface SyncOptions {
  limit?: number;            // Max products to sync (default: 250)
  sinceId?: string;          // Sync products after this ID
  fullSync?: boolean;        // Full sync vs incremental
}
```

**Returns**:
```typescript
interface SyncResult {
  totalSynced: number;
  created: number;
  updated: number;
  errors: number;
  duration: number;          // milliseconds
}
```

**Example**:
```typescript
const shopifyService = new ShopifyService();

const result = await shopifyService.syncProducts('SMB_CLIENT_001', {
  limit: 100,
  fullSync: false,
});

console.log(`Synced ${result.totalSynced} products in ${result.duration}ms`);
```

---

#### Method: `syncOrders()`

Sync orders from Shopify store.

```typescript
async syncOrders(
  tenantId: string,
  options?: OrderSyncOptions
): Promise<SyncResult>
```

**Parameters**:
```typescript
interface OrderSyncOptions {
  limit?: number;
  status?: 'open' | 'closed' | 'cancelled' | 'any';
  createdAtMin?: string;     // ISO 8601 date
  createdAtMax?: string;
}
```

**Example**:
```typescript
const result = await shopifyService.syncOrders('SMB_CLIENT_001', {
  status: 'open',
  createdAtMin: '2026-01-01T00:00:00Z',
});
```

---

## Google Merchant Service

**Location**: `src/cli/services/integrations/google-merchant-service.ts`

### Class: `GoogleMerchantService`

Manages Google Merchant Center feed operations.

#### Method: `syncFeed()`

Sync product feed to Google Merchant Center.

```typescript
async syncFeed(
  tenantId: string,
  options?: FeedSyncOptions
): Promise<FeedSyncResult>
```

**Parameters**:
```typescript
interface FeedSyncOptions {
  dryRun?: boolean;          // Validate without submitting
  batchSize?: number;        // Products per batch (default: 100)
}
```

**Returns**:
```typescript
interface FeedSyncResult {
  totalProducts: number;
  submitted: number;
  rejected: number;
  warnings: number;
  errors: Array<{
    productId: string;
    message: string;
  }>;
}
```

**Example**:
```typescript
const gmcService = new GoogleMerchantService();

// Dry run first
const dryRun = await gmcService.syncFeed('ENTERPRISE_001', {
  dryRun: true,
});

if (dryRun.errors.length === 0) {
  // Actual sync
  const result = await gmcService.syncFeed('ENTERPRISE_001');
  console.log(`Submitted ${result.submitted} products`);
}
```

---

#### Method: `getProductStatus()`

Get product status in Google Merchant Center.

```typescript
async getProductStatus(
  tenantId: string,
  productId: string
): Promise<ProductStatus>
```

**Returns**:
```typescript
interface ProductStatus {
  productId: string;
  status: 'active' | 'disapproved' | 'pending';
  issues: Array<{
    severity: 'error' | 'warning';
    code: string;
    description: string;
  }>;
  lastUpdated: string;
}
```

**Example**:
```typescript
const status = await gmcService.getProductStatus('ENTERPRISE_001', '12345');

if (status.status === 'disapproved') {
  console.log('Product issues:');
  status.issues.forEach(issue => {
    console.log(`- [${issue.severity}] ${issue.description}`);
  });
}
```

---

## Batch Operations Service

**Location**: `src/cli/services/advanced/batch-operations.ts`

### Class: `BatchOperationsService`

Executes bulk operations on multiple tenants.

#### Method: `createTenantsFromCSV()`

Create multiple tenants from CSV file.

```typescript
async createTenantsFromCSV(
  csvFilePath: string,
  options?: BatchCreateOptions
): Promise<BatchResult>
```

**CSV Format**:
```csv
tenantId,name,type,market,region,shopifyShop,gmcMerchantId
SMB_001,Client One,shopify,ANZ_SMB,AU-SE1,client1.myshopify.com,
SMB_002,Client Two,google-merchant,ANZ_SMB,AU-SE1,,123456789
```

**Parameters**:
```typescript
interface BatchCreateOptions {
  dryRun?: boolean;          // Validate without creating
  continueOnError?: boolean; // Continue if one fails
  batchSize?: number;        // Tenants per batch (default: 25)
}
```

**Returns**:
```typescript
interface BatchResult {
  total: number;
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    tenantId: string;
    error: string;
  }>;
}
```

**Example**:
```typescript
const batchService = new BatchOperationsService();

// Dry run first
const validation = await batchService.createTenantsFromCSV('tenants.csv', {
  dryRun: true,
});

if (validation.failed === 0) {
  // Actual import
  const result = await batchService.createTenantsFromCSV('tenants.csv');
  console.log(`Created ${result.successful}/${result.total} tenants`);
} else {
  console.error('Validation errors:', validation.errors);
}
```

---

#### Method: `updateTenants()`

Update multiple tenants.

```typescript
async updateTenants(
  tenantIds: string[],
  updates: Partial<Tenant>
): Promise<BatchResult>
```

**Example**:
```typescript
const result = await batchService.updateTenants(
  ['CLIENT_001', 'CLIENT_002', 'CLIENT_003'],
  { status: 'inactive' }
);

console.log(`Updated ${result.successful} tenants`);
```

---

## Tenant Template Service

**Location**: `src/cli/services/advanced/tenant-templates.ts`

### Class: `TenantTemplateService`

Manages tenant templates.

#### Method: `listTemplates()`

List all available templates.

```typescript
async listTemplates(): Promise<TenantTemplate[]>
```

**Returns**:
```typescript
interface TenantTemplate {
  id: string;
  name: string;
  description: string;
  type: 'shopify' | 'google-merchant' | 'mixed';
  market: string;
  defaultSettings: Record<string, any>;
  createdAt: string;
}
```

**Example**:
```typescript
const templateService = new TenantTemplateService();

const templates = await templateService.listTemplates();

templates.forEach(template => {
  console.log(`${template.id}: ${template.name}`);
});
```

---

#### Method: `createTenantFromTemplate()`

Create tenant using template.

```typescript
async createTenantFromTemplate(
  templateId: string,
  overrides: TenantTemplateOverrides
): Promise<Tenant>
```

**Parameters**:
```typescript
interface TenantTemplateOverrides {
  tenantId: string;
  name: string;
  shopifyShop?: string;
  gmcMerchantId?: string;
  contactEmail?: string;
}
```

**Example**:
```typescript
const tenant = await templateService.createTenantFromTemplate(
  'shopify-smb-anz',
  {
    tenantId: 'SMB_CLIENT_005',
    name: 'New Client Pty Ltd',
    shopifyShop: 'newclient.myshopify.com',
    contactEmail: 'contact@newclient.com',
  }
);
```

---

## Usage Analytics Service

**Location**: `src/cli/services/monitoring/usage-analytics.ts`

### Class: `UsageAnalyticsService`

Tracks and reports CLI usage metrics.

#### Method: `trackMetric()`

Record a usage metric.

```typescript
async trackMetric(metric: UsageMetric): Promise<void>
```

**Parameters**:
```typescript
interface UsageMetric {
  timestamp: string;
  workspaceId: string;
  userId?: string;
  metricType: 'command' | 'api_call' | 'credential_op' | 'tenant_op' | 'error';
  metricName: string;
  value: number;
  metadata?: Record<string, any>;
}
```

**Example**:
```typescript
const analyticsService = new UsageAnalyticsService();

await analyticsService.trackMetric({
  timestamp: new Date().toISOString(),
  workspaceId: 'workspace-uuid',
  metricType: 'command',
  metricName: 'tenant.create',
  value: 1,
  metadata: { tenantType: 'shopify' },
});
```

---

#### Method: `getReport()`

Generate usage report for time period.

```typescript
async getReport(
  workspaceId: string,
  startDate: Date,
  endDate: Date
): Promise<UsageReport>
```

**Returns**:
```typescript
interface UsageReport {
  period: { start: string; end: string };
  totalCommands: number;
  totalApiCalls: number;
  totalErrors: number;
  byCommand: Record<string, number>;
  byService: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
  performanceMetrics: {
    avgExecutionTime: number;
    p50ExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
  };
}
```

**Example**:
```typescript
const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
const now = new Date();

const report = await analyticsService.getReport('workspace-uuid', sevenDaysAgo, now);

console.log(`Total commands: ${report.totalCommands}`);
console.log(`p95 execution time: ${report.performanceMetrics.p95ExecutionTime}ms`);
```

---

## Credential Alert Service

**Location**: `src/cli/services/monitoring/credential-alerts.ts`

### Class: `CredentialAlertService`

Manages credential expiry alerts.

#### Method: `checkAndSendAlerts()`

Check all credentials and send alerts.

```typescript
async checkAndSendAlerts(): Promise<Alert[]>
```

**Returns**: `Promise<Alert[]>` - Array of alerts generated

**Example**:
```typescript
const alertService = new CredentialAlertService();

const alerts = await alertService.checkAndSendAlerts();

console.log(`Generated ${alerts.length} alerts`);

alerts.forEach(alert => {
  console.log(`[${alert.severity}] ${alert.message}`);
});
```

---

#### Method: `configureAlertRule()`

Configure alert routing rule.

```typescript
async configureAlertRule(rule: AlertRuleInput): Promise<AlertRule>
```

**Parameters**:
```typescript
interface AlertRuleInput {
  workspaceId: string;
  alertType: 'expiring_30d' | 'expiring_7d' | 'expiring_1d' | 'expired';
  channels: Array<'email' | 'slack' | 'webhook'>;
  emailRecipients?: string[];
  slackWebhookUrl?: string;
  customWebhookUrl?: string;
}
```

**Example**:
```typescript
const rule = await alertService.configureAlertRule({
  workspaceId: 'workspace-uuid',
  alertType: 'expiring_7d',
  channels: ['email', 'slack'],
  emailRecipients: ['ops@example.com', 'admin@example.com'],
  slackWebhookUrl: 'https://hooks.slack.com/services/...',
});

console.log(`Created alert rule: ${rule.id}`);
```

---

## Health Monitor Service

**Location**: `src/cli/services/monitoring/health-monitor.ts`

### Class: `HealthMonitorService`

Performs system health checks.

#### Method: `runHealthChecks()`

Execute all health checks.

```typescript
async runHealthChecks(): Promise<HealthReport>
```

**Returns**:
```typescript
interface HealthReport {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
}

interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastChecked: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}
```

**Example**:
```typescript
const healthService = new HealthMonitorService();

const report = await healthService.runHealthChecks();

console.log(`Overall status: ${report.overallStatus}`);

report.checks.forEach(check => {
  const icon = check.status === 'healthy' ? '✓' : check.status === 'degraded' ? '⚠' : '✗';
  console.log(`${icon} ${check.name}: ${check.message}`);
});

// Exit with error code if unhealthy (for automation)
if (report.overallStatus === 'unhealthy') {
  process.exit(1);
}
```

---

#### Method: `checkDatabase()`

Check database connectivity and performance.

```typescript
async checkDatabase(): Promise<HealthCheck>
```

**Example**:
```typescript
const dbCheck = await healthService.checkDatabase();

if (dbCheck.status !== 'healthy') {
  console.error(`Database issue: ${dbCheck.message}`);
}
```

---

## Notification Service

**Location**: `src/cli/services/monitoring/notification-service.ts`

### Class: `NotificationService`

Unified multi-channel notification delivery.

#### Method: `send()`

Send notification through configured channels.

```typescript
async send(notification: Notification): Promise<NotificationResult>
```

**Parameters**:
```typescript
interface Notification {
  workspaceId: string;
  type: 'credential_expiry' | 'health_alert' | 'usage_threshold' | 'system_error';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metadata?: Record<string, any>;
  channels: Array<'email' | 'slack' | 'webhook' | 'console'>;
}
```

**Returns**:
```typescript
interface NotificationResult {
  id: string;
  sentAt: string;
  deliveryStatus: Record<string, 'pending' | 'sent' | 'failed'>;
}
```

**Example**:
```typescript
const notificationService = new NotificationService();

const result = await notificationService.send({
  workspaceId: 'workspace-uuid',
  type: 'credential_expiry',
  severity: 'warning',
  title: 'Credential Expiring Soon',
  message: 'Shopify credential for CLIENT_001 expires in 7 days',
  channels: ['email', 'slack'],
  metadata: {
    tenantId: 'CLIENT_001',
    service: 'shopify',
    daysUntilExpiry: 7,
  },
});

console.log(`Notification ${result.id} sent`);
console.log(`Email: ${result.deliveryStatus.email}`);
console.log(`Slack: ${result.deliveryStatus.slack}`);
```

---

## Type Definitions

### Common Types

```typescript
// Tenant
interface Tenant {
  id: string;
  tenantId: string;
  workspaceId: string;
  name: string;
  type: 'shopify' | 'google-merchant' | 'mixed';
  status: 'active' | 'inactive' | 'suspended';
  market: string;
  region: string;
  shopifyShop?: string;
  gmcMerchantId?: string;
  industry?: string;
  website?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
}

// Credential
interface Credential {
  id: string;
  tenantId: string;
  service: string;
  status: 'valid' | 'expired' | 'revoked';
  expiresAt?: string;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

// Alert
interface Alert {
  id: string;
  workspaceId: string;
  tenantId: string;
  service: string;
  severity: 'info' | 'warning' | 'critical';
  type: 'expiring_30d' | 'expiring_7d' | 'expiring_1d' | 'expired';
  message: string;
  expiresAt: string;
  daysUntilExpiry: number;
  sentAt: string;
  acknowledged: boolean;
  createdAt: string;
}
```

---

## Error Handling

### Error Types

```typescript
class SynthexError extends Error {
  code: string;
  statusCode: number;
  details?: any;
}

// Example error codes
const ErrorCodes = {
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',          // 404
  CREDENTIAL_NOT_FOUND: 'CREDENTIAL_NOT_FOUND',  // 404
  INVALID_INPUT: 'INVALID_INPUT',                // 400
  UNAUTHORIZED: 'UNAUTHORIZED',                  // 401
  DATABASE_ERROR: 'DATABASE_ERROR',              // 500
  API_ERROR: 'API_ERROR',                        // 502
};
```

### Error Handling Pattern

```typescript
import { TenantService } from '@/cli/services/tenant-management/tenant-service';

const tenantService = new TenantService();

try {
  const tenant = await tenantService.get('CLIENT_001');

  if (!tenant) {
    throw new SynthexError('Tenant not found', {
      code: 'TENANT_NOT_FOUND',
      statusCode: 404,
    });
  }

  // Process tenant...
} catch (error) {
  if (error instanceof SynthexError) {
    console.error(`[${error.code}] ${error.message}`);

    if (error.details) {
      console.error('Details:', error.details);
    }

    process.exit(error.statusCode >= 500 ? 1 : 0);
  } else {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}
```

### Retry Logic

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;

      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
}

// Usage
const result = await retryWithBackoff(async () => {
  return await shopifyService.syncProducts('CLIENT_001');
}, 3, 2000);
```

---

**Next Steps**:
- Review [Best Practices Guide](SYNTHEX_BEST_PRACTICES.md) for usage patterns
- See [Integration Guide](SYNTHEX_INTEGRATION_GUIDE.md) for integration examples
- Check [Database Schema Reference](SYNTHEX_DATABASE_SCHEMA.md) for data models
