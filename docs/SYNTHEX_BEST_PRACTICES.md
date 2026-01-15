# Synthex CLI - Best Practices Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-15
**Target Audience**: Operations teams, system administrators, developers

---

## Table of Contents

1. [Introduction](#introduction)
2. [Workspace Organization](#workspace-organization)
3. [Credential Management](#credential-management)
4. [Multi-Tenant Operations](#multi-tenant-operations)
5. [Security Considerations](#security-considerations)
6. [Performance Optimization](#performance-optimization)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Batch Operations](#batch-operations)
9. [Error Handling & Recovery](#error-handling--recovery)
10. [Maintenance Schedules](#maintenance-schedules)
11. [Development Workflow](#development-workflow)
12. [Production Deployment](#production-deployment)

---

## Introduction

This guide provides best practices for operating the Synthex Apex Architecture CLI in production environments. Following these guidelines will help ensure reliable, secure, and efficient multi-tenant e-commerce operations.

**Key Principles**:
- **Security First**: Protect credentials and sensitive data
- **Automation**: Reduce manual intervention through scheduled jobs
- **Monitoring**: Proactive health checks and alerting
- **Scalability**: Design for growth from day one
- **Documentation**: Keep runbooks and procedures up-to-date

---

## Workspace Organization

### Naming Conventions

**Use descriptive, consistent workspace IDs**:

```bash
# Good - Clear purpose and ownership
synthex init --market ANZ_SMB --region AU-SE1
# Workspace ID: ws_anz_smb_sydney_prod

# Bad - Ambiguous or generic
synthex init --market ANZ_SMB --region AU-SE1
# Workspace ID: workspace1
```

**Recommended patterns**:
- `ws_{market}_{region}_{environment}` (e.g., `ws_anz_smb_sydney_prod`)
- `ws_{company}_{market}_{environment}` (e.g., `ws_acme_us_staging`)
- Include environment suffix for clarity (prod, staging, dev)

### Environment Separation

**Always separate production and non-production workspaces**:

```bash
# Production workspace
synthex init --market ANZ_SMB --region AU-SE1
# Use for: Live client operations

# Staging workspace
synthex init --market ANZ_SMB --region AU-SE1
# Use for: Testing, validation, training

# Development workspace
synthex init --market ANZ_SMB --region AU-SE1
# Use for: Development, experimentation
```

**Benefits**:
- Prevent accidental changes to production data
- Safe testing environment
- Isolated credential management
- Clear separation of concerns

### Tenant Organization

**Group tenants logically within workspaces**:

```bash
# By client type
SMB_CLIENT_001, SMB_CLIENT_002, ...      # Small business clients
ENTERPRISE_001, ENTERPRISE_002, ...      # Enterprise clients

# By service tier
BASIC_001, BASIC_002, ...                # Basic tier
PREMIUM_001, PREMIUM_002, ...            # Premium tier

# By geography
AU_MELB_001, AU_SYD_001, ...            # Australian clients
NZ_AKL_001, NZ_WLG_001, ...             # New Zealand clients
```

### Workspace Limits

**Recommended limits per workspace**:

| Workspace Type | Max Tenants | Max Credentials | Notes |
|----------------|-------------|-----------------|-------|
| SMB | 100-500 | 200-1000 | Small business focus |
| Enterprise | 10-50 | 100-500 | Larger clients, more complex |
| Development | 5-10 | 20-50 | Testing only |

**When to create a new workspace**:
- Different geographic regions (AU vs NZ vs US)
- Different market segments (SMB vs Enterprise)
- Different environments (prod vs staging)
- Operational team separation (Team A vs Team B)

---

## Credential Management

### Secure Storage

**Always use Google Secret Manager for credentials**:

```bash
# ✅ CORRECT - Credentials stored in Secret Manager
synthex auth login --service shopify --tenant-id "CLIENT_001"
# OAuth flow stores tokens securely in GCP Secret Manager

# ❌ WRONG - Never store credentials in files
echo "access_token=abc123" > credentials.txt
```

**Secret naming convention**:
```
synthex/{workspace_id}/{tenant_id}/{service}/credentials
```

Example:
```
synthex/ws_anz_smb_prod/SMB_CLIENT_001/shopify/credentials
synthex/ws_anz_smb_prod/SMB_CLIENT_001/google-merchant/credentials
```

### Credential Rotation

**Rotate credentials before expiry**:

```bash
# Check expiring credentials weekly
synthex tenant credentials expiring

# Proactively rotate credentials 7 days before expiry
# Set up automatic alerts:
synthex alerts create-rule \
  --type expiring_7d \
  --channel email \
  --recipients "ops@example.com,admin@example.com"
```

**Rotation schedule**:
- **Shopify tokens**: Rotate every 90 days or before expiry
- **Google Merchant Center**: Rotate every 90 days or before expiry
- **API keys**: Rotate every 180 days minimum
- **Service account keys**: Rotate annually

### Access Control

**Principle of least privilege**:

```bash
# Grant GCP Secret Manager access only to required service accounts
gcloud secrets add-iam-policy-binding \
  "synthex/ws_anz_smb_prod/SMB_CLIENT_001/shopify/credentials" \
  --member="serviceAccount:synthex-cli@project.iam.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

# Never use owner or admin roles for application credentials
```

### Credential Health Monitoring

**Set up automated credential health checks**:

```bash
# Daily credential health check (cron job)
0 9 * * * cd /path/to/synthex && npm run synthex -- tenant credentials health

# Immediate check and alert
synthex alerts check-now
```

**Health check coverage**:
- ✅ Expiration dates validated
- ✅ Token validity tested
- ✅ API connectivity verified
- ✅ Permission scopes confirmed

### Emergency Credential Revocation

**Procedure for compromised credentials**:

1. **Immediately revoke access**:
```bash
# Revoke OAuth tokens through provider console
# - Shopify: Partners Dashboard → App → Installations
# - Google: https://myaccount.google.com/permissions

# Delete from Secret Manager
synthex tenant credentials cleanup --tenant-id "CLIENT_001" --service shopify
```

2. **Audit access logs**:
```bash
# Check recent usage
synthex analytics report --period 7d
```

3. **Re-authenticate with new credentials**:
```bash
synthex auth login --service shopify --tenant-id "CLIENT_001"
```

4. **Document incident**:
```bash
# Log to audit trail
synthex tenant update \
  --tenant-id "CLIENT_001" \
  --notes "Credentials rotated due to suspected compromise on 2026-01-15"
```

---

## Multi-Tenant Operations

### Tenant Provisioning Workflow

**Standardized tenant creation process**:

```bash
# Step 1: Create tenant from template (recommended)
synthex templates create-tenant \
  --template-id shopify-smb-anz \
  --tenant-id "SMB_CLIENT_005" \
  --name "New Client Pty Ltd" \
  --shopify-shop "newclient.myshopify.com"

# Step 2: Authenticate
synthex auth login --service shopify --tenant-id "SMB_CLIENT_005"

# Step 3: Initial sync
synthex shopify sync products --tenant-id "SMB_CLIENT_005"

# Step 4: Verify health
synthex health check --service shopify

# Step 5: Set active for operations
synthex tenant workspace set-active --tenant-id "SMB_CLIENT_005"
```

### Tenant Templates

**Create templates for common scenarios**:

**ANZ Shopify Small Business**:
```json
{
  "templateId": "shopify-smb-anz",
  "name": "ANZ Shopify SMB Template",
  "type": "shopify",
  "market": "ANZ_SMB",
  "region": "AU-SE1",
  "defaultSettings": {
    "syncFrequency": "hourly",
    "enableInventorySync": true,
    "enableOrderSync": true
  }
}
```

**US Enterprise Google Merchant**:
```json
{
  "templateId": "gmc-enterprise-us",
  "name": "US Enterprise GMC Template",
  "type": "google-merchant",
  "market": "US_ENTERPRISE",
  "region": "US-EA1",
  "defaultSettings": {
    "feedSyncFrequency": "every-6-hours",
    "enableProductReviews": true,
    "enablePromotions": true
  }
}
```

### Tenant Lifecycle Management

**Tenant states and transitions**:

```
active → inactive → archived → deleted
  ↓         ↓          ↓
  ↓         ↓          └─→ (permanent deletion after 90 days)
  ↓         └─→ (can be reactivated within 30 days)
  └─→ (normal operations)
```

**Deactivation process**:
```bash
# Step 1: Set tenant to inactive
synthex batch tenants update \
  --tenant-ids "CLIENT_001" \
  --status inactive

# Step 2: Export data for archival
synthex batch export json \
  --tenant-ids "CLIENT_001" \
  --output "archives/client_001_$(date +%Y%m%d).json"

# Step 3: Revoke credentials
synthex tenant credentials cleanup --tenant-id "CLIENT_001"

# Step 4: Document reason
# Add to runbook or ticketing system
```

### Bulk Operations Best Practices

**Use batch operations for scale**:

```bash
# ✅ GOOD - Batch operation (1 command)
synthex batch tenants update \
  --tenant-ids "CLIENT_001,CLIENT_002,CLIENT_003" \
  --status active

# ❌ BAD - Individual operations (3 commands)
synthex tenant tenants update --tenant-id "CLIENT_001" --status active
synthex tenant tenants update --tenant-id "CLIENT_002" --status active
synthex tenant tenants update --tenant-id "CLIENT_003" --status active
```

**Batch operation limits**:
- **Recommended**: 10-50 tenants per batch
- **Maximum**: 100 tenants per batch
- **For 100+ tenants**: Split into multiple batches with delays

**CSV bulk operations**:
```bash
# Use CSV for large-scale operations
synthex batch tenants create --from-csv tenants-batch1.csv
# Wait 5 minutes
synthex batch tenants create --from-csv tenants-batch2.csv
```

---

## Security Considerations

### Environment Variables

**Never commit secrets to version control**:

```bash
# ✅ CORRECT - Use .env file (gitignored)
echo "SUPABASE_SERVICE_ROLE_KEY=your-key" >> .env.local
echo ".env.local" >> .gitignore

# ❌ WRONG - Hardcoded secrets
const apiKey = "sk-ant-api03-abc123..."; // NEVER DO THIS
```

**Use environment variable validation**:
```bash
# Validate required variables on startup
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "ERROR: SUPABASE_SERVICE_ROLE_KEY not set"
  exit 1
fi
```

### API Key Security

**Protect API keys from exposure**:

```bash
# ✅ CORRECT - Read from environment
const apiKey = process.env.ANTHROPIC_API_KEY;

# ❌ WRONG - Logged in output
console.log(`Using API key: ${apiKey}`); // NEVER DO THIS
```

**API key rotation schedule**:
```bash
# Rotate API keys quarterly
# January 1, April 1, July 1, October 1

# Generate new key in provider console
# Update .env.local
# Test connectivity
synthex health check
# Revoke old key after 24 hours
```

### Row-Level Security (RLS)

**Verify RLS policies are active**:

```sql
-- Check RLS is enabled on all tables
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = false;

-- Should return 0 rows in production
```

**Test workspace isolation**:
```bash
# Create test tenant in workspace A
synthex tenant tenants create \
  --tenant-id "TEST_ISOLATION_A" \
  --name "Test A" \
  --type shopify

# Switch to workspace B
synthex tenant workspace set-active --workspace-id "ws_test_b"

# Attempt to access tenant from workspace A (should fail)
synthex tenant tenants show --tenant-id "TEST_ISOLATION_A"
# Expected: Error - Tenant not found (RLS blocking access)
```

### Audit Logging

**Enable comprehensive audit logging**:

```bash
# All operations should be logged to audit trail
# Check audit logs regularly:
synthex analytics report --period 7d

# Review for suspicious activity:
# - Unusual command patterns
# - Failed authentication attempts
# - Credential access from unexpected IPs
```

### Network Security

**Restrict API access by IP (production)**:

```bash
# Supabase: Configure IP allowlist in dashboard
# Google Cloud: Configure VPC firewall rules

# Example GCP firewall rule
gcloud compute firewall-rules create synthex-api-access \
  --allow tcp:443 \
  --source-ranges 203.0.113.0/24 \
  --target-tags synthex-cli
```

---

## Performance Optimization

### Connection Pooling

**Enable Supabase connection pooling**:

```typescript
// Use Supabase Pooler connection string for high-traffic scenarios
const SUPABASE_POOLER_URL = "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres";

// Benefits:
// - 60-80% latency reduction
// - Support for 1000+ concurrent connections
// - Automatic connection management
```

### Query Optimization

**Use selective queries**:

```typescript
// ✅ GOOD - Select only needed columns
const { data } = await supabase
  .from('contacts')
  .select('id, name, ai_score')
  .eq('workspace_id', workspaceId)
  .limit(100);

// ❌ BAD - Select all columns
const { data } = await supabase
  .from('contacts')
  .select('*')
  .eq('workspace_id', workspaceId);
```

**Add indexes for common queries**:

```sql
-- Index for workspace filtering
CREATE INDEX idx_contacts_workspace_id ON contacts(workspace_id);

-- Composite index for common query patterns
CREATE INDEX idx_contacts_workspace_score ON contacts(workspace_id, ai_score DESC);
```

### Caching Strategy

**Implement multi-layer caching**:

```bash
# Layer 1: In-memory cache (for frequently accessed data)
# - Tenant configurations
# - Template definitions
# - Common queries

# Layer 2: Redis cache (for shared data across instances)
# - Product catalogs
# - Credential metadata (NOT credentials themselves)
# - Analytics aggregations

# Layer 3: Database (source of truth)
```

**Cache invalidation patterns**:

```typescript
// Invalidate cache after mutations
await supabase.from('tenants').update({ name: 'New Name' }).eq('id', tenantId);
await cache.invalidate(`tenant:${tenantId}`);

// Use TTL for auto-expiration
await cache.set('analytics:report', reportData, { ttl: 3600 }); // 1 hour
```

### Batch Size Optimization

**Optimize batch operation sizes**:

```bash
# Product sync batch sizes (per API call)
# - Shopify: 250 products (API limit)
# - Google Merchant Center: 100 products (recommended)

# Database batch inserts
# - Optimal: 500-1000 rows per batch
# - Maximum: 5000 rows per batch
```

### Rate Limiting

**Respect API rate limits**:

```bash
# Shopify rate limits:
# - Standard: 2 requests/second
# - Plus: 4 requests/second

# Google Merchant Center:
# - 200 requests per day (free tier)
# - 10000 requests per day (paid tier)

# Implement exponential backoff
# - Initial retry: 2 seconds
# - Second retry: 4 seconds
# - Third retry: 8 seconds
```

**Rate limit implementation**:

```typescript
async function callWithRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) { // Rate limit exceeded
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('Max retries exceeded');
}
```

---

## Monitoring & Alerting

### Alert Configuration

**Set up multi-level alerts**:

```bash
# Level 1: Info (30 days before expiry)
synthex alerts create-rule \
  --type expiring_30d \
  --channel email \
  --recipients "ops@example.com"

# Level 2: Warning (7 days before expiry)
synthex alerts create-rule \
  --type expiring_7d \
  --channel slack \
  --webhook-url "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Level 3: Critical (1 day before expiry)
synthex alerts create-rule \
  --type expiring_1d \
  --channel email \
  --recipients "oncall@example.com,admin@example.com"
```

**Alert response SLAs**:
- **Critical**: Respond within 1 hour
- **Warning**: Respond within 24 hours
- **Info**: Review weekly

### Health Check Automation

**Schedule regular health checks**:

```bash
# Cron job: Every hour
0 * * * * cd /path/to/synthex && npm run synthex -- health check --format json > /var/log/synthex/health-$(date +\%Y\%m\%d-\%H).json

# Cron job: Daily comprehensive check
0 9 * * * cd /path/to/synthex && npm run synthex -- health check && npm run synthex -- alerts check-now
```

**Health check thresholds**:

| Metric | Healthy | Degraded | Unhealthy |
|--------|---------|----------|-----------|
| Database response time | <100ms | 100-5000ms | >5000ms |
| API response time | <500ms | 500-2000ms | >2000ms |
| Disk usage | <85% | 85-95% | >95% |
| Memory usage | <85% | 85-95% | >95% |
| Credential expiry | >30 days | 7-30 days | <7 days |

### Usage Analytics

**Track key metrics**:

```bash
# Weekly usage report
synthex analytics report --period 7d

# Top commands (identify optimization opportunities)
synthex analytics commands --top 10

# Error analysis (identify recurring issues)
synthex analytics errors --period 30d
```

**Metrics to monitor**:
- **Command execution frequency**: Identify most-used operations
- **Error rates**: Track reliability (target: <1% error rate)
- **Execution time**: Monitor performance degradation
- **API call volume**: Track quota usage

### Dashboards

**Create operational dashboards**:

**Daily Operations Dashboard**:
- Active tenants count
- Credentials expiring in <7 days
- Failed operations in last 24 hours
- API quota usage

**Weekly Review Dashboard**:
- Total commands executed
- Top 10 most-used commands
- Error trends (week-over-week)
- Performance metrics (p95 execution time)

**Monthly Planning Dashboard**:
- Tenant growth rate
- Resource utilization trends
- Cost projections
- Capacity planning metrics

---

## Batch Operations

### Pre-Flight Checks

**Always validate before bulk operations**:

```bash
# Step 1: Dry run (preview changes)
synthex batch tenants create --from-csv tenants.csv --dry-run

# Step 2: Review output
# Check for:
# - Duplicate tenant IDs
# - Invalid email formats
# - Missing required fields

# Step 3: Execute if validation passes
synthex batch tenants create --from-csv tenants.csv
```

### CSV File Preparation

**CSV format validation checklist**:

```csv
tenantId,name,type,market,region,shopifyShop,gmcMerchantId
SMB_001,Client One,shopify,ANZ_SMB,AU-SE1,client1.myshopify.com,
SMB_002,Client Two,google-merchant,ANZ_SMB,AU-SE1,,123456789
```

✅ **Required validations**:
- Header row present with correct column names
- No empty tenantId values
- Valid type values (shopify, google-merchant, mixed)
- Valid market values (ANZ_SMB, US_SMB, etc.)
- Valid region values (AU-SE1, US-EA1, etc.)
- shopifyShop format: `[store].myshopify.com`
- gmcMerchantId is numeric

### Error Recovery

**Batch operation failure handling**:

```bash
# Scenario: Batch create fails at row 50 of 100

# Step 1: Identify successful creates
synthex tenant tenants list --format json > successful-tenants.json

# Step 2: Create CSV with only failed rows (51-100)
# Edit CSV to include only rows that failed

# Step 3: Retry failed batch
synthex batch tenants create --from-csv failed-tenants.csv

# Step 4: Verify completion
synthex tenant tenants list | wc -l
# Should equal expected total
```

### Idempotency

**Design batch operations to be idempotent**:

```bash
# Safe to run multiple times
synthex batch tenants update \
  --tenant-ids "CLIENT_001,CLIENT_002" \
  --status active

# If already active, no change made
# No errors thrown for already-correct state
```

### Batch Operation Limits

**Recommended batch sizes**:

| Operation | Recommended Size | Maximum Size | Notes |
|-----------|------------------|--------------|-------|
| Create tenants | 25-50 | 100 | Rate limit considerations |
| Update tenants | 50-100 | 500 | Faster than creates |
| Delete tenants | 10-25 | 50 | Use caution |
| Export data | 100-500 | 1000 | Limited by memory |

---

## Error Handling & Recovery

### Error Categories

**Classification and response**:

| Category | Severity | Response | Example |
|----------|----------|----------|---------|
| Transient | Low | Retry with backoff | API timeout |
| Validation | Medium | Fix input, retry | Invalid tenant ID |
| Authorization | High | Check credentials | Expired token |
| System | Critical | Alert on-call | Database down |

### Retry Strategies

**Exponential backoff implementation**:

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
  throw new Error('Should never reach here');
}
```

**When to retry vs fail fast**:

✅ **Retry**:
- Network timeouts
- Rate limit errors (429)
- Temporary service unavailability (503)
- Database connection errors

❌ **Fail fast**:
- Authentication errors (401)
- Authorization errors (403)
- Validation errors (400)
- Resource not found (404)

### Circuit Breaker Pattern

**Prevent cascading failures**:

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > 60000) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= 5) {
      this.state = 'open';
    }
  }
}
```

### Rollback Procedures

**Database transaction rollback**:

```typescript
const { data, error } = await supabase.rpc('batch_create_tenants', {
  tenants: tenantsData
});

if (error) {
  console.error('Batch operation failed, transaction rolled back');
  // All tenant creates in the batch are reverted
  return;
}
```

**Manual rollback for multi-step operations**:

```bash
# Scenario: Multi-step tenant provisioning fails at step 3

# Step 1: Create tenant ✅
# Step 2: Authenticate ✅
# Step 3: Initial sync ❌ FAILED

# Rollback procedure:
# 1. Delete credentials
synthex tenant credentials cleanup --tenant-id "CLIENT_001"

# 2. Delete tenant
synthex tenant tenants delete --tenant-id "CLIENT_001" --confirm

# 3. Document rollback
echo "Rollback completed for CLIENT_001 at $(date)" >> rollback.log
```

---

## Maintenance Schedules

### Daily Tasks

**Automated daily checks** (9 AM UTC):

```bash
#!/bin/bash
# /path/to/synthex-daily-checks.sh

# 1. Health check
synthex health check --format json > /var/log/synthex/health-daily.json

# 2. Credential check
synthex alerts check-now

# 3. Usage snapshot
synthex analytics report --period 1d > /var/log/synthex/usage-daily.txt

# 4. Send summary email
if [ $? -eq 0 ]; then
  echo "Daily checks completed successfully" | mail -s "Synthex Daily Report" ops@example.com
fi
```

### Weekly Tasks

**Manual weekly reviews** (Monday 10 AM):

```bash
# 1. Review usage analytics
synthex analytics report --period 7d

# 2. Check for expiring credentials
synthex tenant credentials expiring

# 3. Review error trends
synthex analytics errors --period 7d

# 4. Update documentation (if needed)
# - Update runbooks
# - Document new issues
# - Share learnings with team
```

### Monthly Tasks

**Comprehensive monthly maintenance**:

```bash
# 1. Full system health audit
synthex health check

# 2. Credential rotation review
# - List all credentials >60 days old
# - Schedule rotation for credentials >75 days old

# 3. Usage trend analysis
synthex analytics report --period 30d

# 4. Capacity planning
# - Review tenant growth rate
# - Project quota needs for next quarter
# - Plan for scaling if needed

# 5. Cleanup tasks
# - Archive inactive tenants (>90 days)
# - Delete stale usage metrics (>1 year)
# - Rotate log files
```

### Quarterly Tasks

**Strategic quarterly reviews**:

1. **Security audit**:
   - Review all credential access patterns
   - Verify RLS policies are effective
   - Update API keys and service accounts
   - Review audit logs for anomalies

2. **Performance review**:
   - Analyze p95/p99 execution times
   - Identify optimization opportunities
   - Review and update caching strategies

3. **Cost optimization**:
   - Review API quota usage
   - Identify unused or underutilized resources
   - Optimize batch sizes and schedules

4. **Documentation update**:
   - Update best practices based on learnings
   - Revise troubleshooting guides
   - Update architecture diagrams

---

## Development Workflow

### Local Development

**Set up local development environment**:

```bash
# 1. Clone repository
git clone https://github.com/YourOrg/Unite-Hub.git
cd Unite-Hub

# 2. Install dependencies
npm install

# 3. Create .env.local (never commit!)
cp .env.example .env.local
# Edit .env.local with development credentials

# 4. Run in development mode
npm run dev

# 5. Test CLI locally
npm run synthex -- --version
npm run synthex -- health check
```

### Testing Best Practices

**Write comprehensive tests**:

```typescript
// Unit tests (80%+ coverage target)
describe('TenantService', () => {
  it('should create tenant with valid data', async () => {
    const tenant = await tenantService.create({
      tenantId: 'TEST_001',
      name: 'Test Tenant',
      type: 'shopify',
    });
    expect(tenant.tenantId).toBe('TEST_001');
  });

  it('should reject duplicate tenant IDs', async () => {
    await expect(tenantService.create({
      tenantId: 'DUPLICATE',
      name: 'Test',
      type: 'shopify',
    })).rejects.toThrow('Tenant ID already exists');
  });
});

// Integration tests
describe('Shopify Integration', () => {
  it('should sync products from Shopify', async () => {
    const products = await shopifyService.syncProducts('TEST_001');
    expect(products.length).toBeGreaterThan(0);
  });
});
```

### Code Review Guidelines

**PR review checklist**:

✅ **Functionality**:
- Code accomplishes stated objective
- Edge cases handled
- Error handling implemented

✅ **Security**:
- No hardcoded credentials
- Input validation present
- SQL injection prevention
- XSS prevention (if applicable)

✅ **Performance**:
- No N+1 queries
- Appropriate indexing
- Caching considered

✅ **Testing**:
- Unit tests included
- Integration tests for critical paths
- Test coverage maintained >80%

✅ **Documentation**:
- README updated if needed
- Inline comments for complex logic
- API docs updated

### Git Workflow

**Branch naming conventions**:

```bash
# Feature branches
feature/add-tenant-templates
feature/credential-rotation

# Bug fixes
bugfix/fix-shopify-sync-timeout
bugfix/correct-gmc-feed-validation

# Hot fixes (production)
hotfix/fix-credential-expiry-alert
```

**Commit message format**:

```bash
# Good commit messages
git commit -m "feat: add batch tenant creation from CSV"
git commit -m "fix: correct credential expiry calculation"
git commit -m "docs: update best practices guide"

# Bad commit messages
git commit -m "update stuff"
git commit -m "WIP"
```

---

## Production Deployment

### Pre-Deployment Checklist

**Verify before deploying to production**:

✅ **Code Quality**:
- [ ] All tests passing (unit + integration)
- [ ] Code review approved
- [ ] No console.log statements in production code
- [ ] TypeScript compilation successful with no errors

✅ **Configuration**:
- [ ] Environment variables configured
- [ ] Secrets stored in Secret Manager (not .env files)
- [ ] Database migrations tested in staging
- [ ] RLS policies verified

✅ **Dependencies**:
- [ ] All npm packages up-to-date
- [ ] No critical security vulnerabilities (run `npm audit`)
- [ ] Package-lock.json committed

✅ **Documentation**:
- [ ] README updated
- [ ] API docs updated
- [ ] Changelog updated
- [ ] Runbook updated (if needed)

### Deployment Process

**Blue-green deployment**:

```bash
# Step 1: Deploy to green environment (inactive)
npm run deploy:green

# Step 2: Smoke tests on green
npm run synthex -- health check --env green

# Step 3: Switch traffic to green (zero downtime)
./scripts/switch-traffic.sh green

# Step 4: Monitor green environment for 15 minutes
# - Check error rates
# - Monitor performance metrics
# - Verify functionality

# Step 5: If issues detected, rollback to blue
./scripts/switch-traffic.sh blue

# Step 6: If stable, decommission blue
# Keep blue running for 24 hours before shutdown
```

### Post-Deployment Validation

**Verify deployment success**:

```bash
# 1. Version check
synthex --version
# Expected: New version number

# 2. Health check
synthex health check
# Expected: All checks healthy

# 3. Sample operations
synthex tenant tenants list
synthex analytics report --period 1d

# 4. Credential check
synthex alerts check-now

# 5. Monitor logs for 1 hour
tail -f /var/log/synthex/production.log
```

### Rollback Procedure

**Emergency rollback steps**:

```bash
# Immediate rollback (if critical issue)
./scripts/rollback.sh

# Rollback validates:
# 1. Database schema compatibility
# 2. Credential format compatibility
# 3. API compatibility

# Post-rollback:
# 1. Document issue
# 2. Create postmortem
# 3. Add regression tests
# 4. Fix issue in dev
# 5. Re-deploy after validation
```

### Production Monitoring

**Real-time monitoring setup**:

```bash
# 1. Application logs
# - Location: /var/log/synthex/production.log
# - Retention: 30 days
# - Rotation: Daily

# 2. Error tracking
# - Tool: Sentry or similar
# - Alert threshold: >10 errors/hour

# 3. Performance monitoring
# - Tool: Datadog, New Relic, or similar
# - Metrics: p95 latency, error rate, throughput

# 4. Uptime monitoring
# - Tool: Pingdom, UptimeRobot, or similar
# - Check frequency: Every 1 minute
# - Alert on: 3 consecutive failures
```

---

## Summary

Following these best practices will ensure:

✅ **Security**: Credentials protected, access controlled, audit trails maintained
✅ **Reliability**: Proactive monitoring, automated health checks, robust error handling
✅ **Performance**: Optimized queries, effective caching, appropriate batch sizes
✅ **Scalability**: Proper workspace organization, efficient multi-tenant operations
✅ **Maintainability**: Clear documentation, consistent workflows, automated testing

**Key Takeaways**:

1. **Automate Everything**: Reduce manual intervention through scheduled jobs and alerts
2. **Monitor Proactively**: Don't wait for issues to be reported, detect them early
3. **Document Thoroughly**: Runbooks, procedures, and decisions should be well-documented
4. **Test Rigorously**: Comprehensive testing prevents production issues
5. **Review Regularly**: Quarterly audits ensure continued operational excellence

---

**Next Steps**:
- Review your current setup against these best practices
- Identify gaps and create action items
- Implement high-priority improvements first (security, monitoring)
- Schedule regular reviews to ensure adherence

For additional guidance, see:
- **Troubleshooting Guide**: Common issues and solutions
- **Integration Guide**: Connecting Synthex with other systems
- **API Reference**: Service APIs and database schema
