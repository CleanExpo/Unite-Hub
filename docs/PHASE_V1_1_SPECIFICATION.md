# Phase V1.1 - Founders Autonomous Agency & Growth Layer

**Status**: SPECIFICATION
**Date**: 2025-11-26
**Version**: 1.0.0
**Non-Disruptive**: Yes - All changes are additive, no removal of existing dashboards

---

## Overview

Phase V1.1 implements a **Founders Autonomous Agency & Growth Layer** that enables Phill (founder/CEO) to replace day-to-day marketing operations with an autonomous but supervised agency assistant across ALL brands (Disaster Recovery, Synthex, Unite-Group, CARSI, NRPG).

**Core Constraint**: Founder is the single point of truth. All autonomous systems provide recommendations and execute only within founder-approved scopes.

---

## Phase V1.1 Architecture

### Subphase Dependencies

```
v1_1_02 (Brand Matrix)
    ↓
v1_1_01 (Founder Ops Hub) + v1_1_03 (Topic & Trends)
    ↓
v1_1_04 (Multi-Channel Blueprint Builder)
    ↓
v1_1_06 (Trial Refinement) + v1_1_05 (Loyalty/Referrals)
    ↓
v1_1_07 (Search Console Integration)
    ↓
v1_1_08 (Desktop Agent Hooks)
```

### Recommended Rollout Order

1. **v1_1_02** - Brand Matrix Foundation (brands, positioning, cross-linking rules)
2. **v1_1_01** - Founder Ops Hub (centralized control, task library, execution queue)
3. **v1_1_03** - Topic & Trend Discovery (data-driven topic identification)
4. **v1_1_04** - Multi-Channel Blueprint Builder (topic → multi-channel campaigns)
5. **v1_1_06** - Trial Experience Refinement (14-day sandbox with real value)
6. **v1_1_05** - Loyalty & Referral Programs (incentivize advocacy)
7. **v1_1_07** - Search Console & Analytics Integration (data source consolidation)
8. **v1_1_08** - Desktop Agent Hooks (future extensibility, optional)

---

## Subphase Specifications

### v1_1_02: Multi-Brand Orchestration Matrix

**Goal**: Give the system a clear understanding of all Phill's brands and how they interrelate.

**Brands**:

| Slug | Domain | Role | Primary Positioning |
|------|--------|------|---------------------|
| disaster-recovery | https://www.disasterrecovery.com.au | Industry 'Who Do I Call' brand | Client-first, education, IICRC standards, consumer rights |
| synthex | https://synthex.social | Done-for-you + done-with-you marketing agency | Ethical performance-driven SEO, GEO, content using Unite-Hub |
| unite-group | https://unite-group.in | Umbrella/Nexus brand for SaaS, agency, training | Technology + AI + Industry Ops combined |
| carsi | https://carsi.com.au | Cleaning & Restoration Science Institute | Online learning, courses, CECs, technical education |
| nrpg | https://nrpg.business | National Restoration Professionals Group | Contractor vetting, standards, guidelines, industry verification |

**Deliverables**:
- `src/lib/brands/brandRegistry.ts` - Brand definitions
- `src/lib/brands/brandPositioningMap.ts` - Positioning & messaging per brand
- `src/lib/brands/brandCrossLinkingRules.ts` - When to link between brands
- `supabase/migrations/238_brand_metadata.sql` - Database schema
- `src/app/founder/brand-matrix/page.tsx` - Founder brand dashboard

**Safety Constraints**:
- No cross-brand confusion in public output
- No unapproved repositioning
- Audit trail for all brand-related changes

---

### v1_1_01: Founder Autonomous Operations Layer

**Goal**: Replace Claire's day-to-day marketing operations with an autonomous but supervised agency assistant.

