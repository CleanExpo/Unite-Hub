# TOOLS Registry — Unite-Group Nexus 2.0
> Full registry of every tool, library, and service in the project.
> Human-maintained. Agents read this; they do not modify it.

---

## Frontend

| Tool | Version | Purpose | Key Location |
|------|---------|---------|--------------|
| Next.js | 16 (App Router) | Full-stack React framework, file-based routing, API routes, server components | `src/app/`, `next.config.mjs` |
| React | 19 | UI component model | `src/components/` |
| Tailwind CSS | v4 | Utility-first CSS. `rounded-sm` only. Design tokens in globals. | `src/app/globals.css`, `tailwind.config.ts` |
| Framer Motion | latest | Animation only. Never mix with dnd-kit on sortable items. | `src/components/founder/` |
| cmdk | latest | Command palette primitives. Extended with `shouldFilter` prop for API search. | `src/components/ui/command.tsx`, `src/components/layout/CommandBar.tsx` |
| dnd-kit | latest | Drag-and-drop for Kanban board. NOT Framer Motion (transform conflict). | `src/components/founder/kanban/` |
| Novel | 1.0.2 | Block editor. API: `EditorRoot + EditorContent` (NOT `{ Editor }`). | `src/components/founder/editor/NovelEditor.tsx` |
| Zustand | latest | UI state store — sidebar collapse, business selection, theme. | `src/lib/store.ts` |
| Radix UI | latest | Headless accessible component primitives | `src/components/ui/` |

---

## Backend / Infrastructure

| Tool | Version | Purpose | Key Location |
|------|---------|---------|--------------|
| Supabase Auth | latest | Supabase PKCE server-side auth. Single-tenant. | `src/lib/supabase/`, `src/middleware.ts` |
| Supabase Database | PostgreSQL | Primary database, RLS enforced. `founder_id = auth.uid()`. | `supabase/migrations/` |
| Supabase Realtime | latest | Server publishes via service client; browser subscribes via `createBrowserClient`. Used in MACAS debate streaming. | `src/lib/advisory/debate-engine.ts` |
| Supabase Storage | latest | File/document storage (Phase 5 Files API integration pending) | — |
| Vercel | latest | Hosting, edge functions, cron jobs, analytics | `vercel.json` |
| Vercel Analytics | latest | Page view and performance monitoring | `src/app/layout.tsx` |

**Supabase client files**:
- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `src/lib/supabase/server.ts` — server client (`createServerClient`)
- `src/lib/supabase/middleware.ts` — PKCE session refresh

---

## AI / Anthropic

| Tool | Version | Purpose | Key Location |
|------|---------|---------|--------------|
| Anthropic SDK | latest | TypeScript client for Claude API | `src/lib/advisory/agents.ts`, various |
| Claude Opus 4.6 | — | MACAS Judge, high-stakes reasoning | `src/lib/advisory/agents.ts` |
| Claude Sonnet 4.6 | — | MACAS firm debates, balanced cost/quality | `src/lib/advisory/agents.ts` |
| Claude Haiku 3 | — | Fast low-cost tasks | — |

**MACAS patterns**:
- `Promise.allSettled` for parallel firm calls (partial results if one firm fails, min 2 required)
- Exponential backoff: 1s / 2s / 4s; Zod/JSON parse errors NOT retried
- Service client used in debate engine to bypass RLS; `founder_id` written explicitly

---

## Dev Tooling

| Tool | Version | Purpose | Key Location |
|------|---------|---------|--------------|
| pnpm | 9.15.0 | Package manager, workspace management | `pnpm-workspace.yaml`, `package.json` |
| Turbo | latest | Monorepo build orchestration, task pipeline | `turbo.json` |
| TypeScript | latest | Type safety. 1,176 legacy `any` usages eliminated during rebuild. | `tsconfig.json` |
| Vitest | latest | Unit testing. Fake timers for setTimeout. Cross-worktree excluded via glob. | `vitest.config.ts`, `src/**/*.test.ts` |
| ESLint | latest | Linting. Flat config (`eslint.config.cjs`). Scoped to `src/**`. | `eslint.config.cjs` |
| Playwright | latest | E2E testing (Phase 6) | — |

**Key commands**:
```bash
pnpm dev --filter=web          # Frontend only
pnpm run type-check            # TypeScript check
pnpm run lint                  # ESLint (NOT turbo lint — turbo CLI not global)
pnpm vitest run                # Unit tests
pnpm turbo run type-check lint # Combined (via turbo)
```

---

## Integrations (Phase 4)

| Integration | Auth Method | Purpose | Key Location |
|-------------|------------|---------|--------------|
| Xero | OAuth2 | Accounting sync — invoices, BAS, journal entries | `src/app/api/xero/`, `src/lib/xero/` |
| Linear | API key / OAuth | Issue tracking, project management | `src/app/api/linear/` |
| Google Calendar | OAuth2 | Calendar events sync | `src/app/api/google/` |
| Gmail | OAuth2 | Email sync and read | `src/app/api/google/` |
| Stripe | Secret key | Payments (planned) | — |

**Xero pattern**: `xeroApiFetch()` helper wraps OAuth token refresh. Used in MACAS `/execute` route (Phase 6 journal entries + BAS updates).

---

## MCP Servers (in use)

| Server | Purpose |
|--------|---------|
| `veritas-kanban-mcp` | Kanban board integration (lockfile synced 86d18b8c) |
| Linear MCP | Linear issue management from Claude Code |

---

## Design Tokens (from `src/app/globals.css`)

```css
--background: #050505    /* OLED Black */
--foreground: #00F5FF    /* Cyan */
--ease-spring: cubic-bezier(0.68, -0.55, 0.265, 1.55)
--ease-smooth: cubic-bezier(0.4, 0, 0.2, 1)
--ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1)
--ease-out-expo: cubic-bezier(0.19, 1, 0.22, 1)
```
Only `rounded-sm`. No `rounded-lg` or `rounded-xl`. No linear transitions.
