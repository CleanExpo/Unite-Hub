# Unite-Group Ecosystem Architecture v1.1

**Status**: 📋 **SPECIFICATION**
**Date**: 2025-11-25
**Mode**: SPEC_ONLY - No auto-execution
**Safety**: Founder review required, truth layer enforced

---

## Overview

This document defines the complete **Unite-Group multi-repository ecosystem architecture**, including brand registry, cross-repository synchronization rules, and phase execution order for Unite-Hub v1.1.

**Repositories**:
1. **Unite-Group** - Central brand registry and nexus
2. **Unite-Hub** - AI-first CRM and marketing automation platform
3. **Synthex** - Marketing agency layer (powered by Unite-Hub)

---

## 1. Unite-Group Nexus - Brand Registry

**Purpose**: Central metadata hub for all Unite-Group brands

**Location**: `Unite-Group` repository

### Brand Registry (5 Brands)

#### 1. Disaster Recovery
- **Slug**: `disaster-recovery`
- **Domain**: https://www.disasterrecovery.com.au
- **Role**: Restoration and remediation industry brand
- **Positioning**:
  - Client-first, not insurer-first
  - Education around IICRC & AU Standards
  - Gateway to NRPG-verified contractors
- **Cross-Links**: → carsi, nrpg

#### 2. Synthex
- **Slug**: `synthex`
- **Domain**: https://synthex.social
- **Role**: Unite-Hub powered marketing agency
- **Positioning**:
  - Done-for-you + done-with-you marketing
  - Ethical GEO/SEO/content marketing
- **Cross-Links**: → unite-group

#### 3. Unite-Group (Nexus Brand)
- **Slug**: `unite-group`
- **Domain**: https://unite-group.in
- **Role**: Nexus brand binding all SaaS + Agency + Training products
- **Positioning**:
  - Technology + AI + Industry Operations
  - Home of Unite-Hub and NEXUS AI
- **Cross-Links**: → synthex, carsi, nrpg, disaster-recovery

#### 4. CARSI
- **Slug**: `carsi`
- **Domain**: https://carsi.com.au
- **Role**: Online learning for cleaning & restoration
- **Positioning**:
  - Training, certifications and CECs
  - Industry technical updates
- **Cross-Links**: → unite-group

#### 5. NRPG
- **Slug**: `nrpg`
- **Domain**: https://nrpg.business
- **Role**: National Restoration Professionals Group
- **Positioning**:
  - Standards & guidelines for restoration contractors
  - Independent from insurers and builders
- **Cross-Links**: → disaster-recovery, carsi

### Cross-Link Rules

```
disaster-recovery → carsi, nrpg
synthex → unite-group
nrpg → disaster-recovery, carsi
carsi → unite-group
unite-group → synthex, carsi, nrpg, disaster-recovery (hub)
```

### Safety Rules
- ✅ **No brand merging**: Brands remain distinct entities
- ✅ **No public changes without founder**: Manual approval required
- ✅ **Truth layer required**: All brand descriptions must be factual

---

## 2. Unite-Hub v1.1 Phases

**Purpose**: 8-phase implementation plan for Unite-Hub v1.1

**Phases Defined**:
1. `v1_1_01` - Founder Autonomous Operations
2. `v1_1_02` - Multi-Brand Orchestration Matrix
3. `v1_1_03` - Topic and Trend Engine ✅ **COMPLETE**
4. `v1_1_04` - Multi-Channel Builder
5. `v1_1_05` - Loyalty and Referral Engine
6. `v1_1_06` - Trial and Sandbox Mode
7. `v1_1_07` - Search Console and Analytics Integration
8. `v1_1_08` - Desktop Agent Interface Hooks

### Execution Order (Recommended)

```
Priority 1 (Foundation):
  1. v1_1_02 - Multi-Brand Orchestration Matrix (connects to brand registry)
  2. v1_1_01 - Founder Autonomous Operations (founder control layer)

Priority 2 (Intelligence):
  3. v1_1_07 - Search Console & Analytics (real data sources)
  4. v1_1_03 - Topic and Trend Engine ✅ (DONE - ready for v1_1_07 integration)

Priority 3 (Execution):
  5. v1_1_04 - Multi-Channel Builder (content distribution)
  6. v1_1_06 - Trial and Sandbox Mode (client onboarding)

Priority 4 (Growth):
  7. v1_1_05 - Loyalty and Referral Engine (retention)
  8. v1_1_08 - Desktop Agent Interface Hooks (advanced automation)
```

