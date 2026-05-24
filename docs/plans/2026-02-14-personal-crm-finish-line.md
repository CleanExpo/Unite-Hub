# Unite-Hub: Personal Business Hub — Finish Line Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Unite-Hub from a feature-rich prototype into a fully working Personal Business Hub that lets the founder manage 6 businesses from one intelligent dashboard — contacts, deals, emails, campaigns, tasks, and analytics all wired to real data.

**This is NOT a SaaS product.** Unite-Hub is a private business tool. The public-facing site is a business showcase. Client access is by invitation only. No public signups.

**Managed Businesses:**
1. **Synthex** — AI Marketing Agency (separate app, managed from Unite-Hub)
2. **RestoreAssist** — Restoration Management Software
3. **CARSI** — Cleaning & Restoration Science Institute
4. **Disaster Recovery** — Emergency Restoration Services
5. **NRPG** — National Restoration Professionals Group
6. **ATO Audit** — Tax Audit & Compliance Services

**Architecture:** Next.js 16 App Router + Supabase PostgreSQL + Claude AI agents. The system has 400+ pages, 700+ API routes, 13+ database tables with RLS, and comprehensive auth/security. Synthex has been extracted as a separate application. The work is about wiring existing UI to real data, filling critical feature gaps, and hardening for production deployment.

**Tech Stack:** Next.js 16 (Turbopack), React 19, TypeScript 5.x, Supabase (PostgreSQL + Auth + Realtime), Anthropic Claude API (Opus/Sonnet/Haiku), shadcn/ui, Tailwind CSS, Redis (caching), Bull (job queues), SendGrid/Resend/Gmail SMTP (email), Vercel (deployment)

---

## Current State Assessment

### What's WORKING (Keep & Polish)

| Feature | Status | Notes |
|---------|--------|-------|
| Contact CRUD | WORKING | List, detail, create, edit, delete, search |
| Authentication | WORKING | PKCE flow, RBAC (FOUNDER/STAFF/CLIENT/ADMIN) |
| Workspace Isolation | WORKING | All queries scoped by workspace_id, RLS enforced |
| AI Agent System | WORKING | Plan, execute, approve, monitor with safety checks |
| Cognitive Twin | WORKING | Portfolio health, digests, decision support |
| Autopilot | WORKING | Playbook execution, approval/skip actions |
| Benchmarks | WORKING | Cross-tenant percentile analysis |
| Client Portal | WORKING | Invite-only client access, project tracking |
| Security | WORKING | CSP, HSTS, rate limiting, CSRF, input sanitization |
| Monitoring | WORKING | Health checks, APM, autonomous monitor, Prometheus |
| Database Schema | WORKING | 15+ tables, RLS, connection pooling |
| Email API (backend) | WORKING | Multi-provider failover (SendGrid/Resend/Gmail) |
| Campaign API (backend) | WORKING | CRUD, drip campaigns, enrollment, processing |

### What's MISSING or STUB (Must Build)

| Gap | Priority | Effort | Impact |
|-----|----------|--------|--------|
| **Deal/Pipeline Management** | P0 - Critical | 3 days | Core CRM feature |
| **Wire Email UI to Gmail** | P0 - Critical | 2 days | Email is the heart of CRM |
| **Wire Campaign UI to API** | P1 - High | 2 days | Backend exists, frontend shows "Coming Soon" |
| **Wire Tasks to Database** | P1 - High | 1 day | UI exists with mock data |
| **Wire Analytics to Real Data** | P1 - High | 2 days | Dashboard shows hardcoded values |
| **Contact Import/Export** | P1 - High | 1 day | No bulk operations |
| **Activity Timeline** | P2 - Medium | 2 days | Contact detail says "coming soon" |
| **Wire Businesses to DB** | P2 - Medium | 1 day | Founder page uses mock data |
| **Wire AI Phill to Orchestrator** | P2 - Medium | 2 days | Chat UI exists, no AI connected |
| **CI/CD Pipeline** | P1 - High | 1 day | No automated testing/deployment |
| **Dockerfile + docker-compose** | P2 - Medium | 0.5 day | Self-hosted deployment option |

---

## The Finish Line: 6 Phases (14 days total)

### Phase A: Deal Pipeline (Days 1-3) - THE MISSING CORE

