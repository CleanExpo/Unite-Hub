# Phase 0 – Synthex Integration Blueprint

**Status**: 🚀 **IN PROGRESS**
**Date Started**: 2025-11-26
**Version**: 0.1-MVP

---

## Executive Summary

Phase 0 transforms the Unite-Hub AGI/agent stack (Phases 5-13) into **Synthex.social**, a multi-tenant SaaS platform for small/medium businesses (SMBs) across trades, restoration, non-profits, retail, services, and more.

**Core Value Proposition**:
- Unified AI automation platform for 6+ business domains
- <AUD $1/day per business for AGI usage
- Early adopter pricing: 50% off (limited) → 25% off (early growth) → Standard
- Multi-industry presets with templates and best practices

---

## Architecture Overview

### Synthex Platform Stack

```
┌─────────────────────────────────────────────────────────────┐
│                  Synthex.social Frontend                    │
│  (Next.js/React: onboarding, dashboard, settings)           │
├─────────────────────────────────────────────────────────────┤
│                    Synthex Core Services                     │
│  ├─ synthexOfferEngine (pricing & discounts)                │
│  ├─ synthexJobRouter (job queuing & routing)                │
│  ├─ synthexAgiBridge (AGI agent integration)                │
│  └─ synthexUsageTracker (analytics & optimization)          │
├─────────────────────────────────────────────────────────────┤
│              AGI/Agent Stack (Phases 5-13)                  │
│  ├─ Email Agent (campaigns, sequences)                      │
│  ├─ Content Agent (social, websites, landing pages)         │
│  ├─ Research Agent (SEO, competitor analysis)               │
│  ├─ Analysis Agent (reporting, insights)                    │
│  ├─ Scheduling Agent (content calendar management)          │
│  ├─ Coordination Agent (workflow orchestration)             │
│  ├─ Business Brain (strategic analysis)                     │
│  ├─ Parallel Phill (conversational AI)                      │
│  ├─ Dialogue Layer (Phase 12)                               │
│  └─ Real-World Context Layer (Phase 13)                     │
├─────────────────────────────────────────────────────────────┤
│         Supabase PostgreSQL + Cloud Services                │
│  (Tenants, brands, jobs, results, usage logs, RLS)          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Status

### ✅ Completed (3/8 modules)

#### 1. **254_synthex_core_structure.sql** (450 lines)
Database foundation with 7 tables:
- `synthex_tenants` - Business accounts
- `synthex_brands` - Brands/domains per tenant
- `synthex_plan_subscriptions` - Subscription tracking
- `synthex_offer_counters` - Discount slot management
- `synthex_project_jobs` - Async job queue
- `synthex_job_results` - Job output storage
- `synthex_usage_logs` - Analytics

**Features**:
- 35+ indexes for optimal query performance
- RLS policies for complete tenant isolation
- Offer counters pre-seeded (50 Early Founders, 200 Growth Wave, unlimited Standard)
- Job type validation (7 job types supported)

**Status**: ✅ Ready for deployment

#### 2. **synthexOfferEngine.ts** (650 lines)
Comprehensive pricing and offer management:

**Plans** (3 tiers):
- Launch: $49/mo (2 brands, 8 jobs)
- Growth: $129/mo (5 brands, 25 jobs)
- Scale: $299/mo (unlimited brands, unlimited jobs)

**Discount Tiers**:
- Early Founders: 50% off (50 slots) - Lifetime
- Growth Wave: 25% off (200 slots) - First year
- Standard: Full price (unlimited)

**Key Functions**:
- `calculateEffectivePrice()` - Get price after discount
- `getCurrentOfferTier()` - Check best available tier
- `consumeOfferSlot()` - Increment counter when subscription created
- `getPricingSummary()` - Display all plans with current best offer
- `getOfferBanner()` - UI badge data

**Industry Presets** (8 industries):
- Trades & Contracting
- Restoration & Cleaning
- Non-Profits & Charities
- Retail & E-Commerce
- Professional Services
- Education & Training
- Health & Wellness
- Other (custom)

**Status**: ✅ Ready for integration

#### 3. **synthexJobRouter.ts** (500 lines)
Job routing and management system:

**Supported Job Types** (7):
- `initial_launch_pack` → Coordination Agent (120 min)
- `content_batch` → Content Agent (30 min)
- `seo_launch` → Research Agent (60 min)
- `geo_pages` → Content Agent (45 min)
- `review_campaign` → Content Agent (20 min)
- `monthly_report` → Analysis Agent (40 min)
- `email_sequence` → Content Agent (25 min)

**Key Functions**:
- `createJob()` - Create and validate job
- `getJobsForTenant()` - Retrieve with filters
- `getPendingJobs()` - Queue monitoring
- `routeJobToAgent()` - Map to appropriate agent
- `storeJobResult()` - Save agent outputs
- `getJobStatistics()` - Analytics per tenant
- `getGlobalJobStatistics()` - System-wide metrics

**Features**:
- Automatic agent assignment based on job type
- Payload validation against required fields
- Result type tracking (content_generated, seo_pages, email_sequence, analysis_report, etc.)
- Error handling and retry support
- Job statistics and analytics

**Status**: ✅ Ready for integration

### ⏳ In Progress (5/8 modules)

#### 4. **synthexAgiBridge.ts** (PENDING)
Unified bridge between Synthex and AGI agents

**Responsibilities**:
- Convert Synthex job payloads to AGI-compatible format
- Call appropriate agents (emailAgent, contentAgent, etc.)
- Convert agent outputs back to Synthex result format
- Handle errors gracefully without crashing
- Pass brand positioning and risk envelopes from AGI Governor
- Log all agent calls for debugging/analytics

**Planned Functions**:
- `callContentAgent(jobPayload)` - Content generation
- `callResearchAgent(jobPayload)` - SEO/competitor research
- `callAnalysisAgent(jobPayload)` - Reporting and insights
- `callCoordinationAgent(jobPayload)` - Multi-step workflows
- `callBusinessBrain(jobPayload)` - Strategic analysis
- All with error handling and logging

#### 5. **src/app/synthex/onboarding/page.tsx** (PENDING)
Multi-step onboarding for SMB owners

**Steps**:
1. Welcome + industry selection (with examples)
2. Plan selection (Launch/Growth/Scale with pricing)
3. Offer badge display (Early Founders 50% / Growth Wave 25% / Standard)
4. Brand setup (name, domain, tone)
5. Review + confirmation
6. Create tenant → brand → subscription → initial_launch_pack job

**Features**:
- Industry-specific examples and recommendations
- Real-time pricing calculation with discount
- Progress indicator
- Error recovery
- Auto-redirect to dashboard on completion

#### 6. **src/app/synthex/dashboard/page.tsx** (PENDING)
Client-facing dashboard

**Tabs/Sections**:
- **Overview**: Current plan, remaining discount marker, job queue status
- **Content**: Latest generated posts, blog articles, emails
- **Jobs**: Active jobs with status, estimated completion
- **Results**: History of generated content with dates
- **Settings**: Brand info, domain, reconnect Google/social accounts

**Features**:
- Quick stats (credits used, jobs remaining, next billing)
- "Launch Next Campaign" button
- Job history with filters
- Result preview/export

#### 7. **src/app/founder/synthex-portfolio/page.tsx** (PENDING)
Founder/operator dashboard

**Views**:
- All Synthex tenants with plan and usage
- Health scores per tenant (engagement, feature usage, churn risk)
- Optimization recommendations from AGI
- Manual controls for experiments
- Bulk operations (email, feature flags)

**Features**:
- Tenant analytics
- Churn prediction
- Suggested actions from Optimization Layer
- A/B test management

#### 8. **PHASE_0_COMPLETE_DOCUMENTATION.md** (PENDING)
Comprehensive implementation guide

---

## Data Models

### synthex_tenants
```sql
id (UUID)
owner_user_id → auth.users
business_name (TEXT)
industry (trades | restoration | non_profit | retail | services | education | health | other)
region (au | us | uk | eu | other)
website_url (TEXT)
status (active | trial | suspended | churned)
subscription_id → synthex_plan_subscriptions
created_at, updated_at (TIMESTAMPTZ)
```

### synthex_brands
```sql
id (UUID)
tenant_id → synthex_tenants
brand_name (TEXT)
brand_slug (TEXT, unique per tenant)
primary_domain (TEXT)
primary_platform (website | facebook | instagram | linkedin | other)
tagline (TEXT)
value_proposition (TEXT)
target_audience (TEXT)
brand_color_primary, brand_color_secondary (hex)
tone_voice (formal | casual | friendly | professional)
status (active | inactive | archived)
created_at, updated_at (TIMESTAMPTZ)
```

### synthex_plan_subscriptions
```sql
id (UUID)
tenant_id → synthex_tenants
plan_code (launch | growth | scale)
offer_tier (early_founders | growth_wave | standard)
effective_price_aud (NUMERIC)
base_price_aud (NUMERIC)
discount_percentage (0-100)
billing_cycle (monthly | annual)
billing_status (active | paused | cancelled)
started_at, renews_at, cancelled_at (TIMESTAMPTZ)
created_at, updated_at (TIMESTAMPTZ)
```

### synthex_offer_counters
```sql
id (UUID)
counter_key (early_founders_50 | growth_wave_25 | standard_full)
label (TEXT)
tier (early_founders | growth_wave | standard)
limit_count (INTEGER, -1 = unlimited)
consumed (INTEGER)
created_at, updated_at (TIMESTAMPTZ)
```

### synthex_project_jobs
```sql
id (UUID)
tenant_id → synthex_tenants
brand_id → synthex_brands (nullable)
job_type (initial_launch_pack | content_batch | seo_launch | geo_pages | review_campaign | monthly_report | email_sequence)
payload_json (JSONB)
status (pending | queued | running | completed | failed | cancelled)
assigned_agent (TEXT)
error_message (TEXT)
created_at, started_at, completed_at (TIMESTAMPTZ)
```

### synthex_job_results
```sql
id (UUID)
job_id → synthex_project_jobs
result_type (content_generated | seo_pages | email_sequence | analysis_report | social_posts | review_campaigns | error)
result_json (JSONB)
error_json (JSONB, nullable)
created_at (TIMESTAMPTZ)
```

### synthex_usage_logs
```sql
id (UUID)
tenant_id → synthex_tenants
event_type (job_created | result_viewed | content_published | page_visited | setting_changed | brand_created)
feature (TEXT)
metadata_json (JSONB)
created_at (TIMESTAMPTZ)
```

---

## Offer Management Strategy

### Offer Counters (seeded at deployment)
1. **early_founders_50** (50 slots)
   - Discount: 50% lifetime
   - Target: First-mover founders
   - Lifetime benefit

2. **growth_wave_25** (200 slots)
   - Discount: 25% first year
   - Target: Early growth phase
   - Annual renewal at full price

3. **standard_full** (unlimited)
   - Discount: None
   - Always available

### Pricing Examples (Launch Plan @ $49/mo base)
- Early Founder: $24.50/mo (50% off)
- Growth Wave: $36.75/mo (25% off)
- Standard: $49/mo (no discount)

### Annual Savings Examples (Growth Plan @ $129/mo base)
- Early Founder: $129×12 = $1,548/year (saves $774/year forever)
- Growth Wave: $129×0.75×12 = $1,161/year (saves $387 first year only)
- Standard: $129×12 = $1,548/year (no savings)

---

## Integration with AGI Stack

### Job → Agent Routing Matrix

| Job Type | Agent | Context Passed | Expected Outputs |
|----------|-------|-----------------|------------------|
| initial_launch_pack | Coordination Agent | Brand + industry preset | Content (3), Social (5), Email (1) |
| content_batch | Content Agent | Brand + content types | Blog posts, social posts, emails |
| seo_launch | Research Agent | Domain + target keywords | SEO pages, optimization guide |
| geo_pages | Content Agent | Service name + locations | Geo-specific landing pages |
| review_campaign | Content Agent | Review platforms | Email sequence + SMS templates |
| monthly_report | Analysis Agent | Month + metrics | Analytics report + recommendations |
| email_sequence | Content Agent | Sequence type + count | Email templates ready to send |

### Agent Payload Format
```typescript
{
  jobId: string;
  jobType: string;
  tenantId: string;
  tenant: {
    businessName: string;
    industry: string;
    region: string;
  };
  brand?: {
    brandName: string;
    primaryDomain: string;
    primaryPlatform: string;
    tagline: string;
    valueProposition: string;
    targetAudience: string;
    toneVoice: string;
  };
  // ... job-specific fields from payload_json
}
```

---

## Security & Isolation

### Multi-Tenancy Guarantees
- **Row-Level Security (RLS)**: Enforced at Supabase database level
- **Owner-Scoped Access**: All tables filter by `owner_user_id`
- **Tenant Isolation**: Brands, jobs, results scoped to tenant_id
- **API Validation**: All endpoints verify user owns requested tenant

### Data Privacy
- **Brand Positioning**: Stored in plaintext (no sensitive data)
- **Job Results**: Stored as JSON (can include API keys in future—requires encryption)
- **Usage Logs**: Event-based only (no raw content logging)

### Cost Control
- **Daily Budget Enforcement**: AUD 1/day per tenant
- **Job Limits Per Plan**: Enforcement in quotaChecker
- **Offer Counter Limits**: Atomic consumption prevents overselling

---

## Success Criteria

### Phase 0 MVP Success
- ✅ Database migration applies cleanly
- ✅ Offer engine correctly calculates prices and applies discounts
- ✅ Job router successfully queues jobs for each agent type
- ✅ Non-technical SMB owner can complete onboarding
- ✅ System handles 10+ concurrent tenants without issues
- ✅ All offer counters respected (no overselling)
- ✅ RLS prevents cross-tenant data leakage

### Deployment Readiness Checklist
- [ ] All 7 modules complete and tested
- [ ] Database migration applied to production
- [ ] Offer counters seeded correctly
- [ ] Onboarding → first job creation works end-to-end
- [ ] synthexAgiBridge integrated with ≥2 agents
- [ ] Dashboard displays real job results
- [ ] Usage tracking and analytics working
- [ ] Load testing with 50+ concurrent jobs

---

## Timeline & Effort Estimates

| Module | Effort | Status |
|--------|--------|--------|
| Database Migration | 2h | ✅ Complete |
| Offer Engine | 4h | ✅ Complete |
| Job Router | 3h | ✅ Complete |
| AGI Bridge | 4-6h | ⏳ Pending |
| Onboarding UI | 6-8h | ⏳ Pending |
| Dashboard UI | 4-6h | ⏳ Pending |
| Founder Portfolio | 3-4h | ⏳ Pending |
| Documentation | 2-3h | ⏳ Pending |
| **Total** | **28-35h** | **42% Complete** |

---

## Next Steps (Immediate)

1. **Create synthexAgiBridge.ts** (4-6 hours)
   - Implement agent callers for content, research, analysis agents
   - Add error handling and logging
   - Test with mock agent responses

2. **Create onboarding page** (6-8 hours)
   - 5-step flow with industry/plan/brand setup
   - Pricing calculation and offer badge
   - Auto-create job on completion

3. **Create dashboard page** (4-6 hours)
   - Display current plan and usage
   - Show job history and results
   - "Launch Campaign" button

4. **Complete testing** (4-6 hours)
   - End-to-end onboarding → job → result flow
   - Multi-tenant isolation verification
   - Offer counter accuracy testing

5. **Deploy to production** (2-4 hours)
   - Run database migration
   - Seed offer counters
   - Verify all APIs working

---

## Future Enhancements (Phase 0.2+)

- [ ] Email verification for tenant owner
- [ ] Team members (add collaborators)
- [ ] Custom workflows (user-defined job chains)
- [ ] Webhook support (integrate with external tools)
- [ ] Advanced analytics dashboard (Founder view)
- [ ] Stripe/payment integration
- [ ] White-label support
- [ ] API for custom integrations
- [ ] Mobile app (React Native)

---

## Key Files Created

```
supabase/migrations/
  └─ 254_synthex_core_structure.sql (450 lines)

