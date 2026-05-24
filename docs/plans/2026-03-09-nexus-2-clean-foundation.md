# Phase 2: Clean Foundation — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Strip the codebase to a working skeleton — auth + layout + health endpoint — replace 455 migrations with 1 clean baseline + Nexus 2.0 schema, and verify a green build.

**Architecture:** New `rebuild/nexus-2.0` branch from `main`. All of `src/` deleted except: auth routes, layout shell, Supabase lib (4 files), shadcn/ui base components, middleware.ts, and types/. Single-tenant schema: `founder_id = auth.uid()` on all 9 tables. No workspace_id (this is a private single-user tool).

**Tech Stack:** Next.js 16 App Router, Supabase PKCE (createServerClient), shadcn/ui, TypeScript strict, pnpm@9.15.0, Turbo monorepo, Supabase CLI, GitHub Actions

---

## Pre-flight Checks (run before starting)

```bash
cd /c/Unite-Group
git status          # must be clean
git branch          # must be on main
pnpm build 2>&1 | tail -5   # confirm current build state
```

---

### Task 1: Create the rebuild branch

**Files:** No file changes — git operation only

**Step 1: Create and switch to rebuild branch**

```bash
git checkout -b rebuild/nexus-2.0
```

Expected output: `Switched to a new branch 'rebuild/nexus-2.0'`

**Step 2: Verify branch**

```bash
git branch --show-current
```

Expected: `rebuild/nexus-2.0`

**Step 3: Commit branch marker**

```bash
git commit --allow-empty -m "chore: initialise rebuild/nexus-2.0 branch — Phase 2 Clean Foundation"
```

---

### Task 2: Fix CRITICAL — remove placeholder-key from cost-monitor.ts

**Files:**
- Modify: `src/lib/ai/cost-monitor.ts` (line ~14)

**Step 1: Read the file to confirm the exact line**

Read `src/lib/ai/cost-monitor.ts` lines 10–20.

**Step 2: Remove the `|| 'placeholder-key'` fallback**

Find the pattern:
```typescript
process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
```

Replace with:
```typescript
process.env.SUPABASE_SERVICE_ROLE_KEY!
```

**Step 3: Verify zero remaining instances**

```bash
grep -r "placeholder-key" src/ --include="*.ts" --include="*.tsx"
```

Expected: no output

**Step 4: Commit**

```bash
git add src/lib/ai/cost-monitor.ts
git commit -m "fix(security): remove placeholder-key fallback — CRITICAL security fix"
```

---

### Task 3: Delete 5 test route directories

**Files:**
- Delete: `src/app/api/test/`
- Delete: `src/app/api/test-sentry/`
- Delete: `src/app/api/test-rate-limit/`
- Delete: `src/app/api/test-questionnaire/`
- Delete: `src/app/api/test-opus-4-5/`

**Step 1: Confirm the directories exist**

```bash
find src/app/api -maxdepth 1 -type d -name "test*"
```

Expected: 5 directories listed

**Step 2: Delete via git rm**

```bash
git rm -rf \
  src/app/api/test \
  src/app/api/test-sentry \
  src/app/api/test-rate-limit \
  src/app/api/test-questionnaire \
  src/app/api/test-opus-4-5
```

**Step 3: Commit**

```bash
git commit -m "chore: remove 5 test route directories from production API namespace"
```

---

### Task 4: Clean root markdown artefacts + add .gitignore guard

**Files:**
- Delete: all `*.md` in repo root EXCEPT `README.md`, `CHANGELOG.md`, `CLAUDE.md`
- Modify: `.gitignore`

**Step 1: Count current root .md files**

```bash
find . -maxdepth 1 -name "*.md" | wc -l
```

Expected: ~529

**Step 2: Confirm the 3 keepers exist**

```bash
ls README.md CHANGELOG.md CLAUDE.md
```

**Step 3: Delete all root .md except keepers**

```bash
find . -maxdepth 1 -name "*.md" \
  ! -name "README.md" \
  ! -name "CHANGELOG.md" \
  ! -name "CLAUDE.md" \
  -exec git rm {} \;
```

Expected: hundreds of `rm` lines

