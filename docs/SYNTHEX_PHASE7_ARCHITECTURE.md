# Synthex Phase 7: Comprehensive Enhancement Architecture

**Status**: Design Phase
**Date**: 2026-01-15
**Scope**: Advanced Features + Monitoring & Alerting + Documentation + Testing Suite

---

## Overview

Phase 7 enhances the Synthex Apex Architecture with production-grade features across four key areas:

1. **Advanced Features** - Batch operations, tenant templates, usage analytics
2. **Monitoring & Alerting** - Credential expiry alerts, health monitoring, notifications
3. **Documentation** - User guides, API reference, architecture diagrams
4. **Testing Suite** - Unit, integration, and E2E tests

---

## 1. Advanced Features

### 1.1 Batch Operations Service

**Purpose**: Enable bulk operations on multiple tenants simultaneously

**Features**:
- Bulk tenant creation from CSV/JSON
- Bulk tenant updates (status changes, metadata updates)
- Bulk tenant deletion (soft/hard)
- Bulk credential operations (renewal, cleanup)
- Progress tracking and rollback on failure
- Dry-run mode for validation

**Implementation**:
```typescript
// src/cli/services/advanced/batch-operations.ts

export interface BatchOperationResult<T> {
  successful: T[];
  failed: Array<{ item: T; error: string }>;
  total: number;
  successCount: number;
  failureCount: number;
  duration: number;
}

export class BatchOperationsService {
  async createTenantsFromCSV(filePath: string, dryRun?: boolean): Promise<BatchOperationResult<Tenant>>
  async updateTenantsBulk(tenantIds: string[], updates: UpdateTenantInput, dryRun?: boolean): Promise<BatchOperationResult<Tenant>>
  async deleteTenantsBulk(tenantIds: string[], permanent?: boolean, dryRun?: boolean): Promise<BatchOperationResult<string>>
  async cleanupExpiredCredentialsBulk(workspaceIds: string[]): Promise<BatchOperationResult<CredentialCleanupResult>>
}
```

**CLI Commands**:
```bash
synthex batch tenants create --from-csv tenants.csv [--dry-run]
synthex batch tenants update --tenant-ids "ID1,ID2,ID3" --status inactive [--dry-run]
synthex batch tenants delete --tenant-ids "ID1,ID2,ID3" [--permanent] [--dry-run]
synthex batch credentials cleanup --workspace-ids "WS1,WS2" [--dry-run]
```

**CSV Format Example**:
```csv
tenantId,name,type,market,region,shopifyShop,gmcMerchantId
SMB_CLIENT_001,Acme Corp,shopify,ANZ_SMB,AU-SE1,acme.myshopify.com,
SMB_CLIENT_002,Tech Solutions,google-merchant,ANZ_SMB,AU-SE1,,123456789
SMB_CLIENT_003,Retail Plus,mixed,ANZ_SMB,NZ-NR1,retail.myshopify.com,987654321
```

---

### 1.2 Tenant Templates System

**Purpose**: Pre-configured tenant setups for common business scenarios

**Template Types**:
- **Shopify SMB** - Small business Shopify store (ANZ market)
- **GMC Enterprise** - Large Google Merchant Center account (multi-region)
- **Mixed Multi-Brand** - Multi-brand retailer (both Shopify + GMC)
- **Marketplace Seller** - Marketplace-focused seller (GMC only)
- **Custom** - User-defined templates

**Implementation**:
```typescript
// src/cli/services/advanced/tenant-templates.ts

export interface TenantTemplate {
  id: string;
  name: string;
  description: string;
  type: 'shopify' | 'google-merchant' | 'mixed';
  market: string;
  region: string;
  defaultMetadata: Record<string, any>;
  requiredFields: string[];
  optionalFields: string[];
  setupSteps: string[];
  createdAt: string;
  updatedAt: string;
}

export class TenantTemplatesService {
  async listTemplates(): Promise<TenantTemplate[]>
  async getTemplate(templateId: string): Promise<TenantTemplate | null>
  async createTenantFromTemplate(templateId: string, overrides: Partial<CreateTenantInput>): Promise<Tenant>
  async saveTemplate(template: Omit<TenantTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<TenantTemplate>
  async deleteTemplate(templateId: string): Promise<void>
}
```

**CLI Commands**:
```bash
synthex templates list
synthex templates show --template-id shopify-smb-anz
synthex templates create-tenant --template-id shopify-smb-anz --tenant-id "CLIENT_001" --name "New Client"
synthex templates save --name "Custom Template" --type shopify --market ANZ_SMB
synthex templates delete --template-id custom-123
```

