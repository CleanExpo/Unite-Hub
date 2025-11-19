# Phase 9 Weeks 3-4: Trust API & UI Wizard - COMPLETE

**Branch:** `feature/phase9-week3-4-trust-api`
**Status:** Complete
**Date:** 2025-01-20

---

## Executive Summary

Weeks 3-4 deliver the **API endpoints and UI wizard** for Trusted Mode onboarding, enabling staff to guide clients through the complete trust configuration process.

### Key Deliverables

- **4 API Routes** (~500 lines) - Init, verify-ownership, configure-scopes, status
- **TrustedModeWizard** (500+ lines) - 7-step onboarding wizard component
- **Complete onboarding flow** from introduction to activation

---

## API Endpoints

### POST /api/trust/init

**Purpose:** Begin Trusted Mode onboarding for a client.

**Request:**
```typescript
{
  client_id: string;      // UUID
  restore_email: string;  // Emergency contact email
  emergency_phone?: string;
  nightly_backup_enabled?: boolean;
}
```

**Response:**
```typescript
{
  request: TrustedModeRequest;
  message: string;
  next_step: "verify-identity";
  timestamp: string;
}
```

**Authorization:** Organization admin only

---

### POST /api/trust/verify-ownership

**Purpose:** Confirm website ownership via GSC, DNS, or HTML.

**Request:**
```typescript
{
  client_id: string;
  method: "GSC" | "DNS_TXT" | "HTML_FILE" | "META_TAG" | "MANUAL";
  domain: string;
  verification_code?: string;  // For DNS/HTML
  gsc_property_id?: string;    // For GSC
}
```

**Verification Methods:**

| Method | Description | Verification |
|--------|-------------|--------------|
| GSC | Google Search Console | Property ID match |
| DNS_TXT | DNS TXT record | Record value = `unite-hub-verify={client_id_prefix}` |
| HTML_FILE | Upload file to root | File content verification |
| META_TAG | Add meta tag to homepage | Tag content verification |
| MANUAL | Admin verification | Requires admin approval |

**Response:**
```typescript
{
  request: TrustedModeRequest;
  verification_result: OwnershipVerificationResult;
  message: string;
  next_step: string | null;
  timestamp: string;
}
```

---

### POST /api/trust/configure-scopes

**Purpose:** Configure autonomy domains and intensity for a client.

**Request:**
```typescript
{
  client_id: string;
  seo_scope?: {
    enabled: boolean;
    auto_fix_technical?: boolean;
    max_title_change_percent?: number;
  };
  content_scope?: {
    enabled: boolean;
    auto_add_faq?: boolean;
    approved_categories?: string[];
  };
  ads_scope?: {
    enabled: boolean;
    draft_only?: boolean;
    max_bid_change_percent?: number;
  };
  cro_scope?: {
    enabled: boolean;
    auto_create_tests?: boolean;
  };
  max_daily_actions?: number;
  max_risk_level_allowed?: "LOW" | "MEDIUM" | "HIGH";
}
```

**Authorization:** Requires Trusted Mode to be ACTIVE

**Response:**
```typescript
{
  scopes: AutonomyScopes;
  enabled_domains: string[];
  message: string;
  timestamp: string;
}
```

---

### GET /api/trust/status

**Purpose:** Get complete Trusted Mode status for a client.

**Query Parameters:**
- `client_id` (required): Client UUID

**Response:**
```typescript
{
  status: TrustStatusResponse;
  request: TrustedModeRequest | null;
  scopes: AutonomyScopes | null;
  timestamp: string;
}
```

### DELETE /api/trust/status

**Purpose:** Revoke Trusted Mode for a client.

**Request Body:**
```typescript
{
  client_id: string;
  reason: string;
}
```

---

## UI Wizard Component

### TrustedModeWizard

A 7-step wizard guiding staff through Trusted Mode onboarding.

**Props:**
```typescript
interface TrustedModeWizardProps {
  clientId: string;
  clientName: string;
  clientDomain: string;
  onComplete?: () => void;
  onCancel?: () => void;
}
```

### Steps

1. **Introduction**
   - Explain Trusted Mode benefits
   - Highlight safety rails
   - Set expectations