**Step 4: Verify only 3 .md files remain in root**

```bash
find . -maxdepth 1 -name "*.md" | sort
```

Expected: exactly 3 files

**Step 5: Add .gitignore patterns to prevent recurrence**

Append to `.gitignore`:
```
# AI session artefact guard — never commit root *.md
/*.md
!/README.md
!/CHANGELOG.md
!/CLAUDE.md
```

**Step 6: Commit**

```bash
git add .gitignore
git commit -m "chore: remove 524 AI artefact .md files from repo root + gitignore guard"
```

---

### Task 5: Strip src/ to clean skeleton

> **HIGH RISK — read all steps before executing. The backup in Step 2 is your safety net.**
> Keep list: middleware.ts, app/layout.tsx, app/globals.css, app/page.tsx, app/not-found.tsx,
> app/global-error.tsx, app/(auth)/**, lib/supabase/**, components/ui/**, types/**

**Step 1: Verify the entire keep list exists**

```bash
ls -la \
  src/middleware.ts \
  src/app/layout.tsx \
  src/app/globals.css \
  src/app/page.tsx \
  2>/dev/null && echo "Core files exist"

ls src/app/'(auth)'/ && echo "(auth) routes exist"
ls src/lib/supabase/ && echo "supabase lib exists"
ls src/components/ui/ && echo "shadcn/ui base exists"
```

All commands must show files. If any fail, STOP and investigate before proceeding.

**Step 2: Back up the keep list to a temp location**

```bash
mkdir -p /tmp/nexus-skeleton/app/auth-group
mkdir -p /tmp/nexus-skeleton/lib
mkdir -p /tmp/nexus-skeleton/components
mkdir -p /tmp/nexus-skeleton/types

cp src/middleware.ts /tmp/nexus-skeleton/
cp src/app/layout.tsx /tmp/nexus-skeleton/app/
cp src/app/globals.css /tmp/nexus-skeleton/app/
cp src/app/page.tsx /tmp/nexus-skeleton/app/
cp src/app/not-found.tsx /tmp/nexus-skeleton/app/ 2>/dev/null || true
cp src/app/global-error.tsx /tmp/nexus-skeleton/app/ 2>/dev/null || true
cp -r "src/app/(auth)/." /tmp/nexus-skeleton/app/auth-group/
cp -r src/lib/supabase /tmp/nexus-skeleton/lib/
cp -r src/components/ui /tmp/nexus-skeleton/components/
cp -r src/types/. /tmp/nexus-skeleton/types/ 2>/dev/null || true
```

**Step 3: Verify backup is complete**

```bash
find /tmp/nexus-skeleton -type f | sort
```

Expected: middleware.ts, layout.tsx, globals.css, page.tsx, supabase lib files, ui component files

**Step 4: Remove entire src/ from git tracking**

```bash
git rm -rf src/
```

Expected: thousands of `rm 'src/...'` lines. This will take 30–60 seconds.

**Step 5: Recreate skeleton directory structure**

```bash
mkdir -p src/app/'(auth)'/login
mkdir -p src/app/'(auth)'/callback
mkdir -p src/app/'(dashboard)'
mkdir -p src/app/api/health
mkdir -p src/lib/supabase
mkdir -p src/components/ui
mkdir -p src/types
```

**Step 6: Restore keep list from backup**

```bash
cp /tmp/nexus-skeleton/middleware.ts src/
cp /tmp/nexus-skeleton/app/layout.tsx src/app/
cp /tmp/nexus-skeleton/app/globals.css src/app/
cp /tmp/nexus-skeleton/app/page.tsx src/app/
cp /tmp/nexus-skeleton/app/not-found.tsx src/app/ 2>/dev/null || true
cp /tmp/nexus-skeleton/app/global-error.tsx src/app/ 2>/dev/null || true
cp -r /tmp/nexus-skeleton/app/auth-group/. "src/app/(auth)/"
cp -r /tmp/nexus-skeleton/lib/supabase/. src/lib/supabase/
cp -r /tmp/nexus-skeleton/components/ui/. src/components/ui/
cp -r /tmp/nexus-skeleton/types/. src/types/ 2>/dev/null || true
```

**Step 7: Verify skeleton file count (should be small)**

```bash
find src/ -type f | sort
```

Expected: ~20–40 files total (middleware.ts, layout, globals, page, auth routes, 4 supabase lib files, ui components, types)

**Step 8: Stage restored files**

```bash
git add src/
```

**Step 9: Commit skeleton**

```bash
git commit -m "feat: strip src/ to clean skeleton — auth + layout + supabase lib + shadcn/ui"
```

---

### Task 6: Create /api/health endpoint

**Files:**
- Create: `src/app/api/health/route.ts`

**Step 1: Write the health endpoint**

Create `src/app/api/health/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export async function GET() {
  const connections: Record<string, string> = {};

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Route handlers cannot set cookies
            }
          },
        },
      }
    );

    // Ping Supabase — PGRST116 means table exists but is empty (still a connection)
    const { error } = await supabase
      .from("nexus_pages")
      .select("id")
      .limit(1)
      .maybeSingle();

    connections.supabase =
      !error || error.code === "PGRST116" ? "ok" : "error";
  } catch {
    connections.supabase = "error";
  }

  const allOk = Object.values(connections).every((v) => v === "ok");

  return NextResponse.json(
    {
      status: allOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      connections,
    },
    { status: allOk ? 200 : 503 }
  );
}
```

**Step 2: Commit**

```bash
git add src/app/api/health/route.ts
git commit -m "feat(api): /api/health endpoint with Supabase connection check"
```

---

### Task 7: Archive existing migrations

**Files:**
- Create: `supabase/migrations/_archive/README.md`
- Move: all `*.sql` in `supabase/migrations/` → `supabase/migrations/_archive/`

**Step 1: Count live migrations**

```bash
find supabase/migrations -maxdepth 1 -name "*.sql" | wc -l
```

Expected: 417–455

**Step 2: Create archive directory**

```bash
mkdir -p supabase/migrations/_archive
```

**Step 3: Move all existing .sql migrations to archive**

```bash
find supabase/migrations -maxdepth 1 -name "*.sql" -exec git mv {} supabase/migrations/_archive/ \;
```

Expected: hundreds of `rename` lines

**Step 4: Write archive README**

Create `supabase/migrations/_archive/README.md`:
```markdown
# Archived Migrations — v1

These 455 migration files were accumulated during v1 development (2024–2026).
Archived 09/03/2026 as part of the Nexus 2.0 rebuild.

**DO NOT replay these migrations.** They contain conflicts, duplicate sequence
numbers, experimental SQL, and test migrations. The Nexus 2.0 baseline schema
replaces all of them.

See `../20260309000000_nexus_schema.sql` for the clean baseline.
```

**Step 5: Commit archive**

```bash
git add supabase/migrations/
git commit -m "chore(db): archive 455 v1 migrations — Nexus 2.0 baseline replaces them"
```

---

### Task 8: Create Nexus 2.0 schema migration

**Files:**
- Create: `supabase/migrations/20260309000000_nexus_schema.sql`

**Step 1: Write the schema migration**

Create `supabase/migrations/20260309000000_nexus_schema.sql`:
```sql
-- ============================================================
-- Nexus 2.0 Schema — Clean Baseline
-- Date: 09/03/2026
-- Auth: Single-tenant, founder_id = auth.uid()
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- BUSINESSES
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL,
  domain      TEXT,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'inactive', 'archived')),
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, slug)
);

-- ============================================================
-- CONTACTS
-- ============================================================
CREATE TABLE IF NOT EXISTS contacts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  first_name  TEXT,
  last_name   TEXT,
  email       TEXT,
  phone       TEXT,
  company     TEXT,
  role        TEXT,
  status      TEXT NOT NULL DEFAULT 'lead'
              CHECK (status IN ('lead', 'prospect', 'client', 'churned', 'archived')),
  tags        TEXT[] NOT NULL DEFAULT '{}',
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NEXUS PAGES (block editor documents)
-- ============================================================
CREATE TABLE IF NOT EXISTS nexus_pages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id   UUID REFERENCES nexus_pages(id) ON DELETE SET NULL,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  title       TEXT NOT NULL DEFAULT 'Untitled',
  icon        TEXT,
  cover_url   TEXT,
  content     JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}',
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NEXUS DATABASES (Notion-style databases)
-- ============================================================
CREATE TABLE IF NOT EXISTS nexus_databases (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  page_id     UUID REFERENCES nexus_pages(id) ON DELETE CASCADE,
  business_id UUID REFERENCES businesses(id) ON DELETE SET NULL,
  name        TEXT NOT NULL,
  schema      JSONB NOT NULL DEFAULT '{"properties":[]}',
  view_type   TEXT NOT NULL DEFAULT 'table'
              CHECK (view_type IN ('table', 'kanban', 'calendar', 'gallery')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NEXUS ROWS (database rows)
-- ============================================================
CREATE TABLE IF NOT EXISTS nexus_rows (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  database_id  UUID NOT NULL REFERENCES nexus_databases(id) ON DELETE CASCADE,
  properties   JSONB NOT NULL DEFAULT '{}',
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CREDENTIALS VAULT (AES-256-GCM encrypted)
-- ============================================================
CREATE TABLE IF NOT EXISTS credentials_vault (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id      UUID REFERENCES businesses(id) ON DELETE SET NULL,
  label            TEXT NOT NULL,
  service          TEXT NOT NULL,
  encrypted_value  TEXT NOT NULL,
  iv               TEXT NOT NULL,
  salt             TEXT NOT NULL,
  notes            TEXT,
  last_accessed_at TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- APPROVAL QUEUE (human-in-the-loop gate)
-- ============================================================
CREATE TABLE IF NOT EXISTS approval_queue (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id  UUID REFERENCES businesses(id) ON DELETE SET NULL,
  type         TEXT NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  payload      JSONB NOT NULL DEFAULT '{}',
  status       TEXT NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'approved', 'rejected', 'executed', 'expired')),
  expires_at   TIMESTAMPTZ,
  approved_at  TIMESTAMPTZ,
  executed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SOCIAL CHANNELS (OAuth tokens, per platform per business)
-- ============================================================
CREATE TABLE IF NOT EXISTS social_channels (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id              UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  platform                TEXT NOT NULL
                          CHECK (platform IN ('facebook','instagram','linkedin','tiktok','youtube','twitter')),
  channel_name            TEXT NOT NULL,
  channel_id              TEXT,
  access_token_encrypted  TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at        TIMESTAMPTZ,
  is_connected            BOOLEAN NOT NULL DEFAULT FALSE,
  metadata                JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, business_id, platform)
);

-- ============================================================
-- CONNECTED PROJECTS (Linear/GitHub/Jira sync)
-- ============================================================
CREATE TABLE IF NOT EXISTS connected_projects (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id            UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id           UUID REFERENCES businesses(id) ON DELETE SET NULL,
  provider              TEXT NOT NULL CHECK (provider IN ('linear', 'github', 'jira')),
  provider_project_id   TEXT NOT NULL,
  provider_project_name TEXT NOT NULL,
  sync_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  last_synced_at        TIMESTAMPTZ,
  metadata              JSONB NOT NULL DEFAULT '{}',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(founder_id, provider, provider_project_id)
);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'businesses','contacts','nexus_pages','nexus_databases',
    'nexus_rows','credentials_vault','approval_queue',
    'social_channels','connected_projects'
  ]
  LOOP
    EXECUTE format(
      'CREATE TRIGGER update_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- INDEXES (query performance)
-- ============================================================
CREATE INDEX idx_businesses_founder_id ON businesses(founder_id);
CREATE INDEX idx_contacts_founder_id ON contacts(founder_id);
CREATE INDEX idx_contacts_business_id ON contacts(business_id);
CREATE INDEX idx_nexus_pages_founder_id ON nexus_pages(founder_id);
CREATE INDEX idx_nexus_pages_parent_id ON nexus_pages(parent_id);
CREATE INDEX idx_nexus_rows_database_id ON nexus_rows(database_id);
CREATE INDEX idx_approval_queue_founder_status ON approval_queue(founder_id, status);
CREATE INDEX idx_social_channels_business ON social_channels(business_id);
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260309000000_nexus_schema.sql
git commit -m "feat(db): Nexus 2.0 schema — 9 tables, indexes, updated_at triggers"
```

---

### Task 9: Create RLS policies migration

**Files:**
- Create: `supabase/migrations/20260309000001_rls_policies.sql`

**Step 1: Write RLS migration**

Create `supabase/migrations/20260309000001_rls_policies.sql`:
```sql
-- ============================================================
-- RLS Policies — Nexus 2.0
-- Pattern: founder_id = auth.uid() (single-tenant)
-- Date: 09/03/2026
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE nexus_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE approval_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_projects ENABLE ROW LEVEL SECURITY;

-- MACRO: full CRUD policies per table
-- SELECT: founder_id = auth.uid()
-- INSERT: founder_id = auth.uid()
-- UPDATE: founder_id = auth.uid()
-- DELETE: founder_id = auth.uid()

-- BUSINESSES
CREATE POLICY "businesses_select" ON businesses FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "businesses_insert" ON businesses FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "businesses_update" ON businesses FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "businesses_delete" ON businesses FOR DELETE USING (founder_id = auth.uid());

-- CONTACTS
CREATE POLICY "contacts_select" ON contacts FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "contacts_insert" ON contacts FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "contacts_update" ON contacts FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "contacts_delete" ON contacts FOR DELETE USING (founder_id = auth.uid());

-- NEXUS_PAGES
CREATE POLICY "nexus_pages_select" ON nexus_pages FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "nexus_pages_insert" ON nexus_pages FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_pages_update" ON nexus_pages FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_pages_delete" ON nexus_pages FOR DELETE USING (founder_id = auth.uid());

-- NEXUS_DATABASES
CREATE POLICY "nexus_databases_select" ON nexus_databases FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "nexus_databases_insert" ON nexus_databases FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_databases_update" ON nexus_databases FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_databases_delete" ON nexus_databases FOR DELETE USING (founder_id = auth.uid());

-- NEXUS_ROWS
CREATE POLICY "nexus_rows_select" ON nexus_rows FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "nexus_rows_insert" ON nexus_rows FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_rows_update" ON nexus_rows FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "nexus_rows_delete" ON nexus_rows FOR DELETE USING (founder_id = auth.uid());

-- CREDENTIALS_VAULT
CREATE POLICY "credentials_vault_select" ON credentials_vault FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "credentials_vault_insert" ON credentials_vault FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "credentials_vault_update" ON credentials_vault FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "credentials_vault_delete" ON credentials_vault FOR DELETE USING (founder_id = auth.uid());

-- APPROVAL_QUEUE
CREATE POLICY "approval_queue_select" ON approval_queue FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "approval_queue_insert" ON approval_queue FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "approval_queue_update" ON approval_queue FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "approval_queue_delete" ON approval_queue FOR DELETE USING (founder_id = auth.uid());

-- SOCIAL_CHANNELS
CREATE POLICY "social_channels_select" ON social_channels FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "social_channels_insert" ON social_channels FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "social_channels_update" ON social_channels FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "social_channels_delete" ON social_channels FOR DELETE USING (founder_id = auth.uid());

-- CONNECTED_PROJECTS
CREATE POLICY "connected_projects_select" ON connected_projects FOR SELECT USING (founder_id = auth.uid());
CREATE POLICY "connected_projects_insert" ON connected_projects FOR INSERT WITH CHECK (founder_id = auth.uid());
CREATE POLICY "connected_projects_update" ON connected_projects FOR UPDATE USING (founder_id = auth.uid()) WITH CHECK (founder_id = auth.uid());
CREATE POLICY "connected_projects_delete" ON connected_projects FOR DELETE USING (founder_id = auth.uid());
```

**Step 2: Commit**

```bash
git add supabase/migrations/20260309000001_rls_policies.sql
git commit -m "feat(db): RLS — founder_id = auth.uid() on all 9 Nexus 2.0 tables"
```

---

### Task 10: Update .env.example with all required keys

**Files:**
- Modify: `.env.example`

**Step 1: Read current .env.example**

Read `.env.example` (first 20 lines to understand current structure).

**Step 2: Overwrite with complete Nexus 2.0 env template**

Replace entire file with:
```bash
# ============================================================
# Unite-Group Nexus 2.0 — Environment Variables
# Copy to .env.local and fill in real values
# NEVER commit .env.local — it is in .gitignore
# ============================================================

# Supabase (required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Anthropic — Claude AI (required for AI features)
ANTHROPIC_API_KEY=sk-ant-xxx

# Xero — Accounting (Phase 4)
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret

# Google — Gmail + Calendar (Phase 4)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Linear — Project Management (Phase 4)
LINEAR_API_KEY=lin_api_xxx
LINEAR_WORKSPACE_ID=your-workspace-id

# Stripe — per business (Phase 4)
STRIPE_SECRET_KEY_DR=sk_live_xxx
STRIPE_WEBHOOK_SECRET_DR=whsec_xxx
STRIPE_SECRET_KEY_CARSI=sk_live_xxx
STRIPE_WEBHOOK_SECRET_CARSI=whsec_xxx
STRIPE_SECRET_KEY_RESTOREASSIST=sk_live_xxx
STRIPE_WEBHOOK_SECRET_RESTOREASSIST=whsec_xxx
STRIPE_SECRET_KEY_SYNTHEX=sk_live_xxx
STRIPE_WEBHOOK_SECRET_SYNTHEX=whsec_xxx

# Publer — Social Media scheduling (Phase 4)
PUBLER_API_KEY=your-publer-api-key

# Credentials Vault — AES-256-GCM key derivation (required for vault)
# Generate with: openssl rand -hex 32
VAULT_MASTER_KEY_SALT=your-64-char-hex-salt-here

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Step 3: Commit**

```bash
git add .env.example
git commit -m "chore(env): complete .env.example for Nexus 2.0 — all required keys documented"
```

---

### Task 11: Update vercel.json

**Files:**
- Modify: `vercel.json`

**Step 1: Read current vercel.json**

Read `vercel.json` to check current state.

**Step 2: Overwrite with clean Nexus 2.0 config**

Replace entire file with:
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "outputDirectory": ".next",
  "installCommand": "pnpm install",
  "functions": {
    "src/app/api/**/*.ts": {
      "maxDuration": 30
    },
    "src/app/api/ai/**/*.ts": {
      "maxDuration": 60
    }
  },
  "env": {
    "NEXT_PUBLIC_SUPABASE_URL": "@next_public_supabase_url",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY": "@next_public_supabase_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "@supabase_service_role_key",
    "ANTHROPIC_API_KEY": "@anthropic_api_key",
    "VAULT_MASTER_KEY_SALT": "@vault_master_key_salt",
    "NEXT_PUBLIC_APP_URL": "@next_public_app_url"
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "no-store, no-cache, must-revalidate" }
      ]
    }
  ]
}
```

**Step 3: Commit**

```bash
git add vercel.json
git commit -m "chore(vercel): clean vercel.json for Nexus 2.0"
```

---

### Task 12: Create GitHub Actions CI workflow

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: Check if directory exists**

```bash
ls .github/workflows/ 2>/dev/null && echo "exists" || echo "needs creation"
```

**Step 2: Create workflow file**

Create `.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
    branches: [main, "rebuild/nexus-2.0"]
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9.15.0

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm turbo run type-check

      - name: Lint
        run: pnpm turbo run lint

      - name: Unit tests
        run: pnpm turbo run test

      - name: Build verification
        run: pnpm build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          NEXT_PUBLIC_APP_URL: https://nexus.unite-group.com.au
