# Unite-Hub + Synthex Gap Audit

**Phase**: A1 - Discovery & Gap Analysis
**Generated**: 2025-12-06
**Auditor**: Claude Code (Opus 4.5)
**Status**: Analysis Complete

---

## 1. Overview

Unite-Hub + Synthex is an **AI-first CRM and marketing automation platform** with a polished marketing homepage and significant backend infrastructure. However, the gap between the "sales promise" on the homepage and the actual product functionality is substantial.

### Current State Summary

| Dimension | Assessment | Notes |
|-----------|------------|-------|
| **Marketing Site** | Production-ready | Homepage, pricing, features pages are polished |
| **Authentication** | Functional | Email/password + Google OAuth working |
| **Backend/API** | 75% complete | 100+ API routes exist, most functional |
| **Synthex Client Portal** | 10% complete | 1 of 10 planned pages exists |
| **Unite-Hub Dashboard** | 60% complete | Many pages exist but some are placeholders |
| **Agent Architecture** | Well-designed | 28 skills defined, CLI-accessible, not UI-surfaced |
| **Onboarding** | Partially complete | Synthex onboarding exists, but no post-onboarding flow |

### Critical Gap

**The primary gap is the "Synthex Client Portal"** - the product that paying customers would use after signing up. The marketing site promises a full AI marketing automation platform, but the actual client-facing product is largely a shell.

---

## 2. Definition of "Production-Ready Unite-Hub + Synthex"

For Unite-Hub + Synthex to be a working SaaS (not a placeholder), a real user must be able to:

### End-User Onboarding
- Sign up via Google OAuth or email/password
- Complete the 4-step Synthex onboarding flow (business profile, plan selection, brand setup, confirmation)
- Land in a functional dashboard with real data
- Connect their business assets (website, social accounts, email)

### Core Value Loop
1. **Connect**: Link website, Gmail, and social media accounts
2. **Analyze**: AI analyzes website, competition, and SEO opportunities
3. **Generate**: AI creates content (social posts, blog articles, email sequences, ad copy)
4. **Approve**: User reviews and approves generated content
5. **Deploy**: Content is scheduled/published to connected platforms
6. **Report**: User sees analytics on content performance

### Synthex Marketing/Automation Loop
- Access a dashboard showing business health metrics
- View and manage AI-generated content in a content library
- Run SEO audits and view SEO reports
- Manage email campaigns (drip sequences)
- Schedule and publish social media content
- Track campaign performance and ROI

### Admin/Founder Control
- View all client organizations
- Access system health metrics
- Override or assist with client accounts
- Monitor AI usage and costs

### Agent-Powered Automations
- Email Agent processes incoming emails automatically
- Content Agent generates personalized content for warm leads
- SEO Agent runs scheduled audits
- Social Agent schedules and posts content
- All automations are visible and controllable from the UI

---

## 3. UX & Navigation Gaps

### 3.1 Synthex Client Portal - CRITICAL

The Synthex layout (`src/app/(synthex)/layout.tsx`) defines **10 navigation items**, but only **1 page exists**:

| Navigation Item | Route | Status |
|-----------------|-------|--------|
| Home | `/synthex/dashboard` | **MISSING** (layout redirects here but no page) |
| Workspace | `/synthex/workspace` | **MISSING** |
| My Ideas | `/synthex/ideas` | **MISSING** |
| Projects | `/synthex/projects` | **MISSING** |
| Campaigns | `/synthex/campaigns` | **MISSING** |
| Analytics | `/synthex/analytics` | **MISSING** |
| SEO Reports | `/synthex/seo` | **MISSING** |
| Content Library | `/synthex/content` | **MISSING** |
| Digital Vault | `/synthex/vault` | **MISSING** |
| AI Assistant | `/synthex/assistant` | **MISSING** |

**The only existing page**: `src/app/(synthex)/client-dashboard/page.tsx` - a basic placeholder with static "0" values.

**Impact**: Users who complete onboarding and land in the Synthex portal have nowhere to go. This is a **show-stopper** for any paying customer.

### 3.2 Missing Marketing Pages