**Built-in Templates**:
1. `shopify-smb-anz` - ANZ small business Shopify store
2. `gmc-enterprise-us` - US enterprise Google Merchant account
3. `mixed-multi-brand-anz` - ANZ multi-brand retailer
4. `marketplace-seller-uk` - UK marketplace seller

---

### 1.3 Usage Analytics Tracking

**Purpose**: Track CLI usage, API calls, and resource consumption

**Metrics Tracked**:
- Command execution count (by command, by user, by workspace)
- API call volume (by service, by endpoint)
- Credential operations (create, renew, revoke, cleanup)
- Tenant operations (create, update, delete)
- Error rates and types
- Performance metrics (execution time, response time)
- Resource usage (database queries, API quota)

**Implementation**:
```typescript
// src/cli/services/advanced/usage-analytics.ts

export interface UsageMetric {
  timestamp: string;
  workspaceId: string;
  userId?: string;
  metricType: 'command' | 'api_call' | 'credential_op' | 'tenant_op' | 'error';
  metricName: string;
  value: number;
  metadata: Record<string, any>;
}

export interface UsageReport {
  period: { start: string; end: string };
  totalCommands: number;
  totalApiCalls: number;
  totalCredentialOps: number;
  totalTenantOps: number;
  totalErrors: number;
  byCommand: Record<string, number>;
  byService: Record<string, number>;
  byWorkspace: Record<string, number>;
  topErrors: Array<{ error: string; count: number }>;
  performanceMetrics: {
    avgExecutionTime: number;
    p50ExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
  };
}

export class UsageAnalyticsService {
  async trackMetric(metric: Omit<UsageMetric, 'timestamp'>): Promise<void>
  async getReport(workspaceId: string, period: { start: Date; end: Date }): Promise<UsageReport>
  async getCommandUsage(commandName: string, period: { start: Date; end: Date }): Promise<number>
  async getTopCommands(workspaceId: string, limit: number): Promise<Array<{ command: string; count: number }>>
  async getErrorRate(workspaceId: string, period: { start: Date; end: Date }): Promise<number>
}
```

**CLI Commands**:
```bash
synthex analytics report --period 7d
synthex analytics report --period 30d --workspace-id WS_ID
synthex analytics commands --top 10
synthex analytics errors --period 7d
synthex analytics performance --command "tenant create"
```

**Database Schema**:
```sql
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metric_type TEXT NOT NULL CHECK (metric_type IN ('command', 'api_call', 'credential_op', 'tenant_op', 'error')),
  metric_name TEXT NOT NULL,
  value NUMERIC NOT NULL DEFAULT 1,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_metrics_workspace ON usage_metrics(workspace_id);
CREATE INDEX idx_usage_metrics_type ON usage_metrics(metric_type);
CREATE INDEX idx_usage_metrics_name ON usage_metrics(metric_name);
CREATE INDEX idx_usage_metrics_created ON usage_metrics(created_at);
```

---

## 2. Monitoring & Alerting

### 2.1 Credential Expiry Alerting

**Purpose**: Automated notifications for expiring credentials

**Alert Types**:
- **30-day warning** - Credential expiring in 30 days
- **7-day warning** - Credential expiring in 7 days
- **1-day critical** - Credential expiring in 24 hours
- **Expired alert** - Credential has expired

**Notification Channels**:
- Email (via SendGrid/Resend)
- Slack webhook
- Custom webhook
- In-app notifications

**Implementation**:
```typescript
// src/cli/services/monitoring/credential-alerts.ts

export interface Alert {
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
}

export interface AlertRule {
  id: string;
  workspaceId: string;
  enabled: boolean;
  alertType: Alert['type'];
  channels: Array<'email' | 'slack' | 'webhook'>;
  emailRecipients?: string[];
  slackWebhookUrl?: string;
  customWebhookUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export class CredentialAlertService {
  async checkAndSendAlerts(): Promise<Alert[]>
  async getAlerts(workspaceId: string, acknowledged?: boolean): Promise<Alert[]>
  async acknowledgeAlert(alertId: string): Promise<void>
  async configureAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertRule>
  async getAlertRules(workspaceId: string): Promise<AlertRule[]>
  async deleteAlertRule(ruleId: string): Promise<void>
}
```

**CLI Commands**:
```bash
synthex alerts list [--acknowledged]
synthex alerts acknowledge --alert-id ALERT_ID
synthex alerts rules list
synthex alerts rules create --type expiring_7d --channel email --recipients "admin@example.com"
synthex alerts rules create --type expiring_1d --channel slack --webhook-url "https://hooks.slack.com/..."
synthex alerts rules delete --rule-id RULE_ID
synthex alerts check-now  # Manual alert check
```