The biggest gap. A CRM without deals/pipeline is just a contact list.

### Phase B: Email Integration (Days 4-5) - WIRE THE HEART

Gmail sync works at API level. Need to wire the email dashboard to show real emails, compose, and track.

### Phase C: Campaign & Drip Builder (Days 6-7) - ACTIVATE MARKETING

Backend API is complete. Replace "Coming Soon" with a real campaign builder UI.

### Phase D: Tasks, Activity & Analytics (Days 8-10) - WIRE TO REAL DATA

Three features that exist as UI shells with mock data. Wire them to the database.

### Phase E: Business Portfolio & AI Phill (Days 11-12) - FOUNDER INTELLIGENCE

Wire the founder features to real data and connect AI Phill to the orchestrator.

### Phase F: Production Hardening (Days 13-14) - SHIP IT

CI/CD, Docker, load testing, final audit.

---

## Phase A: Deal Pipeline Management (3 days)

> **WHY:** A CRM without deal tracking is just a Rolodex. This is the #1 missing feature.

### Task A1: Database Schema for Deals & Pipeline

**Files:**
- Create: `supabase/migrations/320_deal_pipeline_schema.sql`

**Step 1: Write the migration SQL**

```sql
-- Pipeline stages (customizable per workspace)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  is_won BOOLEAN DEFAULT FALSE,
  is_lost BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals (the core entity)
CREATE TABLE IF NOT EXISTS deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  value DECIMAL(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'AUD',
  probability INT DEFAULT 50 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  actual_close_date DATE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost', 'abandoned')),
  notes TEXT,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  assigned_to UUID,
  source TEXT, -- referral, inbound, outbound, website, etc.
  lost_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal activities (interaction log)
CREATE TABLE IF NOT EXISTS deal_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'note', 'email', 'call', 'meeting', 'task', 'stage_change', 'value_change', 'status_change'
  )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_deals_workspace ON deals(workspace_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_deals_status ON deals(status);
CREATE INDEX idx_deal_activities_deal ON deal_activities(deal_id);
CREATE INDEX idx_pipeline_stages_workspace ON pipeline_stages(workspace_id);

-- RLS Policies
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_isolation" ON pipeline_stages
  FOR ALL USING (workspace_id = (SELECT workspace_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "workspace_isolation" ON deals
  FOR ALL USING (workspace_id = (SELECT workspace_id FROM user_profiles WHERE user_id = auth.uid()));

CREATE POLICY "workspace_isolation" ON deal_activities
  FOR ALL USING (workspace_id = (SELECT workspace_id FROM user_profiles WHERE user_id = auth.uid()));

-- Seed default pipeline stages per workspace (trigger)
CREATE OR REPLACE FUNCTION create_default_pipeline_stages()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO pipeline_stages (workspace_id, name, position, color) VALUES
    (NEW.id, 'Lead', 0, '#94A3B8'),
    (NEW.id, 'Qualified', 1, '#3B82F6'),
    (NEW.id, 'Proposal', 2, '#8B5CF6'),
    (NEW.id, 'Negotiation', 3, '#F59E0B'),
    (NEW.id, 'Won', 4, '#10B981'),
    (NEW.id, 'Lost', 5, '#EF4444');

  -- Mark won/lost stages
  UPDATE pipeline_stages SET is_won = TRUE WHERE workspace_id = NEW.id AND name = 'Won';
  UPDATE pipeline_stages SET is_lost = TRUE WHERE workspace_id = NEW.id AND name = 'Lost';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Only create trigger if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'auto_create_pipeline_stages') THEN
    CREATE TRIGGER auto_create_pipeline_stages
      AFTER INSERT ON organizations
      FOR EACH ROW EXECUTE FUNCTION create_default_pipeline_stages();
  END IF;
END $$;
```

**Step 2: Run migration in Supabase SQL Editor**

**Step 3: Seed existing workspaces with default stages**