| Page | Linked From | Status |
|------|-------------|--------|
| `/contact` | Homepage footer, pricing, about | **MISSING** |
| `/blog/:slug` | Blog index page | **MISSING** (no dynamic route) |
| `/forgot-password` | Login page | **MISSING** |
| `/register` | Login page | Exists but duplicates `/signup` |
| `/privacy` | Homepage footer | **UNKNOWN** - needs verification |
| `/terms` | Homepage footer | **UNKNOWN** - needs verification |
| `/cookies` | Homepage footer | **UNKNOWN** - needs verification |
| `/careers` | About page | Exists at `(marketing)/careers` |

### 3.3 Dashboard Pages with Placeholders

Based on grep for "coming soon", "placeholder", "TODO", "FIXME":

| Page | Issue |
|------|-------|
| `dashboard/vault/page.tsx` | Contains placeholder/TODO |
| `dashboard/memory/page.tsx` | Contains placeholder/TODO |
| `dashboard/component-library/page.tsx` | Contains placeholder/TODO |
| `dashboard/marketplace/page.tsx` | Contains placeholder/TODO |
| `dashboard/campaigns/page.tsx` | Contains placeholder/TODO |
| `dashboard/brief/page.tsx` | Contains placeholder/TODO |
| `synthex/onboarding/page.tsx` | Contains TODO comments |
| Multiple AIDO pages | Various TODO/placeholder states |

### 3.4 Navigation Dead Ends

- Homepage "Start Free Trial" and "Start Trial" buttons link to `/login`, which works
- After login, user is redirected to `/` which should route based on role - but role-based routing may not be configured
- Synthex onboarding redirects to `/synthex/dashboard` on completion - which 404s

---

## 4. Functional & Workflow Gaps

### 4.1 Complete User Journeys - BROKEN

**Scenario 1: New Customer Signs Up**
1. User visits homepage - Works
2. Clicks "Start Free Trial" - Redirects to /login - Works
3. Creates account with Google OAuth - Works
4. Redirected to... where? - **UNCLEAR** (should be onboarding)
5. Completes onboarding - Works (at /synthex/onboarding)
6. Lands in dashboard - **BROKEN** (404 or placeholder)

**Scenario 2: Returning Customer Logs In**
1. User visits /login - Works
2. Signs in - Works
3. Redirected to / - Works
4. Should route to Synthex portal - **LIKELY BROKEN** (no functioning portal)

### 4.2 Email Integration Flow

- Gmail OAuth authorization exists (`/api/email/oauth/authorize`)
- Gmail callback exists (`/api/email/oauth/callback`)
- Email sync API exists (`/api/email/sync`)
- **Gap**: No UI to trigger Gmail connection in Synthex portal
- **Gap**: No UI to view synced emails in Synthex portal

### 4.3 Content Generation Flow

- Content agent exists (`scripts/run-content-agent.mjs`)
- Content API exists (`/api/content/generate`)
- **Gap**: No UI to trigger content generation
- **Gap**: No UI to view/approve generated content (except in Dashboard overview for internal use)

### 4.4 Campaign Management

- Drip campaigns API exists (`/api/campaigns/drip`)
- Campaign blueprints API exists (`/api/campaigns/blueprints`)
- **Gap**: Synthex portal has no campaigns page
- **Gap**: No end-to-end flow for creating and deploying campaigns

### 4.5 SEO & Analytics

- SEO analysis APIs exist (`/api/synthex/seo/analyze`, `/api/synthex/seo/analyses`)
- Google Analytics sync exists (`/api/founder/synthex/sync-ga4`)
- Search Console sync exists (`/api/founder/synthex/sync-gsc`)
- **Gap**: Synthex portal has no SEO reports page
- **Gap**: Synthex portal has no analytics dashboard

---

## 5. Synthex-Specific Gaps

### 5.1 What Synthex IS Today

- A marketing landing page at `synthex.social` (served from `/` route)
- A 4-step onboarding flow at `/synthex/onboarding`
- A layout with navigation (but no content)
- Backend APIs for offers, billing, tenants, SEO, video, visual generation
- Offer/pricing engine (`src/lib/synthex/synthexOfferEngine.ts`)