**Deliverables**:
- `src/lib/founderOps/founderOpsEngine.ts` - Core orchestration logic
- `src/lib/founderOps/founderOpsTaskLibrary.ts` - Task archetypes (posts, carousels, blogs, emails, ads, videos, branding)
- `src/lib/founderOps/founderOpsScheduler.ts` - Scheduling and queue management
- `src/app/founder/dashboard/ops-hub/page.tsx` - Ops Hub UI
- `src/ui/components/founder/FounderOpsTaskBoard.tsx` - Task management
- `src/ui/components/founder/FounderOpsQueuePanel.tsx` - Execution queue with pause/approve/defer

**Features**:
- Single Ops Hub view for ALL brands' scheduled/in-progress tasks
- Structured task library (posts, carousels, blogs, emails, ads, video outlines, branding variations)
- Per-brand task assignment with priority and deadline
- Daily/weekly execution queue with manual controls
- Integration with existing AI (NEXUS, VIF, storytelling, production engines)
- All actions logged to Living Intelligence Archive

**Safety**:
- Manual review by default
- No auto-publishing without opt-in
- Ops Hub requires founder role
- Full audit trail

---

### v1_1_03: Self-Smart Topic & Trend Engine

**Goal**: Enable proactive topic discovery using real analytics and search data.

**Data Sources**:
- Google Search Console (per verified property)
- Bing Webmaster Tools (per site)
- DataForSEO / existing ranking bridges
- Existing success and performance engines
- Curated industry event feeds (AU restoration, cleaning, IICRC, NRPG, CARSI events)

**Deliverables**:
- `src/lib/intel/topicDiscoveryEngine.ts`
- `src/lib/intel/trendSignalsBridge.ts`
- `src/lib/intel/searchConsoleBridge.ts`
- `src/lib/intel/bingWebmasterBridge.ts`
- `src/lib/intel/industryEventsScanner.ts`
- `src/ui/components/founder/TopicRadarPanel.tsx` - Topic opportunities dashboard
- Weekly list of topic opportunities with impact/effort scoring

**Safety**:
- Read-only mode (no API changes)
- Founder approval required for public copy

---

### v1_1_04: Continuous Multi-Channel Content Builder

**Goal**: Turn topics into structured, multi-channel campaign blueprints per brand.

**Deliverables**:
- `src/lib/campaigns/multiChannelBlueprintEngine.ts`
- `src/lib/campaigns/channelPlaybooks.ts` (platform-specific best practices)
- `src/ui/components/founder/CampaignBlueprintCard.tsx`
- Blueprint generation for: website content, blog hubs, social posts (FB, LinkedIn, TikTok, Instagram, YouTube, Podcasts), email sequences

**Features**:
- Topic + brand → structured multi-channel blueprint
- Uses VIF for visual/video concept slots (draft mode)
- Promote blueprint to production job with cost/time implications
- Disaster Recovery specific educational flows (client empowerment, standards, finance, NRPG vetting)

**Safety**:
- Truth layer on all claims
- No results claims without data

---

### v1_1_05: Loyalty & Referral Program Engine

**Goal**: Unified loyalty system for reviews, video reviews, and referrals across SaaS and agency.

**Earning Rules**:
- Text review: 1X credits (authentic review required)
- Video review: 2X credits (authentic, disclose if AI-assisted)
- Referral converted: 3X credits (referred account becomes paying client)

**Redemption**:
- Credits as discounts on future invoices/upgrades
- NOT convertible to cash
- Hidden 'golden key' rewards (e.g., random bonus on 10th referral)

**Deliverables**:
- `supabase/migrations/12X_loyalty_program.sql`
- `src/lib/loyalty/loyaltyEngine.ts`
- `src/lib/loyalty/referralEngine.ts`
- `src/ui/components/client/LoyaltyBalanceCard.tsx`
- `src/ui/components/client/ReferralInvitePanel.tsx`

**Safety**:
- No misleading incentives
- All terms visible to client
- No undisclosed testimonials

---

### v1_1_06: Two-Week Trial & Sandbox Experience

**Goal**: Refine 14-day trial to a transparent, limited-capacity sandbox with real value and strong upgrade path.

