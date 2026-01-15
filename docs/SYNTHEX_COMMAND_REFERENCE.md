# Synthex CLI - Command Reference

**Version**: 1.0.0
**Last Updated**: 2026-01-15

Complete reference for all Synthex CLI commands, parameters, and usage examples.

---

## Table of Contents

1. [Global Options](#global-options)
2. [Core Commands](#core-commands)
3. [Tenant Management](#tenant-management)
4. [Authentication](#authentication)
5. [Shopify Integration](#shopify-integration)
6. [Google Merchant Center](#google-merchant-center)
7. [Batch Operations](#batch-operations)
8. [Tenant Templates](#tenant-templates)
9. [Analytics](#analytics)
10. [Alerts](#alerts)
11. [Health Monitoring](#health-monitoring)
12. [Validation](#validation)

---

## Global Options

Available on all commands:

| Option | Description |
|--------|-------------|
| `-v, --version` | Output the current version |
| `-h, --help` | Display help for command |

**Example**:
```bash
synthex --version
synthex --help
synthex tenant --help
```

---

## Core Commands

### `synthex init`

Initialize Synthex environment for a specific market and region.

**Syntax**:
```bash
synthex init --market <MARKET> --region <REGION>
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--market` | Yes | ANZ_SMB, ANZ_ENTERPRISE, US_SMB, UK_SMB | Target market |
| `--region` | Yes | AU-SE1, NZ-NR1, US-EA1, EU-WE1 | Cloud region |

**Examples**:
```bash
# ANZ Small Business (Sydney)
synthex init --market ANZ_SMB --region AU-SE1

# US Small Business (Virginia)
synthex init --market US_SMB --region US-EA1

# ANZ Enterprise (Sydney)
synthex init --market ANZ_ENTERPRISE --region AU-SE1
```

**Output**:
```
✓ Synthex initialized successfully

Workspace ID: ws_abc123def456
Market: ANZ_SMB
Region: AU-SE1
Configuration saved to: ~/.synthex/config.json
```

---

## Tenant Management

### `synthex tenant tenants create`

Create a new tenant.

**Syntax**:
```bash
synthex tenant tenants create \
  --tenant-id <ID> \
  --name <NAME> \
  --type <TYPE> \
  [OPTIONS]
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--tenant-id` | Yes | String | Unique tenant identifier |
| `--name` | Yes | String | Tenant display name |
| `--type` | Yes | shopify, google-merchant, mixed | Integration type |
| `--market` | No | ANZ_SMB, US_SMB, etc. | Override workspace market |
| `--region` | No | AU-SE1, US-EA1, etc. | Override workspace region |
| `--shopify-shop` | Conditional | String | Shopify shop domain (required if type=shopify or mixed) |
| `--gmc-merchant-id` | Conditional | String | GMC merchant ID (required if type=google-merchant or mixed) |
| `--industry` | No | String | Industry category |
| `--website` | No | URL | Website URL |
| `--email` | No | Email | Contact email |
| `--phone` | No | String | Contact phone |

**Examples**:
```bash
# Shopify tenant
synthex tenant tenants create \
  --tenant-id "SMB_CLIENT_001" \
  --name "Acme Corp" \
  --type shopify \
  --shopify-shop "acme.myshopify.com" \
  --industry "Retail"

# Google Merchant Center tenant
synthex tenant tenants create \
  --tenant-id "ENTERPRISE_001" \
  --name "Tech Solutions" \
  --type google-merchant \
  --gmc-merchant-id "123456789"

# Mixed tenant
synthex tenant tenants create \
  --tenant-id "RETAIL_001" \
  --name "Retail Plus" \
  --type mixed \
  --shopify-shop "retail.myshopify.com" \
  --gmc-merchant-id "987654321"
```

### `synthex tenant tenants list`

List all tenants with optional filters.

**Syntax**:
```bash
synthex tenant tenants list [OPTIONS]
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--type` | No | shopify, google-merchant, mixed | Filter by type |
| `--status` | No | active, inactive, suspended | Filter by status |
| `--market` | No | ANZ_SMB, US_SMB, etc. | Filter by market |
| `-l, --limit` | No | Number | Limit results |

**Examples**:
```bash
# List all tenants
synthex tenant tenants list

# List only Shopify tenants
synthex tenant tenants list --type shopify

# List active tenants
synthex tenant tenants list --status active

# List first 10 tenants
synthex tenant tenants list --limit 10
```

### `synthex tenant tenants get`

Get detailed information about a specific tenant.

**Syntax**:
```bash
synthex tenant tenants get --tenant-id <ID>
```

**Example**:
```bash
synthex tenant tenants get --tenant-id "SMB_CLIENT_001"
```

### `synthex tenant tenants update`

Update tenant information.

**Syntax**:
```bash
synthex tenant tenants update --tenant-id <ID> [OPTIONS]
```

**Parameters**:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `--tenant-id` | Yes | Tenant ID |
| `--name` | No | New name |
| `--status` | No | New status (active, inactive, suspended) |
| `--shopify-shop` | No | Shopify shop domain |
| `--gmc-merchant-id` | No | GMC merchant ID |
| `--industry` | No | Industry |
| `--website` | No | Website URL |
| `--email` | No | Contact email |
| `--phone` | No | Contact phone |

**Example**:
```bash
synthex tenant tenants update \
  --tenant-id "SMB_CLIENT_001" \
  --status inactive \
  --email "newemail@example.com"
```

### `synthex tenant tenants delete`

Delete tenant (soft or hard delete).

**Syntax**:
```bash
synthex tenant tenants delete --tenant-id <ID> [--permanent]
```

**Parameters**:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `--tenant-id` | Yes | Tenant ID |
| `--permanent` | No | Permanently delete (default: soft delete) |

**Examples**:
```bash
# Soft delete (status = inactive)
synthex tenant tenants delete --tenant-id "SMB_CLIENT_001"

# Hard delete (permanent)
synthex tenant tenants delete --tenant-id "SMB_CLIENT_001" --permanent
```

### `synthex tenant tenants stats`

Get tenant statistics (products, orders, sync status).

**Syntax**:
```bash
synthex tenant tenants stats --tenant-id <ID>
```

**Example**:
```bash
synthex tenant tenants stats --tenant-id "SMB_CLIENT_001"
```

### `synthex tenant workspace info`

Show current workspace information.

**Syntax**:
```bash
synthex tenant workspace info
```

### `synthex tenant workspace set-active`

Set active tenant for current workspace.

**Syntax**:
```bash
synthex tenant workspace set-active --tenant-id <ID>
```

**Example**:
```bash
synthex tenant workspace set-active --tenant-id "SMB_CLIENT_001"
```

### `synthex tenant workspace clear-active`

Clear active tenant.

**Syntax**:
```bash
synthex tenant workspace clear-active
```

### `synthex tenant workspace summary`

Get workspace summary statistics.

**Syntax**:
```bash
synthex tenant workspace summary
```

### `synthex tenant credentials list`

List credentials for workspace or specific tenant.

**Syntax**:
```bash
synthex tenant credentials list [--tenant-id <ID>]
```

**Examples**:
```bash
# List all workspace credentials
synthex tenant credentials list

# List credentials for specific tenant
synthex tenant credentials list --tenant-id "SMB_CLIENT_001"
```

### `synthex tenant credentials expiring`

Show credentials expiring soon (<7 days).

**Syntax**:
```bash
synthex tenant credentials expiring
```

### `synthex tenant credentials cleanup`

Clean up expired credentials.

**Syntax**:
```bash
synthex tenant credentials cleanup
```

### `synthex tenant credentials revoke`

Manually revoke a credential.

**Syntax**:
```bash
synthex tenant credentials revoke \
  --service <SERVICE> \
  --tenant-id <ID>
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--service` | Yes | shopify, google-merchant | Service name |
| `--tenant-id` | Yes | String | Tenant ID |

**Example**:
```bash
synthex tenant credentials revoke \
  --service shopify \
  --tenant-id "SMB_CLIENT_001"
```

### `synthex tenant credentials health`

Get credential health report.

**Syntax**:
```bash
synthex tenant credentials health
```

---

## Authentication

### `synthex auth login`

Authenticate with a service (Shopify or Google Merchant Center).

**Syntax**:
```bash
synthex auth login --service <SERVICE> [OPTIONS]
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--service` | Yes | shopify, google-merchant | Service to authenticate |
| `--tenant-id` | Conditional | String | Tenant ID (required for Shopify) |
| `--client-id` | Conditional | String | Client ID (required for GMC) |

**Examples**:
```bash
# Shopify OAuth
synthex auth login --service shopify --tenant-id "SMB_CLIENT_001"

# Google Merchant Center OAuth
synthex auth login --service google-merchant --client-id "SMB_CLIENT_001"
```

**Flow**:
1. Browser opens to OAuth consent screen
2. User approves permissions
3. Browser redirects with authorization code
4. CLI exchanges code for access token
5. Credentials stored in Google Secret Manager

---

## Shopify Integration

### `synthex shopify sync products`

Sync products from Shopify to database.

**Syntax**:
```bash
synthex shopify sync products --tenant-id <ID>
```

**Example**:
```bash
synthex shopify sync products --tenant-id "SMB_CLIENT_001"
```

### `synthex shopify sync orders`

Sync orders from Shopify to database.

**Syntax**:
```bash
synthex shopify sync orders --tenant-id <ID>
```

**Example**:
```bash
synthex shopify sync orders --tenant-id "SMB_CLIENT_001"
```

### `synthex shopify products list`

List synced Shopify products.

**Syntax**:
```bash
synthex shopify products list --tenant-id <ID>
```

**Example**:
```bash
synthex shopify products list --tenant-id "SMB_CLIENT_001"
```

---

## Google Merchant Center

### `synthex google-merchant sync feed`

Sync product feed from Google Merchant Center.

**Syntax**:
```bash
synthex google-merchant sync feed --tenant-id <ID>
```

**Example**:
```bash
synthex google-merchant sync feed --tenant-id "SMB_CLIENT_001"
```

### `synthex google-merchant products list`

List synced GMC products.

**Syntax**:
```bash
synthex google-merchant products list --tenant-id <ID>
```

**Example**:
```bash
synthex google-merchant products list --tenant-id "SMB_CLIENT_001"
```

### `synthex google-merchant products status`

Check product status in Google Merchant Center.

**Syntax**:
```bash
synthex google-merchant products status \
  --tenant-id <ID> \
  --product-id <PRODUCT_ID>
```

**Example**:
```bash
synthex google-merchant products status \
  --tenant-id "SMB_CLIENT_001" \
  --product-id "12345"
```

---

## Batch Operations

### `synthex batch tenants create`

Create multiple tenants from CSV or JSON file.

**Syntax**:
```bash
synthex batch tenants create \
  (--from-csv <FILE> | --from-json <FILE>) \
  [--dry-run]
```

**Parameters**:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `--from-csv` | Conditional | CSV file path |
| `--from-json` | Conditional | JSON file path |
| `--dry-run` | No | Validate without creating |

**CSV Format**:
```csv
tenantId,name,type,market,region,shopifyShop,gmcMerchantId
SMB_CLIENT_002,Client Two,shopify,ANZ_SMB,AU-SE1,client2.myshopify.com,
SMB_CLIENT_003,Client Three,google-merchant,ANZ_SMB,AU-SE1,,123456789
```

**Examples**:
```bash
# Create from CSV
synthex batch tenants create --from-csv tenants.csv

# Dry run
synthex batch tenants create --from-csv tenants.csv --dry-run

# Create from JSON
synthex batch tenants create --from-json tenants.json
```

### `synthex batch tenants update`

Update multiple tenants at once.

**Syntax**:
```bash
synthex batch tenants update \
  --tenant-ids <IDS> \
  (--name <NAME> | --status <STATUS>) \
  [--dry-run]
```

**Example**:
```bash
synthex batch tenants update \
  --tenant-ids "CLIENT_001,CLIENT_002,CLIENT_003" \
  --status inactive \
  --dry-run
```

### `synthex batch tenants delete`

Delete multiple tenants at once.

**Syntax**:
```bash
synthex batch tenants delete \
  --tenant-ids <IDS> \
  [--permanent] \
  [--dry-run]
```

**Example**:
```bash
synthex batch tenants delete \
  --tenant-ids "CLIENT_001,CLIENT_002" \
  --permanent
```

### `synthex batch credentials cleanup`

Cleanup expired credentials across multiple workspaces.

**Syntax**:
```bash
synthex batch credentials cleanup \
  --workspace-ids <IDS> \
  [--dry-run]
```

**Example**:
```bash
synthex batch credentials cleanup \
  --workspace-ids "WS1,WS2,WS3" \
  --dry-run
```

### `synthex batch export csv`

Export tenants to CSV file.

**Syntax**:
```bash
synthex batch export csv --output <FILE>
```

**Example**:
```bash
synthex batch export csv --output tenants-backup.csv
```

### `synthex batch export json`

Export tenants to JSON file.

**Syntax**:
```bash
synthex batch export json --output <FILE> [--pretty]
```

**Example**:
```bash
synthex batch export json --output tenants-backup.json --pretty
```

---

## Tenant Templates

### `synthex templates list`

List all available templates (built-in + custom).

**Syntax**:
```bash
synthex templates list
```

### `synthex templates show`

Show template details.

**Syntax**:
```bash
synthex templates show --template-id <ID>
```

**Example**:
```bash
synthex templates show --template-id shopify-smb-anz
```

### `synthex templates create-tenant`

Create tenant from template.

**Syntax**:
```bash
synthex templates create-tenant \
  --template-id <TEMPLATE_ID> \
  --tenant-id <TENANT_ID> \
  --name <NAME> \
  [OPTIONS]
```

**Parameters**:
| Parameter | Required | Description |
|-----------|----------|-------------|
| `--template-id` | Yes | Template ID |
| `--tenant-id` | Yes | New tenant ID |
| `--name` | Yes | Tenant name |
| `--shopify-shop` | Conditional | Shopify shop (if template requires) |
| `--gmc-merchant-id` | Conditional | GMC merchant ID (if template requires) |

**Example**:
```bash
synthex templates create-tenant \
  --template-id shopify-smb-anz \
  --tenant-id "SMB_CLIENT_004" \
  --name "New Client" \
  --shopify-shop "newclient.myshopify.com"
```

---

## Analytics

### `synthex analytics report`

Generate usage analytics report.

**Syntax**:
```bash
synthex analytics report [OPTIONS]
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--period` | No | 7d, 30d, 90d | Time period (default: 7d) |
| `--workspace-id` | No | String | Workspace ID (default: current) |

**Examples**:
```bash
# Weekly report
synthex analytics report --period 7d

# Monthly report
synthex analytics report --period 30d

# Specific workspace
synthex analytics report --workspace-id ws_abc123
```

**Output Includes**:
- Total commands, API calls, credential ops, tenant ops, errors
- Top commands by usage
- API calls by service
- Top errors
- Performance metrics (avg, p50, p95, p99)

### `synthex analytics commands`

Show top commands by usage.

**Syntax**:
```bash
synthex analytics commands [--top <N>]
```

**Example**:
```bash
synthex analytics commands --top 10
```

### `synthex analytics errors`

Show error statistics.

**Syntax**:
```bash
synthex analytics errors [--period <PERIOD>]
```

**Example**:
```bash
synthex analytics errors --period 30d
```

---

## Alerts

### `synthex alerts list`

List all alerts.

**Syntax**:
```bash
synthex alerts list [--acknowledged | --unacknowledged]
```

**Examples**:
```bash
# All alerts
synthex alerts list

# Only acknowledged
synthex alerts list --acknowledged

# Only unacknowledged
synthex alerts list --unacknowledged
```

### `synthex alerts acknowledge`

Acknowledge an alert.

**Syntax**:
```bash
synthex alerts acknowledge --alert-id <ID>
```

**Example**:
```bash
synthex alerts acknowledge --alert-id alert_abc123
```

### `synthex alerts rules`

List alert rules.

**Syntax**:
```bash
synthex alerts rules
```

### `synthex alerts create-rule`

Create alert rule.

**Syntax**:
```bash
synthex alerts create-rule \
  --type <TYPE> \
  --channel <CHANNEL> \
  [OPTIONS]
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--type` | Yes | expiring_30d, expiring_7d, expiring_1d, expired | Alert type |
| `--channel` | Yes | email, slack, webhook | Notification channel |
| `--recipients` | Conditional | Comma-separated emails | Email recipients (if channel=email) |
| `--webhook-url` | Conditional | URL | Webhook URL (if channel=slack or webhook) |

**Examples**:
```bash
# Email alert
synthex alerts create-rule \
  --type expiring_7d \
  --channel email \
  --recipients "admin@example.com,ops@example.com"

# Slack alert
synthex alerts create-rule \
  --type expiring_1d \
  --channel slack \
  --webhook-url "https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
```

### `synthex alerts check-now`

Manually check credentials and send alerts.

**Syntax**:
```bash
synthex alerts check-now
```

---

## Health Monitoring

### `synthex health check`

Run health checks.

**Syntax**:
```bash
synthex health check [OPTIONS]
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--service` | No | database, shopify, google-merchant, credentials, disk, memory | Check specific service |
| `--format` | No | text, json | Output format (default: text) |

**Examples**:
```bash
# All checks
synthex health check

# Specific service
synthex health check --service database
synthex health check --service credentials

# JSON output
synthex health check --format json > health-report.json
```

**Exit Codes**:
- `0` - Healthy or degraded
- `1` - Unhealthy

---

## Validation

### `synthex check business-id`

Validate business ID (ABN, NZBN, EIN, CRN).

**Syntax**:
```bash
synthex check business-id --country <COUNTRY> --id <ID>
```

**Parameters**:
| Parameter | Required | Options | Description |
|-----------|----------|---------|-------------|
| `--country` | Yes | AU, NZ, US, UK | Country code |
| `--id` | Yes | String | Business ID to validate |

**Examples**:
```bash
# Australian ABN (11 digits)
synthex check business-id --country AU --id "12345678901"

# New Zealand NZBN (13 digits)
synthex check business-id --country NZ --id "1234567890123"

# US EIN (9 digits, format: XX-XXXXXXX)
synthex check business-id --country US --id "12-3456789"

# UK Company Registration Number (8 digits)
synthex check business-id --country UK --id "12345678"
```

---

## Common Flags & Patterns

### Dry Run Mode

Many commands support `--dry-run` for validation without execution:
```bash
synthex batch tenants create --from-csv file.csv --dry-run
synthex batch tenants update --tenant-ids "ID1,ID2" --status inactive --dry-run
```

### JSON Output

Some commands support `--format json` for automation:
```bash
synthex health check --format json
synthex health check --service database --format json
```

### Help & Examples

Every command has built-in help:
```bash
synthex <command> --help
synthex <command> <subcommand> --help
```

---

## Environment Variables

Override configuration with environment variables:

| Variable | Description |
|----------|-------------|
| `SYNTHEX_WORKSPACE_ID` | Override workspace ID |
| `SYNTHEX_TENANT_ID` | Override active tenant ID |
| `SYNTHEX_CONFIG_DIR` | Override config directory (default: ~/.synthex) |

**Example**:
```bash
SYNTHEX_WORKSPACE_ID=ws_custom synthex tenant tenants list
```

---

## Exit Codes

Synthex CLI uses standard exit codes:

| Code | Meaning |
|------|---------|
| `0` | Success |
| `1` | Error (general) |
| `2` | Validation error |

**Example**:
```bash
synthex health check
if [ $? -eq 0 ]; then
  echo "System healthy"
else
  echo "System unhealthy"
fi
```

---

## See Also

- **Getting Started Guide**: Complete setup and first steps
- **Best Practices**: Recommended patterns and workflows
- **Troubleshooting Guide**: Common issues and solutions
- **Integration Guide**: Integrate Synthex with your systems
- **API Reference**: Service APIs and database schema

---

**Last Updated**: 2026-01-15
**Version**: 1.0.0