### 5.2 What Synthex Should Be (Per Marketing Copy)

From the homepage:

1. **"AI Diagnoses Your Business"** - Implies website audit, competitor analysis, opportunity identification
2. **"AI Generates Your Strategy"** - Implies content generation, campaign planning
3. **"Launch & Monitor"** - Implies scheduling, deployment, real-time analytics

From the pricing page features:

- Website audits (2/20/100 per month by tier)
- AI tokens (20K/250K/2M per month by tier)
- Email campaigns
- Drip campaigns
- A/B testing
- API access
- White label options

### 5.3 Synthex Pages That Must Be Created

| Priority | Page | Description |
|----------|------|-------------|
| P0 | `/synthex/dashboard` | Main dashboard with KPIs, recent activity, quick actions |
| P0 | `/synthex/workspace` | AI workspace for generating and managing content |
| P0 | `/synthex/campaigns` | Campaign management, drip campaign builder |
| P1 | `/synthex/seo` | SEO reports, audit history, recommendations |
| P1 | `/synthex/content` | Content library, drafts, approved content |
| P1 | `/synthex/analytics` | Performance metrics, channel analytics |
| P2 | `/synthex/projects` | Project/client management |
| P2 | `/synthex/ideas` | Idea capture and planning |
| P2 | `/synthex/vault` | Brand assets, credentials, secure storage |
| P2 | `/synthex/assistant` | Chat interface to AI assistant |

### 5.4 Synthex Backend That Exists But Isn't Surfaced

- `/api/synthex/offer` - Offer pricing engine (works)
- `/api/synthex/tenant` - Tenant creation (works, used by onboarding)
- `/api/synthex/billing` - Subscription management (exists)
- `/api/synthex/seo/analyze` - SEO analysis (exists)
- `/api/synthex/visual/generate` - Visual generation (exists)
- `/api/synthex/video/generate` - Video generation (exists)

---

## 6. Agent / Skill / SDK Alignment Gaps

### 6.1 Current Agent Architecture

28 SKILL.md files exist under `.claude/skills/`:

**Core Agents** (well-defined, CLI-accessible):
- `orchestrator/SKILL.md` - Master coordinator
- `email-agent/SKILL.md` - Email processing
- `content-agent/SKILL.md` - Content generation
- `frontend/SKILL.md` - UI development
- `backend/SKILL.md` - API development
- `docs/SKILL.md` - Documentation
- `stripe-agent/SKILL.md` - Billing operations

**Founder OS Agents** (well-defined):
- `founder-os/SKILL.md` - Business management
- `ai-phill/SKILL.md` - Strategic advisor
- `cognitive-twin/SKILL.md` - Business health monitoring
- `seo-leak/SKILL.md` - SEO intelligence
- `pre-client/SKILL.md` - Lead analysis

**Marketing Agents** (well-defined):
- `social-playbook/SKILL.md` - Social media content
- `multi-channel/SKILL.md` - Channel management
- `video-generation/SKILL.md` - Video content
- `visual-engine/SKILL.md` - Visual experiences
- `conversion-copywriting/SKILL.md` - Copy optimization
- `voc-research/SKILL.md` - Voice of customer

**Specialized Agents**:
- `no-bluff-seo/SKILL.md` - SEO protocol
- `business-consistency/SKILL.md` - NAP consistency
- `competitor-analysis/SKILL.md` - Competition research
- `decision-moment/SKILL.md` - Decision mapping
- `deployment-audit/SKILL.md` - Deployment health

### 6.2 Gap: Agents Not Surfaced to End Users

All agents are currently:
- Invoked via CLI (`npm run email-agent`, etc.)
- Used by founders/developers, not by Synthex customers
- Not visible or controllable from the Synthex portal

**What Should Happen**:
- Users should see "AI is analyzing your website" in real-time
- Users should be able to trigger content generation from the UI
- Users should see agent activity logs/history
- Users should approve/reject agent-generated content

### 6.3 Missing Skills for End-User Value