```

**Step 3: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "chore(ci): GitHub Actions — type-check, lint, test, build on every push"
```

---

### Task 13: Build verification

**Step 1: Install dependencies (may need after skeleton strip)**

```bash
pnpm install
```

Expected: clean install, no errors

**Step 2: Type check**

```bash
pnpm turbo run type-check
```

Expected: 0 errors. If errors appear, fix them before proceeding.

**Step 3: Lint**

```bash
pnpm turbo run lint
```

Expected: 0 errors.

**Step 4: Build**

```bash
pnpm build
```

Expected: clean build. Health endpoint appears in routes listing.

**Step 5: Commit any build fixes**

```bash
git status
# If dirty after fixing build errors:
git add -A && git commit -m "fix: resolve build errors after skeleton strip"
# If clean:
echo "Build clean — no fixups needed"
```

---

### Task 14: QA smoke test verification

**Step 1: Start dev server in background**

```bash
pnpm dev &
DEV_PID=$!
echo "Dev server PID: $DEV_PID"
sleep 15  # wait for server to start
```

**Step 2: Test health endpoint**

```bash
curl -sf http://localhost:3000/api/health
```

Expected: `{"status":"ok","timestamp":"...","connections":{"supabase":"ok"}}`

Note: If Supabase env vars are not set locally, `connections.supabase` will be `"error"` — that is acceptable at this stage. The endpoint itself must return a 200 with valid JSON.

