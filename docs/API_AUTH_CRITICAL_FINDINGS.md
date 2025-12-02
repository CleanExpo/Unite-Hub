# API Authentication - Critical Security Findings

**Date:** 2025-12-02
**Audited by:** Backend System Architect
**Total Routes:** 683
**Missing Auth:** 65 routes (9.5%)
**Auth Coverage:** 90.5%

---

## Executive Summary

An automated security audit identified **65 API routes lacking authentication**, representing potential security vulnerabilities. These routes need immediate review and appropriate authentication implementation.

### Coverage by Type

| Auth Type | Count | % of Total |
|-----------|-------|------------|
| ✅ **Protected (User Auth)** | 589 | 86.2% |
| 🌐 **Public (Intentional)** | 17 | 2.5% |
| ⏰ **Cron Jobs** | 4 | 0.6% |
| 🔗 **Webhooks** | 2 | 0.3% |
| 🔑 **Auth Endpoints** | 6 | 0.9% |
| ⚠️ **MISSING AUTH** | **65** | **9.5%** |

---

## Critical Routes Requiring Authentication (65 Total)

### Priority 1: User Data Routes (CRITICAL) - 15 routes

These routes handle sensitive user data and MUST have authentication:

1. `/api/client/vault` - Client credentials/secrets storage
2. `/api/client/ideas` - Client business ideas
3. `/api/client/proposals` - Client proposals
4. `/api/founder/business-vault` - Founder business data
5. `/api/founder/business-vault/[businessKey]/channel` - Business channel data
6. `/api/founder/business-vault/[businessKey]/snapshot` - Business snapshots
7. `/api/v1/contacts` - Contact management (v1 API)
8. `/api/v1/contacts/[id]` - Individual contact data
9. `/api/v1/campaigns` - Campaign management
10. `/api/v1/emails` - Email data
11. `/api/audits` - System audit logs
12. `/api/staff/me` - Staff user profile
13. `/api/staff/projects` - Staff project list
14. `/api/staff/tasks` - Staff task management
15. `/api/staff/tasks/[id]` - Individual staff tasks

**Risk:** Data leakage, unauthorized access to sensitive business information
**Recommendation:** Add `validateUserAndWorkspace()` or `validateUserAuth()` immediately

---

### Priority 2: AI/Content Generation Routes - 18 routes

These routes consume AI credits and generate content:

1. `/api/ai/generate-proposal` - Proposal generation
2. `/api/ai/interpret-idea` - Idea interpretation
3. `/api/synthex/video/generate` - Video generation
4. `/api/synthex/video/jobs` - Video job queue
5. `/api/synthex/video/templates` - Video templates
6. `/api/synthex/visual/generate` - Visual generation
7. `/api/synthex/visual/brand-kits` - Brand kit management
8. `/api/synthex/visual/capabilities` - Visual capabilities
9. `/api/synthex/visual/jobs` - Visual job queue
10. `/api/synthex/seo/analyze` - SEO analysis
11. `/api/synthex/seo/analyses` - SEO analysis history
12. `/api/managed/reports/generate` - Report generation
13. `/api/managed/reports/send` - Report distribution
14. `/api/creative/insights` - Creative insights
15. `/api/creative/quality` - Quality analysis
16. `/api/leviathan/orchestrate` - Multi-agent orchestration
17. `/api/visual/transformation` - Visual transformations
18. `/api/evolution/proposals` - Evolution proposals

**Risk:** Abuse, credit exhaustion, unauthorized AI usage
**Recommendation:** Add `validateUserAuth()` + rate limiting

---

### Priority 3: Staff/Admin Routes - 5 routes

Routes for internal staff operations:

1. `/api/staff/activity` - Staff activity tracking
2. `/api/staff/me` - Staff profile
3. `/api/staff/projects` - Staff project management
4. `/api/staff/tasks` - Staff task list
5. `/api/staff/tasks/[id]` - Individual tasks

**Risk:** Unauthorized access to internal operations
**Recommendation:** Add `getUser()` + role check for `STAFF` or `ADMIN`

---

### Priority 4: Integration/OAuth Routes - 8 routes

OAuth and external service integration endpoints:

1. `/api/email/oauth/authorize` - Email OAuth start
2. `/api/integrations/gmail/connect` - Gmail connection
3. `/api/integrations/gmail/connect-multi` - Multi-account Gmail
4. `/api/integrations/gmail/callback-multi` - Multi-account callback
5. `/api/integrations/outlook/connect` - Outlook connection
6. `/api/integrations/outlook/callback` - Outlook OAuth callback
7. `/api/connected-apps/callback/[provider]` - Generic OAuth callback
8. `/api/trust/signature/callback` - Signature service callback

**Risk:** Account hijacking, unauthorized integrations
**Recommendation:** OAuth routes need session validation, callbacks need state verification

---

### Priority 5: Analytics/Reporting Routes - 14 routes

Analytics and reporting endpoints:

1. `/api/aido/auth/ga4/url` - Google Analytics 4 auth URL
2. `/api/aido/auth/gbp/url` - Google Business Profile auth URL
3. `/api/aido/auth/gsc/url` - Google Search Console auth URL
4. `/api/founder/synthex/setup-analytics` - Analytics setup
5. `/api/marketing/events` - Marketing event tracking
6. `/api/marketing/insights` - Marketing insights
7. `/api/director/alerts` - Director alerts
8. `/api/director/insights` - Director insights
9. `/api/executive/briefing` - Executive briefing
10. `/api/executive/missions` - Executive missions
11. `/api/reports/sample-by-persona` - Sample reports
12. `/api/seo/competitive-benchmark` - SEO benchmarking
13. `/api/seo/keyword-gap` - Keyword gap analysis
14. `/api/monitoring/metrics` - System metrics