| Candidate Skill | Purpose | Business Impact |
|-----------------|---------|-----------------|
| `gmb-manager` | Manage Google Business Profile | Local SEO value |
| `social-scheduler` | Schedule and post to social platforms | Core value loop |
| `email-campaign-runner` | Execute drip campaigns | Email automation |
| `website-auditor` | Run on-demand website audits | One of the paid features |
| `competitor-tracker` | Monitor competitor changes | Ongoing intelligence |
| `review-requester` | Request Google/social reviews | Lead nurturing |

### 6.4 Agent SDK Integration Opportunities

Current agents are ad-hoc scripts. Opportunities to formalize:

1. **Agent Dashboard Widget** - Show real-time agent status in Synthex portal
2. **Agent Trigger API** - Let users trigger agents from UI
3. **Agent Results Feed** - Stream agent outputs to UI
4. **Agent Configuration UI** - Let users configure agent behavior
5. **Agent Scheduling UI** - Let users schedule agent runs

---

## 7. Recommended Phase Ordering

### Phase B1: Synthex Portal MVP (CRITICAL)

**Goal**: Make the Synthex portal functional enough that a real customer can see value

1. Create `/synthex/dashboard` - Main KPI dashboard
2. Create `/synthex/workspace` - AI content generation UI
3. Create `/synthex/campaigns` - Basic campaign management
4. Wire up existing APIs to these pages
5. Ensure onboarding -> dashboard flow works

**Estimated scope**: 10-15 pages, 3-5 new API routes

### Phase B2: Integration Connections

**Goal**: Let users connect their business assets

1. Gmail connection UI in Synthex portal
2. Social media account connection (Google, Meta, LinkedIn)
3. Google Analytics / Search Console connection
4. Website crawl/audit trigger

### Phase B3: Content & Campaign Flow

**Goal**: End-to-end content creation and deployment

1. Content generation trigger from UI
2. Content review/approval workflow
3. Content scheduling and publishing
4. Campaign builder with templates

### Phase B4: Agent Visibility & Control

**Goal**: Surface AI agents to end users

1. Agent status dashboard widget
2. Agent activity feed
3. Agent configuration settings
4. Scheduled agent runs

### Phase B5: Analytics & Reporting

**Goal**: Show ROI and performance

1. Campaign performance dashboard
2. SEO ranking reports
3. Content performance metrics
4. AI usage dashboard

---

## 8. Files Reference

### Key Files for Synthex Portal Work

| Purpose | File |
|---------|------|
| Synthex layout | `src/app/(synthex)/layout.tsx` |
| Synthex onboarding | `src/app/synthex/onboarding/page.tsx` |
| Synthex placeholder | `src/app/(synthex)/client-dashboard/page.tsx` |
| Offer engine | `src/lib/synthex/synthexOfferEngine.ts` |
| Tenant API | `src/app/api/synthex/tenant/route.ts` |
| SEO API | `src/app/api/synthex/seo/analyze/route.ts` |

### Agent Architecture Files

| Purpose | File |
|---------|------|
| Agent definitions | `.claude/agent.md` |
| Orchestrator skill | `.claude/skills/orchestrator/SKILL.md` |
| Email agent script | `scripts/run-email-agent.mjs` |
| Content agent script | `scripts/run-content-agent.mjs` |

### Dashboard (Internal) Reference

| Purpose | File |
|---------|------|
| Dashboard overview | `src/app/dashboard/overview/page.tsx` |
| Approval workflow | `src/components/workspace/ApprovalCard.tsx` |
| Nexus assistant | `src/components/workspace/NexusAssistant.tsx` |

---

## 9. Summary

### What's Working
- Marketing site is polished and production-ready
- Authentication works (email + Google OAuth)
- Synthex onboarding flow is complete
- Backend APIs are extensive (100+ routes)
- Agent architecture is well-designed (28 skills)
- Pricing and offer engine is functional

### What's Broken
- Synthex client portal is 90% missing
- Users who sign up have no product to use
- Agents are not surfaced to end users
- Integration connections have no UI
- Many linked pages don't exist

### Priority Action
**Build the Synthex portal pages (Phase B1)** - This is the single most important gap. Without it, Unite-Hub/Synthex is a beautiful storefront with an empty warehouse.

---

*Generated by Claude Code Gap Analysis - Phase A1*
