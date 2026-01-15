# Synthex Apex Architecture

**Version**: 1.0.0
**Branch**: Apex-Architecture
**Status**: In Development
**Date**: 2026-01-15

---

## Overview

Synthex Apex Architecture is a comprehensive CLI-first platform for managing multi-tenant e-commerce operations across Australia and New Zealand (ANZ) markets. It provides secure authentication, credential management, and business validation for Shopify and Google Merchant Center integrations.

## Architecture Principles

### 1. **CLI-First Design**
- Primary interface is command-line for automation and scripting
- Web dashboard as secondary interface for visual management
- All operations scriptable and CI/CD compatible

### 2. **Security by Default**
- Zero credentials in code or environment files
- Google Secret Manager for all sensitive data
- JWT-based authentication with short-lived tokens
- Per-tenant credential isolation

### 3. **Multi-Tenant Architecture**
- Each client is a separate tenant with isolated credentials
- Agency-level master credentials managed separately
- Workspace-level isolation at database and API levels

### 4. **Regional Compliance**
- ABN (Australian Business Number) validation for AU
- NZBN (New Zealand Business Number) validation for NZ
- Regional tax and compliance rule enforcement
- Market-specific pricing and currency handling

---

## Command Structure

### Core Commands

#### 1. `synthex init`
Initialize Synthex environment for a specific market and region.

```bash
synthex init --market "ANZ_SMB" --region "AU-SE1"
```

**Flags**:
- `--market` - Target market segment (ANZ_SMB, ANZ_ENTERPRISE, US_SMB, etc.)
- `--region` - Cloud region code (AU-SE1 = Australia Southeast 1, NZ-NR1 = New Zealand North 1)

**Actions**:
1. Creates `.synthex/config.json` with market settings
2. Initializes database schema for region
3. Sets up local trust anchors
4. Validates Google Cloud project access
5. Creates default workspace if none exists

**Output**:
```
✓ Synthex initialized successfully
  Market: ANZ_SMB (Australia/New Zealand Small Business)
  Region: AU-SE1 (Australia Southeast - Sydney)
  Config: C:\Users\[user]\.synthex\config.json
  Workspace: default-anz-smb
```

---

#### 2. `synthex auth login`
Authenticate with external services using secure OAuth flows.

**Shopify Authentication**:
```bash
synthex auth login --service shopify --tenant-id "SMB_CLIENT_001"
```

**Google Merchant Center Authentication**:
```bash
synthex auth login --service google-merchant --client-id "SYNTHEX_AGENCY_ID"
```

**Flags**:
- `--service` - Service to authenticate (shopify, google-merchant, facebook-ads, tiktok-ads)
- `--tenant-id` - Client tenant identifier (for client-level auth)
- `--client-id` - Agency client identifier (for agency-level auth)
- `--scope` - OAuth scopes (optional, defaults to service-specific scopes)

**Actions**:
1. Initiates OAuth flow with service
2. Opens browser for user consent
3. Exchanges authorization code for tokens
4. Stores tokens in Google Secret Manager
5. Creates JWT for local session
6. Updates credential registry in database

**Output**:
```
✓ Shopify authentication successful
  Tenant: SMB_CLIENT_001
  Shop: smb-client-001.myshopify.com
  Scopes: read_products, write_products, read_orders, write_orders
  Expires: 2026-02-15 10:30:00 UTC (30 days)
  Secret: projects/synthex-prod/secrets/shopify-SMB_CLIENT_001-token
```

**Security Flow**:
```
User → synthex auth login → OAuth Browser Flow
     ← Authorization Code
     → Exchange Code for Tokens
     → Store in Google Secret Manager
     ← JWT for local session (24h expiry)
     → Update credential_registry table
```

---

#### 3. `synthex check business-id`
Validate business identifiers against government registries.

**Australian Business Number (ABN)**:
```bash
synthex check business-id --country AU --id "12345678901"
```

**New Zealand Business Number (NZBN)**:
```bash
synthex check business-id --country NZ --id "9429030477537"
```

