# Unite-Group Nexus 2.0 — Engineering Framework

> Reconciled from Linear status updates (08/03/2026).
> Single source of truth for all engineers and agents working on Nexus 2.0.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| **Product** | Unite-Group Nexus 2.0 |
| **Type** | Private founder CRM — NOT a public SaaS |
| **User** | Phill McGurk (single tenant, Brisbane AU) |
| **Branch** | `rebuild/nexus-2.0` → merges to `main` |
| **Locale** | en-AU — DD/MM/YYYY \| AUD \| AEST/AEDT |

---

## 2. Technology Stack

### Frontend
| Technology | Version | Notes |
|------------|---------|-------|
| Next.js | 16 (App Router) | `src/` root layout — no `pages/` dir |
| React | 19 | Server Components + Client Components |
| TypeScript | 5.x strict | `strict: true`, `noUncheckedIndexedAccess: true` |
| Tailwind CSS | 3.x | Scientific Luxury design tokens |
| Framer Motion | latest | Animation ONLY — no CSS transitions on interactive elements |
| shadcn/ui | latest | Base component library in `src/components/ui/` |

### Backend
| Technology | Version | Notes |
|------------|---------|-------|
| Supabase | latest | PostgreSQL + Auth + Storage + Realtime |
| FastAPI | latest | `apps/backend/src/api/main:app` |
| Python | 3.12+ | `uv` package manager in `apps/backend/` |
| LangGraph | latest | AI agent graphs in `apps/backend/src/` |

### Infrastructure
| Technology | Notes |
|------------|-------|
| Vercel | Frontend deployment + preview URLs |
| pnpm 9.15.0 | Package manager (never npm/yarn) |
| Turbo | Monorepo task runner |
| Docker | Local PostgreSQL + Redis via `docker-compose.yml` |
| GitHub Actions | CI pipeline — `.github/workflows/ci.yml` |

---

## 3. Core Modules (Nexus 2.0 — 9 Tables)

These are the ONLY modules in Nexus 2.0. Do not reference v1 module names.

| Module | Table | Purpose |
|--------|-------|---------|
| **Businesses** | `businesses` | Client/company records |
| **Contacts** | `contacts` | People attached to businesses |
| **Pages** | `nexus_pages` | Notion-style rich content pages |
| **Databases** | `nexus_databases` + `nexus_rows` | Structured data tables (Notion-style) |
| **Vault** | `credentials_vault` | AES-256-GCM encrypted OAuth/API credentials |
| **Approvals** | `approval_queue` | Pending actions requiring Phill's sign-off |
| **Social** | `social_channels` | Connected social accounts (via Publer) |
| **Projects** | `connected_projects` | Linked GitHub repos, Linear projects |

---

## 4. Architecture Layers

```
Frontend:   Components → Hooks → API Routes → Services
Backend:    API → Agents → Tools → Graphs → State
Database:   Tables → Functions → Triggers → RLS
```

**Rule**: No cross-layer imports. Each layer imports only from the layer directly below.

### Route Structure (App Router)

```
src/app/
├── (auth)/               ← Auth pages (login, register, onboarding, forgot-password)
│   └── auth/login/
├── founder/              ← Protected routes (middleware-gated)
│   ├── dashboard/
│   ├── businesses/
│   ├── contacts/
│   └── ...
└── api/
    ├── health/           ← GET /api/health
    ├── businesses/       ← CRUD for businesses
    ├── contacts/         ← CRUD for contacts
    └── ...
```

---

## 5. Authentication — Single-Tenant PKCE

Nexus 2.0 is **single-tenant**. There is exactly one founder. All data belongs to `auth.uid()`.

```typescript
// ALWAYS — get the authenticated user first
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// ALWAYS — filter every query by founder_id
const { data } = await supabase
  .from('businesses')
  .select('*')
  .eq('founder_id', user.id);    // ← Non-negotiable on every query

// NEVER — do not use workspace_id, org_id, or multi-tenant patterns
```

### Middleware Protection

`src/middleware.ts` enforces PKCE auth on all `/founder/*` routes:
- Unauthenticated → redirect to `/auth/login`
- Authenticated → pass through

### Server-Side Client

```typescript
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// In Server Components and API Route Handlers:
const cookieStore = await cookies();
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { cookies: { getAll: () => cookieStore.getAll(), setAll: (...) } }
);
```

---

## 6. Database Rules

### RLS Policies

Every table has RLS enabled. Every policy uses `founder_id = auth.uid()`:

```sql
-- Pattern applied to all 9 tables
CREATE POLICY "founder_select" ON businesses
  FOR SELECT USING (founder_id = auth.uid());

CREATE POLICY "founder_insert" ON businesses
  FOR INSERT WITH CHECK (founder_id = auth.uid());

CREATE POLICY "founder_update" ON businesses
  FOR UPDATE USING (founder_id = auth.uid());

CREATE POLICY "founder_delete" ON businesses
  FOR DELETE USING (founder_id = auth.uid());
```

### Migration Naming

```
supabase/migrations/
├── _archive/                     ← 417 v1 migrations (DO NOT REPLAY)
├── 20260309000000_nexus_schema.sql
└── 20260309000001_rls_policies.sql
```

**Format**: `YYYYMMDDNNNNNN_description.sql` (timestamp-based — prevents duplicate sequence collisions).

---

## 7. Design System — Scientific Luxury

