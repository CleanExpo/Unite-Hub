# P1-T1: Codebase & Feature Inventory

**Date**: 2025-11-28
**Status**: COMPLETE

---

## Executive Summary

Unite-Hub/Synthex.social is a comprehensive **AI-powered CRM, marketing automation, and managed service delivery platform** with:

- **200+ pages/routes** across 5 main contexts (auth, client, staff, dashboard, founder)
- **150+ API endpoints** in 80+ functional domains
- **100+ library services** (AI agents, SEO, analytics, billing, RBAC, orchestration)
- **25+ database tables** with RLS policies
- **Build Status**: PASSING (after Phase 10 fixes)

---

## I. Core Domains

### 1. Authentication & Authorization ✅ PRODUCTION-READY
- Supabase Auth + Google OAuth (implicit flow)
- 4 roles: owner, admin, member, viewer
- 90+ granular permissions
- Device fingerprinting for admin approval
- Files: `src/lib/auth.ts`, `src/lib/auth-middleware.ts`, `src/lib/permissions.ts`

### 2. Customer Relationship Management (CRM) ⚠️ 85%
- 26 dashboard pages in `/client/dashboard/`
- Contact management, campaigns, approvals, reports
- Lead scoring algorithm (40% engagement, 20% sentiment, 20% intent, 10% role, 10% status)
- Files: `src/lib/ml/lead-scoring.ts`, `src/lib/agents/contact-intelligence.ts`

### 3. AI Orchestration & Agents ⚠️ 60%
- 5 agents: email-processor, content-generation, contact-intelligence, orchestrator, research
- 3/5 agents operational, 2 return mock data (research, analysis)
- Models: Claude Opus 4.5, Sonnet 4.5, Haiku 4.5, Gemini 3, OpenRouter
- Files: `src/lib/synthex/synthexAgiBridge.ts`, `src/lib/agents/*.ts`

### 4. Billing & Monetization ⚠️ 70%
- Stripe integration (payments, subscriptions, webhooks)
- Offer counter system with atomic updates
- Managed service project creation (partial)
- Files: `src/lib/stripe.ts`, `src/lib/synthex/synthexOfferEngine.ts`

### 5. SEO & GEO Optimization ✅ OPERATIONAL
- DataForSEO provider integration
- GSC, Bing Webmaster integration
- Geo-targeting and local SEO
- No-Bluff Protocol for claim verification
- Files: `src/lib/seo/*.ts`, `src/lib/intel/*.ts`

### 6. Email & Marketing Automation ✅ PRODUCTION-READY
- Multi-provider failover (SendGrid → Resend → Gmail SMTP)
- Gmail OAuth, Outlook/365 integration
- Drip campaigns with conditional branching
- Open/click tracking
- Files: `src/lib/email/email-service.ts`, `src/lib/campaigns/*.ts`

### 7. Content Generation & Visual Intelligence ⚠️ 70%
- AI content generation with Extended Thinking
- Visual persona system (6 personas, 4 styles)
- PersonaVisual components for landing page
- Files: `src/lib/visual/*.ts`, `src/components/marketing/*.tsx`

### 8. Synthex Managed Services ⚠️ 70%
- Proposal system
- Offer counter (50@50%, 50@25%)
- Project creation engine (needs Stripe webhook wiring)
- Files: `src/lib/managed/*.ts`, `src/lib/synthex/*.ts`

### 9. Founder Tools ⚠️ 50%
- 100+ founder routes
- 13 engine dashboards in /console/
- Platform mode toggle (test/live)
- Files: `src/app/founder/**`, `src/lib/founder/*.ts`

### 10. Leviathan Deployment ⚠️ 40%
- Content fabrication infrastructure
- Multi-cloud deployment (AWS, GCS, Azure)
- Backlink daisy-chaining
- Files: `src/lib/leviathan/*.ts`

---

## II. Route Structure