```sql
-- For existing workspaces that don't have stages yet
INSERT INTO pipeline_stages (workspace_id, name, position, color, is_won, is_lost)
SELECT o.id, stage.name, stage.position, stage.color, stage.is_won, stage.is_lost
FROM organizations o
CROSS JOIN (VALUES
  ('Lead', 0, '#94A3B8', FALSE, FALSE),
  ('Qualified', 1, '#3B82F6', FALSE, FALSE),
  ('Proposal', 2, '#8B5CF6', FALSE, FALSE),
  ('Negotiation', 3, '#F59E0B', FALSE, FALSE),
  ('Won', 4, '#10B981', TRUE, FALSE),
  ('Lost', 5, '#EF4444', FALSE, TRUE)
) AS stage(name, position, color, is_won, is_lost)
WHERE NOT EXISTS (SELECT 1 FROM pipeline_stages ps WHERE ps.workspace_id = o.id);
```

**Step 4: Commit**

```bash
git add supabase/migrations/320_deal_pipeline_schema.sql
git commit -m "feat(db): add deal pipeline schema with stages, deals, activities"
```

---

### Task A2: Deal Pipeline API Routes

**Files:**
- Create: `src/app/api/deals/route.ts` (GET list, POST create)
- Create: `src/app/api/deals/[id]/route.ts` (GET detail, PATCH update, DELETE)
- Create: `src/app/api/deals/[id]/activities/route.ts` (GET activities, POST activity)
- Create: `src/app/api/pipeline/stages/route.ts` (GET stages, POST create, PATCH reorder)

**Step 1: Write the failing test**

```typescript
// tests/api/deals.test.ts
import { describe, it, expect } from 'vitest';

describe('Deals API', () => {
  it('should list deals for workspace', async () => {
    const res = await fetch('/api/deals?workspaceId=test-ws');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/api/deals.test.ts`
Expected: FAIL

**Step 3: Implement deals CRUD API**

Each route follows the existing pattern from `/api/contacts/route.ts`:
- Import `validateUserAndWorkspace` from `@/lib/workspace-validation`
- Import helpers from `@/lib/api-helpers`
- All queries scoped by `workspace_id`
- Proper error handling with try/catch
- Support pagination, filtering, sorting

Key endpoints:
- `GET /api/deals` - List deals with filters (stage, status, contact, value range, date range)
- `POST /api/deals` - Create deal (auto-log "deal created" activity)
- `GET /api/deals/[id]` - Get deal with contact info and recent activities
- `PATCH /api/deals/[id]` - Update deal (auto-log stage/value/status changes)
- `DELETE /api/deals/[id]` - Soft delete deal
- `GET /api/deals/[id]/activities` - Activity timeline
- `POST /api/deals/[id]/activities` - Add note/call/meeting log
- `GET /api/pipeline/stages` - Get pipeline stages for workspace
- `PATCH /api/pipeline/stages` - Reorder or rename stages

**Step 4: Run tests, verify pass**

**Step 5: Commit**

```bash
git add src/app/api/deals/ src/app/api/pipeline/ tests/api/deals.test.ts
git commit -m "feat(api): add deal pipeline CRUD with activity logging"
```

---

### Task A3: Pipeline Kanban Board UI

**Files:**
- Create: `src/app/dashboard/deals/page.tsx` (kanban board)
- Create: `src/app/dashboard/deals/[id]/page.tsx` (deal detail)
- Create: `src/components/deals/DealCard.tsx`
- Create: `src/components/deals/PipelineBoard.tsx`
- Create: `src/components/deals/CreateDealModal.tsx`
- Create: `src/components/deals/DealActivityTimeline.tsx`
- Modify: `src/app/dashboard/layout.tsx` (add Deals to navigation)

**Step 1: Build PipelineBoard component**

Kanban-style board with columns per stage:
- Drag & drop between columns (uses `@dnd-kit/core` or simple drag API)
- Deal cards show: title, value, contact name, probability, days in stage
- Column headers show: stage name, deal count, total value
- Color-coded by stage
- "Add Deal" button on each column

**Step 2: Build CreateDealModal**

Form fields: title, value, currency, contact (searchable dropdown), stage, probability, expected close date, source, notes

**Step 3: Build DealDetail page**

Tabs: Overview, Activity, Emails, Notes
- Overview: deal info, contact card, stage progression bar
- Activity: timeline of all interactions (auto-logged + manual)
- Emails: linked email threads
- Notes: rich text notes

**Step 4: Add to dashboard navigation**