**Flags**:
- `--country` - Country code (AU, NZ)
- `--id` - Business identifier number
- `--strict` - Enable strict validation (checks active status, not just format)
- `--cache` - Use cached validation results (default: true, max age: 24h)

**Actions**:
1. Validates ID format (11 digits for ABN, 13 digits for NZBN)
2. Calculates check digit (ABN uses mod 89, NZBN uses mod 97)
3. Queries government API if --strict enabled
4. Caches validation results for 24 hours
5. Returns business entity details

**Output (AU ABN)**:
```
✓ Valid Australian Business Number
  ABN: 12 345 678 901
  Entity: ACME PTY LTD
  Status: Active
  GST Registered: Yes
  Registered: 2015-03-20
  ABR Record: https://abr.business.gov.au/ABN/View?abn=12345678901
```

**Output (NZ NZBN)**:
```
✓ Valid New Zealand Business Number
  NZBN: 9429030477537
  Entity: ACME LIMITED
  Status: Active
  GST Registered: Yes
  Registered: 2018-06-15
  Companies Office: https://companies-register.companiesoffice.govt.nz/companies/12345678
```

---

## Architecture Components

### 1. CLI Framework

**Location**: `src/cli/synthex.ts`

Built with **Commander.js** for robust command parsing and validation.

**Structure**:
```
src/cli/
├── synthex.ts              # Main CLI entry point
├── commands/
│   ├── init.ts             # synthex init
│   ├── auth/
│   │   ├── login.ts        # synthex auth login
│   │   ├── logout.ts       # synthex auth logout
│   │   ├── refresh.ts      # synthex auth refresh
│   │   └── status.ts       # synthex auth status
│   ├── check/
│   │   ├── business-id.ts  # synthex check business-id
│   │   └── health.ts       # synthex check health
│   └── config/
│       ├── get.ts          # synthex config get
│       └── set.ts          # synthex config set
├── services/
│   ├── auth/
│   │   ├── shopify-oauth.ts
│   │   ├── google-oauth.ts
│   │   └── jwt-manager.ts
│   ├── validation/
│   │   ├── abn-validator.ts
│   │   └── nzbn-validator.ts
│   └── secrets/
│       └── secret-manager.ts
└── utils/
    ├── config-manager.ts
    ├── logger.ts
    └── spinner.ts
```

---

### 2. Configuration Management

**Config Location**: `~/.synthex/config.json`

**Schema**:
```json
{
  "version": "1.0.0",
  "market": "ANZ_SMB",
  "region": "AU-SE1",
  "workspace_id": "default-anz-smb",
  "project_id": "synthex-prod",
  "initialized_at": "2026-01-15T10:30:00Z",
  "settings": {
    "currency": "AUD",
    "timezone": "Australia/Sydney",
    "tax_mode": "inclusive",
    "locale": "en-AU"
  },
  "auth": {
    "jwt_path": "~/.synthex/jwt.token",
    "jwt_expires_at": "2026-01-16T10:30:00Z"
  }
}
```

**Environment Variables** (optional overrides):
```env
SYNTHEX_MARKET=ANZ_SMB
SYNTHEX_REGION=AU-SE1
SYNTHEX_PROJECT_ID=synthex-prod
SYNTHEX_WORKSPACE_ID=default-anz-smb
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

---

### 3. Authentication System

#### JWT Lifecycle Management

**Token Structure**:
```json
{
  "iss": "synthex-cli",
  "sub": "user@example.com",
  "aud": "synthex-api",
  "exp": 1737029400,
  "iat": 1736943000,
  "workspace_id": "default-anz-smb",
  "tenant_id": "SMB_CLIENT_001",
  "scopes": ["shopify:read", "shopify:write", "merchant:read"]
}
```

**Expiry Rules**:
- Local JWT: 24 hours
- Shopify tokens: 30 days (rolling refresh)
- Google OAuth tokens: 1 hour access + refresh token

#### Credential Storage

**Google Secret Manager Structure**:
```
projects/synthex-prod/secrets/
├── shopify-SMB_CLIENT_001-token
│   ├── access_token
│   ├── refresh_token (if applicable)
│   ├── expires_at
│   └── scopes
├── google-merchant-SYNTHEX_AGENCY_ID-token
│   ├── access_token
│   ├── refresh_token
│   ├── expires_at
│   └── scopes
└── master-encryption-key
```

**Database Registry**:
```sql
CREATE TABLE credential_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  tenant_id TEXT NOT NULL,
  service TEXT NOT NULL, -- 'shopify', 'google-merchant', etc.
  secret_name TEXT NOT NULL, -- Google Secret Manager path
  scopes TEXT[], -- OAuth scopes granted
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, service)
);
```

---

### 4. Service Integrations

#### Shopify OAuth

**OAuth Flow**:
1. Generate OAuth URL: `https://{shop}.myshopify.com/admin/oauth/authorize`
2. Scopes: `read_products,write_products,read_orders,write_orders,read_customers`
3. Redirect URI: `http://localhost:3008/api/synthex/auth/shopify/callback`
4. Exchange code for access token
5. Store in Secret Manager

