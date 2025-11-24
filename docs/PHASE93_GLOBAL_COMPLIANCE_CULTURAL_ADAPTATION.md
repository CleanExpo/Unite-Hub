# Phase 93: Global Compliance & Cultural Adaptation Engine (GCCAE)

## Overview

Phase 93 makes Unite-Hub safe and appropriate across regions (AU/US/UK/EU/CA/NZ) by enforcing region-aware compliance rules, platform policies, and cultural adaptation for content, campaigns, and automation.

**Important**: This system provides automated pattern matching aids and is not a substitute for legal advice.

## Architecture

### Compliance Flow

```
Content → Compliance Check
    ↓
    ├─→ Match against region/platform policies
    ├─→ Calculate confidence scores
    ├─→ Generate violations/warnings
    └─→ Block or allow with notes
```

### Cultural Adaptation Flow

```
Content → Locale Profile
    ↓
    ├─→ Apply spelling variant
    ├─→ Check tone guidelines
    ├─→ Flag sensitivity issues
    └─→ Note upcoming holidays
```

## Database Schema

### Core Tables

```sql
-- Compliance policies by region/platform
CREATE TABLE compliance_policies (
  id UUID PRIMARY KEY,
  region_slug TEXT NOT NULL,
  platform TEXT NOT NULL,
  policy_code TEXT NOT NULL,
  severity TEXT NOT NULL, -- low | medium | high | critical
  description_markdown TEXT NOT NULL,
  example_patterns JSONB NOT NULL,
  is_active BOOLEAN NOT NULL
);

-- Locale profiles for cultural adaptation
CREATE TABLE locale_profiles (
  id UUID PRIMARY KEY,
  region_slug TEXT NOT NULL,
  locale_code TEXT NOT NULL,
  spelling_variant TEXT NOT NULL,
  tone_guidelines JSONB NOT NULL,
  holiday_calendar JSONB NOT NULL,
  sensitivity_flags JSONB NOT NULL,
  UNIQUE(region_slug, locale_code)
);

-- Compliance incidents log
CREATE TABLE compliance_incidents (
  id UUID PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES agencies(id),
  platform TEXT NOT NULL,
  policy_code TEXT NOT NULL,
  severity TEXT NOT NULL,
  status TEXT NOT NULL, -- warning | blocked | overridden
  content_ref JSONB NOT NULL,
  notes_markdown TEXT NOT NULL,
  resolved_at TIMESTAMPTZ
);
```

### Default Regions & Policies

| Region | Locale | Spelling | Key Policies |
|--------|--------|----------|--------------|
| AU | en-AU | Australian | HEALTH_CLAIMS, FINANCIAL_PROMISES, TESTIMONIAL_ATYPICAL |
| US | en-US | American | FTC_ENDORSEMENTS, HEALTH_CLAIMS_FDA |
| UK | en-GB | British | ASA_CAP_CODE, GDPR_CONSENT |
| EU | - | - | GDPR_COMPLIANCE, GREEN_CLAIMS |
| NZ | en-NZ | British | Similar to AU |
| CA | en-CA | Canadian | - |

## Backend Services

### Policy Registry Service

```typescript
import { getActivePolicies, getPolicyCoverage } from '@/lib/compliance';

// Get policies for a region/platform
const policies = await getActivePolicies('au', 'facebook');

// Get coverage stats
const coverage = await getPolicyCoverage();
// Returns: { regions: ['au', 'us', ...], platforms: [...], totalPolicies: 15 }
```

### Locale Profile Service

```typescript
import {
  getLocaleProfile,
  checkUpcomingHolidays,
  getSpellingDifferences
} from '@/lib/compliance';

// Get locale profile
const locale = await getLocaleProfile('au', 'en-AU');

// Check upcoming holidays
const holidays = checkUpcomingHolidays(locale, 7);

// Get spelling differences
const diffs = getSpellingDifferences('american', 'australian');
// Returns: { color: 'colour', organize: 'organise', ... }
```

### Content Compliance Checker

```typescript
import { checkContent, summariseViolations } from '@/lib/compliance';

// Run compliance check
const result = await checkContent({
  text: 'Guaranteed returns on your investment!',
  regionSlug: 'au',
  platform: 'facebook',
});

// Result structure
{
  passed: false,
  violations: [{
    policyCode: 'FINANCIAL_PROMISES',
    severity: 'critical',
    matchedPatterns: ['guaranteed returns'],
    confidence: 0.85,
    description: '...'
  }],
  warnings: [...],
  blockedReason: 'Critical policy violation: FINANCIAL_PROMISES'
}

// Generate human-readable summary
const summary = summariseViolations(result.violations);
```

