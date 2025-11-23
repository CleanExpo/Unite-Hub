# Unite-Hub Architecture - 10 Sector Analysis

**Generated**: 2025-11-23
**Status**: Active Development
**Branch**: main

---

## 10 SaaS Sector Overview

| Sector | Status | Health | Critical Issues |
|--------|--------|--------|-----------------|
| 1. Auth & Identity | PARTIAL | 60% | Implicit OAuth tokens, disabled auth on routes |
| 2. Navigation & Routing | PARTIAL | 50% | Dead code (polished but unused components), inconsistent patterns |
| 3. Data Layer | PARTIAL | 65% | Missing workspace filters, no connection pooling |
| 4. AI/ML Services | WORKING | 80% | Functional but missing retry logic |
| 5. Email & Comms | WORKING | 85% | Multi-provider fallback operational |
| 6. Campaigns & Automation | PARTIAL | 55% | Drip campaigns built, not tested |
| 7. Billing & Subscriptions | NOT STARTED | 0% | No Stripe integration |
| 8. Analytics & Reporting | PARTIAL | 40% | Pages exist, no data connections |
| 9. Admin & Settings | PARTIAL | 50% | Settings pages exist, limited functionality |
| 10. DevOps & Monitoring | PARTIAL | 45% | Vercel deployed, no monitoring |

---

## Sector 1: Auth & Identity

### Current State
- **Provider**: Supabase Auth with Google OAuth 2.0 (implicit flow)
- **Session Storage**: localStorage (client-side only)
- **User Initialization**: `/api/auth/initialize-user`

### Components
- `src/contexts/AuthContext.tsx` - Auth state management
- `src/app/auth/callback/page.tsx` - OAuth callback
- `src/app/auth/implicit-callback/page.tsx` - Token extraction

### Critical Issues
1. **Disabled Authentication** - Many API routes have `// TODO: Re-enable authentication`
2. **No Token Refresh** - Implicit flow doesn't support refresh tokens
3. **workspaceId as string** - Sometimes "default-org" instead of UUID

### Required Actions
- [ ] Re-enable auth on all 104 API routes
- [ ] Add proper session validation
- [ ] Handle empty organizations gracefully

---

## Sector 2: Navigation & Routing

### Current State
- **Pattern**: Top-nav dropdown menus (dashboard), sidebar (client/staff)
- **Router**: Next.js 16 App Router with route groups

### Components (DEAD CODE - polished but NOT USED)
```
src/components/layout/AppShellLayout.tsx    ❌ NOT IMPORTED
src/components/layout/TopNavBar.tsx         ❌ NOT IMPORTED
src/components/layout/SidebarNavigation.tsx ✅ USED (client portal)
src/components/Breadcrumbs.tsx              ❌ 3 different implementations
```

### Navigation Inconsistencies
1. **Dashboard** uses custom inline nav in `src/app/dashboard/layout.tsx`
2. **Client Portal** uses `SidebarNavigation.tsx`
3. **Staff Portal** uses different layout
4. **Demo Workspace** uses `WorkspaceSidebar.tsx`

### Pages NOT in Navigation (13 orphans)
- `/dashboard/analytics`
- `/dashboard/seo`
- `/dashboard/tasks`
- `/dashboard/reports`
- `/dashboard/time-tracker`
- `/dashboard/drip-campaigns`
- `/dashboard/email-templates`
- `/dashboard/settings/profile`
- `/dashboard/settings/api-keys`
- `/dashboard/settings/workspace`
- `/dashboard/settings/billing`
- `/dashboard/settings/notifications`
- `/dashboard/settings/workspace/delete`

### Required Actions
- [ ] Consolidate to single AppShellLayout pattern
- [ ] Use one Breadcrumbs component
- [ ] Add all pages to navigation menus
- [ ] Remove dead code

---

## Sector 3: Data Layer

### Current State
- **Database**: Supabase PostgreSQL
- **ORM**: Direct Supabase client queries
- **RLS**: Partially enabled

### Files
- `src/lib/supabase.ts` - Client initialization
- `src/lib/db.ts` - Database wrapper (BROKEN at line 58)
- `supabase/migrations/` - Schema migrations

### Critical Issues
1. **Missing Import** - `src/lib/db.ts:58` uses undefined `supabaseServer`
2. **No Workspace Filtering** - Dashboard queries fetch ALL workspaces
3. **No Connection Pooling** - Supabase Pooler not enabled (60-80% latency impact)
4. **Incomplete RLS** - Not all tables have policies

### Required Actions
- [ ] Fix `db.ts` missing import
- [ ] Add workspace filtering to ALL queries
- [ ] Enable Supabase Pooler
- [ ] Complete RLS policies

---

## Sector 4: AI/ML Services

### Current State
- **Primary**: Anthropic Claude API (Opus 4, Sonnet 4.5, Haiku 4.5)
- **Secondary**: Gemini 3 Pro (20%), OpenRouter (70%)
- **Cost Optimization**: Multi-provider routing

### Components
- `src/lib/agents/contact-intelligence.ts` - Lead scoring
- `src/lib/agents/content-personalization.ts` - Content generation
- `src/lib/agents/email-processor.ts` - Email analysis
- `src/lib/ai/openrouter-intelligence.ts` - Multi-model routing
- `src/lib/ai/perplexity-sonar.ts` - SEO intelligence

### Claude Agent Skills
```
.claude/skills/
├── orchestrator/SKILL.md   ✅ Complete
├── email-agent/SKILL.md    ✅ Complete
├── content-agent/SKILL.md  ✅ Complete
├── frontend/SKILL.md       ✅ Complete
├── backend/SKILL.md        ✅ Complete
└── docs/SKILL.md           ✅ Complete
```