**Scheduled Job**:
```typescript
// Run daily at 9 AM UTC
cron.schedule('0 9 * * *', async () => {
  const alertService = new CredentialAlertService();
  await alertService.checkAndSendAlerts();
});
```

---

### 2.2 System Health Monitoring

**Purpose**: Monitor system health and service availability

**Health Checks**:
- **Database Connectivity** - Supabase connection health
- **API Availability** - Shopify/GMC API reachability
- **Credential Validity** - Active credentials status
- **Service Quota** - API rate limits and quotas
- **Disk Space** - Local storage usage
- **Memory Usage** - CLI process memory

**Implementation**:
```typescript
// src/cli/services/monitoring/health-monitor.ts

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  lastChecked: string;
  responseTime?: number;
  metadata?: Record<string, any>;
}

export interface HealthReport {
  overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  checks: HealthCheck[];
  timestamp: string;
}

export class HealthMonitorService {
  async runHealthChecks(): Promise<HealthReport>
  async checkDatabase(): Promise<HealthCheck>
  async checkShopifyAPI(): Promise<HealthCheck>
  async checkGoogleMerchantAPI(): Promise<HealthCheck>
  async checkCredentials(): Promise<HealthCheck>
  async checkAPIQuotas(): Promise<HealthCheck>
  async checkDiskSpace(): Promise<HealthCheck>
  async checkMemoryUsage(): Promise<HealthCheck>
}
```

**CLI Commands**:
```bash
synthex health check
synthex health check --service shopify
synthex health check --service google-merchant
synthex health check --service database
synthex health report --format json
```

---

### 2.3 Notification System

**Purpose**: Unified notification delivery across multiple channels

**Supported Channels**:
- **Email** - Via SendGrid/Resend/SMTP
- **Slack** - Via webhook integration
- **Webhook** - Custom HTTP endpoints
- **Console** - Terminal output

**Implementation**:
```typescript
// src/cli/services/monitoring/notification-service.ts

export interface Notification {
  id: string;
  workspaceId: string;
  type: 'credential_expiry' | 'health_alert' | 'usage_threshold' | 'system_error';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  metadata: Record<string, any>;
  channels: Array<'email' | 'slack' | 'webhook' | 'console'>;
  sentAt: string;
  deliveryStatus: Record<string, 'pending' | 'sent' | 'failed'>;
}

export class NotificationService {
  async send(notification: Omit<Notification, 'id' | 'sentAt' | 'deliveryStatus'>): Promise<Notification>
  async sendEmail(to: string[], subject: string, body: string): Promise<void>
  async sendSlack(webhookUrl: string, message: string): Promise<void>
  async sendWebhook(url: string, payload: any): Promise<void>
  async getNotifications(workspaceId: string, limit?: number): Promise<Notification[]>
  async retryFailedNotification(notificationId: string): Promise<void>
}
```

**CLI Commands**:
```bash
synthex notify send --type info --title "Test" --message "Test notification" --channel email
synthex notify list --limit 10
synthex notify retry --notification-id NOTIF_ID
```

---

## 3. Documentation

### 3.1 User Documentation

**Documents to Create**:

1. **Getting Started Guide** (`docs/SYNTHEX_GETTING_STARTED.md`)
   - Installation instructions
   - Initial configuration
   - First tenant setup
   - Authentication setup
   - Common workflows

2. **Command Reference** (`docs/SYNTHEX_COMMAND_REFERENCE.md`)
   - Complete command listing
   - Parameter descriptions
   - Example usage
   - Common flags
   - Error handling

3. **Best Practices** (`docs/SYNTHEX_BEST_PRACTICES.md`)
   - Workspace organization
   - Credential management
   - Multi-tenant strategies
   - Security considerations
   - Performance optimization

4. **Troubleshooting Guide** (`docs/SYNTHEX_TROUBLESHOOTING.md`)
   - Common errors
   - Debug techniques
   - Log analysis
   - Support resources

5. **Integration Guide** (`docs/SYNTHEX_INTEGRATION_GUIDE.md`)
   - Shopify integration
   - Google Merchant Center integration
   - Third-party integrations
   - Webhook setup
   - API usage

---

### 3.2 API Reference Documentation

**Documents to Create**:

1. **Service API Reference** (`docs/SYNTHEX_API_REFERENCE.md`)
   - TenantManager API
   - WorkspaceManager API
   - CredentialManager API
   - BatchOperationsService API
   - HealthMonitorService API
   - NotificationService API