### Safety Rules
- ✅ **Truth layer required**: All AI-generated content validated
- ✅ **No auto-publishing**: Manual review default
- ✅ **Manual review default**: Founder approval workflow
- ✅ **Founder role required**: Sensitive operations gated

---

## 3. Synthex Agency Layer

**Purpose**: Front-end marketing agency powered by Unite-Hub engines

**Repository**: `Synthex` (separate repo)

### Architecture Rules

**Synthex is a CONSUMER, not a producer**:
- ✅ **No business logic**: Pure presentation layer
- ✅ **No engines**: Consumes from Unite-Hub
- ✅ **No migrations**: No database schema changes
- ✅ **No data manipulation**: Read-only operations

### Services Consumed from Unite-Hub

Synthex **pulls** from Unite-Hub:
1. `production_engine` - Content generation
2. `vif` (Visual Intelligence Framework) - Image generation
3. `topic_engine` - Topic discovery (v1_1_03)
4. `orchestration` - Multi-agent workflows
5. `insight_renderer` - Analytics and reporting

### Features Allowed

Synthex can implement:
- ✅ Landing pages
- ✅ Funnels
- ✅ Templates
- ✅ Brand portfolio showcase
- ✅ Agency pricing pages
- ✅ Client showcases

### Features Prohibited

Synthex **cannot** implement:
- ❌ Automated decisions
- ❌ Autonomous publishing
- ❌ Data ingestion
- ❌ Internal scheduler

### Safety Rules
- ✅ **Founder control required**: All major decisions gated
- ✅ **No claims without evidence**: Truth layer on all copy
- ✅ **Truth layer on all copy**: Factual, verifiable claims only

---

## 4. Cross-Repository Sync Rules

**Purpose**: Safe data flow between Unite-Group, Unite-Hub, and Synthex

### Data Flow Diagram

```
┌─────────────────┐
│  Unite-Group    │  (Brand Registry)
│  (Nexus)        │
└────────┬────────┘
         │ READ-ONLY
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│  Unite-Hub      │   │  Synthex        │
│  (Engine)       │──▶│  (Agency)       │
│                 │   │                 │
│  • Prod Engine  │   │  READ-ONLY      │
│  • VIF          │   │  from Unite-Hub │
│  • Topic Engine │   │                 │
│  • Orchestrator │   │                 │
└─────────────────┘   └─────────────────┘
         ▲                     │
         │                     │
         └─────────────────────┘
           WRITE-LIMITED
           (feedback, events)
```

### 1. Unite-Group → Unite-Hub

**Type**: Read-only
**Data**:
- Brand registry (5 brands)
- Positioning map
- Cross-link rules

**Method**: Secure API pull
**Frequency**: On-demand / cached

**Implementation**:
```typescript
// src/lib/integrations/brand-registry.ts
import { supabaseAdmin } from '@/lib/supabase';

interface Brand {
  slug: string;
  domain: string;
  role: string;
  positioning: string[];
  cross_links: string[];
}

export async function fetchBrandRegistry(): Promise<Brand[]> {
  // Pull from Unite-Group API or database
  const response = await fetch('https://api.unite-group.in/v1/brands');
  return response.json();
}
```

### 2. Unite-Hub → Synthex

**Type**: Read-only
**Data**:
- Draft assets (AI-generated content)
- Blueprints (campaign templates)
- Approved visuals (VIF images)

**Method**: API pull
**Frequency**: Real-time / webhooks

**Implementation**:
```typescript
// Synthex consumes Unite-Hub APIs
const response = await fetch('https://api.unite-hub.com/v1/drafts', {
  headers: {
    'Authorization': `Bearer ${SYNTHEX_API_KEY}`,
  },
});
```

### 3. Synthex → Unite-Hub

**Type**: Write-limited
**Allowed Actions**:
- Feedback on drafts
- Analytics events
- Asset requests

**Method**: Safe queue push (no direct writes)