**Trial Capabilities** (25% of full system):
- Initial website audit
- Initial plan/roadmap draft
- Persona/brand intake and draft profile
- Limited VIF usage (preview mode)
- Read-only dashboards for some engines

**Trial Limitations**:
- No high-volume production jobs
- No automatic weekly campaigns
- No full multi-brand orchestration
- No full automation

**Deliverables**:
- `src/lib/trial/trialCapabilityProfile.ts`
- `src/lib/trial/trialExperienceEngine.ts`
- `src/ui/components/client/TrialCapabilityBanner.tsx`
- `src/ui/components/client/TrialUpgradePrompt.tsx`

**Features**:
- Clear trial mode indication in dashboard header
- Trial produces real, useful artefacts (1 audit, 1 plan, 1 persona profile)
- Honest upgrade prompts (not pushy)
- Reference 90-day activation program
- Apply loyalty/referral credits to first paid period

**Safety**:
- No hidden paywalls inside trial
- No auto-conversion without consent

---

### v1_1_07: Search Console & Analytics Integration

**Goal**: Wire the system to use Google Search Console, Bing Webmaster, and analytics consistently.

**Deliverables**:
- `supabase/migrations/12Y_search_console_credentials.sql`
- `src/lib/integrations/searchConsoleConfigService.ts`
- `src/lib/integrations/bingWebmasterConfigService.ts`
- `src/lib/integrations/analyticsSourceRegistry.ts`
- Per-brand Search Console/Bing property configuration
- Connection status per brand (connected, partial, error)
- Preferred data inputs for ranking, impressions, clicks, query discovery

**Safety**:
- Read-only mode (no writing to Search Console)
- No auto-property creation

---

### v1_1_08: Desktop Agent & Interface Control Hooks

**Goal**: Prepare the system for future integration with external agentic tools without depending on them.

**Deliverables**:
- `src/lib/agents/desktopAgentBridge.ts`
- `src/lib/agents/desktopAgentCapabilities.ts` - Contract for external agents
- `src/lib/agents/desktopAgentSafetyPolicy.ts`

**Features**:
- Generic interface for future desktop/OS-level agent
- Feature flags (no default activation)
- Strict safety rules: no destructive actions, no credential harvesting, founder-approval-only for powerful ops
- Audit all desktop tasks

**Safety**:
- Pure abstraction layer (main SaaS works perfectly without desktop agent)
- Feature flag required
- No default activation
- Audit all desktop tasks

---

## Global Safety Constraints

```
✓ no_fake_testimonials
✓ no_fake_results
✓ no_fake_scarcity
✓ no_undisclosed_ai_usage
✓ no_auto_infrastructure_changes
✓ founder_approval_required_for_public_changes
✓ truth_layer_enforced
```

---

## Completion Definition

**Version 1.1 is considered complete when:**

Phill can:
1. Log into Unite-Hub
2. Open the Founder Ops Hub
3. See all brands in the Brand Matrix
4. Review AI-proposed topics and multi-channel blueprints
5. Trigger production jobs
6. Benefit from a working loyalty/referral system
7. Rely on truthful, analytics-driven decisions
8. Have full override and approval control

**All without needing Claire for day-to-day marketing execution.**

---

## Dependencies

- ✅ Phase 4 Complete (Autonomous Execution Engine)
- ✅ Phase 3 Complete (Hierarchical Strategy System)
- ✅ All existing dashboards preserved (non-disruptive)

---

## Success Metrics

- Founder autonomy: Tasks completed by founder without delegation
- Decision quality: Decisions backed by real data (Search Console, analytics)
- Team focus: Claire freed from operations, can focus on strategic work
- Growth: New content production volume increases 2-3x
- Brand coherence: Cross-brand confusion incidents = 0

---

**Last Updated**: 2025-11-26
**Author**: Claude Code
**Status**: Ready for Implementation (Phase 5)