2. **Database Schema Reference** (`docs/SYNTHEX_DATABASE_SCHEMA.md`)
   - Table definitions
   - Relationships
   - Indexes
   - RLS policies
   - Triggers and functions

3. **CLI Architecture** (`docs/SYNTHEX_CLI_ARCHITECTURE.md`)
   - Command structure
   - Service layer design
   - Configuration management
   - Error handling patterns
   - Extension points

---

### 3.3 Architecture Diagrams

**Diagrams to Create** (using Mermaid):

1. **System Architecture Diagram**
   - CLI layer
   - Service layer
   - Database layer
   - External APIs (Shopify, GMC, Google Secret Manager)

2. **Data Flow Diagrams**
   - Tenant creation flow
   - Credential lifecycle flow
   - Batch operation flow
   - Alert generation flow

3. **Command Hierarchy Diagram**
   - Command tree structure
   - Subcommand relationships
   - Service dependencies

4. **Database Entity-Relationship Diagram**
   - Table relationships
   - Foreign keys
   - Indexes

---

## 4. Testing Suite

### 4.1 Unit Tests

**Test Coverage Target**: 80%+

**Test Files to Create**:

```
tests/unit/
├── services/
│   ├── tenant/
│   │   ├── tenant-manager.test.ts
│   │   ├── workspace-manager.test.ts
│   │   └── credential-manager.test.ts
│   ├── advanced/
│   │   ├── batch-operations.test.ts
│   │   ├── tenant-templates.test.ts
│   │   └── usage-analytics.test.ts
│   └── monitoring/
│       ├── credential-alerts.test.ts
│       ├── health-monitor.test.ts
│       └── notification-service.test.ts
├── utils/
│   ├── config-manager.test.ts
│   └── logger.test.ts
└── validation/
    ├── abn-validator.test.ts
    ├── nzbn-validator.test.ts
    └── business-id-validator.test.ts
```

**Test Framework**: Vitest

**Example Test Structure**:
```typescript
// tests/unit/services/tenant/tenant-manager.test.ts

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TenantManager } from '@/cli/services/tenant/tenant-manager';

describe('TenantManager', () => {
  let tenantManager: TenantManager;

  beforeEach(() => {
    // Setup
  });

  afterEach(() => {
    // Cleanup
  });

  describe('createTenant', () => {
    it('should create a tenant with valid input', async () => {
      // Test implementation
    });

    it('should throw error if tenant ID already exists', async () => {
      // Test implementation
    });

    it('should validate tenant type', async () => {
      // Test implementation
    });
  });

  describe('getTenant', () => {
    it('should return tenant by ID', async () => {
      // Test implementation
    });

    it('should return null if tenant not found', async () => {
      // Test implementation
    });
  });

  // Additional tests...
});
```

---

### 4.2 Integration Tests

**Test Coverage**: Critical workflows and service interactions

**Test Files to Create**:

```
tests/integration/
├── tenant-lifecycle.test.ts
├── credential-lifecycle.test.ts
├── batch-operations.test.ts
├── authentication.test.ts
├── shopify-integration.test.ts
├── gmc-integration.test.ts
├── alert-system.test.ts
└── health-monitoring.test.ts
```

**Example Integration Test**:
```typescript
// tests/integration/tenant-lifecycle.test.ts

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { TenantManager } from '@/cli/services/tenant/tenant-manager';
import { CredentialManager } from '@/cli/services/tenant/credential-manager';

describe('Tenant Lifecycle Integration', () => {
  let tenantManager: TenantManager;
  let credentialManager: CredentialManager;
  let testTenantId: string;

  beforeAll(async () => {
    // Setup test environment
  });

  afterAll(async () => {
    // Cleanup test data
  });

  it('should complete full tenant lifecycle', async () => {
    // 1. Create tenant
    const tenant = await tenantManager.createTenant({
      tenantId: 'TEST_001',
      name: 'Test Tenant',
      type: 'shopify',
    });

    expect(tenant).toBeDefined();
    expect(tenant.tenantId).toBe('TEST_001');

    // 2. Update tenant
    const updated = await tenantManager.updateTenant('TEST_001', {
      status: 'active',
    });

    expect(updated.status).toBe('active');

    // 3. Add credentials
    // 4. Check credential health
    // 5. Delete tenant
  });
});
```

---

### 4.3 E2E Test Scenarios

**Test Coverage**: Complete CLI workflows from user perspective

**Test Scenarios**:

1. **New Workspace Setup**
   - Initialize Synthex
   - Configure authentication
   - Create first tenant
   - Authenticate services