### Critical Issues
1. **No Retry Logic** - Anthropic API calls fail on rate limits
2. **No Prompt Caching** - 90% cost savings available but not implemented

### Required Actions
- [ ] Add exponential backoff retry wrapper
- [ ] Implement prompt caching for system prompts
- [ ] Complete Gemini 3 migration per strategy docs

---

## Sector 5: Email & Comms

### Current State
- **Providers**: SendGrid (priority 1) → Resend (priority 2) → Gmail SMTP (priority 3)
- **Gmail Integration**: OAuth 2.0 with sync and tracking

### Components
- `src/lib/email/email-service.ts` - Multi-provider service (535 lines)
- `src/app/api/integrations/gmail/` - Gmail OAuth endpoints

### Status: OPERATIONAL
Multi-provider fallback working. Test with `node scripts/test-email-config.mjs`

### Required Actions
- [ ] Add email open/click tracking dashboard
- [ ] Test all provider failover scenarios

---

## Sector 6: Campaigns & Automation

### Current State
- **Drip Campaigns**: Schema exists, UI built, not tested
- **Enrollments**: `campaign_enrollments` table exists
- **Execution**: `campaign_execution_logs` table exists

### Components
- `src/app/dashboard/campaigns/` - Campaign list
- `src/app/dashboard/drip-campaigns/` - Drip builder

### Critical Issues
1. **No Background Jobs** - Campaign steps not executing automatically
2. **No Visual Builder** - Conditional branching UI incomplete
3. **Not Tested** - No E2E tests for campaign flow

### Required Actions
- [ ] Implement BullMQ/Redis job queue
- [ ] Complete visual campaign builder
- [ ] Add E2E campaign tests

---

## Sector 7: Billing & Subscriptions

### Current State: NOT STARTED

No Stripe integration. No subscription tables. No paywall.

### Required Actions
- [ ] Add Stripe integration
- [ ] Create subscription tiers
- [ ] Implement usage limits
- [ ] Add billing UI

---

## Sector 8: Analytics & Reporting

### Current State
- **Pages**: `/dashboard/analytics`, `/dashboard/reports` exist
- **Data**: No connections to actual metrics

### Critical Issues
1. **Empty Pages** - Analytics/Reports show placeholder content
2. **No Charts** - No visualization library integrated
3. **No API** - No endpoints for metric aggregation

### Required Actions
- [ ] Integrate chart library (Recharts/Chart.js)
- [ ] Create analytics API endpoints
- [ ] Connect pages to real data

---

## Sector 9: Admin & Settings

### Current State
- **Settings Pages**: 6 pages exist under `/dashboard/settings/`
- **Profile Update**: `/api/profile/update` working

### Pages
- `/dashboard/settings/profile`
- `/dashboard/settings/workspace`
- `/dashboard/settings/billing` (placeholder)
- `/dashboard/settings/api-keys` (placeholder)
- `/dashboard/settings/notifications`
- `/dashboard/settings/workspace/delete`

### Required Actions
- [ ] Complete API key management
- [ ] Connect notification preferences to database
- [ ] Add workspace management functionality

---

## Sector 10: DevOps & Monitoring

### Current State
- **Hosting**: Vercel (deployed)
- **Database**: Supabase Cloud
- **CI/CD**: Git push → Vercel auto-deploy
- **Monitoring**: None

### Critical Issues
1. **No Error Tracking** - No Sentry/Datadog
2. **No APM** - No performance monitoring
3. **No Alerting** - No uptime alerts
4. **No Zero-Downtime** - Brief outages on deploy

### Required Actions
- [ ] Add Sentry error tracking
- [ ] Enable Vercel Analytics
- [ ] Configure uptime monitoring
- [ ] Implement blue-green deployments

---

## File Structure Overview

```
Unite-Hub/
├── .claude/
│   ├── agent.md             # Agent definitions
│   ├── skills/              # 6 skill definitions
│   ├── config.json
│   └── mcp.json
├── src/
│   ├── app/
│   │   ├── (marketing)/     # Public pages
│   │   ├── (client)/        # Client portal
│   │   ├── (staff)/         # Staff portal
│   │   ├── dashboard/       # Main dashboard (21+ pages)
│   │   ├── demo-workspace/  # Demo workspace
│   │   ├── api/             # 104 API routes
│   │   └── auth/            # Auth callbacks
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   ├── layout/          # Layout components (some dead code)
│   │   └── client/          # Client-specific
│   ├── lib/
│   │   ├── agents/          # AI agent logic
│   │   ├── ai/              # AI providers
│   │   ├── email/           # Email service
│   │   └── supabase.ts
│   └── contexts/
│       └── AuthContext.tsx
├── docs/                    # 100+ documentation files
├── scripts/                 # CLI automation
└── supabase/
    └── migrations/          # Database migrations
```

---

## Critical Path for Production

### P0 - System Breaking (Must Fix)
1. Fix `src/lib/db.ts:58` missing import
2. Add workspace filtering to dashboard queries
3. Re-enable authentication on API routes
4. Enable Supabase connection pooling

### P1 - Functionality Gaps (Should Fix)
5. Consolidate navigation to AppShellLayout
6. Add Anthropic retry logic
7. Implement prompt caching
8. Add error tracking (Sentry)

### P2 - Enhancement (Nice to Have)
9. Complete analytics dashboards
10. Add Stripe billing
11. Implement campaign job queue
12. Add E2E test suite

---

## Next Steps

See [phases.md](./phases.md) for Phase 15-17 execution plan.
See [runbook.md](./runbook.md) for operational procedures.