**Step 3: Test auth route exists**

```bash
curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/auth/login
```

Expected: `200` or `302`

**Step 4: Test protected route redirects**

```bash
curl -sf -o /dev/null -w "%{http_code}" http://localhost:3000/founder/dashboard
```

Expected: `302` (redirect to login)

**Step 5: Run smoke tests**

```bash
bash .claude/scripts/smoke-test.sh
```

Expected: at minimum 8/12 passing locally (SSL test and Supabase test will fail without creds — acceptable)

**Step 6: Stop dev server**

```bash
kill $DEV_PID 2>/dev/null || pkill -f "next dev" 2>/dev/null || true
```

---

### Task 15: Push rebuild branch to remote

> **HIGH RISK — this pushes to remote. Verify git log looks clean first.**

**Step 1: Review all commits on the rebuild branch**

```bash
git log --oneline main..rebuild/nexus-2.0
```

Expected: ~14 commits, all with clean descriptive messages

**Step 2: Confirm no sensitive data was committed**

```bash
git log --oneline main..rebuild/nexus-2.0 -p | grep -i "sk-ant\|service_role\|placeholder-key" || echo "CLEAN — no secrets found"
```

Expected: `CLEAN — no secrets found`

**Step 3: Push to remote**

```bash
git push -u origin rebuild/nexus-2.0
```