Add "Deals" link between "CRM" dropdown items:
```tsx
<DropdownMenuItem asChild className="text-slate-300 hover:text-white">
  <Link href="/dashboard/deals" className="w-full">Deals Pipeline</Link>
</DropdownMenuItem>
```

**Step 5: Commit**

```bash
git add src/app/dashboard/deals/ src/components/deals/
git commit -m "feat(ui): add deal pipeline kanban board with drag-drop"
```

---

### Task A4: Pipeline Analytics Widget

**Files:**
- Create: `src/components/deals/PipelineMetrics.tsx`
- Modify: `src/app/dashboard/overview/page.tsx` (add pipeline widget)

**Step 1: Build pipeline metrics component**

Displays:
- Total pipeline value (sum of all open deals)
- Weighted pipeline (value * probability)
- Deals by stage (bar chart)
- Win rate (won / (won + lost) last 30 days)
- Average deal size
- Average days to close

**Step 2: Add to dashboard overview**

**Step 3: Commit**

```bash
git add src/components/deals/PipelineMetrics.tsx
git commit -m "feat(ui): add pipeline metrics widget to dashboard"
```

---

## Phase B: Email Integration (2 days)

> **WHY:** Email is how you communicate with contacts. The backend works but the UI shows mock data.

### Task B1: Wire Email Dashboard to Gmail API

**Files:**
- Modify: `src/app/dashboard/emails/page.tsx` (replace mock data with API calls)
- Create: `src/hooks/useEmails.ts` (email data hook)

**Step 1: Create useEmails hook**

```typescript
// Fetches from /api/integrations/gmail/messages
// Supports: inbox, sent, starred, scheduled
// Pagination, search, filtering
// Real-time refresh
```

**Step 2: Update email dashboard to use real data**

Replace hardcoded stats (47 sent, 23 inbox) with actual counts from Gmail API.
Show real email list with sender, subject, preview, date, read status.

**Step 3: Commit**

---

### Task B2: Email Compose & Send

**Files:**
- Modify: `src/components/email/SendEmailModal.tsx` (enhance compose UI)
- Create: `src/app/api/emails/send/route.ts` (send via multi-provider)

**Step 1: Enhance compose modal**

- Rich text editor (existing tiptap dependency)
- Contact autocomplete (from contacts API)
- Template selection (from email templates)
- Attachment support
- CC/BCC fields
- Schedule send option

**Step 2: Wire to send API**

Uses existing multi-provider email service (SendGrid -> Resend -> Gmail SMTP).

**Step 3: Commit**

---

### Task B3: Email Tracking & Analytics

**Files:**
- Create: `src/app/api/emails/track/route.ts` (tracking pixel + link redirect)
- Modify: `src/app/dashboard/emails/page.tsx` (show open/click stats)

**Step 1: Implement tracking pixel endpoint**

1x1 transparent PNG returned on GET, logs open event to `client_emails` table.

**Step 2: Implement click tracking**

Redirect endpoint that logs click, then redirects to original URL.

**Step 3: Show tracking stats in email dashboard**

Open rates, click rates, per-email tracking status.

**Step 4: Commit**

---

## Phase C: Campaign Builder UI (2 days)

> **WHY:** Backend API is complete with drip campaigns, enrollment, processing. Frontend shows "Coming Soon".

### Task C1: Replace "Coming Soon" with Campaign List

**Files:**
- Modify: `src/app/dashboard/campaigns/page.tsx` (full rewrite)
- Create: `src/hooks/useCampaigns.ts`

**Step 1: Build campaign list page**

Shows all campaigns with: name, status, type (email/drip/A-B), contacts enrolled, open rate, click rate, created date.
Filters: status (draft/active/paused/completed), type.
Actions: create, edit, pause, resume, delete.

**Step 2: Commit**

---

### Task C2: Drip Campaign Visual Builder

**Files:**
- Modify: `src/app/dashboard/drip-campaigns/page.tsx` (wire to real data)
- Create: `src/components/campaigns/DripBuilder.tsx`
- Create: `src/components/campaigns/StepEditor.tsx`

**Step 1: Replace mock campaigns with API data**

Fetch from `/api/campaigns/drip` (already implemented).

**Step 2: Build visual step editor**