### Cultural Adaptation Service

```typescript
import {
  adaptCopyToLocale,
  suggestCulturalAdjustments
} from '@/lib/compliance';

// Adapt copy
const adapted = await adaptCopyToLocale({
  text: 'Our color palette organization...',
  localeProfile: auLocale,
  sourceVariant: 'american'
});
// Result: 'Our colour palette organisation...'

// Get cultural notes
const notes = await suggestCulturalAdjustments({
  text: 'This product is amazing!',
  localeProfile: ukLocale
});
// Notes: Consider more understated language in UK
```

### Incident Management

```typescript
import {
  logIncident,
  resolveIncident,
  getIncidentSummary
} from '@/lib/compliance';

// Log incident
const incident = await logIncident({
  agencyId,
  platform: 'facebook',
  policyCode: 'HEALTH_CLAIMS',
  severity: 'high',
  status: 'warning',
  contentRef: { type: 'post', id: '123' },
  notesMarkdown: 'Content contains health claim...'
});

// Resolve incident
await resolveIncident(incidentId, 'Content modified');

// Get summary
const summary = await getIncidentSummary(agencyId);
// Returns: { total, bySeverity, byStatus, unresolved, last30Days }
```

### Truth Adapter

```typescript
import {
  createComplianceReport,
  enforceLegalDisclaimer,
  requiresImmediateAttention
} from '@/lib/compliance';

// Create report with disclaimer
const report = createComplianceReport(checkResult);
// Automatically includes legal disclaimer

// Check if needs attention
const urgent = requiresImmediateAttention(checkResult);
```

### Integration Service

```typescript
import {
  attachComplianceToPreflight,
  preventExecutionOnCriticalViolations,
  emitAutopilotTasksFromIncidents
} from '@/lib/compliance';

// Attach to preflight context
const context = await attachComplianceToPreflight({
  agencyId,
  regionSlug: 'au',
  platform: 'facebook',
  content: { text: 'Your content here' },
  contentRef: { type: 'post', id: '123' }
});

// Check if should block
if (preventExecutionOnCriticalViolations(context)) {
  throw new Error('Content blocked due to compliance violation');
}

// Generate autopilot tasks from incidents
const tasks = await emitAutopilotTasksFromIncidents(agencyId);
```

## API Endpoints

### Check Content

```typescript
POST /api/compliance/check
Body: { text, regionSlug, platform, mediaMeta? }
Auth: Bearer token required
Response: {
  success: true,
  result: ComplianceCheckResult,
  report: string
}
```

### List Incidents

```typescript
GET /api/compliance/incidents
Query: ?agencyId={}&severity={}&status={}&limit={}&includeSummary=true
Auth: Bearer token required
Response: {
  success: true,
  incidents: ComplianceIncident[],
  summary: IncidentSummary
}
```

### List Policies

```typescript
GET /api/compliance/policies
Query: ?regionSlug={}&platform={}&includeCoverage=true
Auth: Bearer token required
Response: {
  success: true,
  policies: CompliancePolicy[],
  coverage: { regions, platforms, totalPolicies }
}
```

## UI Components

### ComplianceOverviewPanel

Summary metrics display:
- Total incidents with unresolved count
- By severity (critical, high, medium, low)
- By status (warning, blocked, overridden)
- Last 30 days count
- Policy coverage stats

### ComplianceIncidentTable

Incident list with:
- Policy code and severity badge
- Platform badge
- Content preview
- Created date
- Resolve/Override actions

### LocaleProfileSummary

Locale profile display:
- Spelling variant
- Tone guidelines
- Holiday calendar
- Sensitivity flags

## Truth Layer Constraints

1. **No legal advice** - All output clearly states it's not legal advice
2. **Pattern confidence disclosed** - Shows confidence scores for matches
3. **Missing policies degrade gracefully** - Warn only, don't block on incomplete data
4. **Cultural adaptation preserves facts** - Never alters factual content
5. **Human review recommended** - Always suggests professional review for critical issues

## File Structure