```css
/* Colour Tokens */
--color-bg:          #050505;   /* OLED Black — background */
--color-accent:      #00F5FF;   /* Cyan — interactive, accent */
--color-surface:     #0A0A0A;   /* Slightly lifted surface */
--color-border:      #1A1A1A;   /* Subtle borders */
--color-text:        #E5E5E5;   /* Primary text */
--color-text-muted:  #6B7280;   /* Muted/secondary text */

/* Border Radius — ONLY rounded-sm */
border-radius: 2px;   /* rounded-sm — the only permitted radius */

/* Approved Easing Functions */
--ease-spring:   cubic-bezier(0.68, -0.55, 0.265, 1.55);
--ease-smooth:   cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce:   cubic-bezier(0.34, 1.56, 0.64, 1);
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1);
```

**Rules:**
- `rounded-sm` only — never `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`
- Framer Motion only for animations — never `transition-*` Tailwind classes on interactive elements
- OLED Black background on all pages — no white or light backgrounds

---

## 8. Coding Standards

### TypeScript

```typescript
// ✅ Non-null assertion for guaranteed-at-runtime values
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

// ✅ Typed responses
interface BusinessResponse {
  id: string;
  name: string;
  founder_id: string;
  created_at: string;
}

// ❌ Never use `any`
const data: any = response;   // forbidden — use proper types

// ❌ Never use optional chaining to mask missing env vars
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'placeholder';  // forbidden
```

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| React components | `PascalCase.tsx` | `BusinessCard.tsx` |
| Utilities | `kebab-case.ts` | `format-currency.ts` |
| Hooks | `use-kebab-case.ts` | `use-businesses.ts` |
| API routes | `route.ts` (Next.js convention) | `route.ts` |
| Python modules | `snake_case.py` | `business_service.py` |
| Agent/skill docs | `SCREAMING-KEBAB.md` | `AGENT-PROTOCOL.md` |

### Commit Format

```bash
<type>(<scope>): <description>

feat(web): add business detail page
fix(api): resolve founder_id filter missing on contacts route
docs(agents): update AGENT-PROTOCOL.md with reflection loop
chore(ci): add type-check to PR gate
```

Types: `feat`, `fix`, `docs`, `chore`, `test`, `refactor`, `perf`

---

## 9. Development Workflow

```bash
# Start all services
pnpm dev

# Frontend only
pnpm dev --filter=web

# Backend only
cd apps/backend && uv run uvicorn src.api.main:app --reload

# Database (Docker)
pnpm run docker:up     # Start PostgreSQL + Redis
pnpm run docker:reset  # Reset database (destructive)

# Tests
pnpm exec vitest run          # Unit tests
pnpm exec vitest run --watch  # Watch mode
pnpm playwright test          # E2E tests

# Quality checks (run before every commit)
pnpm turbo run type-check lint
pnpm build
```

### Pre-Commit Gate

```bash
pnpm turbo run type-check lint && pnpm exec vitest run && pnpm build && echo "✅ Ready to commit"
```

### Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production ready — protected |
| `rebuild/nexus-2.0` | Active rebuild — current working branch |
| `feature/<name>` | New features |
| `fix/<name>` | Bug fixes |

---

## 10. Environment Variables

See `.env.example` for the full 44-variable reference. Key groups:

| Group | Variables | Purpose |
|-------|-----------|---------|
| **Supabase** | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Database + Auth |
| **Anthropic** | `ANTHROPIC_API_KEY` | Claude AI integration |
| **Xero** | `XERO_CLIENT_ID`, `XERO_CLIENT_SECRET` | Accounting integration |
| **Google** | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | Gmail + Calendar OAuth |
| **Linear** | `LINEAR_API_KEY`, `LINEAR_WEBHOOK_SECRET` | Project management |
| **Stripe** | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Per-business payment processing |
| **Publer** | `PUBLER_API_KEY` | Social media scheduling |
| **Vault** | `VAULT_MASTER_KEY_SALT` | AES-256-GCM credential encryption |

**Rules:**
- Never commit `.env` files (only `.env.example`)
- Never add `|| 'placeholder'` fallbacks — use `!` assertions
- All secrets rotate via Vercel Environment Variables panel

---

## 11. Agent Routing (Quick Reference)

For full agent protocol, see `.claude/docs/AGENT-PROTOCOL.md`.

| Task | Agent |
|------|-------|
| Planning, specs, Linear issues | `project-manager` |
| Next.js, Supabase, API routes | `senior-fullstack` |
| Schema, migrations, RLS | `database-architect` |
| UI components, layouts | `frontend-designer` |
| Xero, Gmail, Linear, Stripe integrations | `api-integrations` |
| Code review, security audit | `code-auditor` |
| Vercel, CI/CD, env config | `devops-engineer` |
| E2E tests, smoke tests | `qa-tester` |

---

## 12. Key File Locations

```
C:\Unite-Group\
├── src/                           ← Next.js App Router root
│   ├── app/                       ← Routes and pages
│   ├── components/ui/             ← shadcn/ui base components (44 files)
│   ├── hooks/                     ← React hooks
│   ├── lib/supabase/              ← Supabase client (server, client, middleware)
│   └── middleware.ts              ← PKCE auth middleware
├── apps/backend/                  ← FastAPI + LangGraph
├── supabase/migrations/           ← Database migrations (timestamp format)
├── e2e/                           ← Playwright E2E tests
├── .claude/agents/                ← 31 agent definitions
├── .claude/docs/                  ← Architecture docs
│   ├── AGENT-PROTOCOL.md          ← Agent operating rules
│   ├── testing-protocol.md        ← Autonomous testing protocol
│   └── ROADMAP.md                 ← 6-phase rebuild roadmap
├── .github/workflows/ci.yml       ← CI pipeline
├── vitest.config.mts              ← Vitest unit test config
├── playwright.config.ts           ← Playwright E2E config
└── ENGINEERING-FRAMEWORK.md       ← This file
```