- Vertical flow: Step 1 -> Wait -> Step 2 -> Condition -> Step 3a / Step 3b
- Step types: Send Email, Wait (days/hours), Condition (opened? clicked?), End
- Drag to reorder steps
- Each step configurable (template, wait duration, condition logic)
- Enroll contacts dialog (select from contact list or segment)

**Step 3: Commit**

---

### Task C3: Campaign Analytics Dashboard

**Files:**
- Create: `src/app/dashboard/campaigns/[id]/page.tsx` (campaign detail/analytics)
- Create: `src/components/campaigns/CampaignAnalytics.tsx`

**Step 1: Build campaign detail page**

Tabs: Overview, Steps, Contacts, Analytics
- Overview: campaign info, status, key metrics
- Steps: visual flow of campaign steps with per-step metrics
- Contacts: enrolled contacts with status (active/completed/bounced)
- Analytics: open rate, click rate, conversion, revenue attributed

**Step 2: Commit**

---

## Phase D: Tasks, Activity & Analytics (3 days)

> **WHY:** Three features that exist as UI shells with mock data.

### Task D1: Wire Tasks to Database

**Files:**
- Modify: `src/app/dashboard/tasks/page.tsx` (replace mock data)
- Create: `src/app/api/tasks/route.ts` (if not exists, or wire to existing)
- Create: `src/hooks/useTasks.ts`

The `tasks` table already exists in the database. Steps:

**Step 1: Create tasks API (CRUD)**

```
GET /api/tasks?workspaceId=X&status=pending&assignedTo=Y
POST /api/tasks (title, description, priority, due_date, assigned_to, contact_id, deal_id)
PATCH /api/tasks/[id] (update status, reassign, etc.)
DELETE /api/tasks/[id]
```

**Step 2: Wire dashboard page to real data**

Replace mock 5 tasks with paginated task list from API.
Add: create task modal, inline status toggle, priority badges, due date sorting.

**Step 3: Link tasks to contacts and deals**

Tasks can be associated with a contact or deal. Show related tasks on contact/deal detail pages.

**Step 4: Commit**

---

### Task D2: Activity Timeline

**Files:**
- Create: `src/app/api/activities/route.ts` (unified activity feed)
- Create: `src/components/activity/ActivityTimeline.tsx`
- Modify: `src/app/dashboard/contacts/[id]/page.tsx` (replace "coming soon")

**Step 1: Create activities API**

Aggregates from multiple sources:
- `deal_activities` (deal stage changes, notes)
- `client_emails` (emails sent/received)
- `tasks` (task completions)
- `campaign_enrollments` (campaign events)

Returns unified, chronological feed per contact.

**Step 2: Build ActivityTimeline component**

Visual timeline with icons per activity type:
- Email: envelope icon, subject + snippet
- Call: phone icon, duration + notes
- Meeting: calendar icon, title + attendees
- Note: sticky note icon, text
- Stage change: arrow icon, from -> to
- Task: checkbox icon, title + status

**Step 3: Replace "coming soon" on contact detail**

Wire Activity tab to real `ActivityTimeline` component.

**Step 4: Commit**

---

### Task D3: Wire Analytics Dashboard to Real Data

**Files:**
- Modify: `src/app/dashboard/analytics/page.tsx` (replace hardcoded values)
- Create: `src/app/api/analytics/dashboard/route.ts`
- Create: `src/hooks/useAnalytics.ts`

**Step 1: Create analytics API endpoint**

Aggregates real metrics:
- Total contacts (from contacts table)
- New contacts this month (created_at filter)
- Active campaigns (from campaigns table, status = 'active')
- Email stats (from client_emails - sent, opened, clicked)
- Pipeline value (from deals - sum of open deal values)
- Win rate (won deals / total closed deals)
- Lead score distribution (from contacts.ai_score)

**Step 2: Replace hardcoded values on analytics page**

Remove: `Total Visitors: 12,543` (fake)
Add: real metrics from the analytics API.

Charts:
- Contact growth (line chart, last 12 months)
- Pipeline funnel (bar chart by stage)
- Email performance (line chart, open/click rates over time)
- Top contacts by AI score (leaderboard)

**Step 3: Commit**

---

## Phase E: Business Portfolio & AI Phill (2 days)

> **WHY:** The founder needs to manage multiple businesses and have an AI advisor.