**Implementation**: `src/cli/services/auth/shopify-oauth.ts`

#### Google Merchant Center OAuth

**OAuth Flow**:
1. Google OAuth 2.0 with Content API scope
2. Scope: `https://www.googleapis.com/auth/content`
3. Redirect URI: `http://localhost:3008/api/synthex/auth/google/callback`
4. Exchange code for access + refresh tokens
5. Store in Secret Manager

**Implementation**: `src/cli/services/auth/google-oauth.ts`

---

### 5. Business Validation Services

#### ABN Validation (Australia)

**Algorithm**:
```typescript
function validateABN(abn: string): boolean {
  // Remove spaces, ensure 11 digits
  const digits = abn.replace(/\s/g, '');
  if (!/^\d{11}$/.test(digits)) return false;

  // Subtract 1 from first digit
  const weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];
  let sum = 0;

  for (let i = 0; i < 11; i++) {
    const digit = i === 0 ? parseInt(digits[i]) - 1 : parseInt(digits[i]);
    sum += digit * weights[i];
  }

  // Valid if sum modulo 89 equals 0
  return sum % 89 === 0;
}
```

**API Integration**:
- **ABR API**: https://abr.business.gov.au/abrxmlsearch/AbrXmlSearch.asmx
- **Rate Limit**: 1000 requests/day (free tier)
- **Requires**: ABR GUID (API key)

**Implementation**: `src/cli/services/validation/abn-validator.ts`

#### NZBN Validation (New Zealand)

**Algorithm**:
```typescript
function validateNZBN(nzbn: string): boolean {
  // Ensure 13 digits
  if (!/^\d{13}$/.test(nzbn)) return false;

  // MOD 97 check digit validation
  const first12 = nzbn.substring(0, 12);
  const checkDigit = parseInt(nzbn.substring(12, 13));

  const remainder = parseInt(first12) % 97;
  const calculatedCheck = 98 - remainder;

  return calculatedCheck === checkDigit;
}
```

**API Integration**:
- **Companies Office API**: https://api.business.govt.nz/services/v4/
- **Rate Limit**: No published limit (reasonable use)
- **Requires**: API key

**Implementation**: `src/cli/services/validation/nzbn-validator.ts`

---

## Database Schema

### New Tables

#### 1. `credential_registry`
Tracks all OAuth credentials stored in Secret Manager.

```sql
CREATE TABLE credential_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  tenant_id TEXT NOT NULL,
  service TEXT NOT NULL CHECK (service IN ('shopify', 'google-merchant', 'facebook-ads', 'tiktok-ads')),
  secret_name TEXT NOT NULL,
  scopes TEXT[],
  expires_at TIMESTAMPTZ,
  last_refreshed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, service)
);

CREATE INDEX idx_credential_registry_workspace ON credential_registry(workspace_id);
CREATE INDEX idx_credential_registry_service ON credential_registry(service);
CREATE INDEX idx_credential_registry_expires ON credential_registry(expires_at);

-- RLS policies
ALTER TABLE credential_registry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view credentials in their workspace"
  ON credential_registry FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()));
```

#### 2. `business_validations`
Caches business ID validation results.

