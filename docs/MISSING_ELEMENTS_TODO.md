# Missing Elements TODO (Designed/Spec’d but not yet Production-Implemented)

**Generated**: 2025-12-12

This backlog is based on:
- `ACTION-PLAN.md` (explicit “missing” items)
- Codebase scans for `TODO|FIXME|placeholder` under `src/` (≈ **190 TODO**, **8 FIXME**, **908 placeholder** occurrences)
- Documentation scan for TODO/placeholder/future-phase markers under `docs/`

> Goal: identify elements that exist as *design/spec/UI shells* but are not yet fully implemented as production-ready capabilities (data persistence, real integrations, background jobs, auth/tenant context, exports, etc.).

---

## P0 — Production Blockers (Security + Multi-tenancy + Reliability)

### P0.1 Fix missing runtime prerequisites on dev/prod environments
**Problem**: current environment cannot run `node`/`npm` (node.exe not found), blocking build/test.

**Work**
- Ensure Node.js is installed and available on PATH for local dev + CI.
- Verify repo’s `.nvmrc` is respected (Windows: `nvm-windows` or CI node setup).

**Acceptance**
- `node -v` and `npm -v` work
- `npm ci` and `npm run build` succeed in CI

---

### P0.2 Re-enable API authentication where disabled / incomplete
**Primary reference**: `ACTION-PLAN.md` → “P0-1: Re-enable Authentication on API Routes”

**Work**
- Audit `src/app/api/**` for any authentication TODOs or missing auth.
- Standardize auth enforcement patterns.

**Acceptance**
- All protected endpoints return `401` when unauthenticated
- No “TODO re-enable authentication” markers remain in production endpoints

---

### P0.3 Eliminate hardcoded workspaceId/tenantId placeholders in UI and services
**Observed examples (from grep)**
- `src/app/founder/ai-oversight/page.tsx` (hardcoded workspaceId)
- `src/app/founder/critical-path/page.tsx` (hardcoded workspaceId)
- `src/app/founder/intelligence-bus/page.tsx` (hardcoded workspaceId)
- `src/app/founder/reality-map/page.tsx` (hardcoded workspaceId)
- `src/app/founder/drift/page.tsx`, `early-warning/page.tsx`, `forecast/page.tsx`, `network/page.tsx`, `observatory/page.tsx` (workspaceId = all-zeros)
- `src/app/guardian/admin/*/page.tsx` (workspaceId = all-zeros)
- `src/lib/founder/guardian/tenant.ts` returns `TODO_GUARDIAN_TENANT`

**Work**
- Wire workspace/tenant resolution to the existing auth/session + workspace context.
- Ensure all reads/writes are scoped by workspace/tenant.

**Acceptance**
- No production pages use hardcoded workspace IDs
- Guardian tenant resolution no longer returns placeholder

---

### P0.4 Connection pooling + rate limiting must be production-grade
**Observed**
- Feature backlog: `feature_list.json` includes `f7 Connection pooling optimization` + `f11 Anthropic API rate limiting`
- Code TODO: `src/lib/rate-limit-tiers.ts` uses in-memory store (“TODO: Implement Redis connection”)
- API TODO: `src/app/api/_middleware/rate-limit.ts` has integration TODO

**Work**
- Implement Redis-backed rate limit counters with TTL (replace in-memory).
- Verify Supabase pooling config is used correctly in server client.

**Acceptance**
- Rate limits persist across instances
- Health check reports pooling enabled (if you have a health endpoint for it)

---

### P0.5 Extended RLS coverage + workspace isolation audit completion
**Primary reference**
- `ACTION-PLAN.md` → P0-5 “Verify Workspace Isolation”
- Docs indicate extended tables missing RLS in places (see `docs/rebuild/audit/AUDIT-SUMMARY.md` excerpt in repo search results)

**Work**
- Identify extended tables that lack RLS and/or policies.
- Add/verify policies and constraints for tenant/workspace isolation.

**Acceptance**
- RLS enabled for all tenant-scoped tables
- Automated checks (tests/scripts) prove isolation

---

## P1 — Missing Data Persistence / Background Jobs / Real Integrations

### P1.1 Cloud storage integration for attachments, exports, and media
**Observed TODOs**
- `src/lib/gmail/storage.ts` (upload/delete/signed URL placeholders)
- `src/app/api/email/webhook/route.ts` (attachment upload TODO)
- `src/app/api/cron/process-exports/route.ts` (multiple “TODO: Upload to storage”)

**Work**
- Choose and implement a single storage backend (Supabase Storage is already present in migrations: `030_media_storage_bucket.sql`, `031_storage_policies.sql`).
- Implement:
  - upload
  - signed URL generation
  - deletion
  - DB record creation linking attachments to workspace

**Acceptance**
- Email attachments are retrievable after ingestion
- Export jobs produce downloadable URLs

---

### P1.2 Stripe webhook email notifications
**Observed TODOs**
- `src/app/api/stripe/webhook/route.ts` lines with “TODO: Send email notification to customer”

**Work**
- Implement transactional email sending for key billing events.
- Ensure templates exist and are auditable.

**Acceptance**
- Payment failure/action-required/success notifications are sent
- Webhook handling remains idempotent

---