**Risk:** Business intelligence leakage
**Recommendation:** Add `validateUserAuth()` or make intentionally public with rate limiting

---

### Priority 6: System/Operational Routes - 5 routes

System operation and scheduling:

1. `/api/posting/attempts` - Social media posting attempts
2. `/api/posting/scheduler` - Post scheduler
3. `/api/scaling-mode/health` - Scaling health check
4. `/api/scaling-mode/history` - Scaling history
5. `/api/v1/agents/orchestrator` - Agent orchestration (v1)

**Risk:** System manipulation, unauthorized operations
**Recommendation:** Add `validateUserAuth()` or `validateCronRequest()` for automated tasks

---

## Authentication Patterns to Use

### Pattern 1: User + Workspace Authentication (Multi-tenant data)

```typescript
import { validateUserAndWorkspace } from "@/lib/workspace-validation";

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get("workspaceId");

  // Validates user AND workspace access
  await validateUserAndWorkspace(req, workspaceId);

  // Your route logic here
}
```

**Use for:** Any route that queries/modifies workspace-specific data (contacts, campaigns, etc.)

---

### Pattern 2: User Authentication Only (No workspace context)

```typescript
import { validateUserAuth } from "@/lib/workspace-validation";

export async function POST(req: NextRequest) {
  // Validates user session
  const user = await validateUserAuth(req);

  // User has: user.userId, user.orgId
  // Your route logic here
}
```

**Use for:** User profile routes, cross-workspace routes, AI generation routes

---

### Pattern 3: Role-Based Access (Admin/Staff routes)

```typescript
import { getUser } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const user = await getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'ADMIN' && profile?.role !== 'STAFF') {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admin/staff logic here
}
```

**Use for:** `/api/staff/*`, `/api/admin/*` routes

---

### Pattern 4: OAuth Callbacks (State validation)

```typescript
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const state = req.nextUrl.searchParams.get('state');

  // Verify state matches session
  const session = await getSession();
  if (state !== session.oauthState) {
    return NextResponse.json({ error: "Invalid state" }, { status: 400 });
  }

  // Exchange code for tokens, link to user account
}
```

**Use for:** `/api/integrations/*/callback`, `/api/connected-apps/callback/*`

---

## Implementation Plan

### Week 1: Critical User Data Routes (Priority 1)
- Add authentication to 15 user data routes
- Test with real user sessions
- Verify workspace isolation

### Week 2: AI/Content Routes (Priority 2)
- Add authentication to 18 AI generation routes
- Implement rate limiting
- Test credit tracking

### Week 3: Staff + Integration Routes (Priority 3 + 4)
- Add role checks to staff routes
- Implement OAuth state validation
- Test integration flows

### Week 4: Analytics + System Routes (Priority 5 + 6)
- Review each route: public vs protected
- Add authentication where needed
- Implement appropriate rate limiting

---

## Testing Checklist

For each route after adding authentication:

- [ ] Unauthenticated request returns 401
- [ ] User from different workspace cannot access data (if workspace-scoped)
- [ ] Valid user can access their own data
- [ ] Rate limiting works correctly
- [ ] Error messages don't leak information

---

## Known Good Patterns

These routes have correct authentication and can serve as examples:

1. **`/api/contacts/route.ts`** - validateUserAndWorkspace + comprehensive validation
2. **`/api/campaigns/route.ts`** - Multi-method (GET/POST) with workspace filtering
3. **`/api/agents/contact-intelligence/route.ts`** - validateUserAuth + validateWorkspaceAccess
4. **`/api/cron/health-check/route.ts`** - validateCronRequest with timestamp protection
5. **`/api/stripe/webhook/route.ts`** - Webhook signature verification + idempotency

---

## False Positives (Routes That May Be Intentionally Public)

These routes were flagged but may be intentionally public. Review and document:

1. `/api/privacy/subject-access-request` - GDPR request (may need email verification instead)
2. `/api/synthex/offer` - Public offer page?
3. `/api/enterprise/billing/plans` - Public pricing page?
4. `/api/v1/auth/session` - Session check endpoint (may be intentionally public)

**Action:** For each route, either:
- Add authentication if it should be protected
- Document why it's public and add to PUBLIC_ROUTE_PATTERNS in audit script
- Add rate limiting if public

---

## Full Audit Report

See `docs/API_ROUTE_SECURITY_AUDIT.md` for complete details including:
- All 586 protected routes
- 17 intentionally public routes
- 4 cron jobs
- 2 webhooks
- Implementation examples
- Security best practices

---

## Next Steps

1. **Review this document with security team**
2. **Prioritize routes by business criticality**
3. **Implement authentication in phases (Priority 1 → 6)**
4. **Test each route after implementation**
5. **Re-run audit script: `node scripts/audit-api-auth.mjs`**
6. **Target: 100% authentication coverage by end of Q1**

---

**Contact:** Backend System Architect
**Audit Tool:** `scripts/audit-api-auth.mjs`
**Re-run:** `node scripts/audit-api-auth.mjs` after changes
