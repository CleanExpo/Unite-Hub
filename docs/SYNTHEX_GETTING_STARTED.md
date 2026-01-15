# Synthex CLI - Getting Started Guide

**Version**: 1.0.0
**Last Updated**: 2026-01-15
**Target Audience**: New users, developers, operations teams

---

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Installation](#installation)
4. [Initial Configuration](#initial-configuration)
5. [First Tenant Setup](#first-tenant-setup)
6. [Authentication Setup](#authentication-setup)
7. [Common Workflows](#common-workflows)
8. [Monitoring & Health Checks](#monitoring--health-checks)
9. [Next Steps](#next-steps)

---

## Introduction

Synthex is a comprehensive CLI tool for managing multi-tenant e-commerce operations across Shopify and Google Merchant Center platforms in ANZ (Australia/New Zealand), US, and UK markets.

**Key Features**:
- Multi-tenant workspace management
- Shopify and Google Merchant Center integration
- Credential lifecycle management
- Business ID validation (ABN, NZBN, EIN, CRN)
- Batch operations and tenant templates
- Usage analytics and monitoring
- Automated credential expiry alerts
- System health monitoring

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Git**: For version control (optional)

Check your versions:
```bash
node --version  # Should be v18.0.0+
npm --version   # Should be v9.0.0+
```

### Required Accounts

1. **Supabase Account**
   - Sign up at https://supabase.com
   - Create a new project
   - Note your project URL and keys

2. **Google Cloud Platform Account** (for Secret Manager)
   - Create a GCP project
   - Enable Secret Manager API
   - Create a service account with Secret Manager access
   - Download service account JSON key

3. **Shopify Partner Account** (if using Shopify)
   - Sign up at https://partners.shopify.com
   - Create an app for OAuth authentication

4. **Google Merchant Center Account** (if using GMC)
   - Sign up at https://merchants.google.com
   - Create a merchant account
   - Enable Content API

### Environment Variables

Create a `.env` file in your project root with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Cloud Configuration
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
GCP_PROJECT_ID=your-gcp-project-id

# Shopify Configuration (if using Shopify)
SHOPIFY_CLIENT_ID=your-shopify-client-id
SHOPIFY_CLIENT_SECRET=your-shopify-client-secret

# Google Merchant Center Configuration (if using GMC)
GOOGLE_MERCHANT_CLIENT_ID=your-oauth-client-id
GOOGLE_MERCHANT_CLIENT_SECRET=your-oauth-client-secret

# Notification Configuration (optional)
NOTIFICATION_EMAIL_RECIPIENTS=admin@example.com,ops@example.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## Installation

### Clone Repository

```bash
git clone https://github.com/CleanExpo/Unite-Hub.git
cd Unite-Hub
```

### Install Dependencies

```bash
npm install
```

### Build CLI

```bash
npm run build
```

### Verify Installation

```bash
npm run synthex -- --version
# Should output: 1.0.0

npm run synthex -- --help
# Should display help menu with all commands
```

---

## Initial Configuration

### Step 1: Initialize Synthex

Choose your market and region:

**ANZ Markets**:
```bash
# Australia (Sydney region)
npm run synthex -- init --market ANZ_SMB --region AU-SE1

# New Zealand (Auckland region)
npm run synthex -- init --market ANZ_SMB --region NZ-NR1
```

**US Markets**:
```bash
# United States (Virginia region)
npm run synthex -- init --market US_SMB --region US-EA1
```

**UK Markets**:
```bash
# United Kingdom (Ireland region)
npm run synthex -- init --market UK_SMB --region EU-WE1
```

**Enterprise Markets**:
```bash
# ANZ Enterprise
npm run synthex -- init --market ANZ_ENTERPRISE --region AU-SE1
```

### Step 2: Verify Configuration

```bash
npm run synthex -- tenant workspace info
```

Expected output:
```
✓ Workspace Information

Workspace ID: ws_abc123def456
Market: ANZ_SMB
Region: AU-SE1
Total Tenants: 0

No active tenant set
Set active tenant:
  synthex tenant workspace set-active --tenant-id "TENANT_ID"
```

### Step 3: Run Database Migrations

1. Go to your Supabase Dashboard → SQL Editor
2. Run migrations in order:
   - `400_synthex_core_schema.sql` - Core schema
   - `401_synthex_shopify_integration.sql` - Shopify tables
   - `402_synthex_credential_registry.sql` - Credential management
   - `403_synthex_google_merchant.sql` - Google Merchant tables
   - `404_synthex_gmc_feed_management.sql` - GMC feed tables
   - `405_update_synthex_tenants_for_phase6.sql` - Tenant management
   - `406_monitoring_tables.sql` - Monitoring & alerting

3. Verify schema:
```bash
npm run check:db
```

---

## First Tenant Setup

### Using Tenant Templates (Recommended)

**List available templates**:
```bash
npm run synthex -- templates list
```

Available built-in templates:
- `shopify-smb-anz` - ANZ small business Shopify store
- `gmc-enterprise-us` - US enterprise Google Merchant Center
- `mixed-multi-brand-anz` - ANZ multi-brand retailer (Shopify + GMC)
- `marketplace-seller-uk` - UK marketplace seller

**Create tenant from template**:
```bash
npm run synthex -- templates create-tenant \
  --template-id shopify-smb-anz \
  --tenant-id "SMB_CLIENT_001" \
  --name "Acme Corporation" \
  --shopify-shop "acme.myshopify.com"
```

### Manual Tenant Creation

**Shopify-only tenant**:
```bash
npm run synthex -- tenant tenants create \
  --tenant-id "SMB_CLIENT_001" \
  --name "Acme Corporation" \
  --type shopify \
  --shopify-shop "acme.myshopify.com" \
  --industry "Retail" \
  --website "https://acme.com" \
  --email "contact@acme.com"
```

**Google Merchant Center-only tenant**:
```bash
npm run synthex -- tenant tenants create \
  --tenant-id "ENTERPRISE_001" \
  --name "Tech Solutions Inc" \
  --type google-merchant \
  --gmc-merchant-id "123456789" \
  --industry "E-commerce" \
  --website "https://techsolutions.com" \
  --email "ops@techsolutions.com"
```

**Mixed tenant (both platforms)**:
```bash
npm run synthex -- tenant tenants create \
  --tenant-id "RETAIL_001" \
  --name "Retail Plus" \
  --type mixed \
  --shopify-shop "retailplus.myshopify.com" \
  --gmc-merchant-id "987654321" \
  --industry "Retail"
```

### Verify Tenant Creation

```bash
npm run synthex -- tenant tenants list
```

---

## Authentication Setup

### Set Active Tenant

```bash
npm run synthex -- tenant workspace set-active --tenant-id "SMB_CLIENT_001"
```

### Shopify Authentication

**Step 1: Start OAuth flow**:
```bash
npm run synthex -- auth login \
  --service shopify \
  --tenant-id "SMB_CLIENT_001"
```

**Step 2: Follow the OAuth flow**:
1. Browser opens to Shopify OAuth consent screen
2. Log in to your Shopify store
3. Approve the app permissions
4. Browser redirects back with authorization code
5. CLI automatically exchanges code for access token
6. Credentials stored securely in Google Secret Manager

**Step 3: Verify authentication**:
```bash
npm run synthex -- tenant credentials list --tenant-id "SMB_CLIENT_001"
```

### Google Merchant Center Authentication

**Step 1: Start OAuth flow**:
```bash
npm run synthex -- auth login \
  --service google-merchant \
  --client-id "SMB_CLIENT_001"
```

**Step 2: Follow the OAuth flow**:
1. Browser opens to Google OAuth consent screen
2. Log in to your Google account
3. Approve the app permissions (Content API access)
4. Browser redirects back with authorization code
5. CLI exchanges code for access and refresh tokens
6. Credentials stored securely in Google Secret Manager

**Step 3: Verify authentication**:
```bash
npm run synthex -- tenant credentials list --tenant-id "SMB_CLIENT_001"
```

---

## Common Workflows

### 1. Shopify Product Sync

**Sync products from Shopify**:
```bash
npm run synthex -- shopify sync products --tenant-id "SMB_CLIENT_001"
```

**List synced products**:
```bash
npm run synthex -- shopify products list --tenant-id "SMB_CLIENT_001"
```

**Sync orders**:
```bash
npm run synthex -- shopify sync orders --tenant-id "SMB_CLIENT_001"
```

### 2. Google Merchant Center Feed Sync

**Sync product feed**:
```bash
npm run synthex -- google-merchant sync feed --tenant-id "SMB_CLIENT_001"
```

**List products**:
```bash
npm run synthex -- google-merchant products list --tenant-id "SMB_CLIENT_001"
```

**Check product status**:
```bash
npm run synthex -- google-merchant products status \
  --tenant-id "SMB_CLIENT_001" \
  --product-id "12345"
```

### 3. Business ID Validation

**Validate Australian ABN**:
```bash
npm run synthex -- check business-id --country AU --id "12345678901"
```

**Validate New Zealand NZBN**:
```bash
npm run synthex -- check business-id --country NZ --id "1234567890123"
```

**Validate US EIN**:
```bash
npm run synthex -- check business-id --country US --id "12-3456789"
```

### 4. Credential Management

**Check credential health**:
```bash
npm run synthex -- tenant credentials health
```

**View expiring credentials**:
```bash
npm run synthex -- tenant credentials expiring
```

**Cleanup expired credentials**:
```bash
npm run synthex -- tenant credentials cleanup
```

### 5. Batch Operations

**Create multiple tenants from CSV**:
```bash
npm run synthex -- batch tenants create --from-csv tenants.csv
```

CSV format:
```csv
tenantId,name,type,market,region,shopifyShop,gmcMerchantId
SMB_CLIENT_002,Client Two,shopify,ANZ_SMB,AU-SE1,client2.myshopify.com,
SMB_CLIENT_003,Client Three,google-merchant,ANZ_SMB,AU-SE1,,123456789
```

**Bulk update tenants**:
```bash
npm run synthex -- batch tenants update \
  --tenant-ids "CLIENT_001,CLIENT_002,CLIENT_003" \
  --status inactive
```

**Export tenants**:
```bash
npm run synthex -- batch export csv --output tenants-backup.csv
npm run synthex -- batch export json --output tenants-backup.json
```

---

## Monitoring & Health Checks

### Usage Analytics

**Generate weekly usage report**:
```bash
npm run synthex -- analytics report --period 7d
```

**View top commands**:
```bash
npm run synthex -- analytics commands --top 10
```

**Check error statistics**:
```bash
npm run synthex -- analytics errors --period 30d
```

### Credential Alerts

**Configure email alerts for expiring credentials**:
```bash
npm run synthex -- alerts create-rule \
  --type expiring_7d \
  --channel email \
  --recipients "admin@example.com,ops@example.com"
```

**Configure Slack alerts**:
```bash
npm run synthex -- alerts create-rule \
  --type expiring_1d \
  --channel slack \
  --webhook-url "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

**Manual credential check**:
```bash
npm run synthex -- alerts check-now
```

**View active alerts**:
```bash
npm run synthex -- alerts list --unacknowledged
```

### System Health Monitoring

**Run all health checks**:
```bash
npm run synthex -- health check
```

**Check specific service**:
```bash
npm run synthex -- health check --service database
npm run synthex -- health check --service shopify
npm run synthex -- health check --service credentials
```

**JSON output for automation**:
```bash
npm run synthex -- health check --format json > health-report.json
```

---

## Next Steps

### 1. Set Up Scheduled Jobs

Configure cron jobs for automated operations:

**Daily credential health check** (9 AM UTC):
```bash
0 9 * * * cd /path/to/unite-hub && npm run synthex -- alerts check-now
```

**Weekly analytics report** (Monday 8 AM UTC):
```bash
0 8 * * 1 cd /path/to/unite-hub && npm run synthex -- analytics report --period 7d
```

**Hourly health check**:
```bash
0 * * * * cd /path/to/unite-hub && npm run synthex -- health check
```

### 2. Configure Monitoring

Set up alert rules for your team:
- 30-day warning for credential expiry
- 7-day warning for credential expiry
- 1-day critical alert for credential expiry
- System health degradation alerts

### 3. Explore Advanced Features

- **Tenant Templates**: Create custom templates for your business scenarios
- **Batch Operations**: Automate multi-tenant operations
- **Usage Analytics**: Track CLI usage and optimize workflows
- **Health Monitoring**: Set up proactive monitoring

### 4. Read Additional Documentation

- **Command Reference**: Complete list of all commands and options
- **Best Practices**: Recommended patterns and workflows
- **Troubleshooting Guide**: Common issues and solutions
- **Integration Guide**: Integrate Synthex with your systems
- **API Reference**: Service APIs and database schema

---

## Quick Reference

### Most Common Commands

```bash
# Initialize
synthex init --market ANZ_SMB --region AU-SE1

# Create tenant
synthex tenant tenants create --tenant-id "ID" --name "Name" --type shopify

# Authenticate
synthex auth login --service shopify --tenant-id "ID"

# Sync products
synthex shopify sync products --tenant-id "ID"

# Check health
synthex health check

# View analytics
synthex analytics report --period 7d

# List tenants
synthex tenant tenants list

# Check credentials
synthex tenant credentials health
```

### Getting Help

```bash
# Main help
synthex --help

# Command-specific help
synthex tenant --help
synthex shopify --help
synthex analytics --help

# Subcommand help
synthex tenant tenants --help
synthex shopify sync --help
```

---

## Support & Resources

- **GitHub Repository**: https://github.com/CleanExpo/Unite-Hub
- **Issues**: https://github.com/CleanExpo/Unite-Hub/issues
- **Documentation**: `/docs` directory
- **Migrations**: `/supabase/migrations` directory

---

**Congratulations!** You've completed the Synthex CLI Getting Started Guide. You should now be able to:
- ✅ Initialize Synthex for your market
- ✅ Create and manage tenants
- ✅ Authenticate with Shopify and Google Merchant Center
- ✅ Sync products and orders
- ✅ Monitor system health and credentials
- ✅ Use batch operations and analytics

For advanced usage, see the **Command Reference** and **Best Practices** guides.