### Task E1: Wire Businesses to Database

**Files:**
- Modify: `src/app/founder/businesses/page.tsx` (replace mock data)
- Create: `src/app/api/founder/businesses/route.ts` (CRUD)

**Step 1: Create businesses API**

Uses existing `organizations` table or a new `businesses` table if the founder manages external businesses.

**Step 2: Replace mock businesses with real data**

Wire the search, filter, health scores to real API responses.

**Step 3: Commit**

---

### Task E2: Connect AI Phill to Orchestrator

**Files:**
- Modify: `src/app/founder/ai-phill/page.tsx` (replace mock chat)
- Create: `src/app/api/founder/ai-phill/chat/route.ts`

**Step 1: Create AI Phill chat endpoint**

Uses Claude Sonnet 4.5 with system prompt containing:
- Founder's business context (from businesses table)
- Recent activity summary (from activity feed)
- Current pipeline status (from deals)
- Pending tasks and decisions

Streaming response via `ReadableStream`.

**Step 2: Wire chat UI to real API**

Replace `TODO: Replace with actual API call` with fetch to `/api/founder/ai-phill/chat`.
Add conversation history persistence to database.

**Step 3: Commit**

---

### Task E3: Wire Insights & Journal

**Files:**
- Modify: `src/app/founder/insights/page.tsx` (replace mock insights)
- Modify: `src/app/founder/journal/page.tsx` (add persistence)
- Create: `src/app/api/founder/insights/route.ts`
- Create: `src/app/api/founder/journal/route.ts`

**Step 1: Create insights API**

AI-generated insights from:
- Pipeline trends (new deals, stage velocity, win rate changes)
- Contact engagement (email response rates, meeting frequency)
- Revenue signals (deal value trends, forecast accuracy)

Uses Claude Haiku for fast insight generation.

**Step 2: Create journal API**

Simple CRUD for founder journal entries with tags.

**Step 3: Wire both pages to APIs**

**Step 4: Commit**

---

## Phase F: Production Hardening (2 days)

> **WHY:** Ship with confidence.

### Task F1: Contact Import/Export

**Files:**
- Create: `src/app/api/contacts/import/route.ts` (CSV import)
- Create: `src/app/api/contacts/export/route.ts` (CSV export)
- Create: `src/components/contacts/ImportModal.tsx`

**Step 1: Build CSV import**

Upload CSV -> parse -> validate -> bulk insert.
Column mapping UI: map CSV headers to contact fields.
Duplicate detection by email.

**Step 2: Build CSV export**

Export all/filtered contacts as CSV with selected fields.

**Step 3: Commit**

---

### Task F2: CI/CD Pipeline

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/deploy.yml`

**Step 1: Create CI workflow**

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build
      - run: npm test
```

**Step 2: Create deploy workflow**

Vercel deployment on push to main.

**Step 3: Commit**

---

### Task F3: Docker Configuration

**Files:**
- Create: `Dockerfile`
- Create: `docker-compose.yml`
- Create: `.dockerignore`

**Step 1: Create multi-stage Dockerfile**

```dockerfile
FROM node:20-alpine AS base
FROM base AS deps
COPY package*.json ./
RUN npm ci --production

FROM base AS builder
COPY . .
RUN npm run build

FROM base AS runner
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
EXPOSE 3008
CMD ["npm", "start"]
```

**Step 2: Create docker-compose for local dev**

Services: app, redis, postgres (optional local Supabase)

**Step 3: Commit**

---

### Task F4: Final Production Audit

**Files:**
- No new files

**Step 1: Run full test suite**

```bash
npm test && npm run build
```

**Step 2: Verify all navigation links work**

Run through every nav link in dashboard, founder, synthex layouts.

**Step 3: Load test critical endpoints**

```bash
npx k6 run tests/load/critical-paths.js
```

**Step 4: Security audit**

- Verify all API routes have auth
- Check for exposed env vars
- Validate CSP headers
- Test rate limiting

**Step 5: Final commit and tag**

```bash
git tag -a v1.0.0 -m "Unite-Hub Personal CRM - Production Release"
```

---

## Priority Order (What to build first)

If time is limited, build in this order for maximum impact:

1. **Phase A: Deal Pipeline** (3 days) - Transforms from contact list to real CRM
2. **Phase D3: Analytics** (1 day) - Dashboard shows real data instead of fakes
3. **Phase D1: Tasks** (1 day) - Quick win, UI exists, just wire to DB
4. **Phase B1: Email Dashboard** (1 day) - Show real emails
5. **Phase C1: Campaign List** (1 day) - Replace "Coming Soon"
6. **Phase D2: Activity Timeline** (1 day) - Replace "coming soon" on contacts
7. **Phase F1: Import/Export** (1 day) - Essential for onboarding
8. **Phase E2: AI Phill** (1 day) - Connect the AI brain
9. **Phase F2-F3: CI/CD + Docker** (1 day) - Ship infrastructure
10. Everything else

---

## Success Metrics

When this plan is complete, the founder should be able to:

- [ ] Open the dashboard and see REAL metrics (contacts, pipeline, email stats)
- [ ] Manage deals through a visual kanban pipeline (drag between stages)
- [ ] Send/receive emails directly from the CRM
- [ ] Create and run drip email campaigns
- [ ] Assign and track tasks linked to contacts and deals
- [ ] See a complete activity timeline for every contact
- [ ] Import contacts from CSV and export for backup
- [ ] Ask AI Phill for business advice with real context
- [ ] View analytics based on actual data, not hardcoded numbers
- [ ] Deploy with one command (`git push` to main)

**That's the finish line. Everything above this is a fully working Personal CRM.**

---

## Architecture Diagram

```
                    +------------------+
                    |   Next.js 16     |
                    |   App Router     |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v--+   +------v-----+  +-----v------+
     | Dashboard  |   |  Founder   |  |  Synthex   |
     | (Staff)    |   |  (Owner)   |  |  (Client)  |
     +--------+---+   +------+-----+  +-----+------+
              |              |              |
              +--------------+--------------+
                             |
                    +--------v---------+
                    |  API Routes (104) |
                    |  + New Deal APIs  |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
     +--------v--+   +------v-----+  +-----v------+
     | Supabase   |   |  Claude    |  |   Redis    |
     | PostgreSQL |   |  AI Layer  |  |   Cache    |
     | (15+ tbl)  |   |  (3 mdls)  |  |            |
     +------------+   +------------+  +------------+
```

---

## File Inventory: New Files to Create

```
supabase/migrations/320_deal_pipeline_schema.sql
src/app/api/deals/route.ts
src/app/api/deals/[id]/route.ts
src/app/api/deals/[id]/activities/route.ts
src/app/api/pipeline/stages/route.ts
src/app/api/tasks/route.ts (if not exists)
src/app/api/activities/route.ts
src/app/api/analytics/dashboard/route.ts
src/app/api/emails/send/route.ts
src/app/api/emails/track/route.ts
src/app/api/contacts/import/route.ts
src/app/api/contacts/export/route.ts
src/app/api/founder/businesses/route.ts
src/app/api/founder/ai-phill/chat/route.ts
src/app/api/founder/insights/route.ts
src/app/api/founder/journal/route.ts
src/app/dashboard/deals/page.tsx
src/app/dashboard/deals/[id]/page.tsx
src/app/dashboard/campaigns/[id]/page.tsx
src/components/deals/DealCard.tsx
src/components/deals/PipelineBoard.tsx
src/components/deals/CreateDealModal.tsx
src/components/deals/DealActivityTimeline.tsx
src/components/deals/PipelineMetrics.tsx
src/components/campaigns/DripBuilder.tsx
src/components/campaigns/StepEditor.tsx
src/components/campaigns/CampaignAnalytics.tsx
src/components/activity/ActivityTimeline.tsx
src/components/contacts/ImportModal.tsx
src/hooks/useEmails.ts
src/hooks/useCampaigns.ts
src/hooks/useTasks.ts
src/hooks/useAnalytics.ts
tests/api/deals.test.ts
.github/workflows/ci.yml
.github/workflows/deploy.yml
Dockerfile
docker-compose.yml
.dockerignore
```

**Total: ~38 new files + ~12 modified files = 50 file changes**

---

*Plan created: 2026-02-14*
*Estimated total effort: 14 working days*
*Priority completion (P0+P1 only): 10 days*