**Implementation**:
```typescript
// Synthex pushes feedback to Unite-Hub queue
await fetch('https://api.unite-hub.com/v1/feedback', {
  method: 'POST',
  body: JSON.stringify({
    draft_id: 'xxx',
    feedback: 'Client approved with minor edits',
    event_type: 'approval',
  }),
});
```

### Safety Rules
- ✅ **No cross-repo schema changes**: Each repo owns its database
- ✅ **No circular dependencies**: One-way or limited write
- ✅ **Truth layer required**: All synced data validated

---

## 5. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal**: Brand registry + Multi-brand orchestration

1. **v1_1_02 - Multi-Brand Orchestration Matrix**
   - Create brand registry sync in Unite-Hub
   - Implement cross-link rules
   - Add brand context to all content generation
   - Files to create:
     - `src/lib/integrations/brand-registry.ts`
     - `src/lib/brand/brandRegistry.ts`
     - `src/lib/brand/brandPositioningMap.ts`
     - `src/lib/brand/brandCrossLinkingRules.ts`
     - `supabase/migrations/12X_brand_registry.sql`

2. **v1_1_01 - Founder Autonomous Operations**
   - Task library for founder workflows
   - Approval gates for sensitive operations
   - Audit trail for all founder actions
   - Files to create:
     - `src/lib/founder/founderOpsEngine.ts`
     - `src/lib/founder/founderOpsTaskLibrary.ts`
     - `src/lib/founder/founderOpsScheduler.ts`

### Phase 2: Intelligence (Weeks 3-4)
**Goal**: Real data sources for topic engine

3. **v1_1_07 - Search Console & Analytics Integration**
   - Connect real GSC API
   - Connect real Bing Webmaster API
   - DataForSEO live integration
   - Files to create:
     - `supabase/migrations/12Y_search_console_credentials.sql`
     - `src/lib/integrations/searchConsoleConfigService.ts`
     - `src/lib/integrations/bingWebmasterConfigService.ts`
     - `src/lib/integrations/analyticsSourceRegistry.ts`

4. **v1_1_03 - Topic and Trend Engine** ✅ **COMPLETE**
   - Already built with mock data
   - Ready to connect to v1_1_07 real APIs
   - No changes needed

### Phase 3: Execution (Weeks 5-6)
**Goal**: Content distribution + Trial experience

5. **v1_1_04 - Multi-Channel Builder**
   - Content distribution to multiple channels
   - Platform-specific formatting
   - Scheduling and publishing

6. **v1_1_06 - Trial and Sandbox Mode**
   - 2-week trial experience
   - Limited capability profile (25% capacity)
   - Read-only dashboards

### Phase 4: Growth (Weeks 7-8)
**Goal**: Retention + Advanced automation

7. **v1_1_05 - Loyalty and Referral Engine**
   - Points-based loyalty program
   - Referral tracking and rewards
   - Transparent rules (no misleading incentives)

8. **v1_1_08 - Desktop Agent Interface Hooks**
   - Browser automation integration
   - Feature flag required
   - Comprehensive audit trail

---

## 6. Database Architecture

### Brand Registry Table (Unite-Hub)

```sql
-- supabase/migrations/12X_brand_registry.sql
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  domain TEXT NOT NULL,
  role TEXT NOT NULL,
  positioning TEXT[] NOT NULL,
  cross_links TEXT[] NOT NULL,
  metadata JSONB DEFAULT '{}',
  synced_from TEXT DEFAULT 'unite-group-api',
  last_sync TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast slug lookups
CREATE INDEX idx_brands_slug ON brands(slug);

-- Enable RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Service role can read/write (for sync)
CREATE POLICY brands_service_role_policy ON brands
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can read
CREATE POLICY brands_read_policy ON brands
  FOR SELECT
  TO authenticated
  USING (true);
```

### Cross-Link Rules Table

```sql
CREATE TABLE IF NOT EXISTS brand_cross_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_brand_slug TEXT NOT NULL REFERENCES brands(slug),
  target_brand_slug TEXT NOT NULL REFERENCES brands(slug),
  link_type TEXT DEFAULT 'related',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_brand_slug, target_brand_slug)
);
```

---

## 7. API Specifications

### Unite-Group Brand Registry API

**Endpoint**: `GET https://api.unite-group.in/v1/brands`