```sql
CREATE TABLE business_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country TEXT NOT NULL CHECK (country IN ('AU', 'NZ')),
  business_id TEXT NOT NULL,
  entity_name TEXT,
  status TEXT, -- 'active', 'inactive', 'cancelled'
  gst_registered BOOLEAN,
  registered_date DATE,
  validation_source TEXT, -- 'ABR', 'NZBN', 'manual'
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  raw_response JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country, business_id)
);

CREATE INDEX idx_business_validations_lookup ON business_validations(country, business_id);
CREATE INDEX idx_business_validations_expires ON business_validations(expires_at);
```

#### 3. `synthex_tenants`
Multi-tenant client configuration.

```sql
CREATE TABLE synthex_tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  tenant_id TEXT NOT NULL UNIQUE,
  entity_name TEXT NOT NULL,
  country TEXT NOT NULL CHECK (country IN ('AU', 'NZ')),
  business_id TEXT, -- ABN or NZBN
  shopify_shop TEXT, -- myshopify.com domain
  google_merchant_id TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_synthex_tenants_workspace ON synthex_tenants(workspace_id);

-- RLS policies
ALTER TABLE synthex_tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tenants in their workspace"
  ON synthex_tenants FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM user_workspaces WHERE user_id = auth.uid()));
```

---

## Security Model

### 1. **Zero-Trust Architecture**
- No credentials in environment variables
- No credentials in code or config files
- All credentials in Google Secret Manager
- JWT tokens expire after 24 hours
- Service tokens refreshed automatically

### 2. **Credential Isolation**
```
Agency Level (SYNTHEX_AGENCY_ID)
├── Client 1 (SMB_CLIENT_001)
│   ├── Shopify: secrets/shopify-SMB_CLIENT_001-token
│   └── Google Merchant: secrets/google-merchant-SMB_CLIENT_001-token
├── Client 2 (SMB_CLIENT_002)
│   ├── Shopify: secrets/shopify-SMB_CLIENT_002-token
│   └── Google Merchant: secrets/google-merchant-SMB_CLIENT_002-token
└── Master Keys
    └── secrets/master-encryption-key
```

### 3. **Workspace Isolation**
- Each workspace has separate credentials
- RLS policies enforce workspace boundaries
- Tenants cannot access other tenants' data
- API routes validate workspace ownership

---

## Implementation Roadmap

### Phase 1: Core CLI Infrastructure (Week 1)
- [ ] CLI framework with Commander.js
- [ ] Configuration management system
- [ ] `synthex init` command
- [ ] `synthex config get/set` commands
- [ ] Logger and spinner utilities

### Phase 2: Authentication System (Week 1-2)
- [ ] JWT manager with 24h expiry
- [ ] Google Secret Manager integration
- [ ] `synthex auth login --service shopify`
- [ ] `synthex auth login --service google-merchant`
- [ ] `synthex auth status` command
- [ ] Database migration for credential_registry

### Phase 3: Business Validation (Week 2)
- [ ] ABN validation algorithm
- [ ] NZBN validation algorithm
- [ ] ABR API integration (Australia)
- [ ] Companies Office API integration (NZ)
- [ ] `synthex check business-id` command
- [ ] Validation caching system
- [ ] Database migration for business_validations

### Phase 4: Shopify Integration (Week 3)
- [ ] Shopify OAuth flow
- [ ] Token refresh mechanism
- [ ] Shop validation
- [ ] Product sync endpoints
- [ ] Order sync endpoints

### Phase 5: Google Merchant Center Integration (Week 3-4)
- [ ] Google OAuth flow
- [ ] Content API integration
- [ ] Product feed management
- [ ] Merchant ID validation

### Phase 6: Multi-Tenant Management (Week 4)
- [ ] Tenant creation/management
- [ ] Per-tenant credential isolation
- [ ] Tenant settings management
- [ ] Database migration for synthex_tenants

---

## Usage Examples

### Complete Onboarding Flow

