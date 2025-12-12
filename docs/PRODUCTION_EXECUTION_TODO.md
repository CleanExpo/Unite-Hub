# Production Execution TODO (Inputs → Outputs → Connections → Prove Execution → Done)

**Generated**: 2025-12-12

This is the *actionable* TODO list to turn the currently-designed system into a production-executing SaaS.

It is organized by your execution rubric:
1) **Define inputs**
2) **Define outputs**
3) **Define connections**
4) **Prove execution**
5) **Declare done**

> Source signals used: `docs/MISSING_ELEMENTS_TODO.md` (gap inventory), repo TODO/placeholder scan results, and `ACTION-PLAN.md`.

---

## 0) Prerequisite: Toolchain can run (blocking)

- [ ] **Install/restore Node.js runtime on all dev/CI environments**
  - Evidence: `node -v` and `npm -v` succeed (currently failing on this machine)
  - Success: `npm ci`, `npm run build`, `npm test` run without missing executables

---

## 1) Define Inputs (what the system accepts)

### 1.1 Auth + Tenant/Workspace context is the universal input
- [ ] **Standardize request context extraction** for API routes
  - Input: `Authorization` header or cookie session
  - Output: `{ userId, workspaceId, roles, plan/tier }`
  - Replace: any hardcoded `workspaceId`/`tenantId` placeholders in pages/services

- [ ] **Explicit input validation for every “core” endpoint**
  - WorkspaceId present
  - Schema validated body/query (zod or existing validators)
  - Reject missing/invalid params with consistent `{status, error}` format

### 1.2 Define canonical “business inputs” per domain
- [ ] **Email ingestion inputs**
  - webhook payload + attachments
  - mapping rules to contacts/threads

- [ ] **Exports inputs**
  - export request: `{tables, filters, format, destination}`

- [ ] **SEO/Intel inputs**
  - tenant integration credentials (GSC/Bing/GBP/DataForSEO)
  - target site + keywords

- [ ] **Posting inputs**
  - channel tokens + post payload + media references

---

## 2) Define Outputs (what the system produces)

### 2.1 Durable storage outputs (URLs, records, artifacts)
- [ ] **Cloud storage outputs (single backend)**
  - Output types:
    - email attachment URL (signed)
    - export file URL (signed)
    - media upload URL + derived artifacts
  - Must be workspace-scoped and auditable

### 2.2 Business outputs (state transitions + artifacts)
- [ ] **Founder Ops outputs**
  - `founder ops task created/updated/scheduled/archived` persisted in DB

- [ ] **Stripe outputs**
  - subscription status changes persisted
  - transactional emails emitted for payment events

### 2.3 Reporting outputs
- [ ] **PDF exports are real PDFs (not placeholder HTML buffers)**
  - Output: `application/pdf` bytes
  - Store: in storage with signed URL

---

## 3) Define Connections (how components talk to each other)

### 3.1 Persistent infrastructure connections
- [ ] **Redis-backed rate limiting** (replace in-memory counters)
- [ ] **Supabase pooling connection** verified (server client uses pooler when configured)

### 3.2 Async execution connections (queue/eventing)
- [ ] **Pick/confirm job runner** (BullMQ / Inngest / cron + DB queue)
- [ ] **Connect async producers → worker consumers**
  - email processing
  - seo audits
  - export generation
  - boost execution
  - media post-processing

### 3.3 External integrations connections
- [ ] **GSC/Bing/GBP/DataForSEO bridges use real tokens from integrations tables** (replace mock calls)
- [ ] **Social posting adapters implement at least 1–2 MVP platforms end-to-end**

---

## 4) Prove Execution (evidence the system actually runs)

### 4.1 Automated proof (tests + checks)
- [ ] **API smoke suite**: hit key endpoints unauthenticated/authenticated
- [ ] **Workspace isolation verification**
  - tests proving cross-tenant reads/writes are blocked
  - RLS coverage report for tenant-scoped tables

- [ ] **Rate-limit proof**
  - repeated calls trigger 429
  - counters persist across server restart (requires Redis)

- [ ] **Storage proof**
  - upload → retrieve signed URL → download → delete

- [ ] **Queue proof**
  - enqueue job → worker processes → status updated → artifact produced

### 4.2 Manual proof (E2E user journeys)
- [ ] User signs up/logs in → workspace resolved
- [ ] User connects an integration (at least one) → data ingested
- [ ] User generates an output (export/report/post) → gets a real downloadable artifact

---

## 5) Declare Done (definition of done for “production model”)

### 5.1 “No placeholders” gates for production-critical paths
- [ ] Remove/replace TODO/FIXME placeholders in these areas:
  - auth + workspace resolution
  - storage
  - queue
  - Stripe webhook notifications
  - SEO/Intel bridges (for enabled integrations)

### 5.2 Operational readiness
- [ ] External error tracking enabled (with PII-safe sanitization)
- [ ] Health endpoints show:
  - DB connectivity
  - pooling enabled/disabled
  - Redis connectivity
  - queue status

### 5.3 Release checklist
- [ ] `npm run build` passes
- [ ] tests pass
- [ ] E2E run recorded (screenshots/logs)
- [ ] security sanity checks pass (auth + RLS + workspace isolation)

---

## Suggested first implementation batch (smallest set that unlocks execution)

1. Toolchain runtime (Node)
2. Auth + workspace context everywhere (remove hardcoded IDs)
3. Storage backend wired (attachments + exports)
4. Queue wired for one pipeline (exports or email processing)
5. Evidence: tests + E2E for that pipeline