src/lib/synthex/
  ├─ synthexOfferEngine.ts (650 lines)
  ├─ synthexJobRouter.ts (500 lines)
  ├─ synthexAgiBridge.ts (PENDING)
  └─ synthexUsageTracker.ts (PLANNED)

src/app/synthex/
  ├─ onboarding/page.tsx (PENDING)
  ├─ dashboard/page.tsx (PENDING)
  ├─ settings/page.tsx (PLANNED)
  └─ projects/page.tsx (PLANNED)

src/app/founder/
  └─ synthex-portfolio/page.tsx (PENDING)

docs/
  └─ PHASE_0_SYNTHEX_BLUEPRINT.md (THIS FILE)
```

---

## Appendix: Industry Presets Quick Reference

### Trades & Contracting
- **Base Plan**: Launch
- **Content**: Service pages, before/after, testimonials
- **SEO Keywords**: "[service] near me", "[service] [suburb]"
- **Social**: Instagram, Facebook, YouTube

### Restoration & Cleaning
- **Base Plan**: Launch
- **Content**: Emergency response, process, case studies
- **SEO Keywords**: "[service] [suburb]", "emergency [service]"
- **Social**: Facebook, Instagram, Google Business

### Non-Profits & Charities
- **Base Plan**: Launch
- **Content**: Impact stories, volunteer recruitment
- **SEO Keywords**: "[cause] [location]", "volunteer [cause]"
- **Social**: Facebook, Instagram, LinkedIn, YouTube

### Retail & E-Commerce
- **Base Plan**: Growth
- **Content**: Product showcases, seasonal campaigns
- **SEO Keywords**: "[product] online", "[product] [location]"
- **Social**: Instagram, Facebook, TikTok, Pinterest

### Professional Services
- **Base Plan**: Growth
- **Content**: Thought leadership, case studies
- **SEO Keywords**: "[service] consultant", "[expertise] advice"
- **Social**: LinkedIn, Facebook, YouTube

---

**Document Version**: 0.1-MVP
**Last Updated**: 2025-11-26
**Status**: Active Development