Expected: branch pushed, Vercel preview deployment triggered (check Vercel dashboard)

**Step 4: Report final state**

```bash
git log --oneline main..rebuild/nexus-2.0 | wc -l
echo "commits on rebuild branch"
find src/ -type f | wc -l
echo "files in src/ skeleton"
find supabase/migrations -maxdepth 1 -name "*.sql" | wc -l
echo "active migrations (should be 2)"
```

---

## Phase 2 Exit Criteria Checklist

Before marking Phase 2 complete, verify ALL of the following:

```
EXIT CRITERIA — Phase 2: Clean Foundation
==========================================

Branch:
☐ rebuild/nexus-2.0 exists and is pushed to remote

Security:
☐ placeholder-key removed from cost-monitor.ts
☐ 5 test route directories deleted
☐ git log shows no committed secrets

Skeleton:
☐ src/ contains only: middleware.ts, layout, globals.css, page, auth routes,
  supabase lib (4 files), shadcn/ui base, types/
☐ 524 root .md AI artefacts removed
☐ .gitignore prevents recurrence

Schema:
☐ supabase/migrations/ contains exactly 2 files:
  20260309000000_nexus_schema.sql
  20260309000001_rls_policies.sql
☐ _archive/ contains the 455 original migrations
☐ All 9 tables defined with correct columns
☐ RLS enabled + founder_id policies on all 9 tables

Build:
☐ pnpm turbo run type-check → 0 errors
☐ pnpm turbo run lint → 0 errors
☐ pnpm build → succeeds
☐ /api/health returns 200 + JSON

Infrastructure:
☐ .env.example updated with all required keys
☐ vercel.json clean
☐ .github/workflows/ci.yml created

QA:
☐ Auth route exists and returns 200/302
☐ Protected route /founder/dashboard redirects to login
☐ /api/health returns valid JSON

Sign-off: qa-tester ✅ [timestamp]
```

---

*Plan version: 1.0 | Written: 09/03/2026 | Phase 2: Clean Foundation*
*Effort estimate: 3–4 hours | Risk: HIGH (Task 5 skeleton strip, Task 15 remote push)*