```
src/app/
├── (auth)/              # 5 auth pages
├── (client)/            # 15 client portal pages
├── (staff)/             # 10 staff pages
├── (dashboard)/         # 26 CRM dashboard pages
├── (marketing)/         # 15 marketing pages
├── console/             # 13 founder engine dashboards
├── founder/             # 100+ founder command centers
├── admin/               # Admin tools
├── auth/                # Auth callbacks
├── api/                 # 150+ API endpoints
└── synthex/             # Synthex dashboard & onboarding
```

---

## III. Component Families

- **Dashboard**: ContactManagement, CampaignBuilder, ReportingDashboard
- **Marketing**: VisualHero, PersonaVisual, VisualSectionFrame
- **Synthex**: 50+ specialized components
- **Founder**: Command center widgets
- **UI**: shadcn/ui (50+ base components)

---

## IV. Database Tables (25+)

**Core**: organizations, users, user_profiles, user_organizations, workspaces, contacts, projects, emails, campaigns

**Synthex**: synthex_projects, synthex_brands, synthex_tenants, synthex_project_jobs, synthex_job_results, synthex_offer_counter

**Leviathan**: leviathan_entities, entity_graph, cloud_deployments, leviathan_runs

---

## V. Mock Data Locations

### Primary Mock Source
- `src/lib/demo-data.ts` - Demo team members, contacts, projects, tasks

### Agent Stubs (CRITICAL)
- Research agent - `src/lib/synthex/synthexAgiBridge.ts` lines ~250-400
- Analysis agent - Returns mock analytics
- Coordination agent - Returns mock task list

### Disabled Modules
- `_disabled/` directory - 54 orphan Convex files

---

## VI. Phase Documentation

**99 phase reports** in `docs/`:
- Phase 1-10: Foundation, Auth, DB, Dashboard, Email, AI, Campaigns, Scoring ✅
- Phase 11-50: Leviathan, Billing, Founder systems ⚠️
- Phase 51-100: Advanced automation ❓

**Key Audit Reports**:
- `LAUNCH_READINESS_REPORT.md`
- `PHASE_10_PROGRESS.md`
- `PRODUCTION_GRADE_ASSESSMENT.md`

---

## VII. Critical Gaps (21 Issues)

### CRITICAL
1. 3 agent stubs returning mock data
2. Managed service Stripe → project automation incomplete

### HIGH
3. Offer counter E2E testing needed
4. Customer flow verification needed

### MEDIUM
5. Visual component imports
6. Demo fallback too common

---

## VIII. Environment Variables (P1-T2)

**Total Keys Defined**: 62
**Total Keys Used in Code**: 78
**Issues Found**: 3

### Critical Keys (Must Be Set)
- `ANTHROPIC_API_KEY` - Core AI functionality
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - OAuth
- `NEXTAUTH_SECRET` - Auth encryption
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client DB
- `SUPABASE_SERVICE_ROLE_KEY` - Server DB
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` - Billing

### Issues in .env.local
1. **Line 8**: `CRON_SECRET` missing `=` sign (HIGH)
2. **Line 9**: `DATADOG_API_KEY` missing `=` sign (HIGH)
3. **Lines 94-97**: Malformed `SEO_CREDENTIAL_ENCRYPTION_KEY` entries (MEDIUM)

### Missing from Local (Used in Code)
- `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `REDIS_URL` - Caching
- `RABBITMQ_URL` - Agent messaging
- `RESEND_API_KEY` - Email provider #2
- `INTERNAL_API_KEY`, `ORCHESTRATOR_SECRET_KEY` - Internal auth

### Deprecated (Can Remove)
- `CONVEX_DEPLOYMENT`, `CONVEX_URL`, `NEXT_PUBLIC_CONVEX_URL`

**Full Matrix**: `docs/audit/P1_ENV_KEY_MATRIX.json`

---

**Generated**: 2025-11-28
**LOC Scanned**: ~500K