```bash
# 1. Initialize for ANZ market
synthex init --market "ANZ_SMB" --region "AU-SE1"

# 2. Validate client business ID
synthex check business-id --country AU --id "12345678901" --strict

# 3. Authenticate Shopify
synthex auth login --service shopify --tenant-id "SMB_CLIENT_001"
# Opens browser → User approves → Tokens stored in Secret Manager

# 4. Authenticate Google Merchant Center
synthex auth login --service google-merchant --client-id "SYNTHEX_AGENCY_ID"
# Opens browser → User approves → Tokens stored in Secret Manager

# 5. Verify authentication status
synthex auth status
```

### Automation/CI-CD Flow

```bash
# Set environment variables in CI/CD
export SYNTHEX_MARKET=ANZ_SMB
export SYNTHEX_REGION=AU-SE1
export GOOGLE_APPLICATION_CREDENTIALS=/secrets/service-account.json

# Initialize (uses env vars)
synthex init

# Validate multiple clients
for tenant in SMB_CLIENT_001 SMB_CLIENT_002 SMB_CLIENT_003; do
  synthex auth status --tenant-id $tenant
done
```

---

## API Endpoints

### Authentication Callbacks

```
POST /api/synthex/auth/shopify/callback
POST /api/synthex/auth/google/callback
GET  /api/synthex/auth/status
POST /api/synthex/auth/refresh
```

### Business Validation

```
GET  /api/synthex/validate/abn?id=12345678901
GET  /api/synthex/validate/nzbn?id=9429030477537
```

### Tenant Management

```
GET    /api/synthex/tenants
POST   /api/synthex/tenants
GET    /api/synthex/tenants/:id
PUT    /api/synthex/tenants/:id
DELETE /api/synthex/tenants/:id
```

---

## Testing Strategy

### Unit Tests
- ABN/NZBN validation algorithms
- JWT generation and validation
- Configuration management
- Secret Manager integration

### Integration Tests
- Shopify OAuth flow (sandbox)
- Google OAuth flow (test account)
- Business ID API validation
- Database operations

### E2E Tests
- Complete onboarding flow
- Multi-tenant credential isolation
- Token refresh mechanisms

---

## Documentation

### User Documentation
- `docs/SYNTHEX_CLI_GUIDE.md` - Complete CLI usage guide
- `docs/SYNTHEX_AUTHENTICATION.md` - Authentication setup
- `docs/SYNTHEX_BUSINESS_VALIDATION.md` - Business ID validation

### Developer Documentation
- `docs/SYNTHEX_API_REFERENCE.md` - API endpoints
- `docs/SYNTHEX_ARCHITECTURE.md` - This document
- `docs/SYNTHEX_SECRETS_MANAGEMENT.md` - Secret Manager setup

---

## Dependencies

### New NPM Packages

```json
{
  "dependencies": {
    "commander": "^12.0.0",
    "@google-cloud/secret-manager": "^5.0.0",
    "jsonwebtoken": "^9.0.2",
    "ora": "^8.0.1",
    "chalk": "^5.3.0",
    "inquirer": "^9.2.12",
    "axios": "^1.6.5",
    "xml2js": "^0.6.2"
  }
}
```

### Google Cloud Services

- **Secret Manager**: Credential storage
- **Cloud Run**: API hosting (existing)
- **Firestore**: Session storage (optional)

---

## Success Metrics

### Performance
- CLI command response time: <500ms (excluding OAuth flows)
- Business validation: <2s (cached: <100ms)
- Token refresh: <1s
- Secret Manager retrieval: <200ms

### Security
- Zero credentials in code: 100%
- JWT expiry compliance: 100%
- Secret rotation frequency: 90 days
- OAuth token refresh success rate: >99%

### Reliability
- ABN validation accuracy: >99.9%
- NZBN validation accuracy: >99.9%
- OAuth flow completion rate: >95%
- Uptime: 99.9%

---

## Future Enhancements

### Phase 2 Features
- [ ] Facebook Ads authentication
- [ ] TikTok Ads authentication
- [ ] Stripe Connect integration
- [ ] Multi-currency support
- [ ] Automated tax calculation

### Phase 3 Features
- [ ] Product catalog sync
- [ ] Inventory management
- [ ] Order fulfillment
- [ ] Customer data sync
- [ ] Analytics dashboard

---

**Next Steps**: Begin Phase 1 implementation with CLI framework and `synthex init` command.