**Response**:
```json
{
  "success": true,
  "brands": [
    {
      "slug": "disaster-recovery",
      "domain": "https://www.disasterrecovery.com.au",
      "role": "Restoration and remediation industry brand",
      "positioning": [
        "Client-first, not insurer-first",
        "Education around IICRC & AU Standards",
        "Gateway to NRPG-verified contractors"
      ],
      "cross_links": ["carsi", "nrpg"]
    }
  ],
  "last_updated": "2025-11-25T..."
}
```

### Unite-Hub Content API (for Synthex)

**Endpoint**: `GET https://api.unite-hub.com/v1/drafts`

**Headers**:
```
Authorization: Bearer synthex_api_key
```

**Response**:
```json
{
  "success": true,
  "drafts": [
    {
      "id": "draft_xxx",
      "brand_slug": "synthex",
      "content_type": "blog_post",
      "title": "...",
      "body": "...",
      "status": "pending_review",
      "created_at": "..."
    }
  ]
}
```

---

## 8. Safety & Security

### Truth Layer Enforcement

**All modules must validate**:
1. ✅ Brand descriptions are factual
2. ✅ Positioning statements are evidence-based
3. ✅ No misleading claims or exaggerations
4. ✅ Cross-links are mutually beneficial

**Implementation**:
```typescript
// src/lib/safety/truth-layer.ts
export function validateBrandDescription(description: string): {
  valid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check for superlatives without evidence
  if (/\b(best|leading|top|premier|world-class)\b/i.test(description)) {
    violations.push('Superlative claim requires evidence');
  }

  // Check for vague promises
  if (/\b(guaranteed|instant|effortless)\b/i.test(description)) {
    violations.push('Vague promise detected');
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
```

### Founder Control Gates

**Sensitive operations require founder approval**:
- Brand registry modifications
- Cross-link rule changes
- Public content publishing
- Schema migrations

**Implementation**:
```typescript
// src/lib/auth/founder-gates.ts
export async function requireFounderRole(userId: string): Promise<boolean> {
  const { data: user } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return user?.role === 'founder';
}
```

---

## 9. Monitoring & Observability

### Key Metrics to Track

**Brand Registry Sync**:
- Last sync timestamp
- Sync failures
- Data discrepancies

**Cross-Repo API Calls**:
- Request latency
- Error rates
- Rate limit hits

**Content Flow**:
- Unite-Hub → Synthex: Draft delivery time
- Synthex → Unite-Hub: Feedback latency
- Approval workflow duration

**Implementation**:
```typescript
// src/lib/monitoring/cross-repo-metrics.ts
import { logPerformance } from '@/lib/monitoring/autonomous-monitor';

export async function trackBrandRegistrySync(duration: number, success: boolean) {
  await logPerformance({
    metricType: 'API_REQUEST',
    operation: 'brand_registry_sync',
    durationMs: duration,
    route: '/api/integrations/brand-registry/sync',
    method: 'POST',
    statusCode: success ? 200 : 500,
    metadata: {
      source: 'unite-group-api',
    },
  });
}
```

---

## 10. Next Steps

### Immediate Actions

1. **Review this specification** with founder
2. **Confirm execution order** (recommended: v1_1_02 → v1_1_01 → v1_1_07 → ...)
3. **Approve brand registry data** (5 brands, positioning, cross-links)
4. **Decide on Synthex repository setup** (new repo or monorepo?)

### Ready to Implement

**v1_1_02 - Multi-Brand Orchestration Matrix** is ready to build:
- Brand registry sync from Unite-Group
- Cross-link rules enforcement
- Brand context in content generation
- ~400-600 lines of code
- 1-2 hours implementation time

**Should I proceed with v1_1_02 implementation?**

---

## 11. Conclusion

This document defines the complete **Unite-Group ecosystem architecture** with:
- ✅ Brand registry (5 brands with positioning and cross-links)
- ✅ Unite-Hub v1.1 phases (8 phases with execution order)
- ✅ Synthex agency layer (read-only consumer of Unite-Hub)
- ✅ Cross-repo sync rules (safe data flow)
- ✅ Safety rules (truth layer, founder gates, no auto-execution)

**Status**: SPECIFICATION_ONLY - Awaiting founder approval for implementation

**Recommended Next Phase**: v1_1_02 - Multi-Brand Orchestration Matrix

---

**Questions?** Review specifications and confirm execution order before proceeding.