### P1.3 Background job queue for async work (email processing, SEO audits, boosts, media)
**Observed TODOs**
- `src/app/api/v1/emails/route.ts` (trigger background queue)
- `src/app/api/v1/agents/orchestrator/route.ts` (publish task to queue)
- `src/app/api/seo-leak/audit/route.ts` (trigger background job)
- `src/app/api/media/upload/route.ts` (Phase 3 transcription TODO)
- `src/app/api/multi-channel/boost/jobs/route.ts` (trigger background job)

**Work**
- Standardize a queue mechanism (repo references Bull/BullMQ; confirm what’s installed/configured).
- Implement job records, retries, backoff, and observability.

**Acceptance**
- Async endpoints enqueue work and return job IDs
- Workers process jobs reliably and update status tables

---

### P1.4 Founder Ops: persist tasks + scheduling + archive bridge (currently stubbed)
**Observed TODO-heavy files**
- `src/lib/founderOps/founderOpsEngine.ts` (save/fetch/delete/update status = TODO)
- `src/lib/founderOps/founderOpsScheduler.ts` (scheduled_for queries/updates = TODO)
- `src/lib/founderOps/founderOpsArchiveBridge.ts` (query/write stats = TODO)
- `src/lib/founderOps/founderOpsBrandBinding.ts` (reassignment + metrics = TODO)

**Work**
- Confirm DB schema exists for Founder Ops tasks (migrations include `112_founder_timecard.sql`, `118_founder_assistant.sql`, etc.; verify actual table names).
- Implement persistence layer (Supabase CRUD) with workspace scoping.
- Implement schedule operations and archive logging.

**Acceptance**
- Founder Ops UI can create/update/schedule tasks and see them after reload
- Archive stats reflect real stored data

---

### P1.5 Replace SEO/Intel “mock data” bridges with real OAuth + API calls
**Observed TODOs**
- `src/server/auditEngine.ts` (GSC/Bing/Brave API calls are TODO)
- `src/lib/intel/searchConsoleBridge.ts` (TODO: query integrations table; real API calls)
- `src/lib/intel/bingWebmasterBridge.ts` (same)
- `src/lib/intel/trendSignalsBridge.ts` (DataForSEO calls TODO)
- `src/lib/integrations/google-business-profile.ts` (explicit placeholder)

**Work**
- Ensure credentials are stored in integrations tables and retrieved per-workspace.
- Implement token refresh and error handling.

**Acceptance**
- Real API responses replace mocks for connected tenants
- OAuth refresh works and is tested

---

## P2 — Feature Completeness (Exports, Posting, UI wiring)

### P2.1 PDF generation is a placeholder
**Observed**
- `src/lib/reports/pdfRenderer.ts` returns placeholder HTML buffer and instructions

**Work**
- Implement real PDF rendering (e.g., Playwright/Puppeteer server-side) or switch to a hosted PDF service.

**Acceptance**
- Reports export to valid PDF bytes and download correctly

---

### P2.2 Posting engine channel adapters are stubbed (real social APIs)
**Observed**
- `src/lib/postingEngine/postingChannelAdapterService.ts` has TODOs for:
  - Facebook, Instagram, LinkedIn, TikTok, YouTube, Google Business Profile posting, Reddit, X

**Work**
- Prioritize 1–2 channels first (define MVP channels).
- Implement OAuth token storage + posting endpoints.

**Acceptance**
- End-to-end publish flow works for selected channels

---

### P2.3 UI actions/settings that are currently non-functional
**Observed TODOs**
- `src/app/dashboard/aido/settings/page.tsx` (save settings TODO)
- `src/components/synthex/settings/IntegrationsPanel.tsx` (save TODO)
- `src/app/dashboard/marketplace/page.tsx` (modal TODO)
- `src/app/dashboard/messages/whatsapp/page.tsx` (archive API TODO)
- `src/app/dashboard/resources/landing-pages/[id]/page.tsx` (export TODO)

**Work**
- Implement missing APIs + wire buttons to real handlers.

**Acceptance**
- UI actions persist data and survive refresh

---

## P3 — Operational Hardening / Observability

### P3.1 External error tracking
**Observed**
- `src/lib/utils/error-handler.ts` TODO: external error tracking

**Work**
- Add production-grade error tracking (Sentry or equivalent), sanitize sensitive data.

**Acceptance**
- Unhandled errors are captured with request/workspace context

---

## Recommended Execution Order (Dependency-Aware)

1. **P0.1** runtime prerequisites (enable build/test)
2. **P0.2 + P0.3 + P0.5** security + tenancy correctness
3. **P0.4** pooling + rate limiting
4. **P1.1 + P1.3** storage + queue foundation (unblocks many TODOs)
5. **P1.2** Stripe emails
6. **P1.4** Founder Ops persistence
7. **P1.5** real SEO/Intel integrations
8. P2/P3 enhancements

---

## Notes / Evidence

**Repo scans (latest run)**
- TODO occurrences (src): ~190 lines
- FIXME occurrences (src): ~8 lines
- “placeholder” occurrences (src): ~908 lines

**High TODO density files (top)**
- `src/lib/postingEngine/postingChannelAdapterService.ts`
- `src/app/api/cron/process-exports/route.ts`
- `src/lib/founderOps/founderOpsEngine.ts`
- `src/lib/founderOps/founderOpsScheduler.ts`

---

If you want, tell me whether your next focus is **Guardian**, **Synthex**, **Founder OS**, or **Core CRM**, and I’ll turn the relevant P0/P1 items into a more granular “implementation-ready” sprint board (stories + acceptance tests + file-level tasks).