2. **Multi-Tenant Operations**
   - Create multiple tenants
   - Switch active tenant
   - Update tenant metadata
   - View workspace summary

3. **Credential Management**
   - Check credential health
   - Identify expiring credentials
   - Cleanup expired credentials
   - Configure alerts

4. **Batch Operations**
   - Import tenants from CSV
   - Bulk update tenants
   - Bulk delete tenants
   - Verify results

5. **Monitoring & Alerts**
   - Run health checks
   - Configure alert rules
   - Trigger test alert
   - Check notification delivery

**Test Files to Create**:

```
tests/e2e/
├── workspace-setup.test.ts
├── multi-tenant-operations.test.ts
├── credential-management.test.ts
├── batch-operations.test.ts
└── monitoring-alerts.test.ts
```

**Example E2E Test**:
```typescript
// tests/e2e/workspace-setup.test.ts

import { describe, it, expect } from 'vitest';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('Workspace Setup E2E', () => {
  it('should complete full workspace setup workflow', async () => {
    // 1. Initialize Synthex
    const { stdout: initOutput } = await execAsync(
      'npm run synthex -- init --market ANZ_SMB --region AU-SE1'
    );
    expect(initOutput).toContain('Synthex initialized successfully');

    // 2. Create tenant
    const { stdout: createOutput } = await execAsync(
      'npm run synthex -- tenant tenants create --tenant-id "E2E_TEST" --name "E2E Test Tenant" --type shopify'
    );
    expect(createOutput).toContain('Tenant created successfully');

    // 3. List tenants
    const { stdout: listOutput } = await execAsync(
      'npm run synthex -- tenant tenants list'
    );
    expect(listOutput).toContain('E2E_TEST');

    // 4. Set active tenant
    const { stdout: setActiveOutput } = await execAsync(
      'npm run synthex -- tenant workspace set-active --tenant-id "E2E_TEST"'
    );
    expect(setActiveOutput).toContain('Active tenant set successfully');

    // 5. View workspace info
    const { stdout: infoOutput } = await execAsync(
      'npm run synthex -- tenant workspace info'
    );
    expect(infoOutput).toContain('E2E_TEST');

    // Cleanup
    await execAsync(
      'npm run synthex -- tenant tenants delete --tenant-id "E2E_TEST" --permanent'
    );
  });
});
```

---

## Implementation Order

### Week 1: Advanced Features
1. Day 1-2: Batch Operations Service + CLI
2. Day 3-4: Tenant Templates System + CLI
3. Day 5: Usage Analytics Tracking + CLI

### Week 2: Monitoring & Alerting
4. Day 6-7: Credential Expiry Alerting + CLI
5. Day 8-9: System Health Monitoring + CLI
6. Day 10: Notification System + CLI

### Week 3: Documentation
7. Day 11-12: User Documentation (all guides)
8. Day 13: API Reference Documentation
9. Day 14: Architecture Diagrams (Mermaid)

### Week 4: Testing Suite
10. Day 15-16: Unit Tests (80%+ coverage)
11. Day 17-18: Integration Tests
12. Day 19-20: E2E Test Scenarios

### Week 5: Integration & Polish
13. Day 21-22: Database migrations for Phase 7
14. Day 23: Full system testing
15. Day 24: Bug fixes and polish
16. Day 25: Final commit and deployment

---

## Database Migrations Required

### Migration 406: Usage Analytics Tables
```sql
CREATE TABLE usage_metrics (...);
CREATE TABLE usage_reports (...);
```

### Migration 407: Monitoring & Alerting Tables
```sql
CREATE TABLE alerts (...);
CREATE TABLE alert_rules (...);
CREATE TABLE notifications (...);
CREATE TABLE health_checks (...);
```

### Migration 408: Templates and Batch Tables
```sql
CREATE TABLE tenant_templates (...);
CREATE TABLE batch_operations (...);
CREATE TABLE batch_operation_items (...);
```

---

## Success Criteria

✅ **Advanced Features**:
- Batch operations handle 100+ tenants efficiently
- Tenant templates reduce setup time by 80%
- Usage analytics provide actionable insights

✅ **Monitoring & Alerting**:
- Credential expiry alerts sent 7 days before expiration
- Health checks run successfully every 15 minutes
- Notifications delivered to all configured channels

✅ **Documentation**:
- Complete user documentation covers all features
- API reference documents all services
- Architecture diagrams visualize system structure

✅ **Testing Suite**:
- 80%+ unit test coverage
- All critical workflows have integration tests
- E2E tests validate complete user journeys

---

**Next Step**: Begin implementation with Batch Operations Service (Week 1, Day 1-2)