2. **Identity Verification**
   - ABN/ACN input
   - Legal business name
   - Will integrate with ABR API

3. **Ownership Verification**
   - Four verification methods
   - GSC, DNS, HTML, Manual
   - Auto-generates verification codes

4. **Legal Consent**
   - Display terms and conditions
   - Require acknowledgment checkbox
   - Will integrate with DocuSign

5. **Scope Configuration**
   - Toggle each domain (SEO/Content/Ads/CRO)
   - Configure per-domain options
   - Set global limits (risk level, daily actions)

6. **Backup Settings**
   - Restore email (required)
   - Emergency phone
   - Nightly backup toggle

7. **Review & Activate**
   - Summary of all settings
   - Final confirmation
   - Submit to API

### Features

- **Progress indicator** - Visual step progress
- **Validation** - Per-step validation before proceeding
- **Error handling** - Clear error messages
- **Responsive** - Works on mobile and desktop
- **Accessible** - Proper labels and focus management

### Usage

```tsx
import { TrustedModeWizard } from "@/components/trust/TrustedModeWizard";

<TrustedModeWizard
  clientId="client-uuid"
  clientName="Example Company"
  clientDomain="example.com"
  onComplete={() => {
    toast.success("Trusted Mode activated!");
    router.push(`/staff/clients/${clientId}`);
  }}
  onCancel={() => {
    router.back();
  }}
/>
```

---

## Files Created

### API Routes
- `src/app/api/trust/init/route.ts` (100 lines)
- `src/app/api/trust/verify-ownership/route.ts` (150 lines)
- `src/app/api/trust/configure-scopes/route.ts` (120 lines)
- `src/app/api/trust/status/route.ts` (180 lines)

### Components
- `src/components/trust/TrustedModeWizard.tsx` (500+ lines)

### Documentation
- `docs/PHASE9_WEEK3_4_TRUST_API_COMPLETE.md` (THIS FILE)

**Total: ~1,050 lines of code**

---

## Security Model

### Authentication
- All endpoints require Bearer token
- Uses both client-side and server-side auth patterns

### Authorization
- Organization membership verification
- Admin role required for trust management
- Client ownership verification

### Input Validation
- All requests validated with Zod schemas
- Type-safe throughout

---

## Integration Points

### Staff Dashboard

Add to client settings page:

```tsx
<Tabs>
  <Tab label="Profile">...</Tab>
  <Tab label="Autonomy & Trust">
    {!trustStatus?.request ? (
      <TrustedModeWizard
        clientId={clientId}
        clientName={client.name}
        clientDomain={client.domain}
        onComplete={refetchStatus}
      />
    ) : (
      <TrustStatusPanel
        status={trustStatus.status}
        request={trustStatus.request}
        scopes={trustStatus.scopes}
      />
    )}
  </Tab>
</Tabs>
```

### Client Portal

Show trust status to clients:

```tsx
<TrustBadge status={trustStatus.trusted_mode_status} />
<EnabledDomainsList domains={trustStatus.enabled_domains} />
```

---

## Known Limitations

1. **No real GSC integration** - Stubs verification for now
2. **No real DNS lookup** - Checks pattern match only
3. **No e-signature integration** - Checkbox consent only (Weeks 5-6)
4. **No ABR API** - Manual ABN entry only

---

## Next Steps

### Weeks 5-6: E-Signature Integration
- Integrate DocuSign or HelloSign API
- Store signed agreements
- Add audit trail for signatures
- Implement automatic ABN/ACN lookup

### Weeks 7-8: Autonomy Engine
- Build proposal and execution workers
- Implement rollback engine
- Wire to SEO OS intelligence layer

---

## Summary

Phase 9 Weeks 3-4 deliver the user-facing components for Trusted Mode onboarding. The API endpoints handle the business logic while the wizard component provides an intuitive UI for staff to guide clients through the trust configuration process.

**Key Features:**
- 4 REST API endpoints with full validation
- 7-step onboarding wizard
- Multiple ownership verification methods
- Configurable autonomy scopes
- Role-based access control
- Clear progress indication

---

**Status:** COMPLETE - READY FOR WEEKS 5-6
