# Founder Business Identity Vault (AI Phill)

This module provides a central, founder-only vault for managing per-business identity, channels and AI snapshots.

## Goals

- Keep all businesses separate but managed under one Founder OS
- Enable AI Phill to generate per-business and portfolio-level synopses
- Use Google Leak / DOJ / Yandex doctrine signals as part of snapshot scoring
- **Never auto-change production** - all outputs are recommendations only

## Key Tables (Migration 310)

### `business_identity_profiles`
Per-business identity vault for Founder OS.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| owner_profile_id | uuid | References profiles(id) - founder who owns this business |
| business_key | text | Unique slug identifier (e.g., 'synthex', 'carsi-steel') |
| display_name | text | Human-readable name |
| legal_name | text | Legal entity name |
| primary_domain | text | Main website domain |
| primary_gmb_location | text | Google Business Profile location |
| primary_region | text | Geographic region |
| industry | text | Industry classification |
| notes | text | Free-form notes |

### `business_identity_channels`
Per-business channel and platform mapping.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| business_id | uuid | References business_identity_profiles(id) |
| channel_type | text | e.g., 'search', 'social', 'ads', 'email', 'analytics' |
| provider | text | e.g., 'google', 'facebook', 'linkedin', 'sendgrid' |
| account_label | text | Human-readable label |
| external_id | text | Provider-specific ID (GA4 property, page ID, etc.) |
| meta | jsonb | Additional provider-specific data |

### `business_identity_ai_snapshots`
AI Phill portfolio snapshots using Google Leak doctrine signals.

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| business_id | uuid | References business_identity_profiles(id) |
| snapshot_type | text | e.g., 'seo-audit', 'portfolio-synopsis', 'competitive-analysis' |
| summary_markdown | text | AI-generated summary in markdown |
| navboost_risk_score | numeric | 0-100, risk from NavBoost signals |
| q_star_proxy_score | numeric | 0-100, proxy for Google's Q* ranking quality |
| eeat_strength_score | numeric | 0-100, E-E-A-T strength assessment |
| sandbox_risk_score | numeric | 0-100, new domain/page sandbox risk |
| behaviour_signal_opportunity_score | numeric | 0-100, user behaviour signal opportunities |
| gap_opportunities | jsonb | Structured gap analysis data |

## Access

### UI Pages
- `/founder/business-vault` - Business vault listing with portfolio stats
- `/founder/business-vault/[businessKey]` - Individual business detail view
- `/founder/business-vault/new` - Create new business

### API Endpoints

#### List/Create Businesses
```
GET  /api/founder/business-vault
GET  /api/founder/business-vault?stats=true
POST /api/founder/business-vault
```

#### Individual Business
```
GET /api/founder/business-vault/[businessKey]
```

#### Create Snapshot
```
POST /api/founder/business-vault/[businessKey]/snapshot
Body: {
  snapshot_type: string,
  summary_markdown: string,
  navboost_risk_score?: number,
  q_star_proxy_score?: number,
  eeat_strength_score?: number,
  sandbox_risk_score?: number,
  behaviour_signal_opportunity_score?: number,
  gap_opportunities?: object
}
```

#### Add Channel
```
POST /api/founder/business-vault/[businessKey]/channel
Body: {
  channel_type: string,
  provider: string,
  account_label?: string,
  external_id?: string,
  meta?: object
}
```

## Orchestrator Intents

The orchestrator router supports these business vault intents:

| Intent | Patterns | Handler |
|--------|----------|---------|
| list_businesses | "list businesses", "show my businesses", "business portfolio" | `handleListBusinessesOverview()` |
| business_synopsis | "business synopsis", "analyze business", "navboost analysis" | `handleCompileBusinessSynopsis(businessKey)` |
| portfolio_synopsis | "portfolio synopsis", "umbrella analysis", "founder portfolio health" | `handleCompilePortfolioSynopsis()` |

## Human-Governed Mode

All outputs are **recommendations only**. Implementation still flows through:

1. **Client-in-the-loop approvals** - Strategies require explicit client sign-off
2. **Strategy engine (Blue Ocean)** - Multiple options presented, not auto-selected
3. **AI consultation** - ELI5 / Beginner / Technical / Founder explanation modes

**Nothing goes live without explicit human approval.**

## Google Leak Doctrine Signals

AI Phill uses these signals from the leaked Google ranking documentation:

| Signal | Score Range | Description |
|--------|-------------|-------------|
| NavBoost Risk | 0-100 | Risk from user navigation behavior patterns |
| Q* Proxy | 0-100 | Proxy for Google's internal quality score |
| E-E-A-T Strength | 0-100 | Experience, Expertise, Authority, Trust |
| Sandbox Risk | 0-100 | New domain/page devaluation risk |
| Behaviour Signal Opportunity | 0-100 | User engagement improvement opportunities |

## Service Layer

Located at `src/lib/founder/businessVaultService.ts`:

```typescript
// List all businesses for current founder
listFounderBusinesses(): Promise<BusinessIdentityProfile[]>

// Get business with channels and snapshots
getBusinessWithChannels(businessKey: string): Promise<BusinessWithDetails | null>

// Create/update business profile
upsertBusinessProfile(input): Promise<BusinessIdentityProfile>

// Create AI snapshot
createBusinessSnapshot(businessKey, snapshot): Promise<BusinessIdentityAISnapshot>

// Add channel mapping
addBusinessChannel(businessKey, channel): Promise<BusinessIdentityChannel>

// Get portfolio-wide statistics
getPortfolioStats(): Promise<PortfolioStats>
```

## Row Level Security

All tables have RLS enabled with owner-only access:

- `business_identity_profiles`: User can only access where `owner_profile_id = auth.uid()`
- `business_identity_channels`: Access through parent business ownership
- `business_identity_ai_snapshots`: Access through parent business ownership

## Migration

Run migration 310 in Supabase SQL Editor:

```sql
-- Full migration in: supabase/migrations/310_business_identity_vault.sql
```

---

**Last Updated**: 2025-11-28
**Version**: 1.0.0