```
src/lib/compliance/
├── index.ts                          # Module exports
├── complianceTypes.ts                # Type definitions
├── policyRegistryService.ts          # Policy management
├── localeProfileService.ts           # Locale profiles
├── contentComplianceCheckerService.ts # Content checking
├── culturalAdaptationService.ts      # Cultural adaptation
├── complianceIncidentService.ts      # Incident management
├── complianceTruthAdapter.ts         # Truth layer integration
└── complianceIntegrationService.ts   # System integration

src/app/api/compliance/
├── check/route.ts                    # POST content check
├── incidents/route.ts                # GET incidents
└── policies/route.ts                 # GET policies

src/components/compliance/
├── index.ts                          # Component exports
├── ComplianceOverviewPanel.tsx       # Overview metrics
├── ComplianceIncidentTable.tsx       # Incident list
└── LocaleProfileSummary.tsx          # Locale display

src/app/founder/compliance/
└── page.tsx                          # Compliance dashboard
```

## Usage Examples

### Preflight Compliance Check

```typescript
import {
  attachComplianceToPreflight,
  preventExecutionOnCriticalViolations
} from '@/lib/compliance';

async function preflightPost(postData: any) {
  const context = await attachComplianceToPreflight({
    agencyId: postData.agencyId,
    regionSlug: postData.regionSlug || 'au',
    platform: postData.platform,
    content: {
      text: postData.content,
      mediaMeta: postData.media,
    },
    contentRef: {
      type: 'scheduled_post',
      id: postData.id,
    },
  });

  if (preventExecutionOnCriticalViolations(context)) {
    return {
      blocked: true,
      reason: context.complianceResult?.blockedReason,
      violations: context.complianceResult?.violations,
    };
  }

  return { blocked: false };
}
```

### Cultural Adaptation for Multi-Region

```typescript
import {
  getLocaleProfile,
  adaptCopyToLocale,
  suggestCulturalAdjustments
} from '@/lib/compliance';

async function adaptForRegion(content: string, regionSlug: string) {
  const locale = await getLocaleProfile(regionSlug);
  if (!locale) {
    return { text: content, notes: null };
  }

  // Apply spelling/tone adaptation
  const adapted = await adaptCopyToLocale({
    text: content,
    localeProfile: locale,
    sourceVariant: 'american', // Assuming source is US English
  });

  // Get cultural notes
  const notes = await suggestCulturalAdjustments({
    text: adapted.adaptedText,
    localeProfile: locale,
  });

  return {
    text: adapted.adaptedText,
    changes: adapted.changes,
    notes,
  };
}
```

### Batch Content Validation

```typescript
import { batchComplianceCheck } from '@/lib/compliance';

async function validateCampaignContent(posts: Array<{ id: string; text: string }>) {
  const results = await batchComplianceCheck(
    posts.map(p => ({
      id: p.id,
      text: p.text,
      regionSlug: 'au',
      platform: 'facebook',
    }))
  );

  const issues = [];
  for (const [id, result] of results) {
    if (!result.passed) {
      issues.push({
        postId: id,
        violations: result.violations,
      });
    }
  }

  return issues;
}
```

## Implementation Checklist

- [x] Migration 136 with policies, locales, incidents tables
- [x] Default policy seeding (AU, US, UK, EU)
- [x] Default locale seeding (en-AU, en-US, en-GB, en-NZ, en-CA)
- [x] Policy Registry Service
- [x] Locale Profile Service
- [x] Content Compliance Checker Service
- [x] Cultural Adaptation Service
- [x] Compliance Incident Service
- [x] Truth Adapter with legal disclaimers
- [x] Integration Service for preflight/autopilot
- [x] API routes (check, incidents, policies)
- [x] ComplianceOverviewPanel component
- [x] ComplianceIncidentTable component
- [x] LocaleProfileSummary component
- [x] Compliance Dashboard page

## Future Enhancements

1. **AI-powered pattern detection** - Use LLM for context-aware compliance analysis
2. **Policy version tracking** - Track policy changes over time
3. **Multi-language support** - Extend beyond English locales
4. **Industry-specific rules** - Finance, healthcare, alcohol, gambling
5. **Auto-fix suggestions** - Propose compliant alternatives
6. **Platform API validation** - Check against actual platform APIs

## Summary

Phase 93 GCCAE provides:

- ✅ Region-aware compliance policy registry
- ✅ Platform-specific policy rules (Facebook, Instagram, etc.)
- ✅ Automated content compliance checking
- ✅ Confidence-scored pattern matching
- ✅ Cultural adaptation (spelling, tone, sensitivity)
- ✅ Locale profiles for AU/US/UK/EU/NZ/CA
- ✅ Compliance incident tracking and resolution
- ✅ Truth layer integration with legal disclaimers
- ✅ Preflight and Autopilot integration
- ✅ Founder compliance dashboard

This establishes the foundation for Unite-Hub to operate safely across multiple jurisdictions while respecting cultural differences and platform policies.
